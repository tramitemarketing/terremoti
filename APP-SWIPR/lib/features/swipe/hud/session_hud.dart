import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_tokens.dart';
import '../../../shared/theme/app_typography.dart';
import '../../session/session_state/swipe_session_provider.dart';

/// Floating heads-up display shown during the swipe session.
///
/// Displays:
/// - MB queued for deletion ([SessionStats.mbFreed])
/// - Trash count ([SessionStats.trashedCount])
/// - Floating "+X MB" pop-up animation whenever the trash queue grows
class SessionHud extends ConsumerStatefulWidget {
  const SessionHud({super.key});

  @override
  ConsumerState<SessionHud> createState() => _SessionHudState();
}

class _SessionHudState extends ConsumerState<SessionHud>
    with SingleTickerProviderStateMixin {
  late final AnimationController _popup;
  String _popupText = '';

  @override
  void initState() {
    super.initState();
    _popup = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
  }

  @override
  void dispose() {
    _popup.dispose();
    super.dispose();
  }

  void _showPopup(double deltaMb) {
    if (deltaMb <= 0) return;
    final label = deltaMb >= 1
        ? '+${deltaMb.toStringAsFixed(1)} MB'
        : '+${(deltaMb * 1024).toStringAsFixed(0)} KB';
    setState(() => _popupText = label);
    _popup.forward(from: 0);
  }

  @override
  Widget build(BuildContext context) {
    // Listen for mbFreed increases and trigger the pop-up animation.
    ref.listen(
      sessionStatsProvider.select((s) => s.mbFreed),
      (prev, next) {
        final delta = next - (prev ?? 0);
        if (delta > 0) _showPopup(delta);
      },
    );

    final stats = ref.watch(sessionStatsProvider);

    final mbLabel = stats.mbFreed >= 1024
        ? '${(stats.mbFreed / 1024).toStringAsFixed(2)} GB'
        : '${stats.mbFreed.toStringAsFixed(1)} MB';

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppTokens.spaceMD,
          vertical: AppTokens.spaceSM,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Trash count pill
            _HudPill(
              icon: Icons.delete_outline_rounded,
              label: '${stats.trashedCount}',
            ),
            const SizedBox(width: AppTokens.spaceSM),
            // MB queued pill
            _HudPill(
              icon: Icons.storage_rounded,
              label: mbLabel,
              color: AppColors.trashRed,
            ),
            const Spacer(),
            // "+X MB" float-up animation
            AnimatedBuilder(
              animation: _popup,
              builder: (_, __) {
                // Fade in fast (0→0.25), hold (0.25→0.65), fade out (0.65→1.0)
                final t = _popup.value;
                final opacity = t < 0.25
                    ? t / 0.25
                    : t > 0.65
                        ? 1.0 - (t - 0.65) / 0.35
                        : 1.0;
                // Float 28px upward over the animation
                final dy = -28.0 * t;
                return Transform.translate(
                  offset: Offset(0, dy),
                  child: Opacity(
                    opacity: opacity.clamp(0.0, 1.0),
                    child: Text(_popupText, style: AppTypography.storageFreed),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

// ── Pill widget ───────────────────────────────────────────────────────────────

class _HudPill extends StatelessWidget {
  const _HudPill({
    required this.icon,
    required this.label,
    this.color = AppColors.textSecondary,
  });

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTokens.spaceSM,
        vertical: AppTokens.spaceXS,
      ),
      decoration: BoxDecoration(
        color: AppColors.hudBackground,
        borderRadius: BorderRadius.circular(AppTokens.radiusSM),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Text(label, style: AppTypography.hudLabel),
        ],
      ),
    );
  }
}
