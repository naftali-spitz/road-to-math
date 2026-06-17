import { randomUUID } from "node:crypto";
import { roadToArithmetic } from "@road-to-math/shared";
import { getDatabase } from "./database.js";

type PlayerRow = {
  id: string;
  displayName: string;
  avatarIcon: string | null;
  avatarColor: string | null;
  birthYear: number | null;
  xpTotal: number;
  createdAt: string;
  updatedAt: string;
};

type LevelProgressRow = {
  roadId: string;
  worldId: string;
  levelId: string;
  instinctId: string;
  masteryState: string;
  understandingPercent: number;
  recognitionPercent: number;
  fluencyPercent: number;
  masteryPercent: number;
  attemptsCount: number;
  practiceAttemptsCount: number;
  rushAttemptsCount: number;
  correctAttemptsCount: number;
  lastPlayedAt: string | null;
  unlockedAt: string | null;
  masteredAt: string | null;
};

type PracticeAccuracyRow = {
  levelId: string;
  totalAttempts: number;
  correctAttempts: number;
};

type BestRushRow = {
  levelId: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  averageAnswerTimeMs: number | null;
  completedAt: string | null;
};

type PlaySessionRow = {
  id: string;
  playerId: string;
  startedAt: string;
  lastActivityAt: string;
  endedAt: string | null;
  inactivityBoundaryMinutes: number;
};

const firstLevel = roadToArithmetic.worlds[0].levels[0];
const unlockedStates = ["unlocked", "practicing", "rushReady", "mastered", "goldMastered", "needsRefresh"];

