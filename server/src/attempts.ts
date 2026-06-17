import { randomUUID } from "node:crypto";
import { checkAnswer, roadToArithmetic, type AnswerValue, type GeneratedQuestion } from "@road-to-math/shared";
import { getDatabase } from "./database.js";
import { recomputeLevelProgress } from "./mastery.js";
import { getPlayer, isLevelUnlockedForPlayer, startOrResumePlaySession } from "./players.js";
import { awardXP } from "./xp.js";

export type SubmitPracticeAttemptInput = {
  question: GeneratedQuestion;
  selectedAnswer: AnswerValue | string;
  answerTimeMs: number;
};

export type StartRushSessionInput = {
  roadId: string;
  worldId: string;
  levelId: string;
  instinctId: string;
  durationSeconds: number;
};

export type SubmitRushAttemptInput = SubmitPracticeAttemptInput;

export type CompletePracticeSessionInput = {
  roadId: string;
  worldId: string;
  levelId: string;
};

type RushAttemptRow = {
  isCorrect: number;
  answerTimeMs: number | null;
};

type RushSessionRow = {
  id: string;
  playerId: string;
  sessionId: string;
  roadId: string;
  worldId: string;
  levelId: string;
  instinctId: string;
  durationSeconds: number;
};

export class AttemptAccessError extends Error {
  statusCode = 403;

  constructor(message: string) {
    super(message);
    this.name = "AttemptAccessError";
  }
}

function stringifyAnswer(value: AnswerValue | string) {
  return typeof value === "string" ? value : JSON.stringify(value);
}

function assertLevelUnlocked(playerId: string, roadId: string, worldId: string, levelId: string) {
  if (!isLevelUnlockedForPlayer(playerId, roadId, worldId, levelId)) {
    throw new AttemptAccessError("Level is locked.");
  }
}

function assertQuestionMatchesRushSession(rushSession: RushSessionRow, question: GeneratedQuestion) {
  const matchesSession =
    question.roadId === rushSession.roadId &&
    question.worldId === rushSession.worldId &&
    question.levelId === rushSession.levelId &&
    question.instinctId === rushSession.instinctId;

  if (!matchesSession) {
    throw new AttemptAccessError("Rush attempt question does not match the Rush session level.");
  }
}

export function submitPracticeAttempt(playerId: string, input: SubmitPracticeAttemptInput) {
  const player = getPlayer(playerId);

  if (!player) {
    return null;
  }

  assertLevelUnlocked(playerId, input.question.roadId, input.question.worldId, input.question.levelId);

  const session = startOrResumePlaySession(playerId);

  if (!session) {
    return null;
  }

  const answerTimeMs = Math.max(0, Math.round(Number(input.answerTimeMs) || 0));
  const result = checkAnswer(input.question, input.selectedAnswer);
  const db = getDatabase();
  let xpAwarded = 0;

  const saveAttempt = db.transaction(() => {
    const insert = db
      .prepare(
        `
          INSERT INTO question_attempts (
            player_id,
            session_id,
            road_id,
            world_id,
            level_id,
            instinct_id,
            question_template_id,
            question_type,
            mode,
            is_correct,
            answer_value,
            expected_answer,
            answer_time_ms,
            question_payload_json
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'practice', ?, ?, ?, ?, ?)
        `
      )
      .run(
        playerId,
        session.id,
        input.question.roadId,
        input.question.worldId,
        input.question.levelId,
        input.question.instinctId,
        input.question.questionTemplateId,
        input.question.format,
        result.isCorrect ? 1 : 0,
        stringifyAnswer(input.selectedAnswer),
        stringifyAnswer(input.question.expectedAnswer),
        answerTimeMs,
        JSON.stringify(input.question.payload)
      );

    db.prepare(
      `
        INSERT INTO level_progress (
          player_id,
          road_id,
          world_id,
          level_id,
          instinct_id,
          mastery_state,
          attempts_count,
          practice_attempts_count,
          correct_attempts_count,
          last_played_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, 'practicing', 1, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(player_id, road_id, world_id, level_id) DO UPDATE SET
          mastery_state = CASE
            WHEN level_progress.mastery_state = 'unlocked' THEN 'practicing'
            ELSE level_progress.mastery_state
          END,
          attempts_count = level_progress.attempts_count + 1,
          practice_attempts_count = level_progress.practice_attempts_count + 1,
          correct_attempts_count = level_progress.correct_attempts_count + excluded.correct_attempts_count,
          last_played_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      `
    ).run(
      playerId,
      input.question.roadId,
      input.question.worldId,
      input.question.levelId,
      input.question.instinctId,
      result.isCorrect ? 1 : 0
    );

    db.prepare("UPDATE play_sessions SET last_activity_at = CURRENT_TIMESTAMP WHERE id = ?").run(session.id);

    if (result.isCorrect) {
      xpAwarded = awardXP(db, {
        playerId,
        sessionId: session.id,
        roadId: input.question.roadId,
        worldId: input.question.worldId,
        levelId: input.question.levelId,
        eventType: "correctPracticeAnswer",
        reason: "Correct Practice answer"
      }).xpAwarded;
    }

    recomputeLevelProgress(db, playerId, input.question.levelId);

    return insert.lastInsertRowid;
  });

  const attemptId = saveAttempt();

  return {
    attemptId,
    sessionId: session.id,
    isCorrect: result.isCorrect,
    normalizedAnswer: result.normalizedAnswer,
    expectedAnswer: result.expectedAnswer,
    xpAwarded
  };
}

