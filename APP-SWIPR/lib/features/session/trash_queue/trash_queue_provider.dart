import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'trash_queue_provider.g.dart';

/// Canonical store for asset IDs queued for batch deletion.
///
/// Stores asset IDs only — never [AssetEntity] objects.
/// The actual deletion happens once per session in [confirmDelete] phase,
/// not incrementally.
@riverpod
class TrashQueue extends _$TrashQueue {
  @override
  List<String> build() => const [];

  /// Adds [assetId] to the queue. No-op if already present.
  void add(String assetId) {
    if (state.contains(assetId)) return;
    state = [...state, assetId];
  }

  /// Removes [assetId] from the queue (used by undo). No-op if not present.
  void remove(String assetId) {
    state = state.where((id) => id != assetId).toList();
  }

  /// Empties the queue. Called after successful batch deletion.
  void clear() => state = const [];
}
