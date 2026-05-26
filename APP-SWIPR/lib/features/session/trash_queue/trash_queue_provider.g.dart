// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'trash_queue_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Canonical store for asset IDs queued for batch deletion.
///
/// Stores asset IDs only — never [AssetEntity] objects.
/// The actual deletion happens once per session in [confirmDelete] phase,
/// not incrementally.

@ProviderFor(TrashQueue)
final trashQueueProvider = TrashQueueProvider._();

/// Canonical store for asset IDs queued for batch deletion.
///
/// Stores asset IDs only — never [AssetEntity] objects.
/// The actual deletion happens once per session in [confirmDelete] phase,
/// not incrementally.
final class TrashQueueProvider
    extends $NotifierProvider<TrashQueue, List<String>> {
  /// Canonical store for asset IDs queued for batch deletion.
  ///
  /// Stores asset IDs only — never [AssetEntity] objects.
  /// The actual deletion happens once per session in [confirmDelete] phase,
  /// not incrementally.
  TrashQueueProvider._()
      : super(
          from: null,
          argument: null,
          retry: null,
          name: r'trashQueueProvider',
          isAutoDispose: true,
          dependencies: null,
          $allTransitiveDependencies: null,
        );

  @override
  String debugGetCreateSourceHash() => _$trashQueueHash();

  @$internal
  @override
  TrashQueue create() => TrashQueue();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(List<String> value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<List<String>>(value),
    );
  }
}

String _$trashQueueHash() => r'5a504fbe9a085f644abdace467f7e82cfefa87f5';

/// Canonical store for asset IDs queued for batch deletion.
///
/// Stores asset IDs only — never [AssetEntity] objects.
/// The actual deletion happens once per session in [confirmDelete] phase,
/// not incrementally.

abstract class _$TrashQueue extends $Notifier<List<String>> {
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