export function completePracticeSession(playerId: string, input: CompletePracticeSessionInput) {
  const player = getPlayer(playerId);

  if (!player) {
    return null;
  }

  assertLevelUnlocked(playerId, input.roadId, input.worldId, input.levelId);

  const session = startOrResumePlaySession(playerId);

  if (!session) {
    return null;
  }

  const db = getDatabase();
  const award = db.transaction(() =>
    awardXP(db, {
      playerId,
      sessionId: session.id,
      roadId: input.roadId,
      worldId: input.worldId,
      levelId: input.levelId,
      eventType: "practiceSessionCompleted",
      reason: "Practice session completed"
    })
  )();

  return {
    sessionId: session.id,
    ...award
  };
}

function getLevelBenchmarkSeconds(levelId: string) {
  const level = roadToArithmetic.worlds.flatMap((world) => world.levels).find((entry) => entry.levelId === levelId);
  return level?.benchmarkAnswerSeconds ?? 5;
}

function getComboMultiplier(streak: number) {
  if (streak >= 15) {
    return 5;
  }

  if (streak >= 10) {
    return 3;
  }

  if (streak >= 5) {
    return 2;
  }

  return 1;
}

function getRushSession(playerId: string, rushSessionId: string) {
  return getDatabase()
    .prepare(
      `
        SELECT
          id,
          player_id AS playerId,
          session_id AS sessionId,
          road_id AS roadId,
          world_id AS worldId,
          level_id AS levelId,
          instinct_id AS instinctId,
          duration_seconds AS durationSeconds
        FROM rush_sessions
        WHERE id = ?
          AND player_id = ?
      `
    )
    .get(rushSessionId, playerId) as RushSessionRow | undefined;
}

function calculateRushSummary(playerId: string, rushSessionId: string, levelId: string) {
  const rows = getDatabase()
    .prepare(
      `
        SELECT
          is_correct AS isCorrect,
          answer_time_ms AS answerTimeMs
        FROM question_attempts
        WHERE player_id = ?
          AND rush_session_id = ?
          AND mode = 'rush'
        ORDER BY id ASC
      `
    )
    .all(playerId, rushSessionId) as RushAttemptRow[];
  const benchmarkMs = getLevelBenchmarkSeconds(levelId) * 1000;
  let streak = 0;
  let bestStreak = 0;
  let score = 0;
  let totalAnswerTime = 0;
  let timedAttempts = 0;
  let correctCount = 0;

  for (const row of rows) {
    if (row.answerTimeMs !== null) {
      totalAnswerTime += row.answerTimeMs;
      timedAttempts += 1;
    }

    if (row.isCorrect === 1) {
      correctCount += 1;
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      score += (10 + ((row.answerTimeMs ?? benchmarkMs + 1) <= benchmarkMs ? 5 : 0)) * getComboMultiplier(streak);
    } else {
      streak = 0;
    }
  }

  return {
    totalQuestions: rows.length,
    correctCount,
    incorrectCount: rows.length - correctCount,
    averageAnswerTimeMs: timedAttempts > 0 ? Math.round(totalAnswerTime / timedAttempts) : null,
    bestStreak,
    score
  };
}

