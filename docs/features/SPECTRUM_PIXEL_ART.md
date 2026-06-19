# Spectrum Pixel Art

Two **independent** features share a retro aesthetic. They must not be confused in UI or documentation.

## A. Pixel Shape (`spectrumShape: 'pixel'`)

### Definition

- **Family:** Classic only (linear mode)
- **Renderer:** `drawLinearPixel` in `linearRenderer.ts`
- **Look:** Stacked square LED / VU-meter cells per bar
- **Cell size:** Derived from `spectrumBarWidth` (square cells)
- **Quantization:** Bar height → integer cell count (`quantizePixelBarCells`, cap 256)
- **Glow:** Intentionally disabled (`shadowBlur = 0`) for crisp pixels

### Radial mode

**Not supported.** `resolveClassicRadialShapeFallback('pixel')` → renders as **bars**.

UI shows `spectrum_pixel_shape_radial_hint` when Classic + Radial + Pixel selected.

### Settings (persisted)

- `spectrumShape`
- Shared bar geometry: `spectrumBarCount`, `spectrumBarWidth`, `spectrumMinHeight`, `spectrumMaxHeight`, linear orientation/direction, mirror, colors

### Migration

Store **v96** — shape available in `SPECTRUM_LINEAR_STYLES`; no separate keys beyond shape enum.

### When to use

- Horizontal/vertical equalizer with hard edges
- Pair with low glow and optional pixelate post-process for full-scene retro look

---

## B. Pixelate Post-Process (`spectrumPixelate` + `spectrumPixelateScale`)

### Definition

- **Scope:** Entire output of **one Spectrum instance** (any family)
- **Pipeline:**
    1. Draw spectrum into offscreen `pixelateSceneCanvas` (full backing size)
    2. Downsample to `pixelateSmallCanvas` (`floor(w/scale)`, `floor(h/scale)`)
    3. Upscale to output with `imageSmoothingEnabled = false`
- **Isolation:** Per `instanceKey` runtime buffers — Spectrum 1 and 2 independent
- **Does not affect:** Background, logo, particles, other overlays

### Settings (persisted)

| Key                     | Default | Range              |
| ----------------------- | ------- | ------------------ |
| `spectrumPixelate`      | `false` | toggle             |
| `spectrumPixelateScale` | `4`     | 2–16 px block size |

Higher **Pixel size** = coarser grid (larger visual pixels).

### Helpers

`src/features/spectrum/pixelArtHelpers.ts` — scale normalization, active check, small canvas dimensions.

### Performance cost

- Extra full-size scene canvas + down/up blit per active spectrum per frame
- Disabled path: near-zero (`isPixelatePostProcessActive` false → direct draw)

### Compatibility with effects

| Effect                                               | Expected with pixelate                              |
| ---------------------------------------------------- | --------------------------------------------------- |
| Manual Glow                                          | Composited before pixelate (glow may become blocky) |
| RGB Split                                            | Applied in classic path; then pixelated             |
| Neon Core / Gradient Flow / Peak Sparks / Echo Trace | Pixelated as part of full scene                     |
| Tunnel / Liquid / Orbital / Spiral / Oscilloscope    | Supported (whole family output pixelated)           |

Accidental pass-through is intentional: post-process is **family-agnostic**.

---

## Recommended combinations

| Goal                | Shape            | Post-process             |
| ------------------- | ---------------- | ------------------------ |
| LED meter           | Pixel            | Off or light (scale 2–4) |
| 8-bit full spectrum | Bars/Wave        | On (scale 4–8)           |
| Radial retro        | Bars (not Pixel) | On                       |
| Clean modern        | Bars/Wave        | Off                      |

---

## Recording / output interaction

| Scenario                       | Risk                                                  |
| ------------------------------ | ----------------------------------------------------- |
| Presentation + OBS             | **Stable** — captures final pixels                    |
| Recording scale 1.0            | Pixel grid matches backing                            |
| Recording scale 0.5            | **Double resampling** with pixelate may soften blocks |
| Recording scale 0.5 + pixelate | Inspect blur; prefer scale 1.0 for pixel-art exports  |

---

## Known limitations

1. Pixel shape linear-only; radial uses bar fallback (not blocked in UI).
2. No per-layer pixelate (logo/background unaffected).
3. Performance not fully benchmarked across all resolutions — see `docs/performance/PERFORMANCE_BASELINE.md`.
4. `lines` / `capsules` legacy shapes normalize to `blocks`, not pixel.

---

## File map

| File                        | Role                         |
| --------------------------- | ---------------------------- |
| `linearRenderer.ts`         | `drawLinearPixel`            |
| `spectrumFamilyRegistry.ts` | Radial fallback              |
| `CircularSpectrum.ts`       | Post-process blit            |
| `pixelArtHelpers.ts`        | Pure helpers + tests         |
| `SpectrumStylePanel.tsx`    | Pixelate toggle + scale      |
| `SpectrumFamilyPanel.tsx`   | Shape selector + radial hint |
| `SpectrumStyleSelector.tsx` | Shape cards (i18n)           |
