# SWIPR — CONSTRUCTION DOCUMENT
### Version 1.5 — Final Engineering Spec
> Engineering bible. Usare in OGNI sessione di coding.
> Accoppiare con SWIPR_VISION.md quando si inizia una feature nuova da zero.

---

## 0. RUOLO E CONTESTO

Sei un **senior Flutter staff engineer** specializzato in:
- Performance mobile su scala (50k+ foto)
- Gesture-first UX systems
- Architettura Riverpod
- iOS/Android photo permission APIs
- Memory-safe asset loading

Stai costruendo un'app **production-grade**, non un prototipo.

**Developer / Titolare:** TramiteMarketing
**App:** Swipr
**Piattaforma target:** iOS first, Android phase 2 (stesso codebase Flutter)

Metrica di successo:
> L'app deve sentirsi instant, stabile e inevitabile a 60fps.

NON fare:
- Backend di nessun tipo (non esiste backend)
- Feature cloud
- Complessità non necessaria
- Ignorare i vincoli di memoria mobile
- Usare `setState` — tutto lo stato passa da Riverpod
- Bloccare lo UI thread con IO o decoding immagini
- Hardcodare colori, spacing, durations (usare `AppTokens`, `AppColors`)

---

## 1. TECH STACK (ESATTO — NON DEVIARE)

```yaml
dependencies:
  flutter_riverpod: ^2.x
  riverpod_annotation: ^2.x
  go_router: ^13.x
  photo_manager: ^3.x
  isar: ^3.x
  isar_flutter_libs: ^3.x
  hive_flutter: ^1.x
  revenuecat_flutter_sdk: ^6.x
  google_mobile_ads: ^4.x

dev_dependencies:
  riverpod_generator: ^2.x
  build_runner: ^2.x
  isar_generator: ^3.x
```

**Storage split:**
- **Isar** → dati strutturati complessi: session history, stats, asset decisions, achievements, cumulative stats
- **Hive** → key-value semplice: settings, decide later IDs, onboarding state, smart detection quota

**Nessun backend. Nessun Firebase. Nessun Supabase. Nessuna REST call.**
Unici network calls consentiti: RevenueCat SDK, AdMob SDK.

---

## 2. FOLDER STRUCTURE (ENFORCED — NON RIORGANIZZARE)

```
lib/
├── main.dart                              ← IMPLEMENTED (§4)
├── app.dart                               ← IMPLEMENTED (§4)
├── router.dart                            ← IMPLEMENTED (§4)
│
├── core/
│   ├── photo/
│   │   ├── photo_repository.dart          ← BUILD (§7)
│   │   ├── paging_controller.dart         ← BUILD (§7)
│   │   └── cache_strategy.dart            ← BUILD (§7)
│   ├── permissions/
│   │   └── permission_handler.dart        ← BUILD (§8)
│   ├── storage/
│   │   ├── isar_service.dart              ← BUILD (§5)
│   │   ├── isar_models.dart               ← BUILD (§5)
│   │   └── hive_boxes.dart                ← BUILD (§5)
│   └── performance/
│       ├── memory_budget.dart             ← BUILD (§9)
│       └── preload_engine.dart            ← BUILD (§9)
│
├── features/
│   ├── onboarding/
│   │   ├── onboarding_page.dart           ← BUILD (§11)
│   │   ├── permission_request_page.dart
│   │   └── mode_selector_page.dart        ← BUILD (§7b)
│   ├── swipe/
│   │   ├── swipe_page.dart                ← BUILD (§10)
│   │   ├── card_stack/
│   │   │   ├── card_stack_widget.dart
│   │   │   └── swipe_card.dart
│   │   ├── gesture_engine/
│   │   │   └── swipe_gesture_detector.dart
│   │   ├── hud/
│   │   │   └── session_hud.dart
│   │   └── preload/
│   │       └── asset_preloader.dart
│   ├── session/
│   │   ├── trash_queue/
│   │   │   └── trash_queue_provider.dart
│   │   ├── decide_later/
│   │   │   └── decide_later_provider.dart
│   │   └── session_state/
│   │       └── swipe_session_provider.dart
│   ├── smart_review/                      ← BUILD (§18)
│   │   ├── smart_review_page.dart
│   │   ├── smart_flags_provider.dart
│   │   └── smart_detection_engine.dart
│   ├── achievements/                      ← BUILD (§19)
│   │   ├── achievement_provider.dart
│   │   ├── achievement_definitions.dart
│   │   └── achievement_unlock_overlay.dart
│   ├── recap/
│   │   └── recap_page.dart               ← BUILD (§20)
│   └── premium/
│       └── paywall_page.dart
│
└── shared/
    ├── widgets/
    ├── theme/
    │   ├── app_colors.dart               ← IMPLEMENTED (§4)
    │   ├── app_typography.dart           ← IMPLEMENTED (§4)
    │   ├── app_tokens.dart               ← IMPLEMENTED (§4)
    │   └── app_theme.dart                ← IMPLEMENTED (§4)
    └── utils/
```

---

## 3. BUILD ORDER (SEGUIRE QUESTA SEQUENZA)

```
1.  core/storage/          → Isar models, Hive boxes, IsarService
2.  core/permissions/      → PermissionHandler
3.  core/photo/            → PhotoRepository, PagingController, CacheStrategy
4.  core/performance/      → MemoryBudget, PreloadEngine
5.  features/session/      → SwipeSessionProvider, TrashQueueProvider, DecideLaterProvider
6.  features/swipe/        → SwipePage, CardStack, GestureEngine, HUD
7.  features/onboarding/   → OnboardingPage, PermissionRequestPage, ModeSelectorPage
8.  features/smart_review/ → SmartDetectionEngine, SmartFlagsProvider, SmartReviewPage
9.  features/achievements/ → AchievementDefinitions, AchievementProvider, UnlockOverlay
10. features/recap/        → RecapPage (dipende da §9)
11. features/premium/      → PaywallPage
```

