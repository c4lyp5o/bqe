// BQE v2 — API client
const BASE = "/api/v1";

async function req(path, opts = {}) {
	const res = await fetch(BASE + path, {
		headers: { "content-type": "application/json", ...(opts.headers || {}) },
		...opts,
		body: opts.body ? JSON.stringify(opts.body) : undefined,
	});
	const data = await res.json().catch(() => ({}));
	// Backend returns 200 with { ok: false } for domain errors — surface them
	if (data && data.ok === false) throw new Error(data.message || "Request failed");
	if (!res.ok) throw new Error(data.message || "Request failed");
	return data;
}

export const api = {
	health: () => req(""),
	createFacility: (name) =>
		req("/facility", { method: "POST", body: { name } }),
	getFacility: (code) => req(`/facility/${code}`),
	updateFacility: (code, patch) =>
		req(`/facility/${code}`, { method: "PATCH", body: patch }),
	join: (code, { phone, nonce }) =>
		req(`/facility/${code}/join`, { method: "POST", body: { phone, nonce } }),
	call: (code, ticketId) =>
		req(`/facility/${code}/call/${ticketId}`, { method: "POST" }),
	recall: (code, ticketId) =>
		req(`/facility/${code}/recall/${ticketId}`, { method: "POST" }),
	arrived: (code, ticketId) =>
		req(`/facility/${code}/arrived/${ticketId}`, { method: "POST" }),
	qrNonce: (code) => req(`/facility/${code}/qr-nonce`),
	ticket: (id) => req(`/ticket/${id}`),
};
