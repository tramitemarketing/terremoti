import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_tokens.dart';
import '../../../shared/theme/app_typography.dart';
import '../../session/session_state/swipe_session_provider.dart';

/// Floating heads-up display shown during a swipe session.
///
/// Three-column layout:
/// - Left:   Trash count + "Trash" label (red)
/// - Centre: Photos processed + MB to be freed
/// - Right:  Decide-later count + "Saved" label (green)
///
/// A "+X MB" float-up animation fires whenever the trash queue grows.
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
    ref.listen(
      sessionStatsProvider.select((s) => s.mbFreed),
      (prev, next) {
        final delta = next - (prev ?? 0);
        if (delta > 0) _showPopup(delta);
      },
    );

    final stats = ref.watch(sessionStatsProvider);
    final photoCount = ref.watch(
      swipeSessionProvider.select((s) => s.currentIndex),
    );

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
            // ── Left: Trash count ─────────────────────────────────────────
            _HudStat(
              value: '${stats.trashedCount}',
              label: 'Trash',
              color: AppColors.trashRed,
              align: CrossAxisAlignment.start,
            ),

            // ── Centre: photo count + MB freed ────────────────────────────
            Expanded(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '$photoCount foto',
                        style: AppTypography.caption.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      Text(
                        mbLabel,
                        style: AppTypography.title.copyWith(
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  // "+X MB" float-up animation
                  AnimatedBuilder(
                    animation: _popup,
                    builder: (_, __) {
                      final t = _popup.value;
                      final opacity = t < 0.25
                          ? t / 0.25
                          : t > 0.65
                              ? 1.0 - (t - 0.65) / 0.35
                              : 1.0;
                      return Transform.translate(
                        offset: Offset(0, -28.0 * t),
                        child: Opacity(
                          opacity: opacity.clamp(0.0, 1.0),
                          child: Text(
                            _popupText,
                            style: AppTypography.storageFreed,
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),

            // ── Right: Decide-later count ─────────────────────────────────
            _HudStat(
              value: '${stats.decideLaterCount}',
              label: 'Saved',
              color: AppColors.keepGreen,
              align: CrossAxisAlignment.end,
            ),
          ],
        ),
      ),
    );
  }
}

// ── HUD stat column ───────────────────────────────────────────────────────────

class _HudStat extends StatelessWidget {
  const _HudStat({
    required this.value,
    required this.label,
    required this.color,
    required this.align,
  });

  final String value;
  final String label;
  final Color color;
  final CrossAxisAlignment align;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 56,
      child: Column(
        crossAxisAlignment: align,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            value,
            style: AppTypography.hudLabel.copyWith(
              color: color,
              fontSize: 20,
              fontWeight: FontWeight.w600,
            ),
          ),
          Text(
            label,
            style: AppTypography.caption.copyWith(
              color: color.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }
}
