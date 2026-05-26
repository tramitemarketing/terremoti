import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:photo_manager/photo_manager.dart';

import '../../core/photo/photo_repository.dart';
import '../../core/storage/isar_models.dart';
import '../../router.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_tokens.dart';
import '../../shared/theme/app_typography.dart';

/// Mode selection page — the user picks a [CleanupMode], configures it, and
/// taps "Start" to begin a swipe session.
///
/// Three tabs (segmented control):
///   1. Tutta la Libreria — no config, immediately valid
///   2. Album            — multi-select album grid, skeleton loader
///   3. Periodo          — date range picker + quick preset chips
///
/// The Start button stays disabled (opacity 0.4, not tappable) until
/// [SwipeFilter.isValid] is true for the current tab.
class ModeSelectorPage extends ConsumerStatefulWidget {
  const ModeSelectorPage({super.key});

  @override
  ConsumerState<ModeSelectorPage> createState() => _ModeSelectorPageState();
}

class _ModeSelectorPageState extends ConsumerState<ModeSelectorPage> {
  final _repo = PhotoRepository();

  CleanupMode _selectedMode = CleanupMode.entireLibrary;

  // ── Tab 1: Tutta la Libreria ──────────────────────────────────────────────
  late Future<int> _libCountFuture;

  // ── Tab 2: Album ──────────────────────────────────────────────────────────
  Future<List<AlbumInfo>>? _albumsFuture;
  final _selectedAlbumIds = <String>{};

  // ── Tab 3: Periodo ────────────────────────────────────────────────────────
  DateTime? _rangeStart;
  DateTime? _rangeEnd;
  Future<int>? _rangeCountFuture;
  /// Resolved count of photos in the selected range.
  /// Null while the future is pending or dates are not yet set.
  int? _timeRangeCount;

  // ── Derived ───────────────────────────────────────────────────────────────

  bool get _isFilterValid {
    return switch (_selectedMode) {
      CleanupMode.entireLibrary => true,
      CleanupMode.albums        => _selectedAlbumIds.isNotEmpty,
      CleanupMode.timeRange     => _rangeStart != null &&
                                    _rangeEnd != null &&
                                    (_timeRangeCount ?? 0) > 0,
    };
  }

  SwipeFilter get _currentFilter {
    return switch (_selectedMode) {
      CleanupMode.entireLibrary => const SwipeFilter.entireLibrary(),
      CleanupMode.albums        => SwipeFilter.albums(_selectedAlbumIds.toList()),
      CleanupMode.timeRange     => SwipeFilter.timeRange(
                                     start: _rangeStart!,
                                     end: _rangeEnd!,
                                   ),
    };
  }

  @override
  void initState() {
    super.initState();
    _libCountFuture = _repo.getTotalCount(const SwipeFilter.entireLibrary());
  }

  void _selectMode(CleanupMode mode) {
    if (_selectedMode == mode) return;
    setState(() {
      _selectedMode = mode;
      // Lazy-init album fetch on first Albums tab visit.
      if (mode == CleanupMode.albums && _albumsFuture == null) {
        _albumsFuture = _repo.getAllAlbums();
      }
    });
  }

  void _toggleAlbum(String id) {
    setState(() {
      if (_selectedAlbumIds.contains(id)) {
        _selectedAlbumIds.remove(id);
      } else {
        _selectedAlbumIds.add(id);
      }
    });
  }

  void _applyPreset(DateTime start, DateTime end) {
    setState(() {
      _rangeStart = start;
      _rangeEnd = end;
      _fetchRangeCount();
    });
  }

