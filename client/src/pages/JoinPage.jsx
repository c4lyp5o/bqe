// BQE v2 — Join page (phone input, scanned from QR)
// Customer scans QR on TV, lands here, enters phone, gets ticket.

import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function JoinPage() {
	const [params] = useSearchParams();
	const code = params.get("code");
	const nonce = params.get("nonce");
	const nav = useNavigate();
	const [phone, setPhone] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleJoin = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const data = await api.join(code, { phone: phone.trim() || undefined, nonce });
			nav(`/ticket/${data.ticket.id}`);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	if (!code) {
		return (
			<div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
				<p className="text-red-400">Invalid QR code. Missing facility code.</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col items-center justify-center">
			<h2 className="text-2xl font-bold text-white mb-2">Join the Queue</h2>
			<p className="text-zinc-500 text-sm mb-8">Enter your phone number to receive your ticket</p>
			<form onSubmit={handleJoin} className="w-full max-w-sm space-y-4">
				<input
					type="tel"
					placeholder="+60 12 345 6789"
					value={phone}
					onChange={(e) => setPhone(e.target.value)}
					className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 text-center text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
					disabled={loading}
				/>
				<button
					type="submit"
					disabled={loading}
					className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white font-semibold py-3 rounded-xl text-lg transition-colors"
				>
					{loading ? "Getting your ticket..." : "Get Ticket"}
				</button>
				<p className="text-xs text-zinc-600 text-center">
					Phone is optional. Your number is hashed and never shared.
				</p>
			</form>
			{error && (
				<p className="mt-4 text-red-400 text-sm">{error}</p>
			)}
		</div>
	);
}