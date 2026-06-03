import 'dart:io';
import 'dart:math' as math;
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:photo_manager/photo_manager.dart';

import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_tokens.dart';
import '../../session/session_state/swipe_session_provider.dart';
import '../gesture_engine/swipe_gesture_detector.dart';
import 'swipe_card.dart';

/// Swipe card stack — double-buffer layout with deck entry animation.
///
/// Performance contract (§11 non-negotiable):
/// - Background / deck cards are plain [StatelessWidget]s that do NOT listen
///   to the drag [ValueNotifier]. They rebuild only when [currentIndex] changes.
/// - Only the active card wraps a [ListenableBuilder] on [_drag], [_topAssetId],
///   and [_anim], so only it rebuilds during a pan gesture.
///
/// Card visual hierarchy (bottom → top):
/// - Deck cards (×3):  pure [AppColors.backgroundCard] shapes, rotated for depth
/// - Standby card:     full-size photo card, always visible behind the active card
/// - Active card:      gesture-driven; transparent while [_topAssetId] is null
/// - Gesture layer:    [Positioned.fill], always present, [HitTestBehavior.opaque]
class CardStackWidget extends ConsumerStatefulWidget {
  const CardStackWidget({super.key});

  @override
  ConsumerState<CardStackWidget> createState() => _CardStackWidgetState();
}

