// BQE v2 — facility service (business logic)
// Routes stay thin: they map HTTP → service. Services own validation,
// mutation, and the realtime broadcast after every state change.

import {
	createFacility as dbCreateFacility,
	getFacilityByCode,
	updateFacility as dbUpdateFacility,
	issueTicket,
	callTicket,
	recallTicket,
	markArrived,
	facilitySnapshot,
	ticketInfo,
	generateQrNonce,
	consumeQrNonce,
} from "../db/db.js";
import { broadcastFacility } from "../realtime/io.js";

export const FacilityService = {
	// GET /api/v1/facility/:code
	getByCode({ params }) {
		const fac = getFacilityByCode(params.code);
		if (!fac) return { ok: false, message: "Facility not found" };
		return { ok: true, ...facilitySnapshot(fac.id) };
	},

	// POST /api/v1/facility
	create({ body }) {
		if (!body?.name || !String(body.name).trim())
			return { ok: false, message: "Facility name required" };
		const fac = dbCreateFacility(
			String(body.name).trim(),
			String(body.displayText || "").trim(),
		);
		broadcastFacility(fac.id, facilitySnapshot(fac.id));
		return { ok: true, ...fac };
	},

	// PATCH /api/v1/facility/:code
	update({ params, body }) {
		const fac = getFacilityByCode(params.code);
		if (!fac) return { ok: false, message: "Facility not found" };
		if (params.code !== fac.admin_code)
			return { ok: false, message: "Only admin code can edit" };
		dbUpdateFacility(fac.id, {
			name: body?.name,
			displayText: body?.displayText,
		});
		const snap = facilitySnapshot(fac.id);
		broadcastFacility(fac.id, snap);
		return { ok: true, ...snap };
	},

	// POST /api/v1/facility/:code/join
	async join({ params, body }) {
		const fac = getFacilityByCode(params.code);
		if (!fac) return { ok: false, message: "Facility not found" };

		// Verify QR nonce (if provided)
		if (body?.nonce) {
			const consumed = consumeQrNonce(body.nonce);
			if (!consumed || consumed.facilityId !== fac.id)
				return { ok: false, message: "Invalid or expired QR" };
		}

		// Hash phone (if provided)
		let phoneHash = null;
		if (body?.phone) {
			phoneHash = await Bun.password.hash(String(body.phone), {
				algorithm: "argon2id",
			});
		}

		const ticket = issueTicket(fac.id, phoneHash);
		broadcastFacility(fac.id, facilitySnapshot(fac.id));
		return { ok: true, ticket: { id: ticket.id, label: ticket.label } };
	},

	// POST /api/v1/facility/:code/call/:ticketId
	call({ params }) {
		const fac = getFacilityByCode(params.code);
		if (!fac || params.code !== fac.admin_code)
			return { ok: false, message: "Unauthorized" };
		const ok = callTicket(fac.id, Number(params.ticketId));
		if (ok) broadcastFacility(fac.id, facilitySnapshot(fac.id));
		return { ok, message: ok ? "Called" : "Ticket not found or not waiting" };
	},

	// POST /api/v1/facility/:code/recall/:ticketId
	recall({ params }) {
		const fac = getFacilityByCode(params.code);
		if (!fac || params.code !== fac.admin_code)
			return { ok: false, message: "Unauthorized" };
		const ok = recallTicket(fac.id, Number(params.ticketId));
		if (ok) broadcastFacility(fac.id, facilitySnapshot(fac.id));
		return { ok, message: ok ? "Recalled" : "Ticket not found" };
	},

	// POST /api/v1/facility/:code/arrived/:ticketId
	arrive({ params }) {
		const fac = getFacilityByCode(params.code);
		if (!fac || params.code !== fac.admin_code)
			return { ok: false, message: "Unauthorized" };
		const ok = markArrived(fac.id, Number(params.ticketId));
		if (ok) broadcastFacility(fac.id, facilitySnapshot(fac.id));
		return { ok, message: ok ? "Marked arrived" : "Ticket not found" };
	},

	// GET /api/v1/facility/:code/qr-nonce
	qrNonce({ params }) {
		const fac = getFacilityByCode(params.code);
		if (!fac) return { ok: false, message: "Facility not found" };
		const { nonce, expiresAt } = generateQrNonce(fac.id);
		return { ok: true, nonce, expiresAt };
	},

	// GET /api/v1/ticket/:id
	ticket({ params }) {
		const info = ticketInfo(Number(params.id));
		if (!info) return { ok: false, message: "Ticket not found" };
		return { ok: true, ...info };
	},
};
