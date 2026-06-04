import { useShallow } from 'zustand/react/shallow';
import {
	CollapsibleSection,
	SectionCard,
	SegmentedControl,
	ToggleSwitch
} from '@/ui';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { FACTORY_DEFAULT_STATE } from '@/lib/factoryDefaults';
import type {
	FxAudioChannel,
	StageLightsBlendMode,
	StageLightsColorSource
} from '@/features/stageFx/stageFxConfig';
import { ColorField, MotionSlider as Slider } from './MotionSharedControls';
import { formatDecimal } from './motionTabUtils';

type Target = 'logo' | 'bg';

function useEdgeGlowState(target: Target) {
	return useWallpaperStore(
		useShallow(state => ({
			enabled:
				target === 'logo'
					? state.logoEdgeGlowEnabled
					: state.bgEdgeGlowEnabled,
			intensity:
				target === 'logo'
					? state.logoEdgeGlowIntensity
					: state.bgEdgeGlowIntensity,
			thickness:
				target === 'logo'
					? state.logoEdgeGlowThickness
					: state.bgEdgeGlowThickness,
			radius:
				target === 'logo'
					? state.logoEdgeGlowRadius
					: state.bgEdgeGlowRadius,
			expansionRadius:
				target === 'logo'
					? state.logoEdgeGlowExpansionRadius
					: state.bgEdgeGlowExpansionRadius,
			opacity:
				target === 'logo'
					? state.logoEdgeGlowOpacity
					: state.bgEdgeGlowOpacity,
			colorSource:
				target === 'logo'
					? state.logoEdgeGlowColorSource
					: state.bgEdgeGlowColorSource,
			color:
				target === 'logo'
					? state.logoEdgeGlowColor
					: state.bgEdgeGlowColor,
			blendMode:
				target === 'logo'
					? state.logoEdgeGlowBlendMode
					: state.bgEdgeGlowBlendMode,
			audioChannel:
				target === 'logo'
					? state.logoEdgeGlowAudioChannel
					: state.bgEdgeGlowAudioChannel,
			threshold:
				target === 'logo'
					? state.logoEdgeGlowThreshold
					: state.bgEdgeGlowThreshold,
			attack:
				target === 'logo'
					? state.logoEdgeGlowAttack
					: state.bgEdgeGlowAttack,
			release:
				target === 'logo'
					? state.logoEdgeGlowRelease
					: state.bgEdgeGlowRelease,
			sensitivity:
				target === 'logo'
					? state.logoEdgeGlowSensitivity
					: state.bgEdgeGlowSensitivity,
			advanced: state.uiMode === 'advanced'
		}))
	);
}

function useEdgeGlowSetters(target: Target) {
	return useWallpaperStore(
		useShallow(state =>
			target === 'logo'
				? {
						enabled: state.setLogoEdgeGlowEnabled,
						intensity: state.setLogoEdgeGlowIntensity,
						thickness: state.setLogoEdgeGlowThickness,
						radius: state.setLogoEdgeGlowRadius,
						expansionRadius: state.setLogoEdgeGlowExpansionRadius,
						opacity: state.setLogoEdgeGlowOpacity,
						colorSource: state.setLogoEdgeGlowColorSource,
						color: state.setLogoEdgeGlowColor,
						blendMode: state.setLogoEdgeGlowBlendMode,
						audioChannel: state.setLogoEdgeGlowAudioChannel,
						threshold: state.setLogoEdgeGlowThreshold,
						attack: state.setLogoEdgeGlowAttack,
						release: state.setLogoEdgeGlowRelease,
						sensitivity: state.setLogoEdgeGlowSensitivity
					}
				: {
						enabled: state.setBgEdgeGlowEnabled,
						intensity: state.setBgEdgeGlowIntensity,
						thickness: state.setBgEdgeGlowThickness,
						radius: state.setBgEdgeGlowRadius,
						expansionRadius: state.setBgEdgeGlowExpansionRadius,
						opacity: state.setBgEdgeGlowOpacity,
						colorSource: state.setBgEdgeGlowColorSource,
						color: state.setBgEdgeGlowColor,
						blendMode: state.setBgEdgeGlowBlendMode,
						audioChannel: state.setBgEdgeGlowAudioChannel,
						threshold: state.setBgEdgeGlowThreshold,
						attack: state.setBgEdgeGlowAttack,
						release: state.setBgEdgeGlowRelease,
						sensitivity: state.setBgEdgeGlowSensitivity
					}
		)
	);
}

/**
 * Reactive Edge Glow section — shared UI for logo and background targets.
 * Add <EdgeGlowSection target="logo" /> to the Logo tab,
 * and <EdgeGlowSection target="bg" /> to the Background tab.
 */
