# UI Refactor Plan — Claude Design integration

Working doc for the editor UI migration. Track what's done, what's pending, and where each piece lives. Update as slices land.

---

## Current architecture (two parallel UI layers)

| Layer                         | Path                          | Status              | Used by                                              |
| ----------------------------- | ----------------------------- | ------------------- | ---------------------------------------------------- |
| **Canonical** (Claude Design) | `src/ui/`                     | Active, growing     | `ModernControlPanel`, `ModernSceneTab`               |
| **Legacy**                    | `src/components/controls/ui/` | Frozen, back-compat | `ControlPanel.tsx` (legacy) + every non-migrated tab |

Toggle between them at runtime via the store: `editorUiVariant: 'legacy' | 'modern'`. Buttons in both panel headers switch live; preference persists in `lwag-state` (v49). Default = `legacy` for new installs.

---

## Done

### Foundation

- [x] **Design tokens** — `src/ui/tokens/` (spacing · radius · colors · glow · blur · motion · zIndex). `UI_COLORS` aliases existing `--editor-*` CSS vars so the theme pipeline drives the system.
- [x] **11 base components** in `src/ui/`:
    - `Button`, `IconButton`, `ToggleSwitch`, `SegmentedControl`
    - `Slider` (3 variants: compact / normal / macro)
    - `Select` (custom dropdown via `FloatingPanel` — no native `<select>`)
    - `SectionCard`, `CollapsibleSection`
    - `FloatingPanel` (portal-free popover, outside-click + Escape)
    - `Tabs` (with `wrap` prop, default true), `SidebarNav` (with `compact` prop)
    - `cn()` helper in `src/ui/lib/cn.ts`
    - Barrel: `import { ... } from '@/ui'`
- [x] **Store: `editorUiVariant`** (`legacy` | `modern`) — `systemSlice.ts` setter + types + default `legacy` + migration entry. Persist `v48 → v49`.

### Shell

- [x] **`ModernControlPanel.tsx`** — full glass shell (blur 24px / saturate 140% / modal shadow). Header with square accent logo + title + mode `SegmentedControl` + audio/drag/fullscreen/language/maximize `IconButton`s + History (back to legacy) button.
- [x] **Vertical sidebar nav** — replaces overflow-x tab strip. 144 → 52px collapse via header button (`PanelLeftClose` / `PanelLeftOpen`). State persists in `localStorage` (`lwag-sidebar-collapsed`).
- [x] **Mode banner** persistent under header (Simple / Advanced).
- [x] **Advanced sub-tabs** as `Tabs size="sm" wrap` at top of content (no more horizontal overflow).
- [x] **`ModernTabFrame.tsx`** — `SectionCard` wrapper. Every non-migrated tab is at least framed.
- [x] **`EditorPage.tsx`** — conditional render: `editorUiVariant === 'modern' ? ModernControlPanel : ControlPanel`.

### Tabs (content)

- [x] **`ModernSceneTab.tsx`** — full rebuild with design pattern. Three `SectionCard`s: Scenes (radio-circle activator + bound badge + rename inline + delete confirm) · Bindings (per-subsystem `Select`) · Sequence (image grid with `FloatingPanel` scene-assign).
- [x] **`ModernSpectrumTab.tsx` S1A** — Spectrum now has its own modern top-level tab instead of being rendered as the legacy `SpectrumTab` inside `ModernTabFrame`. Uses modern `SectionCard`, `Button`, `ToggleSwitch`, compact color shortcuts, saved slots, quick adjust, main/circular system cards, and reset/recovery actions while preserving the existing spectrum state/actions.
- [x] **Spectrum inner chrome S1B partial** — `SpectrumGroup` and `SpectrumMacroStrip` now use `@/ui` `SectionCard` instead of local per-tab card styling.
- [x] **`ModernLooksTab.tsx` S2** — Looks/Filters now has its own modern top-level tab with look-pack cards, target controls, tone/glitch/cinematic/scanline sections, saved slots, and reset actions. Existing filter store actions and ranges are preserved.
- [x] **`ModernLayersTab.tsx` S3A** — Layers now has a modern top-level orchestrator with compact BG / Stack / Overlays sections. The render-stack and overlay editor use `@/ui` cards, switches, segmented controls, sliders, and buttons while preserving the same layer ordering, toggle, overlay upload, and selected-overlay update logic. BG remains bridged to the existing `BgTab` because it owns the current high-risk image/slideshow workflow.

