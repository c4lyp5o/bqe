// BQE v2 — Join page (phone input, scanned from QR)
// Customer scans QR on TV, lands here, enters phone, gets ticket.

import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, QrCode, Ticket } from "lucide-react";
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
			const data = await api.join(code, {
				phone: phone.trim() || undefined,
				nonce,
			});
			nav(`/ticket/${data.ticket.id}`);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	if (!code) {
		return (
			<div className="min-h-screen flex items-center justify-center px-6">
				<div className="card p-8 max-w-sm w-full text-center space-y-3">
					<QrCode className="size-8 text-danger mx-auto" />
					<p className="text-ink font-semibold">Invalid QR code</p>
					<p className="text-sm text-ink-muted">Missing facility code.</p>
					<a href="/" className="btn-ghost mt-2 text-sm">
						← Back to start
					</a>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
			<div className="w-full max-w-sm card p-7 space-y-5">
				<div className="flex flex-col items-center text-center space-y-3">
					<div className="size-12 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center">
						<Ticket className="size-6 text-accent-bright" />
					</div>
					<div>
						<h1 className="text-xl font-bold tracking-tight">
							Join the queue
						</h1>
						<p className="text-sm text-ink-muted mt-1">
							Enter your phone number to receive your ticket
						</p>
					</div>
				</div>
				<form onSubmit={handleJoin} className="space-y-3">
					<input
						type="tel"
						placeholder="+60 12 345 6789"
						value={phone}
						onChange={(e) => setPhone(e.target.value)}
						className="input text-center text-lg"
						disabled={loading}
					/>
					<button
						type="submit"
						disabled={loading}
						className="btn-primary w-full"
					>
						{loading ? "Getting your ticket…" : "Get ticket"}
					</button>
					<p className="text-xs text-ink-faint text-center">
						Phone is optional — it&apos;s hashed and never shared.
					</p>
				</form>
				{error && <p className="text-sm text-danger text-center">{error}</p>}
			</div>
			<a href="/" className="btn-ghost mt-6 text-sm">
				<ArrowLeft className="size-4" /> Back to start
			</a>
		</div>
	);
}
