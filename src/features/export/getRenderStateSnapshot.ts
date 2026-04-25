import { useWallpaperStore } from '@/store/wallpaperStore';
import type { WallpaperState } from '@/types/wallpaper';
import {
	getEditorThemePalette,
	type BackgroundPalette
} from '@/lib/backgroundPalette';

export type RenderStateSnapshot = {
	state: Readonly<WallpaperState>;
	palette: BackgroundPalette;
	capturedAtMs: number;
};

function pickStateFields(store: ReturnType<typeof useWallpaperStore.getState>):
	WallpaperState {
	const snapshot: Record<string, unknown> = {};
	for (const key of Object.keys(store)) {
		const value = (store as unknown as Record<string, unknown>)[key];
		if (typeof value !== 'function') {
			snapshot[key] = value;
		}
	}
	return snapshot as unknown as WallpaperState;
}

export function getRenderStateSnapshot(
	overrides?: Partial<RenderStateSnapshot>
): RenderStateSnapshot {
	const store = useWallpaperStore.getState();
	const state = pickStateFields(store);
	const palette =
		overrides?.palette ?? getEditorThemePalette(state.editorTheme);
	const snapshot: RenderStateSnapshot = {
		state: Object.freeze(state),
		palette,
		capturedAtMs:
			overrides?.capturedAtMs ??
			(typeof performance !== 'undefined' ? performance.now() : Date.now())
	};
	return Object.freeze(snapshot);
}
