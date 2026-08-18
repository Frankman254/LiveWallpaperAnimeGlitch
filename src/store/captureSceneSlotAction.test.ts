import { describe, it, expect, beforeEach } from 'vitest';

const mem = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
	getItem: (k: string) => mem.get(k) ?? null,
	setItem: (k: string, v: string) => void mem.set(k, v),
	removeItem: (k: string) => void mem.delete(k),
	clear: () => void mem.clear()
};

const { useWallpaperStore } = await import('@/store/wallpaperStore');

describe('captureSceneSlotFromCurrent (store action)', () => {
	beforeEach(() => {
		useWallpaperStore.setState({ sceneSlots: [] });
	});

	it('appends a scene without applying it or making it active', () => {
		const before = useWallpaperStore.getState();
		const activeBefore = before.activeSceneSlotId;
		const particlesBefore = before.particlesEnabled;

		const result = before.captureSceneSlotFromCurrent('Snapshot');

		const after = useWallpaperStore.getState();
		expect(result).not.toBeNull();
		expect(after.sceneSlots).toHaveLength(1);
		expect(after.sceneSlots[0].id).toBe(result!.sceneId);
		expect(after.sceneSlots[0].name).toBe('Snapshot');
		// Capturing describes what is already on screen — it must not re-apply.
		expect(after.activeSceneSlotId).toBe(activeBefore);
		expect(after.particlesEnabled).toBe(particlesBefore);
	});

	it('writes values into feature slots, never onto the scene', () => {
		useWallpaperStore.setState({ particlesEnabled: true });
		const slotsBefore =
			useWallpaperStore.getState().particlesProfileSlots.length;

		useWallpaperStore.getState().captureSceneSlotFromCurrent();

		const after = useWallpaperStore.getState();
		const scene = after.sceneSlots[0];
		expect(typeof scene.particlesSlotId).toBe('string');
		// Either a new slot was appended or an existing one matched — but the
		// referenced slot must exist and carry the values.
		const bound = after.particlesProfileSlots.find(
			s => s.id === scene.particlesSlotId
		);
		expect(bound?.values).toBeTruthy();
		expect(after.particlesProfileSlots.length).toBeGreaterThanOrEqual(
			slotsBefore
		);
	});

	it('applying the captured scene restores the captured look', () => {
		useWallpaperStore.setState({ particlesEnabled: true });
		const captured = useWallpaperStore.getState().particleCount;

		const result = useWallpaperStore
			.getState()
			.captureSceneSlotFromCurrent('Restore me');

		// Drift away, then apply the scene.
		useWallpaperStore.setState({ particleCount: captured + 40 });
		useWallpaperStore.getState().applySceneSlotById(result!.sceneId);

		const after = useWallpaperStore.getState();
		expect(after.particleCount).toBe(captured);
		expect(after.activeSceneSlotId).toBe(result!.sceneId);
	});

	it('returns null once the scene cap is reached', () => {
		const store = useWallpaperStore.getState();
		for (let i = 0; i < 60; i += 1) store.captureSceneSlotFromCurrent();
		const count = useWallpaperStore.getState().sceneSlots.length;

		expect(
			useWallpaperStore.getState().captureSceneSlotFromCurrent()
		).toBeNull();
		expect(useWallpaperStore.getState().sceneSlots).toHaveLength(count);
	});
});
