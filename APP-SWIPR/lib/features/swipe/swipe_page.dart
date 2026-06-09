import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:photo_manager/photo_manager.dart';

import '../../core/storage/isar_models.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_tokens.dart';
import '../../shared/theme/app_typography.dart';
import '../../shared/widgets/swipr_logo.dart';
import '../session/session_state/swipe_session_provider.dart';
import 'card_stack/card_stack_widget.dart';
import 'hud/session_hud.dart';

/// Root page for a swipe session.
///
/// Receives a [SwipeFilter] from the router's `state.extra` and calls
/// [SwipeSession.startSession] after the first frame. Phase transitions
/// drive which sub-view is shown.
///
/// Navigation to [Routes.recap] is wired here once [SwipeSessionPhase.result]
/// is reached (TODO(step-6) in [SwipeSession._transitionToResult] must be
/// uncommented when this page is ready — see swipe_session_provider.dart).
class SwipePage extends ConsumerStatefulWidget {
  const SwipePage({super.key, required this.filter});

  final SwipeFilter filter;

  @override
  ConsumerState<SwipePage> createState() => _SwipePageState();
}

class _SwipePageState extends ConsumerState<SwipePage> {
  @override
  void initState() {
    super.initState();
    // Defer past the first frame so the ProviderScope tree is fully ready.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        ref.read(swipeSessionProvider.notifier).startSession(widget.filter);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    // Collapse ready/swiping/animating/paused into a single canonical value
    // so transitions between those phases never trigger a rebuild of SwipePage
    // (and therefore never cause a Scaffold layout pass during a fly-off).
    final phase = ref.watch(swipeSessionProvider.select((s) {
      final p = s.phase;
      if (p == SwipeSessionPhase.ready ||
          p == SwipeSessionPhase.swiping ||
          p == SwipeSessionPhase.animating ||
          p == SwipeSessionPhase.paused) {
        return SwipeSessionPhase.swiping;
      }
      return p;
    }));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: switch (phase) {
        SwipeSessionPhase.loading => const _LoadingView(),
        SwipeSessionPhase.swiping => const _SwipingView(),
        SwipeSessionPhase.reviewDecideLater => _DecideLaterReviewStub(
          assets: ref.watch(
            swipeSessionProvider.select((s) => s.decideLaterQueue),
          ),
          onKeep: (id) =>
              ref.read(swipeSessionProvider.notifier).keepFromLater(id),
          onTrash: (id) =>
              ref.read(swipeSessionProvider.notifier).trashFromLater(id),
          onDone: () =>
              ref.read(swipeSessionProvider.notifier).finishDecideLaterReview(),
        ),
        SwipeSessionPhase.reviewTrash ||
        SwipeSessionPhase.confirmDelete ||
        SwipeSessionPhase.processingDelete =>
          const _TrashReviewStub(),
        SwipeSessionPhase.result => const _ResultPlaceholder(),
        // smartReview — wired in a later step
        _ => const _LoadingView(),
      },
    );
  }
}

// ── Active swipe view ─────────────────────────────────────────────────────────

/// Pure layout widget — no ref.watch, never rebuilds due to provider changes.
/// HUD and Fine manage their own rebuild cycles independently.
class _SwipingView extends StatelessWidget {
  const _SwipingView();

  @override
  Widget build(BuildContext context) {
    return const Stack(
      fit: StackFit.expand,
      children: [
        CardStackWidget(),
        // HUD — ConsumerStatefulWidget, rebuilds only on stats changes.
        Positioned(top: 0, left: 0, right: 0, child: SessionHud()),
        // Fine — isolated behind RepaintBoundary so its rebuilds never
        // propagate up to the card stack layer.
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: RepaintBoundary(child: _FineButtonLayer()),
        ),
        // Undo circle lives inside SwipeCard and moves with the card.
      ],
    );
  }
}

/// Fine button layer isolated from the card stack so swipe gestures and
/// animation frames never trigger a rebuild here.
class _FineButtonLayer extends ConsumerWidget {
  const _FineButtonLayer();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final visible = ref.watch(
      swipeSessionProvider.select((s) =>
          s.phase != SwipeSessionPhase.loading &&
          s.phase != SwipeSessionPhase.result &&
          s.phase != SwipeSessionPhase.reviewDecideLater &&
          s.phase != SwipeSessionPhase.reviewTrash &&
          s.phase != SwipeSessionPhase.confirmDelete &&
          s.phase != SwipeSessionPhase.processingDelete &&
          s.phase != SwipeSessionPhase.smartReview),
    );
    if (!visible) return const SizedBox.shrink();
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          AppTokens.spaceMD,
          AppTokens.spaceSM,
          AppTokens.spaceMD,
          AppTokens.spaceMD,
        ),
        child: _EndSessionButton(),
      ),
    );
  }
}

class _EndSessionButton extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: () => ref.read(swipeSessionProvider.notifier).endSession(),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.keepGreen,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: AppTokens.spaceMD),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppTokens.radiusMD),
          ),
          elevation: 0,
        ),
        child: const Text(
          'FINE',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 15,
            letterSpacing: 2.5,
          ),
        ),
      ),
    );
  }
}


