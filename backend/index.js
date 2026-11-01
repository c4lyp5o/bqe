// BQE v2 — server entry
// Bun + Elysia. SQLite + socket.io. 4 FE routes. No accounts.

import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { existsSync } from "node:fs";
import { join, normalize } from "node:path";
import { createServer } from "node:http";
import { Server } from "socket.io";

import { initDb } from "./db/schema.js";
import { getFacilityByCode, facilitySnapshot } from "./db/db.js";
import { setIo } from "./realtime/io.js";
import { HealthRoute } from "./routes/health.route.js";
import { FacilityRoute } from "./routes/facility.route.js";

import { config } from "./config.js";

initDb(config.DB_PATH);

// ─── Realtime (socket.io) ────────────────────────────────────────
const httpServer = createServer();
const io = new Server(httpServer, {
	cors: { origin: config.CLIENT_ORIGIN, credentials: true },
});
setIo(io);

io.on("connection", (socket) => {
	socket.on("join:facility", ({ code }) => {
		const fac = getFacilityByCode(code);
		if (!fac) return socket.emit("error", "Facility not found");
		socket.join(`fac:${fac.id}`);
		socket.data.facilityId = fac.id;
		socket.emit("state", facilitySnapshot(fac.id));
	});

	socket.on("ping", () => socket.emit("pong", { t: Date.now() }));
});

httpServer.listen(config.WS_PORT, config.HOST, () => {
	console.log(`[WS] socket.io on ${config.HOST}:${config.WS_PORT}`);
});

// ─── REST (Elysia) ───────────────────────────────────────────────
const hasClient = existsSync(join(config.CLIENT_DIR, "index.html"));

const app = new Elysia()
	.use(cors({ origin: config.CLIENT_ORIGIN, credentials: true }))
	.use(HealthRoute)
	.use(FacilityRoute)
	.get("/*", async ({ request, set }) => {
		// Built frontend: serve real files, fall back to index.html for client routes
		const { pathname } = new URL(request.url);
		if (!hasClient || pathname.startsWith("/api/")) {
			set.status = 404;
			return { ok: false, message: "Not found" };
		}
		const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
		const file = Bun.file(join(config.CLIENT_DIR, rel));
		if (!rel.includes("..") && (await file.exists()) && !rel.endsWith("/")) return file;
		return Bun.file(join(config.CLIENT_DIR, "index.html"));
	})
	.onError(({ code, error, set }) => {
		if (code === "VALIDATION") {
			set.status = 400;
			return { ok: false, message: "Validation error" };
		}
		if (code === "NOT_FOUND") {
			set.status = 404;
			return { ok: false, message: "Not found" };
		}
		console.error(`[ERR] ${code}`, error?.message || error);
		set.status = 500;
		return { ok: false, message: "Internal error" };
	})
	.listen({ port: config.PORT, hostname: config.HOST });

console.log(`BQE on ${config.HOST}:${config.PORT}. Mode: (${config.NODE_ENV})`);

const shutdown = () => {
	io.close();
	process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
