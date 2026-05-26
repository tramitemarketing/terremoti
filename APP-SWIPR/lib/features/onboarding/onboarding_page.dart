import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/storage/hive_boxes.dart';
import '../../router.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_tokens.dart';
import '../../shared/theme/app_typography.dart';

/// Minimal welcome screen — shown only once.
///
/// On mount: if [HiveBoxes.kOnboardingDone] is already set, navigates
/// immediately to [Routes.permissions] without rendering any UI.
///
/// On "Inizia" tap: sets [HiveBoxes.kOnboardingDone] = true, then navigates
/// to [Routes.permissions] which handles permission routing.
class OnboardingPage extends ConsumerStatefulWidget {
  const OnboardingPage({super.key});

  @override
  ConsumerState<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends ConsumerState<OnboardingPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final done =
          HiveBoxes.settings.get(HiveBoxes.kOnboardingDone) as bool? ?? false;
      if (done) context.go(Routes.permissions);
    });
  }

  void _start() {
    HiveBoxes.settings.put(HiveBoxes.kOnboardingDone, true);
    context.go(Routes.permissions);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppTokens.spaceXL),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(flex: 3),

              // App name
              Text('Swipr', style: AppTypography.displayLarge),
              const SizedBox(height: AppTokens.spaceSM),

              // Tagline
              Text(
                'The fastest way to\nclean your gallery.',
                style: AppTypography.displayMedium.copyWith(
                  color: AppColors.textSecondary,
                  height: 1.3,
                ),
              ),

              const Spacer(flex: 2),

              // Trust line
              Text(
                'Le foto restano sul tuo dispositivo.\nNessun cloud. Nessun account.',
                style: AppTypography.body,
              ),

              const SizedBox(height: AppTokens.spaceXL),

              // CTA
              SizedBox(
                width: double.infinity,
                child: _PrimaryButton(
                  label: 'Inizia',
                  onTap: _start,
                ),
              ),

              const SizedBox(height: AppTokens.spaceLG),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Shared button ─────────────────────────────────────────────────────────────

class _PrimaryButton extends StatelessWidget {
  const _PrimaryButton({
    required this.label,
    required this.onTap,
    this.enabled = true,
  });

  final String label;
  final VoidCallback onTap;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1.0 : 0.4,
      child: GestureDetector(
        onTap: enabled ? onTap : null,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: AppTokens.spaceMD),
          decoration: BoxDecoration(
            color: AppColors.textPrimary,
            borderRadius: BorderRadius.circular(AppTokens.radiusMD),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: AppTypography.title.copyWith(color: AppColors.background),
          ),
        ),
      ),
    );
  }
}