  Future<void> _pickStartDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _rangeStart ??
          DateTime.now().subtract(const Duration(days: 30)),
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked == null) return;
    setState(() {
      _rangeStart = picked;
      // Reset end if it's now before start.
      if (_rangeEnd != null && _rangeEnd!.isBefore(picked)) _rangeEnd = null;
      if (_rangeStart != null && _rangeEnd != null) _fetchRangeCount();
    });
  }

  Future<void> _pickEndDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _rangeEnd ?? DateTime.now(),
      firstDate: _rangeStart ?? DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked == null) return;
    setState(() {
      _rangeEnd = picked;
      if (_rangeStart != null) _fetchRangeCount();
    });
  }

  void _fetchRangeCount() {
    if (_rangeStart == null || _rangeEnd == null) return;
    // Reset count so Start is disabled while the new future is pending.
    _timeRangeCount = null;
    final future = _repo.getTotalCount(
      SwipeFilter.timeRange(start: _rangeStart!, end: _rangeEnd!),
    );
    _rangeCountFuture = future;
    future.then((count) {
      if (mounted) setState(() => _timeRangeCount = count);
    });
  }

  void _start() {
    if (!_isFilterValid) return;
    context.go(Routes.swipe, extra: _currentFilter);
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppTokens.spaceMD,
                AppTokens.spaceLG,
                AppTokens.spaceMD,
                AppTokens.spaceMD,
              ),
              child: Text('Cosa vuoi pulire?', style: AppTypography.displayMedium),
            ),

            // Segmented control
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppTokens.spaceMD),
              child: _SegmentedControl(
                selected: _selectedMode,
                onSelect: _selectMode,
              ),
            ),

            const SizedBox(height: AppTokens.spaceLG),

            // Tab content
            Expanded(
              child: IndexedStack(
                index: _selectedMode.index,
                children: [
                  _LibraryTab(countFuture: _libCountFuture),
                  _AlbumsTab(
                    albumsFuture: _albumsFuture,
                    selectedIds: _selectedAlbumIds,
                    onToggle: _toggleAlbum,
                  ),
                  _PeriodTab(
                    rangeStart: _rangeStart,
                    rangeEnd: _rangeEnd,
                    countFuture: _rangeCountFuture,
                    onPickStart: _pickStartDate,
                    onPickEnd: _pickEndDate,
                    onApplyPreset: _applyPreset,
                  ),
                ],
              ),
            ),

            // Start button
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppTokens.spaceMD,
                AppTokens.spaceMD,
                AppTokens.spaceMD,
                AppTokens.spaceLG,
              ),
              child: SizedBox(
                width: double.infinity,
                child: _StartButton(
                  enabled: _isFilterValid,
                  onTap: _start,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Segmented control ─────────────────────────────────────────────────────────

class _SegmentedControl extends StatelessWidget {
  const _SegmentedControl({
    required this.selected,
    required this.onSelect,
  });

  final CleanupMode selected;
  final void Function(CleanupMode) onSelect;

  static const _labels = {
    CleanupMode.entireLibrary: 'Libreria',
    CleanupMode.albums:        'Album',
    CleanupMode.timeRange:     'Periodo',
  };

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.backgroundSurface,
        borderRadius: BorderRadius.circular(AppTokens.radiusMD),
      ),
      padding: const EdgeInsets.all(3),
      child: Row(
        children: CleanupMode.values.map((mode) {
          final isSelected = mode == selected;
          return Expanded(
            child: GestureDetector(
              onTap: () => onSelect(mode),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                curve: Curves.easeInOut,
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.backgroundCard
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(AppTokens.radiusSM),
                ),
                alignment: Alignment.center,
                child: Text(
                  _labels[mode]!,
                  style: AppTypography.caption.copyWith(
                    color: isSelected
                        ? AppColors.textPrimary
                        : AppColors.textSecondary,
                    fontWeight: isSelected ? FontWeight.w500 : FontWeight.w400,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ── Tab 1: Tutta la Libreria ──────────────────────────────────────────────────

class _LibraryTab extends StatelessWidget {
  const _LibraryTab({required this.countFuture});

  final Future<int> countFuture;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppTokens.spaceMD),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FutureBuilder<int>(
            future: countFuture,
            builder: (context, snapshot) {
              final count = snapshot.data;
              final label = count != null
                  ? '${_formatCount(count)} foto · ordine semi-casuale per sessione'
                  : 'Caricamento…';
              return Text(label, style: AppTypography.body);
            },
          ),
        ],
      ),
    );
  }

  String _formatCount(int n) {
    if (n >= 1000) {
      final s = n.toString();
      return '${s.substring(0, s.length - 3)}.${s.substring(s.length - 3)}';
    }
    return n.toString();
  }
}

// ── Tab 2: Album ──────────────────────────────────────────────────────────────

class _AlbumsTab extends StatelessWidget {
  const _AlbumsTab({
    required this.albumsFuture,
    required this.selectedIds,
    required this.onToggle,
  });

  final Future<List<AlbumInfo>>? albumsFuture;
  final Set<String> selectedIds;
  final void Function(String) onToggle;

  @override
  Widget build(BuildContext context) {
    if (albumsFuture == null) {
      return const SizedBox.shrink();
    }

    return FutureBuilder<List<AlbumInfo>>(
      future: albumsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _AlbumSkeleton();
        }
        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppTokens.spaceMD),
            child: Text('Nessun album trovato.', style: AppTypography.body),
          );
        }

        final albums = snapshot.data!;
        final selCount = selectedIds.length;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (selCount > 0)
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppTokens.spaceMD, 0, AppTokens.spaceMD, AppTokens.spaceSM,
                ),
                child: Text(
                  '$selCount ${selCount == 1 ? 'album selezionato' : 'album selezionati'}',
                  style: AppTypography.caption.copyWith(
                    color: AppColors.keepGreen,
                  ),
                ),
              ),
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppTokens.spaceMD,
                ),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: AppTokens.spaceSM,
                  mainAxisSpacing: AppTokens.spaceSM,
                  childAspectRatio: 0.85,
                ),
                itemCount: albums.length,
                itemBuilder: (context, i) => _AlbumCard(
                  album: albums[i],
                  isSelected: selectedIds.contains(albums[i].id),
                  onTap: () => onToggle(albums[i].id),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _AlbumCard extends StatelessWidget {
  const _AlbumCard({
    required this.album,
    required this.isSelected,
    required this.onTap,
  });

  final AlbumInfo album;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppTokens.radiusMD),
          border: Border.all(
            color: isSelected ? AppColors.keepGreen : Colors.transparent,
            width: 2,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppTokens.radiusMD - 2),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    // Thumbnail
                    if (album.thumbnailAssetId != null)
                      _AlbumThumbnail(assetId: album.thumbnailAssetId!)
                    else
                      Container(color: AppColors.backgroundSurface),

                    // Selected overlay
                    if (isSelected)
                      Container(
                        color: AppColors.keepGreen.withOpacity(0.2),
                        alignment: Alignment.topRight,
                        padding: const EdgeInsets.all(6),
                        child: const Icon(
                          Icons.check_circle_rounded,
                          color: AppColors.keepGreen,
                          size: 20,
                        ),
                      ),
                  ],
                ),
              ),
              Container(
                color: AppColors.backgroundCard,
                padding: const EdgeInsets.symmetric(
                  horizontal: AppTokens.spaceSM,
                  vertical: AppTokens.spaceXS + 2,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      album.name,
                      style: AppTypography.caption.copyWith(
                        color: AppColors.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      '${album.assetCount}',
                      style: AppTypography.caption,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AlbumThumbnail extends StatefulWidget {
  const _AlbumThumbnail({required this.assetId});

  final String assetId;

  @override
  State<_AlbumThumbnail> createState() => _AlbumThumbnailState();
}

class _AlbumThumbnailState extends State<_AlbumThumbnail> {
  Future<AssetEntity?>? _future;

  @override
  void initState() {
    super.initState();
    _future = AssetEntity.fromId(widget.assetId);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<AssetEntity?>(
      future: _future,
      builder: (context, snap) {
        final asset = snap.data;
        if (asset == null) {
          return Container(color: AppColors.backgroundSurface);
        }
        return Image(
          image: AssetEntityImageProvider(
            asset,
            isOriginal: false,
            thumbnailSize: const ThumbnailSize(200, 200),
          ),
          fit: BoxFit.cover,
        );
      },
    );
  }
}

class _AlbumSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.symmetric(horizontal: AppTokens.spaceMD),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: AppTokens.spaceSM,
        mainAxisSpacing: AppTokens.spaceSM,
        childAspectRatio: 0.85,
      ),
      itemCount: 6,
      itemBuilder: (_, __) => ClipRRect(
        borderRadius: BorderRadius.circular(AppTokens.radiusMD),
        child: Container(color: AppColors.backgroundSurface),
      ),
    );
  }
}

