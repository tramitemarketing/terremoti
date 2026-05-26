import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_typography.dart';

abstract class AppTheme {
  static ThemeData dark() {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: const ColorScheme.dark(
        surface: AppColors.background,
        primary: AppColors.keepGreen,
        error: AppColors.trashRed,
      ),
      textTheme: TextTheme(
        displayLarge:  AppTypography.displayLarge,
        displayMedium: AppTypography.displayMedium,
        titleMedium:   AppTypography.title,
        bodyMedium:    AppTypography.body,
        bodySmall:     AppTypography.caption,
      ),
      splashFactory:  NoSplash.splashFactory,
      highlightColor: Colors.transparent,
      splashColor:    Colors.transparent,
    );
  }
}
