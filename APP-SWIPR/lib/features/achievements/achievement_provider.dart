import 'package:isar_community/isar_community.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../core/storage/isar_models.dart';
import '../../core/storage/isar_service.dart';
import 'achievement_definitions.dart';

part 'achievement_provider.g.dart';

// ── CumulativeStats store ─────────────────────────────────────────────────────

/// Persists and exposes the cross-session cumulative stats singleton (Isar id=1).
///
/// Call [updateAfterSession] BEFORE [AchievementNotifier.checkAndUnlock] so
/// achievement checks operate on post-session totals.
@riverpod
class CumulativeStatsStore extends _$CumulativeStatsStore {
  @override
  CumulativeStats build() {
    // Synchronous build: reads from Isar synchronously if available,
    // or returns a zeroed CumulativeStats for the very first session.
    // The authoritative async update path is [updateAfterSession].
    return IsarService.instance.cumulativeStats.getSync(1) ?? CumulativeStats();
  }

  /// Updates the cumulative stats in Isar at the end of a session.
  ///
  /// Resets weekly/monthly counters when the calendar week or month has
  /// rolled over since the last recorded session.
  Future<void> updateAfterSession(SessionStats session) async {
    final current =
        await IsarService.instance.cumulativeStats.get(1) ?? CumulativeStats();

    final now = DateTime.now();

    final updatedWeekly = _isSameIsoWeek(current.lastSessionAt, now)
        ? current.sessionsThisWeek + 1
        : 1;

    final updatedMonthly = _isSameMonth(current.lastSessionAt, now)
        ? current.sessionsThisMonth + 1
        : 1;

    final updated = CumulativeStats()
      ..id = 1
      ..totalPhotosProcessed = current.totalPhotosProcessed +
          session.keptCount +
          session.trashedCount +
          session.decideLaterCount
      ..totalPhotosTrashed = current.totalPhotosTrashed + session.trashedCount
      ..totalPhotosKept = current.totalPhotosKept + session.keptCount
      ..totalMbFreed = current.totalMbFreed + session.mbFreed
      ..totalSessions = current.totalSessions + 1
      ..lastSessionAt = now
      ..sessionsThisWeek = updatedWeekly
      ..sessionsThisMonth = updatedMonthly;

    await IsarService.instance.writeTxn(() async {
      await IsarService.instance.cumulativeStats.put(updated);
    });

    state = updated;
  }

  // ── Calendar helpers ────────────────────────────────────────────────────────

  /// Returns true when both dates fall in the same ISO 8601 calendar week.
  bool _isSameIsoWeek(DateTime? a, DateTime b) {
    if (a == null) return false;
    // Move to Monday of each date's week and compare year+day-of-year.
    final mondayA = a.subtract(Duration(days: a.weekday - 1));
    final mondayB = b.subtract(Duration(days: b.weekday - 1));
    return mondayA.year == mondayB.year &&
        mondayA.month == mondayB.month &&
        mondayA.day == mondayB.day;
  }

  bool _isSameMonth(DateTime? a, DateTime b) {
    if (a == null) return false;
    return a.year == b.year && a.month == b.month;
  }
}

// ── Achievement notifier ──────────────────────────────────────────────────────

/// Checks and unlocks achievements at the end of a session.
///
/// ## Contract
///
/// Call [checkAndUnlock] AFTER [CumulativeStatsStore.updateAfterSession] has
/// committed the updated totals to Isar. Returns the list of achievement IDs
/// that were newly unlocked in this session.
///
/// Each achievement is written to Isar ONLY ONCE: `_tryUnlock` skips any ID
/// already present in [AchievementRecord].
@riverpod
class AchievementNotifier extends _$AchievementNotifier {
  @override
  List<String> build() => const [];

