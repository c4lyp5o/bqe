/** biome-ignore-all lint/a11y/useKeyWithClickEvents: later */
import { useState } from "react";

export default function CloseAppModal({
	open,
	adminCode,
	onCancel,
	onConfirm,
}) {
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
		// biome-ignore lint/a11y/noStaticElementInteractions: later
		<div
			className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[4px]"
			onClick={onCancel}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="close-app-title"
				onClick={(e) => e.stopPropagation()}
				className="w-full max-w-[440px] rounded-2xl bg-white p-7 font-sans shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
			>
				<div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-amber-100 text-[28px]">
					⚠️
				</div>

				<h2
					id="close-app-title"
					className="m-0 text-center text-xl text-slate-900"
				>
					Close this tab?
				</h2>

				<p className="text-center text-sm leading-relaxed text-slate-600">
					If you close the tab or browser, you will lose access to the current
					queue management session.
				</p>

				<div className="my-[18px] rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3.5">
					<div className="mb-2 text-xs tracking-wide text-slate-500">
						ADMIN CODE
					</div>
					<div className="flex items-center gap-2.5">
						<code className="flex-1 text-lg font-bold tracking-[2px] break-all text-slate-900">
							{adminCode || "—"}
						</code>
						<button
							type="button"
							onClick={handleCopy}
							title="Copy admin code"
							className="cursor-pointer rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-base leading-none"
						>
							{copied ? "✅" : "📋"}
						</button>
					</div>
					<div className="mt-2.5 text-xs text-amber-700">
						Save this code in a safe place — you will need it to log in again.
					</div>
				</div>

				<button
					type="button"
					onClick={onConfirm}
					className="w-full cursor-pointer rounded-[10px] border-none bg-red-600 px-4 py-3 text-[15px] font-semibold text-white"
				>
					Yes, I understand — proceed and close
				</button>

				<button
					type="button"
					onClick={onCancel}
					className="mt-2.5 w-full cursor-pointer border-none bg-transparent text-sm text-slate-500"
				>
					Cancel
				</button>
			</div>
		</div>
	);
}
