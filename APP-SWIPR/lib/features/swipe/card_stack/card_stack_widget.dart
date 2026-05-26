import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:photo_manager/photo_manager.dart';

import '../../../shared/theme/app_tokens.dart';
import '../../session/session_state/swipe_session_provider.dart';
import '../gesture_engine/swipe_gesture_detector.dart';
import 'swipe_card.dart';

/// Three-card swipe stack.
///
/// Performance contract (§11 non-negotiable):
/// - Background cards (card 2 and card 3) are plain [StatelessWidget]s that
///   do NOT listen to the drag [ValueNotifier]. They rebuild only when
///   [currentIndex] changes (i.e. once per swipe), never per frame.
/// - Only the top card wraps a [ValueListenableBuilder] on [_drag], so only
///   the top card rebuilds during a pan gesture.
///
/// Card visual hierarchy:
/// - Card 3 (deepest):  scale 0.92, opacity 0.4
/// - Card 2 (middle):   scale 0.96, opacity 0.7
/// - Card 1 (top):      scale 1.0,  opacity 1.0, gesture-active
class CardStackWidget extends ConsumerStatefulWidget {
  const CardStackWidget({super.key});

  @override
  ConsumerState<CardStackWidget> createState() => _CardStackWidgetState();
}

class _CardStackWidgetState extends ConsumerState<CardStackWidget>
    with SingleTickerProviderStateMixin {
  // Drives both the fly-off animation and the snap-back animation.
  late final AnimationController _anim;

  // Only the top-card [ValueListenableBuilder] subscribes to this.
  // Background cards never read it.
  final _drag = ValueNotifier<Offset>(Offset.zero);

  // Accumulated pan delta from the current gesture start.
  Offset _accumulated = Offset.zero;

  // Decision captured at threshold-cross, consumed on animation completion.
  String _pendingDecision = '';

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(
      vsync: this,
      duration: AppTokens.cardSwipeDuration,
    );
  }

  @override
  void dispose() {
    _anim.dispose();
    _drag.dispose();
    super.dispose();
  }

  // ── Gesture callbacks (passed to SwipeGestureDetector) ────────────────────

  void _onDragUpdate(Offset delta) {
    _accumulated += delta;
    _drag.value = _accumulated;
  }

  void _onDragEnd(Offset velocityPxPerSec) {
    if (_anim.isAnimating) return;

    final size = MediaQuery.sizeOf(context);
    final dx = _accumulated.dx;
    final dy = _accumulated.dy;
    final vx = velocityPxPerSec.dx;
    final vy = velocityPxPerSec.dy;

    const velThreshold = AppTokens.swipeVelocityThreshold;
    final distThresholdH = size.width * AppTokens.swipeCommitThreshold;
    final distThresholdV = size.height * AppTokens.swipeUpThreshold;

    if (dx > distThresholdH || vx > velThreshold) {
      _triggerSwipe('keep', size);
    } else if (dx < -distThresholdH || vx < -velThreshold) {
      _triggerSwipe('trash', size);
    } else if (dy < -distThresholdV || vy < -velThreshold) {
      _triggerSwipe('later', size);
    } else {
      _snapBack();
    }
  }

  void _onDragCancel() => _snapBack();

  // ── Snap-back animation ───────────────────────────────────────────────────

  void _snapBack() {
    _anim.reset();
    final start = _drag.value;
    final snapAnim = Tween<Offset>(begin: start, end: Offset.zero).animate(
      CurvedAnimation(parent: _anim, curve: Curves.elasticOut),
    );

    late VoidCallback frameListener;
    late AnimationStatusListener statusListener;

    frameListener = () => _drag.value = snapAnim.value;
    statusListener = (status) {
      if (status == AnimationStatus.completed ||
          status == AnimationStatus.dismissed) {
        _anim.removeListener(frameListener);
        _anim.removeStatusListener(statusListener);
        _anim.reset();
        _accumulated = Offset.zero;
        _drag.value = Offset.zero;
      }
    };

    _anim.addListener(frameListener);
    _anim.addStatusListener(statusListener);
    _anim.forward();
  }

  // ── Fly-off animation → commit ────────────────────────────────────────────

  void _triggerSwipe(String decision, Size screenSize) {
    ref.read(swipeSessionProvider.notifier).lockForAnimation();
    _pendingDecision = decision;

    final targetX = switch (decision) {
      'keep'  => screenSize.width * 1.6,
      'trash' => -screenSize.width * 1.6,
      _       => 0.0,
    };
    final targetY = decision == 'later' ? -screenSize.height * 1.6 : 0.0;

    _anim.reset();
    final flyAnim = Tween<Offset>(
      begin: _drag.value,
      end: Offset(targetX, targetY),
    ).animate(CurvedAnimation(parent: _anim, curve: Curves.easeIn));

    late VoidCallback frameListener;
    late AnimationStatusListener statusListener;

    frameListener = () => _drag.value = flyAnim.value;
    statusListener = (status) {
      if (status == AnimationStatus.completed) {
        _anim.removeListener(frameListener);
        _anim.removeStatusListener(statusListener);
        _commitAndReset();
      }
    };

    _anim.addListener(frameListener);
    _anim.addStatusListener(statusListener);
    _anim.forward();
  }

  Future<void> _commitAndReset() async {
    final decision = _pendingDecision;

    // Reset drag before commitSwipe so the incoming card enters at Offset.zero.
    _anim.reset();
    _accumulated = Offset.zero;
    _drag.value = Offset.zero;
    _pendingDecision = '';

    final index = ref.read(swipeSessionProvider).currentIndex;
    final notifier = ref.read(swipeSessionProvider.notifier);
    final asset = notifier.assetAt(index);
    if (asset == null) return;

    int sizeBytes = 0;
    try {
      final file = await asset.file;
      if (file != null) sizeBytes = await file.length();
    } on FileSystemException {
      // Asset file inaccessible — size stays 0, HUD will not update for it.
    }

    await notifier.commitSwipe(
      assetId: asset.id,
      decision: decision,
      sizeInBytes: sizeBytes,
    );
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    // Rebuild only when currentIndex changes (i.e. once per completed swipe).
    final index = ref.watch(
      swipeSessionProvider.select((s) => s.currentIndex),
    );
    final notifier = ref.read(swipeSessionProvider.notifier);

    final top    = notifier.assetAt(index);
    final second = notifier.assetAt(index + 1);
    final third  = notifier.assetAt(index + 2);

    if (top == null) return const SizedBox.shrink();

    final screenSize = MediaQuery.sizeOf(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppTokens.spaceMD),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // ── Card 3 — static, deepest ───────────────────────────────────────
          if (third != null)
            _BackgroundCard(asset: third, scale: 0.92, opacity: 0.4,
                screenSize: screenSize),

          // ── Card 2 — static, middle ────────────────────────────────────────
          if (second != null)
            _BackgroundCard(asset: second, scale: 0.96, opacity: 0.7,
                screenSize: screenSize),

          // ── Card 1 — top, only this rebuilds per drag frame ────────────────
          SwipeGestureDetector(
            onDragUpdate: _onDragUpdate,
            onDragEnd: _onDragEnd,
            onDragCancel: _onDragCancel,
            child: ValueListenableBuilder<Offset>(
              valueListenable: _drag,
              builder: (context, offset, child) {
                return SwipeCard(
                  asset: top,
                  dragOffset: offset,
                  screenSize: screenSize,
                  isTop: true,
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ── Background card ───────────────────────────────────────────────────────────

/// Static background card — never listens to the drag [ValueNotifier].
/// Rebuilds only when [currentIndex] changes in the parent.
class _BackgroundCard extends StatelessWidget {
  const _BackgroundCard({
    required this.asset,
    required this.scale,
    required this.opacity,
    required this.screenSize,
  });

  final AssetEntity asset;
  final double scale;
  final double opacity;
  final Size screenSize;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: opacity,
      child: Transform.scale(
        scale: scale,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppTokens.radiusCard),
          child: SwipeCard(
            asset: asset,
            dragOffset: Offset.zero,
            screenSize: screenSize,
            isTop: false,
          ),
        ),
      ),
    );
  }
}
