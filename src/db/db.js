// BQE v2 — DB operations (facilities + tickets + QR nonces)
import { randomInt } from "node:crypto";
import { getDb } from "./schema.js";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function genCode(len = 5) {
	let out = "";
	for (let i = 0; i < len; i++) out += ALPHABET[randomInt(ALPHABET.length)];
	return out;
}

// ─── Facilities ────────────────────────────────────────────────

export function createFacility(name, displayText = "") {
	const db = getDb();
	for (let attempt = 0; attempt < 8; attempt++) {
		const adminCode = genCode(5);
		const tvCode = genCode(5);
		try {
			const info = db
				.query("INSERT INTO facilities (admin_code, tv_code, name, display_text, created_at) VALUES (?,?,?,?,?)")
				.run(adminCode, tvCode, name, displayText, Date.now());
			return { id: info.lastInsertRowid, adminCode, tvCode, name, displayText };
		} catch (e) {
			if (String(e).includes("UNIQUE")) continue;
			throw e;
		}
	}
	throw new Error("Could not allocate unique codes");
}

export function getFacilityByCode(code) {
	const db = getDb();
	const upper = String(code).toUpperCase().trim();
	// check both admin_code and tv_code
	return (
		db.query("SELECT * FROM facilities WHERE admin_code = ?").get(upper) ||
		db.query("SELECT * FROM facilities WHERE tv_code = ?").get(upper)
	);
}

export function getFacilityById(id) {
	return getDb().query("SELECT * FROM facilities WHERE id = ?").get(id);
}

export function updateFacility(id, { name, displayText }) {
	const db = getDb();
	if (name !== undefined) db.query("UPDATE facilities SET name = ? WHERE id = ?").run(name, id);
	if (displayText !== undefined) db.query("UPDATE facilities SET display_text = ? WHERE id = ?").run(displayText, id);
	return getFacilityById(id);
}

// ─── Tickets ───────────────────────────────────────────────────

export function getNextTicketNumber(facilityId) {
	const row = getDb()
		.query("SELECT COALESCE(MAX(number), 0) + 1 AS next FROM tickets WHERE facility_id = ?")
		.get(facilityId);
	return row.next;
}

export function getFacilityLetter(facilityId) {
	// letter resets daily: A for first ticket of the day, B for next day, etc.
	// Simple approach: letter = floor(ticketsToday / 1000) + 65
	// For now, use a fixed letter per facility based on id
	const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
	return letters[Number(facilityId) % 24];
}

export function issueTicket(facilityId, phoneHash = null) {
	const db = getDb();
	const number = getNextTicketNumber(facilityId);
	const letter = getFacilityLetter(facilityId);
	const label = `${letter}${String(number).padStart(3, "0")}`;
	const info = db
		.query("INSERT INTO tickets (facility_id, number, label, phone_hash, status, created_at) VALUES (?,?,?,?,'waiting',?)")
		.run(facilityId, number, label, phoneHash, Date.now());
	return { id: info.lastInsertRowid, number, label, phoneHash };
}

export function callTicket(facilityId, ticketId) {
	const db = getDb();
	// cancel any currently serving
	db.query("UPDATE tickets SET status = 'no_show' WHERE facility_id = ? AND status = 'called'").run(facilityId);
	// call this one
	const info = db
		.query("UPDATE tickets SET status = 'called', called_at = ? WHERE id = ? AND facility_id = ? AND status = 'waiting'")
		.run(Date.now(), ticketId, facilityId);
	return info.changes > 0;
}

export function recallTicket(facilityId, ticketId) {
	const db = getDb();
	// same as call but for already-called tickets
	const info = db
		.query("UPDATE tickets SET called_at = ? WHERE id = ? AND facility_id = ? AND status IN ('called','no_show')")
		.run(Date.now(), ticketId, facilityId);
	return info.changes > 0;
}

export function markArrived(facilityId, ticketId) {
	const db = getDb();
	const info = db
		.query("UPDATE tickets SET status = 'arrived', arrived_at = ? WHERE id = ? AND facility_id = ? AND status IN ('called','no_show')")
		.run(Date.now(), ticketId, facilityId);
	return info.changes > 0;
}

// ─── Snapshots ─────────────────────────────────────────────────

export function facilitySnapshot(facilityId) {
	const db = getDb();
	const fac = getFacilityById(facilityId);
	if (!fac) return null;

	const tickets = db
		.query("SELECT id, number, label, status, called_at, arrived_at, created_at FROM tickets WHERE facility_id = ? ORDER BY number ASC")
		.all(facilityId);

	const waiting = tickets.filter((t) => t.status === "waiting");
	const called = tickets.filter((t) => t.status === "called" || t.status === "no_show");
	const arrived = tickets.filter((t) => t.status === "arrived");
	const nowServing = called.find((t) => t.status === "called");
	const lastCalled = tickets
		.filter((t) => t.status === "called" || t.status === "arrived" || t.status === "no_show")
		.sort((a, b) => (b.called_at || 0) - (a.called_at || 0))
		.slice(0, 3);

	return {
		id: fac.id,
		name: fac.name,
		displayText: fac.display_text,
		adminCode: fac.admin_code,
		tvCode: fac.tv_code,
		nowServing: nowServing ? { id: nowServing.id, label: nowServing.label } : null,
		lastCalled: lastCalled.map((t) => ({ label: t.label, status: t.status })),
		waitingCount: waiting.length,
		servedCount: arrived.length,
		tickets: tickets.map((t) => ({
			id: t.id,
			label: t.label,
			status: t.status,
			calledAt: t.called_at,
			arrivedAt: t.arrived_at,
		})),
	};
}

export function ticketInfo(ticketId) {
	const db = getDb();
	const ticket = db.query("SELECT * FROM tickets WHERE id = ?").get(ticketId);
	if (!ticket) return null;
	const fac = getFacilityById(ticket.facility_id);
	const recent = db
		.query("SELECT label, status FROM tickets WHERE facility_id = ? AND status IN ('called','arrived','no_show') AND called_at IS NOT NULL ORDER BY called_at DESC LIMIT 3")
		.all(ticket.facility_id);
	return {
		label: ticket.label,
		number: ticket.number,
		status: ticket.status,
		waitingAhead: db
			.query("SELECT COUNT(*) AS cnt FROM tickets WHERE facility_id = ? AND status = 'waiting' AND number < ?")
			.get(ticket.facility_id, ticket.number)?.cnt || 0,
		facility: { name: fac.name, displayText: fac.display_text },
		lastCalled: recent.map((r) => ({ label: r.label, status: r.status })),
	};
}

// ─── QR Nonces ─────────────────────────────────────────────────

export function generateQrNonce(facilityId) {
	const db = getDb();
	// expire old nonces
	db.query("DELETE FROM qr_nonces WHERE expires_at < ?").run(Date.now());
	const nonce = genCode(8);
	const expiresAt = Date.now() + 30000; // 30 seconds
	db.query("INSERT INTO qr_nonces (facility_id, nonce, expires_at) VALUES (?,?,?)").run(facilityId, nonce, expiresAt);
	return { nonce, expiresAt };
}

export function consumeQrNonce(nonce) {
	const db = getDb();
	const row = db.query("SELECT * FROM qr_nonces WHERE nonce = ? AND expires_at > ?").get(nonce, Date.now());
	if (!row) return null;
	db.query("DELETE FROM qr_nonces WHERE id = ?").run(row.id);
	return { facilityId: row.facility_id };
}

export { genCode };