---

## 4. FILE GIÀ IMPLEMENTATI (NON RIGENERARE)

Questi file esistono e sono corretti. Referenziarli senza modificare.

### `lib/main.dart`
```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:photo_manager/photo_manager.dart';

import 'app.dart';
import 'core/storage/isar_service.dart';
import 'core/storage/hive_boxes.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarBrightness: Brightness.dark,
    statusBarIconBrightness: Brightness.light,
  ));
  await Hive.initFlutter();
  await HiveBoxes.openAll();
  await IsarService.init();
  PhotoManager.setLog(false);
  runApp(const ProviderScope(child: SwiprApp()));
}
```

### `lib/app.dart`
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'router.dart';
import 'shared/theme/app_theme.dart';

class SwiprApp extends ConsumerWidget {
  const SwiprApp({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'Swipr',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark(),
      routerConfig: router,
    );
  }
}
```

### `lib/router.dart`

> ⚠️ `state.extra` del route `/swipe` usa `SwipeFilter`, non `CleanupMode` diretto.
> `CleanupMode` resta come enum interno di `SwipeFilter`.

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

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

enum CleanupMode { entireLibrary, albums, timeRange }
```

### Theme files (tutti IMPLEMENTED — non toccare)

**`lib/shared/theme/app_colors.dart`**
```dart
import 'package:flutter/material.dart';
abstract class AppColors {
  static const background        = Color(0xFF0D0D0D);
  static const backgroundCard    = Color(0xFF1A1A1A);
  static const backgroundSurface = Color(0xFF242424);
  static const keepGreen   = Color(0xFF2ECC71);
  static const trashRed    = Color(0xFFE74C3C);
  static const laterBlue   = Color(0xFF5B8DEF);
  static const flagAmber   = Color(0xFFF39C12);
  static const textPrimary   = Color(0xFFF5F5F5);
  static const textSecondary = Color(0xFF9A9A9A);
  static const textTertiary  = Color(0xFF606060);
  static const border        = Color(0xFF2E2E2E);
  static const hudBackground = Color(0xCC0D0D0D);
}
```

**`lib/shared/theme/app_tokens.dart`**
```dart
abstract class AppTokens {
  static const double spaceXS  = 4;
  static const double spaceSM  = 8;
  static const double spaceMD  = 16;
  static const double spaceLG  = 24;
  static const double spaceXL  = 40;
  static const double radiusSM   = 8;
  static const double radiusMD   = 16;
  static const double radiusLG   = 24;
  static const double radiusCard = 20;
  static const cardSwipeDuration   = Duration(milliseconds: 250);
  static const backgroundFadeSpeed = Duration(milliseconds: 80);
  static const undoAnimDuration    = Duration(milliseconds: 200);
  static const recapEnterDuration  = Duration(milliseconds: 400);
  static const double swipeCommitThreshold = 0.35;
  static const double swipeUpThreshold     = 0.25;
  static const int preloadAhead     = 10;
  static const int preloadBehind    = 5;
  static const int maxMemoryAssets  = 20;
  static const int freeSmartDetectionQuota = 100;
  static const int clusterSize = 5; // semi-random sort cluster size
}
```

**`lib/shared/theme/app_typography.dart`**
```dart
import 'package:flutter/material.dart';
import 'app_colors.dart';
abstract class AppTypography {
  static const _base = TextStyle(
    color: AppColors.textPrimary,
    fontFamily: 'SwiprDisplay',
    fontFamilyFallback: ['.SF Pro Display', 'sans-serif'],
    letterSpacing: -0.2,
  );
  static final displayLarge  = _base.copyWith(fontSize: 32, fontWeight: FontWeight.w500);
  static final displayMedium = _base.copyWith(fontSize: 24, fontWeight: FontWeight.w500);
  static final title         = _base.copyWith(fontSize: 18, fontWeight: FontWeight.w500);
  static final body          = _base.copyWith(fontSize: 15, fontWeight: FontWeight.w400, color: AppColors.textSecondary);
  static final caption       = _base.copyWith(fontSize: 13, fontWeight: FontWeight.w400, color: AppColors.textTertiary);
  static final hudLabel      = _base.copyWith(fontSize: 13, fontWeight: FontWeight.w500, letterSpacing: 0.2);
  static final storageFreed  = _base.copyWith(fontSize: 18, fontWeight: FontWeight.w500, color: AppColors.keepGreen);
}
```

**`lib/shared/theme/app_theme.dart`**
```dart
import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_typography.dart';
abstract class AppTheme {
  static ThemeData dark() {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: const ColorScheme.dark(
        background: AppColors.background,
        surface: AppColors.backgroundCard,
        primary: AppColors.keepGreen,
        error: AppColors.trashRed,
      ),
      textTheme: TextTheme(
        displayLarge:  AppTypography.displayLarge,
        displayMedium: AppTypography.displayMedium,
        titleMedium:   AppTypography.title,
        bodyMedium:    AppTypography.body,
        bodySmall:     AppTypography.caption,
      ),
      splashFactory:  NoSplash.splashFactory,
      highlightColor: Colors.transparent,
      splashColor:    Colors.transparent,
    );
  }
}
```

