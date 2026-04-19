import type { StateCreator } from 'zustand';
import {
	buildMotionProfileName,
	buildParticlesProfileName,
	buildRainProfileName,
	extractMotionProfileSettings,
	extractParticlesProfileSettings,
	extractRainProfileSettings,
	MAX_MOTION_SLOT_COUNT,
	MAX_PARTICLES_SLOT_COUNT,
	MAX_RAIN_SLOT_COUNT
} from '@/lib/featureProfiles';
import { DEFAULT_STATE } from '@/lib/constants';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0];
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1];
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2];

export function createParticlesRainSlice(
	set: WallpaperSet,
	_get: WallpaperGet,
	_api: WallpaperApi
) {
	return {
		setParticlesEnabled: v => set({ particlesEnabled: v }),
		setParticleLayerMode: v => set({ particleLayerMode: v }),
		setParticleShape: v => set({ particleShape: v }),
		setParticleColor1: v => set({ particleColor1: v }),
		setParticleColor2: v => set({ particleColor2: v }),
		setParticleColorSource: v => set({ particleColorSource: v }),
		setParticleColorMode: v => set({ particleColorMode: v }),
		setParticleSizeMin: v => set({ particleSizeMin: v }),
		setParticleSizeMax: v => set({ particleSizeMax: v }),
		setParticleOpacity: v => set({ particleOpacity: v }),
		setParticleGlow: v => set({ particleGlow: v }),
		setParticleGlowStrength: v => set({ particleGlowStrength: v }),
		setParticleFilterBrightness: v => set({ particleFilterBrightness: v }),
		setParticleFilterContrast: v => set({ particleFilterContrast: v }),
		setParticleFilterSaturation: v => set({ particleFilterSaturation: v }),
		setParticleFilterBlur: v => set({ particleFilterBlur: v }),
		setParticleFilterHueRotate: v => set({ particleFilterHueRotate: v }),
		setParticleScanlineIntensity: v =>
			set({ particleScanlineIntensity: v }),
		setParticleScanlineSpacing: v => set({ particleScanlineSpacing: v }),
		setParticleScanlineThickness: v =>
			set({ particleScanlineThickness: v }),
		setParticleRotationIntensity: v =>
			set({ particleRotationIntensity: v }),
		setParticleRotationDirection: v =>
			set({ particleRotationDirection: v }),
		setParticleFadeInOut: v => set({ particleFadeInOut: v }),
		setParticleAudioReactive: v => set({ particleAudioReactive: v }),
		setParticleAudioChannel: v => set({ particleAudioChannel: v }),
		setParticleAudioSizeBoost: v => set({ particleAudioSizeBoost: v }),
		setParticleAudioOpacityBoost: v =>
			set({ particleAudioOpacityBoost: v }),
		setParticleCount: v => set({ particleCount: v }),
		setParticleSpeed: v => set({ particleSpeed: v }),
		setRainEnabled: v => set({ rainEnabled: v }),
		setRainIntensity: v => set({ rainIntensity: v }),
		setRainDropCount: v => set({ rainDropCount: v }),
		setRainAngle: v => set({ rainAngle: v }),
		setRainMeshRotationZ: v => set({ rainMeshRotationZ: v }),
		setRainColor: v => set({ rainColor: v }),
		setRainColorSource: v => set({ rainColorSource: v }),
		setRainColorMode: v => set({ rainColorMode: v }),
		setRainParticleType: v => set({ rainParticleType: v }),
		setRainLength: v => set({ rainLength: v }),
		setRainWidth: v => set({ rainWidth: v }),
		setRainBlur: v => set({ rainBlur: v }),
		setRainSpeed: v => set({ rainSpeed: v }),
		setRainVariation: v => set({ rainVariation: v }),
		addMotionProfileSlot: () =>
			set(state => {
				if (state.motionProfileSlots.length >= MAX_MOTION_SLOT_COUNT)
					return state;
				return {
					motionProfileSlots: [
						...state.motionProfileSlots,
						{
							name: `Motion ${state.motionProfileSlots.length + 1}`,
							values: null
						}
					]
				};
			}),
		removeMotionProfileSlot: index =>
			set(state => {
				if (index < 3 || index >= state.motionProfileSlots.length)
					return state;
				return {
					motionProfileSlots: state.motionProfileSlots.filter(
						(_, i) => i !== index
					)
				};
			}),
		saveMotionProfileSlot: index =>
			set(state => {
				if (index < 0 || index >= state.motionProfileSlots.length)
					return state;
				const nextSlots = state.motionProfileSlots.map((slot, i) =>
					i === index
						? {
								name: buildMotionProfileName(state),
								values: extractMotionProfileSettings(state)
							}
						: slot
				);
				return { motionProfileSlots: nextSlots };
			}),
		loadMotionProfileSlot: index =>
			set(state => {
				const slot = state.motionProfileSlots[index];
				if (!slot?.values) return state;
				const defaults = extractMotionProfileSettings(
					DEFAULT_STATE as WallpaperStore
				);
				return { ...defaults, ...slot.values };
			}),
		addParticlesProfileSlot: () =>
			set(state => {
				if (
					state.particlesProfileSlots.length >=
					MAX_PARTICLES_SLOT_COUNT
				)
					return state;
				return {
					particlesProfileSlots: [
						...state.particlesProfileSlots,
						{
							name: `Particles ${state.particlesProfileSlots.length + 1}`,
							values: null
						}
					]
				};
			}),
		removeParticlesProfileSlot: index =>
			set(state => {
				if (index < 3 || index >= state.particlesProfileSlots.length)
					return state;
				return {
					particlesProfileSlots: state.particlesProfileSlots.filter(
						(_, i) => i !== index
					)
				};
			}),
		saveParticlesProfileSlot: index =>
			set(state => {
				if (index < 0 || index >= state.particlesProfileSlots.length)
					return state;
				const nextSlots = state.particlesProfileSlots.map((slot, i) =>
					i === index
						? {
								name: buildParticlesProfileName(state),
								values: extractParticlesProfileSettings(state)
							}
						: slot
				);
				return { particlesProfileSlots: nextSlots };
			}),
		loadParticlesProfileSlot: index =>
			set(state => {
				const slot = state.particlesProfileSlots[index];
				if (!slot?.values) return state;
				const defaults = extractParticlesProfileSettings(
					DEFAULT_STATE as WallpaperStore
				);
				return { ...defaults, ...slot.values };
			}),
		addRainProfileSlot: () =>
			set(state => {
				if (state.rainProfileSlots.length >= MAX_RAIN_SLOT_COUNT)
					return state;
				return {
					rainProfileSlots: [
						...state.rainProfileSlots,
						{
							name: `Rain ${state.rainProfileSlots.length + 1}`,
							values: null
						}
					]
				};
			}),
		removeRainProfileSlot: index =>
			set(state => {
				if (index < 3 || index >= state.rainProfileSlots.length)
					return state;
				return {
					rainProfileSlots: state.rainProfileSlots.filter(
						(_, i) => i !== index
					)
				};
			}),
		saveRainProfileSlot: index =>
			set(state => {
				if (index < 0 || index >= state.rainProfileSlots.length)
					return state;
				const nextSlots = state.rainProfileSlots.map((slot, i) =>
					i === index
						? {
								name: buildRainProfileName(state),
								values: extractRainProfileSettings(state)
							}
						: slot
				);
				return { rainProfileSlots: nextSlots };
			}),
		loadRainProfileSlot: index =>
			set(state => {
				const slot = state.rainProfileSlots[index];
				if (!slot?.values) return state;
				const defaults = extractRainProfileSettings(
					DEFAULT_STATE as WallpaperStore
				);
				return { ...defaults, ...slot.values };
			})
	} satisfies Partial<WallpaperStore>;
}
