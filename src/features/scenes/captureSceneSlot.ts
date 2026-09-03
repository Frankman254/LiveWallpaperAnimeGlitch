/**
 * Snapshot the live visual state into a Scene slot.
 *
 * This is the missing inverse of `buildSceneSlotActivationPatch`: that function
 * turns a Scene into a state patch, this one turns state into a Scene. Both
 * obey the same hard rule — a Scene slot NEVER owns values. Capturing writes
 * the values into each feature's own slot array and the Scene only keeps the
 * reference.
 *
 * Three-state refs are produced exactly as the activation patch consumes them:
 *  - `null`  → the kind was not requested (or could not be stored); applying the
 *              scene leaves that subsystem alone.
 *  - `'off'` → the subsystem is currently disabled; applying the scene turns it
 *              off. This matters because loading a feature slot force-enables
 *              some subsystems (see `loadLogoProfileSlot`), so "captured while
 *              off" must not round-trip as "on".
 *  - id      → the id of the feature slot holding the captured values.
 *
 * Existing slots are reused when their stored values already match live state,
 * instead of appending a duplicate. Without this, capturing scenes for a large
 * image pool would burn through every family's slot cap and bloat the persisted
 * state. When a family is at its cap and nothing matches, that ref stays `null`
 * and the kind is reported in `skipped` so callers can tell the user.
 *
 * Pure: no store import, no DOM, no `Date.now()` beyond the id factories.
 */
import {
	MAX_CAMERA_FX_SLOT_COUNT,
	MAX_LIGHTS_SLOT_COUNT,
	MAX_LOGO_SLOT_COUNT,
	MAX_LOOKS_SLOT_COUNT,
	MAX_PARTICLES_SLOT_COUNT,
	MAX_RAIN_SLOT_COUNT,
	MAX_SPECTRUM_SLOT_COUNT,
	MAX_TRACK_TITLE_SLOT_COUNT,
	buildCameraFxProfileName,
	buildLightsProfileName,
	buildLogoProfileName,
	buildLooksProfileName,
	buildParticlesProfileName,
	buildRainProfileName,
	buildSpectrumProfileName,
	buildTrackTitleProfileName,
	createProfileSlotId,
	doProfileSettingsMatch,
	extractCameraFxProfileSettings,
	extractLightsProfileSettings,
	extractLogoProfileSettings,
	extractLooksProfileSettings,
	extractParticlesProfileSettings,
	extractRainProfileSettings,
	extractTrackTitleProfileSettings
} from '@/lib/featureProfiles';
import {
	extractSpectrumTargetSettings,
	selectSpectrumActiveProfileIndexForTarget,
	writeSlotTargetSettings,
	type SpectrumProfileTarget
} from '@/features/spectrum';
import { createEmptySceneSlot } from '@/features/scenes/sceneSlot';
import type {
	ProfileSlot,
	SceneSlot,
	SceneSlotRef,
	WallpaperState
} from '@/types/wallpaper';

/** Which subsystems a capture should bind. Omitted/false kinds stay `null`. */
export type SceneCaptureKinds = {
	spectrum?: boolean;
	spectrumSecond?: boolean;
	looks?: boolean;
	particles?: boolean;
	rain?: boolean;
	lights?: boolean;
	cameraFx?: boolean;
	logo?: boolean;
	trackTitle?: boolean;
};

export type SceneCaptureKind = keyof SceneCaptureKinds;

/** Capturing "everything" is the useful default for a Save-as-scene button. */
export const ALL_SCENE_CAPTURE_KINDS: Required<SceneCaptureKinds> = {
	spectrum: true,
	spectrumSecond: true,
	looks: true,
	particles: true,
	rain: true,
	lights: true,
	cameraFx: true,
	logo: true,
	trackTitle: true
};

export type SceneCaptureResult = {
	/** The composed Scene slot. Not yet appended to `sceneSlots`. */
	scene: SceneSlot;
	/**
	 * Patch containing ONLY the feature slot arrays that gained a slot. Empty
	 * when every captured kind reused an existing slot or resolved to
	 * `'off'`/`null`.
	 */
	slotPatch: Partial<WallpaperState>;
	/** Kinds requested but not bound because their family is at its slot cap. */
	skipped: SceneCaptureKind[];
	/** Kinds bound to a freshly appended slot (vs. a reused one). */
	created: SceneCaptureKind[];
	/** Kinds bound to an already-existing slot whose values matched. */
	reused: SceneCaptureKind[];
};

