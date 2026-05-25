import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/storage/hive_boxes.dart';

part 'decide_later_provider.g.dart';

/// Canonical store for asset IDs deferred to a later review session.
///
/// Persisted in Hive ([HiveBoxes.decideLater]) on every mutation so the
/// queue survives app restarts. The in-memory [state] mirrors Hive exactly.
///
/// Stores asset IDs only — never [AssetEntity] objects.
/// Uses the asset ID as both the Hive key and value for O(1) lookup and
/// deletion without iterating all values.
@riverpod
class DecideLater extends _$DecideLater {
  @override
  List<String> build() {
    // Restore any IDs persisted from a previous session.
    return HiveBoxes.decideLater.values.toList();
  }

  /// Queues [assetId] for later review.
  ///
  /// Writes to Hive before updating in-memory state. No-op if already present.
  void add(String assetId) {
    if (state.contains(assetId)) return;
    HiveBoxes.decideLater.put(assetId, assetId);
    state = [...state, assetId];
  }

  /// Removes [assetId] from the queue (used by undo or when reviewed).
  ///
  /// Deletes from Hive before updating in-memory state. No-op if not present.
  void remove(String assetId) {
    HiveBoxes.decideLater.delete(assetId);
    state = state.where((id) => id != assetId).toList();
  }

  /// Empties the queue and clears Hive. Called after decide-later review is
  /// complete.
  void clearAll() {
    HiveBoxes.decideLater.clear();
    state = const [];
  }
}