---

## 5. STORAGE LAYER

### `core/storage/isar_service.dart`

Singleton wrapper:
- Chiama `Isar.open([...schemas])` una sola volta all'avvio
- Espone `instance` getter usato ovunque nell'app
- Chiamato in `main.dart` prima di `runApp()`

---

### `core/storage/isar_models.dart`

**Collezioni Isar** (`@collection`):

```
SessionRecord
  - id: int (auto)
  - startedAt: DateTime
  - endedAt: DateTime?
  - keptCount: int
  - trashedCount: int
  - decideLaterCount: int
  - mbFreed: double
  - skippedCloudCount: int
  - smartFlaggedCount: int

AssetCacheEntry
  - id: int (auto)
  - assetId: String @Index(unique)
  - sizeBytes: int
  - durationMs: int?
  - createdAt: DateTime
  - cachedAt: DateTime

AssetDecisionRecord
  - id: int (auto)
  - assetId: String @Index(unique)
  - decision: String              // 'keep' | 'trash' | 'later'
  - decidedAt: DateTime
  - sessionId: int                // FK → SessionRecord.id
  - smartFlags: List<String>      // ['blur', 'duplicate', ...]
  - smartFlagReviewed: bool

AchievementRecord                 ← NUOVO
  - id: int (auto)
  - achievementId: String @Index(unique)
  - unlockedAt: DateTime
  - sessionId: int                // FK → SessionRecord in cui è stato sbloccato

CumulativeStats                   ← NUOVO (singleton, id sempre = 1)
  - id: int = 1
  - totalPhotosProcessed: int
  - totalPhotosTrashed: int
  - totalPhotosKept: int
  - totalMbFreed: double
  - totalSessions: int
  - lastSessionAt: DateTime?
  - sessionsThisWeek: int         // reset ogni lunedì
  - sessionsThisMonth: int        // reset ogni primo del mese
```

**Classi Dart pure** (NON collezioni Isar):

```dart
class SessionStats {
  final int keptCount;
  final int trashedCount;
  final int decideLaterCount;
  final double mbFreed;
  final Duration sessionDuration;
  final int skippedCloudCount;
  final int smartFlaggedCount;
  final List<String> unlockedAchievementIds; // achievement sbloccati in questa sessione
}

class SwipeFilter {
  final CleanupMode mode;
  final List<String> albumIds;      // popolato se mode == albums
  final DateTime? rangeStart;       // popolato se mode == timeRange
  final DateTime? rangeEnd;

  const SwipeFilter.entireLibrary()
      : mode = CleanupMode.entireLibrary,
        albumIds = const [],
        rangeStart = null,
        rangeEnd = null;

  const SwipeFilter.albums(this.albumIds)
      : mode = CleanupMode.albums,
        rangeStart = null,
        rangeEnd = null;

  const SwipeFilter.timeRange({required DateTime start, required DateTime end})
      : mode = CleanupMode.timeRange,
        albumIds = const [],
        rangeStart = start,
        rangeEnd = end;

  bool get isValid {
    if (mode == CleanupMode.albums) return albumIds.isNotEmpty;
    if (mode == CleanupMode.timeRange) return rangeStart != null && rangeEnd != null;
    return true;
  }
}

class AlbumInfo {
  final String id;
  final String name;
  final int assetCount;
  final String? thumbnailAssetId;
}
```

---

### `core/storage/hive_boxes.dart`

Aprire in `HiveBoxes.openAll()`:

```
'settings'    → Box<dynamic>   (onboarding, prefs)
'decideLater' → Box<String>    (asset IDs only)
```

Costanti per settings box:
```dart
static const kOnboardingDone          = 'onboarding_done';
static const kCleanupMode             = 'cleanup_mode';
static const kSmartDetectionUsedCount = 'smart_detection_used';
```

---

## 6. RIVERPOD PROVIDERS — LISTA COMPLETA

Tutti i provider usano `@riverpod` + `riverpod_generator`.
Runnare `build_runner` dopo ogni nuovo provider.

```
PhotoLibraryProvider        → AsyncNotifier — paginazione + asset cache
SwipeSessionProvider        → Notifier<SwipeSessionState> — state machine
TrashQueueProvider          → Notifier<List<String>> — IDs da eliminare
DecideLaterProvider         → Notifier<List<String>> — persistiti in Hive
StatsProvider               → Provider — computed da SwipeSessionState
SmartFlagsProvider          → AsyncNotifier<List<SmartFlag>> — flag su kept assets
SmartDetectionQuotaProvider → Provider<int> — quota free rimanente da Hive
AchievementProvider         → AsyncNotifier — controlla e sblocca achievement (§19)
CumulativeStatsProvider     → Notifier<CumulativeStats> — stats cross-session da Isar
```

**Regola**: nessun provider chiama `.notifier` di un altro provider direttamente.
`ref.read` per write monodirezionali; `ref.watch` per read reattive.

---

## 7. PHOTO LOADING PIPELINE

### `core/photo/photo_repository.dart`

```
MAI chiamare AssetPathEntity.getAssetList() — carica l'INTERA libreria.
SEMPRE usare AssetPathEntity.getAssetListPaged(page: n, size: 50).
```

Espone:
```dart
Future<List<AssetEntity>> getPage(int page, SwipeFilter filter)
Future<int> getTotalCount(SwipeFilter filter)
Future<AssetEntity?> getById(String id)
Future<List<AlbumInfo>> getAllAlbums()
```

