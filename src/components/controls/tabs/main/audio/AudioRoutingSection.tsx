import { useShallow } from 'zustand/react/shallow';
import { Activity } from 'lucide-react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { Caption, UI_COLORS } from '@/ui';
import CollapsibleSection from '../../../ui/CollapsibleSection';

/**
 * Read-only "where does audio drive things" inspector. Audio reactivity is
 * configured across several tabs (Spectrum, Logo, BG, Motion, Looks); this
 * strip surfaces every route's live on/off state in one place so the user can
 * see what's reacting without hunting tab by tab. It doesn't own any settings —
 * each row names the tab that does.
 */
type RouteRow = {
	label: string;
	tab: string;
	active: boolean;
};

export default function AudioRoutingSection() {
	const t = useT();
	const s = useWallpaperStore(
		useShallow(state => ({
			spectrumEnabled: state.spectrumEnabled,
			logoEnabled: state.logoEnabled,
			imageBassReactive: state.imageBassReactive,
			imageOpacityReactive: state.imageOpacityReactive,
			imageBlurReactive: state.imageBlurReactive,
			bgEdgeGlowEnabled: state.bgEdgeGlowEnabled,
			particlesEnabled: state.particlesEnabled,
			particleAudioReactive: state.particleAudioReactive,
			stageLightsEnabled: state.stageLightsEnabled,
			stageLightsAudioReactive: state.stageLightsAudioReactive,
			flashLightEnabled: state.flashLightEnabled,
			cameraMotionEnabled: state.cameraMotionEnabled,
			cameraMotionAudioInfluence: state.cameraMotionAudioInfluence,
			rgbShiftAudioReactive: state.rgbShiftAudioReactive
		}))
	);

	const rows: RouteRow[] = [
		{
			label: t.tab_spectrum,
			tab: t.tab_spectrum,
			active: s.spectrumEnabled
		},
		{ label: t.tab_logo, tab: t.tab_logo, active: s.logoEnabled },
		{
			label: t.audio_route_bg_zoom,
			tab: t.tab_presets,
			active: s.imageBassReactive
		},
		{
			label: t.audio_route_bg_opacity,
			tab: t.tab_presets,
			active: s.imageOpacityReactive
		},
		{
			label: t.audio_route_bg_blur,
			tab: t.tab_presets,
			active: s.imageBlurReactive
		},
		{
			label: t.audio_route_bg_edge_glow,
			tab: t.tab_presets,
			active: s.bgEdgeGlowEnabled
		},
		{
			label: t.tab_particles,
			tab: t.tab_motion,
			active: s.particlesEnabled && s.particleAudioReactive
		},
		{
			label: t.audio_route_stage_lights,
			tab: t.tab_motion,
			active: s.stageLightsEnabled && s.stageLightsAudioReactive
		},
		{
			label: t.audio_route_flash,
			tab: t.tab_motion,
			active: s.flashLightEnabled
		},
		{
			label: t.audio_route_camera,
			tab: t.tab_motion,
			active: s.cameraMotionEnabled && s.cameraMotionAudioInfluence > 0
		},
		{
			label: t.audio_route_rgb_shift,
			tab: t.tab_looks,
			active: s.rgbShiftAudioReactive
		}
	];

	const activeCount = rows.filter(row => row.active).length;

	return (
		<CollapsibleSection
			label={`${t.audio_routing_title} · ${activeCount}/${rows.length}`}
			defaultOpen={false}
		>
			<Caption as="p">{t.audio_routing_hint}</Caption>
			<div className="mt-2 flex flex-col gap-1">
				{rows.map((row, index) => (
					<div
						key={index}
						className="flex items-center justify-between gap-3 rounded-[var(--editor-radius-sm)] px-2 py-1"
						style={{ background: UI_COLORS.panel }}
					>
						<div className="flex items-center gap-2 min-w-0">
							<Activity
								size={12}
								style={{
									color: row.active
										? UI_COLORS.accent
										: UI_COLORS.fgFaint,
									flex: '0 0 auto'
								}}
							/>
							<span
								className="truncate text-[12px]"
								style={{
									color: row.active
										? UI_COLORS.fg
										: UI_COLORS.fgMute
								}}
							>
								{row.label}
							</span>
						</div>
						<div className="flex items-center gap-2 shrink-0">
							<span
								className="text-[10px] uppercase tracking-widest"
								style={{ color: UI_COLORS.fgFaint }}
							>
								{row.tab}
							</span>
							<span
								className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
								style={{
									background: row.active
										? UI_COLORS.accentSoft
										: 'transparent',
									border: `1px solid ${row.active ? UI_COLORS.accentBorder : UI_COLORS.border}`,
									color: row.active
										? UI_COLORS.accent
										: UI_COLORS.fgFaint
								}}
							>
								{row.active
									? t.audio_route_on
									: t.audio_route_off}
							</span>
						</div>
					</div>
				))}
			</div>
		</CollapsibleSection>
	);
}