### Spectrum tab polish (this slice)

- [x] **Removed `xl:grid xl:grid-cols-2`** in both `SpectrumMainSection.tsx:194` and `SpectrumCloneSection.tsx:49`. These were forcing a 2-column grid at viewport ≥ 1280 px even though the editor panel is ~480 px wide → content overflowed and felt cramped. Now single-column always.
- [x] **Removed redundant On/Off rows** in the `Spectrum` and `Circular Spectrum` cards — the `ToggleSwitch` already lives in the card `action`, the extra status row was duplicate UI.
- [x] **Flattened "Quick Adjust" + Macros** — `SpectrumMacroStrip` no longer wraps itself in a nested `SectionCard`; it renders as a labeled slider cluster inline. One card instead of card-in-card.
- [x] **Removed duplicate "Saved Profiles" title** — outer `SectionCard.title` stays; `ProfileSlotsEditor.title=""` so its internal `SectionDivider` shows as a thin separator only.
- [x] **Circular Spectrum body content** — only renders `SpectrumCloneSection` when the toggle is on; collapsed state shows a one-line hint instead of an empty enabled/disabled row.
- [x] **Recovery & Reset row** — `grid-cols-1 sm:grid-cols-3` → `flex flex-wrap`. The viewport-breakpoint grid forced 3 cols on every desktop even when the panel column was narrow; flex-wrap respects actual available width.

### Panel overflow + sidebar width (this slice)

- [x] **Panel vertical overflow fix** — `verticalMarginRem` was `3/4rem` (top/bottom) but the wrapper + panel anchor offsets reserve **6/5rem** of viewport vertical space (wrapper `top-12`/`bottom-8` + panel `top-12`/`bottom-12`). Bumped to **7/6rem** including 1rem visual safety. The panel no longer extends past the viewport edge on heavy tabs.
- [x] **Sidebar adapts to longest label** — `<aside>` width is now `'max-content'` (clamped to `min/max 96/160 px`) for expanded. Labels like `Rendimiento` (longest Spanish) now define the column width; no empty space to the right of shorter labels. Removed `flex-1` from the label span in `SidebarNav` so labels size to their content instead of stretching.
- [x] **Collapsed sidebar narrower** — `38 px` (was 52). Combined with `p-1` (4px) → 30px icon area, sufficient for the 14px icon.

### Active-image fidelity + perf + toggle visibility (this slice)

- [x] **`resolveEditorImagePreviewUrl(image, quality, forceOriginal = false)`** — new third param. When `true`, returns `image.url` regardless of the global `editorImagePreviewQuality` setting.
- [x] **Quality toggle surfaced** in the **Sequence** card header of `ModernSceneTab` as a `SegmentedControl` (Optimized / Original). Previously buried inside Advanced → Editor → Appearance.
- [x] **Active image always = original** — wired in all 5 call sites:
    - `ModernSceneTab` and legacy `SceneTab` — Sequence grid (`forceOriginal={isActive}`)
    - `BgTab` — live `imagePreviewUrl` (`forceOriginal: true`)
    - `SlideshowPoolSection` — pool grid (`forceOriginal={isActive}`)
    - `SlideshowClipTimeline` — clip strip (`forceOriginal={isActive}`)