type FamilyOutcome<V> = {
	ref: SceneSlotRef;
	/** Non-null only when a slot was appended. */
	nextSlots: ProfileSlot<V>[] | null;
	status: 'created' | 'reused' | 'off' | 'skipped' | 'none';
};

/**
 * Resolve one family to a ref. `reuseIndex` lets callers that have a smarter
 * equality check (spectrum normalizes before comparing) override the default
 * `doProfileSettingsMatch` scan.
 */
function captureFamily<V extends object>(args: {
	enabled: boolean;
	requested: boolean;
	slots: ReadonlyArray<ProfileSlot<V>>;
	values: V;
	name: string;
	cap: number;
	reuseIndex?: number;
	/** Families without an enable flag (looks) can never resolve to `'off'`. */
	supportsOff?: boolean;
}): FamilyOutcome<V> {
	const { requested, enabled, slots, values, name, cap } = args;
	if (!requested) return { ref: null, nextSlots: null, status: 'none' };
	if (!enabled && args.supportsOff !== false) {
		return { ref: 'off', nextSlots: null, status: 'off' };
	}

	const reuseIndex =
		args.reuseIndex ??
		slots.findIndex(slot => doProfileSettingsMatch(values, slot.values));
	const reused = reuseIndex >= 0 ? slots[reuseIndex] : undefined;
	if (reused) {
		return { ref: reused.id, nextSlots: null, status: 'reused' };
	}

	if (slots.length >= cap) {
		return { ref: null, nextSlots: null, status: 'skipped' };
	}

	const slot: ProfileSlot<V> = { id: createProfileSlotId(), name, values };
	return {
		ref: slot.id,
		nextSlots: [...slots, slot],
		status: 'created'
	};
}

/** Capture one spectrum target into its own slot array. */
function captureSpectrum(
	state: WallpaperState,
	target: SpectrumProfileTarget,
	requested: boolean
): FamilyOutcome<import('@/types/wallpaper').SpectrumProfileSettings> {
	const settings = extractSpectrumTargetSettings(state, target);
	// Spectrum 1's off-switch is the master `spectrumEnabled` — the same key the
	// activation patch writes for `'off'`. `spectrumMainVisible` is NOT used here:
	// it lives inside the captured values and round-trips through the slot, and
	// treating it as "off" would make applying the scene disable Spectrum 2 too.
	const enabled =
		target === 'instance'
			? (state.spectrumInstances[0]?.enabled ?? false)
			: state.spectrumEnabled;

	return captureFamily({
		requested,
		enabled,
		slots:
			target === 'instance'
				? state.spectrumSecondProfileSlots
				: state.spectrumProfileSlots,
		values: writeSlotTargetSettings(null, target, settings),
		name: buildSpectrumProfileName({ ...state, ...settings }),
		cap: MAX_SPECTRUM_SLOT_COUNT,
		// Slots store normalized values, so a raw key-by-key compare produces
		// false negatives (0.62 → 0.6). The target-aware selector normalizes both
		// sides before comparing.
		reuseIndex: selectSpectrumActiveProfileIndexForTarget(state, target)
	});
}

