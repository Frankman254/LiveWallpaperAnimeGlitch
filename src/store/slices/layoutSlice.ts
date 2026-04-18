import type { StateCreator } from 'zustand';
import { getCurrentViewportResolution } from '@/features/layout/viewportMetrics';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0];
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1];
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2];

function normalizeReferenceDimension(value: number, fallback: number): number {
	return Number.isFinite(value) ? Math.max(1, Math.round(value)) : fallback;
}

export function createLayoutSlice(
	set: WallpaperSet,
	_get: WallpaperGet,
	_api: WallpaperApi
) {
	return {
		setLayoutResponsiveEnabled: v => set({ layoutResponsiveEnabled: v }),
		setLayoutBackgroundReframeEnabled: v =>
			set({ layoutBackgroundReframeEnabled: v }),
		setLayoutReferenceResolution: (width, height) => {
			const fallback = getCurrentViewportResolution();
			set({
				layoutReferenceWidth: normalizeReferenceDimension(
					width,
					fallback.width
				),
				layoutReferenceHeight: normalizeReferenceDimension(
					height,
					fallback.height
				)
			});
		},
		captureCurrentViewportAsReference: () => {
			const viewport = getCurrentViewportResolution();
			set({
				layoutReferenceWidth: viewport.width,
				layoutReferenceHeight: viewport.height
			});
		}
	} satisfies Partial<WallpaperStore>;
}
