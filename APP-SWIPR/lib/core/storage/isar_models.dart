import 'package:isar_community/isar_community.dart';

part 'isar_models.g.dart';

// ── Isar collections ──────────────────────────────────────────────────────────

@Collection()
class SessionRecord {
  Id id = Isar.autoIncrement;
  late DateTime startedAt;
  DateTime? endedAt;
  int keptCount = 0;
  int trashedCount = 0;
  int decideLaterCount = 0;
  double mbFreed = 0;
  int skippedCloudCount = 0;
  int smartFlaggedCount = 0;
}

@Collection()
class AssetCacheEntry {
  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String assetId;

  int sizeBytes = 0;
  int? durationMs;
  late DateTime createdAt;
  late DateTime cachedAt;
}

@Collection()
class AssetDecisionRecord {
  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String assetId;

  /// 'keep' | 'trash' | 'later'
  late String decision;
  late DateTime decidedAt;
  int sessionId = 0;
  List<String> smartFlags = [];
  bool smartFlagReviewed = false;
}

@Collection()
class AchievementRecord {
  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String achievementId;

  late DateTime unlockedAt;
  int sessionId = 0;
}

/// Singleton — id is always 1. Update via CumulativeStatsProvider only.
@Collection()
class CumulativeStats {
  Id id = 1;
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

// ── Pure Dart models (not persisted in Isar) ──────────────────────────────────

enum CleanupMode { entireLibrary, albums, timeRange }

class SwipeFilter {
  final CleanupMode mode;

  /// Populated when [mode] == [CleanupMode.albums].
  final List<String> albumIds;

  /// Populated when [mode] == [CleanupMode.timeRange].
  final DateTime? rangeStart;
  final DateTime? rangeEnd;

  const SwipeFilter.entireLibrary()
      : mode = CleanupMode.entireLibrary,
        albumIds = const [],
        rangeStart = null,
        rangeEnd = null;

  const SwipeFilter.albums(this.albumIds)
      : mode = CleanupMode.albums,
        rangeStart = null,
        rangeEnd = null;

  const SwipeFilter.timeRange({
    required DateTime start,
    required DateTime end,
  })  : mode = CleanupMode.timeRange,
        albumIds = const [],
        rangeStart = start,
        rangeEnd = end;

  bool get isValid {
    if (mode == CleanupMode.albums) return albumIds.isNotEmpty;
    if (mode == CleanupMode.timeRange) {
      return rangeStart != null && rangeEnd != null;
    }
    return true;
  }
}

class SessionStats {
  final int keptCount;
  final int trashedCount;
  final int decideLaterCount;
  final double mbFreed;
  final Duration sessionDuration;
  final int skippedCloudCount;
  final int smartFlaggedCount;

  /// Achievement IDs unlocked during this session.
  final List<String> unlockedAchievementIds;

  const SessionStats({
    required this.keptCount,
    required this.trashedCount,
    required this.decideLaterCount,
    required this.mbFreed,
    required this.sessionDuration,
    required this.skippedCloudCount,
    required this.smartFlaggedCount,
    required this.unlockedAchievementIds,
  });
}

class AlbumInfo {
  final String id;
  final String name;
  final int assetCount;
  final String? thumbnailAssetId;

  const AlbumInfo({
    required this.id,
    required this.name,
    required this.assetCount,
    this.thumbnailAssetId,
  });
}