export function captureSceneSlot(
	state: WallpaperState,
	name?: string,
	kinds: SceneCaptureKinds = ALL_SCENE_CAPTURE_KINDS
): SceneCaptureResult {
	const scene = createEmptySceneSlot(
		name ?? `Scene ${state.sceneSlots.length + 1}`
	);
	const slotPatch: Partial<WallpaperState> = {};
	const skipped: SceneCaptureKind[] = [];
	const created: SceneCaptureKind[] = [];
	const reused: SceneCaptureKind[] = [];

	const record = <V>(
		kind: SceneCaptureKind,
		outcome: FamilyOutcome<V>,
		assign: (slots: ProfileSlot<V>[]) => void
	): SceneSlotRef => {
		if (outcome.status === 'skipped') skipped.push(kind);
		if (outcome.status === 'created') created.push(kind);
		if (outcome.status === 'reused') reused.push(kind);
		if (outcome.nextSlots) assign(outcome.nextSlots);
		return outcome.ref;
	};

	scene.spectrumSlotId = record(
		'spectrum',
		captureSpectrum(state, 'main', kinds.spectrum === true),
		slots => {
			slotPatch.spectrumProfileSlots = slots;
		}
	);

	scene.spectrumSecondSlotId = record(
		'spectrumSecond',
		captureSpectrum(state, 'instance', kinds.spectrumSecond === true),
		slots => {
			slotPatch.spectrumSecondProfileSlots = slots;
		}
	);

	scene.looksSlotId = record(
		'looks',
		captureFamily({
			requested: kinds.looks === true,
			// Looks has no master switch; the activation patch treats `'off'` as a
			// no-op, so capture must never emit it.
			enabled: true,
			supportsOff: false,
			slots: state.looksProfileSlots,
			values: extractLooksProfileSettings(state),
			name: buildLooksProfileName(state),
			cap: MAX_LOOKS_SLOT_COUNT
		}),
		slots => {
			slotPatch.looksProfileSlots = slots;
		}
	);

	scene.particlesSlotId = record(
		'particles',
		captureFamily({
			requested: kinds.particles === true,
			enabled: state.particlesEnabled,
			slots: state.particlesProfileSlots,
			values: extractParticlesProfileSettings(state),
			name: buildParticlesProfileName(state),
			cap: MAX_PARTICLES_SLOT_COUNT
		}),
		slots => {
			slotPatch.particlesProfileSlots = slots;
		}
	);

	scene.rainSlotId = record(
		'rain',
		captureFamily({
			requested: kinds.rain === true,
			enabled: state.rainEnabled,
			slots: state.rainProfileSlots,
			values: extractRainProfileSettings(state),
			name: buildRainProfileName(state),
			cap: MAX_RAIN_SLOT_COUNT
		}),
		slots => {
			slotPatch.rainProfileSlots = slots;
		}
	);

	scene.lightsSlotId = record(
		'lights',
		captureFamily({
			requested: kinds.lights === true,
			// Lights bundles two independent switches; the scene is only "off"
			// when neither is on, matching the activation patch's force-off.
			enabled: state.stageLightsEnabled || state.flashLightEnabled,
			slots: state.lightsProfileSlots,
			values: extractLightsProfileSettings(state),
			name: buildLightsProfileName(state),
			cap: MAX_LIGHTS_SLOT_COUNT
		}),
		slots => {
			slotPatch.lightsProfileSlots = slots;
		}
	);

	scene.cameraFxSlotId = record(
		'cameraFx',
		captureFamily({
			requested: kinds.cameraFx === true,
			enabled: state.cameraMotionEnabled || state.cameraShakeEnabled,
			slots: state.cameraFxProfileSlots,
			values: extractCameraFxProfileSettings(state),
			name: buildCameraFxProfileName(state),
			cap: MAX_CAMERA_FX_SLOT_COUNT
		}),
		slots => {
			slotPatch.cameraFxProfileSlots = slots;
		}
	);

	scene.logoSlotId = record(
		'logo',
		captureFamily({
			requested: kinds.logo === true,
			enabled: state.logoEnabled,
			slots: state.logoProfileSlots,
			values: extractLogoProfileSettings(state),
			name: buildLogoProfileName(state),
			cap: MAX_LOGO_SLOT_COUNT
		}),
		slots => {
			slotPatch.logoProfileSlots = slots;
		}
	);

	scene.trackTitleSlotId = record(
		'trackTitle',
		captureFamily({
			requested: kinds.trackTitle === true,
			enabled:
				state.audioTrackTitleEnabled || state.audioTrackTimeEnabled,
			slots: state.trackTitleProfileSlots,
			values: extractTrackTitleProfileSettings(state),
			name: buildTrackTitleProfileName(state),
			cap: MAX_TRACK_TITLE_SLOT_COUNT
		}),
		slots => {
			slotPatch.trackTitleProfileSlots = slots;
		}
	);

	return { scene, slotPatch, skipped, created, reused };
}
