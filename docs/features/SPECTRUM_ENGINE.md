# Spectrum Engine (current)

**Status:** Stable core · Active development on accents and pixel art  
**Historical deep-dive:** `docs/archive/SPECTRUM_ENGINE.md` (may be stale)

## Overview

The spectrum engine renders audio-reactive visualizations on a per-layer Canvas 2D context. Each wallpaper may mount up to **two** spectrum instances (`primary` / clone) with independent settings.

Entry: `drawSpectrum()` in `src/components/audio/CircularSpectrum.ts`  
Dispatch: `src/features/spectrum/spectrumFamilyRegistry.ts`

## Ownership model (Spectrum 1 / Spectrum 2)

### Shared active target (editor + HUD)

The selected target is **one shared piece of UI state**: `activeSpectrumTarget`
(`'main' | 'instance'`) on the store, with `setActiveSpectrumTarget`. Both the
editor's Spectrum 1 / Spectrum 2 selector and the HUD's compact `[S1 | S2]`
selector read and write it, so they always stay in sync — changing the target in
one surface changes it in the other. It is **UI selection only** (it never alters
visual settings) and is **excluded from project persistence** (like
`controlPanelActiveTab`); it persists as a localStorage UI preference under
`lwag-spectrum-target`, falling back to the legacy `lwag-modern-spectrum-target`.

The HUD exposes **one** target-bound spectrum bank (`buildSpectrumActions`):
the `[S1 | S2]` selector plus Visible / Mirror / Peak / Follow logo / Fit logo /
Pixelate, all acting on the active target via `patchSpectrumMain` (Spectrum 1) or
`updateSpectrumInstance` (Spectrum 2). There is no second "clone" bank, and HUD
profile load/slot navigation apply to the active target only.

The editor edits **one target at a time**, chosen by the Spectrum 1 / Spectrum 2
selector. The ownership rule is strict:

- **Global zone — above the target selector.** Affects **both** spectrums and is
  labelled _Global / both_: master enable, per-spectrum visibility (show/hide
  Spectrum 1, show/hide Spectrum 2), "Color source — both spectrums", "Reset all
  Spectrums", recover overlays.
- **Target zone — below the target selector.** Affects **only the selected
  spectrum**. Every control here goes through `useSpectrumTargetSettings()`,
  whose `update()` writes to the active target only (`patchSpectrumMain` for
  Spectrum 1, `updateSpectrumInstance` for Spectrum 2). This includes family,
  shape, layout, colors, glow, **pixelate**, motion/FX, audio response, the
  per-target profile slots, and the per-target Randomize / "Reset this Spectrum".

State homes: Spectrum 1 lives in the flat `WallpaperState` keys; Spectrum 2 in
`spectrumInstances[0]`. Both carry the identical key shape
(`SPECTRUM_INSTANCE_SETTING_KEYS`), so one panel drives either spectrum.

A CI guard (`spectrumPanelKeyCoverage.test.ts`) fails if a target-bound panel
writes a key missing from `SPECTRUM_INSTANCE_SETTING_KEYS` (which would make that
key silently break on Spectrum 2).

### Profiles are per-target

Spectrum profile slots save/load the **currently selected target** only
(`saveSpectrumProfileSlot(index, target)` / `loadSpectrumProfileSlot(index,
target)`, default `'main'`). Loading a slot while editing Spectrum 2 applies the
template to Spectrum 2 and leaves Spectrum 1 untouched. The slot keeps the full
`SpectrumProfileSettings` shape for persistence/scene compatibility, but only the
per-instance template keys carry meaning. (Scenes remain a full both-spectrum
snapshot — a separate concept from single-target profiles.)

## Families

| ID             | Renderer module           | Notes                               |
| -------------- | ------------------------- | ----------------------------------- |
| `classic`      | linear + radial renderers | Bars, blocks, wave, dots, **pixel** |
| `oscilloscope` | `oscilloscopeRenderer`    | CRT line                            |
| `tunnel`       | `tunnelRenderer`          | 3D tunnel                           |
| `liquid`       | `liquidRenderer`          | Layered blobs                       |
| `orbital`      | `orbitalRenderer`         | Orbits                              |
| `spiral`       | `spiralRenderer`          | Spiral arms                         |

Capabilities per family: `spectrumFamilyCapabilities.ts`

## Instance model

- Settings keys partitioned in `spectrumInstanceModel.ts`
- `useSpectrumTargetSettings` merges defaults for Main vs Spectrum 2
- Profile slots + project export include instance keys

## Audio path

`AudioLayerCanvas` → `renderAudioLayerFrame` → `drawSpectrum` with `getAudioSnapshot()` and performance-mode FPS cap.

## Visual accents (v94+)

Neon core, gradient flow, peak sparks, echo trace — `SpectrumVisualAccentsSection`, budget in `spectrumFxBudget.ts`.

## Pixel art (v96)

See **`docs/features/SPECTRUM_PIXEL_ART.md`**.

## DEV tooling

`#/dev/spectrum-fx` — Spectrum FX Lab (development builds only).

## Tests

- `spectrumInstanceModel.test.ts`
- `spectrumVisualAccents*.test.ts`
- `pixelArtHelpers.test.ts`
- `spectrumFxLab.test.ts` (DEV)
