import 'package:flutter/material.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_tokens.dart';
import '../../shared/theme/app_typography.dart';

/// Paywall shown between sessions when the free smart-detection quota is
/// exhausted, or whenever the user navigates to [Routes.paywall].
///
/// ## Contract
///
/// - Never shown mid-session or mid-review (enforced at call sites).
/// - Prices fetched live from RevenueCat — never hardcoded.
/// - On successful purchase: [Navigator.pop] — returns to previous screen.
/// - On restore: pops if entitlement confirmed, shows snackbar otherwise.
/// - On any RevenueCat error: shows inline error state with retry.
class PaywallPage extends StatefulWidget {
  const PaywallPage({super.key});

  @override
  State<PaywallPage> createState() => _PaywallPageState();
}

// ── State ─────────────────────────────────────────────────────────────────────

enum _PageState { loading, ready, error }

class _PaywallPageState extends State<PaywallPage> {
  _PageState _pageState = _PageState.loading;
  Offerings? _offerings;
  bool _isPurchasing = false;
  bool _isRestoring = false;

  @override
  void initState() {
    super.initState();
    _fetchOfferings();
  }

  // ── RevenueCat ─────────────────────────────────────────────────────────────

  Future<void> _fetchOfferings() async {
    setState(() => _pageState = _PageState.loading);
    try {
      final offerings = await Purchases.getOfferings();
      setState(() {
        _offerings = offerings;
        _pageState = _PageState.ready;
      });
    } catch (_) {
      setState(() => _pageState = _PageState.error);
    }
  }

  Future<void> _onPurchase(Package package) async {
    if (_isPurchasing) return;
    setState(() => _isPurchasing = true);
    try {
      // ignore: deprecated_member_use
      await Purchases.purchasePackage(package);
      // Purchase succeeded — pop back to the previous screen.
      if (mounted) Navigator.of(context).pop();
    } on PurchasesErrorCode catch (e) {
      if (e != PurchasesErrorCode.purchaseCancelledError && mounted) {
        _showSnackBar('Acquisto non riuscito. Riprova.');
      }
    } catch (_) {
      if (mounted) _showSnackBar('Acquisto non riuscito. Riprova.');
    } finally {
      if (mounted) setState(() => _isPurchasing = false);
    }
  }

  Future<void> _onRestore() async {
    if (_isRestoring) return;
    setState(() => _isRestoring = true);
    try {
      final info = await Purchases.restorePurchases();
      final hasPremium =
          info.entitlements.active.containsKey('premium');
      if (mounted) {
        if (hasPremium) {
          Navigator.of(context).pop();
        } else {
          _showSnackBar('Nessun acquisto precedente trovato.');
        }
      }
    } catch (_) {
      if (mounted) _showSnackBar('Ripristino non riuscito. Riprova.');
    } finally {
      if (mounted) setState(() => _isRestoring = false);
    }
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close),
          color: AppColors.textSecondary,
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: switch (_pageState) {
          _PageState.loading => const _LoadingView(),
          _PageState.error   => _ErrorView(onRetry: _fetchOfferings),
          _PageState.ready   => _ReadyView(
              offerings: _offerings,
              isPurchasing: _isPurchasing,
              isRestoring: _isRestoring,
              onPurchase: _onPurchase,
              onRestore: _onRestore,
            ),
        },
      ),
    );
  }
}

// ── Loading ───────────────────────────────────────────────────────────────────

class _LoadingView extends StatelessWidget {
  const _LoadingView();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: CircularProgressIndicator(),
    );
  }
}

