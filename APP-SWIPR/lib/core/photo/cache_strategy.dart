import 'dart:collection';
import 'dart:typed_data';

import '../../shared/theme/app_tokens.dart';

/// LRU in-memory cache for decoded photo bytes.
///
/// Stores raw [Uint8List] bytes only — never [Image] widgets or [AssetEntity]
/// objects. Decoded bytes are platform-agnostic and safe to pass across
/// isolates if needed.
///
/// The cache is bounded to [AppTokens.maxMemoryAssets] entries (default 20).
/// When a new entry would exceed the cap the least-recently-used entry is
/// evicted first. An optional [onEvict] callback lets [PreloadEngine] cancel
/// any in-flight decode for the evicted asset ID.
///
/// All operations are O(1) thanks to [LinkedHashMap]'s insertion-order
/// iteration combined with remove-then-reinsert for access promotion.
class LruCacheStrategy {
  LruCacheStrategy({
    int maxEntries = AppTokens.maxMemoryAssets,
    this.onEvict,
  }) : _maxEntries = maxEntries;

  final int _maxEntries;

  /// Called with the evicted asset ID whenever an entry is removed to make
  /// room for a new one. Use this hook to cancel in-flight decodes.
  final void Function(String assetId)? onEvict;

  /// Insertion-order map — the first key is always the LRU entry.
  final _cache = LinkedHashMap<String, Uint8List>();

  // ── Public API ────────────────────────────────────────────────────────────

  /// Returns the cached bytes for [assetId], or null if not present.
  ///
  /// Promotes the entry to most-recently-used position on hit.
  Uint8List? get(String assetId) {
    final bytes = _cache.remove(assetId);
    if (bytes != null) {
      _cache[assetId] = bytes; // re-insert at tail = most recently used
    }
    return bytes;
  }

  /// Stores [bytes] for [assetId].
  ///
  /// If [assetId] is already present it is replaced in-place (promoted to
  /// MRU). If the cache is at capacity the LRU entry is evicted first,
  /// triggering [onEvict] if set.
  void put(String assetId, Uint8List bytes) {
    _cache.remove(assetId); // ensure correct MRU ordering on update
    if (_cache.length >= _maxEntries) {
      final lruKey = _cache.keys.first;
      _cache.remove(lruKey);
      onEvict?.call(lruKey);
    }
    _cache[assetId] = bytes;
  }

  /// Explicitly removes [assetId] from the cache.
  ///
  /// No-op if the asset is not cached. Does not trigger [onEvict].
  void evict(String assetId) => _cache.remove(assetId);

  /// Returns true if [assetId] has cached bytes.
  bool contains(String assetId) => _cache.containsKey(assetId);

  /// Current number of cached entries.
  int get length => _cache.length;

  /// Removes all entries. Does not trigger [onEvict].
  void clear() => _cache.clear();
}
