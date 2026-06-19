# Spectrum Engine (current)

**Status:** Stable core · Active development on accents and pixel art  
**Historical deep-dive:** `docs/archive/SPECTRUM_ENGINE.md` (may be stale)

## Overview

The spectrum engine renders audio-reactive visualizations on a per-layer Canvas 2D context. Each wallpaper may mount up to **two** spectrum instances (`primary` / clone) with independent settings.

Entry: `drawSpectrum()` in `src/components/audio/CircularSpectrum.ts`  
Dispatch: `src/features/spectrum/spectrumFamilyRegistry.ts`

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
