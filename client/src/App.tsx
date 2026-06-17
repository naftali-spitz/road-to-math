import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  advancePracticeFormatState,
  choosePracticeQuestionFormat,
  checkAnswer,
  generateQuestion,
  getCurrentPracticeFormat,
  initialPracticeFormatState,
  roadToArithmetic,
  type AnswerValue,
  type GeneratedQuestion,
  type Level,
  type PracticeFormatState,
  type QuestionFormat
} from "@road-to-math/shared";

type Player = {
  id: string;
  displayName: string;
  xpTotal: number;
};

type PracticeAccuracy = {
  totalAttempts: number;
  correctAttempts: number;
  accuracyPercent: number;
};

type BestRushResult = {
  score: number;
  totalQuestions: number;
  correctCount: number;
  accuracyPercent: number;
  averageAnswerTimeMs: number | null;
  completedAt: string | null;
};

type LevelSignalProgress = {
  masteryState: string;
  understandingPercent: number;
  recognitionPercent: number;
  fluencyPercent: number;
  masteryPercent: number;
  attemptsCount: number;
  practiceAttemptsCount: number;
  rushAttemptsCount: number;
  correctAttemptsCount: number;
  practiceAccuracy: PracticeAccuracy;
  bestRush: BestRushResult | null;
  recommendation: "Practice more" | "Try Rush" | "Level mastered" | "Next level unlocked";
};

type LevelProgressView = {
  levelId: string;
  roadId: string;
  worldId: string;
  order: number;
  displayName: string;
  coreInstinct: {
    instinctId: string;
    description: string;
  };
  benchmarkAnswerSeconds: number;
  supportedQuestionFormats: QuestionFormat[];
  isUnlocked: boolean;
  masteryState: string;
  progress: LevelSignalProgress | null;
};

type WorldProgressView = {
  worldId: string;
  displayName: string;
  order: number;
  levels: LevelProgressView[];
};

type RoadProgressView = {
  roadId: string;
  displayName: string;
  isActive: boolean;
  worlds: WorldProgressView[];
};

type PlayerProgress = {
  playerId: string;
  activeRoadId: string;
  roads: RoadProgressView[];
};

type EntryChoice = {
  mode: "practice" | "rush";
  level: LevelProgressView;
};

type PracticeFeedback = {
  isCorrect: boolean;
  expectedAnswer: string;
};

type PracticeStats = {
  total: number;
  correct: number;
  byFormat: Record<string, { total: number; correct: number }>;
};

type RushSession = {
  id: string;
  durationSeconds: number;
};

type RushSummary = {
  rushSessionId: string;
  completed: boolean;
  abandoned: boolean;
  isPersonalBest: boolean;
  xpAwarded: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  averageAnswerTimeMs: number | null;
  bestStreak: number;
  score: number;
};

