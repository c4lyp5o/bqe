// BQE v2 — FE1: Frontpage (hero landing)
// Left: create facility by name → admin dashboard
// Right: enter code → routes to admin or TV based on which code matches

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	ArrowRight,
	KeyRound,
	ListPlus,
	MonitorSmartphone,
	ShieldCheck,
	Ticket,
	Zap,
} from "lucide-react";
import { api } from "../lib/api";

export default function Frontpage() {
	const nav = useNavigate();
	const [name, setName] = useState("");
	const [code, setCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleCreate = async (e) => {
		e.preventDefault();
		if (!name.trim()) return;
		setLoading(true);
		setError("");
		try {
			const fac = await api.createFacility(name.trim());
			nav(`/admin/${fac.adminCode}`);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleLogin = async (e) => {
		e.preventDefault();
		if (!code.trim()) return;
		setLoading(true);
		setError("");
		try {
			const fac = await api.getFacility(code.trim().toUpperCase());
			const isAdmin = code.trim().toUpperCase() === fac.adminCode;
			nav(isAdmin ? `/admin/${fac.adminCode}` : `/tv/${fac.tvCode}`);
		} catch (err) {
			setError("Facility not found. Check your code.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col items-center px-6 py-16 md:py-24">
			{/* Brand */}
			<div className="flex items-center gap-2.5 mb-12">
				<div className="size-9 rounded-[10px] bg-accent-tint border border-accent/30 flex items-center justify-center">
					<Ticket className="size-4.5 text-accent-bright" strokeWidth={2.5} />
				</div>
				<span className="font-mono font-bold text-lg tracking-tight">bqe</span>
				<span className="text-ink-faint text-sm mt-0.5">/ queue management</span>
			</div>

			{/* Hero */}
			<div className="text-center max-w-xl mb-12">
				<h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
					Start a queue in{" "}
					<span className="text-accent-bright">seconds</span>.
				</h1>
				<p className="mt-4 text-ink-muted text-lg leading-relaxed">
					No accounts, no installs. One code per queue — staff dashboard,
					waiting display, and customer tickets, live.
				</p>
			</div>

			{/* Two paths */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl">
				{/* Start a queue — featured */}
				<form
					onSubmit={handleCreate}
					className="card p-7 space-y-5 border-accent/25 bg-accent-tint/40"
				>
					<div className="flex items-center gap-3">
						<div className="size-10 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
							<ListPlus className="size-5 text-accent-bright" />
						</div>
						<div>
							<h2 className="font-semibold text-lg leading-tight">
								Start a queue
							</h2>
							<p className="text-sm text-ink-muted">
								Create a facility, get your admin + TV codes
							</p>
						</div>
					</div>
					<input
						type="text"
						placeholder="Facility name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="input"
						disabled={loading}
					/>
					<button
						type="submit"
						disabled={loading || !name.trim()}
						className="btn-primary w-full"
					>
						{loading ? "Creating…" : "Create facility"}
						<ArrowRight className="size-4" />
					</button>
				</form>

				{/* Join with a code */}
				<form onSubmit={handleLogin} className="card p-7 space-y-5">
					<div className="flex items-center gap-3">
						<div className="size-10 rounded-xl bg-raised border border-hair flex items-center justify-center shrink-0">
							<KeyRound className="size-5 text-ink-2" />
						</div>
						<div>
							<h2 className="font-semibold text-lg leading-tight">
								Join with a code
							</h2>
							<p className="text-sm text-ink-muted">
								Admin code → dashboard · TV code → display
							</p>
						</div>
					</div>
					<input
						type="text"
						placeholder="CODE"
						value={code}
						onChange={(e) => setCode(e.target.value.toUpperCase())}
						maxLength={5}
						className="input-mono"
						disabled={loading}
					/>
					<button
						type="submit"
						disabled={loading || code.trim().length < 5}
						className="btn-secondary w-full"
					>
						{loading ? "Connecting…" : "Enter"}
						<ArrowRight className="size-4" />
					</button>
				</form>
			</div>

			{/* Micro features */}
			<div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-12 text-sm text-ink-faint">
				<span className="inline-flex items-center gap-1.5">
					<Zap className="size-3.5 text-accent" /> No accounts
				</span>
				<span className="inline-flex items-center gap-1.5">
					<MonitorSmartphone className="size-3.5 text-accent" /> Live on every
					screen
				</span>
				<span className="inline-flex items-center gap-1.5">
					<ShieldCheck className="size-3.5 text-accent" /> Phone numbers hashed
				</span>
			</div>

			{error && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#241116] border border-danger/30 text-danger px-5 py-3 rounded-xl text-sm shadow-lg z-50">
					{error}
				</div>
			)}
		</div>
	);
}
