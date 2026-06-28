import { describe, it, expect } from 'vitest';
import {
	resolveEffectivePlaybackImageId,
	resolveSlideshowPool,
	PLAYBACK_ZERO_EPSILON
} from './slideshowPlayback';
import type { BackgroundImageItem, Setlist } from '@/types/wallpaper';

// ── Helpers ────────────────────────────────────────────────────────────────

function img(
	id: string,
	opts: Partial<Pick<BackgroundImageItem, 'enabled' | 'url' | 'playbackSwitchAt'>> = {}
): BackgroundImageItem {
	return {
		assetId: id,
		url: opts.url ?? `virtual://img/${id}`,
		enabled: opts.enabled ?? true,
		name: id,
		playbackSwitchAt: opts.playbackSwitchAt ?? null,
		sceneSlotId: null,
		// The remaining fields are not needed by the resolver.
	} as unknown as BackgroundImageItem;
}

const NO_SETLISTS: Setlist[] = [];

function pool(ids: string[]): BackgroundImageItem[] {
	return ids.map(id => img(id));
}

// ── resolveSlideshowPool ───────────────────────────────────────────────────

describe('resolveSlideshowPool', () => {
	it('excludes images without a URL', () => {
		const images = [img('a'), img('b', { url: '' }), img('c')];
		const result = resolveSlideshowPool(images, NO_SETLISTS, null);
		expect(result.map(i => i.assetId)).toEqual(['a', 'c']);
	});

	it('excludes explicitly disabled images', () => {
		const images = [img('a'), img('b', { enabled: false }), img('c')];
		const result = resolveSlideshowPool(images, NO_SETLISTS, null);
		expect(result.map(i => i.assetId)).toEqual(['a', 'c']);
	});

	it('respects active setlist order', () => {
		const images = [img('a'), img('b'), img('c')];
		const setlist: Setlist = {
			id: 'sl1',
			name: 'My list',
			imageAssetIds: ['c', 'a'],
			trackIds: []
		};
		const result = resolveSlideshowPool(images, [setlist], 'sl1');
		expect(result.map(i => i.assetId)).toEqual(['c', 'a']);
	});
});

// ── resolveEffectivePlaybackImageId ───────────────────────────────────────

describe('resolveEffectivePlaybackImageId — auto OFF', () => {
	it('keeps persisted activeImageId when still in pool', () => {
		const p = pool(['a', 'b', 'c']);
		const res = resolveEffectivePlaybackImageId({
			pool: p,
			currentTime: 120,
			duration: 300,
			slideshowEnabled: false,
			manualTimestampsEnabled: false,
			currentActiveImageId: 'c'
		});
		expect(res.resolvedId).toBe('c');
		expect(res.index).toBe(2);
	});

	it('falls back to pool[0] when persisted id is no longer in pool', () => {
		const p = pool(['a', 'b']);
		const res = resolveEffectivePlaybackImageId({
			pool: p,
			currentTime: 0,
			duration: 0,
			slideshowEnabled: false,
			manualTimestampsEnabled: false,
			currentActiveImageId: 'gone'
		});
		expect(res.resolvedId).toBe('a');
		expect(res.index).toBe(0);
	});
});

describe('resolveEffectivePlaybackImageId — auto ON, currentTime ≈ 0', () => {
	it('returns image 1/N when currentTime is exactly 0', () => {
		const p = pool(['a', 'b', 'c']);
		const res = resolveEffectivePlaybackImageId({
			pool: p,
			currentTime: 0,
			duration: 0,
			slideshowEnabled: true,
			manualTimestampsEnabled: false,
			currentActiveImageId: 'c'
		});
		expect(res.resolvedId).toBe('a');
		expect(res.index).toBe(0);
		expect(res.poolSize).toBe(3);
	});

	it('returns image 1/N when currentTime is within epsilon', () => {
		const p = pool(['a', 'b', 'c']);
		const res = resolveEffectivePlaybackImageId({
			pool: p,
			currentTime: PLAYBACK_ZERO_EPSILON,
			duration: 240,
			slideshowEnabled: true,
			manualTimestampsEnabled: false,
			currentActiveImageId: 'b'
		});
		expect(res.resolvedId).toBe('a');
	});

	it('returns image 1/N even when duration is 0 (audio not yet loaded)', () => {
		const p = pool(['a', 'b', 'c']);
		const res = resolveEffectivePlaybackImageId({
			pool: p,
			currentTime: 0,
			duration: 0,
			slideshowEnabled: true,
			manualTimestampsEnabled: false,
			currentActiveImageId: 'c'
		});
		expect(res.resolvedId).toBe('a');
	});
});

