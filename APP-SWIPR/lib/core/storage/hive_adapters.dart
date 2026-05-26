import 'package:hive_flutter/hive_flutter.dart';

import 'hive_models.dart';

// ── typeId registry (never change after first run) ────────────────────────────
//   0 → SessionRecordAdapter
//   1 → AssetCacheEntryAdapter
//   2 → AssetDecisionRecordAdapter
//   3 → AchievementRecordAdapter
//   4 → CumulativeStatsAdapter

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Reads a nullable DateTime stored as millisecondsSinceEpoch (int | null).
DateTime? _readNullableDateTime(BinaryReader reader) {
  final ms = reader.read() as int?;
  return ms == null ? null : DateTime.fromMillisecondsSinceEpoch(ms);
}

/// Reads a nullable int stored via [BinaryWriter.write].
int? _readNullableInt(BinaryReader reader) => reader.read() as int?;

// ── SessionRecord ─────────────────────────────────────────────────────────────

class SessionRecordAdapter extends TypeAdapter<SessionRecord> {
  @override
  final int typeId = 0;

  @override
  SessionRecord read(BinaryReader reader) {
    return SessionRecord()
      ..id = reader.readInt()
      ..startedAt =
          DateTime.fromMillisecondsSinceEpoch(reader.readInt())
      ..endedAt = _readNullableDateTime(reader)
      ..keptCount = reader.readInt()
      ..trashedCount = reader.readInt()
      ..decideLaterCount = reader.readInt()
      ..mbFreed = reader.readDouble()
      ..skippedCloudCount = reader.readInt()
      ..smartFlaggedCount = reader.readInt();
  }

  @override
  void write(BinaryWriter writer, SessionRecord obj) {
    writer
      ..writeInt(obj.id)
      ..writeInt(obj.startedAt.millisecondsSinceEpoch)
      ..write(obj.endedAt?.millisecondsSinceEpoch)
      ..writeInt(obj.keptCount)
      ..writeInt(obj.trashedCount)
      ..writeInt(obj.decideLaterCount)
      ..writeDouble(obj.mbFreed)
      ..writeInt(obj.skippedCloudCount)
      ..writeInt(obj.smartFlaggedCount);
  }
}

// ── AssetCacheEntry ───────────────────────────────────────────────────────────

class AssetCacheEntryAdapter extends TypeAdapter<AssetCacheEntry> {
  @override
  final int typeId = 1;

  @override
  AssetCacheEntry read(BinaryReader reader) {
    return AssetCacheEntry()
      ..id = reader.readInt()
      ..assetId = reader.readString()
      ..sizeBytes = reader.readInt()
      ..durationMs = _readNullableInt(reader)
      ..createdAt = DateTime.fromMillisecondsSinceEpoch(reader.readInt())
      ..cachedAt = DateTime.fromMillisecondsSinceEpoch(reader.readInt());
  }

  @override
  void write(BinaryWriter writer, AssetCacheEntry obj) {
    writer
      ..writeInt(obj.id)
      ..writeString(obj.assetId)
      ..writeInt(obj.sizeBytes)
      ..write(obj.durationMs)
      ..writeInt(obj.createdAt.millisecondsSinceEpoch)
      ..writeInt(obj.cachedAt.millisecondsSinceEpoch);
  }
}

// ── AssetDecisionRecord ───────────────────────────────────────────────────────

class AssetDecisionRecordAdapter extends TypeAdapter<AssetDecisionRecord> {
  @override
  final int typeId = 2;

  @override
  AssetDecisionRecord read(BinaryReader reader) {
    return AssetDecisionRecord()
      ..id = reader.readInt()
      ..assetId = reader.readString()
      ..decision = reader.readString()
      ..decidedAt = DateTime.fromMillisecondsSinceEpoch(reader.readInt())
      ..sessionId = reader.readInt()
      ..smartFlags = reader.readList().cast<String>()
      ..smartFlagReviewed = reader.readBool();
  }

  @override
  void write(BinaryWriter writer, AssetDecisionRecord obj) {
    writer
      ..writeInt(obj.id)
      ..writeString(obj.assetId)
      ..writeString(obj.decision)
      ..writeInt(obj.decidedAt.millisecondsSinceEpoch)
      ..writeInt(obj.sessionId)
      ..writeList(obj.smartFlags)
      ..writeBool(obj.smartFlagReviewed);
  }
}

// ── AchievementRecord ─────────────────────────────────────────────────────────

class AchievementRecordAdapter extends TypeAdapter<AchievementRecord> {
  @override
  final int typeId = 3;

  @override
  AchievementRecord read(BinaryReader reader) {
    return AchievementRecord()
      ..id = reader.readInt()
      ..achievementId = reader.readString()
      ..unlockedAt = DateTime.fromMillisecondsSinceEpoch(reader.readInt())
      ..sessionId = reader.readInt();
  }

  @override
  void write(BinaryWriter writer, AchievementRecord obj) {
    writer
      ..writeInt(obj.id)
      ..writeString(obj.achievementId)
      ..writeInt(obj.unlockedAt.millisecondsSinceEpoch)
      ..writeInt(obj.sessionId);
  }
}

// ── CumulativeStats ───────────────────────────────────────────────────────────

class CumulativeStatsAdapter extends TypeAdapter<CumulativeStats> {
  @override
  final int typeId = 4;

  @override
  CumulativeStats read(BinaryReader reader) {
    return CumulativeStats()
      ..totalPhotosProcessed = reader.readInt()
      ..totalPhotosTrashed = reader.readInt()
      ..totalPhotosKept = reader.readInt()
      ..totalMbFreed = reader.readDouble()
      ..totalSessions = reader.readInt()
      ..lastSessionAt = _readNullableDateTime(reader)
      ..sessionsThisWeek = reader.readInt()
      ..sessionsThisMonth = reader.readInt();
  }

  @override
  void write(BinaryWriter writer, CumulativeStats obj) {
    writer
      ..writeInt(obj.totalPhotosProcessed)
      ..writeInt(obj.totalPhotosTrashed)
      ..writeInt(obj.totalPhotosKept)
      ..writeDouble(obj.totalMbFreed)
      ..writeInt(obj.totalSessions)
      ..write(obj.lastSessionAt?.millisecondsSinceEpoch)
      ..writeInt(obj.sessionsThisWeek)
      ..writeInt(obj.sessionsThisMonth);
  }
}
