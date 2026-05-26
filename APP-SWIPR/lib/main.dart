import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:photo_manager/photo_manager.dart';

import 'app.dart';
import 'core/storage/hive_adapters.dart';
import 'core/storage/hive_boxes.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarBrightness: Brightness.dark,
    statusBarIconBrightness: Brightness.light,
  ));

  await Hive.initFlutter();

  // Register all TypeAdapters before opening boxes.
  Hive.registerAdapter(SessionRecordAdapter());
  Hive.registerAdapter(AssetCacheEntryAdapter());
  Hive.registerAdapter(AssetDecisionRecordAdapter());
  Hive.registerAdapter(AchievementRecordAdapter());
  Hive.registerAdapter(CumulativeStatsAdapter());

  await HiveBoxes.openAll();

  PhotoManager.setLog(false);
  runApp(const ProviderScope(child: SwiprApp()));
}
