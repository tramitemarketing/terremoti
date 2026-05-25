# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Swipr** — a gesture-based photo gallery cleanup app by TramiteMarketing. On-device only. No backend, no cloud, no server-side anything. iOS first, Android phase 2, same Flutter codebase.

**Status:** Pre-code. `SWIPR_CONSTRUCTION.md` is the engineering bible — read it every session. `SWIPR_VISION.md` is for feature/product decisions. No Flutter project exists yet; files need to be created following the build order in `SWIPR_CONSTRUCTION.md §3`.

---

## Commands

No project exists yet. Once created:

```bash
# Generate Riverpod + Isar code after adding/modifying providers or Isar models
flutter pub run build_runner build --delete-conflicting-outputs

# Run on device/simulator
flutter run

# Analyze
flutter analyze
```

---

## Tech Stack (exact — do not deviate)

```yaml
flutter_riverpod: ^2.x        # all state
riverpod_annotation: ^2.x
go_router: ^13.x
photo_manager: ^3.x
isar: ^3.x                    # structured data (sessions, decisions, achievements)
isar_flutter_libs: ^3.x
hive_flutter: ^1.x            # simple key-value (settings, decide later IDs)
revenuecat_flutter_sdk: ^6.x
google_mobile_ads: ^4.x
```

Only two allowed network calls: RevenueCat SDK + AdMob SDK. Nothing else touches the network.

---

## Architecture

### Folder structure
`lib/` is organized as `core/`, `features/`, `shared/`. Full canonical structure is in `SWIPR_CONSTRUCTION.md §2`. Follow it exactly — do not reorganize.

### State management
- **All state via Riverpod** using `@riverpod` + code generation. Never use `setState`.
- `ref.watch` for reactive reads, `ref.read` for one-shot writes. No provider calls `.notifier` on another provider directly.
- Run `build_runner` after every new provider or Isar model.

### Storage split
- **Isar**: `SessionRecord`, `AssetDecisionRecord`, `AchievementRecord`, `CumulativeStats` (singleton id=1), `AssetCacheEntry`.
- **Hive** boxes: `'settings'` (Box\<dynamic\>) and `'decideLater'` (Box\<String\> — asset IDs only).
- `IsarService` is a singleton initialized in `main()` before `runApp()`. `HiveBoxes.openAll()` also called in `main()`.

### Routing
`go_router` via `routerProvider`. Routes defined in `Routes` abstract class. `/swipe` receives a `SwipeFilter` via `state.extra` — not `CleanupMode` directly.

### Theme tokens
Never hardcode colors, spacing, durations, or thresholds. Always use:
- `AppColors.*` for colors
- `AppTokens.*` for spacing, radii, durations, thresholds (`swipeCommitThreshold`, `preloadAhead`, `maxMemoryAssets`, etc.)
- `AppTypography.*` for text styles

---

## Build Order

Follow `SWIPR_CONSTRUCTION.md §3` strictly:

1. `core/storage/` — Isar models, Hive boxes, IsarService
2. `core/permissions/` — PermissionHandler
3. `core/photo/` — PhotoRepository, PagingController, CacheStrategy
4. `core/performance/` — MemoryBudget, PreloadEngine
5. `features/session/` — SwipeSessionProvider, TrashQueueProvider, DecideLaterProvider
6. `features/swipe/` — SwipePage, CardStack, GestureEngine, HUD
7. `features/onboarding/` — OnboardingPage, PermissionRequestPage, ModeSelectorPage
8. `features/smart_review/`
9. `features/achievements/`
10. `features/recap/`
11. `features/premium/`

---

## Already Implemented (§4 of construction doc)

These files are fully specified in `SWIPR_CONSTRUCTION.md §4` as ready code. Generate them exactly as written — do not invent alternatives:
- `lib/main.dart`
- `lib/app.dart`
- `lib/router.dart` (including `CleanupMode` enum and `SwipeFilter` data class)
- `lib/shared/theme/app_colors.dart`
- `lib/shared/theme/app_tokens.dart`
- `lib/shared/theme/app_typography.dart`
- `lib/shared/theme/app_theme.dart`

---

## Critical Rules

**Photo loading:**
- Never call `AssetPathEntity.getAssetList()` — loads entire library. Always use `getAssetListPaged(page: n, size: 50)`.
- For `entireLibrary` mode: cluster semi-random sort algorithm runs in `compute()`, seeded by day date. `AppTokens.clusterSize = 5`.
- All image decoding in `compute()` or background isolate — never on UI thread.

**Memory:**
- Hard cap: 150MB app target.
- LRU cache for decoded images: max `AppTokens.maxMemoryAssets` (20) entries. Store raw `Uint8List`, never widget `Image`.
- Preload `AppTokens.preloadAhead` (10) ahead, `AppTokens.preloadBehind` (5) behind.

**Swipe session state machine:**
- Phases: `loading → ready → swiping → animating → paused → reviewDecideLater → reviewTrash → confirmDelete → processingDelete → smartReview → result`
- While `isAnimating == true`: ignore ALL gesture input.
- Every swipe commit writes an `AssetDecisionRecord` to Isar immediately (in a write transaction).
- `photo_repository.getPage()` filters out assets with existing `keep`/`trash` decisions. Cache the decided-ID set at session start — don't query Isar per asset.

**Deletion:**
- Swipe Left = Trash Queue only. Real deletion happens once, at end of session, after a single system confirmation dialog.
- No immediate deletion ever.

**Paywall:**
- Trigger between sessions only. Never mid-session or mid-review.
- Free smart detection quota: `AppTokens.freeSmartDetectionQuota` (100 photos).

**Achievement unlock order at `result` phase:**
1. `CumulativeStatsProvider.updateAfterSession(stats)`
2. `AchievementProvider.checkAndUnlock(stats, updatedCumulative)`
3. Navigate to RecapPage with `SessionStats` (including `unlockedAchievementIds`)

---

## Out of Scope (do not build)

Cloud sync, user accounts, light mode, iPad layout, photo editing, in-app camera, direct social sharing, AI cloud tagging, push notifications, widgets/extensions.

If asked to add any of these: flag as out of scope per `SWIPR_CONSTRUCTION.md §22`.
