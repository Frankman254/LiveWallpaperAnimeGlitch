import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
	AUDIO_REACTIVE_CHANNELS
} from '@/lib/audio/audioChannels';
import {
	doProfileSettingsMatch,
	extractMotionProfileSettings
} from '@/lib/featureProfiles';
import { PARTICLE_LIMITS } from '@/lib/constants';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';
import {
	PARTICLE_FILTER_RANGES,
	PARTICLE_RANGES
} from '@/config/ranges';
import type {
	AudioReactiveChannel,
	ColorSourceMode,
	ParticleColorMode,
	ParticleLayerMode,
	ParticleRotationDirection,
	ParticleShape,
	RainColorMode,
	RainParticleType,
	WallpaperState
} from '@/types/wallpaper';
import {
	CollapsibleSection,
	SectionCard,
	Slider,
	UI_COLORS
} from '@/ui';
import { useDialog } from '../../ui/DialogProvider';
import { MotionProfilesSection } from './motion/MotionProfilesSection';
import {
	ColorField,
	OptionButtonGroup,
	ProfileSlotsGrid,
	SwitchRow
} from './motion/MotionSharedControls';
import { ParticlesLayerSection } from './motion/ParticlesLayerSection';
import { RainSection } from './motion/RainSection';
import {
	COLOR_SOURCES,
	PARTICLE_COLOR_MODES,
	PARTICLE_ROTATION_DIRECTIONS,
	formatDecimal,
	formatInteger,
	sharedColorSource
} from './motion/motionTabUtils';

