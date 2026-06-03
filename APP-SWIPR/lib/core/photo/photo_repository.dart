import 'package:flutter/foundation.dart' show compute, defaultTargetPlatform, TargetPlatform;
import 'package:photo_manager/photo_manager.dart';

import '../storage/hive_service.dart';
import '../storage/isar_models.dart';

/// Page size used for all photo_manager paged requests.
const _kPageSize = 50;

/// Handles all raw photo_manager interactions for Swipr.
///
/// ## Session lifecycle
///
/// Call [initSession] once when a swipe session starts. It caches the set of
/// already-decided asset IDs from Isar so that [getPage] can filter without
/// hitting the database on every asset.
///
/// For [CleanupMode.entireLibrary] and [CleanupMode.albums], call
/// [buildMasterList] right after [initSession]. This builds (in a background
/// isolate) the ordered master ID list that [getPage] and [PagingController]
/// paginate through. For [CleanupMode.timeRange] no master list is needed —
/// [getPage] queries photo_manager directly on each call.
class PhotoRepository {
  // ── Session state ─────────────────────────────────────────────────────────

  /// IDs of assets already decided (keep or trash). Populated by [initSession].
  /// Never rebuilt per-asset — checked as O(1) Set lookup.
  Set<String> _decidedIds = {};

  /// Ordered master ID list for albums / Android-entireLibrary modes.
  /// null for iOS entireLibrary / timeRange modes.
  List<String>? _masterIdList;

  /// Cached "all photos" path for iOS [CleanupMode.entireLibrary] direct pagination.
  AssetPathEntity? _allPhotosPath;

  // ── Public API ────────────────────────────────────────────────────────────

  /// Loads all decided asset IDs from Hive into an in-memory Set.
  ///
  /// Must be called once at session start before [buildMasterList] or
  /// [getPage]. Resets any previously cached master list.
  Future<void> initSession() async {
    _decidedIds = HiveService.getAllDecidedIds();
    _masterIdList = null;
    _allPhotosPath = null;
  }

  /// Builds and caches the ordered master ID list for the given [filter].
  ///
  /// - [CleanupMode.entireLibrary] on Android: builds master list from
  ///   individual album bucket paths to avoid the Samsung/Android-14 hang on
  ///   the virtual `hasAll: true` path. Runs in [compute].
  /// - [CleanupMode.entireLibrary] on iOS: no-op — [getPage] paginates the
  ///   `hasAll` path directly (faster, no upfront cost).
  /// - [CleanupMode.albums]: deduplicated union of selected albums, sorted by
  ///   createdAt DESC, runs in [compute].
  /// - [CleanupMode.timeRange]: no-op — [getPage] queries photo_manager
  ///   directly.
  ///
  /// Already-decided assets are excluded from the list before sorting.
  Future<void> buildMasterList(SwipeFilter filter) async {
    switch (filter.mode) {
      case CleanupMode.entireLibrary:
        if (defaultTargetPlatform == TargetPlatform.android) {
          // Android: the virtual 'hasAll: true' path hangs on Samsung One UI 6+
          // (and possibly other Android 14 devices) when calling getAssetListPaged.
          // Individual bucket paths work correctly — use them instead.
          _masterIdList = await _buildEntireLibraryMasterList();
        } else {
          // iOS: direct pagination via _allPhotosPath is fast, no upfront cost.
          _masterIdList = null;
        }
      case CleanupMode.albums:
        _masterIdList = await _buildAlbumsList(filter.albumIds);
      case CleanupMode.timeRange:
        _masterIdList = null;
    }
  }

  /// Returns a page of [AssetEntity] objects, already filtered of decided IDs.
  ///
  /// For [CleanupMode.entireLibrary] / [CleanupMode.albums]: paginates the
  /// cached master ID list (call [buildMasterList] first).
  /// For [CleanupMode.timeRange]: queries photo_manager directly via
  /// [FilterOptionGroup].
  Future<List<AssetEntity>> getPage(int page, SwipeFilter filter) async {
    return switch (filter.mode) {
      CleanupMode.entireLibrary => _masterIdList != null
          ? _getPageFromMasterList(page)
          : _getEntireLibraryPage(page),
      CleanupMode.albums => _getPageFromMasterList(page),
      CleanupMode.timeRange => _getTimeRangePage(page, filter),
    };
  }

