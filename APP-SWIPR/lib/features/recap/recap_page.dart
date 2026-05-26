import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/storage/isar_models.dart';
import '../../router.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_tokens.dart';
import '../../shared/theme/app_typography.dart';
import '../achievements/achievement_definitions.dart';
import '../achievements/achievement_unlock_overlay.dart';

/// Session summary screen shown after every completed swipe session.
///
/// Receives [SessionStats] via [GoRouterState.extra]. If [stats] is null
/// (e.g. deep-link edge case), sensible zero-value defaults are shown.
///
/// Layout order (§20):
///   1. Hero — big emoji + MB freed
///   2. Photos trashed count
///   3. [AchievementUnlockOverlay] — slide-up, non-blocking
///   4. Secondary stats grid
///   5. Ironic one-liner
///   6. Action row — share + done
class RecapPage extends StatefulWidget {
  const RecapPage({super.key, required this.stats});

  final SessionStats? stats;

  @override
  State<RecapPage> createState() => _RecapPageState();
}

class _RecapPageState extends State<RecapPage>
    with SingleTickerProviderStateMixin {
  final GlobalKey _shareCardKey = GlobalKey();

  late final AnimationController _enterController;
  late final Animation<double> _enterFade;
  late final Animation<Offset> _enterSlide;

  bool _isSharing = false;

  SessionStats get _stats =>
      widget.stats ??
      const SessionStats(
        keptCount: 0,
        trashedCount: 0,
        decideLaterCount: 0,
        mbFreed: 0,
        sessionDuration: Duration.zero,
        skippedCloudCount: 0,
        smartFlaggedCount: 0,
        unlockedAchievementIds: [],
      );

  @override
  void initState() {
    super.initState();
    _enterController = AnimationController(
      vsync: this,
      duration: AppTokens.recapEnterDuration,
    );
    _enterFade = CurvedAnimation(
      parent: _enterController,
      curve: Curves.easeOut,
    );
    _enterSlide = Tween<Offset>(
      begin: const Offset(0, 0.06),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _enterController, curve: Curves.easeOut));

    _enterController.forward();
  }

  @override
  void dispose() {
    _enterController.dispose();
    super.dispose();
  }

  // ── Share ──────────────────────────────────────────────────────────────────

  Future<void> _onShare() async {
    if (_isSharing) return;
    setState(() => _isSharing = true);

    try {
      final boundary = _shareCardKey.currentContext
          ?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) throw Exception('Share card not rendered');

      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData =
          await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) throw Exception('Image encoding failed');

      final tempDir = await getTemporaryDirectory();
      final file = File('${tempDir.path}/swipr_recap.png');
      await file.writeAsBytes(byteData.buffer.asUint8List());

      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path)],
          text: _shareText(),
        ),
      );
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Impossibile generare la condivisione.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSharing = false);
    }
  }

  String _shareText() {
    final mb = _stats.mbFreed;
    if (mb >= 1024) {
      final gb = (mb / 1024).toStringAsFixed(1);
      return 'Ho liberato $gb GB con Swipr 🧹';
    }
    return 'Ho liberato ${mb.toStringAsFixed(0)} MB con Swipr 🧹';
  }

  void _onDone() => context.go(Routes.modeSelector);

  // ── Ironic one-liner ───────────────────────────────────────────────────────

  String _ironicMessage() {
    final s = _stats;
    final total = s.keptCount + s.trashedCount;

    if (s.mbFreed >= 1024) return 'La tua galleria respira di nuovo.';
    if (total > 0 && s.trashedCount / total >= 0.80) {
      return 'Nessuna pietà. Il tuo telefono ti ama.';
    }
    if (s.trashedCount >= 200) return 'Massacro digitale completato.';
    if (s.decideLaterCount == 0 && total > 0) {
      return 'Zero rimandi. Sei un mito.';
    }
    if (s.smartFlaggedCount > 0) {
      return 'Foto salvate dalla mediocrità.';
    }
    return 'La tua galleria si sente più leggera.';
  }

  // ── Hero label ─────────────────────────────────────────────────────────────

  String _mbLabel() {
    final mb = _stats.mbFreed;
    if (mb >= 1024) return '${(mb / 1024).toStringAsFixed(1)} GB liberati';
    return '${mb.toStringAsFixed(0)} MB liberati';
  }

  String _heroEmoji() {
    final mb = _stats.mbFreed;
    if (mb >= 1024) return '🏆';
    if (mb >= 500) return '🚀';
    if (_stats.trashedCount >= 100) return '🧹';
    return '✨';
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final stats = _stats;
    final hasAchievements = stats.unlockedAchievementIds.isNotEmpty;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // ── Scrollable content ─────────────────────────────────────────────
          SafeArea(
            child: FadeTransition(
              opacity: _enterFade,
              child: SlideTransition(
                position: _enterSlide,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTokens.spaceLG,
                    vertical: AppTokens.spaceXL,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // 1. Hero ───────────────────────────────────────────────
                      _HeroSection(
                        emoji: _heroEmoji(),
                        mbLabel: _mbLabel(),
                        shareCardKey: _shareCardKey,
                        stats: stats,
                      ),
                      const SizedBox(height: AppTokens.spaceMD),

                      // 2. Trashed count ──────────────────────────────────────
                      Text(
                        '${stats.trashedCount} foto eliminate',
                        style: AppTypography.displayMedium,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: AppTokens.spaceXL),

                      // 3. Achievement overlay placeholder — handled in Stack.
                      // Extra spacing so content doesn't hide behind overlay
                      // when achievements are unlocked.
                      if (hasAchievements)
                        const SizedBox(height: 80),

                      // 4. Secondary stats ────────────────────────────────────
                      _SecondaryStats(stats: stats),
                      const SizedBox(height: AppTokens.spaceXL),

                      // 5. Ironic one-liner ───────────────────────────────────
                      Text(
                        _ironicMessage(),
                        style: AppTypography.body.copyWith(
                          color: AppColors.textSecondary,
                          fontStyle: FontStyle.italic,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: AppTokens.spaceXL),

                      // 6. Action row ─────────────────────────────────────────
                      _ActionRow(
                        isSharing: _isSharing,
                        onShare: _onShare,
                        onDone: _onDone,
                      ),
                      const SizedBox(height: AppTokens.spaceLG),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // ── Achievement overlay — non-blocking ─────────────────────────────
          if (hasAchievements)
            AchievementUnlockOverlay(
              unlockedIds: stats.unlockedAchievementIds,
            ),
        ],
      ),
    );
  }
}

