import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { snapshotManualSections } from '@/features/spectrum/manual/spectrumManualRuntime';
import type { SpectrumDriveMode } from '@/types/wallpaper';

/**
 * Spectrum manual control HUD.
 *
 * Renders only when:
 *   - `spectrumDriveMode !== 'audio'` (the feature is active), AND
 *   - `showSpectrumManualHud` is true (user kept the indicator on).
 *
 * Layout mirrors the diagnostic HUDs in `DiagnosticsHudStack` (themed
 * surface, accent borders) so the visual language is consistent. Each
 * section gets a vertical pad that lights up while its key is held.
 *
 * The section levels live in module state (`spectrumManualRuntime`) and
 * update at frame rate — too fast for React. We poll once per RAF and
 * push to local state; the resulting render is a 60fps batched update of
 * `N <= 12` bar heights, cheap enough.
 */

const MODE_LABEL: Record<SpectrumDriveMode, string> = {
	audio: 'AUDIO',
	max: 'AUDIO + MAX',
	add: 'AUDIO + ADD',
	manual: 'MANUAL'
};

const MODE_ACCENT: Record<SpectrumDriveMode, string> = {
	audio: 'rgba(103, 232, 249, 0.5)',
	max: 'rgba(134, 239, 172, 0.55)',
	add: 'rgba(253, 224, 71, 0.55)',
	manual: 'rgba(244, 114, 182, 0.55)'
};

export default function SpectrumManualHud() {
	const { driveMode, sections, bindings, showHud } = useWallpaperStore(
		useShallow(state => ({
			driveMode: state.spectrumDriveMode,
			sections: state.spectrumManualSections,
			bindings: state.spectrumManualBindings,
			showHud: state.showSpectrumManualHud
		}))
	);

	const safeSections = Math.max(0, Math.min(bindings.length, sections));
	const [levels, setLevels] = useState<number[]>(() =>
		new Array(safeSections).fill(0)
	);
	const rafRef = useRef(0);

	useEffect(() => {
		if (driveMode === 'audio' || !showHud) return;
		let cancelled = false;
		const poll = () => {
			if (cancelled) return;
			setLevels(snapshotManualSections(safeSections));
			rafRef.current = requestAnimationFrame(poll);
		};
		rafRef.current = requestAnimationFrame(poll);
		return () => {
			cancelled = true;
			cancelAnimationFrame(rafRef.current);
		};
	}, [driveMode, showHud, safeSections]);

	if (driveMode === 'audio' || !showHud) return null;

	const accent = MODE_ACCENT[driveMode];

	return (
		<div
			className="rounded-md px-2 py-1.5"
			style={{
				border: `1px solid ${accent}`,
				background: 'rgba(0,0,0,0.32)',
				color: 'var(--editor-text-primary)',
				backdropFilter: 'blur(8px)',
				fontFamily: 'var(--editor-font-mono, ui-monospace, monospace)',
				fontSize: 10,
				letterSpacing: '0.08em'
			}}
		>
			<div
				className="mb-1 font-semibold tracking-widest uppercase"
				style={{ color: accent }}
			>
				Spectrum · {MODE_LABEL[driveMode]}
			</div>
			<div className="flex items-end gap-0.5" style={{ height: 36 }}>
				{Array.from({ length: safeSections }, (_, i) => {
					const level = levels[i] ?? 0;
					const heightPct = Math.max(4, level * 100);
					return (
						<div
							key={i}
							className="relative flex flex-col items-center"
							style={{ flex: '1 1 0', minWidth: 14 }}
						>
							<div
								className="w-full rounded-sm"
								style={{
									height: `${heightPct}%`,
									background: accent,
									opacity: 0.3 + level * 0.7,
									transition: 'opacity 60ms linear'
								}}
							/>
							<div
								className="mt-0.5 leading-none"
								style={{
									fontSize: 9,
									opacity: 0.7,
									color: 'var(--editor-text-secondary)'
								}}
							>
								{(bindings[i] ?? '').toUpperCase() || '·'}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
