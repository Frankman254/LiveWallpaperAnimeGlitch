/**
 * Side-pane shown on wide screens inside `EditorOverlay`.
 *
 * Mirrors the `.design-ref/editor.jsx` ExpandedEditor layout — right column
 * with a scene-status card and live performance metrics. No live wallpaper
 * preview here yet (that would require a second canvas mount); this is the
 * MVP info pane.
 */

import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Activity, Layers, Sparkles, Music } from 'lucide-react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { SectionCard, UI_COLORS, FONT, ICON_SIZE } from '@/ui';

type Metric = {
	label: string;
	value: string;
	tone?: 'ok' | 'warn' | 'neutral';
	icon?: React.ReactNode;
};

function useFps(): number {
	const [fps, setFps] = useState(0);
	useEffect(() => {
		let frameCount = 0;
		let last = performance.now();
		let rafId = 0;
		function tick() {
			frameCount++;
			const now = performance.now();
			const elapsed = now - last;
			if (elapsed >= 1000) {
				setFps(Math.round((frameCount * 1000) / elapsed));
				frameCount = 0;
				last = now;
			}
			rafId = requestAnimationFrame(tick);
		}
		rafId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafId);
	}, []);
	return fps;
}

export default function EditorOverlayInsightsPane() {
	const fps = useFps();
	const state = useWallpaperStore(
		useShallow(s => ({
			performanceMode: s.performanceMode,
			particleCount: s.particleCount,
			particlesEnabled: s.particlesEnabled,
			rainEnabled: s.rainEnabled,
			rainDropCount: s.rainDropCount,
			logoEnabled: s.logoEnabled,
			backgroundCount: s.backgroundImages.length,
			audioTrackCount: s.audioTracks.length,
			sceneSlots: s.sceneSlots,
			activeSceneSlotId: s.activeSceneSlotId,
			audioSourceMode: s.audioSourceMode,
			audioPaused: s.audioPaused
		}))
	);

	const activeScene = state.sceneSlots.find(
		s => s.id === state.activeSceneSlotId
	);

	const fpsTone: Metric['tone'] =
		fps >= 55 ? 'ok' : fps >= 30 ? 'neutral' : 'warn';

	const particles =
		state.particlesEnabled && state.particleCount > 0
			? state.particleCount
			: 0;
	const drops = state.rainEnabled && state.rainDropCount > 0
		? state.rainDropCount
		: 0;

	const metrics: Metric[] = [
		{
			label: 'FPS',
			value: fps > 0 ? String(fps) : '—',
			tone: fpsTone
		},
		{
			label: 'Perf mode',
			value: state.performanceMode,
			tone: 'neutral'
		},
		{
			label: 'Particles',
			value: String(particles),
			tone: 'neutral'
		},
		{
			label: 'Rain drops',
			value: String(drops),
			tone: 'neutral'
		},
		{
			label: 'Images',
			value: String(state.backgroundCount),
			tone: 'neutral'
		},
		{
			label: 'Tracks',
			value: String(state.audioTrackCount),
			tone: 'neutral'
		}
	];

	return (
		<div className="flex h-full flex-col gap-3 overflow-y-auto">
			<SectionCard title="Scene" density="compact">
				<div className="flex items-center gap-2">
					<div
						className="grid h-8 w-8 shrink-0 place-items-center rounded border"
						style={{
							borderColor: UI_COLORS.accentBorder,
							background: UI_COLORS.accentSoft,
							color: UI_COLORS.accent
						}}
					>
						<Sparkles size={ICON_SIZE.sm} />
					</div>
					<div className="min-w-0 flex-1">
						<div
							className="truncate text-[13px] font-semibold"
							style={{ color: UI_COLORS.fg }}
						>
							{activeScene?.name ?? '— sin escena activa —'}
						</div>
						<div
							className="text-[10px] uppercase"
							style={{
								color: UI_COLORS.fgMute,
								fontFamily: FONT.mono,
								letterSpacing: '0.08em'
							}}
						>
							{state.sceneSlots.length} slot
							{state.sceneSlots.length === 1 ? '' : 's'} ·{' '}
							{activeScene ? 'aplicada' : 'libre'}
						</div>
					</div>
				</div>
			</SectionCard>

			<SectionCard title="Performance" density="compact">
				<div className="grid grid-cols-2 gap-2">
					{metrics.map(m => (
						<div key={m.label} className="flex flex-col gap-0.5">
							<div
								className="text-[9px] uppercase"
								style={{
									color: UI_COLORS.fgMute,
									fontFamily: FONT.mono,
									letterSpacing: '0.08em'
								}}
							>
								{m.label}
							</div>
							<div
								className="text-[18px] font-semibold leading-tight tabular-nums"
								style={{
									color:
										m.tone === 'ok'
											? '#34d399'
											: m.tone === 'warn'
												? '#fbbf24'
												: UI_COLORS.fg,
									fontFamily: FONT.mono
								}}
							>
								{m.value}
							</div>
						</div>
					))}
				</div>
			</SectionCard>

			<SectionCard title="Layers" density="compact">
				<div className="flex flex-col gap-1.5">
					<LayerBadge
						active={state.logoEnabled}
						label="Logo"
						icon={<Activity size={ICON_SIZE.xs} />}
					/>
					<LayerBadge
						active={state.particlesEnabled}
						label="Particles"
						icon={<Sparkles size={ICON_SIZE.xs} />}
					/>
					<LayerBadge
						active={state.rainEnabled}
						label="Rain"
						icon={<Layers size={ICON_SIZE.xs} />}
					/>
					<LayerBadge
						active={
							state.audioSourceMode !== 'none' && !state.audioPaused
						}
						label={`Audio · ${state.audioSourceMode}`}
						icon={<Music size={ICON_SIZE.xs} />}
					/>
				</div>
			</SectionCard>
		</div>
	);
}

function LayerBadge({
	active,
	label,
	icon
}: {
	active: boolean;
	label: string;
	icon: React.ReactNode;
}) {
	return (
		<div
			className="flex items-center gap-2 rounded border px-2 py-1"
			style={{
				borderColor: active ? UI_COLORS.accentBorder : UI_COLORS.border,
				background: active ? UI_COLORS.accentSoft : UI_COLORS.raised,
				color: active ? UI_COLORS.fg : UI_COLORS.fgMute
			}}
		>
			<span className="shrink-0">{icon}</span>
			<span className="min-w-0 flex-1 truncate text-[11px]">{label}</span>
			<span
				className="shrink-0 text-[9px] uppercase tabular-nums"
				style={{
					fontFamily: FONT.mono,
					color: active ? UI_COLORS.accent : UI_COLORS.fgMute,
					letterSpacing: '0.08em'
				}}
			>
				{active ? 'on' : 'off'}
			</span>
		</div>
	);
}