type RushStats = {
  total: number;
  correct: number;
  currentStreak: number;
  bestStreak: number;
  score: number;
  totalAnswerTimeMs: number;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
const selectedPlayerStorageKey = "road-to-math:selected-player-id";
const practiceQuestionTarget = 10;
const rushDurationSeconds = 60;
const recentQuestionLimit = 8;

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      },
      ...init
    });
  } catch {
    throw new Error("Unable to reach the Road to Math API.");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

function findLevelConfig(levelId: string) {
  return roadToArithmetic.worlds.flatMap((world) => world.levels).find((level) => level.levelId === levelId) ?? null;
}

function getVisibleLevelState(level: LevelProgressView) {
  if (!level.isUnlocked) {
    return "locked";
  }

  if (level.masteryState === "mastered" || level.masteryState === "goldMastered") {
    return "mastered";
  }

  if (level.masteryState === "practicing" || level.masteryState === "rushReady" || level.masteryState === "needsRefresh") {
    return "practicing";
  }

  return "unlocked";
}

function summarizeLevels(levels: LevelProgressView[]) {
  const mastered = levels.filter((level) => level.masteryState === "mastered" || level.masteryState === "goldMastered").length;
  const unlocked = levels.filter((level) => level.isUnlocked).length;
  const practiced = levels.filter((level) => (level.progress?.practiceAttemptsCount ?? 0) > 0).length;

  return {
    total: levels.length,
    mastered,
    unlocked,
    practiced,
    masteryPercent: levels.length > 0 ? Math.round((mastered / levels.length) * 100) : 0
  };
}

function getLevelRecommendation(level: LevelProgressView) {
  if (!level.isUnlocked) {
    return "Practice more";
  }

  return level.progress?.recommendation ?? "Practice more";
}

function formatBestRush(bestRush: BestRushResult | null) {
  if (!bestRush) {
    return "No completed Rush";
  }

  const speed = bestRush.averageAnswerTimeMs === null ? "no speed" : `${(bestRush.averageAnswerTimeMs / 1000).toFixed(1)}s avg`;
  return `${bestRush.score} pts · ${bestRush.accuracyPercent}% · ${speed}`;
}

function displayAnswer(value: AnswerValue) {
  return typeof value === "boolean" ? (value ? "True" : "False") : String(value);
}

function pickRandomFormat(formats: QuestionFormat[], seed: number) {
  return formats[Math.abs(seed) % formats.length];
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

function getRushScoreDelta(isCorrect: boolean, answerTimeMs: number, benchmarkAnswerSeconds: number, streak: number) {
  if (!isCorrect) {
    return 0;
  }

  const fastBonus = answerTimeMs <= benchmarkAnswerSeconds * 1000 ? 5 : 0;
  return (10 + fastBonus) * getComboMultiplier(streak);
}

function PracticeMode({
  player,
  level,
  onExit,
  onPlayerUpdated
}: {
  player: Player;
  level: Level;
  onExit: () => void;
  onPlayerUpdated: () => void;
}) {
  const activeFormats = level.supportedQuestionFormats;
  const [formatState, setFormatState] = useState<PracticeFormatState>(initialPracticeFormatState);
  const [questionCount, setQuestionCount] = useState(0);
  const recentQuestionFingerprintsRef = useRef<string[]>([]);
  function rememberQuestion(nextQuestion: GeneratedQuestion) {
    recentQuestionFingerprintsRef.current = [
      nextQuestion.fingerprint,
      ...recentQuestionFingerprintsRef.current.filter((fingerprint) => fingerprint !== nextQuestion.fingerprint)
    ].slice(0, recentQuestionLimit);
    return nextQuestion;
  }
  const [question, setQuestion] = useState<GeneratedQuestion>(() =>
    rememberQuestion(generateQuestion(level, { format: activeFormats[0], seed: `${level.levelId}:practice:0` }))
  );
  const [questionStartedAt, setQuestionStartedAt] = useState(() => Date.now());
  const [typedAnswer, setTypedAnswer] = useState("");
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [stats, setStats] = useState<PracticeStats>({ total: 0, correct: 0, byFormat: {} });
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [completionXP, setCompletionXP] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const completionAwardedRef = useRef(false);

  const allFormatsIntroduced = formatState.introducedFormats.length >= activeFormats.length;
  const currentFormat = getCurrentPracticeFormat(activeFormats, formatState);
  const isTypedFormat = question.format === "solve" || question.format === "fillBlank";

  function createNextQuestion(nextCount: number, nextFormatState: PracticeFormatState) {
    const format = choosePracticeQuestionFormat(activeFormats, nextFormatState, nextCount + Date.now());

    setQuestion(
      rememberQuestion(
        generateQuestion(level, {
          format,
          seed: `${level.levelId}:practice:${nextCount}:${format}`,
          recentFingerprints: recentQuestionFingerprintsRef.current
        })
      )
    );
    setQuestionStartedAt(Date.now());
    setTypedAnswer("");
    setFeedback(null);
  }

  function handleExit() {
    if (stats.total === 0 || window.confirm("Exit Practice? Your saved attempts will stay in the database.")) {
      onExit();
    }
  }

  async function submitAnswer(answer: AnswerValue | string) {
    if (feedback || isSummaryVisible) {
      return;
    }

    const answerTimeMs = Date.now() - questionStartedAt;
    const result = checkAnswer(question, answer);

    try {
      await apiRequest(`/players/${player.id}/attempts/practice`, {
        method: "POST",
        body: JSON.stringify({
          question,
          selectedAnswer: answer,
          answerTimeMs
        })
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save attempt.");
      return;
    }

    setStats((current) => {
      const formatStats = current.byFormat[question.format] ?? { total: 0, correct: 0 };
      return {
        total: current.total + 1,
        correct: current.correct + (result.isCorrect ? 1 : 0),
        byFormat: {
          ...current.byFormat,
          [question.format]: {
            total: formatStats.total + 1,
            correct: formatStats.correct + (result.isCorrect ? 1 : 0)
          }
        }
      };
    });

    setFeedback({
      isCorrect: result.isCorrect,
      expectedAnswer: result.expectedAnswer
    });

  }

  function nextQuestion() {
    const nextCount = questionCount + 1;
    setQuestionCount(nextCount);

    if (nextCount >= practiceQuestionTarget) {
      setIsSummaryVisible(true);
      return;
    }

    const nextFormatState = feedback
      ? advancePracticeFormatState(activeFormats, formatState, feedback.isCorrect)
      : formatState;

    setFormatState(nextFormatState);
    createNextQuestion(nextCount, nextFormatState);
  }

  useEffect(() => {
    if (isTypedFormat && !feedback && !isSummaryVisible) {
      inputRef.current?.focus();
    }
  }, [feedback, isSummaryVisible, isTypedFormat, question.questionTemplateId]);

  useEffect(() => {
    if (!isSummaryVisible || completionAwardedRef.current) {
      return;
    }

    completionAwardedRef.current = true;

    async function awardCompletionXP() {
      try {
        const data = await apiRequest<{ xpAwarded: number }>(`/players/${player.id}/practice-sessions/complete`, {
          method: "POST",
          body: JSON.stringify({
            roadId: level.roadId,
            worldId: level.worldId,
            levelId: level.levelId
          })
        });
        setCompletionXP(data.xpAwarded);
        await onPlayerUpdated();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to award Practice completion XP.");
      }
    }

    awardCompletionXP();
  }, [isSummaryVisible, level, onPlayerUpdated, player.id]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        handleExit();
        return;
      }

      if (feedback) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          nextQuestion();
        }
        return;
      }

      if (question.format === "multipleChoice" && ["1", "2", "3", "4"].includes(event.key)) {
        event.preventDefault();
        submitAnswer(event.key);
        return;
      }

      if (question.format === "trueFalse" && ["t", "T", "f", "F"].includes(event.key)) {
        event.preventDefault();
        submitAnswer(event.key.toLowerCase() === "t");
        return;
      }

      if (isTypedFormat && event.key === " ") {
        event.preventDefault();
        submitAnswer(typedAnswer);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [feedback, isSummaryVisible, question, typedAnswer, isTypedFormat, formatState]);

  if (isSummaryVisible) {
    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

    return (
      <section className="practice-shell" aria-labelledby="practice-summary-title">
        <div className="practice-summary">
          <p className="eyebrow">Practice Summary</p>
          <h2 id="practice-summary-title">{level.displayName}</h2>
          <div className="summary-grid">
            <div>
              <span>{stats.total}</span>
              <strong>Answered</strong>
            </div>
            <div>
              <span>{stats.correct}</span>
              <strong>Correct</strong>
            </div>
            <div>
              <span>{accuracy}%</span>
              <strong>Accuracy</strong>
            </div>
            <div>
              <span>+{completionXP}</span>
              <strong>Completion XP</strong>
            </div>
          </div>
          <div className="format-summary">
            {Object.entries(stats.byFormat).map(([format, formatStats]) => (
              <div key={format}>
                <strong>{format}</strong>
                <span>
                  {formatStats.correct}/{formatStats.total}
                </span>
              </div>
            ))}
          </div>
          <div className="practice-actions">
            <button
              type="button"
              onClick={() => {
                setIsSummaryVisible(false);
                setFeedback(null);
                setQuestionCount(0);
                setStats({ total: 0, correct: 0, byFormat: {} });
                setCompletionXP(0);
                completionAwardedRef.current = false;
                createNextQuestion(0, formatState);
              }}
            >
              Keep Practicing
            </button>
            <button type="button" onClick={onExit}>
              Back to Levels
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="practice-shell" aria-labelledby="practice-title">
      <div className="practice-header">
        <div>
          <p className="eyebrow">Practice Mode</p>
          <h2 id="practice-title">{level.displayName}</h2>
          <p className="muted">{level.coreInstinct.description}</p>
        </div>
        <button type="button" onClick={handleExit}>
          Exit
        </button>
      </div>

      <div className="format-strip" aria-label="Practice format progress">
        {activeFormats.map((format, index) => {
          const isIntroduced = formatState.introducedFormats.includes(format);
          const isCurrent = !allFormatsIntroduced && index === formatState.formatIndex;
          return (
            <span className={isIntroduced ? "format-pill format-pill--done" : isCurrent ? "format-pill format-pill--current" : "format-pill"} key={format}>
              {format}
            </span>
          );
        })}
      </div>

      <article className={`question-panel ${feedback ? (feedback.isCorrect ? "question-panel--correct" : "question-panel--wrong") : ""}`}>
        <div className="question-panel__top">
          <span>{currentFormat === "mixed" ? "Mixed formats" : `Current format: ${currentFormat}`}</span>
          <strong>
            {Math.min(stats.total + 1, practiceQuestionTarget)} / {practiceQuestionTarget}
          </strong>
        </div>
        <p className="question-text">{question.prompt}</p>

        {isTypedFormat && (
          <form
            className="answer-form"
            onSubmit={(event) => {
              event.preventDefault();
              submitAnswer(typedAnswer);
            }}
          >
            <input
              ref={inputRef}
              value={typedAnswer}
              disabled={feedback !== null}
              onChange={(event) => setTypedAnswer(event.target.value)}
              inputMode="numeric"
              aria-label="Answer"
            />
            <button type="submit" disabled={feedback !== null}>
              Submit
            </button>
          </form>
        )}

        {question.format === "multipleChoice" && (
          <div className="choice-grid">
            {question.options?.map((option) => (
              <button key={option.optionId} type="button" disabled={feedback !== null} onClick={() => submitAnswer(option.optionId)}>
                <span>{option.optionId}</span>
                <strong>{option.label}</strong>
              </button>
            ))}
          </div>
        )}

        {question.format === "trueFalse" && (
          <div className="choice-grid choice-grid--two">
            <button type="button" disabled={feedback !== null} onClick={() => submitAnswer(true)}>
              <span>T</span>
              <strong>True</strong>
            </button>
            <button type="button" disabled={feedback !== null} onClick={() => submitAnswer(false)}>
              <span>F</span>
              <strong>False</strong>
            </button>
          </div>
        )}

        {feedback && (
          <div className="feedback-row" role="status">
            <strong>{feedback.isCorrect ? "Correct" : "Wrong"}</strong>
            {!feedback.isCorrect && <span>Expected {feedback.expectedAnswer}</span>}
            <button type="button" onClick={nextQuestion}>
              Next Question
            </button>
          </div>
        )}

        {message && <p className="notice">{message}</p>}
      </article>
    </section>
  );
}

function RushMode({
  player,
  level,
  onExit,
  onPlayerUpdated
}: {
  player: Player;
  level: Level;
  onExit: () => void;
  onPlayerUpdated: () => void;
}) {
  const activeFormats = level.supportedQuestionFormats;
  const [rushSession, setRushSession] = useState<RushSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(rushDurationSeconds);
  const recentQuestionFingerprintsRef = useRef<string[]>([]);
  function rememberQuestion(nextQuestion: GeneratedQuestion) {
    recentQuestionFingerprintsRef.current = [
      nextQuestion.fingerprint,
      ...recentQuestionFingerprintsRef.current.filter((fingerprint) => fingerprint !== nextQuestion.fingerprint)
    ].slice(0, recentQuestionLimit);
    return nextQuestion;
  }
  const [question, setQuestion] = useState<GeneratedQuestion>(() =>
    rememberQuestion(
      generateQuestion(level, { format: pickRandomFormat(activeFormats, Date.now()), seed: `${level.levelId}:rush:0` })
    )
  );
  const [questionStartedAt, setQuestionStartedAt] = useState(() => Date.now());
  const [typedAnswer, setTypedAnswer] = useState("");
  const [stats, setStats] = useState<RushStats>({
    total: 0,
    correct: 0,
    currentStreak: 0,
    bestStreak: 0,
    score: 0,
    totalAnswerTimeMs: 0
  });
  const [summary, setSummary] = useState<RushSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [impact, setImpact] = useState<"correct" | "wrong" | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isFinishingRef = useRef(false);

  const isTypedFormat = question.format === "solve" || question.format === "fillBlank";
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  const averageAnswerTimeMs = stats.total > 0 ? Math.round(stats.totalAnswerTimeMs / stats.total) : 0;

  function createNextQuestion(nextTotal: number) {
    const format = pickRandomFormat(activeFormats, Date.now() + nextTotal);
    setQuestion(
      rememberQuestion(
        generateQuestion(level, {
          format,
          seed: `${level.levelId}:rush:${nextTotal}:${format}:${Date.now()}`,
          recentFingerprints: recentQuestionFingerprintsRef.current
        })
      )
    );
    setQuestionStartedAt(Date.now());
    setTypedAnswer("");
  }

  async function finishRush(completed: boolean, reason?: string) {
    if (!rushSession || isFinishingRef.current) {
      return;
    }

    isFinishingRef.current = true;

    try {
      const path = completed
        ? `/players/${player.id}/rush-sessions/${rushSession.id}/complete`
        : `/players/${player.id}/rush-sessions/${rushSession.id}/abandon`;
      const data = await apiRequest<{ rushSession: RushSummary }>(path, {
        method: "POST",
        body: JSON.stringify({ reason })
      });
      setSummary(data.rushSession);
      await onPlayerUpdated();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to finish Rush.");
      isFinishingRef.current = false;
    }
  }

  async function abandonRush() {
    if (stats.total === 0 || window.confirm("Exit Rush early? Submitted attempts stay saved, but this Rush will be abandoned.")) {
      await finishRush(false, "player_exit");
    }
  }

  async function submitAnswer(answer: AnswerValue | string) {
    if (!rushSession || summary || timeLeft <= 0) {
      return;
    }

    const answerTimeMs = Date.now() - questionStartedAt;

    try {
      const data = await apiRequest<{ isCorrect: boolean }>(`/players/${player.id}/rush-sessions/${rushSession.id}/attempts`, {
        method: "POST",
        body: JSON.stringify({
          question,
          selectedAnswer: answer,
          answerTimeMs
        })
      });

      setStats((current) => {
        const nextStreak = data.isCorrect ? current.currentStreak + 1 : 0;
        const nextScore = current.score + getRushScoreDelta(data.isCorrect, answerTimeMs, level.benchmarkAnswerSeconds, nextStreak);

        return {
          total: current.total + 1,
          correct: current.correct + (data.isCorrect ? 1 : 0),
          currentStreak: nextStreak,
          bestStreak: Math.max(current.bestStreak, nextStreak),
          score: nextScore,
          totalAnswerTimeMs: current.totalAnswerTimeMs + answerTimeMs
        };
      });

      setImpact(data.isCorrect ? "correct" : "wrong");
      window.setTimeout(() => setImpact(null), 160);
      createNextQuestion(stats.total + 1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save Rush attempt.");
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function start() {
      try {
        const data = await apiRequest<{ rushSession: RushSession }>(`/players/${player.id}/rush-sessions`, {
          method: "POST",
          body: JSON.stringify({
            roadId: level.roadId,
            worldId: level.worldId,
            levelId: level.levelId,
            instinctId: level.coreInstinct.instinctId,
            durationSeconds: rushDurationSeconds
          })
        });

        if (isMounted) {
          setRushSession(data.rushSession);
          setTimeLeft(data.rushSession.durationSeconds);
          setQuestionStartedAt(Date.now());
        }
      } catch (error) {
        if (isMounted) {
          setMessage(error instanceof Error ? error.message : "Unable to start Rush.");
        }
      }
    }

    start();

    return () => {
      isMounted = false;
    };
  }, [level, player.id]);

  useEffect(() => {
    if (!rushSession || summary) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [rushSession, summary]);

  useEffect(() => {
    if (rushSession && !summary && timeLeft <= 0) {
      finishRush(true);
    }
  }, [rushSession, summary, timeLeft]);

  useEffect(() => {
    if (isTypedFormat && !summary) {
      inputRef.current?.focus();
    }
  }, [isTypedFormat, question.questionTemplateId, summary]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        abandonRush();
        return;
      }

      if (summary) {
        return;
      }

      if (question.format === "multipleChoice" && ["1", "2", "3", "4"].includes(event.key)) {
        event.preventDefault();
        submitAnswer(event.key);
        return;
      }

      if (question.format === "trueFalse" && ["t", "T", "f", "F"].includes(event.key)) {
        event.preventDefault();
        submitAnswer(event.key.toLowerCase() === "t");
        return;
      }

      if (isTypedFormat && event.key === " ") {
        event.preventDefault();
        submitAnswer(typedAnswer);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [question, typedAnswer, isTypedFormat, summary, rushSession, stats.total]);

  if (summary) {
    const summaryAccuracy =
      summary.totalQuestions > 0 ? Math.round((summary.correctCount / summary.totalQuestions) * 100) : 0;

    return (
      <section className="rush-shell" aria-labelledby="rush-summary-title">
        <div className="rush-summary">
          <p className="eyebrow">{summary.completed ? "Rush Complete" : "Rush Abandoned"}</p>
          <h2 id="rush-summary-title">{level.displayName}</h2>
          <div className="summary-grid">
            <div>
              <span>{summary.score}</span>
              <strong>Score</strong>
            </div>
            <div>
              <span>{summaryAccuracy}%</span>
              <strong>Accuracy</strong>
            </div>
            <div>
              <span>{summary.bestStreak}</span>
              <strong>Best Streak</strong>
            </div>
            <div>
              <span>{summary.totalQuestions}</span>
              <strong>Answered</strong>
            </div>
            <div>
              <span>{summary.averageAnswerTimeMs ?? 0}ms</span>
              <strong>Avg Time</strong>
            </div>
            <div>
              <span>{summary.incorrectCount}</span>
              <strong>Missed</strong>
            </div>
            <div>
              <span>+{summary.xpAwarded}</span>
              <strong>XP</strong>
            </div>
          </div>
          {summary.isPersonalBest && <p className="notice">New personal best: +25 XP.</p>}
          {!summary.completed && <p className="muted">Submitted attempts were saved, but this Rush does not count as completed.</p>}
          <div className="practice-actions">
            <button type="button" onClick={onExit}>
              Back to Levels
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rush-shell" aria-labelledby="rush-title">
      <div className="rush-header">
        <div>
          <p className="eyebrow">Rush Mode</p>
          <h2 id="rush-title">{level.displayName}</h2>
        </div>
        <button type="button" onClick={abandonRush}>
          Exit
        </button>
      </div>

      <div className="rush-meter">
        <div>
          <span>{timeLeft}s</span>
          <strong>Time</strong>
        </div>
        <div>
          <span>{stats.score}</span>
          <strong>Score</strong>
        </div>
        <div>
          <span>{stats.currentStreak}</span>
          <strong>Streak</strong>
        </div>
        <div>
          <span>{getComboMultiplier(stats.currentStreak)}x</span>
          <strong>Combo</strong>
        </div>
        <div>
          <span>{accuracy}%</span>
          <strong>Accuracy</strong>
        </div>
        <div>
          <span>{averageAnswerTimeMs}ms</span>
          <strong>Avg Time</strong>
        </div>
      </div>

      <article className={`question-panel rush-question ${impact ? `rush-question--${impact}` : ""}`}>
        <div className="question-panel__top">
          <span>{question.format}</span>
          <strong>{rushSession ? "Live" : "Starting..."}</strong>
        </div>
        <p className="question-text">{question.prompt}</p>

        {isTypedFormat && (
          <form
            className="answer-form"
            onSubmit={(event) => {
              event.preventDefault();
              submitAnswer(typedAnswer);
            }}
          >
            <input
              ref={inputRef}
              value={typedAnswer}
              disabled={!rushSession}
              onChange={(event) => setTypedAnswer(event.target.value)}
              inputMode="numeric"
              aria-label="Answer"
            />
            <button type="submit" disabled={!rushSession}>
              Submit
            </button>
          </form>
        )}

        {question.format === "multipleChoice" && (
          <div className="choice-grid">
            {question.options?.map((option) => (
              <button key={option.optionId} type="button" disabled={!rushSession} onClick={() => submitAnswer(option.optionId)}>
                <span>{option.optionId}</span>
                <strong>{option.label}</strong>
              </button>
            ))}
          </div>
        )}

        {question.format === "trueFalse" && (
          <div className="choice-grid choice-grid--two">
            <button type="button" disabled={!rushSession} onClick={() => submitAnswer(true)}>
              <span>T</span>
              <strong>True</strong>
            </button>
            <button type="button" disabled={!rushSession} onClick={() => submitAnswer(false)}>
              <span>F</span>
              <strong>False</strong>
            </button>
          </div>
        )}

        {message && <p className="notice">{message}</p>}
      </article>
    </section>
  );
}

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [entryChoice, setEntryChoice] = useState<EntryChoice | null>(null);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function loadPlayers() {
    const data = await apiRequest<{ players: Player[] }>("/players");
    setPlayers(data.players);
    return data.players;
  }

  async function selectPlayer(player: Player) {
    try {
      setMessage(null);
      setSelectedPlayer(player);
      setEntryChoice(null);
      localStorage.setItem(selectedPlayerStorageKey, player.id);
      await apiRequest(`/players/${player.id}/sessions`, { method: "POST" });
      const nextProgress = await apiRequest<PlayerProgress>(`/players/${player.id}/progress`);
      setProgress(nextProgress);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load player progress.");
      setProgress(null);
    }
  }

  async function refreshSelectedPlayer() {
    if (!selectedPlayer) {
      return;
    }

    const data = await apiRequest<{ player: Player }>(`/players/${selectedPlayer.id}`);
    setSelectedPlayer(data.player);
    setPlayers((current) => current.map((player) => (player.id === data.player.id ? data.player : player)));
  }

  useEffect(() => {
    let isMounted = true;

    async function boot() {
      try {
        const loadedPlayers = await loadPlayers();
        const storedPlayerId = localStorage.getItem(selectedPlayerStorageKey);
        const storedPlayer = loadedPlayers.find((player) => player.id === storedPlayerId);

        if (storedPlayer && isMounted) {
          await selectPlayer(storedPlayer);
        }
      } catch (error) {
        if (isMounted) {
          setMessage(error instanceof Error ? error.message : "Unable to load local players.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    boot();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCreatePlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    try {
      const data = await apiRequest<{ player: Player }>("/players", {
        method: "POST",
        body: JSON.stringify({ displayName: newPlayerName })
      });
      setNewPlayerName("");
      const loadedPlayers = await loadPlayers();
      const createdPlayer = loadedPlayers.find((player) => player.id === data.player.id) ?? data.player;
      await selectPlayer(createdPlayer);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create player.");
    }
  }

  const activeRoad = useMemo(() => progress?.roads.find((road) => road.isActive) ?? null, [progress]);
  const roadLevels = useMemo(
    () => activeRoad?.worlds.flatMap((world) => world.levels) ?? [],
    [activeRoad]
  );
  const roadSummary = useMemo(() => summarizeLevels(roadLevels), [roadLevels]);
  const nextRecommendedLevel = useMemo(
    () =>
      roadLevels.find((level) => level.isUnlocked && level.masteryState !== "mastered" && level.masteryState !== "goldMastered") ??
      roadLevels.find((level) => !level.isUnlocked) ??
      null,
    [roadLevels]
  );
  const finalArithmeticLevel = useMemo(() => {
    if (!activeRoad) {
      return null;
    }

    const finalWorld = activeRoad.worlds[activeRoad.worlds.length - 1];
    return finalWorld?.levels[finalWorld.levels.length - 1] ?? null;
  }, [activeRoad]);
  const isArithmeticComplete =
    finalArithmeticLevel?.masteryState === "mastered" || finalArithmeticLevel?.masteryState === "goldMastered";
  const practiceLevel = entryChoice?.mode === "practice" ? findLevelConfig(entryChoice.level.levelId) : null;
  const rushLevel = entryChoice?.mode === "rush" ? findLevelConfig(entryChoice.level.levelId) : null;

  if (selectedPlayer && practiceLevel) {
    return (
      <main className="app-shell">
        <PracticeMode
          player={selectedPlayer}
          level={practiceLevel}
          onPlayerUpdated={refreshSelectedPlayer}
          onExit={async () => {
            setEntryChoice(null);
            await refreshSelectedPlayer();
            const nextProgress = await apiRequest<PlayerProgress>(`/players/${selectedPlayer.id}/progress`);
            setProgress(nextProgress);
          }}
        />
      </main>
    );
  }

  if (selectedPlayer && rushLevel) {
    return (
      <main className="app-shell">
        <RushMode
          player={selectedPlayer}
          level={rushLevel}
          onPlayerUpdated={refreshSelectedPlayer}
          onExit={async () => {
            setEntryChoice(null);
            await refreshSelectedPlayer();
            const nextProgress = await apiRequest<PlayerProgress>(`/players/${selectedPlayer.id}/progress`);
            setProgress(nextProgress);
          }}
        />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Local first build</p>
          <h1>Road to Math</h1>
        </div>
        {selectedPlayer && (
          <div className="player-chip">
            <span>{selectedPlayer.displayName}</span>
            <strong>{selectedPlayer.xpTotal} XP</strong>
            <button
              type="button"
              onClick={() => {
                setSelectedPlayer(null);
                setProgress(null);
                setEntryChoice(null);
                localStorage.removeItem(selectedPlayerStorageKey);
              }}
            >
              Switch
            </button>
          </div>
        )}
      </header>

      {message && <p className="notice">{message}</p>}

      {!selectedPlayer && (
        <section className="home-grid" aria-label="Local player selection">
          <div className="panel">
            <h2>Create Player</h2>
            <form className="create-form" onSubmit={handleCreatePlayer}>
              <label htmlFor="player-name">Name</label>
              <div className="form-row">
                <input
                  id="player-name"
                  maxLength={40}
                  value={newPlayerName}
                  onChange={(event) => setNewPlayerName(event.target.value)}
                  placeholder="Ada"
                />
                <button type="submit">Create</button>
              </div>
            </form>
          </div>

          <div className="panel">
            <h2>Choose Player</h2>
            {isLoading && <p className="muted">Loading local players...</p>}
            {!isLoading && players.length === 0 && <p className="muted">No local players yet.</p>}
            <div className="player-list">
              {players.map((player) => (
                <button className="player-row" key={player.id} type="button" onClick={() => selectPlayer(player)}>
                  <span>{player.displayName}</span>
                  <strong>{player.xpTotal} XP</strong>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {selectedPlayer && activeRoad && (
        <section className="game-layout" aria-label="Road to Arithmetic navigation">
          <aside className="road-panel">
            <p className="eyebrow">Active Road</p>
            <h2>{activeRoad.displayName}</h2>
            <p className="muted">Only Road to Arithmetic is active in this build.</p>
            <section className="profile-summary" aria-label={`${selectedPlayer.displayName} progress summary`}>
              <div>
                <span>Player</span>
                <strong>{selectedPlayer.displayName}</strong>
              </div>
              <div>
                <span>XP Total</span>
                <strong>{selectedPlayer.xpTotal}</strong>
              </div>
              <div>
                <span>Road Progress</span>
                <strong>
                  {roadSummary.mastered}/{roadSummary.total} mastered
                </strong>
              </div>
              <div>
                <span>Unlocked</span>
                <strong>
                  {roadSummary.unlocked}/{roadSummary.total} levels
                </strong>
              </div>
              <div>
                <span>Next</span>
                <strong>{nextRecommendedLevel ? `${nextRecommendedLevel.displayName}: ${getLevelRecommendation(nextRecommendedLevel)}` : "Road complete"}</strong>
              </div>
            </section>
            <div className="inactive-road">Road to Algebra</div>
            <div className="inactive-road">Road to Geometry</div>
          </aside>

          <div className="world-stack">
            {activeRoad.worlds.map((world) => (
              <section className="world-section" key={world.worldId} aria-labelledby={`${world.worldId}-title`}>
                {(() => {
                  const worldSummary = summarizeLevels(world.levels);

                  return (
                    <div className="world-header">
                      <div>
                        <p className="eyebrow">World {world.order}</p>
                        <h2 id={`${world.worldId}-title`}>{world.displayName}</h2>
                      </div>
                      <div className="world-progress" aria-label={`${world.displayName} progress`}>
                        <strong>
                          {worldSummary.mastered}/{worldSummary.total} mastered
                        </strong>
                        <span>{worldSummary.unlocked} unlocked</span>
                        <div>
                          <i style={{ width: `${worldSummary.masteryPercent}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="level-grid">
                  {world.levels.length === 0 && <p className="empty-state">No levels are configured for this World yet.</p>}
                  {world.levels.map((level) => {
                    const visibleState = getVisibleLevelState(level);

                    return (
                      <article className={`level-card level-card--${visibleState}`} key={level.levelId}>
                        <div className="level-card__top">
                          <span>Level {level.order}</span>
                          <strong>{visibleState}</strong>
                        </div>
                        <h3>{level.displayName}</h3>
                        <p>{level.coreInstinct.description}</p>
                        <dl className="level-meta">
                          <div>
                            <dt>Benchmark</dt>
                            <dd>{level.benchmarkAnswerSeconds}s</dd>
                          </div>
                          <div>
                            <dt>Formats</dt>
                            <dd>{level.supportedQuestionFormats.length}</dd>
                          </div>
                        </dl>

                        {level.progress && level.isUnlocked && (
                          <div className="mastery-signals" aria-label={`${level.displayName} mastery signals`}>
                            <span>U {level.progress.understandingPercent}%</span>
                            <span>R {level.progress.recognitionPercent}%</span>
                            <span>F {level.progress.fluencyPercent}%</span>
                          </div>
                        )}

                        <dl className="progress-details">
                          <div>
                            <dt>Practice</dt>
                            <dd>
                              {level.progress
                                ? `${level.progress.practiceAccuracy.accuracyPercent}% (${level.progress.practiceAccuracy.correctAttempts}/${level.progress.practiceAccuracy.totalAttempts})`
                                : "No attempts"}
                            </dd>
                          </div>
                          <div>
                            <dt>Best Rush</dt>
                            <dd>{formatBestRush(level.progress?.bestRush ?? null)}</dd>
                          </div>
                          <div>
                            <dt>Recommendation</dt>
                            <dd>{getLevelRecommendation(level)}</dd>
                          </div>
                        </dl>

                        <div className="entry-actions">
                          <button
                            type="button"
                            disabled={!level.isUnlocked}
                            onClick={() => setEntryChoice({ mode: "practice", level })}
                          >
                            Start Practice
                          </button>
                          <button
                            type="button"
                            disabled={!level.isUnlocked}
                            onClick={() => setEntryChoice({ mode: "rush", level })}
                          >
                            I already know this — try Rush
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}

            <section className="algebra-gate" aria-label="Road to Algebra gate">
              <div>
                <p className="eyebrow">After Level 9</p>
                <h2>Road to Algebra</h2>
                <p>Road to Algebra is coming later.</p>
              </div>
              <strong>{isArithmeticComplete ? "Arithmetic complete" : "Locked until Arithmetic Level 9 is mastered"}</strong>
            </section>
          </div>
        </section>
      )}

      {selectedPlayer && !activeRoad && (
        <section className="panel empty-state" aria-live="polite">
          <h2>No Road progress available</h2>
          <p className="muted">Switch players or try again after the backend is connected.</p>
        </section>
      )}

    </main>
  );
}