**Regola deduplicazione decisioni**: prima di restituire asset, verificare in Isar
`AssetDecisionRecord`. Saltare silenziosamente asset con `decision == 'keep'` o
`decision == 'trash'`. Asset con `decision == 'later'` esclusi dal deck principale
ma mostrati in `reviewDecideLater`. Cachare l'insieme degli ID decisi a inizio
sessione — non interrogare Isar per ogni asset.

---

### Strategie di loading per CleanupMode

#### `CleanupMode.entireLibrary` — Cluster Semi-Random

NON mostrare le foto in ordine cronologico puro né completamente casuale.

**Algoritmo** (eseguire in `compute()`):

```dart
// 1. Carica tutti gli asset ID dalla libreria in ordine chronologico DESC
//    usando AssetPathEntity.getAssetListPaged in loop

// 2. Suddividi in cluster da AppTokens.clusterSize (5) foto consecutive
//    [ [id1,id2,id3,id4,id5], [id6,id7,id8,id9,id10], ... ]

// 3. Mescola l'ordine dei CLUSTER con seed basato sulla data del giorno
//    (stesso giorno = stesso ordine; giorno diverso = ordine diverso)
final seed = DateTime.now().year * 10000 +
             DateTime.now().month * 100 +
             DateTime.now().day;
final rng = Random(seed);
clusters.shuffle(rng);

// 4. Flatten: il risultato è la master ID list del deck
// [ cluster7[0..4], cluster2[0..4], cluster15[0..4], ... ]
```

**Perché**: foto dello stesso evento/giorno restano vicine (consistency),
ma l'utente non swipa in modo noioso dall'ultima foto alla più vecchia.
L'ordine cambia ogni sessione di un giorno diverso.

#### `CleanupMode.albums` — Multi-album

```dart
// 1. Fetch tutte le AssetPathEntity per gli albumIds selezionati
// 2. Per ogni path: fetch tutti gli asset ID (NON gli asset completi)
// 3. Costruire master list deduplicata per assetId, sorted by createdAt DESC
//    in compute() — può essere grande
// 4. Paginare attraverso la master list con PhotoManager.getAssetsByIds()
//    in batch da 50
```

Album di sistema mostrati prima nel picker (Recenti, Preferiti, Screenshot, Fotocamera),
poi album utente in ordine alfabetico. Non mostrare album con 0 asset.

#### `CleanupMode.timeRange`

```dart
final filterGroup = FilterOptionGroup(
  imageOption: const FilterOption(
    needTitle: false,
    sizeConstraint: SizeConstraint(ignoreSize: true),
  ),
  createTimeCond: DateTimeCond(
    min: filter.rangeStart!,
    max: filter.rangeEnd!,
    ignore: false,
  ),
);
// Paginare normalmente con getAssetListPaged sul path filtrato
```

---

### `core/photo/paging_controller.dart`

- Tiene reference al `SwipeFilter` corrente
- Per mode `albums`: tiene la master ID list deduplicata
- Deduplication del page fetch in-flight
- Page size: 50 asset per pagina
- Reset completo al cambio filter

### `core/photo/cache_strategy.dart`

LRU cache per immagini decodificate:
- Max entries: `AppTokens.maxMemoryAssets` (20)
- On eviction: cancellare decode in-flight per quell'asset
- Key: asset ID (String)
- Value: `Uint8List` (byte immagine decodificata)

**MAI storare widget `Image`** — solo raw bytes.

---

## 7b. MODE SELECTOR PAGE

### `features/onboarding/mode_selector_page.dart`

Costruisce un `SwipeFilter` e naviga a `Routes.swipe`.
Tre tab — utente sceglie un modo, lo configura, tocca "Start".

```
[ Tutta la Libreria ]  [ Album ]  [ Periodo ]   ← segmented control
────────────────────────────────────────────────
[ area contenuto specifica al tab ]
────────────────────────────────────────────────
[ Start →  (disabilitato finché SwipeFilter.isValid == false) ]
```

Il bottone Start è disabilitato (opacity 0.4, non tappabile) finché
`SwipeFilter.isValid` non è `true`.

---

**Tab 1 — Tutta la Libreria**

Nessuna configurazione. Filter immediatamente valido.
Mostrare count totale da `PhotoLibraryProvider`.
Esempio: "3.241 foto · ordine semi-casuale per sessione"

---

**Tab 2 — Album**

Loading: chiamare `PhotoRepository.getAllAlbums()` all'apertura del tab.
Skeleton loader durante il caricamento. MAI spinner bloccante.

Grid scrollabile di card album. Ogni card:
- Thumbnail (da `thumbnailAssetId`)
- Nome album
- Count asset
- Overlay checkmark quando selezionato (bordo `AppColors.keepGreen`)

Multi-select: tap per selezionare/deselezionare, nessun limite.
Counter "X album selezionati" aggiornato live.
Filter valido da ≥ 1 album selezionato.

---

**Tab 3 — Periodo**

Due date picker: data inizio e data fine.

```dart
// Usare showDatePicker nativo Flutter — NON costruire calendario custom
final start = await showDatePicker(
  context: context,
  initialDate: DateTime.now().subtract(const Duration(days: 30)),
  firstDate: DateTime(2000),
  lastDate: DateTime.now(),
);
final end = await showDatePicker(
  context: context,
  initialDate: DateTime.now(),
  firstDate: start ?? DateTime(2000),
  lastDate: DateTime.now(),
);
```

Display:
```
Da   [ 1 giu 2024  ▾ ]
A    [ 30 giu 2024 ▾ ]

342 foto in questo periodo   ← live count, aggiornato dopo entrambe le date
```