export function EdgeGlowSection({ target }: { target: Target }) {
	const t = useT();
	const s = useEdgeGlowState(target);
	const set = useEdgeGlowSetters(target);

	const defaults =
		target === 'logo'
			? {
					intensity: FACTORY_DEFAULT_STATE.logoEdgeGlowIntensity,
					thickness: FACTORY_DEFAULT_STATE.logoEdgeGlowThickness,
					radius: FACTORY_DEFAULT_STATE.logoEdgeGlowRadius,
					expansionRadius:
						FACTORY_DEFAULT_STATE.logoEdgeGlowExpansionRadius,
					opacity: FACTORY_DEFAULT_STATE.logoEdgeGlowOpacity,
					threshold: FACTORY_DEFAULT_STATE.logoEdgeGlowThreshold,
					attack: FACTORY_DEFAULT_STATE.logoEdgeGlowAttack,
					release: FACTORY_DEFAULT_STATE.logoEdgeGlowRelease,
					sensitivity: FACTORY_DEFAULT_STATE.logoEdgeGlowSensitivity
				}
			: {
					intensity: FACTORY_DEFAULT_STATE.bgEdgeGlowIntensity,
					thickness: FACTORY_DEFAULT_STATE.bgEdgeGlowThickness,
					radius: FACTORY_DEFAULT_STATE.bgEdgeGlowRadius,
					expansionRadius:
						FACTORY_DEFAULT_STATE.bgEdgeGlowExpansionRadius,
					opacity: FACTORY_DEFAULT_STATE.bgEdgeGlowOpacity,
					threshold: FACTORY_DEFAULT_STATE.bgEdgeGlowThreshold,
					attack: FACTORY_DEFAULT_STATE.bgEdgeGlowAttack,
					release: FACTORY_DEFAULT_STATE.bgEdgeGlowRelease,
					sensitivity: FACTORY_DEFAULT_STATE.bgEdgeGlowSensitivity
				};

	const subtitle =
		target === 'logo' ? t.sfx_edge_glow_logo_hint : t.sfx_edge_glow_bg_hint;

	return (
		<SectionCard
			title={t.sfx_edge_glow_title}
			subtitle={subtitle}
			action={
				<ToggleSwitch
					checked={s.enabled}
					onChange={set.enabled}
					size="sm"
					ariaLabel={t.sfx_edge_glow_enable}
				/>
			}
			density="compact"
		>
			{s.enabled ? (
				<div className="flex flex-col gap-3">
					{/* Simple: intensity + channel */}
					<Slider
						label={t.sfx_edge_glow_intensity}
						value={s.intensity}
						min={0}
						max={2}
						step={0.01}
						onChange={set.intensity}
						defaultValue={defaults.intensity}
						variant="macro"
						formatValue={formatDecimal}
					/>
					<SegmentedControl<FxAudioChannel>
						value={s.audioChannel}
						onChange={set.audioChannel}
						options={[
							{ value: 'kick', label: t.sfx_chan_kick },
							{ value: 'bass', label: t.sfx_chan_bass },
							{ value: 'full', label: t.sfx_chan_full }
						]}
						size="sm"
						full
					/>
					<SegmentedControl<StageLightsColorSource>
						value={s.colorSource}
						onChange={set.colorSource}
						options={[
							{ value: 'theme', label: t.sfx_color_theme },
							{ value: 'image', label: t.sfx_color_image },
							{ value: 'manual', label: t.sfx_color_manual }
						]}
						size="sm"
						full
					/>
					{s.colorSource === 'manual' ? (
						<ColorField
							label={t.sfx_edge_glow_color}
							value={s.color}
							onChange={set.color}
						/>
					) : null}

					{/* Advanced: full tuning controls */}
					{s.advanced ? (
						<CollapsibleSection
							title={t.sfx_advanced}
							defaultOpen={false}
							dense
						>
							<div className="flex flex-col gap-3">
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
									<Slider
										label={t.sfx_edge_glow_thickness}
										hint={t.sfx_edge_glow_thickness_hint}
										value={s.thickness}
										min={1}
										max={24}
										step={0.5}
										onChange={set.thickness}
										defaultValue={defaults.thickness}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={t.sfx_edge_glow_radius}
										hint={t.sfx_edge_glow_radius_hint}
										value={s.radius}
										min={0}
										max={64}
										step={1}
										onChange={set.radius}
										defaultValue={defaults.radius}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={t.sfx_edge_glow_expansion}
										hint={t.sfx_edge_glow_expansion_hint}
										value={s.expansionRadius}
										min={0}
										max={80}
										step={1}
										onChange={set.expansionRadius}
										defaultValue={defaults.expansionRadius}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={t.sfx_edge_glow_opacity}
										value={s.opacity}
										min={0}
										max={1}
										step={0.01}
										onChange={set.opacity}
										defaultValue={defaults.opacity}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={t.sfx_edge_glow_threshold}
										hint={t.sfx_edge_glow_threshold_hint}
										value={s.threshold}
										min={0.05}
										max={0.95}
										step={0.01}
										onChange={set.threshold}
										defaultValue={defaults.threshold}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={t.sfx_edge_glow_sensitivity}
										value={s.sensitivity}
										min={0}
										max={8}
										step={0.1}
										onChange={set.sensitivity}
										defaultValue={defaults.sensitivity}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={t.sfx_edge_glow_attack}
										value={s.attack}
										min={0}
										max={1.5}
										step={0.01}
										onChange={set.attack}
										defaultValue={defaults.attack}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={t.sfx_edge_glow_release}
										value={s.release}
										min={0.01}
										max={2}
										step={0.01}
										onChange={set.release}
										defaultValue={defaults.release}
										variant="compact"
										formatValue={formatDecimal}
									/>
								</div>
								<SegmentedControl<StageLightsBlendMode>
									value={s.blendMode}
									onChange={set.blendMode}
									options={[
										{
											value: 'lighter',
											label: t.sfx_blend_add
										},
										{
											value: 'screen',
											label: t.sfx_blend_screen
										},
										{
											value: 'source-over',
											label: t.sfx_blend_normal
										}
									]}
									size="sm"
									full
								/>
							</div>
						</CollapsibleSection>
					) : null}
				</div>
			) : null}
		</SectionCard>
	);
}
