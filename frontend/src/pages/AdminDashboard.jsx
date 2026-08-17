// BQE v2 — FE2: Admin Dashboard
// Editable facility name + display text. Queue cards with call/recall/arrived.
// Shows both admin code and TV code.

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	BellRing,
	Check,
	LogOut,
	RotateCcw,
	Ticket,
} from "lucide-react";
import { api } from "../lib/api";
import { useSocket } from "../lib/socket";
import CloseAppModal from "../components/CloseAppModal";

const STATUS_LABELS = {
	waiting: "Waiting",
	called: "Called",
	no_show: "No Show",
	arrived: "Arrived",
};

const STATUS_CHIP = {
	waiting: "bg-raised border border-hair text-ink-muted",
	called: "bg-warn-tint border border-warn/30 text-warn",
	no_show: "bg-danger-tint border border-danger/30 text-danger",
	arrived: "bg-accent-tint border border-accent/30 text-accent-bright",
};

const STATUS_CARD = {
	waiting: "",
	called: "border-warn/25",
	no_show: "border-danger/25",
	arrived: "border-accent/25",
};

export default function AdminDashboard() {
	const { code } = useParams();
	const nav = useNavigate();
	const { state } = useSocket(code);
	const [facName, setFacName] = useState("");
	const [displayText, setDisplayText] = useState("");
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
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
			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
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
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-ink-muted animate-pulse text-sm">
					Loading facility…
				</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen px-4 md:px-8 py-6 max-w-5xl mx-auto">
			{/* Header */}
			<header className="flex items-center justify-between gap-4 mb-8">
				<div className="flex items-center gap-3">
					<button
						type="button"
						className="btn-ghost"
						onClick={() => nav("/")}
						title="Back to start"
					>
						<ArrowLeft className="size-4" />
					</button>
					<div>
						<h1 className="text-2xl font-bold tracking-tight">
							{state.name}
						</h1>
						<p className="text-sm text-ink-muted">Admin dashboard</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<div className="hidden sm:flex items-center gap-2">
						<span className="chip bg-raised border border-hair text-ink-faint">
							admin{" "}
							<span className="font-mono text-ink tracking-[0.15em]">
								{state.adminCode}
							</span>
						</span>
						<span className="chip bg-raised border border-hair text-ink-faint">
							tv{" "}
							<span className="font-mono text-ink tracking-[0.15em]">
								{state.tvCode}
							</span>
						</span>
					</div>
					<button
						type="button"
						className="btn-danger-soft"
						onClick={() => setShowCloseModal(true)}
					>
						<LogOut className="size-4" />
						Close session
					</button>
				</div>
			</header>

			{/* Editable fields */}
			<section className="card p-6 mb-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
					<div>
						<label className="block text-xs uppercase tracking-wider text-ink-muted mb-2">
							Facility name
						</label>
						<input
							type="text"
							value={facName}
							onChange={(e) => setFacName(e.target.value)}
							className="input"
						/>
					</div>
					<div>
						<label className="block text-xs uppercase tracking-wider text-ink-muted mb-2">
							Display text (TV)
						</label>
						<input
							type="text"
							value={displayText}
							onChange={(e) => setDisplayText(e.target.value)}
							placeholder="Optional — shown on TV display"
							className="input"
						/>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={handleSave}
						disabled={saving}
						className="btn-primary"
					>
						{saving ? "Saving…" : "Save changes"}
					</button>
					{saved && (
						<span className="text-sm text-accent-bright inline-flex items-center gap-1">
							<Check className="size-4" /> Saved
						</span>
					)}
				</div>
			</section>

			{/* Stats */}
			<section className="grid grid-cols-3 gap-4 mb-6">
				<div className="card p-5 text-center">
					<p className="text-3xl font-bold tabular-nums">
						{state.waitingCount}
					</p>
					<p className="text-xs uppercase tracking-wider text-ink-muted mt-1">
						Waiting
					</p>
				</div>
				<div
					className={`card p-5 text-center transition-colors ${
						state.nowServing ? "border-accent/40 bg-accent-tint/40" : ""
					}`}
				>
					<p className="text-3xl font-bold font-mono text-accent-bright">
						{state.nowServing ? state.nowServing.label : "—"}
					</p>
					<p className="text-xs uppercase tracking-wider text-ink-muted mt-1">
						Now serving
					</p>
				</div>
				<div className="card p-5 text-center">
					<p className="text-3xl font-bold tabular-nums">
						{state.servedCount}
					</p>
					<p className="text-xs uppercase tracking-wider text-ink-muted mt-1">
						Served
					</p>
				</div>
			</section>

			{/* Queue */}
			<section>
				<h2 className="text-sm font-semibold text-ink-2 mb-3">Queue</h2>
				{state.tickets.length === 0 ? (
					<div className="card p-10 text-center">
						<Ticket className="size-8 text-ink-faint mx-auto mb-3" />
						<p className="text-ink-muted text-sm">
							No tickets yet. Put the TV code on the display so customers
							can join.
						</p>
					</div>
				) : (
					<div className="space-y-2.5">
						{state.tickets.map((ticket) => (
							<div
								key={ticket.id}
								className={`card p-4 flex items-center justify-between gap-4 transition-colors ${
									STATUS_CARD[ticket.status] || ""
								}`}
							>
								<div className="flex items-center gap-4 min-w-0">
									<p className="text-2xl font-bold font-mono tracking-tight">
										{ticket.label}
									</p>
									<span
										className={`chip ${
											STATUS_CHIP[ticket.status] ||
											"bg-raised border border-hair text-ink-muted"
										}`}
									>
										{STATUS_LABELS[ticket.status] || ticket.status}
									</span>
									{(ticket.calledAt || ticket.arrivedAt) && (
										<span className="text-xs text-ink-faint font-mono hidden md:inline truncate">
											{ticket.calledAt &&
												`called ${new Date(ticket.calledAt).toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												})}`}
											{ticket.calledAt && ticket.arrivedAt && " · "}
											{ticket.arrivedAt &&
												`arrived ${new Date(ticket.arrivedAt).toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												})}`}
										</span>
									)}
								</div>
								<div className="flex gap-2 shrink-0">
									{ticket.status === "waiting" && (
										<button
											type="button"
											className="btn-warn-soft"
											onClick={() => action(ticket.id, "call")}
										>
											<BellRing className="size-4" />
											Call
										</button>
									)}
									{(ticket.status === "called" ||
										ticket.status === "no_show") && (
										<>
											<button
												type="button"
												className="btn-secondary"
												onClick={() => action(ticket.id, "recall")}
											>
												<RotateCcw className="size-4" />
												Recall
											</button>
											<button
												type="button"
												className="btn-primary"
												onClick={() => action(ticket.id, "arrived")}
											>
												<Check className="size-4" />
												Arrived
											</button>
										</>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</section>

			{error && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#241116] border border-danger/30 text-danger px-5 py-3 rounded-xl text-sm shadow-lg z-50">
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
