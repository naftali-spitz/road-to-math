import { useEffect, useRef, useState } from "react";
import { getCurrentPracticeFormat, type AnswerValue, type AttemptResult, type IssuedQuestion,
  type Level, type PracticeFormatState } from "@road-to-math/shared";
import { apiRequest } from "./api";

type Player = { id: string; displayName: string; xpTotal: number };
type Props = { player: Player; level: Level; onExit: () => void };
type PracticeStats = { total: number; correct: number; byFormat: Record<string, { total: number; correct: number }> };
type PracticeRound = { id: string; target: number; stats: PracticeStats; formatState: PracticeFormatState };
type RushStats = { totalQuestions: number; correctCount: number; incorrectCount: number;
  currentStreak: number; bestStreak: number; score: number; totalAnswerTimeMs: number; averageAnswerTimeMs: number | null };
type RushSession = { id: string; deadlineMs: number; serverNowMs: number; durationSeconds: number; stats: RushStats };
type RushSummary = RushStats & { completed: boolean; abandoned: boolean; xpAwarded: number; isPersonalBest: boolean };
const post = <T,>(path: string, body: unknown) => apiRequest<T>(path, { method: "POST", body: JSON.stringify(body) });
function messageOf(error: unknown) { return error instanceof Error ? error.message : "Unable to save. Try again."; }

