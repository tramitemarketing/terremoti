import 'hive_boxes.dart';
import 'hive_models.dart';

/// Thin service layer over the Hive boxes.
///
/// No singleton pattern needed — [HiveBoxes] getters already return the
/// single open box instance. All methods are synchronous where Hive allows
/// it; only writes that call [HiveObject.save] or [Box.put] need async.
///
/// ## Key strategy
///
/// | Box              | Key type | Key value                         |
/// |------------------|----------|-----------------------------------|
/// | sessions         | String   | `DateTime.now().millisecondsSinceEpoch.toString()` |
/// | decisions        | String   | `assetId`                         |
/// | achievements     | String   | `achievementId`                   |
/// | cumulativeStats  | int      | `0` (singleton)                   |
/// | assetCache       | String   | `assetId`                         |
class HiveService {
  HiveService._();

  // ── Sessions ───────────────────────────────────────────────────────────────

  /// Saves [r] using [DateTime.now().millisecondsSinceEpoch] as both the
  /// box key and [SessionRecord.id]. Returns the id used.
  static Future<int> saveSession(SessionRecord r) async {
    final id = DateTime.now().millisecondsSinceEpoch;
    r.id = id;
    await HiveBoxes.sessions.put(id.toString(), r);
    return id;
  }

  static SessionRecord? getSession(int id) => HiveBoxes.sessions.get(id.toString());

  /// All sessions in insertion order. Use for historical stats.
  static List<SessionRecord> getAllSessions() =>
      HiveBoxes.sessions.values.toList();

  // ── Decisions ──────────────────────────────────────────────────────────────

  /// Saves [r] keyed by [AssetDecisionRecord.assetId].
  static Future<void> saveDecision(AssetDecisionRecord r) async {
    await HiveBoxes.decisions.put(r.assetId, r);
  }

  /// Removes the decision for [assetId]. No-op if not present.
  static Future<void> deleteDecision(String assetId) async {
    await HiveBoxes.decisions.delete(assetId);
  }

  /// Removes ALL decisions. Debug/testing only — never call in production.
  static Future<void> clearAllDecisions() => HiveBoxes.decisions.clear();

  /// O(1) check — does not load the record.
  static bool hasDecision(String assetId) =>
      HiveBoxes.decisions.containsKey(assetId);

  /// Returns the full set of decided asset IDs. Load once at session start
  /// and cache in the session provider — do not call per-asset.
  static Set<String> getAllDecidedIds() =>
      HiveBoxes.decisions.keys.cast<String>().toSet();

  // ── Cumulative stats ───────────────────────────────────────────────────────

  /// Returns the singleton [CumulativeStats], or a zero-initialised instance
  /// if this is the first session.
  static CumulativeStats loadCumulativeStats() =>
      HiveBoxes.cumulativeStats.get(0) ?? CumulativeStats();

  /// Persists [s] at key 0 (singleton).
  static Future<void> saveCumulativeStats(CumulativeStats s) async {
    await HiveBoxes.cumulativeStats.put(0, s);
  }

  // ── Achievements ───────────────────────────────────────────────────────────

  /// O(1) — used by [AchievementNotifier._tryUnlock] to skip re-unlocking.
  static bool hasAchievement(String id) =>
      HiveBoxes.achievements.containsKey(id);

  /// Saves [r] keyed by [AchievementRecord.achievementId].
  static Future<void> saveAchievement(AchievementRecord r) async {
    await HiveBoxes.achievements.put(r.achievementId, r);
  }
}