- [x] **Perf: removed `backdrop-filter` from `SectionCard`**. Stacked blur (16 px inside a 24 px shell blur) was the primary compositor cost during scroll/drag. Shell blur preserved.
- [x] **Tighter modern density**: `SectionCard` default body `16 → 12 px`, header `12/16 → 10/14 px`. `ModernSceneTab` inter-card gap `12 → 8 px`.
- [x] **Layers BG bridge polish S3B partial** — `BgTab` now accepts `chrome="modern"` so the modern Layers tab can reuse the existing high-risk image/slideshow logic without duplicate legacy reset buttons or section dividers. `ModernLayersTab` scopes denser BG control CSS vars and a responsive preview height only to the modern BG view.
- [x] **Slideshow controls S3B leaf migration** — `BgSlideshowControls` now uses canonical `@/ui` `ToggleSwitch`, `Button`, and `Slider` for the slideshow/timestamp control block while leaving manual timeline math and store actions unchanged.
- [x] **Active wallpaper S3B leaf migration** — `ActiveWallpaperSection` now uses canonical `@/ui` buttons and switches for image navigation, upload, mirror, auto-fit, per-image overrides, and manual timestamp nudges. Precision sliders and drag-to-position preview math are unchanged.
- [x] **Slideshow pool S3B leaf migration** — `SlideshowPoolSection` now uses canonical `@/ui` buttons, switches, and collapsible sections for upload/clear, pool navigation, thumbnail visibility, virtual folders, and slideshow section chrome. Drag/drop ordering and clip timing are unchanged.
- [x] **Global background S3B leaf migration** — `GlobalBackgroundSection` now uses canonical `@/ui` buttons, switch, and compact sliders for global image enable/upload/remove and filter controls. Precise BG scale/position controls remain unchanged.
- [x] **BG full closure** — `BgFitModeSelector`, `BgZoomAudioSection`, and BG audio-channel selection now use canonical `@/ui` primitives. The BG folder no longer imports legacy visual controls (`ToggleControl`, `SliderControl`, `EnumButtons`, `SectionDivider`, `ProfileSlotsEditor`, or legacy `CollapsibleSection`); only dialog confirmation remains shared.
- [x] **`ModernMotionTab.tsx` S4** — Motion now has its own modern top-level tab for motion profiles, particles, and rain. Particles and rain render as separate `SectionCard`s with macro sliders for the highest-impact density/intensity controls, compact controls for detail tuning, and advanced disclosures for filters/audio/profile slots. Existing store actions, ranges, profile slots, and reset keys are preserved.
- [x] **`ModernAudioTab.tsx` S5** — Audio now has its own modern top-level tab for playlist upload, virtual folder import, track list/reorder, per-track trim/details, playback controls, capture controls, transport, crossfade/mix mode, media session, and FFT routing. Existing `AudioDataContext` APIs, playlist actions, store setters, capture flow, crossfade behavior, and FFT ranges are preserved.
- [x] **Audio structural split** — `ModernAudioTab.tsx` is now an orchestrator around focused `tabs/modern/audio/*` modules: playlist, track row, track detail, mix, capture, transport, analysis, shared UI controls, and audio tab utilities. Audio engine/context behavior is unchanged.
- [x] **Advanced S6A: `ModernDiagnosticsTab.tsx` + `ModernPerfTab.tsx`** — Diagnostics HUD toggles, audio preview diagnostics, state snapshots, performance modes, window tools, sleep mode, and danger-zone actions now render through canonical `@/ui`. Existing telemetry hooks, diagnostic RAF sampling, performance-safe behavior, mini-player/fullscreen controls, reset, and storage clear behavior are preserved.
- [x] **Advanced S6B: `ModernLogoTab.tsx` + `ModernTrackTitleTab.tsx`** — Logo source/profile slots, logo transform/reactivity/glow/shadow/backdrop, track title/time layout, typography, colors, filters, backdrop, and profile slots now render through canonical `@/ui`. Existing logo upload, profile load/save, audio channel routing, track info preview, and all store setters/ranges are preserved.
- [x] **Advanced S6C: `ModernEditorTab.tsx` + `ModernLyricsTab.tsx` + `ModernExportTab.tsx`** — Editor settings now render through canonical `@/ui` cards, buttons, switches, sliders, and compact option groups. Lyrics and Export are connected through modern shell adapters that preserve their lazy loading and avoid touching Lyrixa parsing, lyric timeline editing, file pickers, project export, or video export logic.
- [x] **Phase 6: global layout consistency** — Compact density is now tightened at the shared primitive layer (`Toolbar`, `Button`, `IconButton`, `Tabs`, `SidebarNav`, `OptionCardGrid`, `Slider`, `SectionCard`) and the modern content scroll body uses tighter global card padding. Modern shell chrome now routes its sheen/overlay/thumb colors through `UI_COLORS`; remaining direct color constants are content-specific preview palettes/timeline clip colors, not shared chrome.

### Reactivity calibration (S8)

