import 'package:isar/isar.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/photo/cache_strategy.dart';
import '../../../core/performance/memory_budget.dart';
import '../../../core/performance/preload_engine.dart';
import '../../../core/photo/paging_controller.dart';
import '../../../core/photo/photo_repository.dart';
import '../../../core/storage/isar_models.dart';
import '../../../core/storage/isar_service.dart';
import '../../../router.dart';
import '../../../shared/theme/app_tokens.dart';
import '../../achievements/achievement_provider.dart';
import '../decide_later/decide_later_provider.dart';
import '../trash_queue/trash_queue_provider.dart';

part 'swipe_session_provider.g.dart';

// ── Phase enum ────────────────────────────────────────────────────────────────

/// Exhaustive set of swipe session phases.
///
/// No additional phases are permitted. All UI state must be derivable from
/// one of these values.
enum SwipeSessionPhase {
  loading,
  ready,
  swiping,

  /// Gesture input MUST be ignored while in this phase.
  /// [SwipeSessionState.isAnimating] is always true here.
  animating,

  paused,
  reviewDecideLater,
  reviewTrash,
  confirmDelete,
  processingDelete,
  smartReview,
  result,
}

// ── State model ───────────────────────────────────────────────────────────────

class SwipeSessionState {
  const SwipeSessionState({
    required this.phase,
    required this.currentIndex,
    required this.trashQueue,
    required this.decideLaterQueue,
    this.lastAction,
    this.undoAssetId,
    required this.isAnimating,
    required this.mbToBeFreed,
    required this.skippedCloudCount,
    required this.smartDetectionUsedThisSession,
    required this.filter,
  });

  final SwipeSessionPhase phase;
  final int currentIndex;

  /// Asset IDs queued for batch deletion. Mirrors [TrashQueueProvider].
  final List<String> trashQueue;

  /// Asset IDs deferred to decide-later review. Mirrors [DecideLaterProvider].
  final List<String> decideLaterQueue;

  /// Most recent swipe decision: 'keep' | 'trash' | 'later'. Null after undo.
  final String? lastAction;

  /// Asset ID eligible for undo. Only the most recent action can be undone.
  final String? undoAssetId;

  /// True while a card-fly-off animation is in progress.
  /// All gesture input must be blocked when this is true.
  final bool isAnimating;

  /// Running total of MB that will be freed when the trash queue is deleted.
  final double mbToBeFreed;

  final int skippedCloudCount;
  final int smartDetectionUsedThisSession;

  /// The filter that governs this session's asset source.
  final SwipeFilter filter;

  // ── Factories ──────────────────────────────────────────────────────────────

  factory SwipeSessionState.initial() => const SwipeSessionState(
        phase: SwipeSessionPhase.loading,
        currentIndex: 0,
        trashQueue: [],
        decideLaterQueue: [],
        isAnimating: false,
        mbToBeFreed: 0,
        skippedCloudCount: 0,
        smartDetectionUsedThisSession: 0,
        filter: SwipeFilter.entireLibrary(),
      );

  // ── copyWith ───────────────────────────────────────────────────────────────

  /// For nullable fields ([lastAction], [undoAssetId]), pass a wrapper
  /// function to override: `copyWith(lastAction: () => null)` clears to null;
  /// `copyWith(lastAction: () => 'keep')` sets to 'keep';
  /// omitting the parameter leaves the current value unchanged.
  SwipeSessionState copyWith({
    SwipeSessionPhase? phase,
    int? currentIndex,
    List<String>? trashQueue,
    List<String>? decideLaterQueue,
    String? Function()? lastAction,
    String? Function()? undoAssetId,
    bool? isAnimating,
    double? mbToBeFreed,
    int? skippedCloudCount,
    int? smartDetectionUsedThisSession,
    SwipeFilter? filter,
  }) =>
      SwipeSessionState(
        phase: phase ?? this.phase,
        currentIndex: currentIndex ?? this.currentIndex,
        trashQueue: trashQueue ?? this.trashQueue,
        decideLaterQueue: decideLaterQueue ?? this.decideLaterQueue,
        lastAction: lastAction != null ? lastAction() : this.lastAction,
        undoAssetId: undoAssetId != null ? undoAssetId() : this.undoAssetId,
        isAnimating: isAnimating ?? this.isAnimating,
        mbToBeFreed: mbToBeFreed ?? this.mbToBeFreed,
        skippedCloudCount: skippedCloudCount ?? this.skippedCloudCount,
        smartDetectionUsedThisSession: smartDetectionUsedThisSession ??
            this.smartDetectionUsedThisSession,
        filter: filter ?? this.filter,
      );
}