Quick preset chips (sopra i picker):
```
[ Ultima settimana ]  [ Ultimo mese ]  [ Ultimi 3 mesi ]  [ Ultimo anno ]
```
Chip popola i campi data — non sostituisce i picker.

Validazione: end ≥ start (enforced da `firstDate` nel secondo picker).
Filter valido solo quando entrambe le date sono set e il range ha ≥ 1 foto.

---

**On Start:**
```dart
final filter = switch (_selectedMode) {
  CleanupMode.entireLibrary => const SwipeFilter.entireLibrary(),
  CleanupMode.albums        => SwipeFilter.albums(_selectedAlbumIds),
  CleanupMode.timeRange     => SwipeFilter.timeRange(
                                 start: _rangeStart!,
                                 end: _rangeEnd!,
                               ),
};
context.go(Routes.swipe, extra: filter);
```

---

## 8. PERMISSION HANDLER

### `core/permissions/permission_handler.dart`

```dart
enum PhotoPermissionState {
  notDetermined,
  granted,
  limited,
  denied,
}

class PermissionHandler {
  Future<PhotoPermissionState> requestPermission();
  Future<PhotoPermissionState> currentState();
  Future<void> openSettings();
}
```

| Stato | Comportamento |
|---|---|
| `notDetermined` | Mostrare permission request page |
| `granted` | Caricare libreria completa, iniziare swipe |
| `limited` | Caricare foto disponibili, banner non bloccante, NON bloccare swipe |
| `denied` | Fallback onboarding con "Apri Impostazioni", NON crashare |

---

## 9. PERFORMANCE SYSTEM

### `core/performance/memory_budget.dart`

- Hard cap: 150MB memoria app target
- Soft cap su byte immagini decodificate: evict quando > `AppTokens.maxMemoryAssets`
- Espone `currentDecodedCount`, `isUnderPressure`

### `core/performance/preload_engine.dart`

Gira in isolate o `compute()`:
- Mantiene `AppTokens.preloadAhead` (10) immagini pronte avanti all'indice corrente
- Mantiene `AppTokens.preloadBehind` (5) in memoria per undo
- Cancella preload di asset in eviction
- MAI decodificare sullo UI isolate

**Trigger**: chiamato ad ogni incremento di `SwipeSessionState.currentIndex`.

---

## 10. SWIPE SESSION STATE MACHINE

### Stati (esaustivi — nessun altro stato permesso):

```dart
enum SwipeSessionPhase {
  loading,
  ready,
  swiping,
  animating,          // LOCK gesture qui
  paused,
  reviewDecideLater,
  reviewTrash,
  confirmDelete,
  processingDelete,
  smartReview,
  result,
}
```

### Modello `SwipeSessionState`:

```dart
class SwipeSessionState {
  final SwipeSessionPhase phase;
  final int currentIndex;
  final List<String> trashQueue;
  final List<String> decideLaterQueue;
  final String? lastAction;           // 'keep' | 'trash' | 'later'
  final String? undoAssetId;
  final bool isAnimating;
  final double mbToBeFreed;
  final int skippedCloudCount;
  final int smartDetectionUsedThisSession;
  final SwipeFilter filter;           // filter attivo per questa sessione
}
```

### Transizioni:

```
loading → ready                  : prima pagina caricata
ready → swiping                  : primo gesto
swiping → animating              : threshold swipe superata
animating → swiping              : animazione card completata
swiping → paused                 : pausa esplicita
paused → swiping                 : ripresa
swiping → reviewDecideLater      : sessione finita + decideLaterQueue non vuota
reviewDecideLater → reviewTrash  : review decide later completa
reviewTrash → confirmDelete      : utente tocca "Elimina tutto"
confirmDelete → processingDelete : utente conferma popup sistema
confirmDelete → reviewTrash      : utente annulla popup sistema
processingDelete → smartReview   : delete completo + smart flags esistono
processingDelete → result        : delete completo + nessun smart flag
smartReview → result             : smart review dimessa o completa
result → (achievement check)     : AchievementProvider controlla e scrive unlock
```

**LOCK rule**: mentre `isAnimating == true`, TUTTO l'input gesture va ignorato.

---

## 11. CARD STACK WIDGET

### Spec visiva:

- Stack di 3 card visibili
- Card top: full size, full opacity, gesture-enabled
- Card 2: `scale: 0.96`, `opacity: 0.7`
- Card 3: `scale: 0.92`, `opacity: 0.4`
- Border radius: `AppTokens.radiusCard` (20)
- Image rendering: `BoxFit.contain` — MAI `BoxFit.cover` — niente crop

### Overlay feedback swipe:

Gradient overlay sulla card. Opacity proporzionale alla distanza drag.
- Drag destra → `AppColors.keepGreen`
- Drag sinistra → `AppColors.trashRed`
- Drag su → `AppColors.laterBlue`

### NON fare:
- Rotazione card > 15 gradi max
- Label testuali "KEEP" / "TRASH" durante swipe
- Rebuild dell'intero card stack ad ogni frame

---

## 12. DELETION SYSTEM

```dart
Future<DeleteResult> executeBatchDelete(List<String> assetIds) async {
  // 1. Re-resolve asset da IDs immediatamente prima del delete
  // 2. Chiamare PhotoManager.editor.deleteWithIds(ids)
  // 3. Gestire partial failure
  // 4. Ritornare result con successCount e failedIds
  // 5. MAI throwcare — sempre ritornare result object
  // 6. Scrivere AssetDecisionRecord finale per ogni asset eliminato
}
```

Unico popup sistema: triggerato una volta, in fase `confirmDelete`.

