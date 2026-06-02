import type { StateCreator } from 'zustand';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0];
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1];
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2];

/**
 * Setters for radial spectrum rotation drive, Stage Lights FX, and Camera FX.
 * Data + defaults live in `types/wallpaper.ts` and `lib/constants.ts`; the
 * render-side caps live in `features/stageFx/stageFxConfig.ts`.
 */
export function createStageCameraSlice(
	set: WallpaperSet,
	_get: WallpaperGet,
	_api: WallpaperApi
) {
	return {
		// Radial spectrum rotation
		setSpectrumRotationDrive: v => set({ spectrumRotationDrive: v }),
		setSpectrumRotationAudioAmount: v =>
			set({ spectrumRotationAudioAmount: v }),
		setSpectrumRotationChannel: v => set({ spectrumRotationChannel: v }),
		setSpectrumRotationDirection: v => set({ spectrumRotationDirection: v }),
		setSpectrumRotationSmoothing: v => set({ spectrumRotationSmoothing: v }),

		// Stage Lights FX
		setStageLightsEnabled: v => set({ stageLightsEnabled: v }),
		setStageLightsIntensity: v => set({ stageLightsIntensity: v }),
		setStageLightsBeamCount: v => set({ stageLightsBeamCount: v }),
		setStageLightsBeamWidth: v => set({ stageLightsBeamWidth: v }),
		setStageLightsSoftness: v => set({ stageLightsSoftness: v }),
		setStageLightsSpeed: v => set({ stageLightsSpeed: v }),
		setStageLightsColorSource: v => set({ stageLightsColorSource: v }),
		setStageLightsColor: v => set({ stageLightsColor: v }),
		setStageLightsAudioReactive: v => set({ stageLightsAudioReactive: v }),
		setStageLightsAudioChannel: v => set({ stageLightsAudioChannel: v }),
		setStageLightsPeakFlash: v => set({ stageLightsPeakFlash: v }),
		setStageLightsPeakThreshold: v => set({ stageLightsPeakThreshold: v }),
		setStageLightsOpacity: v => set({ stageLightsOpacity: v }),
		setStageLightsBlendMode: v => set({ stageLightsBlendMode: v }),

		// Camera FX
		setCameraFxEnabled: v => set({ cameraFxEnabled: v }),
		setCameraMotionMode: v => set({ cameraMotionMode: v }),
		setCameraMotionAmount: v => set({ cameraMotionAmount: v }),
		setCameraMotionSpeed: v => set({ cameraMotionSpeed: v }),
		setCameraMotionAudioInfluence: v =>
			set({ cameraMotionAudioInfluence: v }),
		setCameraShakeEnabled: v => set({ cameraShakeEnabled: v }),
		setCameraShakeAmount: v => set({ cameraShakeAmount: v }),
		setCameraShakeDecay: v => set({ cameraShakeDecay: v }),
		setCameraShakeThreshold: v => set({ cameraShakeThreshold: v }),
		setCameraShakeChannel: v => set({ cameraShakeChannel: v })
	} satisfies Partial<WallpaperStore>;
}