  /// Returns the total undecided asset count for the current filter.
  ///
  /// Uses the cached master list length when available; falls back to
  /// photo_manager queries for display before [buildMasterList] is called.
  Future<int> getTotalCount(SwipeFilter filter) async {
    switch (filter.mode) {
      case CleanupMode.entireLibrary:
        // Use master list length when available (Android path).
        if (_masterIdList != null) return _masterIdList!.length;
        // iOS fallback: fast assetCountAsync on the hasAll path.
        final allPath = await _cachedAllPhotosPath();
        if (allPath == null) return 0;
        return allPath.assetCountAsync;

      case CleanupMode.albums:
        if (_masterIdList != null) return _masterIdList!.length;
        final paths = await PhotoManager.getAssetPathList(
          type: RequestType.image,
        );
        final albumPaths = paths.where((p) => filter.albumIds.contains(p.id));
        var total = 0;
        for (final path in albumPaths) {
          total += await path.assetCountAsync;
        }
        return total;

      case CleanupMode.timeRange:
        final paths = await PhotoManager.getAssetPathList(
          type: RequestType.image,
          hasAll: true,
          filterOption: _timeRangeFilter(filter),
        );
        if (paths.isEmpty) return 0;
        return paths.first.assetCountAsync;
    }
  }

  /// Fetches a single [AssetEntity] by ID. Returns null if not found.
  Future<AssetEntity?> getById(String id) => AssetEntity.fromId(id);

  /// Returns all user albums (excluding "all photos"), sorted with system
  /// albums first then alphabetically. Albums with 0 assets are omitted.
  Future<List<AlbumInfo>> getAllAlbums() async {
    final paths = await PhotoManager.getAssetPathList(
      type: RequestType.image,
      hasAll: false,
    );

    final albums = <AlbumInfo>[];
    for (final path in paths) {
      final count = await path.assetCountAsync;
      if (count == 0) continue;

      final firstPage = await path.getAssetListPaged(page: 0, size: 1);
      albums.add(AlbumInfo(
        id: path.id,
        name: path.name,
        assetCount: count,
        thumbnailAssetId: firstPage.isEmpty ? null : firstPage.first.id,
      ));
    }

    return _sortedAlbums(albums);
  }

  // ── Master list builders ──────────────────────────────────────────────────

  /// Builds the master list for [CleanupMode.entireLibrary] on Android.
  ///
  /// Uses individual bucket paths (`hasAll: false`) to avoid the virtual
  /// "all photos" path that hangs on Samsung Android 14.
  ///
  /// Fetches albums SEQUENTIALLY (not in parallel) — concurrent MediaStore
  /// cursors can deadlock on Samsung One UI 6 / Android 14.
  ///
  /// Capped at [_kAndroidInitialCap] IDs so startup completes in ~2 s on
  /// a typical device. The cap covers most sessions; if the deck is exhausted
  /// the session proceeds to the review/result phase normally.
  static const _kAndroidInitialCap = 1000;

  Future<List<String>> _buildEntireLibraryMasterList() async {
    final paths = await PhotoManager.getAssetPathList(
      type: RequestType.image,
      hasAll: false, // Individual bucket paths — avoids hasAll hang
    );
    if (paths.isEmpty) return [];

    final pairs = <(String, int)>[];
    final seen = <String>{};

    outer:
    for (final path in paths) {
      var page = 0;
      while (true) {
        if (seen.length >= _kAndroidInitialCap) break outer;
        final assets =
            await path.getAssetListPaged(page: page, size: _kPageSize);
        if (assets.isEmpty) break;
        for (final a in assets) {
          if (!seen.contains(a.id) && !_decidedIds.contains(a.id)) {
            seen.add(a.id);
            pairs.add((a.id, a.createDateTime.millisecondsSinceEpoch));
          }
        }
        if (assets.length < _kPageSize) break;
        page++;
      }
    }

    return compute(_sortByCreatedDesc, pairs);
  }

