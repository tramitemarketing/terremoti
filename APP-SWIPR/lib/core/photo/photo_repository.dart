import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:isar_community/isar_community.dart';
import 'package:photo_manager/photo_manager.dart';

import '../storage/isar_models.dart';
import '../storage/isar_service.dart';
import '../../shared/theme/app_tokens.dart';

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

  /// Ordered master ID list for entireLibrary / albums modes.
  /// null for timeRange mode or before [buildMasterList] is called.
  List<String>? _masterIdList;

  // ── Public API ────────────────────────────────────────────────────────────

  /// Loads all keep/trash decisions from Isar into an in-memory Set.
  ///
  /// Must be called once at session start before [buildMasterList] or
  /// [getPage]. Resets any previously cached master list.
  Future<void> initSession() async {
    final records = await IsarService.instance.assetDecisionRecords
        .filter()
        .decisionEqualTo('keep')
        .or()
        .decisionEqualTo('trash')
        .findAll();
    _decidedIds = records.map((r) => r.assetId).toSet();
    _masterIdList = null;
  }

  /// Builds and caches the ordered master ID list for the given [filter].
  ///
  /// - [CleanupMode.entireLibrary]: cluster semi-random sort (§7), runs in
  ///   [compute].
  /// - [CleanupMode.albums]: deduplicated union of selected albums, sorted by
  ///   createdAt DESC, runs in [compute].
  /// - [CleanupMode.timeRange]: no-op — [getPage] queries photo_manager
  ///   directly.
  ///
  /// Already-decided assets are excluded from the list before sorting.
  Future<void> buildMasterList(SwipeFilter filter) async {
    switch (filter.mode) {
      case CleanupMode.entireLibrary:
        _masterIdList = await _buildEntireLibraryList();
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
      CleanupMode.entireLibrary || CleanupMode.albums =>
        _getPageFromMasterList(page),
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
        if (_masterIdList != null) return _masterIdList!.length;
        final allPath = await _getAllPhotosPath();
        if (allPath == null) return 0;
        return allPath.assetCountAsync();

      case CleanupMode.albums:
        if (_masterIdList != null) return _masterIdList!.length;
        final paths = await PhotoManager.getAssetPathList(
          type: RequestType.image,
        );
        final albumPaths = paths.where((p) => filter.albumIds.contains(p.id));
        var total = 0;
        for (final path in albumPaths) {
          total += await path.assetCountAsync();
        }
        return total;

      case CleanupMode.timeRange:
        final paths = await PhotoManager.getAssetPathList(
          type: RequestType.image,
          hasAll: true,
          filterOption: _timeRangeFilter(filter),
        );
        if (paths.isEmpty) return 0;
        return paths.first.assetCountAsync();
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
      final count = await path.assetCountAsync();
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

  Future<List<String>> _buildEntireLibraryList() async {
    final allPath = await _getAllPhotosPath();
    if (allPath == null) return [];

    // 1. Collect all asset IDs chronologically (DESC — newest first, as
    //    photo_manager returns them by default).
    final allIds = <String>[];
    var page = 0;
    while (true) {
      final assets =
          await allPath.getAssetListPaged(page: page, size: _kPageSize);
      if (assets.isEmpty) break;
      allIds.addAll(assets.map((a) => a.id));
      if (assets.length < _kPageSize) break;
      page++;
    }

    // 2. Filter out already-decided assets.
    final undecided =
        allIds.where((id) => !_decidedIds.contains(id)).toList();

    // Edge case: library smaller than one cluster — skip shuffle.
    if (undecided.length <= AppTokens.clusterSize) return undecided;

    // 3. Cluster-sort in a background isolate.
    return compute(
      _clusterSort,
      _ClusterSortParams(
        ids: undecided,
        clusterSize: AppTokens.clusterSize,
        seed: _dayBasedSeed(),
      ),
    );
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

  int _dayBasedSeed() {
    final now = DateTime.now();
    return now.year * 10000 + now.month * 100 + now.day;
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

class _ClusterSortParams {
  final List<String> ids;
  final int clusterSize;
  final int seed;

  const _ClusterSortParams({
    required this.ids,
    required this.clusterSize,
    required this.seed,
  });
}

/// Splits [params.ids] into clusters of [params.clusterSize], shuffles the
/// clusters with a seeded RNG (deterministic per calendar day), then flattens.
///
/// Photos within each cluster keep their original relative order, so images
/// from the same event stay together while the overall session feels varied.
List<String> _clusterSort(_ClusterSortParams params) {
  final ids = params.ids;
  final size = params.clusterSize;

  final clusters = <List<String>>[];
  for (var i = 0; i < ids.length; i += size) {
    clusters.add(ids.sublist(i, (i + size).clamp(0, ids.length)));
  }

  clusters.shuffle(Random(params.seed));
  return clusters.expand((c) => c).toList();
}

/// Sorts (assetId, createDateTimeMs) pairs by timestamp DESC and returns IDs.
List<String> _sortByCreatedDesc(List<(String, int)> pairs) {
  pairs.sort((a, b) => b.$2.compareTo(a.$2));
  return pairs.map((p) => p.$1).toList();
}
