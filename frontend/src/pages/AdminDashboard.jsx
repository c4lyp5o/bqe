// BQE v2 — FE2: Admin Dashboard
// Editable facility name + display text. Queue cards with call/recall/arrived.
// Shows both admin code and TV code.

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useSocket } from "../lib/socket";
import CloseAppModal from "../components/CloseAppModal";

const STATUS_COLORS = {
	waiting: "border-zinc-700 bg-zinc-800/50",
	called: "border-yellow-500 bg-yellow-500/10",
	no_show: "border-orange-500 bg-orange-500/10",
	arrived: "border-emerald-500 bg-emerald-500/10",
};

const STATUS_LABELS = {
	waiting: "Waiting",
	called: "Called",
	no_show: "No Show",
	arrived: "Arrived",
};

export default function AdminDashboard() {
	const { code } = useParams();
	const nav = useNavigate();
	const { state } = useSocket(code);
	const [facName, setFacName] = useState("");
	const [displayText, setDisplayText] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [showCloseModal, setShowCloseModal] = useState(false);

	useEffect(() => {
		if (state) {
			setFacName(state.name);
			setDisplayText(state.displayText || "");
		}
	}, [state]);

	// Native browser dialog is the only UI allowed during a real tab/window close.
	useEffect(() => {
		const handleBeforeUnload = (e) => {
			e.preventDefault();
			e.returnValue = "";
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () =>
			window.removeEventListener("beforeunload", handleBeforeUnload);
	}, []);

	const handleSave = async () => {
		setSaving(true);
		try {
			await api.updateFacility(code, { name: facName, displayText });
		} catch (err) {
			setError(err.message);
		} finally {
			setSaving(false);
		}
	};

	const action = useCallback(
		async (ticketId, actionType) => {
			try {
				await api[actionType](code, ticketId);
			} catch (err) {
				setError(err.message);
			}
		},
		[code],
	);

	if (!state) {
		return (
			<div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
				<p className="text-zinc-500 animate-pulse">Loading facility...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 max-w-4xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-3xl font-bold text-emerald-400">{state.name}</h1>
					<p className="text-zinc-500 text-sm mt-1">Admin Dashboard</p>
				</div>
				<div className="flex items-center gap-8 text-sm">
					<div className="text-center">
						<p className="text-zinc-500">Admin Code</p>
						<p className="font-mono text-lg text-purple-400 tracking-widest">
							{state.adminCode}
						</p>
					</div>
					<div className="text-center">
						<p className="text-zinc-500">TV Code</p>
						<p className="font-mono text-lg text-blue-400 tracking-widest">
							{state.tvCode}
						</p>
					</div>
					<button
						type="button"
						onClick={() => setShowCloseModal(true)}
						className="self-start rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:border-red-600 hover:text-red-400 transition-colors"
					>
						Close Session
					</button>
				</div>
			</div>

			{/* Editable fields */}
			<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						{/** biome-ignore lint/a11y/noLabelWithoutControl: later */}
						<label className="block text-zinc-400 text-sm mb-1">
							Facility Name
						</label>
						<input
							type="text"
							value={facName}
							onChange={(e) => setFacName(e.target.value)}
							className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
						/>
					</div>
					<div>
						{/** biome-ignore lint/a11y/noLabelWithoutControl: later */}
						<label className="block text-zinc-400 text-sm mb-1">
							Display Text (TV)
						</label>
						<input
							type="text"
							value={displayText}
							onChange={(e) => setDisplayText(e.target.value)}
							placeholder="Optional — shown on TV display"
							className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
						/>
					</div>
				</div>
				<button
					type="button"
					onClick={handleSave}
					disabled={saving}
					className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
				>
					{saving ? "Saving..." : "Save Changes"}
				</button>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-3 gap-4 mb-8">
				<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
					<p className="text-3xl font-bold text-zinc-100">
						{state.waitingCount}
					</p>
					<p className="text-zinc-500 text-sm">Waiting</p>
				</div>
				<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
					<p className="text-3xl font-bold text-yellow-400">
						{state.nowServing ? 1 : 0}
					</p>
					<p className="text-zinc-500 text-sm">Now Serving</p>
				</div>
				<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
					<p className="text-3xl font-bold text-emerald-400">
						{state.servedCount}
					</p>
					<p className="text-zinc-500 text-sm">Served</p>
				</div>
			</div>

			{/* Now Serving highlight */}
			{state.nowServing && (
				<div className="bg-yellow-500/10 border border-yellow-500 rounded-2xl p-6 mb-8 text-center">
					<p className="text-yellow-400 text-sm uppercase tracking-wide">
						Now Serving
					</p>
					<p className="text-5xl font-bold text-yellow-300 mt-2">
						{state.nowServing.label}
					</p>
				</div>
			)}

			{/* Queue cards */}
			<div className="space-y-3">
				<h2 className="text-lg font-semibold text-zinc-300 mb-4">Queue</h2>
				{state.tickets.length === 0 && (
					<p className="text-zinc-600 text-center py-8">
						No tickets yet. Share the TV code to get started.
					</p>
				)}
				{state.tickets.map((ticket) => (
					<div
						key={ticket.id}
						className={`border rounded-xl p-4 flex items-center justify-between transition-colors ${STATUS_COLORS[ticket.status] || "border-zinc-700 bg-zinc-800/50"}`}
					>
						<div>
							<p className="text-2xl font-bold font-mono">{ticket.label}</p>
							<p className="text-xs text-zinc-500 mt-1">
								{STATUS_LABELS[ticket.status] || ticket.status}
							</p>
							{ticket.calledAt && (
								<p className="text-xs text-zinc-600">
									Called: {new Date(ticket.calledAt).toLocaleTimeString()}
								</p>
							)}
							{ticket.arrivedAt && (
								<p className="text-xs text-zinc-600">
									Arrived: {new Date(ticket.arrivedAt).toLocaleTimeString()}
								</p>
							)}
						</div>
						<div className="flex gap-2">
							{ticket.status === "waiting" && (
								<button
									type="button"
									onClick={() => action(ticket.id, "call")}
									className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
								>
									Call
								</button>
							)}
							{(ticket.status === "called" || ticket.status === "no_show") && (
								<>
									<button
										type="button"
										onClick={() => action(ticket.id, "recall")}
										className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
									>
										Recall
									</button>
									<button
										type="button"
										onClick={() => action(ticket.id, "arrived")}
										className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
									>
										Arrived
									</button>
								</>
							)}
						</div>
					</div>
				))}
			</div>

			{error && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-700 text-red-200 px-6 py-3 rounded-lg text-sm">
					{error}
				</div>
			)}

			<CloseAppModal
				open={showCloseModal}
				adminCode={state.adminCode}
				onCancel={() => setShowCloseModal(false)}
				onConfirm={() => nav("/")}
			/>
		</div>
	);
}
