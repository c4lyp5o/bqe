// BQE v2 — facility service unit tests
// Runs against an in-memory SQLite DB; realtime broadcast is a no-op
// because no io server is registered in test mode.
import { beforeAll, describe, expect, test } from "bun:test";
import { initDb } from "../db/schema.js";
import { FacilityService } from "../services/facility.service.js";

beforeAll(() => {
	initDb(":memory:");
});

describe("FacilityService", () => {
	test("create requires a name", () => {
		const res = FacilityService.create({ body: {} });
		expect(res.ok).toBe(false);
		expect(res.message).toContain("name");
	});

	test("create returns facility with admin + tv codes", () => {
		const res = FacilityService.create({ body: { name: "Clinic A" } });
		expect(res.ok).toBe(true);
		expect(res.adminCode).toHaveLength(5);
		expect(res.tvCode).toHaveLength(5);
		expect(res.name).toBe("Clinic A");
	});

	test("getByCode returns a live snapshot", () => {
		const fac = FacilityService.create({ body: { name: "Clinic B" } });
		const res = FacilityService.getByCode({
			params: { code: fac.adminCode },
		});
		expect(res.ok).toBe(true);
		expect(res.name).toBe("Clinic B");
		expect(res.waitingCount).toBe(0);
		expect(res.tickets).toEqual([]);
	});

	test("getByCode with unknown code errors", () => {
		const res = FacilityService.getByCode({ params: { code: "XXXXX" } });
		expect(res.ok).toBe(false);
		expect(res.message).toBe("Facility not found");
	});

	test("join issues a ticket with a valid label", async () => {
		const fac = FacilityService.create({ body: { name: "Clinic C" } });
		const res = await FacilityService.join({
			params: { code: fac.adminCode },
			body: { phone: "+60123456789" },
		});
		expect(res.ok).toBe(true);
		expect(res.ticket.label).toMatch(/^[A-Z]\d{3}$/);
	});

	test("join without a phone still works", async () => {
		const fac = FacilityService.create({ body: { name: "Clinic D" } });
		const res = await FacilityService.join({
			params: { code: fac.adminCode },
			body: {},
		});
		expect(res.ok).toBe(true);
	});

	test("ticket info reports waiting ahead", async () => {
		const fac = FacilityService.create({ body: { name: "Clinic E" } });
		const t1 = await FacilityService.join({
			params: { code: fac.adminCode },
			body: {},
		});
		const t2 = await FacilityService.join({
			params: { code: fac.adminCode },
			body: {},
		});
		const info = FacilityService.ticket({ params: { id: t2.ticket.id } });
		expect(info.ok).toBe(true);
		expect(info.waitingAhead).toBe(1);
		expect(info.facility.name).toBe("Clinic E");
	});

	test("call then arrived transitions the snapshot", async () => {
		const fac = FacilityService.create({ body: { name: "Clinic F" } });
		const t = await FacilityService.join({
			params: { code: fac.adminCode },
			body: {},
		});

		const called = FacilityService.call({
			params: { code: fac.adminCode, ticketId: t.ticket.id },
		});
		expect(called.ok).toBe(true);

		const serving = FacilityService.getByCode({
			params: { code: fac.adminCode },
		});
		expect(serving.nowServing.label).toBe(t.ticket.label);

		const arrived = FacilityService.arrive({
			params: { code: fac.adminCode, ticketId: t.ticket.id },
		});
		expect(arrived.ok).toBe(true);

		const done = FacilityService.getByCode({
			params: { code: fac.adminCode },
		});
		expect(done.servedCount).toBe(1);
		expect(done.nowServing).toBeNull();
	});

	test("recall re-calls an already-called ticket", async () => {
		const fac = FacilityService.create({ body: { name: "Clinic R" } });
		const t = await FacilityService.join({
			params: { code: fac.adminCode },
			body: {},
		});
		FacilityService.call({
			params: { code: fac.adminCode, ticketId: t.ticket.id },
		});
		const res = FacilityService.recall({
			params: { code: fac.adminCode, ticketId: t.ticket.id },
		});
		expect(res.ok).toBe(true);
	});

	test("mutations require the admin code", async () => {
		const fac = FacilityService.create({ body: { name: "Clinic G" } });
		const t = await FacilityService.join({
			params: { code: fac.adminCode },
			body: {},
		});

		const call = FacilityService.call({
			params: { code: fac.tvCode, ticketId: t.ticket.id },
		});
		expect(call.ok).toBe(false);
		expect(call.message).toBe("Unauthorized");

		const update = FacilityService.update({
			params: { code: fac.tvCode },
			body: { name: "Hacked" },
		});
		expect(update.ok).toBe(false);
	});

	test("update only via admin code and reflects immediately", () => {
		const fac = FacilityService.create({ body: { name: "Clinic J" } });
		const ok = FacilityService.update({
			params: { code: fac.adminCode },
			body: { name: "Clinic J2", displayText: "Renovated" },
		});
		expect(ok.ok).toBe(true);
		expect(ok.name).toBe("Clinic J2");
		expect(ok.displayText).toBe("Renovated");
	});

	test("qr nonce is issued and consumed by a join", async () => {
		const fac = FacilityService.create({ body: { name: "Clinic H" } });
		const { nonce } = FacilityService.qrNonce({
			params: { code: fac.tvCode },
		});
		expect(nonce).toHaveLength(8);

		const res = await FacilityService.join({
			params: { code: fac.tvCode },
			body: { nonce },
		});
		expect(res.ok).toBe(true);
	});

	test("join with an invalid nonce is rejected", async () => {
		const fac = FacilityService.create({ body: { name: "Clinic I" } });
		const res = await FacilityService.join({
			params: { code: fac.tvCode },
			body: { nonce: "BOGUS123" },
		});
		expect(res.ok).toBe(false);
		expect(res.message).toContain("QR");
	});

	test("ticket info for unknown id errors", () => {
		const res = FacilityService.ticket({ params: { id: 999999 } });
		expect(res.ok).toBe(false);
		expect(res.message).toBe("Ticket not found");
	});
});
