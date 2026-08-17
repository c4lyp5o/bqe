// BQE v2 — close-session confirm modal (dark)
import { useState } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";

export default function CloseAppModal({ open, adminCode, onCancel, onConfirm }) {
	const [copied, setCopied] = useState(false);

	if (!open) return null;

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(adminCode ?? "");
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[4px]"
			onClick={onCancel}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="close-app-title"
				onClick={(e) => e.stopPropagation()}
				className="w-full max-w-[440px] rounded-2xl bg-raised border border-hair p-7 font-sans shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
			>
				<div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-warn-tint border border-warn/30">
					<TriangleAlert className="size-6 text-warn" />
				</div>

				<h2
					id="close-app-title"
					className="m-0 text-center text-xl font-semibold text-ink"
				>
					Close this tab?
				</h2>

				<p className="mt-2 text-center text-sm leading-relaxed text-ink-muted">
					If you close the tab or browser, you will lose access to the current
					queue management session.
				</p>

				<div className="my-5 rounded-xl border border-dashed border-hair-strong bg-panel p-3.5">
					<div className="mb-2 text-xs tracking-[0.2em] text-ink-faint">
						ADMIN CODE
					</div>
					<div className="flex items-center gap-2.5">
						<code className="flex-1 text-lg font-bold tracking-[2px] break-all text-ink font-mono">
							{adminCode || "—"}
						</code>
						<button
							type="button"
							onClick={handleCopy}
							title="Copy admin code"
							className="btn-secondary h-9 px-3 rounded-lg text-xs"
						>
							{copied ? (
								<Check className="size-4 text-accent-bright" />
							) : (
								<Copy className="size-4" />
							)}
						</button>
					</div>
					<div className="mt-2.5 text-xs text-warn">
						Save this code in a safe place — you will need it to log in again.
					</div>
				</div>

				<button
					type="button"
					onClick={onConfirm}
					className="w-full btn-danger-soft h-11 rounded-[10px] font-semibold"
				>
					Yes, I understand — proceed and close
				</button>

				<button
					type="button"
					onClick={onCancel}
					className="mt-2.5 w-full btn-ghost justify-center text-sm text-ink-faint"
				>
					Cancel
				</button>
			</div>
		</div>
	);
}
