/**
 * Turn per-image intents into Scene slots for the whole pool, in one pass.
 *
 * The load-bearing decision here is that this **never applies anything to live
 * state**. Capturing a scene normally means "snapshot what is on screen", which
 * for 200 images would mean applying 200 looks in sequence — 200 renders, 200
 * chances to leave the user's wallpaper somewhere they did not ask for. Instead
 * each image's compiled look is folded into a *synthetic* state and captured
 * from that, so the whole batch is a pure computation the caller commits (or
 * discards) atomically.
 *
 * Slot reuse falls out of this for free: each capture sees the slots the
 * previous ones created, so images that compile to the same look share slots
 * instead of each burning their own. Without that, a 200-image batch would blow
 * through every family's slot cap immediately.
 */
import { captureSceneSlot } from '@/features/scenes/captureSceneSlot';
import type { SceneSlot, WallpaperState } from '@/types/wallpaper';
import { buildDraftPatch } from '../sceneDraft';
import { compileIntent } from '../intent/compileIntent';
import type { SceneIntent } from '../intent/sceneIntent';

export type BatchImageIntent = {
	assetId: string;
	intent: SceneIntent;
	/** Cluster this image belongs to, used to name its scene. */
	clusterIndex: number;
};

export type BatchScenesResult = {
	/** Scene slots to append, in input order. */
	scenes: SceneSlot[];
	/** Feature-slot arrays that grew, ready to spread into the store. */
	slotPatch: Partial<WallpaperState>;
	/** assetId → sceneId, for binding each image to its scene. */
	bindings: Array<{ assetId: string; sceneId: string }>;
	/** Images skipped because a family hit its slot cap. */
	skipped: Array<{ assetId: string; kinds: string[] }>;
};

export type BuildBatchScenesOptions = {
	/** Ceiling on new scenes, mirroring the store's own cap. */
	maxScenes?: number;
	/** `Scene 1` → `AI 1·1`. Cluster and member index make names scannable. */
	nameFor?: (entry: BatchImageIntent, memberIndex: number) => string;
};

/**
 * Compile every image's intent into a Scene slot. Pure: no store access, no
 * mutation of `state`.
 */
export function buildBatchScenes(
	state: WallpaperState,
	entries: BatchImageIntent[],
	options: BuildBatchScenesOptions = {}
): BatchScenesResult {
	const maxScenes = options.maxScenes ?? 40;
	const nameFor =
		options.nameFor ??
		((entry, memberIndex) =>
			`AI ${entry.clusterIndex + 1}·${memberIndex + 1}`);

	const scenes: SceneSlot[] = [];
	const bindings: BatchScenesResult['bindings'] = [];
	const skipped: BatchScenesResult['skipped'] = [];

	// Working state carries forward the slots created so far, which is what
	// makes reuse across images work.
	let working: WallpaperState = state;
	const slotPatch: Partial<WallpaperState> = {};
	const memberCounters = new Map<number, number>();

	for (const entry of entries) {
		if (scenes.length >= maxScenes) {
			skipped.push({ assetId: entry.assetId, kinds: ['scene-cap'] });
			continue;
		}

		const compiled = compileIntent(entry.intent);
		// The look as it *would* render, without ever rendering it.
		const synthetic = {
			...working,
			...buildDraftPatch(working, compiled)
		} as WallpaperState;

		const memberIndex = memberCounters.get(entry.clusterIndex) ?? 0;
		memberCounters.set(entry.clusterIndex, memberIndex + 1);

		const captured = captureSceneSlot(
			synthetic,
			nameFor(entry, memberIndex)
		);

		if (captured.skipped.length > 0) {
			skipped.push({ assetId: entry.assetId, kinds: captured.skipped });
		}

		scenes.push(captured.scene);
		bindings.push({ assetId: entry.assetId, sceneId: captured.scene.id });

		// Fold this image's new slots into the working state so the next capture
		// can reuse them.
		Object.assign(slotPatch, captured.slotPatch);
		working = { ...working, ...captured.slotPatch };
	}

	return { scenes, slotPatch, bindings, skipped };
}
