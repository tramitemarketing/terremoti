// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'swipe_session_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(SwipeSession)
final swipeSessionProvider = SwipeSessionProvider._();

final class SwipeSessionProvider
    extends $NotifierProvider<SwipeSession, SwipeSessionState> {
  SwipeSessionProvider._()
      : super(
          from: null,
          argument: null,
          retry: null,
          name: r'swipeSessionProvider',
          isAutoDispose: true,
          dependencies: null,
          $allTransitiveDependencies: null,
        );

  @override
  String debugGetCreateSourceHash() => _$swipeSessionHash();

  @$internal
  @override
  SwipeSession create() => SwipeSession();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(SwipeSessionState value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<SwipeSessionState>(value),
    );
  }
}

String _$swipeSessionHash() => r'a284f5f0ecfb01945a7eb2c962ed4b71dc54d0f5';

abstract class _$SwipeSession extends $Notifier<SwipeSessionState> {
  SwipeSessionState build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<SwipeSessionState, SwipeSessionState>;
    final element = ref.element as $ClassProviderElement<
        AnyNotifier<SwipeSessionState, SwipeSessionState>,
        SwipeSessionState,
        Object?,
        Object?>;
    element.handleCreate(ref, build);
  }
}

/// Computed [SessionStats] from the current [SwipeSessionState].
///
/// Re-computes on every state change. Use for live HUD values during swiping
/// and for passing to RecapPage (until step-6 wires the router).

@ProviderFor(sessionStats)
final sessionStatsProvider = SessionStatsProvider._();

/// Computed [SessionStats] from the current [SwipeSessionState].
///
/// Re-computes on every state change. Use for live HUD values during swiping
/// and for passing to RecapPage (until step-6 wires the router).

final class SessionStatsProvider
    extends $FunctionalProvider<SessionStats, SessionStats, SessionStats>
    with $Provider<SessionStats> {
  /// Computed [SessionStats] from the current [SwipeSessionState].
  ///
  /// Re-computes on every state change. Use for live HUD values during swiping
  /// and for passing to RecapPage (until step-6 wires the router).
  SessionStatsProvider._()
      : super(
          from: null,
          argument: null,
          retry: null,
          name: r'sessionStatsProvider',
          isAutoDispose: true,
          dependencies: null,
          $allTransitiveDependencies: null,
        );

  @override
  String debugGetCreateSourceHash() => _$sessionStatsHash();

  @$internal
  @override
  $ProviderElement<SessionStats> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  SessionStats create(Ref ref) {
    return sessionStats(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(SessionStats value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<SessionStats>(value),
    );
  }
}

String _$sessionStatsHash() => r'0a79793fbd888c994af8473d190e1d58009844e3';
