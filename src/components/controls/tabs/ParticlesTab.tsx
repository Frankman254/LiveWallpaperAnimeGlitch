import { useMemo } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { PARTICLE_LIMITS } from '@/lib/constants';
import { PARTICLE_RANGES, PARTICLE_FILTER_RANGES } from '@/config/ranges';
import type {
	ColorSourceMode,
	ParticleColorMode,
	ParticleLayerMode,
	ParticleRotationDirection,
	ParticleShape
} from '@/types/wallpaper';
import SliderControl from '../SliderControl';
import ToggleControl from '../ToggleControl';
import EnumButtons from '../ui/EnumButtons';
import ColorInput from '../ui/ColorInput';
import ResetButton from '../ui/ResetButton';
import AudioChannelSelector from '../ui/AudioChannelSelector';
import TabSection from '../ui/TabSection';

const COLOR_MODES: ParticleColorMode[] = [
	'solid',
	'gradient',
	'rainbow',
	'rotateRgb'
];
const COLOR_SOURCES: ColorSourceMode[] = ['manual', 'background', 'theme'];
const LAYER_MODES: ParticleLayerMode[] = ['background', 'foreground', 'both'];
const SHAPES: ParticleShape[] = [
	'circles',
	'squares',
	'triangles',
	'stars',
	'plus',
	'minus',
	'diamonds',
	'cross',
	'all'
];
const ROTATION_DIRECTIONS: ParticleRotationDirection[] = [
	'clockwise',
	'counterclockwise'
];

