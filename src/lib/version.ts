export const APP_VERSION = '0.3.0-alpha.1';

export const SETTINGS_FORMAT = 'lwag-settings';
export const SETTINGS_SCHEMA_VERSION = 1;

export const PROJECT_FORMAT = 'lwag-project';
export const PROJECT_SCHEMA_VERSION = 1;

// v85: added lightsProfileSlots + cameraFxProfileSlots; SceneSlot gained
// lightsSlotIndex/cameraFxSlotIndex and the 3-state 'off' binding ref.
// v86: spectrumInstances replace spectrumClone* keys; low-energy inversion
// controls for spectrum rotation and particle audio drift.
// v87: low-energy spectrum rotation hold plus Depth Flow focus inversion.
// v88: contain keep-covered scale semantics.
// v89: now-playing metadata fallback + text treatment controls.
// v90: seed curated default color-favourites palette for empty lists.
// v91: spectrumScale added to spectrum main + instance settings; bump so the
// migration runs for existing users and backfills the new key (otherwise the
// Scale slider reads undefined and crashes the Spectrum tab).
// v92: spectrumManualGlow + spectrumManualGlowMode (per-spectrum glow color
// decoupled from the fill color source).
// v93: spectrumRgbSplit + spectrumRgbSplitAmount (chromatic-aberration effect
// for the classic wave).
// v94: Visual Accents pack — neon core, gradient flow, peak sparks, echo trace.
// v95: glow gains its own color identity (spectrumGlowColorSource/ColorMode +
// spectrumGlowPrimary/SecondaryColor), seeded from the fill colors so existing
// setups look identical.
// v96: retro pixel shape (classic linear) + global pixelate post-process
// (spectrumPixelate / spectrumPixelateScale).
// v97: Spectrum 2 gains its own independent profile slot list
// (spectrumSecondProfileSlots), seeded from the previously-shared slots.
// v98: Scene-first model — `defaultSceneSlotId` (the scene applied to images
// without an explicit sceneSlotId), backfilled to null on old stores.
export const STORE_PERSIST_VERSION = 98;