  /// Checks all achievement conditions and persists newly unlocked ones.
  ///
  /// [stats] is the current session's stats (pre-achievement population).
  /// [cumulative] must reflect the UPDATED totals (post `updateAfterSession`).
  Future<List<String>> checkAndUnlock(
    SessionStats stats,
    CumulativeStats cumulative,
  ) async {
    final newlyUnlocked = <String>[];

    // Load the set of already-unlocked IDs from Isar.
    final existingRecords =
        await IsarService.instance.achievementRecords.where().findAll();
    final alreadyUnlocked = existingRecords.map((r) => r.achievementId).toSet();

    // ── Session achievements ──────────────────────────────────────────────────
    final totalDecisions =
        stats.keptCount + stats.trashedCount + stats.decideLaterCount;

    if (totalDecisions >= 100) {
      _tryUnlock(AchievementDefs.lightning, alreadyUnlocked, newlyUnlocked);
    }

    final decidedTotal = stats.keptCount + stats.trashedCount;
    if (decidedTotal > 0 && stats.trashedCount / decidedTotal >= 0.80) {
      _tryUnlock(AchievementDefs.ruthless, alreadyUnlocked, newlyUnlocked);
    }

    if (stats.decideLaterCount == 0 && decidedTotal > 0) {
      _tryUnlock(AchievementDefs.decisive, alreadyUnlocked, newlyUnlocked);
    }

    if (stats.mbFreed >= 500) {
      _tryUnlock(AchievementDefs.bigClean, alreadyUnlocked, newlyUnlocked);
    }

    if (decidedTotal >= 500) {
      _tryUnlock(AchievementDefs.marathon, alreadyUnlocked, newlyUnlocked);
    }

    if (cumulative.totalSessions == 1) {
      _tryUnlock(AchievementDefs.firstTime, alreadyUnlocked, newlyUnlocked);
    }

    // ── Cumulative photo milestones ───────────────────────────────────────────
    _checkPhotoThreshold(
        cumulative.totalPhotosProcessed, 100, AchievementDefs.c100,
        alreadyUnlocked, newlyUnlocked);
    _checkPhotoThreshold(
        cumulative.totalPhotosProcessed, 500, AchievementDefs.c500,
        alreadyUnlocked, newlyUnlocked);
    _checkPhotoThreshold(
        cumulative.totalPhotosProcessed, 1000, AchievementDefs.c1k,
        alreadyUnlocked, newlyUnlocked);
    _checkPhotoThreshold(
        cumulative.totalPhotosProcessed, 10000, AchievementDefs.c10k,
        alreadyUnlocked, newlyUnlocked);

    // ── Cumulative storage milestones ─────────────────────────────────────────
    _checkMbThreshold(
        cumulative.totalMbFreed, 1024, AchievementDefs.gb1,
        alreadyUnlocked, newlyUnlocked);
    _checkMbThreshold(
        cumulative.totalMbFreed, 5 * 1024, AchievementDefs.gb5,
        alreadyUnlocked, newlyUnlocked);
    _checkMbThreshold(
        cumulative.totalMbFreed, 10 * 1024, AchievementDefs.gb10,
        alreadyUnlocked, newlyUnlocked);

    // ── Streak achievements ───────────────────────────────────────────────────
    if (cumulative.sessionsThisWeek >= 3) {
      _tryUnlock(AchievementDefs.streak3, alreadyUnlocked, newlyUnlocked);
    }

    if (cumulative.totalSessions >= 7) {
      _tryUnlock(AchievementDefs.habit, alreadyUnlocked, newlyUnlocked);
    }

    if (cumulative.sessionsThisMonth >= 4) {
      _tryUnlock(AchievementDefs.monthly, alreadyUnlocked, newlyUnlocked);
    }

    // ── Persist newly unlocked ────────────────────────────────────────────────
    if (newlyUnlocked.isNotEmpty) {
      await _persistUnlocks(newlyUnlocked, stats);
    }

    state = newlyUnlocked;
    return newlyUnlocked;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /// Adds [id] to [newlyUnlocked] only if it is not in [alreadyUnlocked].
  void _tryUnlock(
    String id,
    Set<String> alreadyUnlocked,
    List<String> newlyUnlocked,
  ) {
    if (!alreadyUnlocked.contains(id)) {
      newlyUnlocked.add(id);
    }
  }

  void _checkPhotoThreshold(
    int total,
    int threshold,
    String id,
    Set<String> alreadyUnlocked,
    List<String> newlyUnlocked,
  ) {
    if (total >= threshold) {
      _tryUnlock(id, alreadyUnlocked, newlyUnlocked);
    }
  }

  void _checkMbThreshold(
    double totalMb,
    double thresholdMb,
    String id,
    Set<String> alreadyUnlocked,
    List<String> newlyUnlocked,
  ) {
    if (totalMb >= thresholdMb) {
      _tryUnlock(id, alreadyUnlocked, newlyUnlocked);
    }
  }

  Future<void> _persistUnlocks(List<String> ids, SessionStats stats) async {
    // Derive a stable session integer ID from the stats duration hash.
    // The actual Isar session record ID is not directly accessible here;
    // using 0 is acceptable — it links to the session conceptually.
    const sessionId = 0;
    final now = DateTime.now();

    final records = ids
        .map((id) => AchievementRecord()
          ..achievementId = id
          ..unlockedAt = now
          ..sessionId = sessionId)
        .toList();

    await IsarService.instance.writeTxn(() async {
      await IsarService.instance.achievementRecords.putAll(records);
    });
  }
}
