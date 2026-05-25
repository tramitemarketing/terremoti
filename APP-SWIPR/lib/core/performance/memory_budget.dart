import '../photo/cache_strategy.dart';
import '../../shared/theme/app_tokens.dart';

/// Tracks decoded-image memory usage and signals when the app is approaching
/// its memory budget.
///
/// ## Caps
///
/// | Cap  | Value | Meaning |
/// |------|-------|---------|
/// | Hard | [hardCapMb] (150 MB) | Overall app memory target. Not enforced here — use as a reference ceiling when profiling. |
/// | Soft | [AppTokens.maxMemoryAssets] entries | Enforced by [LruCacheStrategy]: once reached, every new entry evicts the LRU. |
///
/// [MemoryBudget] does not evict anything itself — it reads state directly
/// from the shared [LruCacheStrategy] instance. The cache is the single
/// source of truth for eviction policy.
///
/// Use [isUnderPressure] in the session layer to decide whether to pause
/// preloading; use [currentDecodedCount] for diagnostics and debug overlays.
class MemoryBudget {
  MemoryBudget({required LruCacheStrategy cache}) : _cache = cache;

  /// Overall app memory target in megabytes.
  /// Not automatically enforced — used as a reference ceiling when profiling.
  static const double hardCapMb = 150.0;

  final LruCacheStrategy _cache;

  /// Number of asset images currently held in the decoded-bytes cache.
  int get currentDecodedCount => _cache.length;

  /// True when the cache has reached [AppTokens.maxMemoryAssets].
  ///
  /// At this point every new [LruCacheStrategy.put] will trigger an eviction.
  /// Callers may choose to pause proactive preloading when this returns true,
  /// though the cache remains correct regardless.
  bool get isUnderPressure => _cache.length >= AppTokens.maxMemoryAssets;
}
