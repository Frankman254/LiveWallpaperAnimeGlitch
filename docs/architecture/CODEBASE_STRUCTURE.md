# Codebase Structure

How the `src/` tree maps to the current product. This is a navigation guide for
humans and agents — when something here disagrees with the tree, the tree wins
(and this doc should be updated).

> **Naming rule:** folders and components describe the **current** product, not
> its history. Do not introduce `modern`, `new`, `v2`, `current`, `legacy`, or
> `temp` as names for the live UI. If something is genuinely experimental, label
> it explicitly and document why.

## Top-level map

| Area                                   | Lives in                                        |
| -------------------------------------- | ----------------------------------------------- |
| App entry / routes / shells            | `src/App.tsx`, `src/pages/`                     |
| Provider stack (above routes)          | `src/components/app/`                           |
| Shared low-level UI (tokens, controls) | `src/ui/`                                       |
| Editor control panel + tabs            | `src/components/controls/`                      |
| Output/Presentation/Recording shell    | `src/pages/OutputShellPage.tsx`, `src/runtime/` |
| Wallpaper render stage                 | `src/components/wallpaper/`                     |
| Feature engines (render/runtime/logic) | `src/features/*`                                |
| Audio capture / analysis / media keys  | `src/context/audioData/`, `src/lib/audio/`      |
| Global state                           | `src/store/`                                    |
| Pure utilities / persistence           | `src/lib/`                                      |

## Editor controls

The editor's tab UI lives under `src/components/controls/`:

- `ControlPanel.tsx` / `EditorOverlay.tsx` — the two editor shells that mount the tabs.
- `tabs/main/` — **the current editor tab entry-points**, one component per tab
  (`SpectrumTab`, `BackgroundTab`, `MotionTab`, `AudioTab`, `OutputTab`,
  `SceneTab`, `LooksTab`, `LayersTab`, `DiagnosticsTab`, `PerformanceTab`,
  `TrackTitleTab`, `EditorTab`, `LyricsTab`, `LogoTab`, `LegacyTabAdapter`).
  Formerly `tabs/modern/` (renamed 2026-06; "modern" had come to mean
  "current"). The historical `Modern*` naming has been fully removed from the
  live UI.
- `tabs/spectrum/`, `tabs/bg/`, `tabs/audio/`, `tabs/export/` — the **feature
  sections** each tab composes.
- `tabs/CalibrationTab.tsx` — calibration controls.

## Where renderers and engines live

- Spectrum renderers: `src/features/spectrum/renderers/`
- Spectrum effects (glow, neon, rgb split, echo…): `src/features/spectrum/effects/`
- Spectrum runtime/profiles: `src/features/spectrum/runtime/`, `src/lib/featureProfiles.ts`
- Pixel Art: `src/features/spectrum/pixelArtHelpers.ts` (+ `renderers/linear/`)
- Audio runtime / media-session / playlist: `src/context/audioData/`
- Output render quality / debug overlay: `src/runtime/`

## Where do I edit X?

| Want to change…    | Edit here                                                                         |
| ------------------ | --------------------------------------------------------------------------------- |
| Background UI      | `src/components/controls/tabs/main/BackgroundTab.tsx` + `tabs/bg/`                |
| Spectrum UI        | `src/components/controls/tabs/main/SpectrumTab.tsx` + `tabs/spectrum/`            |
| Spectrum renderers | `src/features/spectrum/renderers/`                                                |
| Pixel Art          | `src/features/spectrum/pixelArtHelpers.ts`                                        |
| Audio / media keys | `src/context/audioData/` (e.g. `mediaTrackKeys.ts`, `useAudioPlaybackEffects.ts`) |
| Import/Export      | `src/features/export/`, `src/lib/featureProfiles.ts`                              |
| Stage FX           | `src/features/` (stage FX) + `tabs/main/MotionTab.tsx`                            |
| Particles / Rain   | `tabs/main/MotionTab.tsx` (motion controls)                                       |
| Output / Recording | `tabs/main/OutputTab.tsx` + `src/runtime/` + `src/features/recording/`            |

## Tests & docs

- Unit tests live beside their source as `*.test.ts` (Node env, no DOM).
- Docs live in `docs/`; `docs/README.md` indexes them.
- Structure guard: `pnpm structure:check` (`scripts/check-codebase-structure.mjs`).

## Naming

- `tabs/main/` holds the **current** editor tab entry-points. The historical
  `modern` naming has been removed from the live UI (folder + all `Modern*`
  components, sub-cards, hooks, and prop types). `pnpm structure:check` guards
  against regressions.
- **Future batch (not done):** feature-specific control sections may later move
  next to their engines under `src/features/*/controls/` — only if a smaller,
  safe move proves cleaner first.

> Persisted `localStorage` keys (`lwag-modern-editor-scroll-map`,
> `lwag-modern-spectrum-view`, `lwag-modern-spectrum-target`) and the
> `MODERN_*_STORAGE_KEY` constants that hold them keep their historical names on
> purpose — renaming them would break existing users' saved state.