// ── Provider ──────────────────────────────────────────────────────────────────

@riverpod
class SwipeSession extends _$SwipeSession {
  // ── Private session infrastructure ────────────────────────────────────────
  // Created fresh by startSession() and reset between sessions.
  // Not part of observable state — implementation details of the loading layer.

  PhotoRepository? _repo;
  PagingController? _pager;
  LruCacheStrategy? _cache;
  PreloadEngine? _preloader;
  MemoryBudget? _budget;

  /// Full ordered deck for the current session, loaded incrementally.
  final _deck = <AssetEntity>[];

  /// Per-asset file sizes in bytes, populated on swipe commit.
  /// Used to compute [SwipeSessionState.mbToBeFreed].
  final _assetSizesBytes = <String, int>{};

  /// Isar ID of the active [SessionRecord]. Set once on [startSession].
  int? _sessionRecordId;

  /// Wall-clock time when the session started. Used for [SessionStats.sessionDuration].
  DateTime? _startedAt;

  // ── Riverpod build ─────────────────────────────────────────────────────────

  @override
  SwipeSessionState build() {
    ref.onDispose(_disposeSession);
    return SwipeSessionState.initial();
  }

  // ── Public API: session lifecycle ──────────────────────────────────────────

  /// Initialises all session infrastructure and transitions loading → ready.
  ///
  /// Must be called once before any swipe interactions, typically from
  /// [SwipePage.initState]. Safe to call again to restart with a new filter.
  Future<void> startSession(SwipeFilter filter) async {
    _disposeSession();
    _startedAt = DateTime.now();

    // Rebuild infrastructure for this session.
    _repo = PhotoRepository();
    _cache = LruCacheStrategy();
    _budget = MemoryBudget(cache: _cache!);
    _preloader = PreloadEngine(cache: _cache!);
    _pager = PagingController(repository: _repo!);

    state = SwipeSessionState.initial().copyWith(filter: filter);

    // Init paginator (builds master list for entireLibrary/albums modes).
    await _pager!.init(filter);

    // Open a SessionRecord in Isar for crash-recovery and stats.
    await IsarService.instance.writeTxn(() async {
      final record = SessionRecord()..startedAt = _startedAt!;
      _sessionRecordId =
          await IsarService.instance.sessionRecords.put(record);
    });

    // Load first deck page.
    final firstPage = await _pager!.getPage(0);
    _deck.addAll(firstPage);

    if (_deck.isEmpty) {
      // Empty library edge case — skip straight to result.
      await _transitionToResult();
      return;
    }

    state = state.copyWith(
      phase: SwipeSessionPhase.ready,
      filter: filter,
    );

    _preloader!.updateIndex(0, _deck);
  }

  // ── Public API: gesture flow ───────────────────────────────────────────────

  /// Transitions ready → swiping on the user's first gesture.
  void beginSwiping() {
    if (state.isAnimating) return;
    if (state.phase != SwipeSessionPhase.ready) return;
    state = state.copyWith(phase: SwipeSessionPhase.swiping);
  }

  /// Called when the swipe threshold is crossed (swiping → animating).
  ///
  /// Sets [SwipeSessionState.isAnimating] = true. All subsequent gesture
  /// input MUST be ignored by the UI until [commitSwipe] is called.
  void lockForAnimation() {
    if (state.isAnimating) return; // already locked
    if (state.phase != SwipeSessionPhase.swiping) return;
    state = state.copyWith(
      phase: SwipeSessionPhase.animating,
      isAnimating: true,
    );
  }