// ── Tab 3: Periodo ────────────────────────────────────────────────────────────

class _PeriodTab extends StatelessWidget {
  const _PeriodTab({
    required this.rangeStart,
    required this.rangeEnd,
    required this.countFuture,
    required this.onPickStart,
    required this.onPickEnd,
    required this.onApplyPreset,
  });

  final DateTime? rangeStart;
  final DateTime? rangeEnd;
  final Future<int>? countFuture;
  final VoidCallback onPickStart;
  final VoidCallback onPickEnd;
  final void Function(DateTime start, DateTime end) onApplyPreset;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppTokens.spaceMD),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Quick preset chips
          Text('Periodo rapido', style: AppTypography.caption),
          const SizedBox(height: AppTokens.spaceSM),
          Wrap(
            spacing: AppTokens.spaceSM,
            runSpacing: AppTokens.spaceSM,
            children: [
              _PresetChip(
                label: 'Ultima settimana',
                onTap: () {
                  final end = DateTime.now();
                  final start = end.subtract(const Duration(days: 7));
                  onApplyPreset(start, end);
                },
              ),
              _PresetChip(
                label: 'Ultimo mese',
                onTap: () {
                  final end = DateTime.now();
                  final start = DateTime(end.year, end.month - 1, end.day);
                  onApplyPreset(start, end);
                },
              ),
              _PresetChip(
                label: 'Ultimi 3 mesi',
                onTap: () {
                  final end = DateTime.now();
                  final start = DateTime(end.year, end.month - 3, end.day);
                  onApplyPreset(start, end);
                },
              ),
              _PresetChip(
                label: 'Ultimo anno',
                onTap: () {
                  final end = DateTime.now();
                  final start = DateTime(end.year - 1, end.month, end.day);
                  onApplyPreset(start, end);
                },
              ),
            ],
          ),

          const SizedBox(height: AppTokens.spaceLG),

          // Date range pickers
          _DatePickerRow(
            prefix: 'Da',
            date: rangeStart,
            onTap: onPickStart,
          ),
          const SizedBox(height: AppTokens.spaceSM),
          _DatePickerRow(
            prefix: 'A',
            date: rangeEnd,
            onTap: onPickEnd,
          ),

          // Live count
          if (rangeStart != null && rangeEnd != null) ...[
            const SizedBox(height: AppTokens.spaceLG),
            FutureBuilder<int>(
              future: countFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return Text('Caricamento…', style: AppTypography.body);
                }
                final count = snapshot.data ?? 0;
                return Text(
                  count == 0
                      ? 'Nessuna foto in questo periodo'
                      : '$count foto in questo periodo',
                  style: AppTypography.body.copyWith(
                    color: count > 0
                        ? AppColors.textPrimary
                        : AppColors.textSecondary,
                  ),
                );
              },
            ),
          ],
        ],
      ),
    );
  }
}

