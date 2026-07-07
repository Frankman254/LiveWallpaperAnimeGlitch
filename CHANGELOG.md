# Changelog

All notable changes to this project are documented here. The format is loosely
based on [Keep a Changelog](https://keepachangelog.com/), and the project follows
the version scheme in `src/lib/version.ts`.

> **Versioning note** — three independent version numbers live in
> `src/lib/version.ts` and must not be conflated:
>
> - `APP_VERSION` — the human-facing product version (matches `package.json`).
> - `PROJECT_SCHEMA_VERSION` — the export/import project-package format.
> - `SETTINGS_SCHEMA_VERSION` — the standalone settings-file format.
> - `STORE_PERSIST_VERSION` — the Zustand `localStorage` migration counter (bumped
>   on every persisted-state shape change; **not** a product version).

## [Unreleased]

### Liquid glass surfaces (store v100 → v102)

- **Reworked to a real edge lens (v102)**: the glass panel now leaves its
  **centre fully transparent** (the wallpaper shows through untouched) and only
  the **interior rim** refracts — it samples the background behind the border and
  draws it magnified, the way the lip of a real glass lens bends what's behind
  it. This removes the grey "frosted box" the full-panel version produced. The
  **Glass Magnify** slider now drives the edge-lens strength, **Glass Blur** the
  rim softness, and **Glass Tint** a light rim hue. Because the three values
  changed meaning they are **re-seeded once** for stores below v102.

- **macOS-style "liquid glass"** frosted/magnified panel behind three surfaces,
  each behind its own switch: the **Track Info / Now Playing** widget
  (`nowPlayingLiquidGlassEnabled`), the **Lyrics** block
  (`audioLyricsLiquidGlassEnabled`), and the floating **media HUD**
  (`hudLiquidGlassEnabled`). All default **off**.
- Canvas surfaces (lyrics, track info) sample the already-rendered wallpaper
  behind the panel and blur + slightly magnify it (`drawLiquidGlassPanel` in
  `components/audio/liquidGlass.ts`); the DOM HUD uses `backdrop-filter`.
- **Per-surface tuning (v101)**: each canvas surface gains **Glass Blur**,
  **Glass Magnify** and **Glass Tint** sliders
  (`nowPlayingLiquidGlass{Blur,Magnify,Tint}`,
  `audioLyricsLiquidGlass{Blur,Magnify,Tint}`) with macOS-like defaults. The
  tint **hue** reuses each surface's existing backdrop color, and geometry
  reuses the existing padding/radius. The **HUD** glass reuses the existing
  **Quick HUD Blur** and **Surface/Backdrop Opacity** sliders (its
  `backdrop-filter` now follows `--editor-shell-blur` instead of a fixed value).
- **`STORE_PERSIST_VERSION` 101 → 102**: backfills the new toggles/sliders and
  re-seeds the reworked glass tuning values onto older stores.

`STORE_PERSIST_VERSION` is at **102**; `PROJECT_SCHEMA_VERSION` and `SETTINGS_SCHEMA_VERSION` remain at **1**. `APP_VERSION` / `package.json`: **0.3.0-alpha.1**.

---

### Spectrum S1→S2 setting bleed fix (store v99)

- **Defense-in-depth** in the S2 render path (`overlayLayerRegistry.ts`): the
  instance merge now layers `createDefaultSpectrumInstanceSettings()` between
  `responsiveState` (S1 flat values) and the raw `instance` object, so any key
  absent from a persisted instance falls back to its correct per-instance default
  instead of inheriting S1's value. Fixes `spectrumManualGlow`, `spectrumScale`,
  and `spectrumSpan` bleeding from Spectrum 1 to Spectrum 2.
- **`STORE_PERSIST_VERSION` 99**: re-runs `migrateSpectrumInstances` (which does
  `{ ...createDefaultSpectrumInstance(), ...instance }`) so the fix is also
  persisted permanently into localStorage for returning users.

`STORE_PERSIST_VERSION` is at **99**; `PROJECT_SCHEMA_VERSION` and `SETTINGS_SCHEMA_VERSION` remain at **1**. `APP_VERSION` / `package.json`: **0.3.0-alpha.1**.

---

## [0.3.0-alpha.1]

### Scene-first model (backbone) + smooth image transition (FASE 0)

- **`defaultSceneSlotId`** (store v98): the scene applied to any image without an
  explicit `sceneSlotId`. Resolved at runtime via
  `resolveEffectiveSceneSlotId(image, state)` (explicit scene → default scene →
  base + legacy overrides) — images never copy the default id. Backfilled to null
  on old stores; carried in export/import + project-health validation.
- **Scene-first precedence** in `setActiveImageId`: an effective scene wins and
  legacy per-image overrides are ignored; overrides only apply when an image has
  no effective scene (back-compat fallback).
- **Scene actions:** `setDefaultSceneSlot` / `clearDefaultSceneSlot` (re-apply +
  transition the active image when it rides the default), `assignSceneToImage`,
  `setImageUseDefaultScene`, `duplicateScene`; `removeSceneSlot` now also clears a
  dangling default. Changing an image's effective scene emits a `visualTransition`.
- **UI:** new "Scene for this image" block (scene picker + default indicator +
  "Set as default" + legacy-overrides notice); per-image overrides reframed as
  legacy/back-compat. All strings i18n (en/es).
- **FASE 0 transition** (prior commit): overlay fade-in envelope on image/scene
  change (spectrum 1/2, particles, rain, logo) driven by `visualTransitionProgress`.

### Spectrum 2 independent slots + HUD shortcut layout

- **Independent profile slots per spectrum:** Spectrum 2 now owns its own
  `spectrumSecondProfileSlots` array — separate names, add/delete, and active
  indicator from Spectrum 1. The editor and HUD swap which array they show based
  on the active target. Save/load/add/remove route per target.
- **Persistence:** `STORE_PERSIST_VERSION` **97** — migration seeds
  `spectrumSecondProfileSlots` from the previously-shared slots so existing
  second-spectrum looks carry over with no data loss.
- **Export/Import:** project bundles now carry `spectrumSecondProfileSlots`
  (full replace on full export, additive merge on partial import).
- **Scenes ↔ Spectrum 2:** Scene slots gained an independent
  `spectrumSecondSlotIndex` (separate column in the Scene tab) so a scene can bind
  each spectrum to its own slot. A `null` ref keeps the back-compat behaviour
  where Spectrum 1's bundled portion drives the second instance; a set ref
  overrides just `spectrumInstances[0]`; `'off'` disables only the second
  spectrum. Wired through migration, export-strip, and project-health validation.
- **Per-image ↔ Spectrum 2:** Background images gained an independent
  `spectrumSecondOverride` (instance-only) with its own capture/clear — a
  "Spectrum 2" row in both the HUD per-image panel and the BG tab's per-image
  overrides. Applied on top of the Spectrum 1 override, composing onto
  `spectrumInstances[0]`, so an image can carry its own Spectrum 2 look. Wired
  through serialization and export-strip. (The pre-existing full `spectrumOverride`
  already snapshotted both spectrums; this adds independent S2-only control.)
- **HUD:** header quick-action shortcuts render in an auto-fit grid instead of a
  flex-wrap row, so the last button (Editor) no longer orphans onto a near-empty
  second line. Added an always-visible **S1/S2 target toggle** to the header row
  (shown when a second spectrum exists) so the active spectrum can be switched
  without opening the Spectrum panel.

### Output / Presentation / Recording (commits `287e007`, `2b85603`, `a53f6a8`)

- **Shared provider lifecycle:** `WallpaperAppProviders` mounts once above routes; audio continues across `#/edit` ↔ `#/present` without remounting `AudioDataProvider`.
- **Routes:** `#/edit`, `#/present`, `#/record`, `#/preview`; `#/editor` redirects to `#/edit`.
- **Output shell:** render-only viewport, recovery layer (`Ctrl+Shift+E`), cursor auto-hide policy, session output settings in Export → Live Output.
- **Real render scale (recording mode):** `outputRenderQuality.ts` scales 2D canvas backing and WebGL DPR (not CSS transform). Removed `OutputRenderScaleStage`.
- **Internal recorder hardening:** `preferCurrentTab` display capture, fullscreen after picker, disabled manual fullscreen during record, WebM VP9 preferred, clearer error strings (EN/ES).
- **Tests:** provider lifecycle, output render quality, display media options, runtime UI mode.

### Spectrum Pixel Art (commit `0bf9d914`)

- **Pixel shape:** Classic linear LED cell renderer (`drawLinearPixel`); radial falls back to bars.
- **Pixelate post-process:** Per-instance offscreen scene + down/upscale (`spectrumPixelate`, `spectrumPixelateScale`).
- **Persistence:** `STORE_PERSIST_VERSION` **96** — migration backfills pixelate keys; shape available in linear style list.
- **Helpers/tests:** `pixelArtHelpers.ts`, unit tests for scale, radial fallback, quantization.

### Documentation & tooling

- Added `docs/status/CURRENT_SYSTEM_STATUS.md`, `docs/architecture/OUTPUT_MODES.md`, `docs/features/SPECTRUM_PIXEL_ART.md`, `docs/features/SPECTRUM_ENGINE.md`, `docs/performance/PERFORMANCE_BASELINE.md`.
- Re-audited `docs/audits/RECORDING_SUBSYSTEM_AUDIT.md`.
- Added `pnpm docs:check` (`scripts/check-doc-consistency.mjs`) in CI.
- Archived superseded status snapshots to `docs/archive/`.

### Schema versions (current)

`STORE_PERSIST_VERSION` is at **98**; `PROJECT_SCHEMA_VERSION` and `SETTINGS_SCHEMA_VERSION` remain at **1**. `APP_VERSION` / `package.json`: **0.3.0-alpha.1**.

---

## [0.3.0-alpha.1] — release hygiene (initial alpha tag)

Release-hygiene pass — aligns version references for first public alpha.

### Fixes

- **Spectrum tab crash** (`Cannot read properties of undefined (reading 'toFixed')`).
  The new `spectrumScale` setting shipped without bumping `STORE_PERSIST_VERSION`, so
  existing persisted state never ran the migration that backfills it and the Scale
  slider read `undefined`. Bumped the store version to **91** (migration now runs) and
  hardened `useSpectrumTargetSettings` to merge over defaults for both the Main and
  instance targets, so no missing key can leak `undefined` into the editor controls.
  Added a regression test asserting every `SPECTRUM_INSTANCE_SETTING_KEYS` entry has a
  default.

### Housekeeping

- Bumped `APP_VERSION` / `package.json` to `0.3.0-alpha.1`.
- Standardized on **pnpm** as the package manager; removed the stray
  `package-lock.json` (dual-lockfile cleanup).
- Updated `README.md` and `docs/README.md` to the current version, pnpm commands,
  and the new alpha scope doc; dropped stale `0.2.0` references.
- Added `docs/product/V1_ALPHA_SCOPE.md` freezing the alpha scope (in / out).
- Archived obsolete root drafts into `docs/archive/`
  (`PLAN.md`, `POLISH.md`, `SPECTRUM_ENGINE.md`, the Lights/Camera/Motion draft)
  and moved `ESTADO_PROYECTO_0_2_0.md` there.
- Removed development junk from the repo root (build `.zip`, exported settings JSON).

### Testing & tooling (Fase 3)

- Added **Vitest** with an isolated `vitest.config.ts` (Node env, no build plugins)
  and a dedicated `tsconfig.test.json`; `*.test.ts` are excluded from the app build.
- First **39 pure-logic tests**: `math`, `audioEnvelope`, version consistency
  (`APP_VERSION` ↔ `package.json`), and `resolveImageTransform` (fit modes, rotation
  extents, min-cover scale, keep-covered clamping/warnings, mirror-fill depth).
- New scripts: `test`, `test:run`, `test:types`.
- Formatted the entire repo with Prettier and cleared all ESLint **errors**
  (typed File System Access usages off `any`, `@ts-ignore` → typed input, removed an
  unused prop binding) so `lint` and `format:check` are green ahead of CI.

### CI (Fase 4)

- Added **GitHub Actions** workflow `.github/workflows/ci.yml` running on push to
  `main`, every pull request, and manual dispatch. Steps (pnpm via
  `pnpm/action-setup`, Node 22 with pnpm cache): `install --frozen-lockfile` →
  `format:check` → `lint` → `test:types` → `test:run` → `build`.
- Added a CI status badge to the README.

### Spectrum manual glow

- New opt-in **manual glow** for the classic `bars` and `wave` shapes (radial and
  linear). The fill keeps its color-source colors (rainbow / image / theme) while
  the glow is tinted by the two manual colors, **decoupled from `spectrumColorSource`**
  (the raw manual colors are carried to the renderer as runtime-only
  `spectrumGlowPrimary/SecondaryColor`), so it works in manual, image and theme alike.
- Three modes: **Core + Halo** (inner glow = primary, outer halo = secondary),
  **Gradient** (glow blends primary→secondary), **Glow + Peaks** (glow = primary,
  peak markers = secondary — offered for `bars` only, since `wave` has no peaks).
  Controls live in the Spectrum → Style panel; per-spectrum (Spectrum 1 and 2).
- When manual glow is on, the primary/secondary swatches stay editable even under the
  **Current Image / Theme** sources (shown under a "Glow colors" sub-label), so the
  glow colors no longer require switching back to Manual.
- Store persist version bumped to **93**. i18n en/es.
- **RGB split (chromatic aberration)** effect for the classic wave — an opt-in
  toggle + amount slider that re-strokes the trace with offset red/blue copies
  (additive blend) for a glitchy retro-CRT fringe. Cheap (~2 extra strokes/frame,
  Canvas-2D). On theme with the "anime glitch" identity.
- **Spiral family rework**: manual glow extended to spiral (core-halo / gradient
  modes) plus a lush additive **bloom halo** under the spine — the same premium glow
  that makes the classic wave appealing — and a subtle radial depth falloff on the
  dots. Opt-in via the manual glow toggle; off = unchanged.
- **Manual glow extended to all animated families** — spiral, oscilloscope, tunnel,
  liquid and orbital now honor the manual glow toggle. The fill keeps its color-source
  colors; the glow uses the manual colors (decoupled from the source). In Gradient mode
  the per-element glow blends primary→secondary across the shape. The oscilloscope —
  which had no bloom at all — now gets a real trace glow. All opt-in; off = unchanged.

### First-run experience (Fase 5)

- Added an inline **first-run empty state** over the wallpaper (editor only, not a
  modal) shown while no background image exists. Three golden-path CTAs: **Try a demo
  scene** (one click — generates a procedural gradient background and activates it;
  spectrum/particles are on by default so it reacts immediately), **Load image**, and
  **Load audio**. Dismissable for the session ("Start from blank") without a persisted
  flag, so no store migration. Fully internationalized (en/es).

## [0.3.0-alpha]

This release stabilizes a large wave of feature growth. `STORE_PERSIST_VERSION` is
at **82**; `PROJECT_SCHEMA_VERSION` and `SETTINGS_SCHEMA_VERSION` are at **1**.

### Editor / UI

- **Modern editor UI** with a `legacy | modern` variant switch and an isolated
  `editorTheme` resolver (branch-isolated palette, neutral image fallback, universal
  rainbow boost).
- **Simple / Advanced UI modes** — tabs collapse to essential controls in simple mode
  and reveal detailed controls in advanced mode.
- Design-system consolidation under `src/ui` (tokens + base components).

### Projects, Setlists & Scenes

- **Project / setlist system** — named curations of the global image pool with strict
  filtering when active, a Scene sub-tab, and a HUD chip.
- **Scene bindings are explicit** — edits do not auto-apply; empty slots render
  disabled and an explicit Apply with a visible diff is required.

### Background

- **Background transform model** — `Keep Screen Covered` is now independent from bass;
  a single `resolveCoveredImageTransform` helper drives both render and preview, and
  previews use the real screen aspect (WYSIWYG).
- **Mirror Fill** — minimal dynamic clones with a 1px seam overlap and Y-axis mirroring;
  `coverageActive = keepCovered && !mirrorFill`.

### Spectrum

- Spectrum **family improvements** across linear / radial / spiral / tunnel / orbital /
  liquid / oscilloscope renderers, including mirror handling.
- Time-domain pipeline (`getTimeDomainBins`) plumbed end-to-end with phosphor + grid FX.
- **Synthetic calibration** sprint — honest slider behavior, scope smoothing tied to
  scroll speed, spectrogram removed.
- **Manual spectrum control** — keyboard-driven spectrum (audio / max / add / manual
  modes) via a reusable runtime module.

### Stage FX (new)

- **Stage Lights** — directional concert beams from configurable edges, with sweep
  styles, audio reactivity (hold + decay envelope), gating, and blend modes.
- **Flash Light** — audio-peak impact overlay, independent from the beams, using a
  cached shape canvas and a decay-to-zero envelope.
- **Camera FX (Camera Motion)** — drift / circle / figure-eight / orbit / pendulum
  motion applied to marked visual roots only (HUD/editor stay fixed), with per-target
  selection.
- **Screen Shake** — horizontal / vertical / punch / jitter / kick-snap modes that
  trigger on audio peaks and decay back to rest.

### Audio

- **Multitrack playlist** system (playlist tracks, auto-advance on track end, mix UI).
- Background bass-zoom envelope with Classic / Smooth / Punchy presets.

### Import / Export

- Project-package import/export improvements, including partial imports that tolerate
  missing audio (shallow-merge path that avoids the `structuredClone` + Zustand-setter
  pitfall).

### Performance & safety caps

- Hard FX ceilings in `STAGE_FX_CAPS` / `CAMERA_FX_CAPS` so effects can never whiteout
  the screen or run unbounded blur (`maxBeamCount`, `maxBeamBlurPx`, `maxFlashOpacity`,
  `maxShakePx`, `maxMotionPx`, `maxScale`).
- Per-`performanceMode` budgets (`resolveStageLightsBudget`) that scale beam count and
  blur down on `low` / `medium`.
- **Stage Lights render audit (this release):** the beam loop now early-outs when the
  layer is effectively invisible (opacity/intensity 0 or audio-gated below threshold),
  parses the beam color once per frame instead of per gradient stop, and drops/softens
  the haze, core, and flare shadow-blur passes on `low` / `medium` performance modes.

### HUD / QuickActions

- Added on/off toggles for **Stage Lights, Flash Light, Camera FX, Screen Shake** to the
  Motion quick-actions group, plus **Keep Covered** and **Mirror Fill** (background
  transform) to the Looks group — all wired to existing store flags.
- Fully internationalized the QuickActions HUD under the `qa_*` key namespace (every chip
  label + tooltip, both EN/ES); builders now take the active translations object.

### Notes / known debt

- Stage Lights gradients are still re-created each frame because beam geometry changes
  per sweep; an offscreen gradient/mask cache is a larger architectural change deferred
  past this sprint.
