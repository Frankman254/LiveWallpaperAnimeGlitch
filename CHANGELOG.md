# Changelog

All notable changes to this project are documented here. The format is loosely
based on [Keep a Changelog](https://keepachangelog.com/), and the project follows
the version scheme in `src/lib/version.ts`.

> **Versioning note** — three independent version numbers live in
> `src/lib/version.ts` and must not be conflated:
> - `APP_VERSION` — the human-facing product version (matches `package.json`).
> - `PROJECT_SCHEMA_VERSION` — the export/import project-package format.
> - `SETTINGS_SCHEMA_VERSION` — the standalone settings-file format.
> - `STORE_PERSIST_VERSION` — the Zustand `localStorage` migration counter (bumped
>   on every persisted-state shape change; **not** a product version).

## [0.3.0-alpha.1]

Release-hygiene pass — no feature or runtime behavior changes. Aligns every
version reference and cleans the repo for the first public alpha.
`STORE_PERSIST_VERSION` is at **90**; `PROJECT_SCHEMA_VERSION` and
`SETTINGS_SCHEMA_VERSION` remain at **1**.

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
