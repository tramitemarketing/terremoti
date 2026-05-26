import 'package:flutter/foundation.dart';

/// A single smart-detection result for one asset.
class SmartFlag {
  const SmartFlag({
    required this.assetId,
    required this.flagType,
    this.duplicateOfId,
    required this.confidence,
  });

  final String assetId;

  /// One of: `'blur'` | `'low_quality'` | `'duplicate'` | `'near_duplicate'`
  final String flagType;

  /// Populated only for `'duplicate'` / `'near_duplicate'` flags.
  final String? duplicateOfId;

  /// 0.0 → 1.0 where 1.0 = highest confidence of a problem.
  final double confidence;
}

/// Per-asset payload sent to the background isolate.
///
/// Contains only isolate-sendable types (String, int, Uint8List).
/// No platform objects — photo_manager interactions happen on the main isolate
/// inside [SmartDetectionEngine.detect] before calling [compute].
class AssetDetectionData {
  const AssetDetectionData({
    required this.assetId,
    required this.fileSizeBytes,
    required this.thumbnailBytes,
  });

  final String assetId;

  /// Original asset file size in bytes. Used for the [low_quality] check.
  final int fileSizeBytes;

  /// JPEG thumbnail at ≤ 200×200 px. Used for the [blur] check.
  final Uint8List thumbnailBytes;
}

/// Runs smart-detection algorithms on a batch of kept assets.
///
/// ## Architecture
///
/// Thumbnail loading (platform channel) must happen on the **main isolate**
/// before calling [detect]. [detect] itself passes all bytes to [compute] so
/// the CPU-intensive work runs off the UI thread.
///
/// ## Algorithms
///
/// | Flag            | Method                         | Tier    |
/// |-----------------|--------------------------------|---------|
/// | `blur`          | JPEG compression-ratio proxy   | Free    |
/// | `low_quality`   | Original file size < 50 KB     | Free    |
/// | `duplicate`     | pHash comparison               | Premium |
/// | `near_duplicate`| pHash distance ≤ 8             | Premium |
///
/// Detection is performed ONLY on thumbnails (max 200×200 px). Full-res
/// assets are never loaded here.
///
/// ## Blur heuristic
///
/// Full pixel-level Laplacian variance requires decoding JPEG bytes to a
/// pixel array. Until `dart:ui` isolate support is wired, we approximate
/// sharpness via JPEG compression ratio: blurry thumbnails have less
/// high-frequency detail and compress more aggressively at a fixed quality,
/// producing smaller files. The threshold is calibrated so that a 200×200
/// thumbnail below ~10 KB (q80) scores < 100, matching the §17 spec.
class SmartDetectionEngine {
  SmartDetectionEngine._();

  /// Dispatches detection to a background isolate via [compute].
  ///
  /// [assets] must already contain decoded thumbnail bytes (loaded on the
  /// main isolate). [isPremium] enables duplicate/near-duplicate detection.
  static Future<List<SmartFlag>> detect({
    required List<AssetDetectionData> assets,
    required bool isPremium,
  }) {
    return compute(_runDetection, _DetectionPayload(assets, isPremium));
  }
}

// ── Isolate payload ───────────────────────────────────────────────────────────

/// Wrapper so [compute] receives a single argument.
class _DetectionPayload {
  const _DetectionPayload(this.assets, this.isPremium);
  final List<AssetDetectionData> assets;
  final bool isPremium;
}

// ── Top-level isolate entry point ─────────────────────────────────────────────

/// Must be top-level (not a closure or instance method) for [compute].
List<SmartFlag> _runDetection(_DetectionPayload payload) {
  final flags = <SmartFlag>[];

  for (final entry in payload.assets) {
    // ── blur (free tier) ────────────────────────────────────────────────────
    final blur = _blurScore(entry.thumbnailBytes);
    if (blur < 100) {
      flags.add(SmartFlag(
        assetId: entry.assetId,
        flagType: 'blur',
        confidence: ((100.0 - blur) / 100.0).clamp(0.0, 1.0),
      ));
    }

    // ── low_quality (free tier) ─────────────────────────────────────────────
    const lowQualityThreshold = 50 * 1024; // 50 KB
    if (entry.fileSizeBytes > 0 && entry.fileSizeBytes < lowQualityThreshold) {
      flags.add(SmartFlag(
        assetId: entry.assetId,
        flagType: 'low_quality',
        confidence: 1.0 - (entry.fileSizeBytes / lowQualityThreshold),
      ));
    }
  }

  // ── duplicate / near_duplicate (premium only) ─────────────────────────────
  // TODO(premium): implement pHash comparison across payload.assets
  // Each pair comparison: compute perceptual hash from thumbnail bytes,
  // then compute Hamming distance. distance == 0 → duplicate, ≤ 8 → near.

  return flags;
}

/// Approximates sharpness via JPEG compression ratio.
///
/// Returns a value in [0, 200]. Values < 100 indicate a likely-blurry asset.
/// Calibrated for 200×200 thumbnails at quality 80:
///   - ~10 KB or less → score < 100 (blurry)
///   - ~20 KB         → score ≈ 200 (sharp)
double _blurScore(Uint8List thumbnailBytes) {
  // 100 bytes per pixel maps to score 100 (the threshold).
  // A 200×200 thumbnail at q80: typical sharp ~20 KB, blurry ~5–8 KB.
  return (thumbnailBytes.length / 100.0).clamp(0.0, 200.0);
}