- [x] **`CalibrationTab.tsx`** (lives under Advanced → Calibración in both legacy and modern shells) — single place to tune reactivity across six groups: **Logo / BG Zoom / BG Opacity+Blur / Glitch+RGB / Global audio / Partículas**. 38 parameters total. Each slider has a per-parameter editable min/max/step popover; overrides are sparse (only non-default entries persist).
- [x] **`EnvelopeWaveformPreview`** — live canvas under Logo and BG Zoom sections that shows the raw audio signal and the envelope applied with current sliders. Two modes via SegmentedControl: **Real** (reads active channel from `useAudioContext` every frame) and **Sintético** (generates a 120 BPM kick pulse so the envelope shape is visible in silence). Helpful for visual feedback while calibrating.
- [x] **Suggested calibration preset** — diagnosis-driven recalibration for the "slow + jittery" baseline (logo sensitivity 3.8 → 2.4, attack 0.95 → 0.7, release 0.05 → 0.12, peakWindow 1.9 → 1.2, etc.) exposed as the `Aplicar calibración sugerida` button. `Restaurar defaults originales` reverts to the values shipped in `DEFAULT_STATE`.
- [x] **Saved calibration slots** (`calibrationProfileSlots`) — up to 10 named bundles using the existing `ProfileSlotsEditor`. Each slot snapshots the current parameter values; load applies them as a partial state patch.
- [x] **New slice `calibrationSlice.ts`** — setters for range overrides + slot CRUD + apply/reset helpers. Re-exported from `storeSlices.ts` and added to `useWallpaperStore`. Persist `v50 → v51` with `??` migration fallback (no destructive transform).
- [x] **Config single source of truth** — `src/features/calibration/calibrationConfig.ts` declares parameter list (key / label / group / defaultRange), `SUGGESTED_CALIBRATION_VALUES`, and the slot/override types. Adding a new calibration knob = one entry in this file (the tab + slice consume it generically).

### Theme isolation (S7)

- [x] **Branch-isolated resolver** in `editorTheme.ts`:
    - `buildManualVars` — manual palette only
    - `buildPaletteVars(themePalette)` — theme only
    - `buildPaletteVars(backgroundPalette)` — image with image
    - `buildPaletteVars(NEUTRAL_NO_INPUT_PALETTE)` — **NEW** image source with no image (was silently falling back to theme)
- [x] **Universal Rainbow boost** — was gated by `source !== 'manual'`, now applies for all sources when `editorTheme === 'rainbow'`.
- [x] **`--editor-bg` ≠ `--editor-tag-bg`** — now distinct tiers so cards layer visually.
- [x] **Defence-in-depth** — `getScopedEditorThemeColorVars` spreads `DEFAULT_EDITOR_COLOR_VARS` first then branch result.
- [x] **`resolveUIColor`** exported as canonical alias.
- [x] **`--lwag-accent` CSS var alias** of `--editor-accent-color` (both in defaults and runtime setter).

---

## Pending

### Tab content migration (the big remaining block)

Every tab below currently uses the legacy component tree wrapped in `ModernTabFrame`. To match the design fidelity of `ModernSceneTab`, each needs a `tabs/modern/Modern{X}Tab.tsx` that:

1. Consumes the same store hooks (no behavior change).
2. Uses `@/ui` primitives exclusively (`SectionCard`, `Select`, `Slider`, `ToggleSwitch`, `SegmentedControl`, `Button`, `IconButton`, `FloatingPanel`, `CollapsibleSection`).
3. Replaces ad-hoc layouts with the design's `Card → Section header → Presets/slots → Core controls → Advanced disclosure` anatomy from `HANDOFF.md` §5.

