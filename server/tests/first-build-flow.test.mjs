import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "road-to-math-server-test-"));
process.env.DATABASE_PATH = path.join(testDataDir, "road-to-math.sqlite");
process.env.NODE_ENV = "test";

const { generateQuestion, roadToArithmetic } = await import("../../shared/dist/index.js");
const { getDatabase, getDatabaseDebugInfo } = await import("../dist/database.js");
const { createPlayer, getPlayer, getPlayerProgress } = await import("../dist/players.js");
const {
  AttemptAccessError,
  completePracticeSession,
  finishRushSession,
  startRushSession,
  submitPracticeAttempt,
  submitRushAttempt
} = await import("../dist/attempts.js");

const levels = roadToArithmetic.worlds.flatMap((world) => world.levels);
const level1 = levels[0];
const level2 = levels[1];

function makePlayer(name) {
  return createPlayer(`${name} ${Math.random().toString(16).slice(2, 8)}`.slice(0, 40));
}

function getLevelProgress(playerId, levelId) {
  return getPlayerProgress(playerId).roads[0].worlds.flatMap((world) => world.levels).find((level) => level.levelId === levelId);
}

function correctAnswerFor(question) {
  return question.expectedAnswer;
}

function submitCorrectPracticeSet(playerId, level) {
  for (const format of level.supportedQuestionFormats) {
    const question = generateQuestion(level, {
      format,
      seed: `${playerId}:${level.levelId}:${format}`
    });
    const result = submitPracticeAttempt(playerId, {
      question,
      selectedAnswer: correctAnswerFor(question),
      answerTimeMs: Math.round(level.benchmarkAnswerSeconds * 500)
    });

    assert.equal(result.isCorrect, true);
  }
}

function startCompletedRush(playerId, level, answerTimeMs = Math.round(level.benchmarkAnswerSeconds * 500)) {
  const rushSession = startRushSession(playerId, {
    roadId: level.roadId,
    worldId: level.worldId,
    levelId: level.levelId,
    instinctId: level.coreInstinct.instinctId,
    durationSeconds: 60
  });
  const question = generateQuestion(level, {
    format: "solve",
    seed: `${playerId}:${level.levelId}:rush:${Math.random()}`
  });
  const attempt = submitRushAttempt(playerId, rushSession.id, {
    question,
    selectedAnswer: correctAnswerFor(question),
    answerTimeMs
  });
  const summary = finishRushSession(playerId, rushSession.id, true);

  return { rushSession, attempt, summary };
}

test("database initializes with required migrations, tables, indexes, and pragmas", () => {
  const db = getDatabase();
  const debug = getDatabaseDebugInfo();

  assert.equal(debug.status, "ok");
  assert.equal(debug.database.foreignKeys, true);
  assert.equal(debug.database.synchronousLabel, "NORMAL");
  assert.equal(debug.migrations.latestVersion, 1);
  assert.ok(debug.tables.required.every((table) => table.exists));
  assert.ok(debug.indexes.required.every((index) => index.exists));
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM schema_migrations").get().count, 1);
});

test("Practice attempts are checked, saved, counted, and awarded XP", () => {
  const player = makePlayer("Practice Attempt");
  const question = generateQuestion(level1, { format: "solve", seed: "practice-save" });
  const result = submitPracticeAttempt(player.id, {
    question,
    selectedAnswer: correctAnswerFor(question),
    answerTimeMs: 900
  });
  const db = getDatabase();
  const attemptRow = db.prepare("SELECT * FROM question_attempts WHERE id = ?").get(result.attemptId);
  const progressRow = db.prepare("SELECT * FROM level_progress WHERE player_id = ? AND level_id = ?").get(player.id, level1.levelId);
  const savedPlayer = getPlayer(player.id);

  assert.equal(result.isCorrect, true);
  assert.equal(result.xpAwarded, 1);
  assert.equal(attemptRow.mode, "practice");
  assert.equal(attemptRow.question_type, "solve");
  assert.equal(attemptRow.is_correct, 1);
  assert.equal(progressRow.practice_attempts_count, 1);
  assert.equal(progressRow.correct_attempts_count, 1);
  assert.equal(savedPlayer.xpTotal, 1);
});

test("Practice completion awards XP through the central XP event path", () => {
  const player = makePlayer("Practice Completion");
  const award = completePracticeSession(player.id, {
    roadId: level1.roadId,
    worldId: level1.worldId,
    levelId: level1.levelId
  });
  const db = getDatabase();
  const xpEvents = db.prepare("SELECT event_type AS eventType, xp_amount AS xpAmount FROM player_xp_events WHERE player_id = ?").all(player.id);

  assert.equal(award.xpAwarded, 10);
  assert.deepEqual(xpEvents, [{ eventType: "practiceSessionCompleted", xpAmount: 10 }]);
  assert.equal(getPlayer(player.id).xpTotal, 10);
});

test("Rush completion logs attempts, summary stats, completion XP, and personal best XP", () => {
  const player = makePlayer("Rush Completion");
  const { attempt, summary } = startCompletedRush(player.id, level1, 700);
  const db = getDatabase();
  const rushRow = db.prepare("SELECT * FROM rush_sessions WHERE id = ?").get(summary.rushSessionId);
  const events = db.prepare("SELECT event_type AS eventType FROM player_xp_events WHERE player_id = ? ORDER BY id ASC").all(player.id);

  assert.equal(attempt.isCorrect, true);
  assert.equal(attempt.xpAwarded, 2);
  assert.equal(summary.completed, true);
  assert.equal(summary.abandoned, false);
  assert.equal(summary.correctCount, 1);
  assert.equal(summary.xpAwarded, 35);
  assert.equal(rushRow.completed, 1);
  assert.equal(rushRow.abandoned_at, null);
  assert.equal(rushRow.total_questions, 1);
  assert.deepEqual(events.map((event) => event.eventType), ["correctRushAnswer", "rushCompleted", "newPersonalBest"]);
});

