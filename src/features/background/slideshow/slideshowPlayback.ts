/**
 * Pure helpers for resolving which image should be active given the current
 * playback state and slideshow configuration.  No store imports, no DOM.
 */
import type { BackgroundImageItem, Setlist } from '@/types/wallpaper';
import { filterImageIdsBySetlist } from '@/store/slices/setlistsSlice';

/** currentTime values ≤ this are treated as "position 0" → show image 1/N. */
export const PLAYBACK_ZERO_EPSILON = 0.05;

/**
 * Returns the ordered list of images the slideshow considers in-pool:
 * • enabled (not explicitly disabled)
 * • have a valid URL
 * • belong to the active setlist when one is set
 */
export function resolveSlideshowPool(
	backgroundImages: BackgroundImageItem[],
	setlists: Setlist[],
	activeSetlistId: string | null
): BackgroundImageItem[] {
	return filterImageIdsBySetlist(
		backgroundImages.filter(
			img => Boolean(img.url) && img.enabled !== false
		),
		setlists,
		activeSetlistId
	);
}

export interface PlaybackImageResolution {
	resolvedId: string | null;
	/** 0-based index within pool, -1 if pool is empty. */
	index: number;
	poolSize: number;
}

/**
 * Resolves which image should be active for the given playback state.
 *
 * Priority order:
 *   1. Empty pool → null.
 *   2. slideshowEnabled=false → keep currentActiveImageId if still in pool,
 *      else fall back to pool[0].
 *   3. currentTime ≤ EPSILON → always pool[0] ("reset to 1/N at position 0").
 *   4. manualTimestampsEnabled → last image whose switchAt ≤ currentTime.
 *   5. duration known → proportional progress through pool.
 *   6. duration unknown, position > EPSILON → keep currentActiveImageId if in
 *      pool, else pool[0].
 */
export function resolveEffectivePlaybackImageId(params: {
	pool: BackgroundImageItem[];
	currentTime: number;
	duration: number;
	slideshowEnabled: boolean;
	manualTimestampsEnabled: boolean;
	currentActiveImageId: string | null;
}): PlaybackImageResolution {
	const {
		pool,
		currentTime,
		duration,
		slideshowEnabled,
		manualTimestampsEnabled,
		currentActiveImageId
	} = params;

	if (pool.length === 0) return { resolvedId: null, index: -1, poolSize: 0 };

	if (!slideshowEnabled) {
		const idx = pool.findIndex(img => img.assetId === currentActiveImageId);
		if (idx >= 0)
			return {
				resolvedId: currentActiveImageId,
				index: idx,
				poolSize: pool.length
			};
		return { resolvedId: pool[0].assetId, index: 0, poolSize: pool.length };
	}

	// Auto ON + position 0 (or very close) → always first image.
	if (currentTime <= PLAYBACK_ZERO_EPSILON) {
		return { resolvedId: pool[0].assetId, index: 0, poolSize: pool.length };
	}

	if (manualTimestampsEnabled) {
		const effectiveDuration = Math.max(0.1, duration);
		const scheduled = pool
			.map((img, i, arr) => ({
				img,
				switchAt:
					img.playbackSwitchAt != null
						? img.playbackSwitchAt
						: (effectiveDuration / arr.length) * i
			}))
			.sort((a, b) => a.switchAt - b.switchAt);

		let best = scheduled[0];
		for (const entry of scheduled) {
			if (entry.switchAt <= currentTime) best = entry;
			else break;
		}
		const idx = pool.findIndex(img => img.assetId === best.img.assetId);
		return {
			resolvedId: best.img.assetId,
			index: idx,
			poolSize: pool.length
		};
	}

	if (duration > 0) {
		const progress = Math.min(0.999999, currentTime / duration);
		const idx = Math.min(
			pool.length - 1,
			Math.floor(progress * pool.length)
		);
		return {
			resolvedId: pool[idx].assetId,
			index: idx,
			poolSize: pool.length
		};
	}

	// Duration unknown and position > epsilon: keep current if in pool.
	const idx = pool.findIndex(img => img.assetId === currentActiveImageId);
	if (idx >= 0)
		return {
			resolvedId: currentActiveImageId,
			index: idx,
			poolSize: pool.length
		};
	return { resolvedId: pool[0].assetId, index: 0, poolSize: pool.length };
}

export interface EffectiveImageResolution {
	targetImageId: string | null;
	/** 0-based index within the effective pool, -1 if pool is empty. */
	targetIndex: number;
	/** Total images in the effective pool. */
	total: number;
	/**
	 * When false, the caller may skip applying the target because it matches
	 * `lastAutoTargetId` — meaning no checkpoint boundary was crossed and a
	 * manual selection made within the current checkpoint should be preserved.
	 */
	shouldApply: boolean;
	/**
	 * When true, the caller must apply the target even if it matches
	 * `lastAutoTargetId`.  Set at position-zero (currentTime ≤ EPSILON + auto ON)
	 * so a page-reload or scrub-to-start always snaps to image 1/N.
	 */
	forceApply: boolean;
	reason:
		| 'auto-off'
		| 'position-zero'
		| 'checkpoint-boundary'
		| 'timestamp-boundary'
		| 'no-change'
		| 'empty-pool';
}

/**
 * Higher-level resolver that builds the pool from raw image + setlist state and
 * enriches the result with `shouldApply` / `forceApply` / `reason` so callers
 * can make safe apply decisions without duplicating the checkpoint-guard logic.
 *
 * `lastAutoTargetId` — the last image id that was *committed* by the auto
 * resolver (i.e. the value of `lastCheckpointIdRef` in the caller).  Passing
 * `null` means "never committed anything", which forces an initial apply.
 */
export function resolveEffectiveImageForPlayback(params: {
	images: BackgroundImageItem[];
	setlists: Setlist[];
	activeSetlistId: string | null;
	currentTime: number;
	duration: number;
	slideshowEnabled: boolean;
	manualTimestampsEnabled: boolean;
	lastAutoTargetId: string | null;
}): EffectiveImageResolution {
	const pool = resolveSlideshowPool(
		params.images,
		params.setlists,
		params.activeSetlistId
	);

	if (pool.length === 0) {
		return {
			targetImageId: null,
			targetIndex: -1,
			total: 0,
			shouldApply: false,
			forceApply: false,
			reason: 'empty-pool'
		};
	}

	const base = resolveEffectivePlaybackImageId({
		pool,
		currentTime: params.currentTime,
		duration: params.duration,
		slideshowEnabled: params.slideshowEnabled,
		manualTimestampsEnabled: params.manualTimestampsEnabled,
		currentActiveImageId: params.lastAutoTargetId
	});

	const forceApply =
		params.slideshowEnabled && params.currentTime <= PLAYBACK_ZERO_EPSILON;
	const changed = base.resolvedId !== params.lastAutoTargetId;
	const shouldApply = forceApply || changed;

	let reason: EffectiveImageResolution['reason'];
	if (!params.slideshowEnabled) {
		reason = 'auto-off';
	} else if (forceApply) {
		reason = 'position-zero';
	} else if (changed) {
		reason = params.manualTimestampsEnabled
			? 'timestamp-boundary'
			: 'checkpoint-boundary';
	} else {
		reason = 'no-change';
	}

	return {
		targetImageId: base.resolvedId,
		targetIndex: base.index,
		total: base.poolSize,
		shouldApply,
		forceApply,
		reason
	};
}
