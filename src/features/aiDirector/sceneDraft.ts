/**
 * A draft is a compiled scene that is being *tried on* — applied to live state
 * so the user can watch it react to the music, but not yet saved anywhere.
 *
 * The correctness property this file exists to guarantee is
 * **preview equals commit**: what plays on screen during preview must be
 * exactly what gets stored when the user accepts. The design achieves that
 * structurally rather than by keeping two code paths in sync — committing
 * literally captures the previewed state (see `aiDirectorSlice`), and
 * `buildDraftPatch` mirrors `buildSceneSlotActivationPatch`'s
 * "factory defaults, then the slot's values" merge so a previewed look and a
 * re-applied scene resolve identically.
 */
import { DEFAULT_STATE } from '@/lib/constants';
import {
	extractCameraFxProfileSettings,
	extractLightsProfileSettings,
	extractLooksProfileSettings,
	extractParticlesProfileSettings,
	extractRainProfileSettings
} from '@/lib/featureProfiles';
import {
	applySpectrumTargetSettings,
	defaultSpectrumTargetSettings
} from '@/features/spectrum/spectrumTargetProfile';
import type { WallpaperState } from '@/types/wallpaper';
import type { ImageSignature } from './analysis/imageSignature';
import { compileIntent, type CompiledScene } from './intent/compileIntent';
import { heuristicIntent } from './intent/heuristicIntent';
import type { SceneIntent } from './intent/sceneIntent';

/** Where a draft's intent came from. Shown in the UI so the user knows whether
 *  they are looking at the offline heuristic or a model's answer. */
export type SceneDraftSource = 'heuristic' | 'model';

export type SceneDraft = {
	/** The image this draft was authored for, if any. */
	assetId: string | null;
	signature: ImageSignature | null;
	intent: SceneIntent;
	compiled: CompiledScene;
	source: SceneDraftSource;
};

/** Build a draft from an image's signature with no model involved. */
export function draftFromSignature(
	signature: ImageSignature,
	assetId: string | null = null
): SceneDraft {
	const intent = heuristicIntent(signature);
	return {
		assetId,
		signature,
		intent,
		compiled: compileIntent(intent),
		source: 'heuristic'
	};
}

/** Rebuild a draft's compiled half after its intent was edited by hand. */
export function draftWithIntent(
	draft: SceneDraft,
	intent: SceneIntent,
	source: SceneDraftSource = draft.source
): SceneDraft {
	return { ...draft, intent, compiled: compileIntent(intent), source };
}

/**
 * Turn a compiled scene into a state patch.
 *
 * Each family merges as `factory defaults → compiled partial`, exactly like
 * scene activation merges `factory defaults → slot values`. Starting from the
 * defaults (rather than from live state) is what makes a draft *complete*: a
 * knob the intent doesn't mention returns to its audited default instead of
 * inheriting whatever the previous scene left behind, so the same draft always
 * looks the same regardless of what was on screen before it.
 */
export function buildDraftPatch(
	state: WallpaperState,
	compiled: CompiledScene
): Partial<WallpaperState> {
	const defaults = DEFAULT_STATE as WallpaperState;
	const patch: Partial<WallpaperState> = {};

	// Spectrum 1. `applySpectrumTargetSettings` writes only the flat keys, so
	// Spectrum 2 is left exactly as the user had it — a draft describes one
	// spectrum, not the whole stack.
	Object.assign(
		patch,
		applySpectrumTargetSettings(state, 'main', {
			...defaultSpectrumTargetSettings('main'),
			...compiled.spectrum
		}),
		{ spectrumEnabled: true, spectrumMainVisible: true }
	);

	Object.assign(patch, extractLooksProfileSettings(defaults), compiled.looks);
	Object.assign(
		patch,
		extractParticlesProfileSettings(defaults),
		compiled.particles
	);
	Object.assign(patch, extractRainProfileSettings(defaults), compiled.rain);
	Object.assign(patch, extractLightsProfileSettings(defaults), compiled.lights);
	Object.assign(
		patch,
		extractCameraFxProfileSettings(defaults),
		compiled.cameraFx
	);

	return patch;
}

/**
 * The subset of `state` that `patch` is about to overwrite. Restoring this
 * exact object undoes a preview with no residue — which is why revert can be
 * offered without a confirmation dialog.
 */
export function snapshotForPatch(
	state: WallpaperState,
	patch: Partial<WallpaperState>
): Partial<WallpaperState> {
	const snapshot: Record<string, unknown> = {};
	for (const key of Object.keys(patch)) {
		snapshot[key] = (state as unknown as Record<string, unknown>)[key];
	}
	return snapshot as Partial<WallpaperState>;
}

/**
 * A model intent lands ~40s after it was asked for — long enough that the user
 * may have tried the image they care about in the meantime. This predicate is
 * the single rule the panel applies before letting a late response touch the
 * draft: only apply it when the draft is still the one the request was built
 * from and the preview that started it is still on screen.
 *
 * It reads the *current* store state, not the one captured at request time,
 * which is what makes a stale response discardable. Pure on purpose — it lives
 * here, not in the panel, so it is unit-testable without a DOM.
 */
export function shouldApplySceneIntentResult(
	assetIdAtRequest: string,
	current: {
		aiDraft: SceneDraft | null;
		aiPreviewActive: boolean;
	}
): boolean {
	return (
		current.aiDraft?.assetId === assetIdAtRequest &&
		current.aiPreviewActive
	);
}
