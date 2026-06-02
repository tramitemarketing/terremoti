import 'dart:io';
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
/// - Transforms applied only when [isTop] is true.
/// - File size loaded async from the device and rendered as a monospace
///   label at the bottom of the card.
class SwipeCard extends StatefulWidget {
  const SwipeCard({
    super.key,
    required this.asset,
    required this.cachedBytes,
    required this.dragOffset,
    required this.screenSize,
    required this.isTop,
  });

  final AssetEntity asset;

  /// Pre-decoded thumbnail bytes from [PreloadEngine].
  /// Null when the asset has not yet been decoded — top card renders
  /// transparent; background cards show a placeholder.
  final Uint8List? cachedBytes;

  /// Current cumulative drag offset from the card's resting position.
  /// [Offset.zero] for background cards.
  final Offset dragOffset;

  final Size screenSize;

  /// True only for the front-most (gesture-active) card in the stack.
  final bool isTop;

  @override
  State<SwipeCard> createState() => _SwipeCardState();
}

class _SwipeCardState extends State<SwipeCard> {
  int? _fileSizeBytes;

  @override
  void initState() {
    super.initState();
    _loadFileSize();
  }

  @override
  void didUpdateWidget(SwipeCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.asset.id != widget.asset.id) {
      _fileSizeBytes = null;
      _loadFileSize();
    }
  }

  Future<void> _loadFileSize() async {
    try {
      final file = await widget.asset.file;
      if (file != null && mounted) {
        final size = await file.length();
        if (mounted) setState(() => _fileSizeBytes = size);
      }
    } on FileSystemException {
      // File inaccessible — no size label shown.
    }
  }

  String _formatSize(int bytes) {
    if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(0)} KB';
    }
    return '${(bytes / 1024 / 1024).toStringAsFixed(1)} MB';
  }

  // ── Derived visual values ─────────────────────────────────────────────────

  double get _angle {
    if (!widget.isTop) return 0;
    return (widget.dragOffset.dx / widget.screenSize.width * 15 * math.pi / 180)
        .clamp(-15 * math.pi / 180, 15 * math.pi / 180);
  }

  double get _overlayOpacity {
    if (!widget.isTop) return 0;
    final hRatio = widget.dragOffset.dx.abs() /
        (widget.screenSize.width * AppTokens.swipeCommitThreshold);
    final upDy = -widget.dragOffset.dy;
    final vRatio = upDy > 0
        ? upDy / (widget.screenSize.height * AppTokens.swipeUpThreshold)
        : 0.0;
    return math.max(hRatio, vRatio).clamp(0.0, 0.6);
  }

  Color get _overlayColor {
    if (widget.dragOffset.dy < 0 &&
        widget.dragOffset.dy.abs() > widget.dragOffset.dx.abs()) {
      return AppColors.laterBlue;
    }
    return widget.dragOffset.dx >= 0 ? AppColors.keepGreen : AppColors.trashRed;
  }

  _SwipeDir get _swipeDir {
    if (widget.dragOffset.dy < 0 &&
        widget.dragOffset.dy.abs() > widget.dragOffset.dx.abs()) {
      return _SwipeDir.up;
    }
    return widget.dragOffset.dx >= 0 ? _SwipeDir.right : _SwipeDir.left;
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    // Top card with no bytes: render nothing so the standby card shows through.
    // The outer Container's backgroundCard color would cause a gray flash otherwise.
    if (widget.isTop && widget.cachedBytes == null) return const SizedBox.expand();

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
            if (widget.cachedBytes != null)
              Image.memory(
                widget.cachedBytes!,
                fit: BoxFit.contain,
                gaplessPlayback: true,
              )
            else
              // isTop=false with no bytes: gray placeholder while loading.
              Container(color: AppColors.backgroundCard),

            // File size label — monospace, faint, bottom-centre.
            if (_fileSizeBytes != null)
              Positioned(
                bottom: 16,
                left: 0,
                right: 0,
                child: Center(
                  child: Text(
                    _formatSize(_fileSizeBytes!),
                    style: TextStyle(
                      fontFamily: 'RobotoMono',
                      fontFamilyFallback: const ['Courier', 'monospace'],
                      color: AppColors.textSecondary.withValues(alpha: 0.5),
                      fontSize: 12,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
              ),

            // Gradient overlay — only rendered on top card with non-zero drag.
            if (widget.isTop && _overlayOpacity > 0)
              _SwipeOverlay(
                color: _overlayColor,
                opacity: _overlayOpacity,
                direction: _swipeDir,
              ),
          ],
        ),
      ),
    );

    if (!widget.isTop) return card;

    // Top card: apply translation + rotation driven by drag.
    return Transform.translate(
      offset: widget.dragOffset,
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
