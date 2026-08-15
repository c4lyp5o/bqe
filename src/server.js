// BQE v2 — server entry
// Bun + Elysia. SQLite + socket.io. 4 FE routes. No accounts.

import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { initDb, getDb } from "./db/schema.js";
import { createServer } from "node:http";
import { Server } from "socket.io";
import {
	createFacility,
	getFacilityByCode,
	updateFacility,
	issueTicket,
	callTicket,
	recallTicket,
	markArrived,
	facilitySnapshot,
	ticketInfo,
	generateQrNonce,
	consumeQrNonce,
} from "./db/db.js";
import { config } from "./config.js";

// Init DB
initDb(config.DB_PATH);
const db = getDb();

// Socket.io server (separate port)
const httpServer = createServer();
const io = new Server(httpServer, {
	cors: { origin: config.CLIENT_ORIGIN, credentials: true },
});

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

// Elysia REST API
const app = new Elysia()
	.use(cors({ origin: config.CLIENT_ORIGIN, credentials: true }))
	.get("/api/v1/health", () => ({ status: "ok", uptime: process.uptime() }))
	.get("/api/v1/facility/:code", ({ params: { code } }) => {
		const fac = getFacilityByCode(code);
		if (!fac) return { ok: false, message: "Facility not found" };
		const snap = facilitySnapshot(fac.id);
		return { ok: true, ...snap };
	})
	.post("/api/v1/facility", ({ body: { name, displayText } }) => {
		if (!name || !String(name).trim()) return { ok: false, message: "Facility name required" };
		const fac = createFacility(String(name).trim(), String(displayText || "").trim());
		io.to(`fac:${fac.id}`).emit("state", facilitySnapshot(fac.id));
		return { ok: true, ...fac };
	})
	.patch("/api/v1/facility/:code", ({ params: { code }, body: { name, displayText } }) => {
		const fac = getFacilityByCode(code);
		if (!fac) return { ok: false, message: "Facility not found" };
		// Only admin code can edit
		if (code !== fac.admin_code) return { ok: false, message: "Only admin code can edit" };
		const updated = updateFacility(fac.id, { name, displayText });
		io.to(`fac:${fac.id}`).emit("state", facilitySnapshot(fac.id));
		return { ok: true, ...updated };
	})
	.post("/api/v1/facility/:code/join", async ({ params: { code }, body: { phone, nonce } }) => {
		const fac = getFacilityByCode(code);
		if (!fac) return { ok: false, message: "Facility not found" };
		// Verify QR nonce (if provided)
		if (nonce) {
			const consumed = consumeQrNonce(nonce);
			if (!consumed || consumed.facilityId !== fac.id) return { ok: false, message: "Invalid or expired QR" };
		}
		// Hash phone (if provided)
		let phoneHash = null;
		if (phone) {
			phoneHash = await Bun.password.hash(String(phone), { algorithm: "argon2id" });
		}
		const ticket = issueTicket(fac.id, phoneHash);
		io.to(`fac:${fac.id}`).emit("state", facilitySnapshot(fac.id));
		return { ok: true, ticket: { id: ticket.id, label: ticket.label } };
	})
	.post("/api/v1/facility/:code/call/:ticketId", ({ params: { code, ticketId } }) => {
		const fac = getFacilityByCode(code);
		if (!fac || code !== fac.admin_code) return { ok: false, message: "Unauthorized" };
		const ok = callTicket(fac.id, Number(ticketId));
		io.to(`fac:${fac.id}`).emit("state", facilitySnapshot(fac.id));
		return { ok, message: ok ? "Called" : "Ticket not found or not waiting" };
	})
	.post("/api/v1/facility/:code/recall/:ticketId", ({ params: { code, ticketId } }) => {
		const fac = getFacilityByCode(code);
		if (!fac || code !== fac.admin_code) return { ok: false, message: "Unauthorized" };
		const ok = recallTicket(fac.id, Number(ticketId));
		io.to(`fac:${fac.id}`).emit("state", facilitySnapshot(fac.id));
		return { ok, message: ok ? "Recalled" : "Ticket not found" };
	})
	.post("/api/v1/facility/:code/arrived/:ticketId", ({ params: { code, ticketId } }) => {
		const fac = getFacilityByCode(code);
		if (!fac || code !== fac.admin_code) return { ok: false, message: "Unauthorized" };
		const ok = markArrived(fac.id, Number(ticketId));
		io.to(`fac:${fac.id}`).emit("state", facilitySnapshot(fac.id));
		return { ok, message: ok ? "Marked arrived" : "Ticket not found" };
	})
	.get("/api/v1/facility/:code/qr-nonce", ({ params: { code } }) => {
		const fac = getFacilityByCode(code);
		if (!fac) return { ok: false, message: "Facility not found" };
		const { nonce, expiresAt } = generateQrNonce(fac.id);
		return { ok: true, nonce, expiresAt };
	})
	.get("/api/v1/ticket/:id", ({ params: { id } }) => {
		const info = ticketInfo(Number(id));
		if (!info) return { ok: false, message: "Ticket not found" };
		return { ok: true, ...info };
	})
	.onError(({ code, error, set }) => {
		if (code === "VALIDATION") { set.status = 400; return { ok: false, message: "Validation error" }; }
		if (code === "NOT_FOUND") { set.status = 404; return { ok: false, message: "Not found" }; }
		console.error(`[ERR] ${code}`, error?.message || error);
		set.status = 500;
		return { ok: false, message: "Internal error" };
	});

app.listen({ port: config.PORT, hostname: config.HOST });
console.log(`🦊 BQE v2 on ${config.HOST}:${config.PORT} (${config.NODE_ENV})`);

// Graceful shutdown
const shutdown = () => { io.close(); process.exit(0); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);