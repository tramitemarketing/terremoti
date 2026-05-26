abstract class AppTokens {
  // ── Spacing ───────────────────────────────────────────────────────────────
  static const double spaceXS = 4;
  static const double spaceSM = 8;
  static const double spaceMD = 16;
  static const double spaceLG = 24;
  static const double spaceXL = 40;

  // ── Border radii ──────────────────────────────────────────────────────────
  static const double radiusSM = 8;
  static const double radiusMD = 16;
  static const double radiusLG = 24;
  static const double radiusCard = 20;

  // ── Animation durations ───────────────────────────────────────────────────
  static const cardSwipeDuration = Duration(milliseconds: 250);
  static const backgroundFadeSpeed = Duration(milliseconds: 80);
  static const undoAnimDuration = Duration(milliseconds: 200);
  static const recapEnterDuration = Duration(milliseconds: 400);

  // ── Swipe thresholds ──────────────────────────────────────────────────────
  static const double swipeCommitThreshold = 0.35;
  static const double swipeUpThreshold = 0.25;
  /// Minimum velocity (pixels/second) to commit a swipe regardless of distance.
  static const double swipeVelocityThreshold = 600;

  // ── Photo preload window ──────────────────────────────────────────────────
  static const int preloadAhead = 10;
  static const int preloadBehind = 5;
  static const int maxMemoryAssets = 20;

  // ── Monetisation ─────────────────────────────────────────────────────────
  static const int freeSmartDetectionQuota = 100;

  // ── Sort algorithm ────────────────────────────────────────────────────────
  /// Number of consecutive photos per cluster in the semi-random sort.
  static const int clusterSize = 5;
}
