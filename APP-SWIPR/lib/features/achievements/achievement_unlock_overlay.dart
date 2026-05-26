import 'dart:async';

import 'package:flutter/material.dart';

import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_tokens.dart';
import '../../shared/theme/app_typography.dart';
import 'achievement_definitions.dart';

/// Slide-up overlay that celebrates newly unlocked achievements.
///
/// ## Behaviour
///
/// - Slides up from the bottom with a spring animation.
/// - Auto-dismisses after [_kAutoDismissSeconds] seconds.
/// - A tap anywhere on the card dismisses immediately.
/// - If more than one achievement was unlocked, the card becomes a swipable
///   [PageView] — the user can swipe horizontally between them.
/// - Does NOT block the parent screen — must be placed in a [Stack] above
///   the recap content, not shown as a modal route.
///
/// ## Usage
///
/// ```dart
/// Stack(
///   children: [
///     RecapContent(),
///     if (unlockedIds.isNotEmpty)
///       AchievementUnlockOverlay(unlockedIds: unlockedIds),
///   ],
/// )
/// ```
class AchievementUnlockOverlay extends StatefulWidget {
  const AchievementUnlockOverlay({
    super.key,
    required this.unlockedIds,
  });

  /// Achievement IDs unlocked in the current session. Must be non-empty.
  final List<String> unlockedIds;

  @override
  State<AchievementUnlockOverlay> createState() =>
      _AchievementUnlockOverlayState();
}

const int _kAutoDismissSeconds = 4;

class _AchievementUnlockOverlayState extends State<AchievementUnlockOverlay>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<Offset> _slideAnimation;
  late final Animation<double> _fadeAnimation;

  Timer? _autoDismissTimer;
  bool _dismissed = false;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 380),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 1.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutBack));

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
    );

    _controller.forward();

    _autoDismissTimer = Timer(
      const Duration(seconds: _kAutoDismissSeconds),
      _dismiss,
    );
  }

  @override
  void dispose() {
    _autoDismissTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _dismiss() async {
    if (_dismissed) return;
    _dismissed = true;
    _autoDismissTimer?.cancel();
    await _controller.reverse();
    // No setState needed — parent will remove the widget based on
    // its own visibility logic (or this widget simply stays invisible).
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: AppTokens.spaceMD,
      right: AppTokens.spaceMD,
      bottom: AppTokens.spaceXL,
      child: FadeTransition(
        opacity: _fadeAnimation,
        child: SlideTransition(
          position: _slideAnimation,
          child: GestureDetector(
            onTap: _dismiss,
            behavior: HitTestBehavior.opaque,
            child: widget.unlockedIds.length == 1
                ? _AchievementCard(id: widget.unlockedIds.first)
                : _AchievementCarousel(ids: widget.unlockedIds),
          ),
        ),
      ),
    );
  }
}

// ── Single card ───────────────────────────────────────────────────────────────

class _AchievementCard extends StatelessWidget {
  const _AchievementCard({required this.id});

  final String id;

  @override
  Widget build(BuildContext context) {
    final meta = achievementCatalog[id];
    if (meta == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTokens.spaceLG,
        vertical: AppTokens.spaceMD,
      ),
      decoration: BoxDecoration(
        color: AppColors.backgroundCard,
        borderRadius: BorderRadius.circular(AppTokens.radiusLG),
        border: Border.all(
          color: AppColors.keepGreen,
          width: 1.5,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x33000000),
            blurRadius: 24,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: _CardContent(meta: meta),
    );
  }
}

// ── Carousel (multiple achievements) ─────────────────────────────────────────

class _AchievementCarousel extends StatefulWidget {
  const _AchievementCarousel({required this.ids});

  final List<String> ids;

  @override
  State<_AchievementCarousel> createState() => _AchievementCarouselState();
}

class _AchievementCarouselState extends State<_AchievementCarousel> {
  int _currentPage = 0;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: 140,
          child: PageView.builder(
            itemCount: widget.ids.length,
            onPageChanged: (i) => setState(() => _currentPage = i),
            itemBuilder: (_, i) => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: _AchievementCard(id: widget.ids[i]),
            ),
          ),
        ),
        const SizedBox(height: AppTokens.spaceSM),
        _PageDots(
          count: widget.ids.length,
          current: _currentPage,
        ),
      ],
    );
  }
}

class _PageDots extends StatelessWidget {
  const _PageDots({required this.count, required this.current});

  final int count;
  final int current;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(count, (i) {
        final active = i == current;
        return AnimatedContainer(
          duration: AppTokens.backgroundFadeSpeed,
          margin: const EdgeInsets.symmetric(horizontal: 3),
          width: active ? 16 : 6,
          height: 6,
          decoration: BoxDecoration(
            color: active ? AppColors.keepGreen : AppColors.textSecondary,
            borderRadius: BorderRadius.circular(3),
          ),
        );
      }),
    );
  }
}

// ── Card content ──────────────────────────────────────────────────────────────

class _CardContent extends StatelessWidget {
  const _CardContent({required this.meta});

  final AchievementMeta meta;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          meta.emoji,
          style: const TextStyle(fontSize: 40),
        ),
        const SizedBox(width: AppTokens.spaceMD),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Achievement sbloccato',
                style: AppTypography.caption.copyWith(
                  color: AppColors.keepGreen,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                meta.name,
                style: AppTypography.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Text(
                meta.description,
                style: AppTypography.caption.copyWith(
                  color: AppColors.textSecondary,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