function AnswerPanel({ question, disabled, onSubmit }: {
  question: IssuedQuestion; disabled: boolean; onSubmit: (answer: AnswerValue) => void;
}) {
  const [answer, setAnswer] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const typed = question.format === "solve" || question.format === "fillBlank";
  useEffect(() => { setAnswer(""); }, [question.questionId]);
  useEffect(() => { if (typed && !disabled) input.current?.focus(); }, [typed, disabled, question.questionId]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (disabled || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      if (question.format === "multipleChoice" && ["1", "2", "3", "4"].includes(event.key)) {
        event.preventDefault(); onSubmit(event.key);
      } else if (question.format === "trueFalse" && ["t", "f"].includes(event.key.toLowerCase())) {
        event.preventDefault(); onSubmit(event.key.toLowerCase() === "t");
      } else if (typed && event.key === " " && answer.trim()) {
        event.preventDefault(); onSubmit(answer);
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [question, disabled, answer, onSubmit, typed]);
  return <>
    <p className="question-text" aria-live="polite">{question.prompt}</p>
    {typed && <form className="answer-form" onSubmit={event => {
      event.preventDefault(); if (!disabled && answer.trim()) onSubmit(answer);
    }}>
      <input ref={input} value={answer} disabled={disabled} onChange={event => setAnswer(event.target.value)}
        inputMode={question.inputKind === "numeric" ? "decimal" : "text"} aria-label="Answer" autoComplete="off" />
      <button type="submit" disabled={disabled || !answer.trim()}>Submit</button>
    </form>}
    {question.format === "multipleChoice" && <div className="choice-grid">{question.options?.map(option =>
      <button key={option.optionId} type="button" disabled={disabled} onClick={() => onSubmit(option.optionId)}>
        <span>{option.optionId}</span><strong>{option.label}</strong>
      </button>)}</div>}
    {question.format === "trueFalse" && <div className="choice-grid choice-grid--two">
      {[true, false].map(value => <button key={String(value)} type="button" disabled={disabled} onClick={() => onSubmit(value)}>
        <span>{value ? "T" : "F"}</span><strong>{value ? "True" : "False"}</strong>
      </button>)}
    </div>}
    {typed && question.inputKind === "text" && <p className="muted">Enter &lt;, &gt; or =.</p>}
  </>;
}
export function PracticeMode({ player, level, onExit }: Props) {
  const [round, setRound] = useState<PracticeRound | null>(null);
  const [question, setQuestion] = useState<IssuedQuestion | null>(null);
  const [feedback, setFeedback] = useState<AttemptResult | null>(null);
  const [summary, setSummary] = useState<(PracticeRound & { xpAwarded: number }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const lock = useRef(false);
  const retry = useRef<(() => void) | null>(null);
  const base = `/players/${player.id}`;
  async function loadQuestion(id: string) {
    const data = await post<{ question: IssuedQuestion }>(`${base}/questions`, { mode: "practice", roundId: id });
    setQuestion(data.question); setFeedback(null);
  }
  async function complete(id: string) {
    const result = await post<PracticeRound & { xpAwarded: number }>(`${base}/practice-sessions/complete`, { roundId: id });
    setSummary(result); setQuestion(null);
  }
  async function start() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage(null);
    try {
      const { round: next } = await post<{ round: PracticeRound }>(`${base}/practice-sessions`, { levelId: level.levelId });
      setRound(next); setSummary(null);
      if (next.stats.total >= next.target) await complete(next.id); else await loadQuestion(next.id);
      retry.current = null;
    } catch (error) { setMessage(messageOf(error)); retry.current = () => void start(); }
    finally { lock.current = false; setBusy(false); }
  }
  useEffect(() => { void start(); }, [player.id, level.levelId]); // Start is idempotent; each mode is keyed by level/player.
  async function submit(answer: AnswerValue) {
    if (lock.current || !question || !round || feedback || summary) return;
    lock.current = true; setBusy(true); setMessage(null);
    try {
      const result = await post<AttemptResult & { practiceRound: PracticeRound }>(`${base}/attempts/practice`, {
        roundId: round.id, questionId: question.questionId, selectedAnswer: answer
      });
      setFeedback(result);
      setRound(result.practiceRound); retry.current = null;
    } catch (error) { setMessage(messageOf(error)); retry.current = () => void submit(answer); }
    finally { lock.current = false; setBusy(false); }
  }
  async function next() {
    if (lock.current || !round) return;
    lock.current = true; setBusy(true); setMessage(null);
    try {
      if (round.stats.total >= round.target) await complete(round.id); else await loadQuestion(round.id);
      retry.current = null;
    } catch (error) { setMessage(messageOf(error)); retry.current = () => void next(); }
    finally { lock.current = false; setBusy(false); }
  }
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (feedback && !summary && !busy && !event.repeat && ["Enter", " "].includes(event.key) && event.target === document.body) {
        event.preventDefault(); void next();
      }
    };
    window.addEventListener("keydown", keydown); return () => window.removeEventListener("keydown", keydown);
  }, [feedback, summary, busy, round]);
  if (summary) return <section className="practice-shell" aria-labelledby="practice-summary-title">
    <div className="practice-summary"><p className="eyebrow">Practice Complete</p><h2 id="practice-summary-title">{level.displayName}</h2>
      <p>{summary.stats.correct}/{summary.stats.total} correct · +{summary.xpAwarded} completion XP</p>
      <div className="practice-actions"><button disabled={busy} onClick={() => void start()}>Keep Practicing</button>
        <button disabled={busy} onClick={onExit}>Back to Levels</button></div>
      {message && <p role="alert" className="notice">{message}</p>}
    </div>
  </section>;
  return <section className="practice-shell" aria-labelledby="practice-title">
    <div className="practice-header"><div><p className="eyebrow">Practice Mode</p><h2 id="practice-title">{level.displayName}</h2>
      <p className="muted">{level.coreInstinct.description}</p></div><button disabled={busy} onClick={onExit}>Exit</button></div>
    <div className="format-strip" aria-label="Practice format progress">{level.supportedQuestionFormats.map(format =>
      <span key={format} className={`format-pill ${round?.formatState.introducedFormats.includes(format) ? "format-pill--done" : ""}`}>{format}</span>)}</div>
    <article className={`question-panel ${feedback ? feedback.isCorrect ? "question-panel--correct" : "question-panel--wrong" : ""}`}>
      <div className="question-panel__top"><span>{round ? getCurrentPracticeFormat(level.supportedQuestionFormats, round.formatState) : "Loading"}</span>
        <strong>{Math.min((round?.stats.total ?? 0) + (feedback ? 0 : 1), round?.target ?? 10)} / {round?.target ?? 10}</strong></div>
      {question && <AnswerPanel question={question} disabled={busy || !!feedback} onSubmit={answer => void submit(answer)} />}
      {feedback && <div className="feedback-row" role="status"><strong>{feedback.isCorrect ? "Correct" : "Try the next one"}</strong>
        {!feedback.isCorrect && <span>Correct answer: {feedback.expectedAnswer}</span>}
        <button autoFocus disabled={busy} onClick={() => void next()}>{round && round.stats.total >= round.target ? "Finish Practice" : "Next Question"}</button></div>}
      {busy && <p role="status">Saving / loading…</p>}
      {message && <div className="notice" role="alert">{message} <button disabled={busy} onClick={() => retry.current?.()}>Retry</button></div>}
    </article>
  </section>;
}

