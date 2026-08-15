// BQE v2 — FE3: TV Display
// Facility name + display text, current queue (MASSIVE), last 3 called,
// rotating QR code that customers scan to join.

import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useSocket } from "../lib/socket";
import { QRCodeSVG } from "qrcode.react";

const QR_INTERVAL = 30000; // rotate nonce every 30s

export default function TVDisplay() {
	const { code } = useParams();
	const { state, socket } = useSocket(code);
	const [qrUrl, setQrUrl] = useState("");
	const [qrNonce, setQrNonce] = useState("");
	const [expiresAt, setExpiresAt] = useState(null);
	const [updating, setUpdating] = useState(false);

	const fetchQr = async (nonce) => {
		setUpdating(true);
		try {
			// customer join page via QR — new nonce means new token
			const url = `${import.meta.env.VITE_APP_URL || "http://localhost:5173"}/join?code=${code}&nonce=${nonce}`;
			setQrUrl(url);
		} finally {
			setUpdating(false);
		}
	};

	useEffect(() => {
		if (!code) return;
		const getNonce = async () => {
			const res = await api.qrNonce(code);
			setQrNonce(res.nonce);
			setExpiresAt(res.expiresAt);
			await fetchQr(res.nonce);
		};
		getNonce();
		const iv = setInterval(getNonce, QR_INTERVAL);
		return () => clearInterval(iv);
	}, [code]);

	if (!state) {
		return (
			<div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
				<p className="text-zinc-500 animate-pulse">Loading TV display...</p>
			</div>
		);
	}

	// which ticket is serving now
	const serving = state.tickets.find((t) => t.status === "called");

	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-100 p-10 flex flex-col">
			{/* Top bar — facility name + display text */}
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-4xl font-bold text-white">{state.name}</h1>
					{state.displayText && <p className="text-zinc-400 text-xl mt-2">{state.displayText}</p>}
				</div>
				<p className="text-zinc-500 font-mono text-sm">Code: {code}</p>
			</div>

			{/* Main: current queue + QR */}
			<div className="flex-1 flex items-center justify-center gap-16">
				{/* Now serving — MASSIVE */}
				<div className="text-center flex-1">
					<h2 className="text-3xl text-zinc-400 uppercase tracking-widest mb-4">Now Serving</h2>
					<p className="text-[16rem] font-bold leading-none text-emerald-400">
						{serving ? serving.label : "—"}
					</p>
					<p className="text-zinc-500 text-lg mt-6">Waiting: {state.waitingCount}</p>
				</div>

				{/* QR + last 3 called */}
				<div className="text-center">
					<div className="bg-white rounded-2xl p-6 inline-block">
						{qrUrl && (
							<QRCodeSVG value={qrUrl} size={260} level="H" fgColor="#000" bgColor="#fff" />
						)}
						{updating && (
							<div className="absolute inset-0 bg-white/50 rounded-2xl animate-pulse" />
						)}
					</div>
					<p className="text-zinc-500 text-sm mt-4">Scan to join the queue</p>
					{expiresAt && (
						<p className="text-zinc-600 text-xs mt-1">Refreshes every 30s</p>
					)}

					{/* Last 3 called */}
					<div className="mt-10">
						<h3 className="text-zinc-500 text-sm uppercase tracking-wide mb-3">Recently Called</h3>
						<div className="flex gap-3 justify-center">
							{state.lastCalled.length === 0 && (
								<p className="text-zinc-700">—</p>
							)}
							{state.lastCalled.map((t) => (
								<div
									key={t.label}
									className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3 text-2xl font-mono font-semibold"
								>
									{t.label}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}