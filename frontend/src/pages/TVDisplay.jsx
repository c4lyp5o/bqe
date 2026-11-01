// BQE v2 — FE3: TV Display
// Facility name + display text, current queue (MASSIVE), last 3 called,
// rotating QR code that customers scan to join.

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, QrCode, Ticket, Users } from "lucide-react";
import { api } from "../lib/api";
import { useSocket } from "../lib/socket";
import { QRCodeSVG } from "qrcode.react";

const QR_INTERVAL = 30000; // rotate nonce every 30s

export default function TVDisplay() {
	const { code } = useParams();
	const { state } = useSocket(code);
	const [qrUrl, setQrUrl] = useState("");
	const [updating, setUpdating] = useState(false);

	const fetchQr = async (nonce) => {
		setUpdating(true);
		try {
			const url = `${import.meta.env.VITE_APP_URL || window.location.origin}/join?code=${code}&nonce=${nonce}`;
			setQrUrl(url);
		} finally {
			setUpdating(false);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: later
	useEffect(() => {
		if (!code) return;
		const getNonce = async () => {
			const res = await api.qrNonce(code);
			await fetchQr(res.nonce);
		};
		getNonce();
		const iv = setInterval(getNonce, QR_INTERVAL);
		return () => clearInterval(iv);
	}, [code]);

	if (!state) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-ink-muted animate-pulse text-lg">
					Loading TV display…
				</p>
			</div>
		);
	}

	// which ticket is serving now
	const serving = state.tickets.find((t) => t.status === "called");

	return (
		<div className="min-h-screen flex flex-col px-8 py-8 md:px-12 md:py-10">
			{/* Top bar — facility name + display text */}
			<header className="flex items-start justify-between gap-6">
				<div className="flex items-center gap-4">
					<div className="size-11 rounded-xl bg-accent-tint border border-accent/25 flex items-center justify-center shrink-0">
						<Ticket className="size-6 text-accent-bright" />
					</div>
					<div>
						<h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
							{state.name}
						</h1>
						{state.displayText && (
							<p className="text-ink-muted text-lg mt-1">{state.displayText}</p>
						)}
					</div>
				</div>
				<span className="chip bg-raised border border-hair text-ink-faint font-mono tracking-[0.2em]">
					{code}
				</span>
			</header>

			{/* Main — now serving + QR */}
			<main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-12 py-10">
				{/* Now serving — MASSIVE */}
				<div className="text-center lg:text-left">
					<p className="text-sm uppercase tracking-[0.3em] text-ink-muted mb-4">
						Now Serving
					</p>
					<p
						key={serving?.label || "none"}
						style={{ animation: serving ? "rise 0.3s ease-out" : undefined }}
						className="text-[7rem] md:text-[11rem] xl:text-[15rem] font-extrabold leading-none tracking-tight font-mono text-accent-bright"
					>
						{serving ? (
							serving.label
						) : (
							<span className="text-ink-faint">—</span>
						)}
					</p>
					<div className="mt-8 flex gap-4 text-sm justify-center lg:justify-start">
						<span className="chip bg-raised border border-hair text-ink-2 px-3 py-1.5">
							<Users className="size-4 text-ink-muted" />
							{state.waitingCount} waiting
						</span>
						<span className="chip bg-raised border border-hair text-ink-2 px-3 py-1.5">
							<CheckCircle2 className="size-4 text-accent" />
							{state.servedCount} served
						</span>
					</div>
				</div>

				{/* QR */}
				<div className="text-center">
					<div className="relative inline-block bg-white rounded-2xl p-5">
						{qrUrl ? (
							<QRCodeSVG
								value={qrUrl}
								size={220}
								level="H"
								fgColor="#0a0f0d"
								bgColor="#ffffff"
							/>
						) : (
							<div className="size-[220px] flex items-center justify-center text-zinc-400">
								<QrCode className="size-10" />
							</div>
						)}
						{updating && (
							<div className="absolute inset-0 bg-white/60 rounded-2xl animate-pulse" />
						)}
					</div>
					<p className="text-sm text-ink-muted mt-4">Scan to join the queue</p>
					<p className="text-xs text-ink-faint font-mono mt-1">
						nonce refreshes · 30s
					</p>
				</div>
			</main>

			{/* Recently called */}
			<footer className="flex items-center justify-center gap-4 pt-6 border-t border-hair">
				<span className="text-xs uppercase tracking-[0.25em] text-ink-faint mr-2">
					Recently called
				</span>
				{state.lastCalled.length === 0 && (
					<span className="text-ink-faint text-lg">—</span>
				)}
				{state.lastCalled.map((t) => (
					<div
						key={t.label}
						className={`rounded-xl px-5 py-2.5 text-2xl font-mono font-semibold border ${
							t.status === "arrived"
								? "border-accent/40 bg-accent-tint text-accent-bright"
								: "border-warn/40 bg-warn-tint text-warn"
						}`}
					>
						{t.label}
					</div>
				))}
			</footer>
		</div>
	);
}