function toPlayer(row: PlayerRow) {
  return {
    id: row.id,
    displayName: row.displayName,
    avatarIcon: row.avatarIcon,
    avatarColor: row.avatarColor,
    birthYear: row.birthYear,
    xpTotal: row.xpTotal,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function ensureInitialProgress(playerId: string) {
  const db = getDatabase();

  db.prepare(
    `
      INSERT INTO level_progress (
        player_id,
        road_id,
        world_id,
        level_id,
        instinct_id,
        mastery_state,
        unlocked_at
      )
      VALUES (?, ?, ?, ?, ?, 'unlocked', CURRENT_TIMESTAMP)
      ON CONFLICT(player_id, road_id, world_id, level_id) DO NOTHING
    `
  ).run(playerId, firstLevel.roadId, firstLevel.worldId, firstLevel.levelId, firstLevel.coreInstinct.instinctId);
}

function percent(correct: number, total: number) {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

function getProgressRecommendation(progress: LevelProgressRow | undefined, isUnlocked: boolean, hasNextLevel: boolean) {
  if (!isUnlocked) {
    return "Practice more";
  }

  if (progress?.masteryState === "mastered" || progress?.masteryState === "goldMastered") {
    return hasNextLevel ? "Next level unlocked" : "Level mastered";
  }

  if (
    progress &&
    progress.understandingPercent >= 80 &&
    progress.recognitionPercent >= 75 &&
    progress.fluencyPercent < 75
  ) {
    return "Try Rush";
  }

  return "Practice more";
}

export function listPlayers() {
  const rows = getDatabase()
    .prepare(
      `
        SELECT
          id,
          display_name AS displayName,
          avatar_icon AS avatarIcon,
          avatar_color AS avatarColor,
          birth_year AS birthYear,
          xp_total AS xpTotal,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM players
        ORDER BY created_at ASC
      `
    )
    .all() as PlayerRow[];

  return rows.map(toPlayer);
}

export function getPlayer(playerId: string) {
  const row = getDatabase()
    .prepare(
      `
        SELECT
          id,
          display_name AS displayName,
          avatar_icon AS avatarIcon,
          avatar_color AS avatarColor,
          birth_year AS birthYear,
          xp_total AS xpTotal,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM players
        WHERE id = ?
      `
    )
    .get(playerId) as PlayerRow | undefined;

  return row ? toPlayer(row) : null;
}

export function createPlayer(displayName: string) {
  const trimmedName = displayName.trim();

  if (trimmedName.length < 1) {
    throw new Error("Player name is required.");
  }

  if (trimmedName.length > 40) {
    throw new Error("Player name must be 40 characters or fewer.");
  }

  const id = randomUUID();
  const db = getDatabase();

  const create = db.transaction(() => {
    db.prepare("INSERT INTO players (id, display_name) VALUES (?, ?)").run(id, trimmedName);
    ensureInitialProgress(id);
  });

  create();

  const player = getPlayer(id);

  if (!player) {
    throw new Error("Player could not be created.");
  }

  return player;
}

export function getPlayerProgress(playerId: string) {
  ensureInitialProgress(playerId);

  const progressRows = getDatabase()
    .prepare(
      `
        SELECT
          road_id AS roadId,
          world_id AS worldId,
          level_id AS levelId,
          instinct_id AS instinctId,
          mastery_state AS masteryState,
          understanding_percent AS understandingPercent,
          recognition_percent AS recognitionPercent,
          fluency_percent AS fluencyPercent,
          mastery_percent AS masteryPercent,
          attempts_count AS attemptsCount,
          practice_attempts_count AS practiceAttemptsCount,
          rush_attempts_count AS rushAttemptsCount,
          correct_attempts_count AS correctAttemptsCount,
          last_played_at AS lastPlayedAt,
          unlocked_at AS unlockedAt,
          mastered_at AS masteredAt
        FROM level_progress
        WHERE player_id = ?
      `
    )
    .all(playerId) as LevelProgressRow[];
  const byLevelId = new Map(progressRows.map((row) => [row.levelId, row]));
  const allLevels = roadToArithmetic.worlds.flatMap((world) => world.levels);
  const practiceAccuracyRows = getDatabase()
    .prepare(
      `
        SELECT
          level_id AS levelId,
          COUNT(*) AS totalAttempts,
          COALESCE(SUM(is_correct), 0) AS correctAttempts
        FROM question_attempts
        WHERE player_id = ?
          AND mode = 'practice'
        GROUP BY level_id
      `
    )
    .all(playerId) as PracticeAccuracyRow[];
  const practiceAccuracyByLevelId = new Map(
    practiceAccuracyRows.map((row) => [
      row.levelId,
      {
        totalAttempts: row.totalAttempts,
        correctAttempts: row.correctAttempts,
        accuracyPercent: percent(row.correctAttempts, row.totalAttempts)
      }
    ])
  );
  const bestRushRows = getDatabase()
    .prepare(
      `
        SELECT
          level_id AS levelId,
          score,
          total_questions AS totalQuestions,
          correct_count AS correctCount,
          average_answer_time_ms AS averageAnswerTimeMs,
          ended_at AS completedAt
        FROM rush_sessions
        WHERE player_id = ?
          AND completed = 1
          AND total_questions > 0
        ORDER BY score DESC, correct_count DESC, average_answer_time_ms ASC
      `
    )
    .all(playerId) as BestRushRow[];
  const bestRushByLevelId = new Map<string, BestRushRow>();

  for (const row of bestRushRows) {
    if (!bestRushByLevelId.has(row.levelId)) {
      bestRushByLevelId.set(row.levelId, row);
    }
  }

  return {
    playerId,
    activeRoadId: roadToArithmetic.roadId,
    roads: [
      {
        roadId: roadToArithmetic.roadId,
        displayName: roadToArithmetic.displayName,
        isActive: true,
        worlds: roadToArithmetic.worlds.map((world) => ({
          worldId: world.worldId,
          displayName: world.displayName,
          order: world.order,
          levels: world.levels.map((level) => {
            const progress = byLevelId.get(level.levelId);
            const isUnlocked = progress !== undefined && unlockedStates.includes(progress.masteryState);
            const bestRush = bestRushByLevelId.get(level.levelId);
            const hasNextLevel = allLevels.some((entry) => entry.order === level.order + 1);

            return {
              levelId: level.levelId,
              roadId: level.roadId,
              worldId: level.worldId,
              order: level.order,
              displayName: level.displayName,
              coreInstinct: level.coreInstinct,
              benchmarkAnswerSeconds: level.benchmarkAnswerSeconds,
              supportedQuestionFormats: level.supportedQuestionFormats,
              isUnlocked,
              masteryState: progress?.masteryState ?? "locked",
              progress: progress
                ? {
                    ...progress,
                    practiceAccuracy: practiceAccuracyByLevelId.get(level.levelId) ?? {
                      totalAttempts: 0,
                      correctAttempts: 0,
                      accuracyPercent: 0
                    },
                    bestRush: bestRush
                      ? {
                          score: bestRush.score,
                          totalQuestions: bestRush.totalQuestions,
                          correctCount: bestRush.correctCount,
                          accuracyPercent: percent(bestRush.correctCount, bestRush.totalQuestions),
                          averageAnswerTimeMs: bestRush.averageAnswerTimeMs,
                          completedAt: bestRush.completedAt
                        }
                      : null,
                    recommendation: getProgressRecommendation(progress, isUnlocked, hasNextLevel)
                  }
                : null
            };
          })
        }))
      }
    ]
  };
}

export function isLevelUnlockedForPlayer(playerId: string, roadId: string, worldId: string, levelId: string) {
  ensureInitialProgress(playerId);

  const row = getDatabase()
    .prepare(
      `
        SELECT mastery_state AS masteryState
        FROM level_progress
        WHERE player_id = ?
          AND road_id = ?
          AND world_id = ?
          AND level_id = ?
      `
    )
    .get(playerId, roadId, worldId, levelId) as { masteryState: string } | undefined;

  return row !== undefined && unlockedStates.includes(row.masteryState);
}

export function startOrResumePlaySession(playerId: string) {
  const db = getDatabase();
  const player = getPlayer(playerId);

  if (!player) {
    return null;
  }

  const existing = db
    .prepare(
      `
        SELECT
          id,
          player_id AS playerId,
          started_at AS startedAt,
          last_activity_at AS lastActivityAt,
          ended_at AS endedAt,
          inactivity_boundary_minutes AS inactivityBoundaryMinutes
        FROM play_sessions
        WHERE player_id = ?
          AND ended_at IS NULL
          AND last_activity_at >= datetime('now', '-30 minutes')
        ORDER BY last_activity_at DESC
        LIMIT 1
      `
    )
    .get(playerId) as PlaySessionRow | undefined;

  if (existing) {
    db.prepare("UPDATE play_sessions SET last_activity_at = CURRENT_TIMESTAMP WHERE id = ?").run(existing.id);
    return {
      ...existing,
      lastActivityAt: new Date().toISOString(),
      resumed: true
    };
  }

  const id = randomUUID();
  db.prepare("INSERT INTO play_sessions (id, player_id) VALUES (?, ?)").run(id, playerId);

  const created = db
    .prepare(
      `
        SELECT
          id,
          player_id AS playerId,
          started_at AS startedAt,
          last_activity_at AS lastActivityAt,
          ended_at AS endedAt,
          inactivity_boundary_minutes AS inactivityBoundaryMinutes
        FROM play_sessions
        WHERE id = ?
      `
    )
    .get(id) as PlaySessionRow;

  return {
    ...created,
    resumed: false
  };
}
