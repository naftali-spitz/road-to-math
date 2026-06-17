import type Database from "better-sqlite3";
import { starterXPPolicy } from "@road-to-math/shared";

export const xpValues = {
  correctPracticeAnswer: starterXPPolicy.correctPracticeAnswer,
  correctRushAnswer: starterXPPolicy.correctRushAnswer,
  practiceSessionCompleted: starterXPPolicy.practiceSessionCompleted,
  rushCompleted: starterXPPolicy.rushCompleted,
  newPersonalBest: starterXPPolicy.newPersonalBest,
  levelMastered: starterXPPolicy.levelMastered
} as const;

export type XPEventType = keyof typeof xpValues;

export type AwardXPInput = {
  playerId: string;
  sessionId?: string | null;
  roadId?: string | null;
  worldId?: string | null;
  levelId?: string | null;
  eventType: XPEventType;
  reason?: string;
  metadata?: Record<string, unknown>;
};

export function awardXP(db: Database.Database, input: AwardXPInput) {
  const xpAmount = xpValues[input.eventType];

  if (xpAmount <= 0) {
    return { xpAwarded: 0 };
  }

  const result = db
    .prepare(
      `
        INSERT INTO player_xp_events (
          player_id,
          session_id,
          road_id,
          world_id,
          level_id,
          event_type,
          xp_amount,
          reason,
          metadata_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      input.playerId,
      input.sessionId ?? null,
      input.roadId ?? null,
      input.worldId ?? null,
      input.levelId ?? null,
      input.eventType,
      xpAmount,
      input.reason ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null
    );

  db.prepare("UPDATE players SET xp_total = xp_total + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
    xpAmount,
    input.playerId
  );

  return {
    xpAwarded: xpAmount,
    xpEventId: result.lastInsertRowid
  };
}
