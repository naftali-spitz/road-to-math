# Road to Math

Road to Math is a family-focused arcade mastery game for math fluency. The goal is to turn repeated math moves into instinct through Practice, Rush, mastery tracking, XP, and Road progression.

The current build is the Phase 0 foundation for **Road to Arithmetic**.

## Current Phase 0 Slice

```text
Road to Arithmetic
4 Worlds
18 Levels
Practice Mode
Rush Mode
Player profile
Session tracking
Attempt logging
Basic mastery calculation
Level unlocks
Starter XP rewards
Arithmetic Roadblock mixed-recall level
```

The content model now follows **spiral mastery**:

```text
Counting Step, Number Compare, Number Line, Patterns, and Missing Number are reusable instincts.
They appear again at harder difficulty bands instead of existing as one-time starter levels.
```

## Phase 0 Arithmetic Map

```text
World 1 — Whole Number Instinct
1. Count Forward / Backward
2. Whole Number Line
3. Compare Whole Numbers
4. Whole Number Patterns

World 2 — Add / Subtract Instinct
5. Quick Add
6. Make Ten
7. Quick Subtract
8. Add / Subtract Mixed

World 3 — Group / Split Instinct
9. Multiplication Groups
10. Division Finder
11. Operation Patterns
12. Missing Number Basics

World 4 — Pre-Algebra Gate
13. Order Sense
14. Negative Number Line
15. Compare Negative Numbers
16. Negative Steps
17. Missing Number Mixed
18. Arithmetic Roadblock
```

After the Arithmetic Roadblock, the next planned content direction is **Phase 1: Fractions / Decimals / Ratios**, reusing the same instincts at a harder domain. Road to Algebra remains the larger next major road after those foundations are strong.

## Stack

- React + TypeScript + Vite frontend in `client`
- Node + Express backend in `server`
- SQLite database file in `server/data`
- Shared TypeScript contracts, content, question generation, validation, and answer checking in `shared`
- npm workspaces

## First Run

Install dependencies:

```bash
npm install
```

Create local environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Run frontend and backend together:

```bash
npm run dev
```

Open the app:

```text
http://localhost:5173
```

The backend health endpoint is available at:

```text
http://localhost:4100/api/health
```

The backend database debug endpoint is available at:

```text
http://localhost:4100/api/debug/database
```

It reports SQLite PRAGMAs, applied migrations, required table checks, and required index checks.

## API Surface

Local player endpoints:

```text
GET  /api/players
POST /api/players
GET  /api/players/:playerId
GET  /api/players/:playerId/progress
POST /api/players/:playerId/sessions
POST /api/players/:playerId/attempts/practice
POST /api/players/:playerId/practice-sessions/complete
POST /api/players/:playerId/rush-sessions
POST /api/players/:playerId/rush-sessions/:rushSessionId/attempts
POST /api/players/:playerId/rush-sessions/:rushSessionId/complete
POST /api/players/:playerId/rush-sessions/:rushSessionId/abandon
```

XP is awarded by the backend and logged in `player_xp_events`. `players.xp_total` is updated from those events. Level unlocks are based on mastery, not XP.

Mastery updates are stored in `level_progress`:

- Understanding comes from Practice accuracy.
- Recognition comes from Practice accuracy across available question formats.
- Fluency comes from completed Rushes that meet the level benchmark speed.
- Abandoned Rushes keep submitted attempts but do not count as completed Rushes or Express Pass attempts.

## Build

```bash
npm run build
```

## Start Backend From Build

```bash
npm run start
```

## Useful Scripts

```bash
npm run dev:client
npm run dev:server
npm run preview
npm test
npm run validate:content
```

`npm test` runs the first-build test suite: content validation, question generation, answer checking, Practice format introduction/mixing, backend attempt logging, Practice saving, Rush completion/abandon behavior, XP awarding, level unlocks, and Express Pass.

`npm run validate:content` builds the shared package and validates the Road to Arithmetic config.

## Database

The SQLite file is created automatically when the backend starts:

```text
server/data/road-to-math.sqlite
```

Backend startup applies SQLite runtime settings and runs pending migrations:

```text
PRAGMA journal_mode = WAL
PRAGMA foreign_keys = ON
PRAGMA synchronous = NORMAL
```

SQLite is acceptable for the current family/local-server target. The DB access layer should stay isolated so PostgreSQL can be introduced later if traffic/concurrency grows.

## Environment

Backend defaults live in `server/.env.example`:

```bash
PORT=4100
DATABASE_PATH=./data/road-to-math.sqlite
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

Frontend defaults live in `client/.env.example`:

```bash
VITE_API_BASE_URL=/api
VITE_BACKEND_PORT=4100
```

## Local Deployment Notes: Debian + Nginx + Node

These notes are for a local Debian home server deployment. This project is not deployed automatically.

Build on the server:

```bash
npm install
npm run build
```

Create production environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Example `server/.env`:

```bash
PORT=4100
DATABASE_PATH=./data/road-to-math.sqlite
CORS_ORIGIN=http://math.local
NODE_ENV=production
```

Copy the frontend build to an Nginx-served directory:

```bash
sudo mkdir -p /var/www/road-to-math
sudo rsync -a --delete client/dist/ /var/www/road-to-math/
```

If `rsync` is not installed:

```bash
sudo rm -rf /var/www/road-to-math/*
sudo cp -a client/dist/. /var/www/road-to-math/
```

Example Nginx site:

```nginx
server {
  listen 80;
  server_name math.local;

  root /var/www/road-to-math;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:4100/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    try_files $uri /index.html;
  }
}
```

Example systemd service for the backend:

```ini
[Unit]
Description=Road to Math API
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/road-to-math
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=5
User=roadmath
Group=roadmath

[Install]
WantedBy=multi-user.target
```

Enable after copying the project to `/opt/road-to-math` and creating the `roadmath` user:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now road-to-math
sudo nginx -t
sudo systemctl reload nginx
```

Operational checks:

```bash
curl http://127.0.0.1:4100/api/health
curl http://math.local/api/health
journalctl -u road-to-math -f
```

## Deploy Check After Content Updates

Because level IDs changed from the earlier 9-level prototype, test new content with a fresh player after pulling this update.

Recommended check:

```bash
git pull
rm -f client/tsconfig.tsbuildinfo shared/tsconfig.tsbuildinfo
npm install
npm run build
npm run test --workspace shared
npm run validate:content
```

Then verify:

```text
Create/select player
Open Road to Arithmetic
Confirm 4 worlds / 18 levels appear
Start Practice
Finish Practice
Start Rush
Finish Rush
Confirm progress and unlocks save
```
