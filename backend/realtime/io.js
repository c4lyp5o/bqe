// BQE v2 — socket.io holder + broadcast helpers
// index.js creates the io server and registers it here, so routes/services
// can push live "state" updates to a facility's room without import cycles.

let io = null;

export function setIo(instance) {
	io = instance;
}

export function broadcastFacility(facilityId, snapshot) {
	if (!io) return;
	io.to(`fac:${facilityId}`).emit("state", snapshot);
}