  /// Called when the card fly-off animation completes (animating → swiping).
  ///
  /// Writes [AssetDecisionRecord] to Isar BEFORE updating in-memory state.
  /// Isar is the source of truth — state only reflects a confirmed write.
  ///
  /// [decision]: 'keep' | 'trash' | 'later'
  /// [sizeInBytes]: file size of the asset, used for [mbToBeFreed] display.
  ///   Pass 0 if unknown — the HUD will simply not update for this asset.
  ///
  /// Silent no-op if not currently in [SwipeSessionPhase.animating].
  Future<void> commitSwipe({
    required String assetId,
    required String decision,
    required int sizeInBytes,
  }) async {
    // LOCK RULE: only valid in animating phase.
    if (!state.isAnimating) return;

    // ── 1. Write to Isar first — source of truth ───────────────────────────
    await IsarService.instance.writeTxn(() async {
      await IsarService.instance.assetDecisionRecords.put(
        AssetDecisionRecord()
          ..assetId = assetId
          ..decision = decision
          ..decidedAt = DateTime.now()
          ..sessionId = _sessionRecordId ?? 0
          ..smartFlags = []
          ..smartFlagReviewed = false,
      );
    });

    // ── 2. Update queue providers and local mirrors ────────────────────────
    final newTrash = List<String>.from(state.trashQueue);
    final newLater = List<String>.from(state.decideLaterQueue);
    var newMb = state.mbToBeFreed;

    switch (decision) {
      case 'trash':
        newTrash.add(assetId);
        _assetSizesBytes[assetId] = sizeInBytes;
        newMb += sizeInBytes / (1024 * 1024);
        ref.read(trashQueueProvider.notifier).add(assetId);
      case 'later':
        newLater.add(assetId);
        ref.read(decideLaterProvider.notifier).add(assetId);
      // 'keep': no queue update needed
    }

    // ── 3. Advance index and unlock gestures ───────────────────────────────
    final newIndex = state.currentIndex + 1;
    state = state.copyWith(
      phase: SwipeSessionPhase.swiping,
      isAnimating: false,
      currentIndex: newIndex,
      trashQueue: newTrash,
      decideLaterQueue: newLater,
      lastAction: () => decision,
      undoAssetId: () => assetId,
      mbToBeFreed: newMb,
    );

    // ── 4. Preload and pagination ──────────────────────────────────────────
    _preloader?.updateIndex(newIndex, _deck);
    _loadMoreIfNeeded(newIndex).ignore();

    // ── 5. Check deck exhaustion ───────────────────────────────────────────
    if (newIndex >= _deck.length) {
      await _handleDeckExhausted();
    }
  }

  /// Skips an iCloud-only asset without recording a decision.
  ///
  /// Called when [AssetEntity.isLocallyAvailable] is false. The asset is
  /// not shown to the user and not written to Isar.
  Future<void> skipCloudAsset(String assetId) async {
    if (state.isAnimating) return;

    final newIndex = state.currentIndex + 1;
    state = state.copyWith(
      currentIndex: newIndex,
      skippedCloudCount: state.skippedCloudCount + 1,
    );

    _preloader?.updateIndex(newIndex, _deck);
    _loadMoreIfNeeded(newIndex).ignore();

    if (newIndex >= _deck.length) {
      await _handleDeckExhausted();
    }
  }

  // ── Public API: undo ───────────────────────────────────────────────────────

  /// Reverses the most recent single swipe action.
  ///
  /// Only one level of undo is supported. Silently no-ops if there is no
  /// undoable action or if an animation is in progress.
  Future<void> undoLastSwipe() async {
    if (state.isAnimating) return;
    final undoId = state.undoAssetId;
    final lastAction = state.lastAction;
    if (undoId == null || lastAction == null) return;
    if (state.currentIndex <= 0) return;

    // Delete decision from Isar.
    await IsarService.instance.writeTxn(() async {
      final existing = await IsarService.instance.assetDecisionRecords
          .filter()
          .assetIdEqualTo(undoId)
          .findFirst();
      if (existing != null) {
        await IsarService.instance.assetDecisionRecords.delete(existing.id);
      }
    });

    // Reverse queue mirrors.
    final newTrash = List<String>.from(state.trashQueue);
    final newLater = List<String>.from(state.decideLaterQueue);
    var newMb = state.mbToBeFreed;

    switch (lastAction) {
      case 'trash':
        newTrash.remove(undoId);
        final removedBytes = _assetSizesBytes.remove(undoId) ?? 0;
        newMb = (newMb - removedBytes / (1024 * 1024)).clamp(0, double.infinity);
        ref.read(trashQueueProvider.notifier).remove(undoId);
      case 'later':
        newLater.remove(undoId);
        ref.read(decideLaterProvider.notifier).remove(undoId);
    }

    final prevIndex = state.currentIndex - 1;
    state = state.copyWith(
      currentIndex: prevIndex,
      trashQueue: newTrash,
      decideLaterQueue: newLater,
      lastAction: () => null,
      undoAssetId: () => null,
      mbToBeFreed: newMb,
    );

    _preloader?.updateIndex(prevIndex, _deck);
  }

  // ── Public API: pause / resume ─────────────────────────────────────────────

