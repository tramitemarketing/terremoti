import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../session/session_state/swipe_session_provider.dart';

/// Wraps [child] with a pan gesture recogniser that respects the session's
/// [SwipeSessionState.isAnimating] lock.
///
/// When [isAnimating] is true, no gesture recogniser is attached — input is
/// silently dropped without propagating to the child. This satisfies the §11
/// non-negotiable: "Gesture detector checks isAnimating before any input."
///
/// Transitions [SwipeSessionPhase.ready] → [SwipeSessionPhase.swiping] on
/// the very first [onDragUpdate] call.
///
/// Callbacks:
/// - [onDragUpdate]: incremental [Offset] delta each pan frame.
/// - [onDragEnd]: final velocity [Offset] in pixels/second.
/// - [onDragCancel]: pan cancelled without a valid end event.
class SwipeGestureDetector extends ConsumerWidget {
  const SwipeGestureDetector({
    super.key,
    required this.child,
    required this.onDragUpdate,
    required this.onDragEnd,
    required this.onDragCancel,
  });

  final Widget child;
  final void Function(Offset delta) onDragUpdate;
  final void Function(Offset velocityPxPerSec) onDragEnd;
  final VoidCallback onDragCancel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Rebuild only when isAnimating changes — avoids rebuilding on every
    // session state update unrelated to the gesture lock.
    final isAnimating = ref.watch(
      swipeSessionProvider.select((s) => s.isAnimating),
    );

    // When animating, return child bare — no gesture recogniser attached.
    if (isAnimating) return child;

    return GestureDetector(
      onPanUpdate: (details) {
        // Transition ready → swiping on first gesture contact.
        final phase = ref.read(swipeSessionProvider).phase;
        if (phase == SwipeSessionPhase.ready) {
          ref.read(swipeSessionProvider.notifier).beginSwiping();
        }
        onDragUpdate(details.delta);
      },
      onPanEnd: (details) => onDragEnd(details.velocity.pixelsPerSecond),
      onPanCancel: onDragCancel,
      child: child,
    );
  }
}