---

## 13. ICLOUD ASSETS (iOS)

```dart
asset.isLocallyAvailable // photo_manager property
```

- Se `false`: saltare silenziosamente durante swipe
- Mantenere `skippedCloudCount` in session state
- Mostrare nel recap: "X foto erano su iCloud e sono state saltate"
- NON tentare download di asset iCloud durante la sessione

---

## 14. PERSISTENZA DECISIONI — PREVENIRE RE-SWIPE

Ogni azione swipe scrive immediatamente un record:

```dart
await isarService.instance.writeTxn(() async {
  await isarService.instance.assetDecisionRecords.put(
    AssetDecisionRecord()
      ..assetId = asset.id
      ..decision = decision.name
      ..decidedAt = DateTime.now()
      ..sessionId = currentSession.id
      ..smartFlags = []
      ..smartFlagReviewed = false,
  );
});
```

In `photo_repository.getPage()`: filtrare via asset con `decision == 'keep'` o
`decision == 'trash'`. `decision == 'later'` escluso dal deck principale ma visibile in
`reviewDecideLater`. Cachare l'insieme di ID decisi a inizio sessione.

---

## 15. MONETIZZAZIONE — LOGICA FREE TIER

### Quota smart detection free

```dart
// AppTokens.freeSmartDetectionQuota = 100
// SmartDetectionQuotaProvider legge kSmartDetectionUsedCount da Hive
// Espone: int remaining, bool isExhausted, bool isPremium
```

Prima sessione: smart detection gira automaticamente sulle prime 100 foto.
Quota esaurita: mostrare paywall TRA sessioni, mai mid-sessione.
Banner su home/mode selector: "Hai usato la tua analisi smart gratuita. Passa a Premium."

---

## 16. EDGE CASES

| Caso | Implementazione |
|---|---|
| Libreria vuota | `PhotoLibraryProvider` → stato vuoto → `result` con zero stats |
| Asset già decisi | `photo_repository` filtra via da `AssetDecisionRecord` |
| Permesso limitato | Caricare disponibili, mostrare `LimitedAccessBanner` |
| Permesso negato | Router → `PermissionDeniedPage` |
| App chiusa mid-session | Hive `decideLater` persiste. Isar `SessionRecord` salvato per ogni transizione. |
| Sessione interrotta | Al prossimo avvio: cercare `SessionRecord` con `endedAt == null` → offrire resume o discard |
| Delete partial failure | Recap: "X eliminate, Y non eliminabili" — mai silent failure |
| Storage dispositivo pieno | Catch `FileSystemException` → messaggio errore specifico |
| Smart quota esaurita | Paywall tra sessioni, non mid-review |
| Cluster sort — libreria < 5 foto | Fallback a ordine cronologico semplice |

---

## 17. SMART REVIEW SYSTEM

### Tipi di flag:

| Tipo | Metodo | Tier |
|---|---|---|
| `blur` | Varianza Laplaciana su thumbnail, soglia < 100 | Free (entro quota) |
| `low_quality` | File size < 50KB per una foto | Free (entro quota) |
| `duplicate` | pHash comparison | Premium |
| `near_duplicate` | pHash distance ≤ 8 | Premium |

Detection solo su thumbnail (max 200×200px) — mai full-res.

### `features/smart_review/smart_detection_engine.dart`

Gira in `compute()`. Accetta lista asset ID (keep pile), carica solo thumbnail,
ritorna `List<SmartFlag>`.

```dart
class SmartFlag {
  final String assetId;
  final String flagType;
  final String? duplicateOfId;
  final double confidence;
}
```

### `features/smart_review/smart_review_page.dart`

Grid view degli kept flaggati. Per ognuno:
- Thumbnail con badge `AppColors.flagAmber`
- Label: "Sfocata" / "Duplicata" / "Bassa qualità"
- Due azioni: **Cestina** | **Tieni comunque**

Sempre presente bottone "Salta" / "Fine". Non bloccare.
Trashing da qui → mini trash queue → batch delete finale review.

**Free tier**: mostrare count ("3 foto sembrano sfocate") + anteprima di UNA foto blurrata.
CTA: "Vedi tutte le foto flaggate — Passa a Premium".

---

## 18. ACHIEVEMENT SYSTEM

### `features/achievements/achievement_definitions.dart`

Definire tutte le costanti degli achievement. NON hardcodare stringhe nei provider.

