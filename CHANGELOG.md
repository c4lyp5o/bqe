# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/).

## [2.0.0] - 2026-11-02

### Added
- Backend split into routes / services / models with a realtime socket.io holder.
- Dark emerald frontend design system; improved API error handling.
- Backend service unit tests and an end-to-end test.
- Backend now serves the built frontend (with SPA fallback) from `CLIENT_DIR`.
- GitHub Actions: CI (tests, lint, build) and Docker image publish to GHCR.
- `CHANGELOG.md`, rewritten `README.md`, MIT license.

### Changed
- Dockerfile: lockfile-based installs, `VITE_WS_URL` / `VITE_APP_URL` build args,
  `/data` volume for SQLite, non-root user, healthcheck, exposes HTTP (5000) and WS (5001).
- Frontend WebSocket URL and TV join-QR URL default to the current host instead of `localhost`.
- Branch model: `master` (releases) and `development`.

## [1.0.0]
- Initial release.
