import { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import {
	doProfileSettingsMatch,
	extractMotionProfileSettings
} from '@/lib/featureProfiles';
import { PARTICLE_LIMITS } from '@/lib/constants';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type {
	AudioReactiveChannel,
	ColorSourceMode,
	ParticleColorMode,
	ParticleRotationDirection,
	ParticleShape,
	WallpaperState
} from '@/types/wallpaper';
import { useDialog } from '../../ui/DialogProvider';
import {
	Button,
	EditorTabFooter,
	EditorTabHeader,
	EditorTabLayout,
	ICON_SIZE
} from '@/ui';
import { MotionProfilesSection } from './motion/MotionProfilesSection';
import { ParticlesAppearanceSection } from './motion/ParticlesAppearanceSection';
import { ParticlesLayerSection } from './motion/ParticlesLayerSection';
import { RainSection } from './motion/RainSection';
import { StageLightsSection } from './motion/StageLightsSection';
import { FlashLightSection } from './motion/FlashLightSection';
import { CameraMotionSection } from './motion/CameraFxSection';
import { ScreenShakeSection } from './motion/ScreenShakeSection';
import { sharedColorSource } from './motion/motionTabUtils';
import { useIsSimple } from '../../UIMode';

export default function ModernMotionTab({
	onResetParticles,
	onResetRain
}: {
	onResetParticles: () => void;
	onResetRain: () => void;
}) {
	const t = useT();
	const { confirm } = useDialog();
	const isSimple = useIsSimple();
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
			particleAudioReactive: s.particleAudioReactive,
			particleAudioChannel: s.particleAudioChannel,
			particleAudioSmoothing: s.particleAudioSmoothing,
			particleAudioSizeBoost: s.particleAudioSizeBoost,
			particleAudioOpacityBoost: s.particleAudioOpacityBoost,
			particleAudioAttack: s.particleAudioAttack,
			particleAudioRelease: s.particleAudioRelease,
			particleAudioReactivitySpeed: s.particleAudioReactivitySpeed,
			particleAudioPeakWindow: s.particleAudioPeakWindow,
			particleAudioPeakFloor: s.particleAudioPeakFloor,
			particleAudioPunch: s.particleAudioPunch,
			particleAudioDriftEnabled: s.particleAudioDriftEnabled,
			particleAudioDriftAngle: s.particleAudioDriftAngle,
			particleAudioDriftAmount: s.particleAudioDriftAmount,
			particleAudioDriftBase: s.particleAudioDriftBase,
			particleAudioDriftChannel: s.particleAudioDriftChannel,
			particleAudioDriftThreshold: s.particleAudioDriftThreshold,
			particleAudioDriftRelease: s.particleAudioDriftRelease,
			particleAudioDriftMode: s.particleAudioDriftMode,
			particleDepthFlowEnabled: s.particleDepthFlowEnabled,
			particleDepthFlowAmount: s.particleDepthFlowAmount,
			particleDepthFlowDirection: s.particleDepthFlowDirection,
			particleDepthFlowChannel: s.particleDepthFlowChannel,
			particleDepthFlowThreshold: s.particleDepthFlowThreshold,
			particleDepthFlowSensitivity: s.particleDepthFlowSensitivity,
			particleDepthFlowAttack: s.particleDepthFlowAttack,
			particleDepthFlowRelease: s.particleDepthFlowRelease,
			particleDepthFlowSpeed: s.particleDepthFlowSpeed,
			particleDepthFlowSpread: s.particleDepthFlowSpread,
			particleDepthFlowFocusX: s.particleDepthFlowFocusX,
			particleDepthFlowFocusY: s.particleDepthFlowFocusY,
			particleDepthFlowMode: s.particleDepthFlowMode,
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
			setParticleAudioReactive: s.setParticleAudioReactive,
			setParticleAudioChannel: s.setParticleAudioChannel,
			setParticleAudioSmoothing: s.setParticleAudioSmoothing,
			setParticleAudioSizeBoost: s.setParticleAudioSizeBoost,
			setParticleAudioOpacityBoost: s.setParticleAudioOpacityBoost,
			setParticleAudioAttack: s.setParticleAudioAttack,
			setParticleAudioRelease: s.setParticleAudioRelease,
			setParticleAudioReactivitySpeed: s.setParticleAudioReactivitySpeed,
			setParticleAudioPeakWindow: s.setParticleAudioPeakWindow,
			setParticleAudioPeakFloor: s.setParticleAudioPeakFloor,
			setParticleAudioPunch: s.setParticleAudioPunch,
			setParticleAudioDriftEnabled: s.setParticleAudioDriftEnabled,
			setParticleAudioDriftAngle: s.setParticleAudioDriftAngle,
			setParticleAudioDriftAmount: s.setParticleAudioDriftAmount,
			setParticleAudioDriftBase: s.setParticleAudioDriftBase,
			setParticleAudioDriftChannel: s.setParticleAudioDriftChannel,
			setParticleAudioDriftThreshold: s.setParticleAudioDriftThreshold,
			setParticleAudioDriftRelease: s.setParticleAudioDriftRelease,
			setParticleAudioDriftMode: s.setParticleAudioDriftMode,
			setParticleDepthFlowEnabled: s.setParticleDepthFlowEnabled,
			setParticleDepthFlowAmount: s.setParticleDepthFlowAmount,
			setParticleDepthFlowDirection: s.setParticleDepthFlowDirection,
			setParticleDepthFlowChannel: s.setParticleDepthFlowChannel,
			setParticleDepthFlowThreshold: s.setParticleDepthFlowThreshold,
			setParticleDepthFlowSensitivity: s.setParticleDepthFlowSensitivity,
			setParticleDepthFlowAttack: s.setParticleDepthFlowAttack,
			setParticleDepthFlowRelease: s.setParticleDepthFlowRelease,
			setParticleDepthFlowSpeed: s.setParticleDepthFlowSpeed,
			setParticleDepthFlowSpread: s.setParticleDepthFlowSpread,
			setParticleDepthFlowFocusX: s.setParticleDepthFlowFocusX,
			setParticleDepthFlowFocusY: s.setParticleDepthFlowFocusY,
			setParticleDepthFlowMode: s.setParticleDepthFlowMode,
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
	const effectiveParticleCount = Math.min(store.particleCount, particleLimit);

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

	if (isSimple) {
		return (
			<EditorTabLayout header={<EditorTabHeader title={t.tab_motion} />}>
				<ParticlesLayerSection
					store={store}
					effectiveParticleCount={effectiveParticleCount}
					particleLimit={particleLimit}
					particleShapeLabels={particleShapeLabels}
					labels={{
						title: t.section_particles_layer_density,
						layerMode: t.label_layer_mode,
						particleShape: t.label_particle_shape,
						count: t.label_count,
						speed: t.label_speed,
						enabled: t.label_enabled
					}}
				/>

				{store.particlesEnabled ? (
					<ParticlesAppearanceSection
						store={store}
						particleColorModeLabels={particleColorModeLabels}
						colorSourceLabels={colorSourceLabels}
						particleRotationLabels={particleRotationLabels}
						audioChannelLabels={audioChannelLabels}
						labels={{
							title: t.section_appearance,
							subtitle:
								'Particle color, surface, glow, and filters',
							colorMode: t.label_color_mode,
							colorSource: t.label_color_source,
							color1: t.label_color_1,
							color2: t.label_color_2,
							themeHint: t.hint_theme_palette_auto,
							imageHint: t.hint_background_palette_auto,
							opacity: t.label_opacity,
							particleDetails: 'Particle details',
							sizeMin: t.label_size_min,
							sizeMax: t.label_size_max,
							fadeInOut: t.label_fade_in_out,
							glow: t.label_glow,
							glowStrength: t.label_glow_strength,
							motionFilters: t.section_particle_motion_filters,
							rotationIntensity: t.label_rotation_intensity,
							direction: t.label_direction,
							brightness: t.label_brightness,
							contrast: t.label_contrast,
							saturation: t.label_saturation,
							blur: t.label_blur,
							hueRotate: t.label_hue_rotate,
							audioResponse: t.section_particle_audio_response,
							audioReactive: t.label_audio_reactive,
							audioChannel: t.label_audio_channel,
							audioSizeBoost: t.label_audio_size_boost,
							audioOpacityBoost: t.label_audio_opacity_boost,
							audioDirectionalDrift: 'Audio Directional Drift',
							audioDirectionalDriftHint:
								'Pushes particles in a chosen direction based on the selected audio band.',
							audioDriftMode: 'Drift mode',
							audioDriftAngle: 'Direction angle',
							audioDriftAmount: 'Amount',
							audioDriftBase: 'Base drift',
							audioDriftThreshold: 'Threshold',
							audioDriftRelease: 'Release',
							depthFlow: 'Depth Flow',
							depthFlowHint:
								'Depth Flow moves particles toward or away from a focal point, creating a speed/warp effect.',
							depthFlowDirection: 'Direction',
							depthFlowMode: 'Mode',
							depthFlowAmount: 'Amount',
							depthFlowFocusX: 'Focus X',
							depthFlowFocusY: 'Focus Y',
							depthFlowThreshold: 'Threshold',
							depthFlowSensitivity: 'Sensitivity',
							depthFlowAttack: 'Attack',
							depthFlowRelease: 'Release',
							depthFlowSpeed: 'Depth speed',
							depthFlowSpread: 'Spread',
							savedProfiles: t.section_saved_profiles,
							load: t.label_load_profile,
							save: t.label_save_profile,
							slot: t.label_profile_slot,
							empty: t.profile_slot_empty,
							active: t.profile_slot_active
						}}
						isSimple
					/>
				) : null}

				<RainSection
					store={store}
					colorSourceLabels={colorSourceLabels}
					labels={{
						title: t.tab_rain,
						subtitle: t.hint_rain_low_perf,
						enabled: t.label_rain_enabled,
						intensity: t.label_rain_intensity,
						count: t.label_rain_count,
						speed: t.label_rain_speed,
						direction: t.section_rain_direction,
						angle: t.label_rain_angle,
						rotationZ: t.label_rain_rotation_z,
						style: t.section_rain_style,
						colorSource: t.label_color_source,
						color: t.label_rain_color,
						colorMode: t.label_color_mode,
						type: t.label_rain_type,
						length: t.label_rain_length,
						width: t.label_rain_width,
						blur: t.label_rain_blur,
						variation: t.label_variation,
						themeHint: t.hint_theme_palette_auto,
						imageHint: t.hint_background_palette_auto,
						savedProfiles: t.section_saved_profiles,
						load: t.label_load_profile,
						save: t.label_save_profile,
						slot: t.label_profile_slot,
						empty: t.profile_slot_empty,
						active: t.profile_slot_active
					}}
				/>

				<StageLightsSection />
				<FlashLightSection />
				<CameraMotionSection />
				<ScreenShakeSection />
			</EditorTabLayout>
		);
	}

	return (
		<EditorTabLayout
			header={<EditorTabHeader title={t.tab_motion} />}
			savedProfiles={
				<MotionProfilesSection
					store={store}
					motionColorSource={motionColorSource}
					activeMotionIndex={activeMotionIndex}
					colorSourceLabels={colorSourceLabels}
					onSaveMotionSlot={index => void handleSaveMotionSlot(index)}
					labels={{
						title: t.section_motion_profiles,
						subtitle: t.hint_saved_profiles,
						colorSource: t.label_color_source,
						load: t.label_load_profile,
						save: t.label_save_profile,
						empty: t.profile_slot_empty,
						active: t.profile_slot_active
					}}
				/>
			}
			footer={
				<EditorTabFooter title={t.label_reset}>
					<Button
						type="button"
						onClick={onResetParticles}
						size="sm"
						density="compact"
						variant="secondary"
						icon={<RotateCcw size={ICON_SIZE.xs} />}
					>
						{t.tab_particles}
					</Button>
					<Button
						type="button"
						onClick={onResetRain}
						size="sm"
						density="compact"
						variant="secondary"
						icon={<RotateCcw size={ICON_SIZE.xs} />}
					>
						{t.tab_rain}
					</Button>
				</EditorTabFooter>
			}
		>
			<ParticlesLayerSection
				store={store}
				effectiveParticleCount={effectiveParticleCount}
				particleLimit={particleLimit}
				particleShapeLabels={particleShapeLabels}
				labels={{
					title: t.section_particles_layer_density,
					layerMode: t.label_layer_mode,
					particleShape: t.label_particle_shape,
					count: t.label_count,
					speed: t.label_speed,
					enabled: t.label_enabled
				}}
			/>

			{store.particlesEnabled ? (
				<ParticlesAppearanceSection
					store={store}
					particleColorModeLabels={particleColorModeLabels}
					colorSourceLabels={colorSourceLabels}
					particleRotationLabels={particleRotationLabels}
					audioChannelLabels={audioChannelLabels}
					labels={{
						title: t.section_appearance,
						subtitle: 'Particle color, surface, glow, and filters',
						colorMode: t.label_color_mode,
						colorSource: t.label_color_source,
						color1: t.label_color_1,
						color2: t.label_color_2,
						themeHint: t.hint_theme_palette_auto,
						imageHint: t.hint_background_palette_auto,
						opacity: t.label_opacity,
						particleDetails: 'Particle details',
						sizeMin: t.label_size_min,
						sizeMax: t.label_size_max,
						fadeInOut: t.label_fade_in_out,
						glow: t.label_glow,
						glowStrength: t.label_glow_strength,
						motionFilters: t.section_particle_motion_filters,
						rotationIntensity: t.label_rotation_intensity,
						direction: t.label_direction,
						brightness: t.label_brightness,
						contrast: t.label_contrast,
						saturation: t.label_saturation,
						blur: t.label_blur,
						hueRotate: t.label_hue_rotate,
						audioResponse: t.section_particle_audio_response,
						audioReactive: t.label_audio_reactive,
						audioChannel: t.label_audio_channel,
						audioSizeBoost: t.label_audio_size_boost,
						audioOpacityBoost: t.label_audio_opacity_boost,
						audioDirectionalDrift: 'Audio Directional Drift',
						audioDirectionalDriftHint:
							'Pushes particles in a chosen direction based on the selected audio band.',
						audioDriftMode: 'Drift mode',
						audioDriftAngle: 'Direction angle',
						audioDriftAmount: 'Amount',
						audioDriftBase: 'Base drift',
						audioDriftThreshold: 'Threshold',
						audioDriftRelease: 'Release',
						depthFlow: 'Depth Flow',
						depthFlowHint:
							'Depth Flow moves particles toward or away from a focal point, creating a speed/warp effect.',
						depthFlowDirection: 'Direction',
						depthFlowMode: 'Mode',
						depthFlowAmount: 'Amount',
						depthFlowFocusX: 'Focus X',
						depthFlowFocusY: 'Focus Y',
						depthFlowThreshold: 'Threshold',
						depthFlowSensitivity: 'Sensitivity',
						depthFlowAttack: 'Attack',
						depthFlowRelease: 'Release',
						depthFlowSpeed: 'Depth speed',
						depthFlowSpread: 'Spread',
						savedProfiles: t.section_saved_profiles,
						load: t.label_load_profile,
						save: t.label_save_profile,
						slot: t.label_profile_slot,
						empty: t.profile_slot_empty,
						active: t.profile_slot_active
					}}
				/>
			) : null}

			<RainSection
				store={store}
				colorSourceLabels={colorSourceLabels}
				labels={{
					title: t.tab_rain,
					subtitle: t.hint_rain_low_perf,
					enabled: t.label_rain_enabled,
					intensity: t.label_rain_intensity,
					count: t.label_rain_count,
					speed: t.label_rain_speed,
					direction: t.section_rain_direction,
					angle: t.label_rain_angle,
					rotationZ: t.label_rain_rotation_z,
					style: t.section_rain_style,
					colorSource: t.label_color_source,
					color: t.label_rain_color,
					colorMode: t.label_color_mode,
					type: t.label_rain_type,
					length: t.label_rain_length,
					width: t.label_rain_width,
					blur: t.label_rain_blur,
					variation: t.label_variation,
					themeHint: t.hint_theme_palette_auto,
					imageHint: t.hint_background_palette_auto,
					savedProfiles: t.section_saved_profiles,
					load: t.label_load_profile,
					save: t.label_save_profile,
					slot: t.label_profile_slot,
					empty: t.profile_slot_empty,
					active: t.profile_slot_active
				}}
			/>

			<StageLightsSection />

			<FlashLightSection />

			<CameraMotionSection />

			<ScreenShakeSection />
		</EditorTabLayout>
	);
}
