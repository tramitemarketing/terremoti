import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:photo_manager/photo_manager.dart';

import '../../../shared/theme/app_tokens.dart';
import '../../session/session_state/swipe_session_provider.dart';
import '../gesture_engine/swipe_gesture_detector.dart';
import 'swipe_card.dart';

/// Three-card swipe stack — double-buffer layout.
///
/// Performance contract (§11 non-negotiable):
/// - Background cards are plain [StatelessWidget]s that do NOT listen to the
///   drag [ValueNotifier]. They rebuild only when [currentIndex] changes
///   (i.e. once per swipe), never per frame.
/// - Only the active card wraps a [ListenableBuilder] on [_drag] and
///   [_topAssetId], so only it rebuilds during a pan gesture.
///
/// Card visual hierarchy:
/// - Card 3 (deepest):  scale 0.92, opacity 0.4  — depth cue only
/// - Standby (middle):  scale 1.0,  opacity 1.0  — next card, always visible
/// - Active (top):      scale 1.0,  opacity 1.0  — gesture-driven; transparent
///                                                   when bytes not yet ready,
///                                                   revealing the standby card
class CardStackWidget extends ConsumerStatefulWidget {
  const CardStackWidget({super.key});

  @override
  ConsumerState<CardStackWidget> createState() => _CardStackWidgetState();
}