class _CardStackWidgetState extends ConsumerState<CardStackWidget>
    with TickerProviderStateMixin {
  /// Drives both the fly-off and snap-back animations.
  late final AnimationController _anim;

  /// Drives the deck entrance slide-up at session start.
  late final AnimationController _entryAnim;
  late final Animation<double> _entryProgress;

  /// Only the active card [ListenableBuilder] subscribes to this.
  final _drag = ValueNotifier<Offset>(Offset.zero);

  /// ID the top slot is authorised to render.
  /// null → transparent (transitioning); id → show bytes matching exactly.
  final _topAssetId = ValueNotifier<String?>(null);

  bool _topAssetInitialized = false;
  Offset _accumulated = Offset.zero;
  String _pendingDecision = '';

  /// Guards early-commit: true once [_commitAndReset] has been called for the
  /// current fly-off so the 92%-threshold listener cannot fire twice.
  bool _committed = false;

  /// True while a snap-back is running — suppresses the fly-off fade-out so
  /// the card stays fully opaque as it returns to centre.
  bool _isSnapBack = false;

  /// At most one gesture queued while a fly-off is running.
  /// Processed immediately after [_commitAndReset] completes.
  String? _queuedDecision; // 'keep' | 'trash' | 'later'

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(
      vsync: this,
      duration: AppTokens.cardSwipeDuration,
    );
    _entryAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );
    _entryProgress = CurvedAnimation(
      parent: _entryAnim,
      curve: Curves.easeOutBack,
    );
    // Play the entrance animation on the first frame after the widget is built.
    // CardStackWidget is only created when the session is ready, so this always
    // fires at the right moment.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _entryAnim.forward();
    });
  }

  @override
  void dispose() {
    _anim.dispose();
    _entryAnim.dispose();
    _drag.dispose();
    _topAssetId.dispose();
    super.dispose();
  }

  // ── Gesture callbacks ──────────────────────────────────────────────────────

  void _onDragUpdate(Offset delta) {
    _accumulated += delta;
    _drag.value = _accumulated;
  }

  void _onDragEnd(Offset velocityPxPerSec) {
    final size = MediaQuery.sizeOf(context);
    final dx = _accumulated.dx;
    final dy = _accumulated.dy;
    final vx = velocityPxPerSec.dx;
    final vy = velocityPxPerSec.dy;

    const velThreshold = AppTokens.swipeVelocityThreshold;
    final distThresholdH = size.width * AppTokens.swipeCommitThreshold;
    final distThresholdV = size.height * AppTokens.swipeUpThreshold;

    String? decision;
    if (dx > distThresholdH || vx > velThreshold) {
      decision = 'keep';
    } else if (dx < -distThresholdH || vx < -velThreshold) {
      decision = 'trash';
    } else if (dy < -distThresholdV || vy < -velThreshold) {
      decision = 'later';
    }

    if (_anim.isAnimating) {
      // A fly-off is running — queue the decision and consume the accumulated
      // delta so it does not bleed into the next card.
      if (decision != null) _queuedDecision = decision;
      _accumulated = Offset.zero;
      return;
    }

    if (decision != null) {
      _triggerSwipe(decision, size);
    } else {
      _snapBack();
    }
  }

  void _onDragCancel() {
    if (_anim.isAnimating) {
      _accumulated = Offset.zero;
      return;
    }
    _snapBack();
  }

  // ── Snap-back animation ───────────────────────────────────────────────────

  void _snapBack() {
    _isSnapBack = true;
    _anim.reset();
    final start = _drag.value;
    final snapAnim = Tween<Offset>(begin: start, end: Offset.zero).animate(
      CurvedAnimation(parent: _anim, curve: Curves.elasticOut),
    );

    late VoidCallback frameListener;
    late AnimationStatusListener statusListener;

    frameListener = () => _drag.value = snapAnim.value;
    statusListener = (status) {
      if (status == AnimationStatus.completed ||
          status == AnimationStatus.dismissed) {
        _anim.removeListener(frameListener);
        _anim.removeStatusListener(statusListener);
        _anim.reset();
        _accumulated = Offset.zero;
        _drag.value = Offset.zero;
        _isSnapBack = false;
      }
    };

    _anim.addListener(frameListener);
    _anim.addStatusListener(statusListener);
    _anim.forward();
  }

  // ── Fly-off animation → commit ────────────────────────────────────────────

  void _triggerSwipe(String decision, Size screenSize) {
    _isSnapBack = false;
    ref.read(swipeSessionProvider.notifier).lockForAnimation();
    _pendingDecision = decision;
    _committed = false;

    final targetX = switch (decision) {
      'keep'  => screenSize.width * 1.6,
      'trash' => -screenSize.width * 1.6,
      _       => 0.0,
    };
    final targetY = decision == 'later' ? -screenSize.height * 1.6 : 0.0;

    _anim.reset();
    final flyAnim = Tween<Offset>(
      begin: _drag.value,
      end: Offset(targetX, targetY),
    ).animate(CurvedAnimation(parent: _anim, curve: Curves.easeIn));

    late VoidCallback frameListener;

    frameListener = () {
      _drag.value = flyAnim.value;
      // At 92% the card is already off-screen visually. Commit early so the
      // standby card surfaces before the animation officially ends — eliminates
      // the residual flash at the tail of the fly-off.
      if (_anim.value >= 0.92 && !_committed) {
        _committed = true;
        _anim.removeListener(frameListener);
        _commitAndReset();
      }
    };

    _anim.addListener(frameListener);
    _anim.forward();
  }

  Future<void> _commitAndReset() async {
    _committed = false;
    final decision = _pendingDecision;

    // Suppress top slot — standby card behind shows through immediately.
    _topAssetId.value = null;

    // Reset drag so the incoming card enters at Offset.zero.
    _anim.reset();
    _accumulated = Offset.zero;
    _drag.value = Offset.zero;
    _pendingDecision = '';

    final index = ref.read(swipeSessionProvider).currentIndex;
    final notifier = ref.read(swipeSessionProvider.notifier);
    final asset = notifier.assetAt(index);
    if (asset == null) return;

    int sizeBytes = 0;
    try {
      final file = await asset.file;
      if (file != null) sizeBytes = await file.length();
    } on FileSystemException {
      // File inaccessible — size stays 0, HUD will not update for this asset.
    }

    await notifier.commitSwipe(
      assetId: asset.id,
      decision: decision,
      sizeInBytes: sizeBytes,
    );

    // Await bytes for the new top card before authorising the slot.
    // Zero cost when already cached (standby pre-rendered it).
    final newIndex = ref.read(swipeSessionProvider).currentIndex;
    final newAsset = notifier.assetAt(newIndex);
    if (newAsset != null) {
      await notifier.waitForBytes(newAsset.id);
    }
    _topAssetId.value = newAsset?.id;

    // Fire any gesture that arrived while the fly-off was running.
    if (_queuedDecision != null) {
      final queued = _queuedDecision!;
      _queuedDecision = null;
      _triggerSwipe(queued, MediaQuery.sizeOf(context));
    }
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final index = ref.watch(
      swipeSessionProvider.select((s) => s.currentIndex),
    );

    // When the index decreases (undo), the restored card's ID is no longer
    // in _topAssetId — immediately authorize it so the active slot renders.
    ref.listen<int>(
      swipeSessionProvider.select((s) => s.currentIndex),
      (prev, next) {
        if (prev != null && next < prev && mounted) {
          final asset =
              ref.read(swipeSessionProvider.notifier).assetAt(next);
          if (asset != null) _topAssetId.value = asset.id;
        }
      },
    );

    final notifier = ref.read(swipeSessionProvider.notifier);

    final top    = notifier.assetAt(index);
    final second = notifier.assetAt(index + 1);

    if (top == null) return const SizedBox.shrink();

    // One-time init: authorise the first top asset after the first frame.
    if (!_topAssetInitialized) {
      _topAssetInitialized = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _topAssetId.value = top.id;
      });
    }

    final screenSize = MediaQuery.sizeOf(context);
    final cardWidth  = screenSize.width - 48.0;
    final cardHeight = screenSize.height * 0.75;

    return AnimatedBuilder(
      animation: _entryProgress,
      builder: (_, child) => Transform.translate(
        offset: Offset(0, (1.0 - _entryProgress.value) * 200.0),
        child: child!,
      ),
      child: Center(
        child: SizedBox(
          width: cardWidth,
          height: cardHeight,
          child: Stack(
            fit: StackFit.expand,
            clipBehavior: Clip.none,
            children: [
              // ── Deck cards — colored shapes that peek below the active card.
              // Drawn deepest → shallowest (card 4 first, card 2 last).
              const _DeckCard(angle: -2 * math.pi / 180, translate: Offset(12, 16)),
              const _DeckCard(angle:  4 * math.pi / 180, translate: Offset( 4,  8)),
              const _DeckCard(angle: -6 * math.pi / 180, translate: Offset(-8,  0)),

              // ── Standby card — always visible (double-buffer flash fix) ───
              if (second != null)
                _BackgroundCard(
                  asset: second,
                  cachedBytes: notifier.getBytesSync(second.id),
                  screenSize: screenSize,
                ),

              // ── Active card — transparent when bytes not yet authorised ───
              ListenableBuilder(
                listenable: Listenable.merge([_drag, _topAssetId, _anim]),
                builder: (context, _) {
                  final bytes = top.id == _topAssetId.value
                      ? notifier.getBytesSync(top.id)
                      : null;
                  // Fade out over the last 20% of the fly-off only — not
                  // during snap-back (where the card must stay fully opaque).
                  final opacity = (_isSnapBack || _anim.value < 0.80)
                      ? 1.0
                      : (1.0 - (_anim.value - 0.80) / 0.20).clamp(0.0, 1.0);
                  return Opacity(
                    opacity: opacity,
                    child: SwipeCard(
                      asset: top,
                      cachedBytes: bytes,
                      dragOffset: _drag.value,
                      screenSize: screenSize,
                      isTop: true,
                    ),
                  );
                },
              ),

              // ── Gesture layer — always on top, HitTestBehavior.opaque ─────
              Positioned.fill(
                child: SwipeGestureDetector(
                  onDragUpdate: _onDragUpdate,
                  onDragEnd: _onDragEnd,
                  onDragCancel: _onDragCancel,
                  child: const SizedBox.expand(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Deck card (no photo) ──────────────────────────────────────────────────────

/// Pure decorative card shape — no photo, no preload cost.
/// Rotated and translated to peek below the active card.
class _DeckCard extends StatelessWidget {
  const _DeckCard({required this.angle, required this.translate});

  final double angle;
  final Offset translate;

  @override
  Widget build(BuildContext context) {
    return Transform.translate(
      offset: translate,
      child: Transform.rotate(
        angle: angle,
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.backgroundCard,
            borderRadius: BorderRadius.circular(AppTokens.radiusCard),
          ),
        ),
      ),
    );
  }
}

// ── Standby (background) card ─────────────────────────────────────────────────

/// Standby photo card — always rendered behind the active card.
/// Revealed instantly when the active card flies off, preventing any
/// visible gap between the old and new card.
class _BackgroundCard extends StatelessWidget {
  const _BackgroundCard({
    required this.asset,
    required this.cachedBytes,
    required this.screenSize,
  });

  final AssetEntity asset;
  final Uint8List? cachedBytes;
  final Size screenSize;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppTokens.radiusCard),
      child: SwipeCard(
        asset: asset,
        cachedBytes: cachedBytes,
        dragOffset: Offset.zero,
        screenSize: screenSize,
        isTop: false,
      ),
    );
  }
}
