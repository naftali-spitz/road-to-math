import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import type { HealthResponse } from "@road-to-math/shared";
import { getDatabase, getDatabaseDebugInfo, getDatabaseHealth } from "./database.js";
import { env } from "./env.js";
import {
  AttemptAccessError,
  completePracticeSession,
  finishRushSession,
  startRushSession,
  submitPracticeAttempt,
  submitRushAttempt
} from "./attempts.js";
import { createPlayer, getPlayer, getPlayerProgress, listPlayers, startOrResumePlaySession } from "./players.js";

getDatabase();

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

function sendAttemptError(error: unknown, response: express.Response, fallbackMessage: string) {
  if (error instanceof AttemptAccessError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }

  response.status(400).json({
    error: error instanceof Error ? error.message : fallbackMessage
  });
}

app.get("/api/health", (_request, response) => {
  const database = getDatabaseHealth();
  const payload: HealthResponse = {
    status: database.status === "connected" ? "ok" : "degraded",
    service: "road-to-math-api",
    message: "Frontend, backend, and SQLite are connected.",
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    uptimeSeconds: Math.round(process.uptime()),
    database
  };

  response.json(payload);
});

app.get("/api/debug/database", (_request, response) => {
  response.json(getDatabaseDebugInfo());
});

app.get("/api/players", (_request, response) => {
  response.json({ players: listPlayers() });
});

app.post("/api/players", (request, response) => {
  try {
    const player = createPlayer(String(request.body?.displayName ?? ""));
    response.status(201).json({ player });
  } catch (error) {
    response.status(400).json({
      error: error instanceof Error ? error.message : "Unable to create player."
    });
  }
});

app.get("/api/players/:playerId", (request, response) => {
  const player = getPlayer(request.params.playerId);

  if (!player) {
    response.status(404).json({ error: "Player not found." });
    return;
  }

  response.json({ player });
});

app.get("/api/players/:playerId/progress", (request, response) => {
  const player = getPlayer(request.params.playerId);

  if (!player) {
    response.status(404).json({ error: "Player not found." });
    return;
  }

  response.json(getPlayerProgress(player.id));
});

app.post("/api/players/:playerId/sessions", (request, response) => {
  const session = startOrResumePlaySession(request.params.playerId);

  if (!session) {
    response.status(404).json({ error: "Player not found." });
    return;
  }

  response.status(session.resumed ? 200 : 201).json({ session });
});

app.post("/api/players/:playerId/attempts/practice", (request, response) => {
  let result;

  try {
    result = submitPracticeAttempt(request.params.playerId, {
      question: request.body?.question,
      selectedAnswer: request.body?.selectedAnswer,
      answerTimeMs: request.body?.answerTimeMs
    });
  } catch (error) {
    sendAttemptError(error, response, "Unable to save Practice attempt.");
    return;
  }

  if (!result) {
    response.status(404).json({ error: "Player not found." });
    return;
  }

  response.status(201).json(result);
});

app.post("/api/players/:playerId/practice-sessions/complete", (request, response) => {
  let result;

  try {
    result = completePracticeSession(request.params.playerId, {
      roadId: request.body?.roadId,
      worldId: request.body?.worldId,
      levelId: request.body?.levelId
    });
  } catch (error) {
    sendAttemptError(error, response, "Unable to complete Practice session.");
    return;
  }

  if (!result) {
    response.status(404).json({ error: "Player not found." });
    return;
  }

  response.json(result);
});

app.post("/api/players/:playerId/rush-sessions", (request, response) => {
  let result;

  try {
    result = startRushSession(request.params.playerId, {
      roadId: request.body?.roadId,
      worldId: request.body?.worldId,
      levelId: request.body?.levelId,
      instinctId: request.body?.instinctId,
      durationSeconds: request.body?.durationSeconds
    });
  } catch (error) {
    sendAttemptError(error, response, "Unable to start Rush.");
    return;
  }

  if (!result) {
    response.status(404).json({ error: "Player not found." });
    return;
  }

  response.status(201).json({ rushSession: result });
});

app.post("/api/players/:playerId/rush-sessions/:rushSessionId/attempts", (request, response) => {
  let result;

  try {
    result = submitRushAttempt(request.params.playerId, request.params.rushSessionId, {
      question: request.body?.question,
      selectedAnswer: request.body?.selectedAnswer,
      answerTimeMs: request.body?.answerTimeMs
    });
  } catch (error) {
    sendAttemptError(error, response, "Unable to save Rush attempt.");
    return;
  }

  if (!result) {
    response.status(404).json({ error: "Rush session not found." });
    return;
  }

  response.status(201).json(result);
});

app.post("/api/players/:playerId/rush-sessions/:rushSessionId/complete", (request, response) => {
  const result = finishRushSession(request.params.playerId, request.params.rushSessionId, true);

  if (!result) {
    response.status(404).json({ error: "Rush session not found." });
    return;
  }

  response.json({ rushSession: result });
});

app.post("/api/players/:playerId/rush-sessions/:rushSessionId/abandon", (request, response) => {
  const result = finishRushSession(
    request.params.playerId,
    request.params.rushSessionId,
    false,
    String(request.body?.reason ?? "player_exit")
  );

  if (!result) {
    response.status(404).json({ error: "Rush session not found." });
    return;
  }

  response.json({ rushSession: result });
});

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "API route not found." });
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  console.error(error);
  response.status(500).json({ error: "Unexpected server error." });
});

app.listen(env.port, () => {
  console.log(`Road to Math API listening on http://localhost:${env.port}`);
});