  Future<List<String>> _buildAlbumsList(List<String> albumIds) async {
    final paths = await PhotoManager.getAssetPathList(
      type: RequestType.image,
    );
    final albumPaths =
        paths.where((p) => albumIds.contains(p.id)).toList();

    // Collect (id, createDateTime ms) pairs — lightweight, no image bytes.
    final pairs = <(String, int)>[];
    final seen = <String>{};

    for (final path in albumPaths) {
      var page = 0;
      while (true) {
        final assets =
            await path.getAssetListPaged(page: page, size: _kPageSize);
        if (assets.isEmpty) break;
        for (final asset in assets) {
          if (!seen.contains(asset.id) &&
              !_decidedIds.contains(asset.id)) {
            seen.add(asset.id);
            pairs.add((asset.id, asset.createDateTime.millisecondsSinceEpoch));
          }
        }
        if (assets.length < _kPageSize) break;
        page++;
      }
    }

    // Sort by createdAt DESC in a background isolate.
    return compute(_sortByCreatedDesc, pairs);
  }

  // ── Page fetchers ─────────────────────────────────────────────────────────

  /// Direct pagination for iOS [CleanupMode.entireLibrary].
  ///
  /// Resolves and caches [_allPhotosPath] on first call, then paginates it
  /// directly — no upfront master-list build required.
  Future<List<AssetEntity>> _getEntireLibraryPage(int page) async {
    final path = await _cachedAllPhotosPath();
    if (path == null) return [];
    final assets = await path.getAssetListPaged(page: page, size: _kPageSize);
    return assets.where((a) => !_decidedIds.contains(a.id)).toList();
  }

  Future<List<AssetEntity>> _getPageFromMasterList(int page) async {
    final list = _masterIdList ?? [];
    final start = page * _kPageSize;
    if (start >= list.length) return [];
    final end = (start + _kPageSize).clamp(0, list.length);
    final ids = list.sublist(start, end);
    return _fetchByIds(ids);
  }

  Future<List<AssetEntity>> _getTimeRangePage(
    int page,
    SwipeFilter filter,
  ) async {
    final paths = await PhotoManager.getAssetPathList(
      type: RequestType.image,
      hasAll: true,
      filterOption: _timeRangeFilter(filter),
    );
    if (paths.isEmpty) return [];
    final assets =
        await paths.first.getAssetListPaged(page: page, size: _kPageSize);
    // Filter decided IDs post-fetch (master list not used for timeRange).
    return assets.where((a) => !_decidedIds.contains(a.id)).toList();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /// Returns [_allPhotosPath], fetching and caching it on first call.
  Future<AssetPathEntity?> _cachedAllPhotosPath() async {
    _allPhotosPath ??= await _getAllPhotosPath();
    return _allPhotosPath;
  }

  Future<AssetPathEntity?> _getAllPhotosPath() async {
    final paths = await PhotoManager.getAssetPathList(
      type: RequestType.image,
      hasAll: true,
    );
    if (paths.isEmpty) return null;
    return paths.firstWhere((p) => p.isAll, orElse: () => paths.first);
  }

  Future<List<AssetEntity>> _fetchByIds(List<String> ids) async {
    final results = await Future.wait(ids.map(AssetEntity.fromId));
    return results.whereType<AssetEntity>().toList();
  }

  FilterOptionGroup _timeRangeFilter(SwipeFilter filter) {
    return FilterOptionGroup(
      imageOption: const FilterOption(
        needTitle: false,
        sizeConstraint: SizeConstraint(ignoreSize: true),
      ),
      createTimeCond: DateTimeCond(
        min: filter.rangeStart!,
        max: filter.rangeEnd!,
        ignore: false,
      ),
    );
  }

  List<AlbumInfo> _sortedAlbums(List<AlbumInfo> albums) {
    // System album names across iOS (en/it) and Android.
    const system = {
      'Recents', 'All Photos', 'Recenti',
      'Favorites', 'Preferiti',
      'Screenshots', 'Screenshot',
      'Camera Roll', 'Camera', 'Fotocamera',
      'Selfies', 'Portrait', 'Burst',
      'Videos', 'Slow Motion', 'Time-lapse',
    };

    albums.sort((a, b) {
      final aSystem = system.contains(a.name) ? 0 : 1;
      final bSystem = system.contains(b.name) ? 0 : 1;
      if (aSystem != bSystem) return aSystem.compareTo(bSystem);
      return a.name.compareTo(b.name);
    });

    return albums;
  }
}

// ── Top-level functions for compute() ────────────────────────────────────────
// Must be top-level (not instance methods) to be passed to compute().

/// Sorts (assetId, createDateTimeMs) pairs by timestamp DESC and returns IDs.
List<String> _sortByCreatedDesc(List<(String, int)> pairs) {
  pairs.sort((a, b) => b.$2.compareTo(a.$2));
  return pairs.map((p) => p.$1).toList();
}