| Slice   | Tab                                    | Source reference                                                                                        | Notes                                                                                                                                                                                                                                                                                              |
| ------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S1B** | **Spectrum inner controls**            | `panels.jsx` `SpectrumTab` + `tabs/spectrum/*`                                                          | Top-level `ModernSpectrumTab` is landed and inner card chrome has moved to `SectionCard`. Remaining work: tune the Style/Look/Color anatomy and replace the last legacy leaf wrappers where useful (`ColorInput`, local labels) without changing spectrum behavior.                                |
| **S2B** | **Looks inner polish** (filters)       | `tabs/FiltersTab.tsx` + `tabs/modern/ModernLooksTab.tsx`                                                | Top-level modern tab is landed. Remaining work: tune look-card previews, reduce duplicated saved-slot title chrome, and migrate any last label-only wrappers if needed.                                                                                                                            |
| **S3B** | **Layers inner BG polish**             | `tabs/BgTab.tsx` + `tabs/bg/*`                                                                          | Completed. BG top-level chrome, active wallpaper controls, pool, slideshow controls, global background, fit-mode helper, audio-channel helper, and audio-reactive background controls use canonical `@/ui` where safe. `BgPreciseSliderControl` remains as the dedicated high-precision BG slider. |
| **S4**  | **Motion**                             | `tabs/modern/ModernMotionTab.tsx`                                                                       | Completed. Motion profiles, particles, and rain now use canonical `@/ui` cards, buttons, switches, sliders, color fields, and collapsible sections while preserving the existing particles/rain state and reset behavior.                                                                          |
| **S5**  | **Audio**                              | `tabs/modern/ModernAudioTab.tsx`                                                                        | Completed. Playlist, virtual folder import, file transport, capture, mix/crossfade, media session, and FFT/routing controls now render through canonical `@/ui`; audio engine/context behavior remains unchanged.                                                                                  |
| **S6A** | **Advanced: Diagnostics + Perf**       | `tabs/modern/ModernDiagnosticsTab.tsx`, `tabs/modern/ModernPerfTab.tsx`                                 | Completed. Diagnostics and performance controls now use canonical `@/ui`; telemetry, snapshot RAF, fullscreen/mini-player, performance-safe mode, reset, and localStorage clear behavior remain unchanged.                                                                                         |
| **S6B** | **Advanced: Logo + Track Info**        | `tabs/modern/ModernLogoTab.tsx`, `tabs/modern/ModernTrackTitleTab.tsx`                                  | Completed. Logo and Track Info now use canonical `@/ui`; upload/profile slots/color-source routing/positioning/audio-reactive settings remain unchanged.                                                                                                                                           |
| **S6C** | **Advanced: Lyrics + Editor + Export** | `tabs/modern/ModernEditorTab.tsx`, `tabs/modern/ModernLyricsTab.tsx`, `tabs/modern/ModernExportTab.tsx` | Completed as a safe UI slice. Editor is fully modernized. Lyrics and Export use modern shell adapters around the existing lazy tabs so import/export and timeline behavior remain untouched. Full leaf-control migration for Lyrics/Export can be a later polish pass after stability checks.      |

### Phase 5 — Simple vs Advanced (make it real)

- [x] **Baseline behavior**: Simple mode keeps the reduced top-level tab set, hides Advanced/Motion entry points, and Spectrum now surfaces only enable/color, randomize, and macro controls. Advanced keeps saved slots, detailed geometry/color/surface controls, clone controls, and recovery/reset.
- [x] **Decide via the `useIsSimple` / `useIsAdvanced` hooks** already in `UIMode.tsx`. Applied to the migrated Spectrum slice without changing state or renderer behavior.
- [x] **Macro vs detail slider hierarchy**: `SliderControl` now accepts the canonical `variant` prop and Spectrum macro sliders use `macro` sizing in Simple mode while detail sliders remain compact in Advanced.
- [x] **Follow-up polish landed**: `ModernLogoTab` (`logoAudioSensitivity`, `logoMaxScale`) and `ModernLooksTab` (`filterOpacity`, `filterBrightness`, `filterContrast`, `filterSaturation`) now switch their primary sliders to `variant="macro"` in Simple mode and stay `compact` in Advanced, matching the Spectrum tab's macro/detail anatomy.

### Phase 6 — Layout consistency global

- [x] Audit padding/gap across every tab once they're migrated.
- [x] Verify all chrome reads from `UI_COLORS` / `--editor-*` vars. Remaining direct color constants are scoped to visual content previews/timeline clip palettes and should be handled later only if those systems become tokenized.

### Phase 7 — Cleanup legacy