describe('resolveEffectivePlaybackImageId — auto ON, checkpoint mode', () => {
	it('maps progress proportionally to pool index', () => {
		const p = pool(['a', 'b', 'c']);
		// 3 images in 300s → 100s each
		const res = resolveEffectivePlaybackImageId({
			pool: p,
			currentTime: 150, // 50% through → index 1
			duration: 300,
			slideshowEnabled: true,
			manualTimestampsEnabled: false,
			currentActiveImageId: 'a'
		});
		expect(res.resolvedId).toBe('b');
		expect(res.index).toBe(1);
	});

	it('stays at last image near end of track', () => {
		const p = pool(['a', 'b', 'c']);
		const res = resolveEffectivePlaybackImageId({
			pool: p,
			currentTime: 299,
			duration: 300,
			slideshowEnabled: true,
			manualTimestampsEnabled: false,
			currentActiveImageId: 'a'
		});
		expect(res.resolvedId).toBe('c');
	});

	it('scrub back to 0 returns first image', () => {
		const p = pool(['a', 'b', 'c']);
		const res = resolveEffectivePlaybackImageId({
			pool: p,
			currentTime: 0,
			duration: 300,
			slideshowEnabled: true,
			manualTimestampsEnabled: false,
			currentActiveImageId: 'c'
		});
		expect(res.resolvedId).toBe('a');
	});

	it('falls back to first image when duration unknown and position > epsilon', () => {
		const p = pool(['a', 'b', 'c']);
		const res = resolveEffectivePlaybackImageId({
			pool: p,
			currentTime: 10,
			duration: 0,
			slideshowEnabled: true,
			manualTimestampsEnabled: false,
			currentActiveImageId: 'x-not-in-pool'
		});
		expect(res.resolvedId).toBe('a');
	});
});

describe('resolveEffectivePlaybackImageId — manual timestamps', () => {
	it('selects first image at time 0 even with timestamps', () => {
		const images = [
			img('a', { playbackSwitchAt: 0 }),
			img('b', { playbackSwitchAt: 60 }),
			img('c', { playbackSwitchAt: 120 })
		];
		const res = resolveEffectivePlaybackImageId({
			pool: images,
			currentTime: 0,
			duration: 180,
			slideshowEnabled: true,
			manualTimestampsEnabled: true,
			currentActiveImageId: 'c'
		});
		// currentTime=0 ≤ EPSILON → always first image regardless of timestamps
		expect(res.resolvedId).toBe('a');
	});

	it('picks correct image for mid-track time', () => {
		const images = [
			img('a', { playbackSwitchAt: 0 }),
			img('b', { playbackSwitchAt: 60 }),
			img('c', { playbackSwitchAt: 120 })
		];
		const res = resolveEffectivePlaybackImageId({
			pool: images,
			currentTime: 90,
			duration: 180,
			slideshowEnabled: true,
			manualTimestampsEnabled: true,
			currentActiveImageId: 'a'
		});
		expect(res.resolvedId).toBe('b');
	});

	it('scrub back past a checkpoint goes to prior image', () => {
		const images = [
			img('a', { playbackSwitchAt: 0 }),
			img('b', { playbackSwitchAt: 60 })
		];
		const res = resolveEffectivePlaybackImageId({
			pool: images,
			currentTime: 30,
			duration: 120,
			slideshowEnabled: true,
			manualTimestampsEnabled: true,
			currentActiveImageId: 'b'
		});
		expect(res.resolvedId).toBe('a');
	});
});

describe('resolveEffectivePlaybackImageId — edge cases', () => {
	it('returns null when pool is empty', () => {
		const res = resolveEffectivePlaybackImageId({
			pool: [],
			currentTime: 0,
			duration: 300,
			slideshowEnabled: true,
			manualTimestampsEnabled: false,
			currentActiveImageId: 'a'
		});
		expect(res.resolvedId).toBeNull();
		expect(res.index).toBe(-1);
		expect(res.poolSize).toBe(0);
	});

	it('handles single-image pool without errors', () => {
		const p = pool(['a']);
		const res = resolveEffectivePlaybackImageId({
			pool: p,
			currentTime: 150,
			duration: 300,
			slideshowEnabled: true,
			manualTimestampsEnabled: false,
			currentActiveImageId: 'a'
		});
		expect(res.resolvedId).toBe('a');
		expect(res.index).toBe(0);
	});

	it('pool factor produces finite values for all progress points', () => {
		const p = pool(['a', 'b', 'c', 'd']);
		const duration = 240;
		for (let t = 0; t <= duration; t += 10) {
			const res = resolveEffectivePlaybackImageId({
				pool: p,
				currentTime: t,
				duration,
				slideshowEnabled: true,
				manualTimestampsEnabled: false,
				currentActiveImageId: null
			});
			expect(res.resolvedId).not.toBeNull();
			expect(res.index).toBeGreaterThanOrEqual(0);
			expect(res.index).toBeLessThan(p.length);
		}
	});
});
