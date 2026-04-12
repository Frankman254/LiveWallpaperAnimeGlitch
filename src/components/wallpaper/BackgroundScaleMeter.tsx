import { useEffect, useSyncExternalStore } from 'react';
import {
	getBackgroundScaleTelemetrySnapshot,
	resetBackgroundScaleTelemetry,
	subscribeBackgroundScaleTelemetry
} from '@/lib/debug/backgroundScaleTelemetry';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';

export default function BackgroundScaleMeter() {
	const t = useT();
	const enabled = useWallpaperStore(s => s.showBackgroundScaleMeter);
	const editorTheme = useWallpaperStore(s => s.editorTheme);

	useEffect(() => {
		if (!enabled) return;
		resetBackgroundScaleTelemetry();
		return () => resetBackgroundScaleTelemetry();
	}, [enabled]);

	const snap = useSyncExternalStore(
		subscribeBackgroundScaleTelemetry,
		getBackgroundScaleTelemetrySnapshot,
		getBackgroundScaleTelemetrySnapshot
	);

	if (!enabled) return null;

	const maxB = snap.maxBoost;
	const growth01 =
		maxB > 1e-6 ? Math.min(1, Math.max(0, snap.bassBoost / maxB)) : 0;
	const scaleTen = growth01 * 10;
	const pct = Math.round(growth01 * 100);
	const totalScale = snap.baseScale + snap.bassBoost;
	const normPct = Math.round(snap.envelopeNormalized * 100);

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
			<div
				className="mb-1 flex items-center justify-between gap-2"
				style={{ color: 'var(--editor-accent-soft)' }}
			>
				<span>{t.label_bg_scale_meter}</span>
				{!snap.hasSignal && (
					<span style={{ color: 'var(--editor-accent-muted)' }}>
						{t.label_bg_scale_meter_no_bg}
					</span>
				)}
			</div>

			<div
				className="mb-1.5 h-2 w-full overflow-hidden rounded bg-black/45"
				title={t.hint_bg_scale_meter}
			>
				<div
					className={`h-full rounded-sm opacity-90 ${
						editorTheme === 'rainbow' ? 'editor-rgb-theme-active' : ''
					}`}
					style={{
						width: `${pct}%`,
						background:
							editorTheme !== 'rainbow'
								? 'var(--editor-accent-color)'
								: undefined
					}}
				/>
			</div>

			<div
				className="grid grid-cols-1 gap-0.5"
				style={{ color: 'var(--editor-accent-muted)' }}
			>
				<div>
					{t.label_bg_scale_meter_grow}:{' '}
					<span style={{ color: 'var(--editor-accent-soft)' }}>
						{scaleTen.toFixed(1)}
					</span>
					/10 · {pct}%
				</div>
				<div>
					{t.label_bg_scale_meter_drive}:{' '}
					<span style={{ color: 'var(--editor-accent-soft)' }}>
						{snap.driveInstant.toFixed(3)}
					</span>
					{' · '}
					{t.label_bg_scale_meter_router}:{' '}
					<span style={{ color: 'var(--editor-accent-soft)' }}>
						{snap.channelRouterSmoothed.toFixed(3)}
					</span>
				</div>
				<div>
					{t.label_bg_scale_meter_envelope}:{' '}
					<span style={{ color: 'var(--editor-accent-soft)' }}>
						{snap.bassBoost.toFixed(3)}
					</span>
					{' · norm '}
					<span style={{ color: 'var(--editor-accent-soft)' }}>
						{snap.envelopeNormalized.toFixed(3)}
					</span>{' '}
					({normPct}%)
				</div>
				<div>
					σ {snap.envelopeSmoothed.toFixed(3)} · peak{' '}
					{snap.adaptivePeak.toFixed(3)} · floor{' '}
					{snap.adaptiveFloor.toFixed(3)}
				</div>
				<div>
					{t.label_bg_scale_meter_total}:{' '}
					<span style={{ color: 'var(--editor-accent-soft)' }}>
						{snap.baseScale.toFixed(2)} +{' '}
						{snap.bassBoost.toFixed(3)} = {totalScale.toFixed(3)}
					</span>
				</div>
				<div>
					{t.label_bg_scale_meter_reactive}:{' '}
					<span style={{ color: 'var(--editor-accent-soft)' }}>
						{snap.imageBassReactive
							? t.label_bg_scale_meter_yes
							: t.label_bg_scale_meter_no}
					</span>
				</div>
			</div>
		</div>
	);
}
