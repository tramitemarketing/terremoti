import 'package:flutter/material.dart';

import 'app_colors.dart';

abstract class AppTypography {
  static const _base = TextStyle(
    color: AppColors.textPrimary,
    fontFamily: 'SwiprDisplay',
    fontFamilyFallback: ['.SF Pro Display', 'sans-serif'],
    letterSpacing: -0.2,
  );

  static final displayLarge  = _base.copyWith(fontSize: 32, fontWeight: FontWeight.w500);
  static final displayMedium = _base.copyWith(fontSize: 24, fontWeight: FontWeight.w500);
  static final title         = _base.copyWith(fontSize: 18, fontWeight: FontWeight.w500);
  static final body          = _base.copyWith(fontSize: 15, fontWeight: FontWeight.w400, color: AppColors.textSecondary);
  static final caption       = _base.copyWith(fontSize: 13, fontWeight: FontWeight.w400, color: AppColors.textTertiary);
  static final hudLabel      = _base.copyWith(fontSize: 13, fontWeight: FontWeight.w500, letterSpacing: 0.2);
  static final storageFreed  = _base.copyWith(fontSize: 18, fontWeight: FontWeight.w500, color: AppColors.keepGreen);
}
