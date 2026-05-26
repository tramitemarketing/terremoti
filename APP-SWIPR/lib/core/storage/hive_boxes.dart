import 'package:hive_flutter/hive_flutter.dart';

import 'hive_models.dart';

/// Manages all Hive boxes used by Swipr.
///
/// Call [openAll] in [main] after all TypeAdapters are registered
/// and after [Hive.initFlutter].
class HiveBoxes {
  HiveBoxes._();

  // ── Box names ──────────────────────────────────────────────────────────────

  static const _settingsBox      = 'settings';
  static const _decideLaterBox   = 'decideLater';
  static const _sessionsBox      = 'sessions';
  static const _assetCacheBox    = 'assetCache';
  static const _decisionsBox     = 'decisions';
  static const _achievementsBox  = 'achievements';
  static const _cumulativeBox    = 'cumulativeStats';

  // ── Settings keys ──────────────────────────────────────────────────────────

  static const kOnboardingDone         = 'onboarding_done';
  static const kCleanupMode            = 'cleanup_mode';
  static const kSmartDetectionUsedCount = 'smart_detection_used';

  // ── Box accessors ──────────────────────────────────────────────────────────

  /// General app settings and preferences.
  static Box<dynamic> get settings => Hive.box(_settingsBox);

  /// Decide-later queue: stores asset IDs only (no asset objects).
  static Box<String> get decideLater => Hive.box<String>(_decideLaterBox);

  /// Completed swipe sessions.
  static Box<SessionRecord> get sessions =>
      Hive.box<SessionRecord>(_sessionsBox);

  /// Cached asset metadata.
  static Box<AssetCacheEntry> get assetCache =>
      Hive.box<AssetCacheEntry>(_assetCacheBox);

  /// Per-asset swipe decisions (key = assetId).
  static Box<AssetDecisionRecord> get decisions =>
      Hive.box<AssetDecisionRecord>(_decisionsBox);

  /// Unlocked achievements (key = achievementId).
  static Box<AchievementRecord> get achievements =>
      Hive.box<AchievementRecord>(_achievementsBox);

  /// Cumulative cross-session stats singleton (key = 0).
  static Box<CumulativeStats> get cumulativeStats =>
      Hive.box<CumulativeStats>(_cumulativeBox);

  // ── Init ───────────────────────────────────────────────────────────────────

  /// Opens all boxes. Must be called after TypeAdapters are registered.
  static Future<void> openAll() async {
    await Hive.openBox<dynamic>(_settingsBox);
    await Hive.openBox<String>(_decideLaterBox);
    await Hive.openBox<SessionRecord>(_sessionsBox);
    await Hive.openBox<AssetCacheEntry>(_assetCacheBox);
    await Hive.openBox<AssetDecisionRecord>(_decisionsBox);
    await Hive.openBox<AchievementRecord>(_achievementsBox);
    await Hive.openBox<CumulativeStats>(_cumulativeBox);
  }
}
