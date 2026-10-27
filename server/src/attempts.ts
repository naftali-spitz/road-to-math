import { randomUUID } from "node:crypto";
import {
  advancePracticeFormatState, checkAnswer, choosePracticeQuestionFormat, generateQuestion,
  initialPracticeFormatState, roadToArithmetic,
  type AnswerValue, type AttemptResult, type GeneratedQuestion, type IssuedQuestion,
  type Level, type PracticeFormatState
} from "@road-to-math/shared";
import { getDatabase } from "./database.js";
import { recomputeLevelProgress } from "./mastery.js";
import { getPlayer, isLevelUnlockedForPlayer, startOrResumePlaySession } from "./players.js";
import { awardXP } from "./xp.js";

export const rushDurationSeconds = 60;
export const practiceQuestionTarget = 10;
export type LevelInput = { levelId: string; roadId?: string; worldId?: string; instinctId?: string; durationSeconds?: number };
export type SubmitPracticeAttemptInput = { roundId: string; questionId: string; selectedAnswer: AnswerValue };
export type SubmitRushAttemptInput = Omit<SubmitPracticeAttemptInput, "roundId">;
export type CompletePracticeSessionInput = { roundId: string };
export class AttemptAccessError extends Error {
  constructor(message: string, public statusCode = 403) { super(message); this.name = "AttemptAccessError"; }
}
function fail(message: string, status = 400): never { throw new AttemptAccessError(message, status); }
function requireId(value: unknown): asserts value is string {
  if (typeof value !== "string" || value.length < 1 || value.length > 200) fail("A valid identifier is required.");
}
function levelFor(playerId: string, input: LevelInput) {
  requireId(input?.levelId);
  const level = roadToArithmetic.worlds.flatMap(w => w.levels).find(l => l.levelId === input.levelId);
  if (!level) fail("Unknown level.");
  if ((input.roadId && input.roadId !== level.roadId) || (input.worldId && input.worldId !== level.worldId) ||
      (input.instinctId && input.instinctId !== level.coreInstinct.instinctId)) fail("Level identifiers do not match.");
  if (!isLevelUnlockedForPlayer(playerId, level.roadId, level.worldId, level.levelId)) fail("Level is locked.", 403);
  return level;
}
type Round = { id: string; player_id: string; session_id: string; level_id: string; state?: string;
  target?: number; ended_at?: string | null; abandoned_at?: string | null; deadline_ms?: number; result_json: string | null };
type IssuedRow = { id: string; player_id: string; level_id: string; mode: string; round_id: string;
  question_json: string; issued_at_ms: number; result_json: string | null };