// ── Hero section ──────────────────────────────────────────────────────────────

class _HeroSection extends StatelessWidget {
  const _HeroSection({
    required this.emoji,
    required this.mbLabel,
    required this.shareCardKey,
    required this.stats,
  });

  final String emoji;
  final String mbLabel;
  final GlobalKey shareCardKey;
  final SessionStats stats;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // RepaintBoundary captures the share card — rendered off-screen below.
        RepaintBoundary(
          key: shareCardKey,
          child: _ShareCard(emoji: emoji, mbLabel: mbLabel, stats: stats),
        ),
        Text(emoji, style: const TextStyle(fontSize: 64)),
        const SizedBox(height: AppTokens.spaceSM),
        Text(
          mbLabel,
          style: AppTypography.displayMedium,
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

// ── Share card (captured for image export) ────────────────────────────────────

/// Hidden widget rendered off-screen; captured as PNG for sharing.
class _ShareCard extends StatelessWidget {
  const _ShareCard({
    required this.emoji,
    required this.mbLabel,
    required this.stats,
  });

  final String emoji;
  final String mbLabel;
  final SessionStats stats;

  @override
  Widget build(BuildContext context) {
    final firstAchievementId = stats.unlockedAchievementIds.isNotEmpty
        ? stats.unlockedAchievementIds.first
        : null;
    final achievementMeta =
        firstAchievementId != null ? achievementCatalog[firstAchievementId] : null;

    return SizedBox(
      width: 320,
      child: Offstage(
        offstage: true,
        child: Container(
          padding: const EdgeInsets.all(AppTokens.spaceLG),
          decoration: BoxDecoration(
            color: AppColors.backgroundCard,
            borderRadius: BorderRadius.circular(AppTokens.radiusLG),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(emoji, style: const TextStyle(fontSize: 48)),
              const SizedBox(height: AppTokens.spaceSM),
              Text(mbLabel, style: AppTypography.displayMedium),
              const SizedBox(height: AppTokens.spaceXS),
              Text(
                '${stats.trashedCount} foto eliminate',
                style: AppTypography.body,
              ),
              if (achievementMeta != null) ...[
                const SizedBox(height: AppTokens.spaceSM),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(achievementMeta.emoji,
                        style: const TextStyle(fontSize: 20)),
                    const SizedBox(width: AppTokens.spaceXS),
                    Text(achievementMeta.name, style: AppTypography.caption),
                  ],
                ),
              ],
              const SizedBox(height: AppTokens.spaceSM),
              Text(
                'Swipr',
                style: AppTypography.caption.copyWith(
                  color: AppColors.textSecondary,
                  letterSpacing: 2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Secondary stats ───────────────────────────────────────────────────────────

class _SecondaryStats extends StatelessWidget {
  const _SecondaryStats({required this.stats});

  final SessionStats stats;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppTokens.spaceMD),
      decoration: BoxDecoration(
        color: AppColors.backgroundCard,
        borderRadius: BorderRadius.circular(AppTokens.radiusMD),
      ),
      child: Column(
        children: [
          _StatRow(
            label: 'Foto tenute',
            value: '${stats.keptCount}',
          ),
          if (stats.decideLaterCount > 0) ...[
            const _Divider(),
            _StatRow(
              label: 'Rimesse in decide later',
              value: '${stats.decideLaterCount}',
            ),
          ],
          if (stats.skippedCloudCount > 0) ...[
            const _Divider(),
            _StatRow(
              label: 'Foto iCloud saltate',
              value: '${stats.skippedCloudCount}',
            ),
          ],
          if (stats.smartFlaggedCount > 0) ...[
            const _Divider(),
            _StatRow(
              label: 'Trovate da Smart Review',
              value: '${stats.smartFlaggedCount}',
            ),
          ],
        ],
      ),
    );
  }
}

class _StatRow extends StatelessWidget {
  const _StatRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppTokens.spaceXS),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: AppTypography.body.copyWith(
                color: AppColors.textSecondary,
              )),
          Text(value, style: AppTypography.title),
        ],
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  const _Divider();

  @override
  Widget build(BuildContext context) {
    return Divider(
      height: 1,
      thickness: 1,
      color: AppColors.textSecondary.withValues(alpha: 0.12),
    );
  }
}

// ── Action row ────────────────────────────────────────────────────────────────

class _ActionRow extends StatelessWidget {
  const _ActionRow({
    required this.isSharing,
    required this.onShare,
    required this.onDone,
  });

  final bool isSharing;
  final VoidCallback onShare;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: isSharing ? null : onShare,
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.textPrimary,
              side: BorderSide(color: AppColors.textSecondary.withValues(alpha: 0.4)),
              padding: const EdgeInsets.symmetric(vertical: AppTokens.spaceMD),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppTokens.radiusSM),
              ),
            ),
            child: isSharing
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text('Condividi risultati', style: AppTypography.body),
          ),
        ),
        const SizedBox(width: AppTokens.spaceMD),
        Expanded(
          child: FilledButton(
            onPressed: onDone,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.keepGreen,
              foregroundColor: AppColors.background,
              padding: const EdgeInsets.symmetric(vertical: AppTokens.spaceMD),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppTokens.radiusSM),
              ),
            ),
            child: Text('Fine', style: AppTypography.body),
          ),
        ),
      ],
    );
  }
}
