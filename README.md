# Road to Math

Fresh technical foundation for Road to Math.

## Stack

- React + TypeScript + Vite frontend in `client`
- Node + Express backend in `server`
- SQLite database file in `server/data`
- Shared TypeScript contracts in `shared`
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

The screen should show connected statuses for:

- Frontend
- Backend
- Database

The backend health endpoint is available at:

```text
http://localhost:4100/api/health
```

The backend database debug endpoint is available at:

```text
http://localhost:4100/api/debug/database
```

It reports the SQLite PRAGMAs, applied migrations, required table checks, and required index checks.

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

XP is awarded by the backend and logged in `player_xp_events`. `players.xp_total` is updated from those events; level unlocks are not based on XP.

Mastery updates are stored in `level_progress`. Understanding comes from Practice accuracy, Recognition comes from Practice accuracy across the level's available question formats, and Fluency comes from completed Rushes that meet the level benchmark speed. Abandoned Rushes keep their submitted attempts but do not count as completed Rushes or Express Pass attempts.

The first playable slice shows all 3 Arithmetic Worlds and all 9 Arithmetic Levels. After Level 9, the app shows a basic Road to Algebra gate placeholder; Algebra content is deferred.

## Build

```bash
npm run build
```

## Start Backend From Build

```bash
npm run start
```

## Local Deployment Notes: Debian + Nginx + Node

These notes are for a local Debian home server deployment. They are not required for development, and this project is not deployed automatically.

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

## Useful Scripts

```bash
npm run dev:client
npm run dev:server
npm run preview
npm test
npm run validate:content
```

`npm test` runs the full first-build test suite: content validation coverage, question generation, answer checking, Practice format introduction/mixing, backend attempt logging, Practice saving, Rush completion/abandon behavior, XP awarding, level unlocks, and Express Pass.

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
