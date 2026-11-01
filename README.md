# Best QMS Ever (BQE)

A lightweight, account-free queue management app. A facility gets an **admin code** and a **TV code**;
visitors join by scanning a rotating QR code on the TV display, and staff call, re-call and mark tickets
as arrived in real time.

- **Backend:** [Bun](https://bun.sh) + [Elysia](https://elysiajs.com), SQLite, socket.io
- **Frontend:** React 19, Vite, Tailwind CSS 4
- **Version:** 2.0.0 — see [CHANGELOG](CHANGELOG.md) · **License:** [MIT](LICENSE.md)

## Quick start (development)

```bash
bun run install        # installs backend + frontend deps
cp backend/.env.example backend/.env   # then adjust (use PORT=3000, WS_PORT=3001, CLIENT_ORIGIN=http://localhost:5173)
bun run dev            # backend :3000, socket.io :3001, frontend :5173
```

Tests: `bun run test:backend` · Lint: `cd frontend && bun run lint`

## Configuration

Backend (`backend/.env`):

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `3000` | HTTP: REST API + built frontend |
| `WS_PORT` | `3001` | socket.io (separate port — must be reachable by browsers) |
| `HOST` | `0.0.0.0` | |
| `DB_PATH` | `bqe.db` | SQLite file; persist it in production |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS / socket.io origin. **Set to your public URL in production** |
| `CLIENT_DIR` | `../frontend/dist` | Built frontend served by the backend |

Frontend (build-time, optional): `VITE_WS_URL` (default `<current host>:3001`) and
`VITE_APP_URL` (default `window.location.origin`, used in the join QR).

## Docker

```bash
docker build -t bqe \
  --build-arg VITE_WS_URL=https://ws.example.com \
  --build-arg VITE_APP_URL=https://bqe.example.com .

docker run -d --name bqe \
  -p 5000:5000 -p 5001:5001 \
  -v bqe-data:/data \
  -e CLIENT_ORIGIN=https://bqe.example.com \
  bqe
```

- `5000` serves the API and the web app; `5001` is socket.io. Behind a reverse proxy, route both
  (and set `VITE_WS_URL` accordingly).
- SQLite lives at `/data/bqe.db` — **mount a volume** or data is lost on redeploy.
- Health check: `GET /api/v1`.

## CI/CD

- `.github/workflows/ci.yml` — on push/PR to `master` and `development`: backend tests, frontend lint and build.
- `.github/workflows/docker.yml` — on push to `master` and `v*` tags: builds and pushes
  `ghcr.io/<owner>/bqe` (optional repo variables `VITE_WS_URL`, `VITE_APP_URL`).

## Branching and releases

- `master` — stable, released code. `development` — integration branch; open PRs against it.
- Release: bump `version` in `package.json`, update `CHANGELOG.md`, merge `development` → `master`,
  then tag `vX.Y.Z`.

## Security notes

Access is by unguessable admin/TV codes (no accounts). Put the app behind HTTPS and a reverse proxy with
rate limiting; the app itself does not rate limit requests.
