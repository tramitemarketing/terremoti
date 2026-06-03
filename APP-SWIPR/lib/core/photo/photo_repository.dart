import 'package:flutter/foundation.dart' show debugPrint, defaultTargetPlatform, kDebugMode, TargetPlatform;
import 'package:photo_manager/photo_manager.dart';

import '../storage/hive_boxes.dart';
import '../storage/isar_models.dart';

/// Page size used for all photo_manager paged requests.
const _kPageSize = 50;

/// Handles all raw photo_manager interactions for Swipr.
///
/// ## Session lifecycle
///
/// Call [initSession] once when a swipe session starts. It caches the set of
/// already-decided asset IDs from Hive so that [getPage] can filter without
/// hitting the database on every asset.
///
/// For [CleanupMode.entireLibrary] on Android and [CleanupMode.albums], call
/// [buildMasterList] right after [initSession]. This builds the ordered master
/// list of [AssetEntity] objects that [getPage] paginates through in-memory
/// (zero platform-channel cost per page).
///
/// For [CleanupMode.entireLibrary] on iOS and [CleanupMode.timeRange], no
/// master list is built — [getPage] queries photo_manager directly each call.
class PhotoRepository {
  // ── Session state ─────────────────────────────────────────────────────────

  /// IDs of assets already decided (keep or trash). Populated by [initSession].
  Set<String> _decidedIds = {};

  /// Ordered master entity list for Android-entireLibrary and albums modes.
  /// Null for iOS entireLibrary / timeRange — those use direct pagination.
  List<AssetEntity>? _masterList;

  /// Cached "all photos" path for iOS [CleanupMode.entireLibrary] pagination.
  AssetPathEntity? _allPhotosPath;

  // ── Public API ────────────────────────────────────────────────────────────

  /// Loads all decided asset IDs from Hive into an in-memory Set.
  Future<void> initSession() async {
    _decidedIds = HiveBoxes.decisions.keys.cast<String>().toSet();
    _masterList = null;
    _allPhotosPath = null;
  }

  /// Builds and caches the ordered master entity list for the given [filter].
  ///
  /// - Android [CleanupMode.entireLibrary]: sequential per-album iteration
  ///   (avoids the `hasAll: true` hang and concurrent MediaStore deadlocks on
  ///   Samsung One UI 6 / Android 14). Capped at [_kAndroidInitialCap].
  /// - iOS [CleanupMode.entireLibrary]: no-op — [getPage] paginates directly.
  /// - [CleanupMode.albums]: deduplicated union of selected albums.
  /// - [CleanupMode.timeRange]: no-op — [getPage] queries photo_manager.
  ///
  /// Entities are stored directly — [getPage] slices the in-memory list with
  /// zero platform-channel cost.
  Future<void> buildMasterList(SwipeFilter filter) async {
    switch (filter.mode) {
      case CleanupMode.entireLibrary:
        if (defaultTargetPlatform == TargetPlatform.android) {
          _masterList = await _buildEntireLibraryMasterList();
        } else {
          _masterList = null; // iOS: direct pagination is faster
        }
      case CleanupMode.albums:
        _masterList = await _buildAlbumsMasterList(filter.albumIds);
      case CleanupMode.timeRange:
        _masterList = null;
    }
  }

  /// Returns a page of [AssetEntity] objects, already filtered of decided IDs.
  Future<List<AssetEntity>> getPage(int page, SwipeFilter filter) async {
    if (kDebugMode) debugPrint('[Repo] getPage(page=$page mode=${filter.mode}) masterList=${_masterList?.length}');
    return switch (filter.mode) {
      CleanupMode.entireLibrary => _masterList != null
          ? _getPageFromMasterList(page)
          : _getEntireLibraryPage(page),
      CleanupMode.albums => _getPageFromMasterList(page),
      CleanupMode.timeRange => _getTimeRangePage(page, filter),
    };
  }

