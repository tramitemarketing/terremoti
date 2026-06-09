import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../core/storage/hive_boxes.dart';
import '../../core/storage/hive_models.dart';
import '../../core/storage/isar_models.dart';
import 'achievement_definitions.dart';

part 'achievement_provider.g.dart';

// ── CumulativeStats store ─────────────────────────────────────────────────────

/// Persists and exposes the cross-session cumulative stats singleton (key 0).
///
/// Call [updateAfterSession] BEFORE [AchievementNotifier.checkAndUnlock] so
/// achievement checks operate on post-session totals.
@Riverpod(keepAlive: true)
class CumulativeStatsStore extends _$CumulativeStatsStore {
  @override
  CumulativeStats build() {
    // Synchronous — HiveService.loadCumulativeStats() reads Box.get(0) which
    // is sync. Returns zero-init CumulativeStats on first launch.
    return HiveBoxes.cumulativeStats.get(0) ?? CumulativeStats();
  }

  /// Updates cumulative stats at the end of a session.
  ///
  /// Resets weekly/monthly counters when the calendar week or month has
  /// rolled over since the last recorded session.
  Future<void> updateAfterSession(SessionStats session) async {
    final current = HiveBoxes.cumulativeStats.get(0) ?? CumulativeStats();
    final now = DateTime.now();

    final updatedWeekly = _isSameIsoWeek(current.lastSessionAt, now)
        ? current.sessionsThisWeek + 1
        : 1;

    final updatedMonthly = _isSameMonth(current.lastSessionAt, now)
        ? current.sessionsThisMonth + 1
        : 1;

    final updated = CumulativeStats()
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

    await HiveBoxes.cumulativeStats.put(0, updated);
    state = updated;
  }

  // ── Calendar helpers ────────────────────────────────────────────────────────

  /// Returns true when both dates fall in the same ISO 8601 calendar week.
  bool _isSameIsoWeek(DateTime? a, DateTime b) {
    if (a == null) return false;
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
/// Call [checkAndUnlock] AFTER [CumulativeStatsStore.updateAfterSession].
/// Each achievement is written ONLY ONCE: [_tryUnlock] uses
/// [HiveService.hasAchievement] (O(1) containsKey) to skip re-unlocking.
@Riverpod(keepAlive: true)
class AchievementNotifier extends _$AchievementNotifier {
  @override
  List<String> build() => const [];

  Future<List<String>> checkAndUnlock(
    SessionStats stats,
    CumulativeStats cumulative,
  ) async {
    final newlyUnlocked = <String>[];

    // ── Session achievements ──────────────────────────────────────────────────
    final totalDecisions =
        stats.keptCount + stats.trashedCount + stats.decideLaterCount;

    if (totalDecisions >= 100) {
      _tryUnlock(AchievementDefs.lightning, newlyUnlocked);
    }

    final decidedTotal = stats.keptCount + stats.trashedCount;
    if (decidedTotal > 0 && stats.trashedCount / decidedTotal >= 0.80) {
      _tryUnlock(AchievementDefs.ruthless, newlyUnlocked);
    }

    if (stats.decideLaterCount == 0 && decidedTotal > 0) {
      _tryUnlock(AchievementDefs.decisive, newlyUnlocked);
    }

    if (stats.mbFreed >= 500) {
      _tryUnlock(AchievementDefs.bigClean, newlyUnlocked);
    }

    if (decidedTotal >= 500) {
      _tryUnlock(AchievementDefs.marathon, newlyUnlocked);
    }

    if (cumulative.totalSessions == 1) {
      _tryUnlock(AchievementDefs.firstTime, newlyUnlocked);
    }

    // ── Cumulative photo milestones ───────────────────────────────────────────
    _checkPhotoThreshold(cumulative.totalPhotosProcessed, 100, AchievementDefs.c100, newlyUnlocked);
    _checkPhotoThreshold(cumulative.totalPhotosProcessed, 500, AchievementDefs.c500, newlyUnlocked);
    _checkPhotoThreshold(cumulative.totalPhotosProcessed, 1000, AchievementDefs.c1k, newlyUnlocked);
    _checkPhotoThreshold(cumulative.totalPhotosProcessed, 10000, AchievementDefs.c10k, newlyUnlocked);

    // ── Cumulative storage milestones ─────────────────────────────────────────
    _checkMbThreshold(cumulative.totalMbFreed, 1024, AchievementDefs.gb1, newlyUnlocked);
    _checkMbThreshold(cumulative.totalMbFreed, 5 * 1024, AchievementDefs.gb5, newlyUnlocked);
    _checkMbThreshold(cumulative.totalMbFreed, 10 * 1024, AchievementDefs.gb10, newlyUnlocked);

    // ── Streak achievements ───────────────────────────────────────────────────
    if (cumulative.sessionsThisWeek >= 3) {
      _tryUnlock(AchievementDefs.streak3, newlyUnlocked);
    }

    if (cumulative.totalSessions >= 7) {
      _tryUnlock(AchievementDefs.habit, newlyUnlocked);
    }

    if (cumulative.sessionsThisMonth >= 4) {
      _tryUnlock(AchievementDefs.monthly, newlyUnlocked);
    }

    // ── Persist ───────────────────────────────────────────────────────────────
    if (newlyUnlocked.isNotEmpty) {
      await _persistUnlocks(newlyUnlocked);
    }

    state = newlyUnlocked;
    return newlyUnlocked;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /// Adds [id] to [newlyUnlocked] only if not already in the achievements box.
  void _tryUnlock(String id, List<String> newlyUnlocked) {
    if (!HiveBoxes.achievements.containsKey(id)) {
      newlyUnlocked.add(id);
    }
  }

  void _checkPhotoThreshold(
    int total, int threshold, String id, List<String> newlyUnlocked,
  ) {
    if (total >= threshold) _tryUnlock(id, newlyUnlocked);
  }

  void _checkMbThreshold(
    double totalMb, double thresholdMb, String id, List<String> newlyUnlocked,
  ) {
    if (totalMb >= thresholdMb) _tryUnlock(id, newlyUnlocked);
  }

  Future<void> _persistUnlocks(List<String> ids) async {
    final now = DateTime.now();
    for (final id in ids) {
      await HiveBoxes.achievements.put(
        id,
        AchievementRecord()
          ..achievementId = id
          ..unlockedAt = now
          ..sessionId = 0,
      );
    }
  }
}
