// ── Pure Dart models (not persisted — no Hive or Isar annotations) ────────────
//
// Hive-persisted models live in hive_models.dart.
// This file exists solely for the non-storage types that are shared across
// routing, photo_repository, and session state.

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
