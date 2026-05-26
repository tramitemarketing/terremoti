import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:photo_manager/photo_manager.dart';

import '../../router.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_tokens.dart';
import '../../shared/theme/app_typography.dart';
import '../session/session_state/swipe_session_provider.dart';
import 'smart_detection_engine.dart';
import 'smart_flags_provider.dart';

/// Smart review page — shown after batch deletion when flagged assets exist.
///
/// ## Free tier
/// Displays the flag count and a preview of ONE asset, followed by an
/// upgrade CTA to unlock the full grid.
///
/// ## Premium tier
/// Full scrollable grid: thumbnail + amber flag badge + human-readable label +
/// two actions per asset (Cestina | Tieni comunque).
///
/// ## Navigation
/// "Salta" / "Fine" always present — calls [SwipeSession.finishSmartReview].
/// "Cestina" from here accumulates a local mini-trash queue; on "Fine" the
/// queue is batch-deleted before the session transitions to [result].
class SmartReviewPage extends ConsumerStatefulWidget {
  const SmartReviewPage({super.key});

  @override
  ConsumerState<SmartReviewPage> createState() => _SmartReviewPageState();
}

class _SmartReviewPageState extends ConsumerState<SmartReviewPage> {
  /// Mini trash queue for assets flagged and trashed during smart review.
  final _smartTrash = <String>{};
  bool _isDeleting = false;

  Future<void> _finish() async {
    if (_isDeleting) return;
    setState(() => _isDeleting = true);

    // Batch-delete any assets trashed during smart review.
    if (_smartTrash.isNotEmpty) {
      try {
        await PhotoManager.editor.deleteWithIds(_smartTrash.toList());
      } catch (_) {
        // Partial failure is acceptable — spec §16: never silent failure in
        // recap, but smart-review delete failures do not block navigation.
      }
    }

    if (mounted) {
      await ref.read(swipeSessionProvider.notifier).finishSmartReview();
    }
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final flagsAsync = ref.watch(smartFlagsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: flagsAsync.when(
          loading: () => const Center(
            child: CircularProgressIndicator(
              color: AppColors.textSecondary,
              strokeWidth: 1.5,
            ),
          ),
          error: (_, __) => _ErrorView(onSkip: _finish),
          data: (flags) {
            if (flags.isEmpty) {
              // No flags — this page shouldn't show, but handle gracefully.
              WidgetsBinding.instance
                  .addPostFrameCallback((_) => _finish());
              return const SizedBox.shrink();
            }

            return Column(
              children: [
                _Header(flagCount: flags.length),
                Expanded(
                  // TODO(step-11): switch to _PremiumGrid when isPremium is wired
                  child: _FreeTierView(flags: flags),
                ),
                _BottomBar(
                  trashCount: _smartTrash.length,
                  isDeleting: _isDeleting,
                  onFinish: _finish,
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

// ── Header ────────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({required this.flagCount});

  final int flagCount;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppTokens.spaceMD,
        AppTokens.spaceLG,
        AppTokens.spaceMD,
        AppTokens.spaceMD,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Foto da controllare', style: AppTypography.displayMedium),
          const SizedBox(height: AppTokens.spaceXS),
          Text(
            '$flagCount ${flagCount == 1 ? 'foto segnalata' : 'foto segnalate'}',
            style: AppTypography.body,
          ),
        ],
      ),
    );
  }
}

// ── Free tier ─────────────────────────────────────────────────────────────────

class _FreeTierView extends StatelessWidget {
  const _FreeTierView({required this.flags});

  final List<SmartFlag> flags;

  @override
  Widget build(BuildContext context) {
    // Group counts by flag type.
    final blurCount = flags.where((f) => f.flagType == 'blur').length;
    final lowQCount = flags.where((f) => f.flagType == 'low_quality').length;

    // Pick ONE preview asset (first flag in list).
    final previewId = flags.first.assetId;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppTokens.spaceMD),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Summary bullets
          if (blurCount > 0)
            _SummaryBullet(
              label: '$blurCount ${blurCount == 1 ? 'foto sembra sfocata' : 'foto sembrano sfocate'}',
            ),
          if (lowQCount > 0)
            _SummaryBullet(
              label: '$lowQCount ${lowQCount == 1 ? 'foto è di bassa qualità' : 'foto sono di bassa qualità'}',
            ),

          const SizedBox(height: AppTokens.spaceLG),

          // One preview asset
          Text('Anteprima', style: AppTypography.caption),
          const SizedBox(height: AppTokens.spaceSM),
          AspectRatio(
            aspectRatio: 1,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(AppTokens.radiusMD),
              child: _FlaggedThumbnail(
                assetId: previewId,
                flagType: flags.first.flagType,
              ),
            ),
          ),

          const SizedBox(height: AppTokens.spaceLG),

          // Upgrade CTA
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppTokens.spaceMD),
            decoration: BoxDecoration(
              color: AppColors.backgroundSurface,
              borderRadius: BorderRadius.circular(AppTokens.radiusMD),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Vedi tutte le foto segnalate',
                  style: AppTypography.title,
                ),
                const SizedBox(height: AppTokens.spaceXS),
                Text(
                  'Passa a Premium per rivedere ogni foto flaggata e decidere una per una.',
                  style: AppTypography.body,
                ),
                const SizedBox(height: AppTokens.spaceMD),
                GestureDetector(
                  onTap: () => context.push(Routes.paywall),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppTokens.spaceMD,
                      vertical: AppTokens.spaceSM,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.flagAmber,
                      borderRadius: BorderRadius.circular(AppTokens.radiusSM),
                    ),
                    child: Text(
                      'Passa a Premium',
                      style: AppTypography.caption.copyWith(
                        color: AppColors.background,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: AppTokens.spaceLG),
        ],
      ),
    );
  }
}

