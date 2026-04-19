import { useState } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';

export type DiscoveryRequestMainTab =
	| 'scene'
	| 'spectrum'
	| 'looks'
	| 'layers'
	| 'motion'
	| 'audio'
	| 'advanced';

export function DiscoveryOnboardingCard({
	onRequestMainTab
}: {
	onRequestMainTab?: (tab: DiscoveryRequestMainTab) => void;
}) {
	const t = useT();
	const store = useWallpaperStore();
	const [step, setStep] = useState(0);

	if (store.discoveryOnboardingDismissed) return null;

	function finish() {
		store.dismissDiscoveryOnboarding();
	}

	const btnBase =
		'rounded border px-2 py-1 text-[10px] transition-colors hover:bg-white/5';

	return (
		<div
			className="rounded-lg border p-2.5"
			style={{
				borderColor: 'var(--editor-accent-border)',
				background: 'var(--editor-tag-bg)'
			}}
		>
			<div className="flex items-start justify-between gap-2">
				<span
					className="text-[10px] font-semibold uppercase tracking-widest"
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					{t.section_discovery_onboarding}
				</span>
				<button
					type="button"
					onClick={finish}
					className={btnBase}
					style={{
						borderColor: 'var(--editor-accent-border)',
						color: 'var(--editor-accent-muted)'
					}}
				>
					{t.discovery_skip}
				</button>
			</div>

			{step === 0 ? (
				<>
					<h3
						className="mt-1.5 text-[11px] font-semibold"
						style={{ color: 'var(--editor-accent-fg)' }}
					>
						{t.discovery_step1_title}
					</h3>
					<p
						className="mt-0.5 text-[10px] leading-snug"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						{t.discovery_step1_body}
					</p>
					<div className="mt-2 flex flex-wrap gap-1.5">
						<button
							type="button"
							onClick={() => {
								onRequestMainTab?.('scene');
								setStep(1);
							}}
							className={btnBase}
							style={{
								borderColor: 'var(--editor-active-fg)',
								color: 'var(--editor-active-fg)'
							}}
						>
							Open Scene
						</button>
					</div>
				</>
			) : null}

			{step === 1 ? (
				<>
					<h3
						className="mt-1.5 text-[11px] font-semibold"
						style={{ color: 'var(--editor-accent-fg)' }}
					>
						{t.discovery_step2_title}
					</h3>
					<p
						className="mt-0.5 text-[10px] leading-snug"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						{t.discovery_step2_body}
					</p>
					<div className="mt-2 flex flex-wrap gap-1.5">
						<button
							type="button"
							onClick={() => onRequestMainTab?.('audio')}
							className={btnBase}
							style={{
								borderColor: 'var(--editor-active-fg)',
								color: 'var(--editor-active-fg)'
							}}
						>
							{t.discovery_open_audio}
						</button>
					</div>
				</>
			) : null}

			{step === 2 ? (
				<>
					<h3
						className="mt-1.5 text-[11px] font-semibold"
						style={{ color: 'var(--editor-accent-fg)' }}
					>
						{t.discovery_step3_title}
					</h3>
					<p
						className="mt-0.5 text-[10px] leading-snug"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						{t.discovery_step3_body}
					</p>
					<div className="mt-2 flex flex-wrap gap-1.5">
						<button
							type="button"
							onClick={() => onRequestMainTab?.('spectrum')}
							className={btnBase}
							style={{
								borderColor: 'var(--editor-accent-border)',
								color: 'var(--editor-accent-fg)'
							}}
						>
							{t.discovery_open_spectrum}
						</button>
						<button
							type="button"
							onClick={() => onRequestMainTab?.('looks')}
							className={btnBase}
							style={{
								borderColor: 'var(--editor-accent-border)',
								color: 'var(--editor-accent-fg)'
							}}
						>
							{t.discovery_open_looks}
						</button>
					</div>
				</>
			) : null}

			<div className="mt-2 flex flex-wrap justify-end gap-1.5">
				{step > 0 ? (
					<button
						type="button"
						onClick={() => setStep(s => Math.max(0, s - 1))}
						className={btnBase}
						style={{
							borderColor: 'var(--editor-accent-border)',
							color: 'var(--editor-accent-muted)'
						}}
					>
						{t.discovery_back}
					</button>
				) : null}
				{step === 0 ? (
					<button
						type="button"
						onClick={() => setStep(1)}
						className={btnBase}
						style={{
							borderColor: 'var(--editor-accent-border)',
							color: 'var(--editor-accent-fg)'
						}}
					>
						{t.discovery_next}
					</button>
				) : null}
				{step === 1 ? (
					<button
						type="button"
						onClick={() => setStep(2)}
						className={btnBase}
						style={{
							borderColor: 'var(--editor-accent-border)',
							color: 'var(--editor-accent-fg)'
						}}
					>
						{t.discovery_next}
					</button>
				) : null}
				{step === 2 ? (
					<button
						type="button"
						onClick={finish}
						className={btnBase}
						style={{
							borderColor: 'var(--editor-active-fg)',
							color: 'var(--editor-active-fg)'
						}}
					>
						{t.discovery_finish}
					</button>
				) : null}
			</div>
		</div>
	);
}