- [x] **Default flipped to `modern`** in `DEFAULT_STATE.editorUiVariant`, then the flag was removed entirely (field + type `EditorUiVariant` + `setEditorUiVariant` setter + migration entry).
- [x] **Legacy `ControlPanel.tsx` deleted** and `ModernControlPanel.tsx` was renamed to `ControlPanel.tsx`. `EditorPage.tsx` now renders it directly with no conditional.
- [x] **`ModernTabFrame.tsx` deleted** (was orphaned by the slice-by-slice migration; zero remaining imports).
- [x] **History / Sparkles toggle buttons removed** from the header toolbar.
- [x] **Orphan primitives deleted from `src/components/controls/ui/`**: `Button.tsx`, `SectionLabel.tsx`, `TabPill.tsx`, `Toolbar.tsx` (each had 0 consumers).
- [x] **EditorOverlay tabs swapped to Modern equivalents** — `SceneTab`, `SpectrumTab`, `FiltersTab → ModernLooksTab`, `MotionTab`, `LogoTab`, `TrackTitleTab`, `LyricsTab`, `AudioTab`, `EditorTab`, `DiagnosticsTab`, `ExportTab`, `PerfTab` all point at `tabs/modern/Modern*Tab.tsx` now. The full-screen workspace renders the same Modern tabs the main panel does.
- [x] **12 legacy tabs deleted** — `SceneTab`, `SpectrumTab`, `FiltersTab`, `MotionTab`, `AudioTab`, `LogoTab`, `TrackTitleTab`, `EditorTab`, `DiagnosticsTab`, `PerfTab`, `ParticlesTab`, `RainTab`. `controlTabsLazy.tsx` now exports only the bridge tabs still consumed by Modern adapters.
- [x] **`BgTab` absorbed** into `tabs/modern/ModernBackgroundPanel.tsx` (consumed directly by `ModernLayersTab` and `EditorOverlay`). Legacy `BgTab.tsx` and its `chrome` prop deleted. `controlTabsLazy.tsx` no longer exports it.
- [x] **`LayersTab` + `OverlaysTab` modernized** — EditorOverlay now lazy-loads `tabs/modern/layers/ModernLayerStackPanel` and `tabs/modern/layers/ModernOverlaysPanel` directly. Both legacy files deleted. `controlTabsLazy.tsx` no longer exports them.
- [x] **`LyricsTab` + `ExportTab` migrated** to `tabs/modern/LyricsTabBody.tsx` and `tabs/modern/ExportTabBody.tsx`. `modernChrome` prop and legacy chrome conditionals stripped; Modern adapters now import bodies directly. `controlTabsLazy.tsx` no longer exports them.
- [x] **`DiagnosticsAudioPreviews` moved** from `tabs/` to `tabs/modern/`. `tabs/` root now contains only `CalibrationTab.tsx`.
- [x] **7 primitive bridges deleted** from `src/components/controls/ui/`: `ThemedSelect`, `ColorInput`, `EnumButtons`, `FieldLabel`, `SectionDivider`, `IconButton`, `ProfileSlotsEditor`, plus the now-orphaned `ResetButton`. Each was a thin re-export or unused; consumers now import from `@/ui` directly.
- [x] **`controlTabsLazy.tsx` reduced to `CalibrationTab` + `ControlTabSuspense`** — the legacy lazy-tab registry is effectively retired.
- [ ] **6 remaining components in `controls/ui/`** are real components (not bridges): `AdaptiveColorInput`, `AudioChannelSelector`, `CollapsibleSection`, `ColorSourceShortcuts`, `DialogProvider`, `TabSection` — each provides logic beyond a simple re-export (gap-wrapped children, color routing, dialog runtime, etc.). Further consolidation requires moving their behavior into `@/ui` proper.
- [ ] **Sidebar `lwag-sidebar-collapsed` localStorage** — still in the new `ControlPanel.tsx`. Optional cleanup: move to the store for cross-session per-anchor persistence.

### Phase 8 — Performance

