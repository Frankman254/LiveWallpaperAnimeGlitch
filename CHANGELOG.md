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

## [0.3.0-alpha.1]

Release-hygiene pass — no feature or runtime behavior changes. Aligns every
version reference and cleans the repo for the first public alpha.
`STORE_PERSIST_VERSION` is at **92**; `PROJECT_SCHEMA_VERSION` and
`SETTINGS_SCHEMA_VERSION` remain at **1**.

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
- Store persist version bumped to **92**. i18n en/es.
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
