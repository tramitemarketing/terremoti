import 'dart:math' as math;
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:photo_manager/photo_manager.dart';

import '../../../shared/theme/app_colors.dart';
import '../../../shared/theme/app_tokens.dart';

/// Single card in the swipe stack.
///
/// Visual rules (§11 — non-negotiable):
/// - Image rendered with [BoxFit.contain]. Never [BoxFit.cover].
/// - Gradient overlay proportional to drag: 0.0 at center, max 0.6 at
///   commit threshold. [AppColors] only — no text labels.
/// - Rotation capped at ±15°.
/// - Transforms applied only when [isTop] is true. Background cards
///   (isTop == false) render at Offset.zero, no rotation.
class SwipeCard extends StatelessWidget {
  const SwipeCard({
    super.key,
    required this.asset,
    required this.dragOffset,
    required this.screenSize,
    required this.isTop,
  });

  final AssetEntity asset;

  /// Current cumulative drag offset from the card's resting position.
  /// [Offset.zero] for background cards.
  final Offset dragOffset;

  final Size screenSize;

  /// True only for the front-most (gesture-active) card in the stack.
  final bool isTop;

  // ── Derived visual values ─────────────────────────────────────────────────

  double get _angle {
    if (!isTop) return 0;
    // Scale 0→15° across the full screen width; clamp to ±15° hard cap.
    return (dragOffset.dx / screenSize.width * 15 * math.pi / 180)
        .clamp(-15 * math.pi / 180, 15 * math.pi / 180);
  }

  /// 0.0 → 0.6 proportional to how close the drag is to the commit threshold.
  double get _overlayOpacity {
    if (!isTop) return 0;
    final hRatio = dragOffset.dx.abs() /
        (screenSize.width * AppTokens.swipeCommitThreshold);
    final upDy = -dragOffset.dy; // positive when swiping upward
    final vRatio = upDy > 0
        ? upDy / (screenSize.height * AppTokens.swipeUpThreshold)
        : 0.0;
    return math.max(hRatio, vRatio).clamp(0.0, 0.6);
  }

  Color get _overlayColor {
    // Vertical-up takes priority when dominant axis is upward.
    if (dragOffset.dy < 0 &&
        dragOffset.dy.abs() > dragOffset.dx.abs()) {
      return AppColors.laterBlue;
    }
    return dragOffset.dx >= 0 ? AppColors.keepGreen : AppColors.trashRed;
  }

  _SwipeDir get _swipeDir {
    if (dragOffset.dy < 0 && dragOffset.dy.abs() > dragOffset.dx.abs()) {
      return _SwipeDir.up;
    }
    return dragOffset.dx >= 0 ? _SwipeDir.right : _SwipeDir.left;
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final card = Container(
      decoration: BoxDecoration(
        color: AppColors.backgroundCard,
        borderRadius: BorderRadius.circular(AppTokens.radiusCard),
        boxShadow: const [
          BoxShadow(
            color: Color(0x4D000000),
            blurRadius: 24,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppTokens.radiusCard),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Image — BoxFit.contain is mandatory per §11.
            FutureBuilder<Uint8List?>(
              future: asset.thumbnailDataWithSize(
                const ThumbnailSize(540, 960),
              ),
              builder: (context, snap) {
                final bytes = snap.data;
                if (bytes == null) {
                  return Container(
                    decoration: BoxDecoration(
                      color: AppColors.backgroundCard,
                      borderRadius:
                          BorderRadius.circular(AppTokens.radiusCard),
                    ),
                  );
                }
                return ClipRRect(
                  borderRadius:
                      BorderRadius.circular(AppTokens.radiusCard),
                  child: Image.memory(
                    bytes,
                    fit: BoxFit.contain,
                    gaplessPlayback: true,
                  ),
                );
              },
            ),
            // Gradient overlay — only rendered on top card with non-zero drag.
            if (isTop && _overlayOpacity > 0)
              _SwipeOverlay(
                color: _overlayColor,
                opacity: _overlayOpacity,
                direction: _swipeDir,
              ),
          ],
        ),
      ),
    );

    if (!isTop) return card;

    // Top card: apply translation + rotation driven by drag.
    return Transform.translate(
      offset: dragOffset,
      child: Transform.rotate(
        angle: _angle,
        child: card,
      ),
    );
  }
}

// ── Overlay ───────────────────────────────────────────────────────────────────

enum _SwipeDir { left, right, up }

class _SwipeOverlay extends StatelessWidget {
  const _SwipeOverlay({
    required this.color,
    required this.opacity,
    required this.direction,
  });

  final Color color;
  final double opacity;
  final _SwipeDir direction;

  @override
  Widget build(BuildContext context) {
    final begin = switch (direction) {
      _SwipeDir.right => Alignment.centerLeft,
      _SwipeDir.left  => Alignment.centerRight,
      _SwipeDir.up    => Alignment.bottomCenter,
    };
    final end = switch (direction) {
      _SwipeDir.right => Alignment.centerRight,
      _SwipeDir.left  => Alignment.centerLeft,
      _SwipeDir.up    => Alignment.topCenter,
    };

    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: begin,
          end: end,
          colors: [
            color.withValues(alpha: 0),
            color.withValues(alpha: opacity),
          ],
        ),
      ),
    );
  }
}