- [x] **`useShallow` audit** — every Modern tab that pulls more than one store field already wraps its selector in `useShallow`. No regressions found across `ModernSceneTab`, `ModernSpectrumTab`, `ModernLooksTab`, `ModernLayersTab`, `ModernMotionTab`, `ModernAudioTab`, `ModernLogoTab`, `ModernTrackTitleTab`, `ModernLyricsTab`, `ModernDiagnosticsTab`, `ModernEditorTab`, `ModernPerfTab`, `ModernBackgroundPanel`, `LyricsTabBody`, `ExportTabBody`.
- [x] **`React.memo` heavy children**: `AudioTrackRow` (rendered per track in the playlist), `ModernGlobalBackgroundCard` + `ModernLayerCard` (rendered per layer in the stack), and `CalibrationSliderRow` (rendered per parameter — 38 instances). These cover the hottest map-rendered lists.
- [ ] **Virtualization** — intentionally deferred. Current typical list sizes (3–15 scene slots, 10–50 background images, 5–50 audio tracks) stay within memo+useShallow's comfort zone. Add `react-virtuoso` only after a production profile shows actual jank (likely when playlists pass 100+ tracks). Document trigger: ≥100 items in any single `.map()` rendering custom components.
- [ ] **Slider drag profiler check** — manual task: run React DevTools profiler while dragging a slider in each tab to confirm no upstream re-renders. Defer until next dev session.

### Extras

- [x] **`MediaDock` modern** — already aligned with `.design-ref/panels.jsx` MediaDock: glass shell (gradient + border + shadow), three-section layout (image strip / transport / seek bar), sub-components use canonical `@/ui` IconButton. Wrapped in `React.memo` so the QuickActionsPanel re-renders don't ripple in. Minor visual deltas with the design ref (no shuffle, no FFT badge) are non-blocking.
- [x] **`EditorOverlay` (workspace maximizado) modern** — added a two-column layout (`xl:grid-cols-[minmax(0,1fr)_360px]`). The right pane (`tabs/modern/editor/EditorOverlayInsightsPane.tsx`) shows the active scene + live performance grid (FPS, perf mode, particles, drops, images, tracks) + layer-on/off badges. Single-column below xl. Live wallpaper preview deferred (would need a second canvas mount).
- [x] **Sidebar auto-collapse on narrow viewports** — added `useMediaQuery` hook (`@/hooks/useMediaQuery`). `ControlPanel` now forces `sidebarCollapsed` true when `(max-width: 480px)` matches; the user's localStorage toggle still applies once the viewport widens.
- [x] **`⌘K` command palette** — `CommandPalette.tsx` modal mounted at the `ControlPanel` root. Listens to global `Cmd/Ctrl+K`, filters main tabs + advanced sub-tabs by name with token search, navigates with `↑↓/Enter`, closes on `Esc` or outside click. Selecting an action jumps to the tab (sets `tab` or `tab='advanced' + advancedSub`).
- [x] **Mobile pass**: `IconButton` already enforces 32×32px min hit area on coarse pointers (`min-h-[32px] min-w-[32px] sm:min-h-0`). `Slider` now reads `--slider-min-hit-height` which the global stylesheet sets to `32px` under `@media (pointer: coarse)`. Sidebar auto-collapses on `(max-width: 480px)` via `useMediaQuery`.
- [x] **Sidebar collapsed state moved from `localStorage` hack to Zustand store** — new `editorSidebarCollapsed` field in `layoutSlice`, persisted with the rest of the editor state (persist v52). `ControlPanel` reads/writes through the store; the auto-collapse on narrow viewports keeps using `useMediaQuery` and is layered on top of the persisted toggle.
- [x] **EditorOverlay vertical density fix** — `expandedEditorVars` now sets `--profile-slot-row-padding: 0.625rem 0.75rem`, `--profile-slot-row-min-h: 2.5rem`, `--editor-slot-gap: 0.5rem`, and bumps `--section-card-compact-body-padding` to `18px`. Both `ProfileSlotsEditor` and `MotionSharedControls.ProfileSlotsGrid` consume these vars, so slot rows breathe vertically when the workspace is maximized while staying compact inside the regular panel.

---

## Files inventory

### Created in `src/ui/`

```
src/ui/
├── lib/cn.ts
├── tokens/
│   ├── spacing.ts · radius.ts · colors.ts · glow.ts
│   ├── blur.ts · motion.ts · zIndex.ts
│   └── index.ts                 (ICON_SIZE + barrel)
├── Button.tsx · IconButton.tsx · ToggleSwitch.tsx
├── SegmentedControl.tsx · Slider.tsx · Select.tsx
├── SectionCard.tsx · CollapsibleSection.tsx
├── FloatingPanel.tsx · Tabs.tsx · SidebarNav.tsx
└── index.ts                     (barrel)
```