export default function ParticlesTab({ onReset }: { onReset: () => void }) {
	const t = useT();
	const store = useWallpaperStore();
	const limit = PARTICLE_LIMITS[store.performanceMode];
	const effectiveCount = Math.min(store.particleCount, limit);
	const colorModeLabels = useMemo(
		() =>
			({
				solid: t.particle_color_solid,
				gradient: t.particle_color_gradient,
				rainbow: t.particle_color_rainbow,
				rotateRgb: t.particle_color_rotate_rgb
			}) satisfies Record<ParticleColorMode, string>,
		[t]
	);
	const shapeLabels = useMemo(
		() =>
			({
				circles: t.particle_shape_circle,
				squares: t.particle_shape_square,
				triangles: t.particle_shape_triangle,
				stars: t.particle_shape_star,
				plus: t.particle_shape_plus,
				minus: t.particle_shape_minus,
				diamonds: t.particle_shape_diamond,
				cross: t.particle_shape_cross,
				all: t.particle_shape_mix
			}) satisfies Record<ParticleShape, string>,
		[t]
	);
	const rotationDirectionLabels = useMemo(
		() =>
			({
				clockwise: t.particle_rotation_cw,
				counterclockwise: t.particle_rotation_ccw
			}) satisfies Record<ParticleRotationDirection, string>,
		[t]
	);
	const perfModeShort =
		store.performanceMode === 'low'
			? t.perf_mode_short_low
			: store.performanceMode === 'medium'
				? t.perf_mode_short_medium
				: t.perf_mode_short_high;
	const countCapTooltip = t.hint_particle_count_cap
		.replace('{limit}', String(limit))
		.replace('{mode}', perfModeShort);
	return (
		<>
			<ResetButton label={t.reset_tab} onClick={onReset} />
			<TabSection title={t.section_particles_layer_density}>
				<ToggleControl
					label={t.label_enabled}
					value={store.particlesEnabled}
					onChange={store.setParticlesEnabled}
				/>
				<div className="flex flex-col gap-1">
					<span
						className="text-xs"
						style={{ color: 'var(--editor-accent-soft)' }}
					>
						{t.label_layer_mode}
					</span>
					<EnumButtons<ParticleLayerMode>
						options={LAYER_MODES}
						value={store.particleLayerMode}
						onChange={store.setParticleLayerMode}
					/>
				</div>
				<div className="flex flex-col gap-1">
					<span
						className="text-xs"
						style={{ color: 'var(--editor-accent-soft)' }}
					>
						{t.label_particle_shape}
					</span>
					<EnumButtons<ParticleShape>
						options={SHAPES}
						value={store.particleShape}
						onChange={store.setParticleShape}
						labels={shapeLabels}
					/>
				</div>
				<SliderControl
					label={t.label_count}
					value={store.particleCount}
					{...PARTICLE_RANGES.count}
					onChange={store.setParticleCount}
					effectiveValue={
						effectiveCount !== store.particleCount
							? effectiveCount
							: undefined
					}
					tooltip={countCapTooltip}
				/>
				<SliderControl
					label={t.label_speed}
					value={store.particleSpeed}
					{...PARTICLE_RANGES.speed}
					onChange={store.setParticleSpeed}
				/>
			</TabSection>

			<TabSection title={t.section_appearance}>
				<div className="flex flex-col gap-1">
					<span
						className="text-xs"
						style={{ color: 'var(--editor-accent-soft)' }}
					>
						{t.label_color_mode}
					</span>
					<EnumButtons<ParticleColorMode>
						options={COLOR_MODES}
						value={store.particleColorMode}
						onChange={store.setParticleColorMode}
						labels={colorModeLabels}
					/>
				</div>
				<div className="flex flex-col gap-1">
					<span
						className="text-xs"
						style={{ color: 'var(--editor-accent-soft)' }}
					>
						{t.label_color_source}
					</span>
					<EnumButtons<ColorSourceMode>
						options={COLOR_SOURCES}
						value={store.particleColorSource}
						onChange={store.setParticleColorSource}
						labels={{
							manual: t.label_manual_color,
							background: t.label_current_image,
							theme: t.label_theme
						}}
					/>
				</div>
				{store.particleColorSource === 'manual' &&
				store.particleColorMode !== 'rainbow' &&
				store.particleColorMode !== 'rotateRgb' ? (
					<>
						<ColorInput
							label={t.label_color_1}
							value={store.particleColor1}
							onChange={store.setParticleColor1}
						/>
						<ColorInput
							label={t.label_color_2}
							value={store.particleColor2}
							onChange={store.setParticleColor2}
						/>
					</>
				) : (
					<span
						className="text-[11px]"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						{store.particleColorSource === 'theme'
							? t.hint_theme_palette_auto
							: t.hint_background_palette_auto}
					</span>
				)}
				<SliderControl
					label={t.label_opacity}
					value={store.particleOpacity}
					{...PARTICLE_RANGES.opacity}
					onChange={store.setParticleOpacity}
				/>
				<div className="grid grid-cols-2 gap-3">
					<SliderControl
						label={t.label_size_min}
						value={store.particleSizeMin}
						{...PARTICLE_RANGES.sizeMin}
						onChange={store.setParticleSizeMin}
					/>
					<SliderControl
						label={t.label_size_max}
						value={store.particleSizeMax}
						{...PARTICLE_RANGES.sizeMax}
						onChange={store.setParticleSizeMax}
					/>
				</div>
				<ToggleControl
					label={t.label_fade_in_out}
					value={store.particleFadeInOut}
					onChange={store.setParticleFadeInOut}
				/>
				<ToggleControl
					label={t.label_glow}
					value={store.particleGlow}
					onChange={store.setParticleGlow}
				/>
				{store.particleGlow ? (
					<SliderControl
						label={t.label_glow_strength}
						value={store.particleGlowStrength}
						{...PARTICLE_RANGES.glowStrength}
						onChange={store.setParticleGlowStrength}
					/>
				) : null}
			</TabSection>

			<TabSection title={t.section_particle_motion_filters}>
				<SliderControl
					label={t.label_rotation_intensity}
					value={store.particleRotationIntensity}
					{...PARTICLE_RANGES.rotationIntensity}
					onChange={store.setParticleRotationIntensity}
				/>
				{store.particleRotationIntensity > 0 ? (
					<div className="flex flex-col gap-1">
						<span
							className="text-xs"
							style={{ color: 'var(--editor-accent-soft)' }}
						>
							{t.label_direction}
						</span>
						<EnumButtons<ParticleRotationDirection>
							options={ROTATION_DIRECTIONS}
							value={store.particleRotationDirection}
							onChange={store.setParticleRotationDirection}
							labels={rotationDirectionLabels}
						/>
					</div>
				) : null}
				<SliderControl
					label={t.label_brightness}
					value={store.particleFilterBrightness}
					{...PARTICLE_FILTER_RANGES.brightness}
					onChange={store.setParticleFilterBrightness}
				/>
				<SliderControl
					label={t.label_contrast}
					value={store.particleFilterContrast}
					{...PARTICLE_FILTER_RANGES.contrast}
					onChange={store.setParticleFilterContrast}
				/>
				<SliderControl
					label={t.label_saturation}
					value={store.particleFilterSaturation}
					{...PARTICLE_FILTER_RANGES.saturation}
					onChange={store.setParticleFilterSaturation}
				/>
				<SliderControl
					label={t.label_blur}
					value={store.particleFilterBlur}
					{...PARTICLE_FILTER_RANGES.blur}
					onChange={store.setParticleFilterBlur}
					unit="px"
				/>
				<SliderControl
					label={t.label_hue_rotate}
					value={store.particleFilterHueRotate}
					{...PARTICLE_FILTER_RANGES.hueRotate}
					onChange={store.setParticleFilterHueRotate}
					unit="deg"
				/>
				<SliderControl
					label={t.label_scanlines}
					value={store.particleScanlineIntensity}
					{...PARTICLE_RANGES.scanlineIntensity}
					onChange={store.setParticleScanlineIntensity}
				/>
				{store.particleScanlineIntensity > 0 ? (
					<div className="grid grid-cols-2 gap-3">
						<SliderControl
							label={t.label_spacing}
							value={store.particleScanlineSpacing}
							{...PARTICLE_RANGES.scanlineSpacing}
							onChange={store.setParticleScanlineSpacing}
						/>
						<SliderControl
							label={t.label_thickness}
							value={store.particleScanlineThickness}
							{...PARTICLE_RANGES.scanlineThickness}
							onChange={store.setParticleScanlineThickness}
						/>
					</div>
				) : null}
			</TabSection>

			<TabSection title={t.section_particle_audio_response}>
				<ToggleControl
					label={t.label_audio_reactive}
					value={store.particleAudioReactive}
					onChange={store.setParticleAudioReactive}
				/>
				{store.particleAudioReactive ? (
					<>
						<AudioChannelSelector
							value={store.particleAudioChannel}
							onChange={store.setParticleAudioChannel}
						/>
						<SliderControl
							label={t.label_audio_size_boost}
							value={store.particleAudioSizeBoost}
							{...PARTICLE_RANGES.audioSizeBoost}
							onChange={store.setParticleAudioSizeBoost}
						/>
						<SliderControl
							label={t.label_audio_opacity_boost}
							value={store.particleAudioOpacityBoost}
							{...PARTICLE_RANGES.audioOpacityBoost}
							onChange={store.setParticleAudioOpacityBoost}
						/>
					</>
				) : null}
			</TabSection>
		</>
	);
}
