# Handoff: Background zoom envelope (logo-style) + BG tab presets

This document summarizes changes made so another session (e.g. Claude) can continue debugging or extend the feature.

## Goal

- Drive **background image scale boost** with the **same `createAudioEnvelope()` pipeline** as the logo (attack, release, reactivity speed × 2.4, peak window, peak floor, punch, reactive scale intensity).
- **Defaults** match the **previous hardcoded** `ImageLayerCanvas` behavior (“Classic” preset).
- Remove the old **global scene presets UI** (`PresetSelector`) from the **BG** tab only.
- Add **three global built-in presets** for BG zoom envelope: Classic, Smooth, Punchy.
- Extend the **top-left scale meter HUD** with logo-like telemetry (router smoothed, envelope norm, σ / peak / floor).

## Files touched (by area)

### New

- `src/features/presets/imageBassZoomProfiles.ts` — `IMAGE_BASS_ZOOM_CLASSIC | SMOOTH | PUNCHY`, `releaseToLegacyDecay()`, preset record.
- `src/components/controls/tabs/bg/BgZoomAudioSection.tsx` — UI: 3 preset buttons, toggle, channel, max boost slider, collapsible advanced envelope sliders.
- `docs/HANDOFF_BG_BASS_ZOOM_ENVELOPE.md` — this file.

### State & persistence

- `src/types/wallpaper.ts` — New fields: `imageBassAttack`, `imageBassRelease`, `imageBassReactivitySpeed`, `imageBassPeakWindow`, `imageBassPeakFloor`, `imageBassPunch`, `imageBassReactiveScaleIntensity`, `imageBassZoomPresetId` (`'classic' | 'smooth' | 'punchy' | null`).
- `src/lib/constants.ts` — `DEFAULT_STATE` spreads `IMAGE_BASS_ZOOM_CLASSIC` and sets `imageBassZoomPresetId: 'classic'`.
- `src/store/slices/backgroundSlice.ts` — Setters for each field; `applyImageBassZoomPreset`; `setImageBassRelease` / `applyImageBassZoomPreset` / `setImageAudioReactiveDecay` keep **`imageAudioReactiveDecay` and every `BackgroundImageItem.audioReactiveDecay`** in sync via `releaseToLegacyDecay()` (legacy formula: `release = 0.02 + (1 - decay) * 0.2`).
- `src/store/wallpaperStoreTypes.ts` — Action typings for the above.
- `src/store/wallpaperStorePersistence.ts` — Migrate: new envelope fields default from `DEFAULT_STATE`, except `imageBassRelease` falls back to `0.02 + (1 - legacyDecay) * 0.2` when missing (preserves old saves).
- `src/store/wallpaperStore.ts` — Persist `version` bumped **19 → 20**.

### Rendering

- `src/components/wallpaper/layers/ImageLayerCanvas.tsx` — Replaced hardcoded envelope config with store fields; `responseSpeed: imageBassReactivitySpeed * 2.4` (same pattern as `ReactiveLogo`). Publishes extended telemetry when the scale meter HUD is on.

### Debug / HUD

- `src/lib/debug/backgroundScaleTelemetry.ts` — Added `channelRouterSmoothed`, `envelopeNormalized`, `envelopeSmoothed`, `adaptivePeak`, `adaptiveFloor`.
- `src/components/wallpaper/BackgroundScaleMeter.tsx` — Displays the new lines (aligned with logo diagnostics style).

### UI / i18n

- `src/components/controls/tabs/BgTab.tsx` — Removed `PresetSelector`; inserted `BgZoomAudioSection` at top (after reset).
- `src/components/controls/tabs/bg/SlideshowPoolSection.tsx` — Removed the entire **Audio reactivity** block (moved to `BgZoomAudioSection`).
- `src/components/controls/ControlPanel.tsx` & `EditorOverlay.tsx` — `TAB_KEYS.presets` includes the new `imageBass*` keys for “Reset tab”.
- `src/lib/i18n/en.ts`, `src/lib/i18n/es.ts` — New strings for BG zoom section, preset labels, meter labels.

## Preset values (reference)

| Preset  | Role                                                                                                                                                                    |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Classic | Former fixed code: attack `1.3`, release `0.096` (= decay `0.62`), reactivity speed `2.65/2.4`, peak window `1.05`, floor `0.015`, punch `0.22`, scale intensity `1.2`. |
| Smooth  | Softer, wider peak memory, higher floor, lower intensity (less “stuck at 100%”).                                                                                        |
| Punchy  | Faster, shorter peak window, more punch, higher intensity.                                                                                                              |

## Known follow-ups / risks

1. **`PresetSelector` removed from BG tab only** — Built-in/custom full-scene presets (`softDream`, etc.) are **no longer reachable from the BG tab**. They still exist in `src/lib/presets.ts` and `useWallpaperStore.applyPreset` if you add UI elsewhere.
2. **`imageBassZoomPresetId`** is set to `null` when any envelope slider is changed manually; only `applyImageBassZoomPreset` sets it to `classic` | `smooth` | `punchy`. No auto-detect when manual values happen to match a preset.
3. **Per-image `audioReactiveDecay`** is still updated when global release/preset/decay changes, for backward compatibility with older data paths; the **live envelope** uses **global** `imageBassRelease` only.
4. **Logo tab “Reactive scale”** slider max remains `1.5`; BG advanced uses **up to `2.5`** for `imageBassReactiveScaleIntensity` to allow Classic’s `1.2` and Punchy’s `1.35` without changing logo ranges.

## How to verify quickly

1. Open **BG** tab: see **Background zoom (audio)** with three presets; **no** preset strip at top.
2. Enable bass zoom, open **Diag** → scale meter: check **norm**, **σ / peak / floor** move with audio.
3. Apply **Smooth** vs **Classic** on a loud track: boost bar should spend less time pegged on Smooth (tuning subjective).
4. `./node_modules/.bin/tsc -b` passes.

## Commands

```bash
./node_modules/.bin/tsc -b
npm run serve
```
