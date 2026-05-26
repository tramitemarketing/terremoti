import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
        SwipeSessionPhase.result => const _ResultPlaceholder(),
        // reviewDecideLater, reviewTrash, confirmDelete,
        // processingDelete, smartReview — wired in steps 7+
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
    final canUndo = ref.watch(
      swipeSessionProvider
          .select((s) => s.undoAssetId != null && !s.isAnimating),
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
