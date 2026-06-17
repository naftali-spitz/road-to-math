import type Database from "better-sqlite3";
import { roadToArithmetic, type Level } from "@road-to-math/shared";
import { awardXP } from "./xp.js";

type AttemptAggregate = {
  total: number;
  correct: number;
};

type FormatAggregate = AttemptAggregate & {
  questionFormat: string;
};

type RushAggregate = {
  totalQuestions: number;
  correctCount: number;
  averageAnswerTimeMs: number | null;
};

type LevelProgressMasteryRow = {
  masteryState: string;
  masteredAt: string | null;
};

const unlockableStates = ["unlocked", "practicing", "rushReady", "mastered"];

function allLevels() {
  return roadToArithmetic.worlds.flatMap((world) => world.levels);
}

function findLevel(levelId: string) {
  return allLevels().find((level) => level.levelId === levelId) ?? null;
}

function findNextLevel(levelId: string) {
  const levels = allLevels();
  const index = levels.findIndex((level) => level.levelId === levelId);
  return index >= 0 ? levels[index + 1] ?? null : null;
}

function percent(correct: number, total: number) {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

function ensureLevelProgress(db: Database.Database, playerId: string, level: Level, state = "unlocked") {
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
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(player_id, road_id, world_id, level_id) DO NOTHING
    `
  ).run(playerId, level.roadId, level.worldId, level.levelId, level.coreInstinct.instinctId, state);
}

function calculateUnderstanding(db: Database.Database, playerId: string, levelId: string) {
  const row = db
    .prepare(
      `
        SELECT
          COUNT(*) AS total,
          COALESCE(SUM(is_correct), 0) AS correct
        FROM question_attempts
        WHERE player_id = ?
          AND level_id = ?
          AND mode = 'practice'
      `
    )
    .get(playerId, levelId) as AttemptAggregate;

  return percent(row.correct, row.total);
}

function calculateRecognition(db: Database.Database, playerId: string, level: Level) {
  const rows = db
    .prepare(
      `
        SELECT
          question_type AS questionFormat,
          COUNT(*) AS total,
          COALESCE(SUM(is_correct), 0) AS correct
        FROM question_attempts
        WHERE player_id = ?
          AND level_id = ?
          AND mode = 'practice'
        GROUP BY question_type
      `
    )
    .all(playerId, level.levelId) as FormatAggregate[];
  const byFormat = new Map(rows.map((row) => [row.questionFormat, row]));
  const formatPercents = level.supportedQuestionFormats.map((format) => {
    const row = byFormat.get(format);
    return row ? percent(row.correct, row.total) : 0;
  });

  return Math.min(...formatPercents);
}

function completedRushes(db: Database.Database, playerId: string, levelId: string) {
  return db
    .prepare(
      `
        SELECT
          total_questions AS totalQuestions,
          correct_count AS correctCount,
          average_answer_time_ms AS averageAnswerTimeMs
        FROM rush_sessions
        WHERE player_id = ?
          AND level_id = ?
          AND completed = 1
          AND total_questions > 0
        ORDER BY ended_at DESC
      `
    )
    .all(playerId, levelId) as RushAggregate[];
}

function calculateFluency(db: Database.Database, playerId: string, level: Level) {
  const benchmarkMs = level.benchmarkAnswerSeconds * 1000;
  const qualifyingRushes = completedRushes(db, playerId, level.levelId).filter(
    (rush) => rush.averageAnswerTimeMs !== null && rush.averageAnswerTimeMs <= benchmarkMs
  );
  const accuracies = qualifyingRushes.map((rush) => percent(rush.correctCount, rush.totalQuestions));

  return accuracies.length > 0 ? Math.max(...accuracies) : 0;
}

function hasExpressPass(db: Database.Database, playerId: string, level: Level) {
  const benchmarkMs = level.benchmarkAnswerSeconds * 1000;
  const qualifyingAccuracies = completedRushes(db, playerId, level.levelId)
    .filter((rush) => rush.averageAnswerTimeMs !== null && rush.averageAnswerTimeMs <= benchmarkMs)
    .map((rush) => percent(rush.correctCount, rush.totalQuestions))
    .sort((left, right) => right - left);

  if (qualifyingAccuracies.length < 2) {
    return false;
  }

  return Math.round((qualifyingAccuracies[0] + qualifyingAccuracies[1]) / 2) >= 90;
}

function unlockNextLevel(db: Database.Database, playerId: string, currentLevel: Level) {
  const nextLevel = findNextLevel(currentLevel.levelId);

  if (!nextLevel) {
    return null;
  }

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
      ON CONFLICT(player_id, road_id, world_id, level_id) DO UPDATE SET
        mastery_state = CASE
          WHEN level_progress.mastery_state = 'locked' THEN 'unlocked'
          ELSE level_progress.mastery_state
        END,
        unlocked_at = COALESCE(level_progress.unlocked_at, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
    `
  ).run(playerId, nextLevel.roadId, nextLevel.worldId, nextLevel.levelId, nextLevel.coreInstinct.instinctId);

  return nextLevel.levelId;
}

export function recomputeLevelProgress(db: Database.Database, playerId: string, levelId: string) {
  const level = findLevel(levelId);

  if (!level) {
    return null;
  }

  ensureLevelProgress(db, playerId, level);

  const existingProgress = db
    .prepare(
      `
        SELECT
          mastery_state AS masteryState,
          mastered_at AS masteredAt
        FROM level_progress
        WHERE player_id = ?
          AND level_id = ?
      `
    )
    .get(playerId, level.levelId) as LevelProgressMasteryRow;

  const understanding = calculateUnderstanding(db, playerId, level.levelId);
  const recognition = calculateRecognition(db, playerId, level);
  const fluency = calculateFluency(db, playerId, level);
  const isStandardMastered =
    understanding >= level.masteryPolicy.minUnderstandingPercent &&
    recognition >= level.masteryPolicy.minRecognitionPercent &&
    fluency >= level.masteryPolicy.minFluencyPercent;
  const expressPass = hasExpressPass(db, playerId, level);
  const mastered = isStandardMastered || expressPass;
  const unlockedNextLevelId = mastered ? unlockNextLevel(db, playerId, level) : null;
  const newlyMastered = mastered && existingProgress.masteredAt === null;

  db.prepare(
    `
      UPDATE level_progress
      SET
        mastery_state = CASE
          WHEN ? = 1 THEN 'mastered'
          WHEN mastery_state IN (${unlockableStates.map(() => "?").join(", ")}) THEN mastery_state
          ELSE 'unlocked'
        END,
        understanding_percent = ?,
        recognition_percent = ?,
        fluency_percent = ?,
        mastery_percent = ?,
        mastered_at = CASE
          WHEN ? = 1 THEN COALESCE(mastered_at, CURRENT_TIMESTAMP)
          ELSE mastered_at
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE player_id = ?
        AND level_id = ?
    `
  ).run(
    mastered ? 1 : 0,
    ...unlockableStates,
    understanding,
    recognition,
    fluency,
    Math.round((understanding + recognition + fluency) / 3),
    mastered ? 1 : 0,
    playerId,
    level.levelId
  );

  if (newlyMastered) {
    awardXP(db, {
      playerId,
      roadId: level.roadId,
      worldId: level.worldId,
      levelId: level.levelId,
      eventType: "levelMastered",
      reason: "Level mastered",
      metadata: {
        understanding,
        recognition,
        fluency,
        expressPass
      }
    });
  }

  return {
    levelId: level.levelId,
    understanding,
    recognition,
    fluency,
    mastered,
    expressPass,
    unlockedNextLevelId
  };
}