// ── Error ─────────────────────────────────────────────────────────────────────

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTokens.spaceLG),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Impossibile caricare i piani.',
              style: AppTypography.body.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppTokens.spaceMD),
            TextButton(
              onPressed: onRetry,
              child: Text('Riprova', style: AppTypography.body),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Ready ─────────────────────────────────────────────────────────────────────

class _ReadyView extends StatelessWidget {
  const _ReadyView({
    required this.offerings,
    required this.isPurchasing,
    required this.isRestoring,
    required this.onPurchase,
    required this.onRestore,
  });

  final Offerings? offerings;
  final bool isPurchasing;
  final bool isRestoring;
  final void Function(Package) onPurchase;
  final VoidCallback onRestore;

  @override
  Widget build(BuildContext context) {
    final current = offerings?.current;
    final packages = current?.availablePackages ?? const [];

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTokens.spaceLG,
        vertical: AppTokens.spaceMD,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Headline ──────────────────────────────────────────────────────
          Text(
            'Swipr Premium',
            style: AppTypography.displayMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppTokens.spaceSM),
          Text(
            'La tua galleria merita di meglio.',
            style: AppTypography.body.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppTokens.spaceXL),

          // ── Feature list ──────────────────────────────────────────────────
          const _FeatureList(),
          const SizedBox(height: AppTokens.spaceXL),

          // ── Package buttons ───────────────────────────────────────────────
          if (packages.isEmpty)
            Text(
              'Nessun piano disponibile al momento.',
              style: AppTypography.body.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            )
          else
            ...packages.map((pkg) => Padding(
                  padding: const EdgeInsets.only(bottom: AppTokens.spaceSM),
                  child: _PackageButton(
                    package: pkg,
                    isPurchasing: isPurchasing,
                    onTap: () => onPurchase(pkg),
                  ),
                )),
          const SizedBox(height: AppTokens.spaceMD),

          // ── Restore ───────────────────────────────────────────────────────
          Center(
            child: TextButton(
              onPressed: (isRestoring || isPurchasing) ? null : onRestore,
              child: isRestoring
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(
                      'Ripristina acquisti',
                      style: AppTypography.caption.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: AppTokens.spaceLG),
        ],
      ),
    );
  }
}

// ── Feature list ──────────────────────────────────────────────────────────────

/// Premium feature bullets from VISION §14.
class _FeatureList extends StatelessWidget {
  const _FeatureList();

  static const _features = [
    ('♾️', 'Smart detection illimitata'),
    ('🔍', 'Blur detection'),
    ('👯', 'Duplicate detection'),
    ('🎬', 'Heavy media detection'),
    ('🚫', 'Niente pubblicità'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppTokens.spaceMD),
      decoration: BoxDecoration(
        color: AppColors.backgroundCard,
        borderRadius: BorderRadius.circular(AppTokens.radiusMD),
      ),
      child: Column(
        children: _features
            .map((f) => _FeatureRow(emoji: f.$1, label: f.$2))
            .toList(),
      ),
    );
  }
}

class _FeatureRow extends StatelessWidget {
  const _FeatureRow({required this.emoji, required this.label});

  final String emoji;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppTokens.spaceXS),
      child: Row(
        children: [
          SizedBox(
            width: 28,
            child: Text(emoji, style: const TextStyle(fontSize: 18)),
          ),
          const SizedBox(width: AppTokens.spaceSM),
          Text(label, style: AppTypography.body),
        ],
      ),
    );
  }
}

// ── Package button ────────────────────────────────────────────────────────────

class _PackageButton extends StatelessWidget {
  const _PackageButton({
    required this.package,
    required this.isPurchasing,
    required this.onTap,
  });

  final Package package;
  final bool isPurchasing;
  final VoidCallback onTap;

  String get _title {
    return switch (package.packageType) {
      PackageType.monthly  => 'Mensile',
      PackageType.annual   => 'Annuale',
      PackageType.lifetime => 'A vita',
      _                    => package.storeProduct.title,
    };
  }

  @override
  Widget build(BuildContext context) {
    final isAnnual = package.packageType == PackageType.annual;

    return FilledButton(
      onPressed: isPurchasing ? null : onTap,
      style: FilledButton.styleFrom(
        backgroundColor:
            isAnnual ? AppColors.keepGreen : AppColors.backgroundCard,
        foregroundColor:
            isAnnual ? AppColors.background : AppColors.textPrimary,
        padding: const EdgeInsets.symmetric(
          horizontal: AppTokens.spaceLG,
          vertical: AppTokens.spaceMD,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTokens.radiusSM),
          side: isAnnual
              ? BorderSide.none
              : BorderSide(
                  color: AppColors.textSecondary.withValues(alpha: 0.3),
                ),
        ),
      ),
      child: isPurchasing
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(_title, style: AppTypography.body),
                Text(
                  package.storeProduct.priceString,
                  style: AppTypography.body,
                ),
              ],
            ),
    );
  }
}
