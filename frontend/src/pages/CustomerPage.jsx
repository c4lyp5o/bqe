// BQE v2 — FE4: Customer Page (mobile)
// Shows customer's ticket number, waiting position, last 3 called.

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Users } from "lucide-react";
import { api } from "../lib/api";

export default function CustomerPage() {
	const { id } = useParams();
	const [info, setInfo] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			try {
				const data = await api.ticket(id);
				setInfo(data);
			} catch (err) {
				setInfo({ error: err.message });
			} finally {
				setLoading(false);
			}
		};
		load();
		const iv = setInterval(load, 5000); // poll every 5s
		return () => clearInterval(iv);
	}, [id]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-ink-muted animate-pulse text-sm">
					Loading your ticket…
				</p>
			</div>
		);
	}

	if (!info || info.error) {
		return (
			<div className="min-h-screen flex items-center justify-center px-6">
				<div className="card p-8 max-w-sm w-full text-center space-y-3">
					<p className="text-xl font-bold text-ink">Ticket not found</p>
					<p className="text-sm text-ink-muted">{info?.error}</p>
					<a href="/" className="btn-ghost mt-2 text-sm">
						← Back to start
					</a>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
			{/* Facility */}
			<div className="text-center mb-8">
				<p className="text-xs uppercase tracking-[0.2em] text-ink-faint">
					{info.facility?.name}
				</p>
				{info.facility?.displayText && (
					<p className="text-sm text-ink-muted mt-1">
						{info.facility?.displayText}
					</p>
				)}
			</div>

			{/* Ticket */}
			<div className="w-full max-w-sm card p-8 text-center">
				<p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
					Your number
				</p>
				<p
					key={info.label}
					style={{ animation: "rise 0.35s ease-out" }}
					className="mt-3 text-7xl font-extrabold tracking-tight font-mono text-accent-bright"
				>
					{info.label}
				</p>
				<div className="mt-6 flex justify-center">
					{info.waitingAhead > 0 ? (
						<span className="chip bg-raised border border-hair text-ink-2 px-3 py-1.5 text-sm">
							<Users className="size-4 text-ink-muted" />
							{info.waitingAhead} ahead of you
						</span>
					) : (
						<span className="chip bg-accent-tint border border-accent/30 text-accent-bright px-3 py-1.5 text-sm font-semibold">
							<CheckCircle2 className="size-4" />
							You&apos;re up next
						</span>
					)}
				</div>
			</div>

			{/* Recently called */}
			<div className="mt-8 text-center">
				<p className="text-xs uppercase tracking-[0.2em] text-ink-faint mb-3">
					Recently called
				</p>
				{info.lastCalled.length === 0 ? (
					<p className="text-ink-faint text-sm">—</p>
				) : (
					<div className="flex gap-3 justify-center">
						{info.lastCalled.map((t) => (
							<div
								key={t.label}
								className={`rounded-xl px-4 py-2.5 font-mono text-xl font-semibold border ${
									t.status === "arrived"
										? "border-accent/40 bg-accent-tint text-accent-bright"
										: "border-warn/40 bg-warn-tint text-warn"
								}`}
							>
								{t.label}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