export function RushMode({ player, level, onExit }: Props) {
  const [round, setRound] = useState<RushSession | null>(null);
  const [question, setQuestion] = useState<IssuedQuestion | null>(null);
  const [stats, setStats] = useState<RushStats | null>(null);
  const [summary, setSummary] = useState<RushSummary | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [impact, setImpact] = useState<"correct" | "wrong" | null>(null);
  const deadline = useRef(0);
  const lock = useRef(false);
  const finishing = useRef(false);
  const pendingAnswer = useRef<Promise<void> | null>(null);
  const retry = useRef<(() => void) | null>(null);
  const impactTimer = useRef<ReturnType<typeof setTimeout>>();
  const base = `/players/${player.id}`;
  const remaining = () => Math.max(0, Math.ceil((deadline.current - performance.now()) / 1000));
  async function loadQuestion(id: string) {
    const data = await post<{ question: IssuedQuestion }>(`${base}/questions`, { mode: "rush", roundId: id });
    setQuestion(data.question);
  }
  async function start() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage(null);
    try {
      const { rushSession: next } = await post<{ rushSession: RushSession }>(`${base}/rush-sessions`, { levelId: level.levelId });
      deadline.current = performance.now() + Math.max(0, next.deadlineMs - next.serverNowMs);
      setRound(next); setStats(next.stats); setSummary(null); setTimeLeft(remaining()); setQuestion(null);
      finishing.current = false;
      if (remaining() > 0) await loadQuestion(next.id);
      retry.current = null;
    } catch (error) { setMessage(messageOf(error)); retry.current = () => void start(); }
    finally { lock.current = false; setBusy(false); }
  }
  useEffect(() => { void start(); return () => clearTimeout(impactTimer.current); }, [player.id, level.levelId]);
  async function finish(completed: boolean) {
    if (!round || finishing.current || summary) return;
    finishing.current = true; setBusy(true); setMessage(null);
    try {
      // Answers already being saved settle before the final summary request is sent.
      await pendingAnswer.current;
      const data = await post<{ rushSession: RushSummary }>(`${base}/rush-sessions/${round.id}/${completed ? "complete" : "abandon"}`, {});
      setSummary(data.rushSession); setQuestion(null); retry.current = null;
    } catch (error) {
      setMessage(messageOf(error)); finishing.current = false; retry.current = () => void finish(completed);
    } finally { setBusy(false); }
  }
  useEffect(() => {
    if (!round || summary) return;
    const update = () => setTimeLeft(remaining());
    const timer = setInterval(update, 100);
    document.addEventListener("visibilitychange", update);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", update); };
  }, [round, summary]);
  useEffect(() => { if (round && !summary && timeLeft === 0) void finish(true); }, [round, summary, timeLeft]);
  async function reloadQuestion(id: string) {
    if (lock.current || finishing.current || remaining() <= 0) return;
    lock.current = true; setBusy(true); setMessage(null);
    try { await loadQuestion(id); retry.current = null; }
    catch (error) { setMessage(messageOf(error)); }
    finally { lock.current = false; setBusy(false); }
  }
  function submit(answer: AnswerValue) {
    if (lock.current || finishing.current || !round || !question || summary || remaining() <= 0) return;
    lock.current = true; setBusy(true); setMessage(null);
    const save = async () => {
      try {
        const result = await post<AttemptResult & { rushStats: RushStats }>(`${base}/rush-sessions/${round.id}/attempts`, { questionId: question.questionId, selectedAnswer: answer });
        setImpact(result.isCorrect ? "correct" : "wrong"); clearTimeout(impactTimer.current);
        impactTimer.current = setTimeout(() => setImpact(null), 160);
        setStats(result.rushStats);
        retry.current = null;
        if (remaining() > 0 && !finishing.current) {
          setQuestion(null);
          try { await loadQuestion(round.id); }
          catch (error) {
            setMessage(messageOf(error));
            retry.current = () => void reloadQuestion(round.id);
          }
        }
      } catch (error) { setMessage(messageOf(error)); retry.current = () => submit(answer); }
      finally { lock.current = false; if (!finishing.current) setBusy(false); }
    };
    pendingAnswer.current = save();
  }
  if (summary) return <section className="rush-shell" aria-labelledby="rush-summary-title"><div className="rush-summary">
    <p className="eyebrow">{summary.completed ? "Rush Complete" : "Rush Abandoned"}</p><h2 id="rush-summary-title">{level.displayName}</h2>
    <div className="summary-grid">{[[summary.score, "Score"], [summary.totalQuestions ? `${Math.round(summary.correctCount / summary.totalQuestions * 100)}%` : "0%", "Accuracy"],
      [summary.bestStreak, "Best Streak"], [summary.totalQuestions, "Answered"], [summary.averageAnswerTimeMs ?? 0, "Avg Time (ms)"], [summary.incorrectCount, "Missed"], [summary.xpAwarded, "Completion / best XP"]]
      .map(([value, label]) => <div key={label}><span>{value}</span><strong>{label}</strong></div>)}</div>
    {summary.isPersonalBest && <p className="notice">New personal best!</p>}
    {!summary.completed && <p>Your submitted answers were saved. This Rush will not count toward fluency or Express Pass.</p>}
    <div className="practice-actions"><button disabled={busy} onClick={() => void start()}>Play Again</button><button disabled={busy} onClick={onExit}>Back to Levels</button></div>
    {message && <div role="alert" className="notice">{message}<button disabled={busy} onClick={() => retry.current?.()}>Retry</button></div>}
  </div></section>;
  return <section className="rush-shell" aria-labelledby="rush-title"><div className="rush-header"><div>
    <p className="eyebrow">Rush Mode</p><h2 id="rush-title">{level.displayName}</h2></div>
    <button disabled={!round || busy} onClick={() => void finish(false)}>Exit Rush</button></div>
    <div className="rush-meter">{[[`${timeLeft}s`, "Time Left"], [stats?.score ?? 0, "Score"], [stats?.currentStreak ?? 0, "Streak"],
      [stats?.bestStreak ?? 0, "Best"], [stats?.totalQuestions ?? 0, "Answered"], [stats?.correctCount ?? 0, "Correct"]]
      .map(([value, label]) => <div key={label}><span>{value}</span><strong>{label}</strong></div>)}</div>
    <article className={`question-panel rush-question ${impact ? `rush-question--${impact}` : ""}`}>
      {question && <AnswerPanel question={question} disabled={busy || timeLeft <= 0 || finishing.current} onSubmit={submit} />}
      {busy && <p role="status">Saving / loading…</p>}
      {message && <div role="alert" className="notice">{message} <button disabled={busy} onClick={() => retry.current?.()}>Retry</button></div>}
    </article>
  </section>;
}
