import { useMemo } from 'react';
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
import { MotionProfilesSection } from './motion/MotionProfilesSection';
import { ParticlesAppearanceSection } from './motion/ParticlesAppearanceSection';
import { ParticlesLayerSection } from './motion/ParticlesLayerSection';
import { RainSection } from './motion/RainSection';
import { sharedColorSource } from './motion/motionTabUtils';

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
			<MotionProfilesSection
				store={store}
				motionColorSource={motionColorSource}
				activeMotionIndex={activeMotionIndex}
				colorSourceLabels={colorSourceLabels}
				onSaveMotionSlot={index => void handleSaveMotionSlot(index)}
				labels={{
					title: t.tab_motion,
					subtitle: t.section_motion_profiles,
					colorSource: t.label_color_source,
					load: t.label_load_profile,
					save: t.label_save_profile,
					empty: t.profile_slot_empty,
					active: t.profile_slot_active
				}}
			/>

			<ParticlesLayerSection
				store={store}
				effectiveParticleCount={effectiveParticleCount}
				particleLimit={particleLimit}
				particleShapeLabels={particleShapeLabels}
				onResetParticles={onResetParticles}
				labels={{
					title: t.section_particles_layer_density,
					layerMode: t.label_layer_mode,
					particleShape: t.label_particle_shape,
					count: t.label_count,
					speed: t.label_speed,
					enabled: t.label_enabled,
					reset: t.reset_tab
				}}
			/>

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
					scanlines: t.label_scanlines,
					spacing: t.label_spacing,
					thickness: t.label_thickness,
					audioResponse: t.section_particle_audio_response,
					audioReactive: t.label_audio_reactive,
					audioChannel: t.label_audio_channel,
					audioSizeBoost: t.label_audio_size_boost,
					audioOpacityBoost: t.label_audio_opacity_boost,
					savedProfiles: t.section_saved_profiles,
					load: t.label_load_profile,
					save: t.label_save_profile,
					slot: t.label_profile_slot,
					empty: t.profile_slot_empty,
					active: t.profile_slot_active
				}}
			/>

			<RainSection
				store={store}
				colorSourceLabels={colorSourceLabels}
				onResetRain={onResetRain}
				labels={{
					title: t.tab_rain,
					subtitle: t.hint_rain_low_perf,
					enabled: t.label_rain_enabled,
					reset: t.reset_tab,
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
		</div>
	);
}
