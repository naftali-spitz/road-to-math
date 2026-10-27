import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import Database from 'better-sqlite3';

process.env.DATABASE_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'math-stability-')), 'test.sqlite');
process.env.NODE_ENV = 'test';
const { roadToArithmetic } = await import('../../shared/dist/index.js');
const { getDatabase, getDatabaseDebugInfo } = await import('../dist/database.js');
const { runMigrations } = await import('../dist/migrations.js');
const { createPlayer, getPlayer, getPlayerProgress } = await import('../dist/players.js');
const { recomputeLevelProgress } = await import('../dist/mastery.js');
const { startPracticeSession, nextQuestion, submitPracticeAttempt, completePracticeSession,
  startRushSession, submitRushAttempt, finishRushSession } = await import('../dist/attempts.js');
const levels = roadToArithmetic.worlds.flatMap(w => w.levels);
const first = levels[0];
const db = getDatabase();
function player() { return createPlayer('Test'); }
function stored(q) { return JSON.parse(db.prepare('SELECT question_json FROM issued_questions WHERE id = ?').get(q.questionId).question_json); }
function attempt(p, mode, round, correct = true) {
  const q = nextQuestion(p.id, mode, round.id);
  const expected = stored(q).expectedAnswer;
  // Model actual answer time without sleeping or accepting client-reported timing.
  db.prepare('UPDATE issued_questions SET issued_at_ms = ? WHERE id = ?').run(Date.now() - 500, q.questionId);
  const input = { roundId: round.id, questionId: q.questionId, selectedAnswer: correct ? expected : 'wrong' };
  return { q, input, result: mode === 'practice' ? submitPracticeAttempt(p.id, input) : submitRushAttempt(p.id, round.id, input) };
}
function endRush(p, round, completed = true) {
  if (completed) db.prepare('UPDATE rush_sessions SET deadline_ms = ? WHERE id = ?').run(Date.now(), round.id);
  return finishRushSession(p.id, round.id, completed);
}
function progress(p, level = first) { return getPlayerProgress(p.id).roads[0].worlds.flatMap(w => w.levels).find(l => l.levelId === level.levelId); }
function rush(p, count = 10, correct = true) {
  const round = startRushSession(p.id, { levelId: first.levelId });
  for (let i = 0; i < count; i++) attempt(p, 'rush', round, correct);
  endRush(p, round);
  return round;
}