  /// Returns the total undecided asset count for the current filter.
  Future<int> getTotalCount(SwipeFilter filter) async {
    switch (filter.mode) {
      case CleanupMode.entireLibrary:
        if (_masterList != null) return _masterList!.length;
        final allPath = await _cachedAllPhotosPath();
        if (allPath == null) return 0;
        return allPath.assetCountAsync;

      case CleanupMode.albums:
        if (_masterList != null) return _masterList!.length;
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

  /// Max assets collected during Android startup. Covers most sessions while
  /// keeping build time under ~2 s on typical devices.
  static const _kAndroidInitialCap = 1000;

  /// Builds the Android master list from individual album bucket paths.
  ///
  /// Uses `hasAll: false` to avoid the Samsung One UI 6 `hasAll` hang.
  /// Iterates albums SEQUENTIALLY — concurrent MediaStore cursors deadlock
  /// on Samsung Android 14. Stores [AssetEntity] objects directly so that
  /// [_getPageFromMasterList] needs zero platform-channel calls.
  Future<List<AssetEntity>> _buildEntireLibraryMasterList() async {
    final paths = await PhotoManager.getAssetPathList(
      type: RequestType.image,
      hasAll: false,
    );
    if (paths.isEmpty) return [];

    final seen = <String>{};
    final pairs = <(AssetEntity, int)>[];

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
            pairs.add((a, a.createDateTime.millisecondsSinceEpoch));
          }
        }
        if (assets.length < _kPageSize) break;
        page++;
      }
    }

    // Sort by createdAt DESC on main isolate — 1000 items is negligible.
    pairs.sort((a, b) => b.$2.compareTo(a.$2));
    return pairs.map((p) => p.$1).toList();
  }

  Future<List<AssetEntity>> _buildAlbumsMasterList(
      List<String> albumIds) async {
    final paths = await PhotoManager.getAssetPathList(
      type: RequestType.image,
    );
    final albumPaths = paths.where((p) => albumIds.contains(p.id)).toList();

    final seen = <String>{};
    final pairs = <(AssetEntity, int)>[];

    for (final path in albumPaths) {
      var page = 0;
      while (true) {
        final assets =
            await path.getAssetListPaged(page: page, size: _kPageSize);
        if (assets.isEmpty) break;
        for (final asset in assets) {
          if (!seen.contains(asset.id) && !_decidedIds.contains(asset.id)) {
            seen.add(asset.id);
            pairs.add((asset, asset.createDateTime.millisecondsSinceEpoch));
          }
        }
        if (assets.length < _kPageSize) break;
        page++;
      }
    }

    pairs.sort((a, b) => b.$2.compareTo(a.$2));
    return pairs.map((p) => p.$1).toList();
  }

  // ── Page fetchers ─────────────────────────────────────────────────────────

  /// Direct pagination for iOS [CleanupMode.entireLibrary].
  Future<List<AssetEntity>> _getEntireLibraryPage(int page) async {
    final path = await _cachedAllPhotosPath();
    if (path == null) return [];
    final assets = await path.getAssetListPaged(page: page, size: _kPageSize);
    return assets.where((a) => !_decidedIds.contains(a.id)).toList();
  }

  /// In-memory slice — zero platform-channel cost.
  Future<List<AssetEntity>> _getPageFromMasterList(int page) async {
    if (kDebugMode) debugPrint('[Repo] _getPageFromMasterList(page=$page) masterList.len=${_masterList?.length}');
    final list = _masterList ?? [];
    final start = page * _kPageSize;
    if (start >= list.length) return [];
    final end = (start + _kPageSize).clamp(0, list.length);
    final result = list.sublist(start, end);
    if (kDebugMode) debugPrint('[Repo] _getPageFromMasterList done → ${result.length} items');
    return result;
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
    return assets.where((a) => !_decidedIds.contains(a.id)).toList();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

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