```dart
abstract class AchievementDefs {
  // SESSION achievements
  static const lightning  = 'lightning';   // 100+ swipe in sessione
  static const ruthless   = 'ruthless';    // 80%+ in trash
  static const decisive   = 'decisive';    // 0 decide later
  static const bigClean   = 'big_clean';   // 500MB+ liberati
  static const marathon   = 'marathon';    // 500+ foto swipate
  static const firstTime  = 'first_time';  // prima sessione

  // CUMULATIVE milestones
  static const c100   = 'c_100';    // 100 foto totali
  static const c500   = 'c_500';    // 500 foto
  static const c1k    = 'c_1k';     // 1.000 foto
  static const c10k   = 'c_10k';    // 10.000 foto
  static const gb1    = 'gb_1';     // 1GB totale
  static const gb5    = 'gb_5';     // 5GB
  static const gb10   = 'gb_10';    // 10GB

  // STREAK achievements
  static const streak3  = 'streak_3';   // 3 sessioni in una settimana
  static const habit    = 'habit';      // 7 sessioni totali
  static const monthly  = 'monthly';    // 4 sessioni in un mese
}

class AchievementMeta {
  final String id;
  final String name;            // display name (italiano)
  final String description;     // messaggio ironico
  final String emoji;
  final String type;            // 'session' | 'cumulative' | 'streak'

  const AchievementMeta({
    required this.id,
    required this.name,
    required this.description,
    required this.emoji,
    required this.type,
  });
}

// Mappa completa — tutti gli achievement devono avere una entry qui
const Map<String, AchievementMeta> achievementCatalog = {
  AchievementDefs.lightning: AchievementMeta(
    id: AchievementDefs.lightning,
    name: 'Fulmine',
    description: 'Hai swippato come se avessi un treno da prendere. Rispetto.',
    emoji: '⚡',
    type: 'session',
  ),
  AchievementDefs.ruthless: AchievementMeta(
    id: AchievementDefs.ruthless,
    name: 'Spietato',
    description: 'Nessuna pietà per le foto brutte. Bene così.',
    emoji: '🗑️',
    type: 'session',
  ),
  AchievementDefs.decisive: AchievementMeta(
    id: AchievementDefs.decisive,
    name: 'Perfezionista',
    description: 'Zero rimandi. Hai deciso tutto adesso.',
    emoji: '✓',
    type: 'session',
  ),
  AchievementDefs.bigClean: AchievementMeta(
    id: AchievementDefs.bigClean,
    name: 'Grande Pulizia',
    description: 'Mezzo giga in una sessione. Sei un problema per gli screenshot inutili.',
    emoji: '🧹',
    type: 'session',
  ),
  AchievementDefs.marathon: AchievementMeta(
    id: AchievementDefs.marathon,
    name: 'Maratoneta',
    description: '500 foto. Non avevi niente di meglio da fare. Ci piaci.',
    emoji: '🏃',
    type: 'session',
  ),
  AchievementDefs.firstTime: AchievementMeta(
    id: AchievementDefs.firstTime,
    name: 'Primo Passo',
    description: 'Benvenuto. La tua galleria ti ringrazia.',
    emoji: '👋',
    type: 'session',
  ),
  AchievementDefs.c100: AchievementMeta(
    id: AchievementDefs.c100,
    name: 'Cento Foto',
    description: '100 decisioni prese. Stai prendendo il ritmo.',
    emoji: '💯',
    type: 'cumulative',
  ),
  AchievementDefs.gb1: AchievementMeta(
    id: AchievementDefs.gb1,
    name: 'Un Giga Libero',
    description: 'Un intero giga di foto dimenticate. Ora il tuo telefono respira.',
    emoji: '💾',
    type: 'cumulative',
  ),
  AchievementDefs.gb10: AchievementMeta(
    id: AchievementDefs.gb10,
    name: 'Gallery Master',
    description: '10GB. Non è pulizia, è archeologia digitale.',
    emoji: '🏆',
    type: 'cumulative',
  ),
  // ... aggiungere tutti gli altri dalla lista in AchievementDefs
};
```

---

### `features/achievements/achievement_provider.dart`

`AsyncNotifier<List<String>>` — lista di achievement ID sbloccati in questa sessione.

Chiamato alla transizione `result` della state machine. Controlla:

```dart
Future<List<String>> checkAndUnlock(SessionStats stats, CumulativeStats cumulative) async {
  final newlyUnlocked = <String>[];
  final alreadyUnlocked = // leggi AchievementRecord da Isar

  // SESSION achievements
  if (stats.keptCount + stats.trashedCount + stats.decideLaterCount >= 100)
    _tryUnlock(AchievementDefs.lightning, alreadyUnlocked, newlyUnlocked);

  final total = stats.trashedCount + stats.keptCount;
  if (total > 0 && stats.trashedCount / total >= 0.80)
    _tryUnlock(AchievementDefs.ruthless, alreadyUnlocked, newlyUnlocked);

  if (stats.decideLaterCount == 0 && total > 0)
    _tryUnlock(AchievementDefs.decisive, alreadyUnlocked, newlyUnlocked);

  if (stats.mbFreed >= 500)
    _tryUnlock(AchievementDefs.bigClean, alreadyUnlocked, newlyUnlocked);

  if (total >= 500)
    _tryUnlock(AchievementDefs.marathon, alreadyUnlocked, newlyUnlocked);

  if (cumulative.totalSessions == 1)
    _tryUnlock(AchievementDefs.firstTime, alreadyUnlocked, newlyUnlocked);

  // CUMULATIVE milestones
  _checkCumulativeThreshold(cumulative.totalPhotosProcessed, 100,
      AchievementDefs.c100, alreadyUnlocked, newlyUnlocked);
  _checkCumulativeThreshold(cumulative.totalPhotosProcessed, 500,
      AchievementDefs.c500, alreadyUnlocked, newlyUnlocked);
  // ... ecc.

  _checkCumulativeMbThreshold(cumulative.totalMbFreed, 1024,
      AchievementDefs.gb1, alreadyUnlocked, newlyUnlocked);
  // ... ecc.

  // STREAK achievements
  if (cumulative.sessionsThisWeek >= 3)
    _tryUnlock(AchievementDefs.streak3, alreadyUnlocked, newlyUnlocked);
  // ... ecc.

  // Scrivere nuovi AchievementRecord in Isar
  await _persistUnlocks(newlyUnlocked, stats.sessionId);

  return newlyUnlocked;
}
```

**Regola**: un achievement viene sbloccato UNA SOLA VOLTA. `_tryUnlock` controlla
`alreadyUnlocked` prima di aggiungere a `newlyUnlocked`.

---

### `features/achievements/achievement_unlock_overlay.dart`