class _PresetChip extends StatelessWidget {
  const _PresetChip({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppTokens.spaceMD,
          vertical: AppTokens.spaceXS + 2,
        ),
        decoration: BoxDecoration(
          color: AppColors.backgroundSurface,
          borderRadius: BorderRadius.circular(AppTokens.radiusSM),
        ),
        child: Text(label, style: AppTypography.caption),
      ),
    );
  }
}

class _DatePickerRow extends StatelessWidget {
  const _DatePickerRow({
    required this.prefix,
    required this.date,
    required this.onTap,
  });

  final String prefix;
  final DateTime? date;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final label = date != null
        ? '${date!.day} ${_monthName(date!.month)} ${date!.year}'
        : '—';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppTokens.spaceMD,
          vertical: AppTokens.spaceSM + 2,
        ),
        decoration: BoxDecoration(
          color: AppColors.backgroundSurface,
          borderRadius: BorderRadius.circular(AppTokens.radiusSM),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 24,
              child: Text(prefix, style: AppTypography.caption),
            ),
            const SizedBox(width: AppTokens.spaceSM),
            Text(label, style: AppTypography.body.copyWith(
              color: AppColors.textPrimary,
            )),
            const Spacer(),
            const Icon(Icons.expand_more_rounded,
                color: AppColors.textSecondary, size: 16),
          ],
        ),
      ),
    );
  }

  static const _months = [
    '', 'gen', 'feb', 'mar', 'apr', 'mag', 'giu',
    'lug', 'ago', 'set', 'ott', 'nov', 'dic',
  ];
  String _monthName(int m) => _months[m];
}

// ── Start button ──────────────────────────────────────────────────────────────

class _StartButton extends StatelessWidget {
  const _StartButton({required this.enabled, required this.onTap});

  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1.0 : 0.4,
      child: GestureDetector(
        onTap: enabled ? onTap : null,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: AppTokens.spaceMD),
          decoration: BoxDecoration(
            color: AppColors.keepGreen,
            borderRadius: BorderRadius.circular(AppTokens.radiusMD),
          ),
          alignment: Alignment.center,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Start',
                style: AppTypography.title.copyWith(
                  color: AppColors.background,
                ),
              ),
              const SizedBox(width: 6),
              const Icon(Icons.arrow_forward_rounded,
                  color: AppColors.background, size: 18),
            ],
          ),
        ),
      ),
    );
  }
}
