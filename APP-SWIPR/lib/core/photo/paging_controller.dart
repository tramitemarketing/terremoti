import 'package:photo_manager/photo_manager.dart';

import '../storage/isar_models.dart';
import 'photo_repository.dart';

/// Session-level pagination orchestrator.
///
/// Wraps [PhotoRepository] and adds:
/// - Eager master-list initialisation for entireLibrary / albums modes.
/// - In-flight request deduplication: if the same page is requested twice
///   concurrently only one photo_manager call is made; both callers await
///   the same [Future].
/// - Full reset when the [SwipeFilter] changes between sessions.
///
/// ## Typical usage
///
/// ```dart
/// final controller = PagingController(repository: photoRepository);
/// await controller.init(filter);          // builds master list, warms cache
/// final page0 = await controller.getPage(0);
/// final page1 = await controller.getPage(1);
/// // …
/// controller.reset();                     // before the next session
/// ```
class PagingController {
  PagingController({required PhotoRepository repository})
      : _repo = repository;

  final PhotoRepository _repo;

  SwipeFilter? _filter;

  /// In-flight page futures keyed by page index.
  /// Removed from the map once the future completes (success or error).
  final _inFlight = <int, Future<List<AssetEntity>>>{};

  // ── Public API ────────────────────────────────────────────────────────────

  /// Current filter. Null before [init] is called.
  SwipeFilter? get filter => _filter;

  /// Initialises the controller for a new swipe session.
  ///
  /// 1. Calls [PhotoRepository.initSession] to refresh the decided-IDs cache.
  /// 2. Calls [PhotoRepository.buildMasterList] for entireLibrary / albums
  ///    modes (runs the sort algorithm in a background isolate).
  ///
  /// Must be awaited before calling [getPage].
  Future<void> init(SwipeFilter filter) async {
    _filter = filter;
    _inFlight.clear();
    await _repo.initSession();
    await _repo.buildMasterList(filter);
  }

  /// Returns the [page]-th page of undecided [AssetEntity] objects.
  ///
  /// Concurrent calls for the same [page] share a single in-flight [Future]
  /// — photo_manager is only hit once per page index per session.
  ///
  /// Returns an empty list when [init] has not been called, or when the
  /// requested page is beyond the end of the asset list.
  Future<List<AssetEntity>> getPage(int page) {
    final currentFilter = _filter;
    if (currentFilter == null) return Future.value([]);

    return _inFlight.putIfAbsent(
      page,
      () => _repo
          .getPage(page, currentFilter)
          .whenComplete(() => _inFlight.remove(page)),
    );
  }

  /// Convenience getter: total undecided asset count for the current filter.
  Future<int> getTotalCount() {
    final currentFilter = _filter;
    if (currentFilter == null) return Future.value(0);
    return _repo.getTotalCount(currentFilter);
  }

  /// Discards all session state.
  ///
  /// Pass a [newFilter] to immediately configure for the next session,
  /// or leave null to require a subsequent [init] call.
  void reset([SwipeFilter? newFilter]) {
    _inFlight.clear();
    _filter = newFilter;
  }
}