Widget overlay mostrato sulla RecapPage quando vengono sbloccati achievement.

- Appare con animazione slide-up dal basso
- Mostra: emoji + nome + description del primo achievement sbloccato
- Se più di 1 achievement: carousel swipabile
- Tap ovunque o dopo 4 secondi: dismiss automatico
- NON bloccare la RecapPage — overlay sovrapposto, non modale
- Design: card dark (`AppColors.backgroundCard`) con bordo sottile `AppColors.keepGreen`

---

## 19. CUMULATIVE STATS — AGGIORNAMENTO CROSS-SESSION

### `CumulativeStatsProvider`

`Notifier<CumulativeStats>` — aggiornato al termine di ogni sessione (fase `result`).

```dart
Future<void> updateAfterSession(SessionStats session) async {
  final current = await isarService.instance.cumulativeStats.get(1)
      ?? CumulativeStats(); // prima sessione: inizializza con zero

  final now = DateTime.now();

  // Reset contatori weekly/monthly se necessario
  final updatedWeekly = _isSameWeek(current.lastSessionAt, now)
      ? current.sessionsThisWeek + 1
      : 1;

  final updatedMonthly = _isSameMonth(current.lastSessionAt, now)
      ? current.sessionsThisMonth + 1
      : 1;

  final updated = CumulativeStats()
    ..id = 1
    ..totalPhotosProcessed = current.totalPhotosProcessed
        + session.keptCount + session.trashedCount + session.decideLaterCount
    ..totalPhotosTrashed = current.totalPhotosTrashed + session.trashedCount
    ..totalPhotosKept = current.totalPhotosKept + session.keptCount
    ..totalMbFreed = current.totalMbFreed + session.mbFreed
    ..totalSessions = current.totalSessions + 1
    ..lastSessionAt = now
    ..sessionsThisWeek = updatedWeekly
    ..sessionsThisMonth = updatedMonthly;

  await isarService.instance.writeTxn(() async {
    await isarService.instance.cumulativeStats.put(updated);
  });
}
```

**Ordine di operazioni alla transizione `result`**:
1. `CumulativeStatsProvider.updateAfterSession(stats)`
2. `AchievementProvider.checkAndUnlock(stats, updatedCumulative)`
3. Navigare a RecapPage con `SessionStats` (incluso `unlockedAchievementIds`)

---

## 20. RECAP PAGE

### `features/recap/recap_page.dart`

Riceve `SessionStats` via `state.extra` dal router.

**Struttura schermata:**

```
┌─────────────────────────────────┐
│  [emoji grande]  X.X GB liberati │  ← grande, centrato
│  X foto eliminate                │
├─────────────────────────────────┤
│  [AchievementUnlockOverlay]      │  ← se achievement sbloccati
├─────────────────────────────────┤
│  Stats secondarie:               │
│  · X foto tenute                 │
│  · X rimesse in decide later     │
│  · X foto iCloud saltate         │
│  · X trovate da smart review     │
├─────────────────────────────────┤
│  "Your gallery feels lighter."   │  ← messaggio ironico
├─────────────────────────────────┤
│  [Condividi risultati]  [Fine]   │
└─────────────────────────────────┘
```

**Share card**: toccando "Condividi risultati" generare immagine shareable.
La card include: MB liberati, achievement badge (se presente), stats sessione.
Non richiedere account o permessi aggiuntivi — solo `Share.shareXFiles()`.

Se la generazione share card fallisce: mostrare snackbar, non bloccare la schermata.

---

## 21. PERFORMANCE CHECKLIST — PRIMA DI OGNI PR

- [ ] 60fps durante l'animazione swipe
- [ ] Decoding immagini in `compute()` o background isolate
- [ ] Card stack NON rebuilda a meno che `currentIndex` cambi
- [ ] `TrashQueueProvider` salva solo ID, mai oggetti `AssetEntity`
- [ ] LRU cache evict quando > `AppTokens.maxMemoryAssets`
- [ ] Nessun `setState` — tutto tramite Riverpod
- [ ] Nessun colore, spacing o duration hardcoded
- [ ] Ogni edge case di §16 ha un path UI
- [ ] `photo_manager` paginazione usata — mai full library load
- [ ] `AssetDecisionRecord` scritto ad ogni swipe commit (transazione Isar)
- [ ] `photo_repository.getPage()` filtra asset già decisi
- [ ] Smart detection gira solo su thumbnail
- [ ] Quota smart detection controllata prima del run
- [ ] Master ID list multi-album costruita in `compute()`
- [ ] `SwipeFilter.isValid` verificato prima di abilitare Start
- [ ] End date ≥ start date (enforced nel secondo picker)
- [ ] Album list carica con skeleton UI
- [ ] Cluster sort algoritmo in `compute()`, mai su UI thread
- [ ] `CumulativeStats` aggiornato PRIMA di `AchievementProvider.checkAndUnlock()`
- [ ] Achievement scritti in Isar solo se non già presenti
- [ ] `AchievementUnlockOverlay` non blocca la RecapPage (overlay, non modale)

---

## 22. OUT OF SCOPE — NON COSTRUIRE

- Cloud sync
- Account utente / autenticazione
- Light mode
- Layout iPad
- Photo editing
- In-app camera
- Social sharing diretto (solo export share card)
- AI cloud tagging
- Server-side qualsiasi
- Push notifications (MVP)
- Widget / extensions (MVP)

Se richiesto di aggiungere queste feature: segnalarlo esplicitamente come out of scope.

---

*Fine SWIPR Construction Document — v1.5*
