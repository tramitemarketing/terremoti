import 'dart:typed_data';

import 'package:photo_manager/photo_manager.dart';

import '../photo/cache_strategy.dart';
import '../../shared/theme/app_tokens.dart';

/// Proactively decodes thumbnail bytes for the assets surrounding the current
/// swipe index and stores them in [LruCacheStrategy].
///
/// ## Window
///
/// ```
/// ◄── preloadBehind (5) ──┤ currentIndex ├── preloadAhead (10) ──►
/// ```
///
/// - **Behind**: keeps recently swiped assets in memory so undo animations
///   have bytes available without a synchronous disk read.
/// - **Ahead**: ensures the next assets are always ready before the user
///   reaches them.
///
/// ## In-flight tracking and cancellation
///
/// Each pending decode is stored in [_inFlight] keyed by asset ID.
/// When an asset slides out of the window **or** is evicted from the cache
/// by [LruCacheStrategy.onEvict], the ID is added to [_cancelled].
/// The decode task checks [_cancelled] before writing to the cache — if
/// the asset was cancelled the bytes are discarded silently.
///
/// ## Threading note
///
/// [AssetEntity.thumbnailDataWithSize] is a platform-channel call: the heavy
/// decoding happens in native code; the Dart side only awaits the result.
/// This is non-blocking for the UI isolate. Any CPU-intensive post-processing
/// of the bytes (e.g. pHash for smart detection) must be offloaded via
/// [compute] — that is handled separately in [SmartDetectionEngine].
///
/// ## Wiring
///
/// Pass the same [LruCacheStrategy] instance to both [PreloadEngine] and
/// [MemoryBudget]. The engine registers [_onCacheEvict] into
/// [LruCacheStrategy.onEvict] during construction — do not overwrite
/// [onEvict] after that.
///
/// ```dart
/// final cache    = LruCacheStrategy();
/// final budget   = MemoryBudget(cache: cache);
/// final preloader = PreloadEngine(cache: cache);
/// // wire complete — cache.onEvict is now set
/// ```
class PreloadEngine {
  PreloadEngine({required LruCacheStrategy cache}) : _cache = cache {
    _cache.onEvict = _onCacheEvict;
  }

  final LruCacheStrategy _cache;

  /// Futures for decodes that have been started but not yet completed.
  /// Key: asset ID. Removed on completion (success, error, or cancel).
  final _inFlight = <String, Future<void>>{};

  /// Asset IDs whose results should be discarded when their decode finishes.
  final _cancelled = <String>{};

  // ── Public API ─────────────────────────────────────────────────────────────

  /// Called every time [SwipeSessionState.currentIndex] advances.
  ///
  /// Computes the preload window around [index] within [deck], cancels decodes
  /// for assets that have fallen out of the window, and starts decodes for
  /// in-window assets that are not yet cached.
  ///
  /// [deck] is the full ordered list of [AssetEntity] objects for the current
  /// session. Index arithmetic is performed against this list directly.
  void updateIndex(int index, List<AssetEntity> deck) {
    if (deck.isEmpty) return;

    final lo = (index - AppTokens.preloadBehind).clamp(0, deck.length);
    final hi = (index + AppTokens.preloadAhead + 1).clamp(0, deck.length);
    final windowIds = {
      for (final a in deck.sublist(lo, hi)) a.id,
    };

    // Cancel any in-flight decode whose asset has left the window.
    for (final id in _inFlight.keys.toList()) {
      if (!windowIds.contains(id)) _cancelDecode(id);
    }

    // Start decodes for uncached, in-window assets.
    for (final asset in deck.sublist(lo, hi)) {
      if (!_cache.contains(asset.id) && !_inFlight.containsKey(asset.id)) {
        _inFlight[asset.id] = _decode(asset);
      }
    }
  }

  /// Returns cached thumbnail bytes for [assetId] synchronously.
  ///
  /// Returns null if the asset has not yet been decoded by [updateIndex].
  /// This is the zero-async read path used by [SwipeCard] at build time.
  Uint8List? getBytesSync(String assetId) => _cache.get(assetId);

  /// Awaits the in-flight decode for [assetId] and returns the bytes.
  ///
  /// - If bytes are already in cache: returns immediately (zero cost).
  /// - If a decode is in flight: awaits that exact [Future] — no polling.
  /// - If neither: returns null immediately (caller should handle gracefully).
  ///
  /// A [timeout] guards against a stalled decode. After the timeout the method
  /// returns whatever is (or is not) in cache at that point.
  Future<Uint8List?> waitForBytes(
    String assetId, {
    Duration timeout = const Duration(milliseconds: 600),
  }) async {
    final cached = _cache.get(assetId);
    if (cached != null) return cached;

    final inflight = _inFlight[assetId];
    if (inflight != null) {
      await inflight.timeout(timeout, onTimeout: () {});
    }

    return _cache.get(assetId);
  }

  /// Cancels all in-flight decodes and clears the cache.
  /// Call between sessions or when [SwipeFilter] changes.
  void reset() {
    for (final id in _inFlight.keys.toList()) {
      _cancelDecode(id);
    }
    _cancelled.clear();
    _cache.clear();
  }

  // ── Private ────────────────────────────────────────────────────────────────

  /// Registered as [LruCacheStrategy.onEvict].
  /// Called by the cache whenever it evicts an asset to make room for a newer
  /// entry — we must cancel the in-flight decode so stale bytes are not
  /// reinserted into the cache after eviction.
  void _onCacheEvict(String assetId) => _cancelDecode(assetId);

  void _cancelDecode(String id) {
    _cancelled.add(id);
    _inFlight.remove(id);
  }

  Future<void> _decode(AssetEntity asset) async {
    try {
      // Decode at display resolution (full-screen portrait).
      // photo_manager performs the actual decoding on the native side;
      // the Dart side only awaits the channel response.
      final bytes = await asset.thumbnailDataWithSize(
        const ThumbnailSize(540, 960),
        quality: 80,
      );

      // Check for cancellation before touching the cache.
      // _cancelled.remove returns true if the id was present.
      if (_cancelled.remove(asset.id)) return;

      if (bytes != null) {
        _cache.put(asset.id, bytes);
      }
    } catch (_) {
      // Asset was deleted from the device between session start and decode.
      // The PhotoRepository will skip it on the next getPage() call.
      _cancelled.remove(asset.id);
    } finally {
      _inFlight.remove(asset.id);
    }
  }
}
