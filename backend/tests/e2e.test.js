// BQE v2 — end-to-end test
// Spawns the real server against a temp DB and exercises the full flow
// over HTTP + socket.io: health, facility lifecycle, ticket lifecycle,
// authorization, QR gating, and realtime state pushes.
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { io as Client } from "socket.io-client";

const PORT = 3999;
const WS_PORT = 3998;
const BASE = `http://localhost:${PORT}/api/v1`;
const WS_URL = `http://localhost:${WS_PORT}`;
const DB = `/tmp/bqe-e2e-${process.pid}.db`;

let proc;
let socket;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, timeout = 5000) {
	const start = Date.now();
	while (Date.now() - start < timeout) {
		try {
			if (await fn()) return true;
		} catch {}
		await wait(100);
	}
	throw new Error("timed out waiting for server");
}

const post = (path, body) =>
	fetch(`${BASE}${path}`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: body ? JSON.stringify(body) : undefined,
	}).then((r) => r.json());

const get = (path) => fetch(`${BASE}${path}`).then((r) => r.json());

async function makeFacility(name) {
	const fac = await post("/facility", { name });
	expect(fac.ok).toBe(true);
	return fac;
}

beforeAll(async () => {
	proc = Bun.spawn(["bun", "index.js"], {
		cwd: `${import.meta.dir}/..`,
		env: {
			...process.env,
			PORT: String(PORT),
			WS_PORT: String(WS_PORT),
			DB_PATH: DB,
			NODE_ENV: "test",
		},
		stdout: "pipe",
		stderr: "pipe",
	});
	await waitFor(() => fetch(BASE).then((r) => r.ok));
});

afterAll(() => {
	if (socket) socket.close();
	proc?.kill();
});

describe("BQE e2e", () => {
	test("health check responds", async () => {
		const res = await get("");
		expect(res.success).toBe(true);
		expect(res.message).toBe("BQE API is running");
	});

	test("create and lookup a facility", async () => {
		const fac = await post("/facility", {
			name: "E2E Clinic",
			displayText: "Testing",
		});
		expect(fac.ok).toBe(true);
		expect(fac.adminCode).toHaveLength(5);
		expect(fac.tvCode).toHaveLength(5);

		const got = await get(`/facility/${fac.adminCode}`);
		expect(got.ok).toBe(true);
		expect(got.name).toBe("E2E Clinic");
		expect(got.displayText).toBe("Testing");
	});

	test("unknown facility errors", async () => {
		const res = await get("/facility/XXXXX");
		expect(res.ok).toBe(false);
		expect(res.message).toBe("Facility not found");
	});

	test("full ticket lifecycle: join → call → recall → arrived", async () => {
		const fac = await makeFacility("Lifecycle Clinic");

		const t1 = await post(`/facility/${fac.adminCode}/join`, {});
		const t2 = await post(`/facility/${fac.adminCode}/join`, {});
		expect(t1.ok).toBe(true);
		expect(t1.ticket.label).toMatch(/^[A-Z]\d{3}$/);
		expect(t2.ticket.label).not.toBe(t1.ticket.label);

		// waiting ahead counts correctly
		const info = await get(`/ticket/${t2.ticket.id}`);
		expect(info.ok).toBe(true);
		expect(info.waitingAhead).toBe(1);

		// call → now serving
		const called = await post(`/facility/${fac.adminCode}/call/${t1.ticket.id}`);
		expect(called.ok).toBe(true);
		const snap = await get(`/facility/${fac.adminCode}`);
		expect(snap.nowServing.label).toBe(t1.ticket.label);
		expect(snap.waitingCount).toBe(1);

		// recall keeps it serving
		const recalled = await post(`/facility/${fac.adminCode}/recall/${t1.ticket.id}`);
		expect(recalled.ok).toBe(true);

		// arrived → served
		const arrived = await post(`/facility/${fac.adminCode}/arrived/${t1.ticket.id}`);
		expect(arrived.ok).toBe(true);
		const after = await get(`/facility/${fac.adminCode}`);
		expect(after.servedCount).toBe(1);
		expect(after.nowServing).toBeNull();
	});

	test("tv code cannot run admin mutations", async () => {
		const fac = await makeFacility("Auth Clinic");
		const t = await post(`/facility/${fac.adminCode}/join`, {});
		expect(t.ok).toBe(true);

		const res = await post(`/facility/${fac.tvCode}/call/${t.ticket.id}`);
		expect(res.ok).toBe(false);
		expect(res.message).toBe("Unauthorized");
	});

	test("qr nonce gates joins", async () => {
		const fac = await makeFacility("QR Clinic");

		const { nonce } = await get(`/facility/${fac.tvCode}/qr-nonce`);
		expect(nonce).toHaveLength(8);

		// invalid nonce rejected
		const bad = await post(`/facility/${fac.tvCode}/join`, {
			nonce: "BOGUS123",
		});
		expect(bad.ok).toBe(false);
		expect(bad.message).toContain("QR");

		// valid nonce accepted, even via tv code
		const good = await post(`/facility/${fac.tvCode}/join`, { nonce });
		expect(good.ok).toBe(true);

		// nonce is single-use
		const reuse = await post(`/facility/${fac.tvCode}/join`, { nonce });
		expect(reuse.ok).toBe(false);
	});

	test("socket receives live state pushes", async () => {
		const fac = await makeFacility("Socket Clinic");

		socket = Client(WS_URL, {
			transports: ["websocket"],
			reconnection: false,
		});
		await new Promise((resolve, reject) => {
			socket.on("connect", resolve);
			socket.on("connect_error", reject);
		});

		// listen BEFORE joining so we never miss the initial push
		const initialPromise = new Promise((resolve) =>
			socket.once("state", resolve),
		);
		socket.emit("join:facility", { code: fac.adminCode });
		const initial = await initialPromise;
		expect(initial.name).toBe("Socket Clinic");
		expect(initial.waitingCount).toBe(0);

		// a join over REST should push an updated snapshot
		const pushPromise = new Promise((resolve) => socket.once("state", resolve));
		const t = await post(`/facility/${fac.adminCode}/join`, {});
		expect(t.ok).toBe(true);
		const updated = await pushPromise;
		expect(updated.waitingCount).toBe(1);
	});
});
