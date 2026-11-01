// BQE v2 — socket.io hook (real-time updates)
// Connects to the WS server (separate port). In dev, Vite proxies nothing
// for socket.io, so point directly at the WS port from env.
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// Resolution order: VITE_WS_URL (build-time) -> dev default on :3001 ->
// same host on :3001 in production (the WS_PORT must be published).
const WS_URL =
	import.meta.env.VITE_WS_URL ||
	`${window.location.protocol}//${window.location.hostname}:3001`;

export function useSocket(code) {
	const [state, setState] = useState(null);
	const socketRef = useRef(null);

	useEffect(() => {
		if (!code) return;
		const socket = io(WS_URL, { transports: ["websocket", "polling"] });
		socketRef.current = socket;

		socket.on("connect", () => {
			socket.emit("join:facility", { code });
		});
		socket.on("state", setState);
		socket.on("error", (msg) => console.error("WS error:", msg));

		return () => socket.close();
	}, [code]);

	return { state, socket: socketRef.current };
}
