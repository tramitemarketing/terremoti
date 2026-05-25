import 'package:hive_flutter/hive_flutter.dart';

/// Manages all Hive boxes used by Swipr.
///
/// Call [openAll] in [main] after [Hive.initFlutter] and before [runApp].
/// Access boxes via the static getters — they are always open after [openAll].
class HiveBoxes {
  HiveBoxes._();

  // ── Box names ──────────────────────────────────────────────────────────────

  static const _settingsBox = 'settings';
  static const _decideLaterBox = 'decideLater';

  // ── Settings keys ──────────────────────────────────────────────────────────

  static const kOnboardingDone = 'onboarding_done';
  static const kCleanupMode = 'cleanup_mode';
  static const kSmartDetectionUsedCount = 'smart_detection_used';

  // ── Box accessors ──────────────────────────────────────────────────────────

  /// General app settings and preferences.
  static Box<dynamic> get settings => Hive.box(_settingsBox);

  /// Decide-later queue: stores asset IDs only (no asset objects).
  static Box<String> get decideLater => Hive.box<String>(_decideLaterBox);

  // ── Init ───────────────────────────────────────────────────────────────────

  static Future<void> openAll() async {
    await Hive.openBox<dynamic>(_settingsBox);
    await Hive.openBox<String>(_decideLaterBox);
  }
}
