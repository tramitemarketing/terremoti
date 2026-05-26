// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'achievement_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Persists and exposes the cross-session cumulative stats singleton (key 0).
///
/// Call [updateAfterSession] BEFORE [AchievementNotifier.checkAndUnlock] so
/// achievement checks operate on post-session totals.

@ProviderFor(CumulativeStatsStore)
final cumulativeStatsStoreProvider = CumulativeStatsStoreProvider._();

/// Persists and exposes the cross-session cumulative stats singleton (key 0).
///
/// Call [updateAfterSession] BEFORE [AchievementNotifier.checkAndUnlock] so
/// achievement checks operate on post-session totals.
final class CumulativeStatsStoreProvider
    extends $NotifierProvider<CumulativeStatsStore, CumulativeStats> {
  /// Persists and exposes the cross-session cumulative stats singleton (key 0).
  ///
  /// Call [updateAfterSession] BEFORE [AchievementNotifier.checkAndUnlock] so
  /// achievement checks operate on post-session totals.
  CumulativeStatsStoreProvider._()
      : super(
          from: null,
          argument: null,
          retry: null,
          name: r'cumulativeStatsStoreProvider',
          isAutoDispose: false,
          dependencies: null,
          $allTransitiveDependencies: null,
        );

  @override
  String debugGetCreateSourceHash() => _$cumulativeStatsStoreHash();

  @$internal
  @override
  CumulativeStatsStore create() => CumulativeStatsStore();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(CumulativeStats value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<CumulativeStats>(value),
    );
  }
}

String _$cumulativeStatsStoreHash() =>
    r'd03136a444ec18fe374215c292a490ac78567e89';

/// Persists and exposes the cross-session cumulative stats singleton (key 0).
///
/// Call [updateAfterSession] BEFORE [AchievementNotifier.checkAndUnlock] so
/// achievement checks operate on post-session totals.

abstract class _$CumulativeStatsStore extends $Notifier<CumulativeStats> {
  CumulativeStats build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<CumulativeStats, CumulativeStats>;
    final element = ref.element as $ClassProviderElement<
        AnyNotifier<CumulativeStats, CumulativeStats>,
        CumulativeStats,
        Object?,
        Object?>;
    element.handleCreate(ref, build);
  }
}

/// Checks and unlocks achievements at the end of a session.
///
/// Call [checkAndUnlock] AFTER [CumulativeStatsStore.updateAfterSession].
/// Each achievement is written ONLY ONCE: [_tryUnlock] uses
/// [HiveService.hasAchievement] (O(1) containsKey) to skip re-unlocking.

@ProviderFor(AchievementNotifier)
final achievementProvider = AchievementNotifierProvider._();

/// Checks and unlocks achievements at the end of a session.
///
/// Call [checkAndUnlock] AFTER [CumulativeStatsStore.updateAfterSession].
/// Each achievement is written ONLY ONCE: [_tryUnlock] uses
/// [HiveService.hasAchievement] (O(1) containsKey) to skip re-unlocking.
final class AchievementNotifierProvider
    extends $NotifierProvider<AchievementNotifier, List<String>> {
  /// Checks and unlocks achievements at the end of a session.
  ///
  /// Call [checkAndUnlock] AFTER [CumulativeStatsStore.updateAfterSession].
  /// Each achievement is written ONLY ONCE: [_tryUnlock] uses
  /// [HiveService.hasAchievement] (O(1) containsKey) to skip re-unlocking.
  AchievementNotifierProvider._()
      : super(
          from: null,
          argument: null,
          retry: null,
          name: r'achievementProvider',
          isAutoDispose: false,
          dependencies: null,
          $allTransitiveDependencies: null,
        );

  @override
  String debugGetCreateSourceHash() => _$achievementNotifierHash();

  @$internal
  @override
  AchievementNotifier create() => AchievementNotifier();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(List<String> value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<List<String>>(value),
    );
  }
}

String _$achievementNotifierHash() =>
    r'788a27489fb5f6983cfea47dd308315ecbae06cf';

/// Checks and unlocks achievements at the end of a session.
///
/// Call [checkAndUnlock] AFTER [CumulativeStatsStore.updateAfterSession].
/// Each achievement is written ONLY ONCE: [_tryUnlock] uses
/// [HiveService.hasAchievement] (O(1) containsKey) to skip re-unlocking.

abstract class _$AchievementNotifier extends $Notifier<List<String>> {
  List<String> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<List<String>, List<String>>;
    final element = ref.element as $ClassProviderElement<
        AnyNotifier<List<String>, List<String>>,
        List<String>,
        Object?,
        Object?>;
    element.handleCreate(ref, build);
  }
}
