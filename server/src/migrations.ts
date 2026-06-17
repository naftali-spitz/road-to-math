import type Database from "better-sqlite3";

export type AppliedMigration = {
  version: number;
  name: string;
  appliedAt: string;
};

type Migration = {
  version: number;
  name: string;
  up: string;
};

const migrations: Migration[] = [
  {
    version: 1,
    name: "create_first_build_data_spine",
    up: `
      CREATE TABLE players (
        id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        avatar_icon TEXT,
        avatar_color TEXT,
        birth_year INTEGER,
        xp_total INTEGER NOT NULL DEFAULT 0 CHECK (xp_total >= 0),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE play_sessions (
        id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_activity_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ended_at TEXT,
        inactivity_boundary_minutes INTEGER NOT NULL DEFAULT 30,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
      );

      CREATE TABLE rush_sessions (
        id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        road_id TEXT NOT NULL,
        world_id TEXT NOT NULL,
        level_id TEXT NOT NULL,
        instinct_id TEXT NOT NULL,
        started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ended_at TEXT,
        duration_seconds INTEGER NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
        abandoned_at TEXT,
        abandonment_reason TEXT,
        total_questions INTEGER NOT NULL DEFAULT 0 CHECK (total_questions >= 0),
        correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
        incorrect_count INTEGER NOT NULL DEFAULT 0 CHECK (incorrect_count >= 0),
        average_answer_time_ms INTEGER CHECK (average_answer_time_ms IS NULL OR average_answer_time_ms >= 0),
        best_streak INTEGER NOT NULL DEFAULT 0 CHECK (best_streak >= 0),
        score INTEGER NOT NULL DEFAULT 0,
        xp_awarded INTEGER NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES play_sessions(id) ON DELETE CASCADE,
        CHECK (
          (completed = 1 AND abandoned_at IS NULL)
          OR (completed = 0)
        )
      );

      CREATE TABLE question_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id TEXT NOT NULL,
        session_id TEXT,
        rush_session_id TEXT,
        road_id TEXT NOT NULL,
        world_id TEXT NOT NULL,
        level_id TEXT NOT NULL,
        instinct_id TEXT NOT NULL,
        question_template_id TEXT,
        question_type TEXT NOT NULL CHECK (question_type IN (
          'solve',
          'evaluate',
          'identify',
          'multipleChoice',
          'trueFalse',
          'fillBlank',
          'wordProblem',
          'graphQuestion'
        )),
        mode TEXT NOT NULL CHECK (mode IN (
          'practice',
          'rush',
          'learn',
          'review',
          'popQuiz',
          'roadblock'
        )),
        is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
        answer_value TEXT,
        expected_answer TEXT,
        answer_time_ms INTEGER CHECK (answer_time_ms IS NULL OR answer_time_ms >= 0),
        question_payload_json TEXT,
        is_review_injected INTEGER NOT NULL DEFAULT 0 CHECK (is_review_injected IN (0, 1)),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES play_sessions(id) ON DELETE SET NULL,
        FOREIGN KEY (rush_session_id) REFERENCES rush_sessions(id) ON DELETE SET NULL
      );

      CREATE TABLE level_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id TEXT NOT NULL,
        road_id TEXT NOT NULL,
        world_id TEXT NOT NULL,
        level_id TEXT NOT NULL,
        instinct_id TEXT NOT NULL,
        mastery_state TEXT NOT NULL DEFAULT 'unlocked' CHECK (mastery_state IN (
          'locked',
          'unlocked',
          'practicing',
          'rushReady',
          'mastered',
          'goldMastered',
          'needsRefresh'
        )),
        understanding_percent INTEGER NOT NULL DEFAULT 0 CHECK (understanding_percent BETWEEN 0 AND 100),
        recognition_percent INTEGER NOT NULL DEFAULT 0 CHECK (recognition_percent BETWEEN 0 AND 100),
        fluency_percent INTEGER NOT NULL DEFAULT 0 CHECK (fluency_percent BETWEEN 0 AND 100),
        mastery_percent INTEGER NOT NULL DEFAULT 0 CHECK (mastery_percent BETWEEN 0 AND 100),
        attempts_count INTEGER NOT NULL DEFAULT 0 CHECK (attempts_count >= 0),
        practice_attempts_count INTEGER NOT NULL DEFAULT 0 CHECK (practice_attempts_count >= 0),
        rush_attempts_count INTEGER NOT NULL DEFAULT 0 CHECK (rush_attempts_count >= 0),
        correct_attempts_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_attempts_count >= 0),
        last_played_at TEXT,
        unlocked_at TEXT,
        mastered_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
        UNIQUE (player_id, road_id, world_id, level_id)
      );

      CREATE TABLE player_xp_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id TEXT NOT NULL,
        session_id TEXT,
        road_id TEXT,
        world_id TEXT,
        level_id TEXT,
        event_type TEXT NOT NULL,
        xp_amount INTEGER NOT NULL,
        reason TEXT,
        metadata_json TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES play_sessions(id) ON DELETE SET NULL
      );

      CREATE INDEX idx_sessions_player_activity
      ON play_sessions (player_id, last_activity_at DESC);

      CREATE INDEX idx_rush_sessions_player_level_started
      ON rush_sessions (player_id, level_id, started_at DESC);

      CREATE INDEX idx_attempts_player_level_created
      ON question_attempts (player_id, level_id, created_at DESC);

      CREATE INDEX idx_attempts_player_instinct_created
      ON question_attempts (player_id, instinct_id, created_at DESC);

      CREATE INDEX idx_attempts_player_mode_created
      ON question_attempts (player_id, mode, created_at DESC);

      CREATE INDEX idx_level_progress_player_state
      ON level_progress (player_id, mastery_state);

      CREATE INDEX idx_xp_events_player_created
      ON player_xp_events (player_id, created_at DESC);
    `
  }
];

export const latestMigrationVersion = migrations.at(-1)?.version ?? 0;

export function ensureMigrationTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function runMigrations(db: Database.Database) {
  ensureMigrationTable(db);

  const appliedVersions = new Set(
    db
      .prepare("SELECT version FROM schema_migrations")
      .all()
      .map((row) => (row as { version: number }).version)
  );

  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) {
      continue;
    }

    const applyMigration = db.transaction(() => {
      db.exec(migration.up);
      db.prepare("INSERT INTO schema_migrations (version, name) VALUES (?, ?)").run(
        migration.version,
        migration.name
      );
    });

    applyMigration();
  }
}

export function getAppliedMigrations(db: Database.Database): AppliedMigration[] {
  ensureMigrationTable(db);

  return db
    .prepare(
      `
        SELECT
          version,
          name,
          applied_at AS appliedAt
        FROM schema_migrations
        ORDER BY version ASC
      `
    )
    .all() as AppliedMigration[];
}