test('database initializes all required migrations, tables, indexes, and PRAGMAs', () => {
  const info = getDatabaseDebugInfo();
  assert.equal(info.status, 'ok');
  assert.equal(info.migrations.latestVersion, 2);
  assert.equal(info.database.foreignKeys, true);
  assert.equal(info.database.journalMode, 'wal');
});
test('version 1 upgrade preserves players, attempts, XP and earned unlocks', () => {
  const old = new Database(':memory:');
  old.pragma('foreign_keys = ON');
  old.exec(fs.readFileSync(new URL('./fixtures/schema-v1.sql', import.meta.url), 'utf8'));
  old.exec(`CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, applied_at TEXT DEFAULT CURRENT_TIMESTAMP);
    INSERT INTO schema_migrations(version,name) VALUES (1,'create_first_build_data_spine');
    INSERT INTO players(id,display_name,xp_total) VALUES ('old','Existing player',321);
    INSERT INTO play_sessions(id,player_id) VALUES ('session','old');
    INSERT INTO level_progress(player_id,road_id,world_id,level_id,instinct_id,mastery_state) VALUES ('old','road','world','level','instinct','mastered');
    INSERT INTO question_attempts(player_id,road_id,world_id,level_id,instinct_id,question_type,mode,is_correct) VALUES ('old','road','world','level','instinct','solve','practice',1);
    INSERT INTO rush_sessions(id,player_id,session_id,road_id,world_id,level_id,instinct_id,duration_seconds) VALUES ('running','old','session','road','world','level','instinct',60);`);
  runMigrations(old); runMigrations(old);
  assert.equal(old.prepare('SELECT xp_total FROM players').get().xp_total, 321);
  assert.equal(old.prepare('SELECT COUNT(*) AS n FROM question_attempts').get().n, 1);
  assert.equal(old.prepare('SELECT mastery_state FROM level_progress').get().mastery_state, 'mastered');
  assert.equal(old.prepare('SELECT abandonment_reason FROM rush_sessions').get().abandonment_reason, 'protocol_upgrade');
  assert.deepEqual(old.pragma('foreign_key_check'), []);
  old.close();
});
test('questions expose presentation data, not expected answers or option keys', () => {
  const p = player(), round = startPracticeSession(p.id, { levelId: first.levelId });
  for (let i = 0; i < 10; i++) {
    const q = nextQuestion(p.id, 'practice', round.id);
    assert.equal(q.expectedAnswer, undefined); assert.equal(q.payload, undefined);
    for (const option of q.options ?? []) { assert.equal(option.isCorrect, undefined); assert.equal(option.value, undefined); }
    attempt(p, 'practice', round);
  }
});
test('Practice starts and question retrieval are retry-safe', () => {
  const p = player(), round = startPracticeSession(p.id, { levelId: first.levelId });
  assert.equal(startPracticeSession(p.id, { levelId: first.levelId }).id, round.id);
  assert.deepEqual(nextQuestion(p.id, 'practice', round.id), nextQuestion(p.id, 'practice', round.id));
});
test('answer retries preserve the original result and award XP once', () => {
  const p = player(), round = startPracticeSession(p.id, { levelId: first.levelId });
  const { input, result } = attempt(p, 'practice', round);
  const xp = getPlayer(p.id).xpTotal;
  assert.deepEqual(submitPracticeAttempt(p.id, { ...input, selectedAnswer: 'changed' }), result);
  assert.equal(getPlayer(p.id).xpTotal, xp);
  assert.equal(progress(p).progress.attemptsCount, 1);
});
test('client answer keys and timing are ignored; unissued questions are rejected', () => {
  const p = player(), round = startPracticeSession(p.id, { levelId: first.levelId });
  const q = nextQuestion(p.id, 'practice', round.id);
  const result = submitPracticeAttempt(p.id, { roundId: round.id, questionId: q.questionId,
    selectedAnswer: 'forged', question: { expectedAnswer: 'forged' }, answerTimeMs: 0 });
  assert.equal(result.isCorrect, false); assert.ok(result.answerTimeMs >= 1);
  assert.throws(() => submitPracticeAttempt(p.id, { roundId: round.id, questionId: 'unissued', selectedAnswer: 1 }));
});
test('questions cannot be used by a different player, round or mode', () => {
  const p = player(), other = player(), round = startPracticeSession(p.id, { levelId: first.levelId });
  const { input } = attempt(p, 'practice', round);
  assert.throws(() => submitPracticeAttempt(other.id, input));
  const r = startRushSession(p.id, { levelId: first.levelId });
  assert.throws(() => submitRushAttempt(p.id, r.id, input));
});
test('malformed and empty submissions neither log attempts nor award XP', () => {
  const p = player(), round = startPracticeSession(p.id, { levelId: first.levelId });
  const q = nextQuestion(p.id, 'practice', round.id);
  for (const selectedAnswer of ['', '   ', null, {}, [], Infinity]) {
    assert.throws(() => submitPracticeAttempt(p.id, { roundId: round.id, questionId: q.questionId, selectedAnswer }));
  }
  assert.equal(progress(p).progress.attemptsCount, 0); assert.equal(getPlayer(p.id).xpTotal, 0);
});
test('Practice cannot complete before its target or farm completion XP', () => {
  const p = player(), round = startPracticeSession(p.id, { levelId: first.levelId });
  assert.throws(() => completePracticeSession(p.id, { roundId: round.id }));
  for (let i = 0; i < 10; i++) attempt(p, 'practice', round);
  const result = completePracticeSession(p.id, { roundId: round.id });
  const xp = getPlayer(p.id).xpTotal;
  assert.equal(result.xpAwarded, 10);
  assert.deepEqual(completePracticeSession(p.id, { roundId: round.id }), result);
  assert.equal(getPlayer(p.id).xpTotal, xp);
  assert.throws(() => nextQuestion(p.id, 'practice', round.id));
  assert.notEqual(startPracticeSession(p.id, { levelId: first.levelId }).id, round.id);
});
test('Practice format introduction survives navigation, refresh and new rounds', () => {
  const p = player(); let round = startPracticeSession(p.id, { levelId: first.levelId });
  for (let i = 0; i < 5; i++) attempt(p, 'practice', round);
  const resumed = startPracticeSession(p.id, { levelId: first.levelId });
  assert.equal(resumed.stats.total, 5); assert.equal(resumed.formatState.formatIndex, 1);
  for (let i = 5; i < 10; i++) attempt(p, 'practice', round);
  completePracticeSession(p.id, { roundId: round.id });
  round = startPracticeSession(p.id, { levelId: first.levelId });
  assert.equal(round.formatState.formatIndex, 3);
  assert.equal(nextQuestion(p.id, 'practice', round.id).format, 'multipleChoice');
});
test('Rush resumes a single session with its original deadline', () => {
  const p = player(), r = startRushSession(p.id, { levelId: first.levelId });
  const resumed = startRushSession(p.id, { levelId: first.levelId });
  assert.equal(resumed.id, r.id); assert.equal(resumed.deadlineMs, r.deadlineMs);
  assert.throws(() => startRushSession(p.id, { levelId: first.levelId, durationSeconds: 1 }));
});
test('Rush cannot complete early or accept new answers at the deadline', () => {
  const p = player(), r = startRushSession(p.id, { levelId: first.levelId });
  const q = nextQuestion(p.id, 'rush', r.id);
  assert.throws(() => finishRushSession(p.id, r.id, true));
  db.prepare('UPDATE rush_sessions SET deadline_ms = ? WHERE id = ?').run(Date.now(), r.id);
  assert.throws(() => submitRushAttempt(p.id, r.id, { questionId: q.questionId, selectedAnswer: stored(q).expectedAnswer }));
  const result = finishRushSession(p.id, r.id, true);
  assert.equal(result.totalQuestions, 0); assert.equal(result.xpAwarded, 0);
});
test('Rush completion, XP and personal best are idempotent', () => {
  const p = player(), r = startRushSession(p.id, { levelId: first.levelId });
  const { input, result: answer } = attempt(p, 'rush', r);
  const result = endRush(p, r); const xp = getPlayer(p.id).xpTotal;
  assert.equal(result.xpAwarded, 35);
  assert.deepEqual(finishRushSession(p.id, r.id, true), result);
  assert.deepEqual(submitRushAttempt(p.id, r.id, input), answer);
  assert.equal(getPlayer(p.id).xpTotal, xp);
  assert.throws(() => finishRushSession(p.id, r.id, false));
});
test('abandonment is final; saved attempts remain but cannot qualify for mastery', () => {
  const p = player(), r = startRushSession(p.id, { levelId: first.levelId });
  attempt(p, 'rush', r); const pending = nextQuestion(p.id, 'rush', r.id);
  const result = endRush(p, r, false);
  assert.equal(result.totalQuestions, 1); assert.equal(result.xpAwarded, 0);
  assert.deepEqual(finishRushSession(p.id, r.id, false), result);
  assert.throws(() => finishRushSession(p.id, r.id, true));
  assert.throws(() => submitRushAttempt(p.id, r.id, { questionId: pending.questionId, selectedAnswer: stored(pending).expectedAnswer }));
  assert.equal(progress(p).progress.fluencyPercent, 0);
});
test('locked levels and mismatched level identifiers are rejected', () => {
  const p = player();
  assert.throws(() => startPracticeSession(p.id, { levelId: levels[1].levelId }));
  assert.throws(() => startRushSession(p.id, { levelId: first.levelId, worldId: 'wrong' }));
  assert.throws(() => startPracticeSession(p.id, { levelId: 'unknown' }));
});
test('five answers cannot establish standard mastery or Express Pass', () => {
  const p = player(), round = startPracticeSession(p.id, { levelId: first.levelId });
  for (let i = 0; i < 4; i++) attempt(p, 'practice', round);
  rush(p, 1); rush(p, 1);
  assert.notEqual(progress(p).masteryState, 'mastered');
  assert.equal(progress(p).progress.fluencyPercent, 0);
  assert.equal(progress(p, levels[1]).isUnlocked, false);
});
test('standard mastery requires attempts, per-format evidence and qualifying Rush', () => {
  const p = player();
  for (let roundIndex = 0; roundIndex < 2; roundIndex++) {
    const round = startPracticeSession(p.id, { levelId: first.levelId });
    for (let i = 0; i < 10; i++) attempt(p, 'practice', round);
    completePracticeSession(p.id, { roundId: round.id });
  }
  assert.equal(progress(p, levels[1]).isUnlocked, false);
  rush(p);
  assert.equal(progress(p).masteryState, 'mastered');
  assert.equal(progress(p, levels[1]).isUnlocked, true);
});
test('Express Pass needs two sufficiently populated qualifying Rushes', () => {
  const p = player(); rush(p, 10);
  assert.equal(progress(p, levels[1]).isUnlocked, false);
  rush(p, 10);
  assert.equal(progress(p).masteryState, 'mastered');
  assert.equal(progress(p, levels[1]).isUnlocked, true);
});
test('configured session minimum is enforced, while earned unlocks remain preserved', () => {
  const original = first.masteryPolicy.minSessions;
  try {
    first.masteryPolicy.minSessions = 2;
    const p = player();
    for (let j = 0; j < 2; j++) { const r = startPracticeSession(p.id, { levelId: first.levelId });
      for (let i = 0; i < 10; i++) attempt(p, 'practice', r); completePracticeSession(p.id, { roundId: r.id }); }
    rush(p);
    assert.notEqual(progress(p).masteryState, 'mastered');
    assert.ok(progress(p).evidence.missingRequirements.some(r => r.includes('play sessions')));
    db.prepare("UPDATE play_sessions SET ended_at = CURRENT_TIMESTAMP WHERE player_id = ?").run(p.id);
    const r = startPracticeSession(p.id, { levelId: first.levelId }); attempt(p, 'practice', r);
    assert.equal(progress(p).masteryState, 'mastered');
    db.prepare("UPDATE level_progress SET mastery_state = 'goldMastered' WHERE player_id = ? AND level_id = ?").run(p.id, first.levelId);
    recomputeLevelProgress(db, p.id, first.levelId);
    assert.equal(progress(p).masteryState, 'goldMastered');
  } finally { first.masteryPolicy.minSessions = original; }
});
test('Roadblock deliberately covers every constituent skill', () => {
  const p = player(), level = levels.at(-1);
  db.prepare(`INSERT INTO level_progress(player_id, road_id, world_id, level_id, instinct_id) VALUES (?, ?, ?, ?, ?)`)
    .run(p.id, level.roadId, level.worldId, level.levelId, level.coreInstinct.instinctId);
  const r = startPracticeSession(p.id, { levelId: level.levelId }); const seen = new Set();
  assert.equal(r.target, 20);
  for (let i = 0; i < 17; i++) {
    const q = nextQuestion(p.id, 'practice', r.id); seen.add(stored(q).payload.generatorKey);
    attempt(p, 'practice', r);
  }
  assert.equal(seen.size, 17); assert.deepEqual(progress(p, level).evidence.missingSkills, []);
});

test('Rush scoring preserves combos and a wrong answer resets the streak', () => {
  const p = player(), r = startRushSession(p.id, { levelId: first.levelId });
  for (let i = 0; i < 5; i++) attempt(p, 'rush', r);
  attempt(p, 'rush', r, false); attempt(p, 'rush', r);
  const result = endRush(p, r);
  assert.equal(result.totalQuestions, 7); assert.equal(result.correctCount, 6);
  assert.equal(result.bestStreak, 5); assert.equal(result.currentStreak, 1);
  assert.equal(result.score, 105);
});
test('an incomplete Practice round can span distinct play sessions', () => {
  const p = player(), r = startPracticeSession(p.id, { levelId: first.levelId });
  attempt(p, 'practice', r);
  db.prepare("UPDATE play_sessions SET last_activity_at = datetime('now', '-31 minutes') WHERE player_id = ?").run(p.id);
  const resumed = startPracticeSession(p.id, { levelId: first.levelId });
  assert.equal(resumed.id, r.id); attempt(p, 'practice', resumed);
  assert.equal(progress(p).evidence.sessions, 2);
});