test("abandoned Rush keeps submitted attempts but does not count as completed or award completion XP", () => {
  const player = makePlayer("Rush Abandon");
  const rushSession = startRushSession(player.id, {
    roadId: level1.roadId,
    worldId: level1.worldId,
    levelId: level1.levelId,
    instinctId: level1.coreInstinct.instinctId,
    durationSeconds: 60
  });
  const question = generateQuestion(level1, { format: "solve", seed: "abandon-rush" });
  submitRushAttempt(player.id, rushSession.id, {
    question,
    selectedAnswer: correctAnswerFor(question),
    answerTimeMs: 650
  });
  const summary = finishRushSession(player.id, rushSession.id, false, "test_exit");
  const db = getDatabase();
  const rushRow = db.prepare("SELECT * FROM rush_sessions WHERE id = ?").get(rushSession.id);
  const attemptCount = db.prepare("SELECT COUNT(*) AS count FROM question_attempts WHERE rush_session_id = ?").get(rushSession.id).count;
  const events = db.prepare("SELECT event_type AS eventType FROM player_xp_events WHERE player_id = ? ORDER BY id ASC").all(player.id);

  assert.equal(summary.completed, false);
  assert.equal(summary.abandoned, true);
  assert.equal(summary.xpAwarded, 0);
  assert.equal(rushRow.completed, 0);
  assert.equal(rushRow.abandonment_reason, "test_exit");
  assert.equal(rushRow.xp_awarded, 0);
  assert.equal(attemptCount, 1);
  assert.deepEqual(events.map((event) => event.eventType), ["correctRushAnswer"]);
  assert.equal(getLevelProgress(player.id, level2.levelId).isUnlocked, false);
});

test("standard mastery unlocks the next level from Practice accuracy and completed Rush fluency", () => {
  const player = makePlayer("Standard Unlock");

  assert.throws(
    () =>
      startRushSession(player.id, {
        roadId: level2.roadId,
        worldId: level2.worldId,
        levelId: level2.levelId,
        instinctId: level2.coreInstinct.instinctId,
        durationSeconds: 60
      }),
    AttemptAccessError
  );

  submitCorrectPracticeSet(player.id, level1);
  assert.equal(getLevelProgress(player.id, level2.levelId).isUnlocked, false);

  startCompletedRush(player.id, level1, 700);

  const level1Progress = getLevelProgress(player.id, level1.levelId);
  const level2Progress = getLevelProgress(player.id, level2.levelId);
  assert.equal(level1Progress.masteryState, "mastered");
  assert.equal(level1Progress.progress.understandingPercent, 100);
  assert.equal(level1Progress.progress.recognitionPercent, 100);
  assert.equal(level1Progress.progress.fluencyPercent, 100);
  assert.equal(level2Progress.isUnlocked, true);
});

test("Express Pass ignores abandoned Rushes and unlocks after two completed benchmark Rushes", () => {
  const player = makePlayer("Express Pass");
  const abandonedRush = startRushSession(player.id, {
    roadId: level1.roadId,
    worldId: level1.worldId,
    levelId: level1.levelId,
    instinctId: level1.coreInstinct.instinctId,
    durationSeconds: 60
  });
  const abandonedQuestion = generateQuestion(level1, { format: "solve", seed: "express-abandoned" });
  submitRushAttempt(player.id, abandonedRush.id, {
    question: abandonedQuestion,
    selectedAnswer: correctAnswerFor(abandonedQuestion),
    answerTimeMs: 700
  });
  finishRushSession(player.id, abandonedRush.id, false, "test_exit");
  startCompletedRush(player.id, level1, 700);

  assert.equal(getLevelProgress(player.id, level2.levelId).isUnlocked, false);

  startCompletedRush(player.id, level1, 700);

  const level1Progress = getLevelProgress(player.id, level1.levelId);
  const level2Progress = getLevelProgress(player.id, level2.levelId);
  assert.equal(level1Progress.masteryState, "mastered");
  assert.equal(level1Progress.progress.understandingPercent, 0);
  assert.equal(level1Progress.progress.recognitionPercent, 0);
  assert.equal(level1Progress.progress.fluencyPercent, 100);
  assert.equal(level2Progress.isUnlocked, true);
});

test("Rush attempts must match their Rush session level", () => {
  const player = makePlayer("Rush Mismatch");
  const rushSession = startRushSession(player.id, {
    roadId: level1.roadId,
    worldId: level1.worldId,
    levelId: level1.levelId,
    instinctId: level1.coreInstinct.instinctId,
    durationSeconds: 60
  });
  const mismatchedQuestion = generateQuestion(level2, { format: "solve", seed: "mismatch" });

  assert.throws(
    () =>
      submitRushAttempt(player.id, rushSession.id, {
        question: mismatchedQuestion,
        selectedAnswer: correctAnswerFor(mismatchedQuestion),
        answerTimeMs: 700
      }),
    AttemptAccessError
  );
});
