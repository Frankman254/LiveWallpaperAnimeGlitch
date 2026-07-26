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
// v99: Re-run instance migration to fill any keys (spectrumManualGlow,
// spectrumScale, spectrumSpan, etc.) absent from instances persisted before
// their version bumps, preventing S1 flat-state values bleeding into S2.
// v100: Liquid-glass toggles — `nowPlayingLiquidGlassEnabled`,
// `audioLyricsLiquidGlassEnabled`, `hudLiquidGlassEnabled` (all default false),
// backfilled onto older stores.
// v101: Liquid-glass tuning — per-surface blur/magnify/tint sliders
// (`nowPlayingLiquidGlass{Blur,Magnify,Tint}`,
// `audioLyricsLiquidGlass{Blur,Magnify,Tint}`), backfilled with macOS-like
// defaults; the HUD glass reuses the existing Quick HUD blur/opacity sliders.
// v102: Liquid-glass reworked to a transparent centre + refractive edge lens
// (no full-panel frost). The blur/magnify/tint values change meaning, so they
// are re-seeded once for stores below v102.
// v103: the combined Motion bundles (particles + rain in one slot) and the
// per-image Spectrum 2 override are retired; both are converted into named
// slots in their own families so nothing the user saved is lost.
// v104: scene and per-image bindings reference profile slots by stable `id`
// instead of array index, so reordering or deleting a slot can never silently
// retarget a binding. Legacy numeric refs translate against the migrated family.
// v105: per-liquid-layer retro pixelate (`spectrumLiquidLayer{1,2,3}Pixelate`),
// so one layer can read as chunky pixel art while the others stay smooth. The
// spectrum-wide `spectrumPixelate` toggle keeps meaning "all layers at once".
// v106: radial shapes are normalized in the registry (every shape now peaks at
// exactly the requested radius and reports its real trough), `cardioid` is
// retired in favour of `drop`, and `spectrumRadialSharpness` adds the per-
// instance "sharp points" control. The version bump is what makes migration run
// and seed the new key — a persisted key added without one reads as undefined.
export const STORE_PERSIST_VERSION = 106;
