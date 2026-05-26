// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'decide_later_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Canonical store for asset IDs deferred to a later review session.
///
/// Persisted in Hive ([HiveBoxes.decideLater]) on every mutation so the
/// queue survives app restarts. The in-memory [state] mirrors Hive exactly.
///
/// Stores asset IDs only — never [AssetEntity] objects.
/// Uses the asset ID as both the Hive key and value for O(1) lookup and
/// deletion without iterating all values.

@ProviderFor(DecideLater)
final decideLaterProvider = DecideLaterProvider._();

/// Canonical store for asset IDs deferred to a later review session.
///
/// Persisted in Hive ([HiveBoxes.decideLater]) on every mutation so the
/// queue survives app restarts. The in-memory [state] mirrors Hive exactly.
///
/// Stores asset IDs only — never [AssetEntity] objects.
/// Uses the asset ID as both the Hive key and value for O(1) lookup and
/// deletion without iterating all values.
final class DecideLaterProvider
    extends $NotifierProvider<DecideLater, List<String>> {
  /// Canonical store for asset IDs deferred to a later review session.
  ///
  /// Persisted in Hive ([HiveBoxes.decideLater]) on every mutation so the
  /// queue survives app restarts. The in-memory [state] mirrors Hive exactly.
  ///
  /// Stores asset IDs only — never [AssetEntity] objects.
  /// Uses the asset ID as both the Hive key and value for O(1) lookup and
  /// deletion without iterating all values.
  DecideLaterProvider._()
      : super(
          from: null,
          argument: null,
          retry: null,
          name: r'decideLaterProvider',
          isAutoDispose: true,
          dependencies: null,
          $allTransitiveDependencies: null,
        );

  @override
  String debugGetCreateSourceHash() => _$decideLaterHash();

  @$internal
  @override
  DecideLater create() => DecideLater();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(List<String> value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<List<String>>(value),
    );
  }
}

String _$decideLaterHash() => r'2414334f4ae3497ebd040d438e28d169a10d510c';

/// Canonical store for asset IDs deferred to a later review session.
///
/// Persisted in Hive ([HiveBoxes.decideLater]) on every mutation so the
/// queue survives app restarts. The in-memory [state] mirrors Hive exactly.
///
/// Stores asset IDs only — never [AssetEntity] objects.
/// Uses the asset ID as both the Hive key and value for O(1) lookup and
/// deletion without iterating all values.

abstract class _$DecideLater extends $Notifier<List<String>> {
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
