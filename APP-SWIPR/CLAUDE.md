# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Swipr** — a gesture-based photo gallery cleanup app by TramiteMarketing. On-device only. No backend, no cloud, no server-side anything. iOS first, Android phase 2, same Flutter codebase.

`SWIPR_CONSTRUCTION.md` is the engineering bible for feature decisions and build order. `SWIPR_VISION.md` is for product/UX decisions.

---

## Commands

```bash
# Generate Riverpod code after adding/modifying providers
flutter pub run build_runner build --delete-conflicting-outputs

# Run on device/simulator
flutter run

# Analyze
flutter analyze
```

---

## Tech Stack (exact — do not deviate)

```yaml
flutter_riverpod: ^3.0.0        # all state
riverpod_annotation: ^4.0.0
riverpod_generator: ^4.0.0      # dev
go_router: ^17.x
photo_manager: ^3.x
hive_flutter: ^1.x              # ALL structured data + key-value storage
purchases_flutter: ^10.x        # RevenueCat
google_mobile_ads: ^8.x
share_plus: ^13.x
path_provider: ^2.x
```

**Important:** Isar is NOT used. All persistence goes through Hive. The file `lib/core/storage/isar_models.dart` contains pure Dart models (no Isar annotations) — the name is historical. Only two allowed network calls: RevenueCat SDK + AdMob SDK.

---

## Architecture

### Folder structure
`lib/` is organized as `core/`, `features/`, `shared/`. Follow it exactly — do not reorganize.

### State management
- **All state via Riverpod** using `@riverpod` + code generation. Never use `setState`.
- `ref.watch` for reactive reads, `ref.read` for one-shot writes. No provider calls `.notifier` on another provider directly.
- Run `build_runner` after every new provider.

### Storage — Hive only

All persistence uses Hive. There are five boxes opened at startup in `main()`:

| Box | Type | Key | Content |
|---|---|---|---|
| `sessions` | `Box<SessionRecord>` | `millisecondsSinceEpoch.toString()` | One per session |
| `decisions` | `Box<AssetDecisionRecord>` | `assetId` | One per swipe commit |
| `achievements` | `Box<AchievementRecord>` | `achievementId` | Unlock records |
| `cumulativeStats` | `Box<CumulativeStats>` | `0` (singleton) | Cross-session totals |
| `assetCache` | `Box<AssetCacheEntry>` | `assetId` | Cache metadata |

**TypeId registry — never change or reuse:**
- `0` → `SessionRecordAdapter`
- `1` → `AssetCacheEntryAdapter`
- `2` → `AssetDecisionRecordAdapter`
- `3` → `AchievementRecordAdapter`
- `4` → `CumulativeStatsAdapter`

All adapters are registered in `main()` before `HiveBoxes.openAll()`. `HiveService` is a static helper class (not a singleton); `HiveBoxes` getters return the single open box instance.

### Shared pure-Dart models (`lib/core/storage/isar_models.dart`)
These are NOT persisted — they are shared across routing, photo_repository, and session state:
- `CleanupMode` enum (`entireLibrary`, `albums`, `timeRange`)
- `SwipeFilter` (passed via `state.extra` to `/swipe`)
- `SessionStats` (passed via `state.extra` to `/recap`)
- `AlbumInfo`

### Routing
`go_router` via `routerProvider` (code-generated). Routes defined in `Routes` abstract class (`lib/router.dart`). `/swipe` receives a `SwipeFilter` via `state.extra`.

### Theme tokens
Never hardcode colors, spacing, durations, or thresholds. Always use:
- `AppColors.*` for colors
- `AppTokens.*` for spacing, radii, durations, thresholds
- `AppTypography.*` for text styles

---

## Critical Rules

**Photo loading:**
- Never call `AssetPathEntity.getAssetList()` — always use `getAssetListPaged(page: n, size: 50)`.
- For `entireLibrary` mode: cluster semi-random sort algorithm runs in `compute()`, seeded by day date. `AppTokens.clusterSize = 5`.
- All image decoding in `compute()` or background isolate — never on UI thread.

**Memory:**
- Hard cap: 150MB app target.
- LRU cache for decoded images: max `AppTokens.maxMemoryAssets` (20) entries. Store raw `Uint8List`, never widget `Image`.
- Preload `AppTokens.preloadAhead` (10) ahead, `AppTokens.preloadBehind` (5) behind.

**Swipe session state machine (`SwipeSessionPhase`):**
- Phases: `loading → ready → swiping → animating → paused → reviewDecideLater → reviewTrash → confirmDelete → processingDelete → smartReview → result`
- While `isAnimating == true`: ignore ALL gesture input.
- Every swipe commit writes an `AssetDecisionRecord` to Hive first (source of truth), then updates in-memory state.
- `photo_repository.getPage()` filters out assets with existing decisions. Cache the decided-ID set at session start via `HiveService.getAllDecidedIds()` — do not query per-asset.

**`copyWith` pattern for nullable fields in `SwipeSessionState`:** pass a wrapper function: `copyWith(lastAction: () => null)` clears to null; omitting leaves unchanged.

**Deletion:**
- Swipe Left = Trash Queue only. Real deletion happens once, at end of session, after a single system confirmation dialog.
- No immediate deletion ever.

**Paywall:**
- Trigger between sessions only. Never mid-session or mid-review.
- Free smart detection quota: `AppTokens.freeSmartDetectionQuota` (100 photos).

**Achievement unlock order at `result` phase (must never change):**
1. `CumulativeStatsProvider.updateAfterSession(stats)`
2. `AchievementProvider.checkAndUnlock(stats, updatedCumulative)`
3. Navigate to RecapPage with `SessionStats` (including `unlockedAchievementIds`)

---

## Out of Scope (do not build)

Cloud sync, user accounts, light mode, iPad layout, photo editing, in-app camera, direct social sharing, AI cloud tagging, push notifications, widgets/extensions.

If asked to add any of these: flag as out of scope per `SWIPR_CONSTRUCTION.md §22`.
