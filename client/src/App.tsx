import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { roadToArithmetic, type MasteryPolicy, type QuestionFormat } from "@road-to-math/shared";
import { apiRequest } from "./api";
import { PracticeMode, RushMode } from "./gameplay";

const selectedPlayerStorageKey = "road-to-math:selected-player-id";

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
  evidence: { missingRequirements: string[] };
  masteryPolicy: MasteryPolicy;
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

  async function exitMode() {
    setEntryChoice(null);
    if (!selectedPlayer) return;
    try {
      const [, nextProgress] = await Promise.all([
        refreshSelectedPlayer(), apiRequest<PlayerProgress>(`/players/${selectedPlayer.id}/progress`)
      ]);
      setProgress(nextProgress);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to refresh saved progress. Try reloading.");
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
          key={`${selectedPlayer.id}:${entryChoice?.level.levelId}`}
          player={selectedPlayer}
          level={practiceLevel}
          onExit={() => void exitMode()}
        />
      </main>
    );
  }

  if (selectedPlayer && rushLevel) {
    return (
      <main className="app-shell">
        <RushMode
          key={`${selectedPlayer.id}:${entryChoice?.level.levelId}`}
          player={selectedPlayer}
          level={rushLevel}
          onExit={() => void exitMode()}
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
                            <span>Understanding {level.progress.understandingPercent}%</span>
                            <span>Recognition {level.progress.recognitionPercent}%</span>
                            <span>Fluency {level.progress.fluencyPercent}%</span>
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

                        {level.isUnlocked && level.masteryState !== "mastered" && level.masteryState !== "goldMastered" && (
                          <details><summary>Unlock requirements</summary>
                            <ul>{level.evidence.missingRequirements.map(requirement => <li key={requirement}>{requirement}</li>)}</ul>
                            <p>Understanding ≥{level.masteryPolicy.minUnderstandingPercent}%, Recognition ≥{level.masteryPolicy.minRecognitionPercent}%, Fluency ≥{level.masteryPolicy.minFluencyPercent}%. Express Pass: two qualifying Rushes, each with at least {level.masteryPolicy.minRushQuestions} answers, averaging ≥90% accuracy.</p>
                          </details>
                        )}
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

            <section className="algebra-gate" aria-label="Next curriculum gate">
              <div>
                <p className="eyebrow">After Level 18</p>
                <h2>Fractions / Decimals / Ratios</h2>
                <p>Fractions, Decimals and Ratios are planned next. Algebra follows those foundations.</p>
              </div>
              <strong>{isArithmeticComplete ? "Arithmetic complete" : "Locked until Arithmetic Level 18 is mastered"}</strong>
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
