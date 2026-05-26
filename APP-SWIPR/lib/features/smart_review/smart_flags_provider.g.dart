// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'smart_flags_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Remaining free smart-detection quota (number of photos left to analyse).
///
/// Reads [HiveBoxes.kSmartDetectionUsedCount] on every access.
/// Returns 0 when the free quota is exhausted (never goes negative).

@ProviderFor(smartDetectionQuota)
final smartDetectionQuotaProvider = SmartDetectionQuotaProvider._();

/// Remaining free smart-detection quota (number of photos left to analyse).
///
/// Reads [HiveBoxes.kSmartDetectionUsedCount] on every access.
/// Returns 0 when the free quota is exhausted (never goes negative).

final class SmartDetectionQuotaProvider
    extends $FunctionalProvider<int, int, int> with $Provider<int> {
  /// Remaining free smart-detection quota (number of photos left to analyse).
  ///
  /// Reads [HiveBoxes.kSmartDetectionUsedCount] on every access.
  /// Returns 0 when the free quota is exhausted (never goes negative).
  SmartDetectionQuotaProvider._()
      : super(
          from: null,
          argument: null,
          retry: null,
          name: r'smartDetectionQuotaProvider',
          isAutoDispose: true,
          dependencies: null,
          $allTransitiveDependencies: null,
        );

  @override
  String debugGetCreateSourceHash() => _$smartDetectionQuotaHash();

  @$internal
  @override
  $ProviderElement<int> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  int create(Ref ref) {
    return smartDetectionQuota(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(int value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<int>(value),
    );
  }
}

String _$smartDetectionQuotaHash() =>
    r'233d63e0c7d824a19daa2c8a1312d67250eedcb6';

/// Async store for smart-detection results of the current session.
///
/// ## Lifecycle
///
/// 1. Starts empty (`AsyncData([])`).
/// 2. [SmipePage] calls [runDetection] after [processingDelete] completes,
///    passing the session's kept asset IDs.
/// 3. Thumbnails are loaded on the main isolate here, then CPU detection is
///    dispatched to a background isolate via [SmartDetectionEngine.detect].
/// 4. Result is stored as [AsyncData<List<SmartFlag>>].
///
/// ## Quota enforcement (free tier)
///
/// When [isPremium] is false, detection runs only on the first
/// [AppTokens.freeSmartDetectionQuota] assets minus already-used count.
/// The used count is written to [HiveBoxes.kSmartDetectionUsedCount] before
/// calling the engine, so crashes between write and detection are counted.

@ProviderFor(SmartFlags)
final smartFlagsProvider = SmartFlagsProvider._();

/// Async store for smart-detection results of the current session.
///
/// ## Lifecycle
///
/// 1. Starts empty (`AsyncData([])`).
/// 2. [SmipePage] calls [runDetection] after [processingDelete] completes,
///    passing the session's kept asset IDs.
/// 3. Thumbnails are loaded on the main isolate here, then CPU detection is
///    dispatched to a background isolate via [SmartDetectionEngine.detect].
/// 4. Result is stored as [AsyncData<List<SmartFlag>>].
///
/// ## Quota enforcement (free tier)
///
/// When [isPremium] is false, detection runs only on the first
/// [AppTokens.freeSmartDetectionQuota] assets minus already-used count.
/// The used count is written to [HiveBoxes.kSmartDetectionUsedCount] before
/// calling the engine, so crashes between write and detection are counted.
final class SmartFlagsProvider
    extends $AsyncNotifierProvider<SmartFlags, List<SmartFlag>> {
  /// Async store for smart-detection results of the current session.
  ///
  /// ## Lifecycle
  ///
  /// 1. Starts empty (`AsyncData([])`).
  /// 2. [SmipePage] calls [runDetection] after [processingDelete] completes,
  ///    passing the session's kept asset IDs.
  /// 3. Thumbnails are loaded on the main isolate here, then CPU detection is
  ///    dispatched to a background isolate via [SmartDetectionEngine.detect].
  /// 4. Result is stored as [AsyncData<List<SmartFlag>>].
  ///
  /// ## Quota enforcement (free tier)
  ///
  /// When [isPremium] is false, detection runs only on the first
  /// [AppTokens.freeSmartDetectionQuota] assets minus already-used count.
  /// The used count is written to [HiveBoxes.kSmartDetectionUsedCount] before
  /// calling the engine, so crashes between write and detection are counted.
  SmartFlagsProvider._()
      : super(
          from: null,
          argument: null,
          retry: null,
          name: r'smartFlagsProvider',
          isAutoDispose: true,
          dependencies: null,
          $allTransitiveDependencies: null,
        );

  @override
  String debugGetCreateSourceHash() => _$smartFlagsHash();

  @$internal
  @override
  SmartFlags create() => SmartFlags();
}

String _$smartFlagsHash() => r'54a5dbcc24b6bcba8472a43c319aec5c6ed696bc';

/// Async store for smart-detection results of the current session.
///
/// ## Lifecycle
///
/// 1. Starts empty (`AsyncData([])`).
/// 2. [SmipePage] calls [runDetection] after [processingDelete] completes,
///    passing the session's kept asset IDs.
/// 3. Thumbnails are loaded on the main isolate here, then CPU detection is
///    dispatched to a background isolate via [SmartDetectionEngine.detect].
/// 4. Result is stored as [AsyncData<List<SmartFlag>>].
///
/// ## Quota enforcement (free tier)
///
/// When [isPremium] is false, detection runs only on the first
/// [AppTokens.freeSmartDetectionQuota] assets minus already-used count.
/// The used count is written to [HiveBoxes.kSmartDetectionUsedCount] before
/// calling the engine, so crashes between write and detection are counted.

abstract class _$SmartFlags extends $AsyncNotifier<List<SmartFlag>> {
  FutureOr<List<SmartFlag>> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<AsyncValue<List<SmartFlag>>, List<SmartFlag>>;
    final element = ref.element as $ClassProviderElement<
        AnyNotifier<AsyncValue<List<SmartFlag>>, List<SmartFlag>>,
        AsyncValue<List<SmartFlag>>,
        Object?,
        Object?>;
    element.handleCreate(ref, build);
  }
}