  void pauseSession() {
    if (state.isAnimating) return;
    if (state.phase != SwipeSessionPhase.swiping) return;
    state = state.copyWith(phase: SwipeSessionPhase.paused);
  }

  void resumeSession() {
    if (state.phase != SwipeSessionPhase.paused) return;
    state = state.copyWith(phase: SwipeSessionPhase.swiping);
  }

  // ── Public API: review flow ────────────────────────────────────────────────

  /// Transitions reviewDecideLater → reviewTrash.
  /// If the trash queue is empty, proceeds directly to result.
  Future<void> finishDecideLaterReview() async {
    if (state.phase != SwipeSessionPhase.reviewDecideLater) return;
    if (state.trashQueue.isNotEmpty) {
      state = state.copyWith(phase: SwipeSessionPhase.reviewTrash);
    } else {
      await _transitionToResult();
    }
  }

  /// reviewTrash → confirmDelete.
  void requestBatchDelete() {
    if (state.phase != SwipeSessionPhase.reviewTrash) return;
    state = state.copyWith(phase: SwipeSessionPhase.confirmDelete);
  }

  /// confirmDelete → reviewTrash (user dismissed the system dialog).
  void cancelBatchDelete() {
    if (state.phase != SwipeSessionPhase.confirmDelete) return;
    state = state.copyWith(phase: SwipeSessionPhase.reviewTrash);
  }

  /// confirmDelete → processingDelete (user confirmed the system dialog).
  ///
  /// The actual [PhotoManager.editor.deleteWithIds] call is made by the UI
  /// layer (SwipePage), which then calls [onDeleteComplete] with the result.
  void confirmBatchDelete() {
    if (state.phase != SwipeSessionPhase.confirmDelete) return;
    state = state.copyWith(phase: SwipeSessionPhase.processingDelete);
  }

  /// Called by the UI layer after batch deletion finishes.
  ///
  /// processingDelete → smartReview  (if [hasSmartFlags] == true)
  /// processingDelete → result       (otherwise)
  ///
  /// Persists final session stats to the open [SessionRecord] in Isar before
  /// transitioning.
  Future<void> onDeleteComplete({bool hasSmartFlags = false}) async {
    if (state.phase != SwipeSessionPhase.processingDelete) return;

    await _finaliseSessionRecord();

    if (hasSmartFlags) {
      state = state.copyWith(phase: SwipeSessionPhase.smartReview);
    } else {
      await _transitionToResult();
    }
  }

  /// smartReview → result.
  Future<void> finishSmartReview() async {
    if (state.phase != SwipeSessionPhase.smartReview) return;
    await _transitionToResult();
  }

  // ── Private: deck management ───────────────────────────────────────────────

  Future<void> _loadMoreIfNeeded(int currentIndex) async {
    if (_pager == null) return;
    final remaining = _deck.length - currentIndex;
    if (remaining <= AppTokens.preloadAhead) {
      final nextPageIndex = (_deck.length / 50).floor();
      final newAssets = await _pager!.getPage(nextPageIndex);
      if (newAssets.isNotEmpty) {
        _deck.addAll(newAssets);
      }
    }
  }

  Future<void> _handleDeckExhausted() async {
    if (state.decideLaterQueue.isNotEmpty) {
      state = state.copyWith(phase: SwipeSessionPhase.reviewDecideLater);
    } else if (state.trashQueue.isNotEmpty) {
      state = state.copyWith(phase: SwipeSessionPhase.reviewTrash);
    } else {
      await _transitionToResult();
    }
  }

  // ── Private: result transition ────────────────────────────────────────────

