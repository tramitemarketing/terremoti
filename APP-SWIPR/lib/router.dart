import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'core/storage/isar_models.dart';
import 'features/onboarding/onboarding_page.dart';
import 'features/onboarding/permission_request_page.dart';
import 'features/onboarding/mode_selector_page.dart';
import 'features/swipe/swipe_page.dart';
import 'features/smart_review/smart_review_page.dart';
import 'features/recap/recap_page.dart';
import 'features/premium/paywall_page.dart';

part 'router.g.dart';

abstract class Routes {
  static const onboarding   = '/onboarding';
  static const permissions  = '/permissions';
  static const modeSelector = '/mode';
  static const swipe        = '/swipe';
  static const smartReview  = '/smart-review';
  static const recap        = '/recap';
  static const paywall      = '/paywall';
}

@riverpod
GoRouter router(RouterRef ref) {
  return GoRouter(
    initialLocation: Routes.onboarding,
    routes: [
      GoRoute(path: Routes.onboarding,   builder: (ctx, state) => const OnboardingPage()),
      GoRoute(path: Routes.permissions,  builder: (ctx, state) => const PermissionRequestPage()),
      GoRoute(path: Routes.modeSelector, builder: (ctx, state) => const ModeSelectorPage()),
      GoRoute(
        path: Routes.swipe,
        builder: (ctx, state) {
          final filter = state.extra as SwipeFilter? ?? const SwipeFilter.entireLibrary();
          return SwipePage(filter: filter);
        },
      ),
      GoRoute(path: Routes.smartReview, builder: (ctx, state) => const SmartReviewPage()),
      GoRoute(
        path: Routes.recap,
        builder: (ctx, state) {
          final stats = state.extra as SessionStats?;
          return RecapPage(stats: stats);
        },
      ),
      GoRoute(path: Routes.paywall, builder: (ctx, state) => const PaywallPage()),
    ],
  );
}

// Note: CleanupMode is defined in core/storage/isar_models.dart alongside
// SwipeFilter which depends on it. Not redefined here to avoid duplication.
