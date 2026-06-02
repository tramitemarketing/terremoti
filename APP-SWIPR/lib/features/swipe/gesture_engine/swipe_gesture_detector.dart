import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../session/session_state/swipe_session_provider.dart';

/// Wraps [child] with a pan gesture recogniser.
///
/// The GestureDetector is **always** present in the tree regardless of
/// animation state — [HitTestBehavior.opaque] ensures the transparent
/// gesture layer intercepts touches even when no visible card is beneath it.
/// Animation-gating (queuing during fly-off) is handled by the callbacks in
/// [_CardStackWidgetState], not here.
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
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
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
