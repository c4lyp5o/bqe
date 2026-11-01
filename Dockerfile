# ============================
# Stage 1: Client Builder
# ============================
FROM oven/bun:1.3.14-alpine AS builder
WORKDIR /app

# Public URLs are baked into the bundle at build time (both optional).
ARG VITE_WS_URL=""
ARG VITE_APP_URL=""
ENV VITE_WS_URL=$VITE_WS_URL VITE_APP_URL=$VITE_APP_URL

COPY frontend/package.json frontend/bun.lock ./frontend/
RUN cd frontend && bun install --frozen-lockfile

COPY frontend ./frontend
RUN cd frontend && bun run build

# ============================
# Stage 2: Production
# ============================
FROM oven/bun:1.3.14-alpine
WORKDIR /app

RUN apk add --no-cache tzdata curl
ENV TZ=Asia/Kuala_Lumpur

COPY backend/package.json backend/bun.lock ./backend/
RUN cd backend && bun install --production --frozen-lockfile

COPY backend ./backend
COPY --from=builder /app/frontend/dist ./frontend/dist

# SQLite lives on a volume so data survives redeploys.
ENV NODE_ENV=production DB_PATH=/data/bqe.db PORT=5000 WS_PORT=5001
RUN mkdir -p /data && chown -R bun:bun /data /app
VOLUME /data
USER bun

# 5000 = HTTP (API + static client), 5001 = socket.io
EXPOSE 5000 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -fs http://localhost:5000/api/v1 || exit 1

# Process supervision is Docker's job (--restart unless-stopped); PM2 is not needed here.
CMD ["bun", "backend/index.js"]
