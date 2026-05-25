import 'package:isar/isar.dart';

import 'isar_models.dart';

/// Singleton wrapper around the Isar database.
///
/// Call [init] exactly once in [main] before [runApp].
/// Access the instance everywhere via [IsarService.instance].
class IsarService {
  IsarService._();

  static late Isar _instance;

  static Isar get instance => _instance;

  static Future<void> init() async {
    _instance = await Isar.open([
      SessionRecordSchema,
      AssetCacheEntrySchema,
      AssetDecisionRecordSchema,
      AchievementRecordSchema,
      CumulativeStatsSchema,
    ]);
  }
}
