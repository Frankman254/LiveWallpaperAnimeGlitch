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
		setStageLightsMinBeamCount: v => set({ stageLightsMinBeamCount: v }),
		setStageLightsMaxBeamCount: v => set({ stageLightsMaxBeamCount: v }),
		setStageLightsBeamWidth: v => set({ stageLightsBeamWidth: v }),
		setStageLightsSoftness: v => set({ stageLightsSoftness: v }),
		setStageLightsSpeed: v => set({ stageLightsSpeed: v }),
		setStageLightsFixedMotion: v => set({ stageLightsFixedMotion: v }),
		setStageLightsColorSource: v => set({ stageLightsColorSource: v }),
		setStageLightsColor: v => set({ stageLightsColor: v }),
		setStageLightsAudioReactive: v => set({ stageLightsAudioReactive: v }),
		setStageLightsAudioChannel: v => set({ stageLightsAudioChannel: v }),
		setStageLightsAudioAmount: v => set({ stageLightsAudioAmount: v }),
		setStageLightsPeakFlash: v => set({ stageLightsPeakFlash: v }),
		setStageLightsPeakThreshold: v => set({ stageLightsPeakThreshold: v }),
		setStageLightsOpacity: v => set({ stageLightsOpacity: v }),
		setStageLightsBlendMode: v => set({ stageLightsBlendMode: v }),
		setStageLightsOrigin: v => set({ stageLightsOrigin: v }),
		setStageLightsMovementMode: v => set({ stageLightsMovementMode: v }),
		setStageLightsInvertDirection: v =>
			set({ stageLightsInvertDirection: v }),
		setStageLightsMirrorDirections: v =>
			set({ stageLightsMirrorDirections: v }),

		// Flash Light FX
		setFlashLightEnabled: v => set({ flashLightEnabled: v }),
		setFlashLightIntensity: v => set({ flashLightIntensity: v }),
		setFlashLightColorSource: v => set({ flashLightColorSource: v }),
		setFlashLightColor: v => set({ flashLightColor: v }),
		setFlashLightSoftness: v => set({ flashLightSoftness: v }),
		setFlashLightBrightness: v => set({ flashLightBrightness: v }),
		setFlashLightDecay: v => set({ flashLightDecay: v }),
		setFlashLightAudioChannel: v => set({ flashLightAudioChannel: v }),
		setFlashLightThreshold: v => set({ flashLightThreshold: v }),
		setFlashLightSensitivity: v => set({ flashLightSensitivity: v }),
		setFlashLightShape: v => set({ flashLightShape: v }),
		setFlashLightBlendMode: v => set({ flashLightBlendMode: v }),

		// Camera FX
		setCameraFxEnabled: v => set({ cameraFxEnabled: v }),
		setCameraMotionEnabled: v => set({ cameraMotionEnabled: v }),
		setCameraMotionMode: v => set({ cameraMotionMode: v }),
		setCameraMotionAmount: v => set({ cameraMotionAmount: v }),
		setCameraMotionSpeed: v => set({ cameraMotionSpeed: v }),
		setCameraMotionAudioInfluence: v =>
			set({ cameraMotionAudioInfluence: v }),
		setCameraMotionAudioChannel: v => set({ cameraMotionAudioChannel: v }),
		setCameraMotionDirection: v => set({ cameraMotionDirection: v }),
		setCameraShakeEnabled: v => set({ cameraShakeEnabled: v }),
		setCameraShakeAmount: v => set({ cameraShakeAmount: v }),
		setCameraShakeDecay: v => set({ cameraShakeDecay: v }),
		setCameraShakeThreshold: v => set({ cameraShakeThreshold: v }),
		setCameraShakeChannel: v => set({ cameraShakeChannel: v }),
		setCameraShakeMode: v => set({ cameraShakeMode: v }),
		setCameraShakeFrequency: v => set({ cameraShakeFrequency: v }),
		setCameraShakeRoughness: v => set({ cameraShakeRoughness: v })
	} satisfies Partial<WallpaperStore>;
}