export default function ModernMotionTab({
	onResetParticles,
	onResetRain
}: {
	onResetParticles: () => void;
	onResetRain: () => void;
}) {
	const t = useT();
	const { confirm } = useDialog();
	const store = useWallpaperStore(
		useShallow(s => ({
			performanceMode: s.performanceMode,
			motionProfileSlots: s.motionProfileSlots,
			loadMotionProfileSlot: s.loadMotionProfileSlot,
			saveMotionProfileSlot: s.saveMotionProfileSlot,
			addMotionProfileSlot: s.addMotionProfileSlot,
			removeMotionProfileSlot: s.removeMotionProfileSlot,
			setMotionColorSources: s.setMotionColorSources,
			particlesEnabled: s.particlesEnabled,
			particleLayerMode: s.particleLayerMode,
			particleShape: s.particleShape,
			particleCount: s.particleCount,
			particleSpeed: s.particleSpeed,
			particleColorMode: s.particleColorMode,
			particleColorSource: s.particleColorSource,
			particleColor1: s.particleColor1,
			particleColor2: s.particleColor2,
			particleOpacity: s.particleOpacity,
			particleSizeMin: s.particleSizeMin,
			particleSizeMax: s.particleSizeMax,
			particleFadeInOut: s.particleFadeInOut,
			particleGlow: s.particleGlow,
			particleGlowStrength: s.particleGlowStrength,
			particleRotationIntensity: s.particleRotationIntensity,
			particleRotationDirection: s.particleRotationDirection,
			particleFilterBrightness: s.particleFilterBrightness,
			particleFilterContrast: s.particleFilterContrast,
			particleFilterSaturation: s.particleFilterSaturation,
			particleFilterBlur: s.particleFilterBlur,
			particleFilterHueRotate: s.particleFilterHueRotate,
			particleScanlineIntensity: s.particleScanlineIntensity,
			particleScanlineSpacing: s.particleScanlineSpacing,
			particleScanlineThickness: s.particleScanlineThickness,
			particleAudioReactive: s.particleAudioReactive,
			particleAudioChannel: s.particleAudioChannel,
			particleAudioSizeBoost: s.particleAudioSizeBoost,
			particleAudioOpacityBoost: s.particleAudioOpacityBoost,
			particlesProfileSlots: s.particlesProfileSlots,
			setParticlesEnabled: s.setParticlesEnabled,
			setParticleLayerMode: s.setParticleLayerMode,
			setParticleShape: s.setParticleShape,
			setParticleCount: s.setParticleCount,
			setParticleSpeed: s.setParticleSpeed,
			setParticleColorMode: s.setParticleColorMode,
			setParticleColorSource: s.setParticleColorSource,
			setParticleColor1: s.setParticleColor1,
			setParticleColor2: s.setParticleColor2,
			setParticleOpacity: s.setParticleOpacity,
			setParticleSizeMin: s.setParticleSizeMin,
			setParticleSizeMax: s.setParticleSizeMax,
			setParticleFadeInOut: s.setParticleFadeInOut,
			setParticleGlow: s.setParticleGlow,
			setParticleGlowStrength: s.setParticleGlowStrength,
			setParticleRotationIntensity: s.setParticleRotationIntensity,
			setParticleRotationDirection: s.setParticleRotationDirection,
			setParticleFilterBrightness: s.setParticleFilterBrightness,
			setParticleFilterContrast: s.setParticleFilterContrast,
			setParticleFilterSaturation: s.setParticleFilterSaturation,
			setParticleFilterBlur: s.setParticleFilterBlur,
			setParticleFilterHueRotate: s.setParticleFilterHueRotate,
			setParticleScanlineIntensity: s.setParticleScanlineIntensity,
			setParticleScanlineSpacing: s.setParticleScanlineSpacing,
			setParticleScanlineThickness: s.setParticleScanlineThickness,
			setParticleAudioReactive: s.setParticleAudioReactive,
			setParticleAudioChannel: s.setParticleAudioChannel,
			setParticleAudioSizeBoost: s.setParticleAudioSizeBoost,
			setParticleAudioOpacityBoost: s.setParticleAudioOpacityBoost,
			loadParticlesProfileSlot: s.loadParticlesProfileSlot,
			saveParticlesProfileSlot: s.saveParticlesProfileSlot,
			addParticlesProfileSlot: s.addParticlesProfileSlot,
			removeParticlesProfileSlot: s.removeParticlesProfileSlot,
			rainEnabled: s.rainEnabled,
			rainIntensity: s.rainIntensity,
			rainDropCount: s.rainDropCount,
			rainSpeed: s.rainSpeed,
			rainAngle: s.rainAngle,
			rainMeshRotationZ: s.rainMeshRotationZ,
			rainColorSource: s.rainColorSource,
			rainColor: s.rainColor,
			rainColorMode: s.rainColorMode,
			rainParticleType: s.rainParticleType,
			rainLength: s.rainLength,
			rainWidth: s.rainWidth,
			rainBlur: s.rainBlur,
			rainVariation: s.rainVariation,
			rainProfileSlots: s.rainProfileSlots,
			setRainEnabled: s.setRainEnabled,
			setRainIntensity: s.setRainIntensity,
			setRainDropCount: s.setRainDropCount,
			setRainSpeed: s.setRainSpeed,
			setRainAngle: s.setRainAngle,
			setRainMeshRotationZ: s.setRainMeshRotationZ,
			setRainColorSource: s.setRainColorSource,
			setRainColor: s.setRainColor,
			setRainColorMode: s.setRainColorMode,
			setRainParticleType: s.setRainParticleType,
			setRainLength: s.setRainLength,
			setRainWidth: s.setRainWidth,
			setRainBlur: s.setRainBlur,
			setRainVariation: s.setRainVariation,
			loadRainProfileSlot: s.loadRainProfileSlot,
			saveRainProfileSlot: s.saveRainProfileSlot,
			addRainProfileSlot: s.addRainProfileSlot,
			removeRainProfileSlot: s.removeRainProfileSlot
		}))
	);

	const fullStore = useWallpaperStore.getState() as WallpaperState;
	const currentMotion = extractMotionProfileSettings(fullStore);
	const activeMotionIndex = store.motionProfileSlots.findIndex(slot =>
		doProfileSettingsMatch(currentMotion, slot.values)
	);
	const motionColorSource = sharedColorSource([
		store.particleColorSource,
		store.rainColorSource
	]);
	const particleLimit = PARTICLE_LIMITS[store.performanceMode];
	const effectiveParticleCount = Math.min(
		store.particleCount,
		particleLimit
	);

	const colorSourceLabels = useMemo(
		() =>
			({
				manual: t.label_manual_color,
				image: t.label_current_image,
				theme: t.label_theme
			}) satisfies Record<ColorSourceMode, string>,
		[t]
	);
	const particleColorModeLabels = useMemo(
		() =>
			({
				solid: t.particle_color_solid,
				gradient: t.particle_color_gradient,
				rainbow: t.particle_color_rainbow,
				rotateRgb: t.particle_color_rotate_rgb
			}) satisfies Record<ParticleColorMode, string>,
		[t]
	);
	const particleShapeLabels = useMemo(
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
	const particleRotationLabels = useMemo(
		() =>
			({
				clockwise: t.particle_rotation_cw,
				counterclockwise: t.particle_rotation_ccw
			}) satisfies Record<ParticleRotationDirection, string>,
		[t]
	);
	const audioChannelLabels = useMemo(
		() =>
			({
				auto: t.channel_auto,
				kick: t.channel_kick,
				instrumental: t.channel_instrumental,
				bass: t.channel_bass,
				hihat: t.channel_hihat,
				vocal: t.channel_vocal,
				full: t.channel_full
			}) satisfies Record<AudioReactiveChannel, string>,
		[t]
	);

	async function handleSaveMotionSlot(index: number) {
		const slot = store.motionProfileSlots[index];
		if (slot?.values) {
			const ok = await confirm({
				title: t.label_save_profile,
				message: t.confirm_overwrite_profile,
				confirmLabel: t.label_save_profile,
				cancelLabel: t.label_cancel,
				tone: 'warning'
			});
			if (!ok) return;
		}
		store.saveMotionProfileSlot(index);
	}

	return (
		<div className="flex flex-col gap-2">
			<SectionCard
				title={t.tab_motion}
				subtitle={t.section_motion_profiles}
				density="compact"
			>
				<div className="flex flex-col gap-3">
					<OptionButtonGroup<ColorSourceMode>
						label={t.label_color_source}
						options={COLOR_SOURCES}
						value={motionColorSource}
						onChange={store.setMotionColorSources}
						labels={colorSourceLabels}
						columns={3}
					/>
					<ProfileSlotsGrid
						slots={store.motionProfileSlots}
						activeIndex={activeMotionIndex >= 0 ? activeMotionIndex : null}
						onLoad={store.loadMotionProfileSlot}
						onSave={index => void handleSaveMotionSlot(index)}
						onAdd={store.addMotionProfileSlot}
						onDelete={store.removeMotionProfileSlot}
						loadLabel={t.label_load_profile}
						saveLabel={t.label_save_profile}
						slotLabel={t.tab_motion}
						emptyLabel={t.profile_slot_empty}
						activeLabel={t.profile_slot_active}
						maxSlots={MAX_MOTION_PROFILE_SLOTS}
					/>
				</div>
			</SectionCard>

			<SectionCard
				title={t.section_particles_layer_density}
				subtitle={`${effectiveParticleCount}/${particleLimit} active particles`}
				action={
					<div className="flex items-center gap-1.5">
						<ToggleSwitch
							checked={store.particlesEnabled}
							onChange={store.setParticlesEnabled}
							size="sm"
							ariaLabel={t.label_enabled}
						/>
						<IconButton
							size="sm"
							density="compact"
							onClick={onResetParticles}
							title={t.reset_tab}
						>
							<RotateCcw size={ICON_SIZE.xs} />
						</IconButton>
					</div>
				}
				density="compact"
			>
				<div className="flex flex-col gap-3">
					<OptionButtonGroup<ParticleLayerMode>
						label={t.label_layer_mode}
						options={PARTICLE_LAYER_MODES}
						value={store.particleLayerMode}
						onChange={store.setParticleLayerMode}
						columns={3}
					/>
					<OptionButtonGroup<ParticleShape>
						label={t.label_particle_shape}
						options={PARTICLE_SHAPES}
						value={store.particleShape}
						onChange={store.setParticleShape}
						labels={particleShapeLabels}
					/>
					<Slider
						label={t.label_count}
						value={store.particleCount}
						{...PARTICLE_RANGES.count}
						onChange={store.setParticleCount}
						variant="macro"
						formatValue={formatInteger}
						valueDisplay={
							effectiveParticleCount !== store.particleCount
								? `${formatInteger(store.particleCount)} / ${effectiveParticleCount}`
								: formatInteger(store.particleCount)
						}
					/>
					<Slider
						label={t.label_speed}
						value={store.particleSpeed}
						{...PARTICLE_RANGES.speed}
						onChange={store.setParticleSpeed}
						variant="compact"
						formatValue={formatDecimal}
					/>
				</div>
			</SectionCard>

			<SectionCard
				title={t.section_appearance}
				subtitle="Particle color, surface, glow, and filters"
				density="compact"
			>
				<div className="flex flex-col gap-3">
					<OptionButtonGroup<ParticleColorMode>
						label={t.label_color_mode}
						options={PARTICLE_COLOR_MODES}
						value={store.particleColorMode}
						onChange={store.setParticleColorMode}
						labels={particleColorModeLabels}
						columns={2}
					/>
					<OptionButtonGroup<ColorSourceMode>
						label={t.label_color_source}
						options={COLOR_SOURCES}
						value={store.particleColorSource}
						onChange={store.setParticleColorSource}
						labels={colorSourceLabels}
						columns={3}
					/>
					{store.particleColorSource === 'manual' &&
					store.particleColorMode !== 'rainbow' &&
					store.particleColorMode !== 'rotateRgb' ? (
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<ColorField
								label={t.label_color_1}
								value={store.particleColor1}
								onChange={store.setParticleColor1}
							/>
							<ColorField
								label={t.label_color_2}
								value={store.particleColor2}
								onChange={store.setParticleColor2}
							/>
						</div>
					) : (
						<span
							className="text-[11px]"
							style={{ color: UI_COLORS.fgMute }}
						>
							{store.particleColorSource === 'theme'
								? t.hint_theme_palette_auto
								: t.hint_background_palette_auto}
						</span>
					)}
					<Slider
						label={t.label_opacity}
						value={store.particleOpacity}
						{...PARTICLE_RANGES.opacity}
						onChange={store.setParticleOpacity}
						variant="compact"
						formatValue={formatDecimal}
					/>
					<CollapsibleSection
						title="Particle details"
						defaultOpen={false}
						dense
					>
						<div className="flex flex-col gap-3">
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<Slider
									label={t.label_size_min}
									value={store.particleSizeMin}
									{...PARTICLE_RANGES.sizeMin}
									onChange={store.setParticleSizeMin}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label={t.label_size_max}
									value={store.particleSizeMax}
									{...PARTICLE_RANGES.sizeMax}
									onChange={store.setParticleSizeMax}
									variant="compact"
									formatValue={formatDecimal}
								/>
							</div>
							<SwitchRow
								label={t.label_fade_in_out}
								checked={store.particleFadeInOut}
								onChange={store.setParticleFadeInOut}
							/>
							<SwitchRow
								label={t.label_glow}
								checked={store.particleGlow}
								onChange={store.setParticleGlow}
							/>
							{store.particleGlow ? (
								<Slider
									label={t.label_glow_strength}
									value={store.particleGlowStrength}
									{...PARTICLE_RANGES.glowStrength}
									onChange={store.setParticleGlowStrength}
									variant="compact"
									formatValue={formatDecimal}
								/>
							) : null}
						</div>
					</CollapsibleSection>
					<CollapsibleSection
						title={t.section_particle_motion_filters}
						defaultOpen={false}
						dense
					>
						<div className="flex flex-col gap-3">
							<Slider
								label={t.label_rotation_intensity}
								value={store.particleRotationIntensity}
								{...PARTICLE_RANGES.rotationIntensity}
								onChange={store.setParticleRotationIntensity}
								variant="compact"
								formatValue={formatDecimal}
							/>
							{store.particleRotationIntensity > 0 ? (
								<OptionButtonGroup<ParticleRotationDirection>
									label={t.label_direction}
									options={PARTICLE_ROTATION_DIRECTIONS}
									value={store.particleRotationDirection}
									onChange={store.setParticleRotationDirection}
									labels={particleRotationLabels}
									columns={2}
								/>
							) : null}
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<Slider
									label={t.label_brightness}
									value={store.particleFilterBrightness}
									{...PARTICLE_FILTER_RANGES.brightness}
									onChange={store.setParticleFilterBrightness}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label={t.label_contrast}
									value={store.particleFilterContrast}
									{...PARTICLE_FILTER_RANGES.contrast}
									onChange={store.setParticleFilterContrast}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label={t.label_saturation}
									value={store.particleFilterSaturation}
									{...PARTICLE_FILTER_RANGES.saturation}
									onChange={store.setParticleFilterSaturation}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label={t.label_blur}
									value={store.particleFilterBlur}
									{...PARTICLE_FILTER_RANGES.blur}
									onChange={store.setParticleFilterBlur}
									unit="px"
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label={t.label_hue_rotate}
									value={store.particleFilterHueRotate}
									{...PARTICLE_FILTER_RANGES.hueRotate}
									onChange={store.setParticleFilterHueRotate}
									unit="deg"
									variant="compact"
									formatValue={formatInteger}
								/>
							</div>
							<Slider
								label={t.label_scanlines}
								value={store.particleScanlineIntensity}
								{...PARTICLE_RANGES.scanlineIntensity}
								onChange={store.setParticleScanlineIntensity}
								variant="compact"
								formatValue={formatDecimal}
							/>
							{store.particleScanlineIntensity > 0 ? (
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
									<Slider
										label={t.label_spacing}
										value={store.particleScanlineSpacing}
										{...PARTICLE_RANGES.scanlineSpacing}
										onChange={store.setParticleScanlineSpacing}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={t.label_thickness}
										value={store.particleScanlineThickness}
										{...PARTICLE_RANGES.scanlineThickness}
										onChange={store.setParticleScanlineThickness}
										variant="compact"
										formatValue={formatDecimal}
									/>
								</div>
							) : null}
						</div>
					</CollapsibleSection>
					<CollapsibleSection
						title={t.section_particle_audio_response}
						defaultOpen={false}
						dense
					>
						<div className="flex flex-col gap-3">
							<SwitchRow
								label={t.label_audio_reactive}
								checked={store.particleAudioReactive}
								onChange={store.setParticleAudioReactive}
							/>
							{store.particleAudioReactive ? (
								<>
									<OptionButtonGroup<AudioReactiveChannel>
										label={t.label_audio_channel}
										options={AUDIO_REACTIVE_CHANNELS}
										value={store.particleAudioChannel}
										onChange={store.setParticleAudioChannel}
										labels={audioChannelLabels}
										columns={3}
									/>
									<Slider
										label={t.label_audio_size_boost}
										value={store.particleAudioSizeBoost}
										{...PARTICLE_RANGES.audioSizeBoost}
										onChange={store.setParticleAudioSizeBoost}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={t.label_audio_opacity_boost}
										value={store.particleAudioOpacityBoost}
										{...PARTICLE_RANGES.audioOpacityBoost}
										onChange={store.setParticleAudioOpacityBoost}
										variant="compact"
										formatValue={formatDecimal}
									/>
								</>
							) : null}
						</div>
					</CollapsibleSection>
					<CollapsibleSection
						title={t.section_saved_profiles}
						defaultOpen={false}
						dense
					>
						<ProfileSlotsGrid
							slots={store.particlesProfileSlots}
							activeIndex={null}
							onLoad={store.loadParticlesProfileSlot}
							onSave={store.saveParticlesProfileSlot}
							onAdd={store.addParticlesProfileSlot}
							onDelete={store.removeParticlesProfileSlot}
							loadLabel={t.label_load_profile}
							saveLabel={t.label_save_profile}
							slotLabel={t.label_profile_slot}
							emptyLabel={t.profile_slot_empty}
							activeLabel={t.profile_slot_active}
						/>
					</CollapsibleSection>
				</div>
			</SectionCard>

			<SectionCard
				title={t.tab_rain}
				subtitle={t.hint_rain_low_perf}
				action={
					<div className="flex items-center gap-1.5">
						<ToggleSwitch
							checked={store.rainEnabled}
							onChange={store.setRainEnabled}
							size="sm"
							ariaLabel={t.label_rain_enabled}
						/>
						<IconButton
							size="sm"
							density="compact"
							onClick={onResetRain}
							title={t.reset_tab}
						>
							<RotateCcw size={ICON_SIZE.xs} />
						</IconButton>
					</div>
				}
				density="compact"
			>
				<div className="flex flex-col gap-3">
					<Slider
						label={t.label_rain_intensity}
						value={store.rainIntensity}
						{...RAIN_RANGES.intensity}
						onChange={store.setRainIntensity}
						variant="macro"
						formatValue={formatDecimal}
					/>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
						<Slider
							label={t.label_rain_count}
							value={store.rainDropCount}
							{...RAIN_RANGES.dropCount}
							onChange={store.setRainDropCount}
							variant="compact"
							formatValue={formatInteger}
						/>
						<Slider
							label={t.label_rain_speed}
							value={store.rainSpeed}
							{...RAIN_RANGES.speed}
							onChange={store.setRainSpeed}
							variant="compact"
							formatValue={formatDecimal}
						/>
					</div>
					<CollapsibleSection
						title={t.section_rain_direction}
						defaultOpen={false}
						dense
					>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<Slider
								label={t.label_rain_angle}
								value={store.rainAngle}
								{...RAIN_RANGES.angle}
								onChange={store.setRainAngle}
								unit="deg"
								variant="compact"
								formatValue={formatInteger}
							/>
							<Slider
								label={t.label_rain_rotation_z}
								value={store.rainMeshRotationZ}
								{...RAIN_RANGES.meshRotationZ}
								onChange={store.setRainMeshRotationZ}
								unit="deg"
								variant="compact"
								formatValue={formatInteger}
							/>
						</div>
					</CollapsibleSection>
					<CollapsibleSection
						title={t.section_rain_style}
						defaultOpen={false}
						dense
					>
						<div className="flex flex-col gap-3">
							<OptionButtonGroup<ColorSourceMode>
								label={t.label_color_source}
								options={COLOR_SOURCES}
								value={store.rainColorSource}
								onChange={store.setRainColorSource}
								labels={colorSourceLabels}
								columns={3}
							/>
							{store.rainColorSource === 'manual' ? (
								<ColorField
									label={t.label_rain_color}
									value={store.rainColor}
									onChange={store.setRainColor}
								/>
							) : (
								<span
									className="text-[11px]"
									style={{ color: UI_COLORS.fgMute }}
								>
									{store.rainColorSource === 'theme'
										? t.hint_theme_palette_auto
										: t.hint_background_palette_auto}
								</span>
							)}
							<OptionButtonGroup<RainColorMode>
								label={t.label_color_mode}
								options={RAIN_COLOR_MODES}
								value={store.rainColorMode}
								onChange={store.setRainColorMode}
								columns={2}
							/>
							<OptionButtonGroup<RainParticleType>
								label={t.label_rain_type}
								options={RAIN_PARTICLE_TYPES}
								value={store.rainParticleType}
								onChange={store.setRainParticleType}
								columns={2}
							/>
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<Slider
									label={t.label_rain_length}
									value={store.rainLength}
									{...RAIN_RANGES.length}
									onChange={store.setRainLength}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label={t.label_rain_width}
									value={store.rainWidth}
									{...RAIN_RANGES.width}
									onChange={store.setRainWidth}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label={t.label_rain_blur}
									value={store.rainBlur}
									{...RAIN_RANGES.blur}
									onChange={store.setRainBlur}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label={t.label_variation}
									value={store.rainVariation}
									{...RAIN_RANGES.variation}
									onChange={store.setRainVariation}
									variant="compact"
									formatValue={formatDecimal}
								/>
							</div>
						</div>
					</CollapsibleSection>
					<CollapsibleSection
						title={t.section_saved_profiles}
						defaultOpen={false}
						dense
					>
						<ProfileSlotsGrid
							slots={store.rainProfileSlots}
							activeIndex={null}
							onLoad={store.loadRainProfileSlot}
							onSave={store.saveRainProfileSlot}
							onAdd={store.addRainProfileSlot}
							onDelete={store.removeRainProfileSlot}
							loadLabel={t.label_load_profile}
							saveLabel={t.label_save_profile}
							slotLabel={t.label_profile_slot}
							emptyLabel={t.profile_slot_empty}
							activeLabel={t.profile_slot_active}
						/>
					</CollapsibleSection>
				</div>
			</SectionCard>
		</div>
	);
}
