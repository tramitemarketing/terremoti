import 'package:hive_flutter/hive_flutter.dart';

// ── Hive models (plain Dart — adapters in hive_adapters.dart) ─────────────────
//
// TypeId registry — never change or reuse after first run:
//   0 → SessionRecordAdapter
//   1 → AssetCacheEntryAdapter
//   2 → AssetDecisionRecordAdapter
//   3 → AchievementRecordAdapter
//   4 → CumulativeStatsAdapter

class SessionRecord extends HiveObject {
  int id = 0;
  late DateTime startedAt;
  DateTime? endedAt;
  int keptCount = 0;
  int trashedCount = 0;
  int decideLaterCount = 0;
  double mbFreed = 0;
  int skippedCloudCount = 0;
  int smartFlaggedCount = 0;
}

class AssetCacheEntry extends HiveObject {
  int id = 0;
  late String assetId;
  int sizeBytes = 0;
  int? durationMs;
  late DateTime createdAt;
  late DateTime cachedAt;
}

class AssetDecisionRecord extends HiveObject {
  int id = 0;
  late String assetId;

  /// 'keep' | 'trash' | 'later'
  late String decision;
  late DateTime decidedAt;
  int sessionId = 0;
  List<String> smartFlags = [];
  bool smartFlagReviewed = false;
}

class AchievementRecord extends HiveObject {
  int id = 0;
  late String achievementId;
  late DateTime unlockedAt;
  int sessionId = 0;
}

/// Singleton — stored at key 0. Update via CumulativeStatsStore only.
class CumulativeStats extends HiveObject {
  int totalPhotosProcessed = 0;
  int totalPhotosTrashed = 0;
  int totalPhotosKept = 0;
  double totalMbFreed = 0;
  int totalSessions = 0;
  DateTime? lastSessionAt;

  /// Reset every Monday.
  int sessionsThisWeek = 0;

  /// Reset every 1st of the month.
  int sessionsThisMonth = 0;
}
