import { beforeEach, describe, expect, it } from 'vitest';

const mem = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
	getItem: (key: string) => mem.get(key) ?? null,
	setItem: (key: string, value: string) => void mem.set(key, value),
	removeItem: (key: string) => void mem.delete(key),
	clear: () => void mem.clear()
};

const { APP_LOGO_URL } = await import('@/config/appLogo');
const { DEFAULT_STATE } = await import('@/store/defaultState');
const { useWallpaperStore } = await import('@/store/wallpaperStore');

const store = () => useWallpaperStore.getState();

describe('logo source and variant state', () => {
	beforeEach(() => {
		useWallpaperStore.setState({ ...DEFAULT_STATE });
	});

	it('round-trips the built-in variant through Logo profiles', () => {
		store().setLogoVariantMode('pixel');
		store().saveLogoProfileSlot(0);
		store().setLogoVariantMode('vector');

		store().loadLogoProfileSlot(0);

		expect(store().logoVariantMode).toBe('pixel');
	});

	it('restores the factory source atomically and enables it', () => {
		useWallpaperStore.setState({
			logoId: 'custom-logo',
			logoUrl: 'blob:custom-logo',
			logoEnabled: false
		});

		store().restoreFactoryLogo();

		expect(store().logoId).toBeNull();
		expect(store().logoUrl).toBe(APP_LOGO_URL);
		expect(store().logoEnabled).toBe(true);
	});
});

describe('drag tool state', () => {
	beforeEach(() => {
		useWallpaperStore.setState({
			enableDragMode: false,
			activeTool: 'none'
		});
	});

	it('selects a target and enables drag mode in one action', () => {
		store().setDragTool('lyrics');
		expect(store().enableDragMode).toBe(true);
		expect(store().activeTool).toBe('lyrics');
	});

	it('disables drag mode when the target is cleared', () => {
		store().setDragTool('hud');
		store().setDragTool('none');
		expect(store().enableDragMode).toBe(false);
		expect(store().activeTool).toBe('none');
	});
});