export function startRushSession(playerId: string, input: StartRushSessionInput) {
  const player = getPlayer(playerId);

  if (!player) {
    return null;
  }

  assertLevelUnlocked(playerId, input.roadId, input.worldId, input.levelId);

  const session = startOrResumePlaySession(playerId);

  if (!session) {
    return null;
  }

  const durationSeconds = Math.max(10, Math.round(Number(input.durationSeconds) || 60));
  const id = randomUUID();

  getDatabase()
    .prepare(
      `
        INSERT INTO rush_sessions (
          id,
          player_id,
          session_id,
          road_id,
          world_id,
          level_id,
          instinct_id,
          duration_seconds
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(id, playerId, session.id, input.roadId, input.worldId, input.levelId, input.instinctId, durationSeconds);

  return {
    id,
    playerId,
    sessionId: session.id,
    roadId: input.roadId,
    worldId: input.worldId,
    levelId: input.levelId,
    instinctId: input.instinctId,
    durationSeconds,
    completed: false
  };
}

export function submitRushAttempt(playerId: string, rushSessionId: string, input: SubmitRushAttemptInput) {
  const rushSession = getRushSession(playerId, rushSessionId);

  if (!rushSession) {
    return null;
  }

  assertQuestionMatchesRushSession(rushSession, input.question);

  const answerTimeMs = Math.max(0, Math.round(Number(input.answerTimeMs) || 0));
  const result = checkAnswer(input.question, input.selectedAnswer);
  const db = getDatabase();
  let xpAwarded = 0;

  const saveAttempt = db.transaction(() => {
    const insert = db
      .prepare(
        `
          INSERT INTO question_attempts (
            player_id,
            session_id,
            rush_session_id,
            road_id,
            world_id,
            level_id,
            instinct_id,
            question_template_id,
            question_type,
            mode,
            is_correct,
            answer_value,
            expected_answer,
            answer_time_ms,
            question_payload_json
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'rush', ?, ?, ?, ?, ?)
        `
      )
      .run(
        playerId,
        rushSession.sessionId,
        rushSessionId,
        input.question.roadId,
        input.question.worldId,
        input.question.levelId,
        input.question.instinctId,
        input.question.questionTemplateId,
        input.question.format,
        result.isCorrect ? 1 : 0,
        stringifyAnswer(input.selectedAnswer),
        stringifyAnswer(input.question.expectedAnswer),
        answerTimeMs,
        JSON.stringify(input.question.payload)
      );

    db.prepare(
      `
        INSERT INTO level_progress (
          player_id,
          road_id,
          world_id,
          level_id,
          instinct_id,
          mastery_state,
          attempts_count,
          rush_attempts_count,
          correct_attempts_count,
          last_played_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, 'rushReady', 1, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(player_id, road_id, world_id, level_id) DO UPDATE SET
          mastery_state = CASE
            WHEN level_progress.mastery_state IN ('unlocked', 'practicing') THEN 'rushReady'
            ELSE level_progress.mastery_state
          END,
          attempts_count = level_progress.attempts_count + 1,
          rush_attempts_count = level_progress.rush_attempts_count + 1,
          correct_attempts_count = level_progress.correct_attempts_count + excluded.correct_attempts_count,
          last_played_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      `
    ).run(
      playerId,
      input.question.roadId,
      input.question.worldId,
      input.question.levelId,
      input.question.instinctId,
      result.isCorrect ? 1 : 0
    );

    db.prepare("UPDATE play_sessions SET last_activity_at = CURRENT_TIMESTAMP WHERE id = ?").run(rushSession.sessionId);

    if (result.isCorrect) {
      xpAwarded = awardXP(db, {
        playerId,
        sessionId: rushSession.sessionId,
        roadId: input.question.roadId,
        worldId: input.question.worldId,
        levelId: input.question.levelId,
        eventType: "correctRushAnswer",
        reason: "Correct Rush answer",
        metadata: { rushSessionId }
      }).xpAwarded;
    }

    recomputeLevelProgress(db, playerId, input.question.levelId);

    return insert.lastInsertRowid;
  });

  const attemptId = saveAttempt();

  return {
    attemptId,
    rushSessionId,
    isCorrect: result.isCorrect,
    normalizedAnswer: result.normalizedAnswer,
    expectedAnswer: result.expectedAnswer,
    xpAwarded
  };
}

export function finishRushSession(playerId: string, rushSessionId: string, completed: boolean, abandonmentReason?: string) {
  const rushSession = getRushSession(playerId, rushSessionId);

  if (!rushSession) {
    return null;
  }

  const summary = calculateRushSummary(playerId, rushSessionId, rushSession.levelId);
  const db = getDatabase();
  const previousBest = db
    .prepare(
      `
        SELECT MAX(score) AS score
        FROM rush_sessions
        WHERE player_id = ?
          AND level_id = ?
          AND completed = 1
          AND id != ?
      `
    )
    .get(playerId, rushSession.levelId, rushSessionId) as { score: number | null };
  const isPersonalBest = completed && summary.totalQuestions > 0 && summary.score > (previousBest.score ?? -1);
  let completionXP = 0;
  let personalBestXP = 0;

  db.transaction(() => {
    if (completed) {
      completionXP = awardXP(db, {
        playerId,
        sessionId: rushSession.sessionId,
        roadId: rushSession.roadId,
        worldId: rushSession.worldId,
        levelId: rushSession.levelId,
        eventType: "rushCompleted",
        reason: "Rush completed",
        metadata: { rushSessionId }
      }).xpAwarded;

      if (isPersonalBest) {
        personalBestXP = awardXP(db, {
          playerId,
          sessionId: rushSession.sessionId,
          roadId: rushSession.roadId,
          worldId: rushSession.worldId,
          levelId: rushSession.levelId,
          eventType: "newPersonalBest",
          reason: "New Rush personal best",
          metadata: { rushSessionId, score: summary.score, previousBest: previousBest.score }
        }).xpAwarded;
      }
    }

    db.prepare(
        `
          UPDATE rush_sessions
          SET
            ended_at = CURRENT_TIMESTAMP,
            completed = ?,
            abandoned_at = CASE WHEN ? = 1 THEN NULL ELSE CURRENT_TIMESTAMP END,
            abandonment_reason = CASE WHEN ? = 1 THEN NULL ELSE ? END,
            total_questions = ?,
            correct_count = ?,
            incorrect_count = ?,
            average_answer_time_ms = ?,
            best_streak = ?,
            score = ?,
            xp_awarded = ?
          WHERE id = ?
            AND player_id = ?
        `
      )
      .run(
        completed ? 1 : 0,
        completed ? 1 : 0,
        completed ? 1 : 0,
        abandonmentReason ?? "player_exit",
        summary.totalQuestions,
        summary.correctCount,
        summary.incorrectCount,
        summary.averageAnswerTimeMs,
        summary.bestStreak,
        summary.score,
        completionXP + personalBestXP,
        rushSessionId,
        playerId
      );

    recomputeLevelProgress(db, playerId, rushSession.levelId);
  })();

  return {
    rushSessionId,
    completed,
    abandoned: !completed,
    isPersonalBest,
    xpAwarded: completionXP + personalBestXP,
    ...summary
  };
}
