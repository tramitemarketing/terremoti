import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/permissions/permission_handler.dart';
import '../../router.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_tokens.dart';
import '../../shared/theme/app_typography.dart';

enum _PageState { checking, ready, requesting, denied }

/// Handles photo permission request and routes based on result.
///
/// On mount: calls [PermissionHandler.currentState] silently.
/// - [PhotoPermissionState.granted] / [PhotoPermissionState.limited]
///   → navigate to [Routes.modeSelector] immediately.
/// - [PhotoPermissionState.denied]
///   → show denied state with "Apri Impostazioni" button.
/// - [PhotoPermissionState.notDetermined]
///   → show "Consenti accesso" UI (will trigger system dialog on tap).
class PermissionRequestPage extends ConsumerStatefulWidget {
  const PermissionRequestPage({super.key});

  @override
  ConsumerState<PermissionRequestPage> createState() =>
      _PermissionRequestPageState();
}

class _PermissionRequestPageState
    extends ConsumerState<PermissionRequestPage> {
  final _handler = PermissionHandler();
  _PageState _state = _PageState.checking;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkCurrent());
  }

  Future<void> _checkCurrent() async {
    final result = await _handler.currentState();
    if (!mounted) return;
    _handleResult(result, fromCheck: true);
  }

  Future<void> _requestPermission() async {
    setState(() => _state = _PageState.requesting);
    final result = await _handler.requestPermission();
    if (!mounted) return;
    _handleResult(result, fromCheck: false);
  }

  void _handleResult(PhotoPermissionState result, {required bool fromCheck}) {
    switch (result) {
      case PhotoPermissionState.granted:
      case PhotoPermissionState.limited:
        context.go(Routes.modeSelector);
      case PhotoPermissionState.denied:
        setState(() => _state = _PageState.denied);
      case PhotoPermissionState.notDetermined:
        // Only show the request UI when not already requesting.
        if (_state != _PageState.requesting) {
          setState(() => _state = _PageState.ready);
        }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_state == _PageState.checking) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: SizedBox.shrink(),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppTokens.spaceXL),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(flex: 3),

              Text(
                _state == _PageState.denied
                    ? 'Accesso negato'
                    : 'Accesso alle foto',
                style: AppTypography.displayMedium,
              ),
              const SizedBox(height: AppTokens.spaceMD),

              Text(
                _state == _PageState.denied
                    ? 'Swipr non può funzionare senza accesso alla libreria fotografica. Apri le Impostazioni per concedere il permesso.'
                    : 'Swipr ha bisogno di accedere alle tue foto per mostrartele. Le foto non lasciano mai il tuo dispositivo.',
                style: AppTypography.body,
              ),

              const Spacer(flex: 2),

              SizedBox(
                width: double.infinity,
                child: _state == _PageState.denied
                    ? _PrimaryButton(
                        label: 'Apri Impostazioni',
                        onTap: () => _handler.openSettings(),
                      )
                    : _PrimaryButton(
                        label: _state == _PageState.requesting
                            ? 'Richiesta in corso…'
                            : 'Consenti accesso alle foto',
                        onTap: _state == _PageState.requesting
                            ? () {}
                            : _requestPermission,
                        enabled: _state != _PageState.requesting,
                      ),
              ),

              const SizedBox(height: AppTokens.spaceLG),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Button ─────────────────────────────────────────────────────────────────────

class _PrimaryButton extends StatelessWidget {
  const _PrimaryButton({
    required this.label,
    required this.onTap,
    this.enabled = true,
  });

  final String label;
  final VoidCallback onTap;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1.0 : 0.4,
      child: GestureDetector(
        onTap: enabled ? onTap : null,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: AppTokens.spaceMD),
          decoration: BoxDecoration(
            color: AppColors.textPrimary,
            borderRadius: BorderRadius.circular(AppTokens.radiusMD),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: AppTypography.title.copyWith(color: AppColors.background),
          ),
        ),
      ),
    );
  }
}