function getRound(playerId: string, mode: "practice" | "rush", id: string) {
  requireId(id);
  return getDatabase().prepare(`SELECT * FROM ${mode === "practice" ? "practice_rounds" : "rush_sessions"} WHERE id = ? AND player_id = ?`)
    .get(id, playerId) as Round | undefined;
}
function isClosed(round: Round, mode: "practice" | "rush") {
  return mode === "practice" ? round.state !== "active" : round.ended_at !== null;
}
function assertActive(round: Round, mode: "practice" | "rush") {
  if (isClosed(round, mode)) fail("This session is already closed.", 409);
  if (mode === "rush" && Date.now() >= round.deadline_ms!) fail("Rush time has ended.", 409);
}
function practiceState(playerId: string, levelId: string): PracticeFormatState {
  const row = getDatabase().prepare("SELECT state_json FROM practice_format_progress WHERE player_id = ? AND level_id = ?")
    .get(playerId, levelId) as { state_json: string } | undefined;
  return row ? JSON.parse(row.state_json) : initialPracticeFormatState;
}
function practiceView(round: Round) {
  const rows = getDatabase().prepare("SELECT question_type, is_correct FROM question_attempts WHERE practice_round_id = ? ORDER BY id")
    .all(round.id) as { question_type: string; is_correct: number }[];
  const stats = { total: rows.length, correct: rows.filter(r => r.is_correct).length,
    byFormat: {} as Record<string, { total: number; correct: number }> };
  for (const row of rows) {
    const entry = stats.byFormat[row.question_type] ??= { total: 0, correct: 0 };
    entry.total++; entry.correct += row.is_correct;
  }
  return { id: round.id, target: round.target!, stats, formatState: practiceState(round.player_id, round.level_id) };
}
export function startPracticeSession(playerId: string, input: LevelInput) {
  if (!getPlayer(playerId)) return null;
  const level = levelFor(playerId, input);
  return getDatabase().transaction(() => {
    const session = startOrResumePlaySession(playerId)!;
    const existing = getDatabase().prepare("SELECT * FROM practice_rounds WHERE player_id = ? AND level_id = ? AND state = 'active'")
      .get(playerId, level.levelId) as Round | undefined;
    if (existing) {
      getDatabase().prepare("UPDATE practice_rounds SET session_id = ? WHERE id = ?").run(session.id, existing.id);
      return practiceView({ ...existing, session_id: session.id });
    }
    const id = randomUUID();
    const target = level.generatorKey === "arithmeticRoadblock" ? 20 : practiceQuestionTarget;
    getDatabase().prepare("INSERT INTO practice_rounds(id, player_id, session_id, level_id, target) VALUES (?, ?, ?, ?, ?)")
      .run(id, playerId, session.id, level.levelId, target);
    return practiceView(getRound(playerId, "practice", id)!);
  })();
}
function publicQuestion(row: IssuedRow): IssuedQuestion {
  const q = JSON.parse(row.question_json) as GeneratedQuestion;
  return { questionId: row.id, questionTemplateId: q.questionTemplateId, prompt: q.prompt,
    format: q.format, roadId: q.roadId, worldId: q.worldId, levelId: q.levelId, instinctId: q.instinctId,
    inputKind: typeof q.expectedAnswer === "number" ? "numeric" : "text",
    ...(q.options ? { options: q.options.map(({ optionId, label }) => ({ optionId, label })) } : {}) };
}
export function nextQuestion(playerId: string, mode: "practice" | "rush", roundId: string) {
  if (mode !== "practice" && mode !== "rush") fail("Unknown game mode.");
  return getDatabase().transaction(() => {
    const round = getRound(playerId, mode, roundId);
    if (!round) return null;
    assertActive(round, mode);
    const db = getDatabase();
    const pending = db.prepare("SELECT * FROM issued_questions WHERE player_id = ? AND mode = ? AND round_id = ? AND result_json IS NULL")
      .get(playerId, mode, roundId) as IssuedRow | undefined;
    if (pending) return publicQuestion(pending);
    const level = levelFor(playerId, { levelId: round.level_id });
    if (mode === "practice" && practiceView(round).stats.total >= round.target!) fail("Practice round is ready to complete.", 409);
    const history = db.prepare("SELECT question_json FROM issued_questions WHERE player_id = ? AND level_id = ? ORDER BY issued_at_ms DESC, rowid DESC LIMIT 8")
      .all(playerId, level.levelId) as { question_json: string }[];
    const count = (db.prepare("SELECT COUNT(*) AS n FROM question_attempts WHERE player_id = ? AND level_id = ?")
      .get(playerId, level.levelId) as { n: number }).n;
    // Cycle through every constituent skill; random sampling alone cannot guarantee Roadblock coverage.
    const skills = roadToArithmetic.worlds.flatMap(w => w.levels).filter(l => l.generatorKey !== "arithmeticRoadblock");
    const generationLevel: Level = level.generatorKey === "arithmeticRoadblock"
      ? { ...level, generatorKey: skills[count % skills.length].generatorKey } : level;
    const format = mode === "practice"
      ? choosePracticeQuestionFormat(level.supportedQuestionFormats, practiceState(playerId, level.levelId), count)
      : level.supportedQuestionFormats[count % level.supportedQuestionFormats.length];
    const id = randomUUID();
    const question = generateQuestion(generationLevel, { format, seed: id,
      recentFingerprints: history.map(r => (JSON.parse(r.question_json) as GeneratedQuestion).fingerprint) });
    db.prepare("INSERT INTO issued_questions(id, player_id, level_id, mode, round_id, question_json, issued_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(id, playerId, level.levelId, mode, roundId, JSON.stringify(question), Date.now());
    return publicQuestion(db.prepare("SELECT * FROM issued_questions WHERE id = ?").get(id) as IssuedRow);
  })();
}
function submitAttempt(playerId: string, mode: "practice" | "rush", roundId: string, input: SubmitRushAttemptInput) {
  requireId(input?.questionId);
  const answer = input.selectedAnswer;
  if (!["string", "number", "boolean"].includes(typeof answer) ||
      (typeof answer === "number" && !Number.isFinite(answer)) || String(answer).trim() === "" || String(answer).length > 100) {
    fail("Enter an answer before submitting.");
  }
  return getDatabase().transaction(() => {
    const db = getDatabase();
    const row = db.prepare("SELECT * FROM issued_questions WHERE id = ? AND player_id = ? AND mode = ? AND round_id = ?")
      .get(input.questionId, playerId, mode, roundId) as IssuedRow | undefined;
    if (!row) fail("Question was not issued for this session.", 403);
    // A retry returns precisely the saved result, even if completion already occurred.
    if (row.result_json) return JSON.parse(row.result_json) as AttemptResult;
    const round = getRound(playerId, mode, roundId);
    if (!round) return null;
    assertActive(round, mode);
    const q = JSON.parse(row.question_json) as GeneratedQuestion;
    const answerTimeMs = Math.max(1, Date.now() - row.issued_at_ms);
    const result = checkAnswer(q, answer);
    const insert = db.prepare(`INSERT INTO question_attempts(player_id, session_id, rush_session_id, practice_round_id,
      issued_question_id, road_id, world_id, level_id, instinct_id, question_template_id, question_type, mode,
      is_correct, answer_value, expected_answer, answer_time_ms, question_payload_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(playerId, round.session_id, mode === "rush" ? roundId : null, mode === "practice" ? roundId : null,
        row.id, q.roadId, q.worldId, q.levelId, q.instinctId, q.questionTemplateId, q.format, mode,
        result.isCorrect ? 1 : 0, JSON.stringify(answer), JSON.stringify(q.expectedAnswer), answerTimeMs, JSON.stringify(q.payload));
    db.prepare(`UPDATE level_progress SET attempts_count = attempts_count + 1,
      practice_attempts_count = practice_attempts_count + ?, rush_attempts_count = rush_attempts_count + ?,
      correct_attempts_count = correct_attempts_count + ?,
      mastery_state = CASE WHEN mastery_state IN ('unlocked','practicing','rushReady') THEN ? ELSE mastery_state END,
      last_played_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE player_id = ? AND level_id = ?`)
      .run(mode === "practice" ? 1 : 0, mode === "rush" ? 1 : 0, result.isCorrect ? 1 : 0,
        mode === "practice" ? "practicing" : "rushReady", playerId, q.levelId);
    if (mode === "practice") {
      const level = levelFor(playerId, { levelId: q.levelId });
      const state = advancePracticeFormatState(level.supportedQuestionFormats, practiceState(playerId, q.levelId), result.isCorrect);
      db.prepare(`INSERT INTO practice_format_progress(player_id, level_id, state_json) VALUES (?, ?, ?)
        ON CONFLICT(player_id, level_id) DO UPDATE SET state_json = excluded.state_json`).run(playerId, q.levelId, JSON.stringify(state));
    }
    db.prepare("UPDATE play_sessions SET last_activity_at = CURRENT_TIMESTAMP WHERE id = ?").run(round.session_id);
    const xpAwarded = result.isCorrect ? awardXP(db, { playerId, sessionId: round.session_id, roadId: q.roadId,
      worldId: q.worldId, levelId: q.levelId, eventType: mode === "practice" ? "correctPracticeAnswer" : "correctRushAnswer" }).xpAwarded : 0;
    const expectedAnswer = q.format === "multipleChoice"
      ? `${q.expectedAnswer}: ${q.options!.find(o => o.optionId === q.expectedAnswer)!.label}` : result.expectedAnswer;
    const saved = { attemptId: Number(insert.lastInsertRowid), isCorrect: result.isCorrect,
      normalizedAnswer: result.normalizedAnswer, expectedAnswer, answerTimeMs, xpAwarded,
      ...(mode === "practice" ? { practiceRound: practiceView(round) } : { rushStats: getRushSummary(playerId, roundId)! }) };
    db.prepare("UPDATE issued_questions SET result_json = ? WHERE id = ?").run(JSON.stringify(saved), row.id);
    recomputeLevelProgress(db, playerId, q.levelId);
    return saved;
  })();
}
export function submitPracticeAttempt(playerId: string, input: SubmitPracticeAttemptInput) {
  requireId(input?.roundId);
  return submitAttempt(playerId, "practice", input.roundId, input);
}
export function submitRushAttempt(playerId: string, rushSessionId: string, input: SubmitRushAttemptInput) {
  return submitAttempt(playerId, "rush", rushSessionId, input);
}
export function completePracticeSession(playerId: string, input: CompletePracticeSessionInput) {
  return getDatabase().transaction(() => {
    const round = getRound(playerId, "practice", input?.roundId);
    if (!round) return null;
    if (round.result_json) return JSON.parse(round.result_json);
    if (round.state !== "active") fail("Practice round is closed.", 409);
    const view = practiceView(round);
    if (view.stats.total < round.target!) fail(`Answer ${round.target} questions before completing Practice.`, 409);
    const level = levelFor(playerId, { levelId: round.level_id });
    const award = awardXP(getDatabase(), { playerId, sessionId: round.session_id, roadId: level.roadId,
      worldId: level.worldId, levelId: level.levelId, eventType: "practiceSessionCompleted" });
    const result = { ...view, xpAwarded: award.xpAwarded };
    getDatabase().prepare("UPDATE practice_rounds SET state = 'completed', result_json = ? WHERE id = ?").run(JSON.stringify(result), round.id);
    return result;
  })();
}
export function getRushSummary(playerId: string, id: string) {
  const round = getRound(playerId, "rush", id);
  if (!round) return null;
  const level = levelFor(playerId, { levelId: round.level_id });
  const rows = getDatabase().prepare("SELECT is_correct, answer_time_ms FROM question_attempts WHERE player_id = ? AND rush_session_id = ? ORDER BY id")
    .all(playerId, id) as { is_correct: number; answer_time_ms: number }[];
  let currentStreak = 0, bestStreak = 0, score = 0, totalAnswerTimeMs = 0, correctCount = 0;
  for (const row of rows) {
    totalAnswerTimeMs += row.answer_time_ms;
    currentStreak = row.is_correct ? currentStreak + 1 : 0;
    bestStreak = Math.max(bestStreak, currentStreak);
    if (row.is_correct) {
      correctCount++;
      const multiplier = currentStreak >= 15 ? 5 : currentStreak >= 10 ? 3 : currentStreak >= 5 ? 2 : 1;
      score += (10 + (row.answer_time_ms <= level.benchmarkAnswerSeconds * 1000 ? 5 : 0)) * multiplier;
    }
  }
  return { totalQuestions: rows.length, correctCount, incorrectCount: rows.length - correctCount,
    averageAnswerTimeMs: rows.length ? Math.round(totalAnswerTimeMs / rows.length) : null,
    currentStreak, bestStreak, score, totalAnswerTimeMs };
}
export function startRushSession(playerId: string, input: LevelInput) {
  if (!getPlayer(playerId)) return null;
  const level = levelFor(playerId, input);
  if (input.durationSeconds !== undefined && input.durationSeconds !== rushDurationSeconds) fail("Rush duration must be 60 seconds.");
  return getDatabase().transaction(() => {
    let round = getDatabase().prepare("SELECT * FROM rush_sessions WHERE player_id = ? AND ended_at IS NULL").get(playerId) as Round | undefined;
    if (round && round.level_id !== level.levelId) fail("Finish or abandon your active Rush before starting another level.", 409);
    if (!round) {
      const session = startOrResumePlaySession(playerId)!;
      const id = randomUUID();
      getDatabase().prepare(`INSERT INTO rush_sessions(id, player_id, session_id, road_id, world_id, level_id, instinct_id, duration_seconds, deadline_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, playerId, session.id, level.roadId, level.worldId, level.levelId, level.coreInstinct.instinctId,
          rushDurationSeconds, Date.now() + rushDurationSeconds * 1000);
      round = getRound(playerId, "rush", id)!;
    }
    return { id: round.id, durationSeconds: rushDurationSeconds, deadlineMs: round.deadline_ms!, serverNowMs: Date.now(),
      stats: getRushSummary(playerId, round.id)! };
  })();
}
export function finishRushSession(playerId: string, rushSessionId: string, completed: boolean, reason = "player_exit") {
  return getDatabase().transaction(() => {
    const db = getDatabase();
    const round = getRound(playerId, "rush", rushSessionId);
    if (!round) return null;
    if (round.result_json) {
      const saved = JSON.parse(round.result_json);
      if (saved.completed !== completed) fail("A closed Rush cannot change its outcome.", 409);
      return saved;
    }
    if (isClosed(round, "rush")) fail("Legacy Rush is closed.", 409);
    if (completed && Date.now() < round.deadline_ms!) fail("Rush is still in progress.", 409);
    const level = levelFor(playerId, { levelId: round.level_id });
    const summary = getRushSummary(playerId, round.id)!;
    const previousBest = db.prepare("SELECT MAX(score) AS score FROM rush_sessions WHERE player_id = ? AND level_id = ? AND completed = 1")
      .get(playerId, level.levelId) as { score: number | null };
    const isPersonalBest = completed && summary.totalQuestions > 0 && summary.score > (previousBest.score ?? -1);
    let xpAwarded = 0;
    if (completed && summary.totalQuestions > 0) {
      xpAwarded += awardXP(db, { playerId, sessionId: round.session_id, roadId: level.roadId, worldId: level.worldId,
        levelId: level.levelId, eventType: "rushCompleted" }).xpAwarded;
      if (isPersonalBest) xpAwarded += awardXP(db, { playerId, sessionId: round.session_id, roadId: level.roadId,
        worldId: level.worldId, levelId: level.levelId, eventType: "newPersonalBest" }).xpAwarded;
    }
    const result = { rushSessionId, completed, abandoned: !completed, isPersonalBest, xpAwarded, ...summary };
    db.prepare(`UPDATE rush_sessions SET ended_at = CURRENT_TIMESTAMP, completed = ?,
      abandoned_at = CASE WHEN ? THEN NULL ELSE CURRENT_TIMESTAMP END, abandonment_reason = ?,
      total_questions = ?, correct_count = ?, incorrect_count = ?, average_answer_time_ms = ?, best_streak = ?, score = ?,
      xp_awarded = ?, result_json = ? WHERE id = ?`)
      .run(completed ? 1 : 0, completed ? 1 : 0, completed ? null : String(reason).slice(0, 100), summary.totalQuestions,
        summary.correctCount, summary.incorrectCount, summary.averageAnswerTimeMs, summary.bestStreak, summary.score,
        xpAwarded, JSON.stringify(result), round.id);
    recomputeLevelProgress(db, playerId, level.levelId);
    return result;
  })();
}