class _SummaryBullet extends StatelessWidget {
  const _SummaryBullet({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppTokens.spaceXS),
      child: Row(
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: const BoxDecoration(
              color: AppColors.flagAmber,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: AppTokens.spaceSM),
          Text(label, style: AppTypography.body),
        ],
      ),
    );
  }
}

// ── Flagged thumbnail ─────────────────────────────────────────────────────────

/// Thumbnail with an amber flag badge in the top-left corner.
class _FlaggedThumbnail extends StatefulWidget {
  const _FlaggedThumbnail({required this.assetId, required this.flagType});

  final String assetId;
  final String flagType;

  @override
  State<_FlaggedThumbnail> createState() => _FlaggedThumbnailState();
}

class _FlaggedThumbnailState extends State<_FlaggedThumbnail> {
  Future<AssetEntity?>? _future;

  @override
  void initState() {
    super.initState();
    _future = AssetEntity.fromId(widget.assetId);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<AssetEntity?>(
      future: _future,
      builder: (context, snap) {
        final asset = snap.data;
        return Stack(
          fit: StackFit.expand,
          children: [
            // Image
            if (asset != null)
              FutureBuilder<Uint8List?>(
                future: asset.thumbnailDataWithSize(
                  const ThumbnailSize(400, 400),
                ),
                builder: (context, snap) {
                  final bytes = snap.data;
                  if (bytes == null) return const SizedBox.shrink();
                  return Image.memory(bytes, fit: BoxFit.cover);
                },
              )
            else
              Container(color: AppColors.backgroundSurface),

            // Amber flag badge
            Positioned(
              top: 6,
              left: 6,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.flagAmber,
                  borderRadius: BorderRadius.circular(AppTokens.radiusSM),
                ),
                child: Text(
                  _badgeLabel(widget.flagType),
                  style: AppTypography.caption.copyWith(
                    color: AppColors.background,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  static String _badgeLabel(String flagType) => switch (flagType) {
        'blur'           => '⚡ Sfocata',
        'low_quality'    => '↓ Qualità',
        'duplicate'      => '⊕ Dup.',
        'near_duplicate' => '≈ Simile',
        _                => flagType,
      };
}

// ── Bottom bar ────────────────────────────────────────────────────────────────

class _BottomBar extends StatelessWidget {
  const _BottomBar({
    required this.trashCount,
    required this.isDeleting,
    required this.onFinish,
  });

  final int trashCount;
  final bool isDeleting;
  final VoidCallback onFinish;

  @override
  Widget build(BuildContext context) {
    final label = trashCount > 0
        ? 'Elimina $trashCount ${trashCount == 1 ? 'foto' : 'foto'} e Fine'
        : 'Fine';

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppTokens.spaceMD,
        AppTokens.spaceSM,
        AppTokens.spaceMD,
        AppTokens.spaceLG,
      ),
      child: Row(
        children: [
          // Skip — always available
          GestureDetector(
            onTap: isDeleting ? null : onFinish,
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppTokens.spaceMD,
                vertical: AppTokens.spaceSM,
              ),
              child: Text('Salta', style: AppTypography.body),
            ),
          ),
          const Spacer(),
          // Finish / delete CTA
          GestureDetector(
            onTap: isDeleting ? null : onFinish,
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppTokens.spaceLG,
                vertical: AppTokens.spaceSM,
              ),
              decoration: BoxDecoration(
                color: trashCount > 0 ? AppColors.trashRed : AppColors.backgroundSurface,
                borderRadius: BorderRadius.circular(AppTokens.radiusMD),
                border: trashCount == 0
                    ? Border.all(color: AppColors.border)
                    : null,
              ),
              child: isDeleting
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 1.5,
                      ),
                    )
                  : Text(
                      label,
                      style: AppTypography.caption.copyWith(
                        color: trashCount > 0
                            ? Colors.white
                            : AppColors.textPrimary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Error view ────────────────────────────────────────────────────────────────

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.onSkip});

  final VoidCallback onSkip;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Analisi non disponibile.',
            style: AppTypography.body,
          ),
          const SizedBox(height: AppTokens.spaceMD),
          GestureDetector(
            onTap: onSkip,
            child: Text('Salta', style: AppTypography.body.copyWith(
              color: AppColors.textPrimary,
            )),
          ),
        ],
      ),
    );
  }
}
