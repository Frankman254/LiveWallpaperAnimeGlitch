import { useEffect, useSyncExternalStore } from 'react';
import {
	getSpectrumDiagnosticsSnapshot,
	resetSpectrumDiagnosticsTelemetry,
	subscribeSpectrumDiagnosticsTelemetry
} from '@/lib/debug/spectrumDiagnosticsTelemetry';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';

function approxEqual(a: number, b: number, eps = 0.002): boolean {
	return Math.abs(a - b) <= eps;
}

export default function SpectrumDiagnosticsHud() {
	const t = useT();
	const enabled = useWallpaperStore(s => s.showSpectrumDiagnosticsHud);
	const editorTheme = useWallpaperStore(s => s.editorTheme);
	const logoPositionX = useWallpaperStore(s => s.logoPositionX);
	const logoPositionY = useWallpaperStore(s => s.logoPositionY);
	const spectrumCircularClone = useWallpaperStore(
		s => s.spectrumCircularClone
	);
	const logoEnabled = useWallpaperStore(s => s.logoEnabled);
	// Circular Spectrum is independent of Main Spectrum mode — show its diagnostics
	// whenever circular is enabled and logo exists, regardless of main mode.
	const cloneHudRelevant = spectrumCircularClone && logoEnabled;

	useEffect(() => {
		if (!enabled) return;
		resetSpectrumDiagnosticsTelemetry();
		return () => resetSpectrumDiagnosticsTelemetry();
	}, [enabled]);

	const snap = useSyncExternalStore(
		subscribeSpectrumDiagnosticsTelemetry,
		getSpectrumDiagnosticsSnapshot,
		getSpectrumDiagnosticsSnapshot
	);

	if (!enabled) return null;

	function renderSlice(
		label: string,
		slice: NonNullable<typeof snap.primary>,
		showFollowHint: boolean,
		variant: 'primary' | 'clone'
	) {
		const posLockedToLogo =
			slice.followLogoEffective &&
			approxEqual(slice.positionNormX, logoPositionX) &&
			approxEqual(slice.positionNormY, logoPositionY);
		const gainPct = Math.round(slice.globalGain * 100);
		const accent =
			variant === 'primary'
				? {
						border: '1px solid rgba(103, 232, 249, 0.42)',
						background: 'rgba(103, 232, 249, 0.07)',
						labelColor: 'rgba(103, 232, 249, 0.95)'
					}
				: {
						border: '1px solid rgba(167, 139, 250, 0.45)',
						background: 'rgba(167, 139, 250, 0.08)',
						labelColor: 'rgba(196, 181, 253, 0.98)'
					};

		return (
			<div
				key={label}
				className="rounded-md px-2 py-1.5"
				style={{
					border: accent.border,
					background: accent.background
				}}
			>
				<div
					className="mb-0.5 font-semibold tracking-wide"
					style={{ color: accent.labelColor }}
				>
					{label}
				</div>
				<div
					className="mb-1 h-1.5 w-full overflow-hidden rounded bg-black/45"
					title={t.hint_spectrum_diag_hud}
				>
					<div
					className={`h-full rounded-sm opacity-90 ${
						editorTheme === 'rainbow' ? 'editor-rgb-theme-active' : ''
					}`}
					style={{
						width: `${Math.min(100, Math.round(slice.envelopeNormalized * 100))}%`,
						background:
							editorTheme !== 'rainbow'
								? 'var(--editor-accent-color)'
								: undefined
					}}
				/>
				</div>
				<div
					className="grid gap-0.5"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					<div>
						{t.label_spectrum_diag_channel}:{' '}
						<span style={{ color: 'var(--editor-accent-soft)' }}>
							{slice.bandModeRequested} → {slice.resolvedChannel}
						</span>
					</div>
					<div>
						{t.label_spectrum_diag_drive}:{' '}
						<span style={{ color: 'var(--editor-accent-soft)' }}>
							{slice.channelInstant.toFixed(3)}
						</span>
						{' · '}
						{t.label_spectrum_diag_smoothed}:{' '}
						<span style={{ color: 'var(--editor-accent-soft)' }}>
							{slice.channelSmoothed.toFixed(3)}
						</span>
					</div>
					<div>
						{t.label_spectrum_diag_bins}:{' '}
						<span style={{ color: 'var(--editor-accent-soft)' }}>
							{slice.meanBinEnergy.toFixed(4)}
						</span>
						{' · '}
						{t.label_spectrum_diag_gain}:{' '}
						<span style={{ color: 'var(--editor-accent-soft)' }}>
							{slice.globalGain.toFixed(3)}
						</span>{' '}
						({gainPct}%)
					</div>
					<div>
						{t.label_spectrum_diag_mode}:{' '}
						<span style={{ color: 'var(--editor-accent-soft)' }}>
							{slice.spectrumMode}
						</span>
						{' · '}
						{slice.barCount} bars
					</div>
					<div>
						family{' '}
						<span style={{ color: 'var(--editor-accent-soft)' }}>
							{slice.spectrumFamily}
						</span>
						{' · '}
						tier{' '}
						<span style={{ color: 'var(--editor-accent-soft)' }}>
							{slice.renderQualityTier}
						</span>
						{' · '}
						GPU hint{' '}
						<span style={{ color: 'var(--editor-accent-soft)' }}>
							{slice.familyGpuCostHint}
						</span>
					</div>
					<div>
						{t.label_spectrum_diag_inner_r}:{' '}
						<span style={{ color: 'var(--editor-accent-soft)' }}>
							{slice.innerRadius.toFixed(1)}
						</span>
						{' · '}cx,cy{' '}
						<span style={{ color: 'var(--editor-accent-soft)' }}>
							{Math.round(slice.canvasCx)},
							{Math.round(slice.canvasCy)}
						</span>
					</div>
					<div>
						pos{' '}
						<span style={{ color: 'var(--editor-accent-soft)' }}>
							{slice.positionNormX.toFixed(3)},
							{slice.positionNormY.toFixed(3)}
						</span>
					</div>
					{showFollowHint && (
						<div className="text-[9px]">
							{t.label_spectrum_diag_follow}:{' '}
							<span style={{ color: 'var(--editor-accent-soft)' }}>
								{slice.followLogoSetting
									? t.label_bg_scale_meter_yes
									: t.label_bg_scale_meter_no}
							</span>
							{slice.followLogoEffective
								? ` · ${t.label_spectrum_diag_follow_effective}`
								: ''}
							{posLockedToLogo && slice.followLogoEffective
								? ` · ${t.label_spectrum_diag_pos_matches_logo}`
								: ''}
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div
			className="w-full border px-2.5 py-2 font-mono text-[10px] leading-tight"
			style={{
				borderRadius: 'var(--editor-radius-md)',
				borderColor: 'var(--editor-accent-border)',
				background: 'var(--editor-hud-bg)',
				backdropFilter: 'blur(var(--editor-shell-blur)) saturate(130%)',
				WebkitBackdropFilter: 'blur(var(--editor-shell-blur)) saturate(130%)',
				boxShadow: '0 8px 24px rgba(0,0,0,0.22)'
			}}
			aria-hidden
		>
			<div className="mb-1" style={{ color: 'var(--editor-accent-soft)' }}>
				{t.label_spectrum_diag_hud_title}
			</div>
			{!snap.primary && (
				<div style={{ color: 'var(--editor-accent-muted)' }}>
					{t.label_spectrum_diag_no_data}
				</div>
			)}
			<div className="flex flex-col gap-2">
				{snap.primary &&
					renderSlice(
						t.label_spectrum_diag_primary,
						snap.primary,
						true,
						'primary'
					)}
				{cloneHudRelevant &&
					(snap.clone ? (
						renderSlice(
							t.label_spectrum_diag_clone,
							snap.clone,
							true,
							'clone'
						)
					) : (
						<div
							className="rounded-md border px-2 py-1.5 text-[9px]"
							style={{
								borderColor: 'rgba(167, 139, 250, 0.35)',
								background: 'rgba(167, 139, 250, 0.05)',
								color: 'var(--editor-accent-muted)'
							}}
						>
							{t.label_spectrum_diag_clone_idle}
						</div>
					))}
			</div>
		</div>
	);
}
