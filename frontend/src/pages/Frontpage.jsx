// BQE v2 — FE1: Frontpage (2-column)
// Left: create facility by name → admin dashboard
// Right: enter code → routes to admin or TV based on which code matches

import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
			console.error(err);
			setError("Facility not found. Check your code.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl w-full">
				{/* Left: Create */}
				<form
					onSubmit={handleCreate}
					className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6"
				>
					<h2 className="text-2xl font-bold text-emerald-400">Start a Queue</h2>
					<p className="text-zinc-400 text-sm">
						Create a new facility and get your admin + TV codes.
					</p>
					<input
						type="text"
						placeholder="Facility name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
						disabled={loading}
					/>
					<button
						type="submit"
						disabled={loading || !name.trim()}
						className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold py-3 rounded-lg transition-colors"
					>
						{loading ? "Creating..." : "Create Facility"}
					</button>
				</form>

				{/* Right: Login */}
				<form
					onSubmit={handleLogin}
					className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6"
				>
					<h2 className="text-2xl font-bold text-purple-400">Join a Queue</h2>
					<p className="text-zinc-400 text-sm">
						Enter your admin or TV code to access the dashboard or display.
					</p>
					<input
						type="text"
						placeholder="Enter 5-character code"
						value={code}
						onChange={(e) => setCode(e.target.value.toUpperCase())}
						maxLength={5}
						className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 font-mono text-lg tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
						disabled={loading}
					/>
					<button
						type="submit"
						disabled={loading || code.trim().length < 5}
						className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold py-3 rounded-lg transition-colors"
					>
						{loading ? "Connecting..." : "Enter"}
					</button>
				</form>
			</div>

			{error && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-700 text-red-200 px-6 py-3 rounded-lg text-sm">
					{error}
				</div>
			)}
		</div>
	);
}
