// BQE v2 — FE4: Customer Page (mobile)
// Shows customer's ticket number, waiting position, last 3 called.

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
			<div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
				<p className="text-zinc-500 animate-pulse">Loading your ticket...</p>
			</div>
		);
	}

	if (!info || info.error) {
		return (
			<div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
				<div className="text-center">
					<p className="text-red-400 text-xl">Ticket not found</p>
					<p className="text-zinc-500 mt-2">{info?.error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col items-center justify-center">
			{/* Facility name */}
			<h2 className="text-zinc-500 text-sm uppercase tracking-widest">{info.facility?.name}</h2>
			{info.facility?.displayText && (
				<p className="text-zinc-600 text-sm mt-1">{info.facility?.displayText}</p>
			)}

			{/* Your ticket number — HUGE */}
			<div className="my-10 text-center">
				<p className="text-zinc-500 text-base uppercase tracking-wide mb-2">Your Number</p>
				<p className="text-8xl font-bold text-emerald-400">{info.label}</p>
				<p className="text-zinc-500 text-sm mt-4">
					{info.waitingAhead > 0
						? `${info.waitingAhead} ahead of you`
						: "You're up next!"}
				</p>
			</div>

			{/* Last 3 called */}
			<div className="text-center">
				<h3 className="text-zinc-500 text-sm uppercase tracking-wide mb-4">Recently Called</h3>
				<div className="flex gap-4 justify-center">
					{info.lastCalled.length === 0 && <p className="text-zinc-700">—</p>}
					{info.lastCalled.map((t) => (
						<div
							key={t.label}
							className={`rounded-xl px-5 py-3 text-2xl font-mono font-semibold border ${
								t.status === "arrived"
									? "border-emerald-500 bg-emerald-500/10"
									: "border-yellow-500 bg-yellow-500/10"
							}`}
						>
							{t.label}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}