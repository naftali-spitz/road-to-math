import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { env } from "./env.js";
import { getAppliedMigrations, latestMigrationVersion, runMigrations } from "./migrations.js";

let database: Database.Database | null = null;

const requiredTables = [
  "players",
  "play_sessions",
  "question_attempts",
  "rush_sessions",
  "level_progress",
  "player_xp_events"
];

const requiredIndexes = [
  "idx_attempts_player_level_created",
  "idx_attempts_player_instinct_created",
  "idx_attempts_player_mode_created"
];

export function getDatabase() {
  if (database) {
    return database;
  }

  fs.mkdirSync(path.dirname(env.databasePath), { recursive: true });
  database = new Database(env.databasePath);
  database.pragma("journal_mode = WAL");
  database.pragma("synchronous = NORMAL");
  database.pragma("foreign_keys = ON");
  runMigrations(database);

  return database;
}

export function getDatabaseHealth() {
  const db = getDatabase();
  const result = db.prepare("SELECT 1 AS ok").get() as { ok: number };
  const journalMode = db.pragma("journal_mode", { simple: true }) as string;

  return {
    status: result.ok === 1 ? "connected" : "error",
    file: env.databasePath,
    journalMode
  } as const;
}

export function getDatabaseDebugInfo() {
  const db = getDatabase();
  const appliedMigrations = getAppliedMigrations(db);
  const tableRows = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        ORDER BY name ASC
      `
    )
    .all() as Array<{ name: string }>;
  const indexRows = db
    .prepare(
      `
        SELECT name, tbl_name AS tableName
        FROM sqlite_master
        WHERE type = 'index'
          AND name NOT LIKE 'sqlite_autoindex%'
        ORDER BY name ASC
      `
    )
    .all() as Array<{ name: string; tableName: string }>;

  const tableNames = new Set(tableRows.map((row) => row.name));
  const indexNames = new Set(indexRows.map((row) => row.name));
  const requiredTableStatus = requiredTables.map((name) => ({
    name,
    exists: tableNames.has(name)
  }));
  const requiredIndexStatus = requiredIndexes.map((name) => ({
    name,
    exists: indexNames.has(name)
  }));
  const missingTables = requiredTableStatus.filter((table) => !table.exists);
  const missingIndexes = requiredIndexStatus.filter((index) => !index.exists);
  const foreignKeys = db.pragma("foreign_keys", { simple: true }) as number;
  const journalMode = db.pragma("journal_mode", { simple: true }) as string;
  const synchronous = db.pragma("synchronous", { simple: true }) as number;

  return {
    status:
      missingTables.length === 0 &&
      missingIndexes.length === 0 &&
      appliedMigrations.at(-1)?.version === latestMigrationVersion
        ? "ok"
        : "degraded",
    database: {
      file: env.databasePath,
      journalMode,
      foreignKeys: foreignKeys === 1,
      synchronous,
      synchronousLabel: synchronous === 1 ? "NORMAL" : String(synchronous)
    },
    migrations: {
      latestVersion: latestMigrationVersion,
      applied: appliedMigrations
    },
    tables: {
      required: requiredTableStatus,
      all: tableRows.map((row) => row.name)
    },
    indexes: {
      required: requiredIndexStatus,
      all: indexRows
    }
  } as const;
}