### Created in `src/components/controls/`

```
ModernControlPanel.tsx           (modern shell with sidebar nav)
ModernTabFrame.tsx               (bridge wrapper while tabs migrate)
tabs/modern/ModernSceneTab.tsx   (only fully-migrated tab)
tabs/CalibrationTab.tsx          (reactivity calibration — Advanced sub-tab, shared legacy/modern)
```

### Created in `src/features/calibration/`

```
calibrationConfig.ts             (param registry, suggested preset, slot/override types)
EnvelopeWaveformPreview.tsx      (live/synthetic envelope visualization)
```

### Created in `src/store/slices/`

```
calibrationSlice.ts              (range overrides + profile slots + apply/reset setters)
```

### Modified

- `src/components/controls/ControlPanel.tsx` — added `History`/`Sparkles` toggle to switch variant
- `src/components/controls/editorTheme.ts` — branch-isolated resolver + `--lwag-accent` alias + `resolveUIColor`
- `src/pages/EditorPage.tsx` — conditional shell render
- `src/store/slices/systemSlice.ts` — `setEditorUiVariant`
- `src/store/wallpaperStoreTypes.ts` · `src/store/wallpaperStore.ts` (v49) · `src/store/wallpaperStoreMigrations.ts` · `src/lib/constants.ts` · `src/types/wallpaper.ts`

### Reference (not used at runtime)

- `.design-ref/` — extracted Claude Design ZIP. Source of truth for visual fidelity:
    - `tokens.jsx` — primitives that became `src/ui/`
    - `panels.jsx` — Scene/Spectrum/Looks/Layers reference layouts (drive S1–S3 fidelity)
    - `editor.jsx` — `CompactEditor` / `ExpandedEditor` (drive future `EditorOverlay` rewrite + MediaDock layout)

---

## Conventions (for future slices)

- **Imports**: in any new file, import from `@/ui` only. Never from `src/components/controls/ui/*`.
- **Colors**: use `UI_COLORS.*` or `var(--editor-*)` / `var(--lwag-accent)`. Zero hex hardcodes in components.
- **Spacing/radius**: use `SPACING` / `RADIUS` tokens or `var(--editor-radius-*)`. No magic px numbers in JSX.
- **Theme reactivity**: components must read from CSS vars (not from JS-resolved theme objects) so source switches propagate without re-render.
- **One tab = one file**: `tabs/modern/Modern{X}Tab.tsx`. Same prop signature as the legacy tab so it can be slotted into `ModernControlPanel` without other edits.
- **Behavior preservation**: never change store calls, hook usage, or rendering logic during a UI migration. Only swap presentation.

---

## Recommended next slice

**All planned phases + Extras landed.** Build is clean (`tsc -b && vite build` in ~2s). Persist bumped to v52. Tracker is in the green.

Open follow-ups (intentionally deferred, none are bugs):

1. **EditorOverlay vertical breathing room (user reported)** — initial fix landed (slot rows, section padding, slot gaps). Likely still needs another pass on `Slider` (the compact variant is the natural lower-bound here) and on the per-tab content scaffolding. Worth a screenshot pass once the user uses the maximized editor at typical desktop sizes (1440×900 / 1920×1080) to identify which specific tabs still look pinched.
2. **EditorOverlay live preview** — current `EditorOverlayInsightsPane` shows scene info + perf metrics. Adding an actual live thumbnail of the wallpaper requires a shared scaled canvas mount; out of scope for this slice.
3. **Consolidate the 6 real components in `controls/ui/`** (`AdaptiveColorInput`, `AudioChannelSelector`, `CollapsibleSection`, `ColorSourceShortcuts`, `DialogProvider`, `TabSection`) into the canonical `@/ui` system. Each adds behavior on top of `@/ui` (gap-wrapped children, color routing, dialog runtime), so this is a real migration, not a delete.
4. **Command palette polish**: surface slider-level actions (e.g. "Open Calibración / Logo Attack"), persist recent commands, expose `?` shortcut chart.
5. **MediaDock polish**: ship the shuffle button + FFT/sample-rate badge from the design ref (need new audio context surfaces).

Reference: existing advanced tab files as behavior source, plus `.design-ref/panels.jsx` / `editor.jsx` for visual anatomy.
