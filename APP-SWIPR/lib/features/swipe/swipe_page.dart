import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:photo_manager/photo_manager.dart';

import '../../core/storage/isar_models.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_tokens.dart';
import '../../shared/theme/app_typography.dart';
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
    final phase = ref.watch(swipeSessionProvider.select((s) => s.phase));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: switch (phase) {
        SwipeSessionPhase.loading => const _LoadingView(),
        SwipeSessionPhase.ready ||
        SwipeSessionPhase.swiping ||
        SwipeSessionPhase.animating ||
        SwipeSessionPhase.paused =>
          const _SwipingView(),
        SwipeSessionPhase.reviewTrash ||
        SwipeSessionPhase.confirmDelete ||
        SwipeSessionPhase.processingDelete =>
          const _TrashReviewStub(),
        SwipeSessionPhase.result => const _ResultPlaceholder(),
        // reviewDecideLater, smartReview — wired in steps 7+
        _ => const _LoadingView(),
      },
    );
  }
}

// ── Active swipe view ─────────────────────────────────────────────────────────

class _SwipingView extends ConsumerWidget {
  const _SwipingView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final (canUndo, canEnd) = ref.watch(
      swipeSessionProvider.select((s) => (
        s.undoAssetId != null && !s.isAnimating,
        !s.isAnimating &&
            (s.phase == SwipeSessionPhase.swiping ||
             s.phase == SwipeSessionPhase.ready),
      )),
    );

    return Stack(
      fit: StackFit.expand,
      children: [
        // Card stack fills the available area.
        const CardStackWidget(),

        // HUD overlaid at the top.
        const Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: SessionHud(),
        ),

        // "Fine" button — top-right, visible only while swiping.
        if (canEnd)
          Positioned(
            top: 0,
            right: 0,
            child: SafeArea(
              child: _EndSessionButton(),
            ),
          ),

        // Undo button — shown only when a reversible action exists.
        if (canUndo)
          Positioned(
            bottom: 48,
            left: 0,
            right: 0,
            child: Center(child: _UndoButton()),
          ),
      ],
    );
  }
}

class _EndSessionButton extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: () {
        final phase = ref.read(swipeSessionProvider).phase;
        debugPrint('[UI] Fine button tapped, phase: $phase');
        ref.read(swipeSessionProvider.notifier).endSession();
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppTokens.spaceMD,
          vertical: AppTokens.spaceSM,
        ),
        child: Text(
          'Fine',
          style: AppTypography.caption.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _UndoButton extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: () => ref.read(swipeSessionProvider.notifier).undoLastSwipe(),
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppTokens.spaceLG,
          vertical: AppTokens.spaceSM,
        ),
        decoration: BoxDecoration(
          color: AppColors.backgroundSurface,
          borderRadius: BorderRadius.circular(AppTokens.radiusMD),
          border: Border.all(color: AppColors.border),
        ),
        child: Text('Annulla', style: AppTypography.caption),
      ),
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
                  debugPrint('[UI] Elimina tutto tapped');
                  final ids = session.trashQueue;
                  notifier.requestBatchDelete();
                  notifier.confirmBatchDelete();
                  debugPrint('[Delete] calling PhotoManager.deleteWithIds, count: ${ids.length}');
                  try {
                    await PhotoManager.editor.deleteWithIds(ids);
                    debugPrint('[Delete] deletion complete');
                  } catch (e) {
                    debugPrint('[Delete] deletion error: $e');
                  }
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

class _LoadingView extends StatelessWidget {
  const _LoadingView();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: CircularProgressIndicator(
        color: AppColors.textSecondary,
        strokeWidth: 1.5,
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