  /// Orchestrates the non-negotiable transition sequence to [result] phase.
  ///
  /// Order (§10, §19 of CONSTRUCTION — must never change):
  ///   a. CumulativeStatsProvider.updateAfterSession(stats)
  ///   b. AchievementProvider.checkAndUnlock(stats, updatedCumulative)
  ///   c. Navigate to Routes.recap with SessionStats (incl. unlockedAchievementIds)
  ///
  /// Steps a and b are commented out until those providers are built in
  /// steps 8 and 9 respectively. The structure and ORDER are already correct.
  Future<void> _transitionToResult() async {
    final now = DateTime.now();
    final duration = _startedAt != null ? now.difference(_startedAt!) : Duration.zero;
    final keptCount = (state.currentIndex
            - state.trashQueue.length
            - state.decideLaterQueue.length
            - state.skippedCloudCount)
        .clamp(0, state.currentIndex);

    // Build the base SessionStats for this session.
    final stats = SessionStats(
      keptCount: keptCount,
      trashedCount: state.trashQueue.length,
      decideLaterCount: state.decideLaterQueue.length,
      mbFreed: state.mbToBeFreed,
      sessionDuration: duration,
      skippedCloudCount: state.skippedCloudCount,
      smartFlaggedCount: state.smartDetectionUsedThisSession,
      unlockedAchievementIds: const [], // populated in step b
    );

    // ── Step a ────────────────────────────────────────────────────────────
    // Update cumulative stats BEFORE checking achievements so the
    // achievement check operates on the post-session totals.
    await ref.read(cumulativeStatsStoreProvider.notifier).updateAfterSession(stats);
    final updatedCumulative = ref.read(cumulativeStatsStoreProvider);

    // ── Step b ────────────────────────────────────────────────────────────
    // Check and unlock achievements using the updated cumulative data.
    final unlockedIds = await ref
        .read(achievementNotifierProvider.notifier)
        .checkAndUnlock(stats, updatedCumulative);

    final statsWithAchievements = SessionStats(
      keptCount: stats.keptCount,
      trashedCount: stats.trashedCount,
      decideLaterCount: stats.decideLaterCount,
      mbFreed: stats.mbFreed,
      sessionDuration: stats.sessionDuration,
      skippedCloudCount: stats.skippedCloudCount,
      smartFlaggedCount: stats.smartFlaggedCount,
      unlockedAchievementIds: unlockedIds,
    );

    // ── Step c ────────────────────────────────────────────────────────────
    // Navigate to RecapPage with the fully-populated SessionStats.
    ref.read(routerProvider).go(Routes.recap, extra: statsWithAchievements);

    state = state.copyWith(phase: SwipeSessionPhase.result);
  }

  // ── Private: Isar helpers ─────────────────────────────────────────────────

  Future<void> _finaliseSessionRecord() async {
    final id = _sessionRecordId;
    if (id == null) return;
    await IsarService.instance.writeTxn(() async {
      final record =
          await IsarService.instance.sessionRecords.get(id);
      if (record == null) return;
      record
        ..endedAt = DateTime.now()
        ..keptCount = (state.currentIndex
                - state.trashQueue.length
                - state.decideLaterQueue.length
                - state.skippedCloudCount)
            .clamp(0, state.currentIndex)
        ..trashedCount = state.trashQueue.length
        ..decideLaterCount = state.decideLaterQueue.length
        ..mbFreed = state.mbToBeFreed
        ..skippedCloudCount = state.skippedCloudCount
        ..smartFlaggedCount = state.smartDetectionUsedThisSession;
      await IsarService.instance.sessionRecords.put(record);
    });
  }

  // ── Public: deck access (used by CardStackWidget) ────────────────────────

  /// Returns the [AssetEntity] at absolute deck [index], or null if out of
  /// range. Used by [CardStackWidget] to resolve which assets to display
  /// without exposing the full deck list.
  AssetEntity? assetAt(int index) {
    if (index < 0 || index >= _deck.length) return null;
    return _deck[index];
  }

  // ── Private: cleanup ──────────────────────────────────────────────────────

  void _disposeSession() {
    _preloader?.reset();
    _deck.clear();
    _assetSizesBytes.clear();
    _sessionRecordId = null;
    _startedAt = null;
    _repo = null;
    _pager = null;
    _cache = null;
    _preloader = null;
    _budget = null;
  }
}

// ── Derived provider ──────────────────────────────────────────────────────────

/// Computed [SessionStats] from the current [SwipeSessionState].
///
/// Re-computes on every state change. Use for live HUD values during swiping
/// and for passing to RecapPage (until step-6 wires the router).
@riverpod
SessionStats sessionStats(SessionStatsRef ref) {
  final s = ref.watch(swipeSessionProvider);
  final keptCount = (s.currentIndex
          - s.trashQueue.length
          - s.decideLaterQueue.length
          - s.skippedCloudCount)
      .clamp(0, s.currentIndex);

  return SessionStats(
    keptCount: keptCount,
    trashedCount: s.trashQueue.length,
    decideLaterCount: s.decideLaterQueue.length,
    mbFreed: s.mbToBeFreed,
    sessionDuration: Duration.zero, // live duration not tracked here
    skippedCloudCount: s.skippedCloudCount,
    smartFlaggedCount: s.smartDetectionUsedThisSession,
    unlockedAchievementIds: const [],
  );
}
