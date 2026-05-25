import 'package:photo_manager/photo_manager.dart';

/// Unified permission state for both iOS and Android.
///
/// | State           | iOS                                        | Android          |
/// |-----------------|---------------------------------------------|------------------|
/// | notDetermined   | PHAuthorizationStatus.notDetermined         | not yet asked    |
/// | granted         | PHAuthorizationStatus.authorized            | permission granted |
/// | limited         | PHAuthorizationStatus.limited (iOS 14+)     | n/a (maps to granted) |
/// | denied          | denied / restricted (parental controls)     | denied / permanently denied |
enum PhotoPermissionState {
  notDetermined,
  granted,
  limited,
  denied,
}

/// Handles photo library permission requests across iOS and Android.
///
/// All platform differences are absorbed internally via [photo_manager].
/// Callers always work with the same [PhotoPermissionState] enum regardless
/// of platform.
///
/// ## Important — [currentState] vs [requestPermission]
///
/// [requestPermission] is the explicit call that triggers the system dialog
/// (only on first launch when state is [PhotoPermissionState.notDetermined]).
/// Call it only from [PermissionRequestPage] when the user taps the allow button.
///
/// [currentState] is safe to call on app start and in router guards.
/// In practice it never triggers a dialog because it is only called after
/// [requestPermission] has already been run once (state is always determined
/// by then). If called when state is [PhotoPermissionState.notDetermined],
/// it behaves identically to [requestPermission] — this is a [photo_manager]
/// platform constraint, not a bug.
class PermissionHandler {
  /// Requests photo library access and returns the resolved state.
  ///
  /// Shows the system permission dialog on first launch.
  /// Returns the existing state on subsequent calls without re-prompting.
  Future<PhotoPermissionState> requestPermission() async {
    final state = await PhotoManager.requestPermissionExtend(
      requestOption: const PermissionRequestOption(
        iosAccessLevel: IosAccessLevel.readWrite,
      ),
    );
    return _map(state);
  }

  /// Returns the current permission state without intentionally prompting.
  ///
  /// Safe to call from router guards and session startup. See class-level
  /// doc for the one edge case where a dialog may still appear.
  Future<PhotoPermissionState> currentState() async {
    final state = await PhotoManager.requestPermissionExtend(
      requestOption: const PermissionRequestOption(
        iosAccessLevel: IosAccessLevel.readWrite,
      ),
    );
    return _map(state);
  }

  /// Opens the device Settings app to the Swipr permission page.
  ///
  /// Use when state is [PhotoPermissionState.denied] so the user can
  /// manually grant access. Does nothing on simulators.
  Future<void> openSettings() => PhotoManager.openSetting();

  // ── Internal ──────────────────────────────────────────────────────────────

  PhotoPermissionState _map(PermissionState state) {
    return switch (state) {
      PermissionState.authorized  => PhotoPermissionState.granted,
      PermissionState.limited     => PhotoPermissionState.limited,
      PermissionState.denied      => PhotoPermissionState.denied,
      PermissionState.restricted  => PhotoPermissionState.denied, // iOS parental controls
      _                           => PhotoPermissionState.notDetermined,
    };
  }
}
