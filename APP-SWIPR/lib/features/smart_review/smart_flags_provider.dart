import 'package:photo_manager/photo_manager.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../core/storage/hive_boxes.dart';
import '../../shared/theme/app_tokens.dart';
import 'smart_detection_engine.dart';

part 'smart_flags_provider.g.dart';

// ── Quota provider ────────────────────────────────────────────────────────────

/// Remaining free smart-detection quota (number of photos left to analyse).
///
/// Reads [HiveBoxes.kSmartDetectionUsedCount] on every access.
/// Returns 0 when the free quota is exhausted (never goes negative).
@riverpod
int smartDetectionQuota(Ref ref) {
  final used =
      HiveBoxes.settings.get(HiveBoxes.kSmartDetectionUsedCount) as int? ?? 0;
  return (AppTokens.freeSmartDetectionQuota - used)
      .clamp(0, AppTokens.freeSmartDetectionQuota);
}

// ── Flags provider ────────────────────────────────────────────────────────────

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
@riverpod
class SmartFlags extends _$SmartFlags {
  @override
  FutureOr<List<SmartFlag>> build() => const [];

  /// Runs smart detection on [keptAssetIds].
  ///
  /// Should be called once per session from [SwipePage] after the
  /// [processingDelete] phase completes successfully.
  Future<void> runDetection({
    required List<String> keptAssetIds,
    required bool isPremium,
  }) async {
    if (keptAssetIds.isEmpty) {
      state = const AsyncData([]);
      return;
    }

    state = const AsyncLoading();

    // ── Enforce free-tier quota ────────────────────────────────────────────
    final usedSoFar =
        HiveBoxes.settings.get(HiveBoxes.kSmartDetectionUsedCount) as int? ?? 0;
    final idsToProcess = isPremium
        ? keptAssetIds
        : keptAssetIds
            .take(
              (AppTokens.freeSmartDetectionQuota - usedSoFar)
                  .clamp(0, keptAssetIds.length),
            )
            .toList();

    if (idsToProcess.isEmpty) {
      state = const AsyncData([]);
      return;
    }

    // Persist usage before loading so a crash still counts toward the quota.
    await HiveBoxes.settings.put(
      HiveBoxes.kSmartDetectionUsedCount,
      usedSoFar + idsToProcess.length,
    );

    // ── Load thumbnails on main isolate (platform channel) ─────────────────
    final assets = <AssetDetectionData>[];
    for (final id in idsToProcess) {
      final entity = await AssetEntity.fromId(id);
      if (entity == null) continue;

      final thumbBytes = await entity.thumbnailDataWithSize(
        const ThumbnailSize(200, 200),
        quality: 80,
      );
      if (thumbBytes == null) continue;

      int fileSizeBytes = 0;
      try {
        final file = await entity.file;
        if (file != null) fileSizeBytes = await file.length();
      } catch (_) {
        // Asset file unavailable — low_quality check skipped for this asset.
      }

      assets.add(AssetDetectionData(
        assetId: id,
        fileSizeBytes: fileSizeBytes,
        thumbnailBytes: thumbBytes,
      ));
    }

    if (assets.isEmpty) {
      state = const AsyncData([]);
      return;
    }

    // ── Dispatch CPU work to background isolate ────────────────────────────
    try {
      final flags = await SmartDetectionEngine.detect(
        assets: assets,
        isPremium: isPremium,
      );
      state = AsyncData(flags);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }
}
