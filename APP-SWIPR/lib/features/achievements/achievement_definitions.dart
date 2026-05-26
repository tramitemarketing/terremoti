/// All achievement ID constants used across the app.
///
/// Never hardcode these strings in providers or UI. Always reference via
/// [AchievementDefs].
abstract class AchievementDefs {
  // ── Session achievements ───────────────────────────────────────────────────
  /// 100+ swipe decisions in a single session.
  static const lightning = 'lightning';

  /// ≥ 80% of decisions sent to trash.
  static const ruthless = 'ruthless';

  /// 0 decide-later choices in a session with at least 1 decision.
  static const decisive = 'decisive';

  /// ≥ 500 MB freed in a single session.
  static const bigClean = 'big_clean';

  /// ≥ 500 total decisions (kept + trashed) in a session.
  static const marathon = 'marathon';

  /// First ever completed session.
  static const firstTime = 'first_time';

  // ── Cumulative photo milestones ────────────────────────────────────────────
  /// 100 total photos processed across all sessions.
  static const c100 = 'c_100';

  /// 500 total photos processed.
  static const c500 = 'c_500';

  /// 1 000 total photos processed.
  static const c1k = 'c_1k';

  /// 10 000 total photos processed.
  static const c10k = 'c_10k';

  // ── Cumulative storage milestones ──────────────────────────────────────────
  /// 1 GB total freed.
  static const gb1 = 'gb_1';

  /// 5 GB total freed.
  static const gb5 = 'gb_5';

  /// 10 GB total freed.
  static const gb10 = 'gb_10';

  // ── Streak achievements ────────────────────────────────────────────────────
  /// 3 sessions in the same calendar week.
  static const streak3 = 'streak_3';

  /// 7 total sessions across all time.
  static const habit = 'habit';

  /// 4 sessions in the same calendar month.
  static const monthly = 'monthly';
}

// ── Meta ──────────────────────────────────────────────────────────────────────

/// Display metadata for a single achievement.
class AchievementMeta {
  const AchievementMeta({
    required this.id,
    required this.name,
    required this.description,
    required this.emoji,
    required this.type,
  });

  final String id;

  /// Short display name in Italian.
  final String name;

  /// Ironic one-liner shown on the unlock overlay and recap screen.
  final String description;

  final String emoji;

  /// One of `'session'` | `'cumulative'` | `'streak'`.
  final String type;
}

// ── Catalog ───────────────────────────────────────────────────────────────────

/// Complete map of every achievement. Every [AchievementDefs] constant MUST
/// have a corresponding entry here — no achievement may appear in code without
/// display metadata.
const Map<String, AchievementMeta> achievementCatalog = {
  // ── Session ────────────────────────────────────────────────────────────────
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
    description:
        'Mezzo giga in una sessione. Sei un problema per gli screenshot inutili.',
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

  // ── Cumulative photo milestones ────────────────────────────────────────────
  AchievementDefs.c100: AchievementMeta(
    id: AchievementDefs.c100,
    name: 'Cento Foto',
    description: '100 decisioni prese. Stai prendendo il ritmo.',
    emoji: '💯',
    type: 'cumulative',
  ),
  AchievementDefs.c500: AchievementMeta(
    id: AchievementDefs.c500,
    name: 'Cinquecento',
    description: 'Mezzo migliaio di foto giudicate. Il tuo pollice è in forma.',
    emoji: '📸',
    type: 'cumulative',
  ),
  AchievementDefs.c1k: AchievementMeta(
    id: AchievementDefs.c1k,
    name: 'Mille Foto',
    description: 'Mille decisioni prese. Qualcuno deve pur farlo.',
    emoji: '🎯',
    type: 'cumulative',
  ),
  AchievementDefs.c10k: AchievementMeta(
    id: AchievementDefs.c10k,
    name: 'Decimila',
    description: 'Diecimila foto. A questo punto è filosofia.',
    emoji: '🌊',
    type: 'cumulative',
  ),

  // ── Cumulative storage milestones ──────────────────────────────────────────
  AchievementDefs.gb1: AchievementMeta(
    id: AchievementDefs.gb1,
    name: 'Un Giga Libero',
    description:
        'Un intero giga di foto dimenticate. Ora il tuo telefono respira.',
    emoji: '💾',
    type: 'cumulative',
  ),
  AchievementDefs.gb5: AchievementMeta(
    id: AchievementDefs.gb5,
    name: 'Cinque Giga',
    description: '5GB. Hai liberato lo spazio di un telefonino del 2010.',
    emoji: '🚀',
    type: 'cumulative',
  ),
  AchievementDefs.gb10: AchievementMeta(
    id: AchievementDefs.gb10,
    name: 'Gallery Master',
    description: '10GB. Non è pulizia, è archeologia digitale.',
    emoji: '🏆',
    type: 'cumulative',
  ),

  // ── Streak ─────────────────────────────────────────────────────────────────
  AchievementDefs.streak3: AchievementMeta(
    id: AchievementDefs.streak3,
    name: 'Tripletta',
    description: '3 sessioni in una settimana. Stai diventando un problema.',
    emoji: '🔥',
    type: 'streak',
  ),
  AchievementDefs.habit: AchievementMeta(
    id: AchievementDefs.habit,
    name: 'Abitudine',
    description: '7 sessioni totali. È ufficialmente un rituale.',
    emoji: '📅',
    type: 'streak',
  ),
  AchievementDefs.monthly: AchievementMeta(
    id: AchievementDefs.monthly,
    name: 'Costante',
    description: '4 sessioni in un mese. La tua galleria non dimentica.',
    emoji: '🗓️',
    type: 'streak',
  ),
};