class _CardStackWidgetState extends ConsumerState<CardStackWidget>
    with SingleTickerProviderStateMixin {
  // Drives both the fly-off animation and the snap-back animation.
  late final AnimationController _anim;

  // Only the top-card ListenableBuilder subscribes to this.
  // Background cards never read it.
  final _drag = ValueNotifier<Offset>(Offset.zero);

  // ID of the asset the top slot is authorised to render.
  // null → suppressed (transitioning); builder passes null bytes → transparent.
  // id   → show bytes only when top.id matches exactly.
  // Initialised to the first top asset via _topAssetInitialized flag on first build.
  final _topAssetId = ValueNotifier<String?>(null);

  // Guards the one-time initialisation so suppress-to-null during a later
  // commit cannot retrigger the init path.
  bool _topAssetInitialized = false;

  // Accumulated pan delta from the current gesture start.
  Offset _accumulated = Offset.zero;

  // Decision captured at threshold-cross, consumed on animation completion.
  String _pendingDecision = '';

  // Guards early-commit: true once _commitAndReset has been called for the
  // current fly-off so the 85%-threshold listener doesn't fire twice.
  bool _committed = false;

  // At most one gesture queued while a fly-off is running.
  // Processed immediately after _commitAndReset completes.
  String? _queuedDecision; // 'keep' | 'trash' | 'later'

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
    _topAssetId.dispose();
    super.dispose();
  }

  // ── Gesture callbacks (passed to SwipeGestureDetector) ────────────────────

  void _onDragUpdate(Offset delta) {
    _accumulated += delta;
    _drag.value = _accumulated;
  }

  void _onDragEnd(Offset velocityPxPerSec) {
    final size = MediaQuery.sizeOf(context);
    final dx = _accumulated.dx;
    final dy = _accumulated.dy;
    final vx = velocityPxPerSec.dx;
    final vy = velocityPxPerSec.dy;

    const velThreshold = AppTokens.swipeVelocityThreshold;
    final distThresholdH = size.width * AppTokens.swipeCommitThreshold;
    final distThresholdV = size.height * AppTokens.swipeUpThreshold;

    String? decision;
    if (dx > distThresholdH || vx > velThreshold) {
      decision = 'keep';
    } else if (dx < -distThresholdH || vx < -velThreshold) {
      decision = 'trash';
    } else if (dy < -distThresholdV || vy < -velThreshold) {
      decision = 'later';
    }

    if (_anim.isAnimating) {
      // A fly-off is already running — queue the decision (if any) and
      // consume the accumulated delta so it doesn't bleed into the next card.
      if (decision != null) _queuedDecision = decision;
      _accumulated = Offset.zero;
      return;
    }

    if (decision != null) {
      _triggerSwipe(decision, size);
    } else {
      _snapBack();
    }
  }

  void _onDragCancel() {
    if (_anim.isAnimating) {
      _accumulated = Offset.zero;
      return;
    }
    _snapBack();
  }

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
    _committed = false;

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

    frameListener = () {
      _drag.value = flyAnim.value;
      // At 85% the card is already off-screen visually. Commit early so the
      // standby card is revealed before the animation officially completes,
      // eliminating the residual ~50 ms flash at the end of the fly-off.
      if (_anim.value >= 0.92 && !_committed) {
        _committed = true;
        _anim.removeListener(frameListener);
        _commitAndReset();
      }
    };

    _anim.addListener(frameListener);
    _anim.forward();
  }

  Future<void> _commitAndReset() async {
    _committed = false;
    final decision = _pendingDecision;

    // Suppress the top card during the transition window so the standby card
    // (assetAt(index+1)) shows through — it is already visible behind the top.
    _topAssetId.value = null;

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

    // Wait for the new top card's bytes before authorising the top slot.
    // Zero cost when already cached (standby pre-rendered it). Awaits the
    // exact in-flight future otherwise so we never show the app background.
    final newIndex = ref.read(swipeSessionProvider).currentIndex;
    final newAsset = notifier.assetAt(newIndex);
    if (newAsset != null) {
      await notifier.waitForBytes(newAsset.id);
    }
    _topAssetId.value = newAsset?.id;

    // Fire any gesture that arrived while the previous fly-off was running.
    if (_queuedDecision != null) {
      final queued = _queuedDecision!;
      _queuedDecision = null;
      _triggerSwipe(queued, MediaQuery.sizeOf(context));
    }
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

    // One-time init: set _topAssetId to the first top asset after the first
    // frame so the initial card shows its image.  The _topAssetInitialized flag
    // prevents this from re-firing during later suppress-to-null windows.
    if (!_topAssetInitialized) {
      _topAssetInitialized = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _topAssetId.value = top.id;
      });
    }

    final screenSize = MediaQuery.sizeOf(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppTokens.spaceMD),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // ── Card 3 — depth cue (small, faint) ────────────────────────────
          if (third != null)
            _BackgroundCard(
              asset: third,
              cachedBytes: notifier.getBytesSync(third.id),
              scale: 0.92,
              opacity: 0.4,
              screenSize: screenSize,
            ),

          // ── Standby card — full size, always visible behind the active card.
          // When the active card flies off, this is immediately revealed with no
          // gap, eliminating the app-background flash.
          if (second != null)
            _BackgroundCard(
              asset: second,
              cachedBytes: notifier.getBytesSync(second.id),
              scale: 1.0,
              opacity: 1.0,
              screenSize: screenSize,
            ),

          // ── Active card — transparent when bytes not yet authorised so the
          // standby card shows through during the _topAssetId=null window.
          ListenableBuilder(
            listenable: Listenable.merge([_drag, _topAssetId, _anim]),
            builder: (context, _) {
              final bytes = top.id == _topAssetId.value
                  ? notifier.getBytesSync(top.id)
                  : null;
              // Fade out the active card over the last 20% of the fly-off
              // so the crossfade to the standby card is gradual rather than
              // a hard cut — eliminates the flash on bright images.
              final opacity = _anim.value < 0.80
                  ? 1.0
                  : (1.0 - (_anim.value - 0.80) / 0.20).clamp(0.0, 1.0);
              return Opacity(
                opacity: opacity,
                child: SwipeCard(
                  asset: top,
                  cachedBytes: bytes,
                  dragOffset: _drag.value,
                  screenSize: screenSize,
                  isTop: true,
                ),
              );
            },
          ),

          // ── Gesture layer — always on top, never removed from the tree.
          // Keeping it separate from the active card guarantees touch events
          // are received even during the _topAssetId=null transparency window.
          Positioned.fill(
            child: SwipeGestureDetector(
              onDragUpdate: _onDragUpdate,
              onDragEnd: _onDragEnd,
              onDragCancel: _onDragCancel,
              child: const SizedBox.expand(),
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
    required this.cachedBytes,
    required this.scale,
    required this.opacity,
    required this.screenSize,
  });

  final AssetEntity asset;
  final Uint8List? cachedBytes;
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
            cachedBytes: cachedBytes,
            dragOffset: Offset.zero,
            screenSize: screenSize,
            isTop: false,
          ),
        ),
      ),
    );
  }
}