// ── Decide-later review stub ──────────────────────────────────────────────────

class _DecideLaterReviewStub extends StatelessWidget {
  const _DecideLaterReviewStub({
    required this.assets,
    required this.onKeep,
    required this.onTrash,
    required this.onDone,
  });

  final List<String> assets;
  final void Function(String id) onKeep;
  final void Function(String id) onTrash;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(AppTokens.spaceMD),
              child: Text(
                'Rivedi le foto "Decidi dopo"',
                style: AppTypography.displayMedium,
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: assets.length,
                itemBuilder: (context, index) {
                  final id = assets[index];
                  return _DecideLaterRow(
                    assetId: id,
                    onKeep: () => onKeep(id),
                    onTrash: () => onTrash(id),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(AppTokens.spaceMD),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: onDone,
                  child: const Text('Fine'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DecideLaterRow extends StatelessWidget {
  const _DecideLaterRow({
    required this.assetId,
    required this.onKeep,
    required this.onTrash,
  });

  final String assetId;
  final VoidCallback onKeep;
  final VoidCallback onTrash;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<AssetEntity?>(
      future: AssetEntity.fromId(assetId),
      builder: (context, snap) {
        final asset = snap.data;
        return Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppTokens.spaceMD,
            vertical: AppTokens.spaceSM,
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(AppTokens.radiusSM),
                child: asset != null
                    ? FutureBuilder<Uint8List?>(
                        future: asset.thumbnailDataWithSize(
                          const ThumbnailSize(80, 80),
                        ),
                        builder: (context, thumbSnap) {
                          final bytes = thumbSnap.data;
                          if (bytes == null) {
                            return const _ThumbPlaceholder();
                          }
                          return Image.memory(
                            bytes,
                            width: 64,
                            height: 64,
                            fit: BoxFit.cover,
                          );
                        },
                      )
                    : const _ThumbPlaceholder(),
              ),
              const SizedBox(width: AppTokens.spaceMD),
              Expanded(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: onKeep,
                      child: Text(
                        'Tieni',
                        style: AppTypography.caption.copyWith(
                          color: AppColors.keepGreen,
                        ),
                      ),
                    ),
                    const SizedBox(width: AppTokens.spaceSM),
                    TextButton(
                      onPressed: onTrash,
                      child: Text(
                        'Cestina',
                        style: AppTypography.caption.copyWith(
                          color: AppColors.trashRed,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ThumbPlaceholder extends StatelessWidget {
  const _ThumbPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 64,
      height: 64,
      color: AppColors.backgroundCard,
    );
  }
}

// ── Trash review stub ─────────────────────────────────────────────────────────

class _TrashReviewStub extends ConsumerWidget {
  const _TrashReviewStub();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(swipeSessionProvider);
    final notifier = ref.read(swipeSessionProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '${session.trashQueue.length} foto nel cestino',
                style: AppTypography.displayMedium,
              ),
              const SizedBox(height: AppTokens.spaceLG),
              ElevatedButton(
                onPressed: () async {
                  final ids = session.trashQueue;
                  notifier.requestBatchDelete();
                  notifier.confirmBatchDelete();
                  try {
                    await PhotoManager.editor.deleteWithIds(ids);
                  } catch (_) {}
                  await notifier.onDeleteComplete();
                },
                child: const Text('Elimina tutto'),
              ),
              const SizedBox(height: AppTokens.spaceSM),
              TextButton(
                onPressed: () => notifier.endSession(),
                child: Text(
                  'Salta eliminazione',
                  style: AppTypography.body.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Placeholder / loading views ───────────────────────────────────────────────

/// Skeleton shown while startSession() warms the preload cache.
///
/// Renders a pulsing card-shaped placeholder that matches the real card
/// dimensions — avoids the jarring jump from a center spinner to a full card.
class _LoadingView extends StatefulWidget {
  const _LoadingView();

  @override
  State<_LoadingView> createState() => _LoadingViewState();
}

class _LoadingViewState extends State<_LoadingView>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _opacity = Tween<double>(begin: 0.35, end: 0.65).animate(
      CurvedAnimation(parent: _pulse, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    // FIX 1: match CardStackWidget's exact card dimensions so the skeleton
    // sits in the identical position the real card will occupy.
    final cardWidth  = size.width - 48.0;
    final cardHeight = size.height * 0.75;

    return AnimatedBuilder(
      animation: _opacity,
      builder: (_, __) => Opacity(
        opacity: _opacity.value,
        child: Center(
          child: SizedBox(
            width: cardWidth,
            height: cardHeight,
            child: Stack(
              alignment: Alignment.center,
              children: [
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: AppColors.backgroundCard,
                      borderRadius:
                          BorderRadius.circular(AppTokens.radiusCard),
                    ),
                  ),
                ),
                const SwiprLogo(size: 72),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Placeholder until RecapPage is wired in step 10.
class _ResultPlaceholder extends StatelessWidget {
  const _ResultPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        'Sessione completata',
        style: AppTypography.body,
      ),
    );
  }
}
