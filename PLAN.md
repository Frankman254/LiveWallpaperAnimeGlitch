# UI Refactor Plan — Claude Design integration

Working doc for the editor UI migration. Track what's done, what's pending, and where each piece lives. Update as slices land.

---

## Current architecture (two parallel UI layers)

| Layer | Path | Status | Used by |
|---|---|---|---|
| **Canonical** (Claude Design) | `src/ui/` | Active, growing | `ModernControlPanel`, `ModernSceneTab` |
| **Legacy** | `src/components/controls/ui/` | Frozen, back-compat | `ControlPanel.tsx` (legacy) + every non-migrated tab |

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

| Slice | Tab | Source reference | Notes |
|---|---|---|---|
| **S1B** | **Spectrum inner controls** | `panels.jsx` `SpectrumTab` + `tabs/spectrum/*` | Top-level `ModernSpectrumTab` is landed and inner card chrome has moved to `SectionCard`. Remaining work: tune the Style/Look/Color anatomy and replace the last legacy leaf wrappers where useful (`ColorInput`, local labels) without changing spectrum behavior. |
| **S2B** | **Looks inner polish** (filters) | `tabs/FiltersTab.tsx` + `tabs/modern/ModernLooksTab.tsx` | Top-level modern tab is landed. Remaining work: tune look-card previews, reduce duplicated saved-slot title chrome, and migrate any last label-only wrappers if needed. |
| **S3** | **Layers** | `tabs/BgTab.tsx` + `tabs/LayersTab.tsx` + `tabs/OverlaysTab.tsx` | Three sub-sections in their own `SectionCard`s. Layer rows with Eye toggle + macro opacity sliders + Lock indicator (mirrors `panels.jsx` Slots pattern). |
| **S4** | **Motion** | `tabs/MotionTab.tsx` | Particles + Rain as separate Cards. Macro sliders for high-impact params (density, speed). Advanced disclosure for fine tuning. |
| **S5** | **Audio** | `tabs/AudioTab.tsx` | Source `SegmentedControl` (file/desktop/mic) · transport · level meters · playlist list. |
| **S6** | **Advanced sub-tabs** | `tabs/TrackTitleTab.tsx`, `LyricsTab.tsx`, `LogoTab.tsx`, `DiagnosticsTab.tsx`, `EditorTab.tsx`, `ExportTab.tsx`, `PerfTab.tsx` | Each gets its own modern variant. Diagnostics and Perf likely just need typography polish. |

### Phase 5 — Simple vs Advanced (make it real)
- [ ] **Density variants**: Simple mode = larger padding, hide all `CollapsibleSection` blocks, hide micro-sliders, surface only macro-sliders. Advanced = current behavior.
- [ ] **Decide via the `useIsSimple` / `useIsAdvanced` hooks** already in `UIMode.tsx`. Apply consistently inside each migrated tab.
- [ ] **Macro vs detail slider hierarchy**: convert high-impact params (Spectrum intensity, Bass weight, Logo size) to `<Slider variant="macro" />`, fine tuning to `compact`.

### Phase 6 — Layout consistency global
- [ ] Audit padding/gap across every tab once they're migrated.
- [ ] Verify all chrome reads from `UI_COLORS` / `--editor-*` vars (no hex hardcodes).

### Phase 7 — Cleanup legacy
Only safe once `editorUiVariant: 'modern'` is the default and the legacy panel is removed:
- [ ] Delete `src/components/controls/ControlPanel.tsx` (legacy) and rename `ModernControlPanel.tsx` → `ControlPanel.tsx`.
- [ ] Delete `src/components/controls/ModernTabFrame.tsx` (was the bridge while non-modern tabs existed).
- [ ] Delete legacy primitives in `src/components/controls/ui/` after every consumer migrates to `@/ui`. Order: leaf consumers first (`tabs/*`), then chrome.
- [ ] Drop the `editorUiVariant` flag and the History/Sparkles toggle buttons from both headers.
- [ ] Remove the `localStorage` `lwag-sidebar-collapsed` hack and move sidebar collapse to the store if you want it cross-session per-anchor.

### Phase 8 — Performance
- [ ] `React.memo` heavy children (`ModernSceneTab` already does its own `useShallow`; verify others).
- [ ] Virtualize lists that grow unbounded — `sceneSlots`, `backgroundImages` (likely fine until ~100 items), `audioPlaylistTracks`.
- [ ] Check re-renders on slider drag with React DevTools profiler.

### Extras
- [ ] **`MediaDock` modern** — see `panels.jsx` `MediaDock` (lines 204–286). Glass shell + image strip + transport + timeline. Drop-in.
- [ ] **`EditorOverlay` (workspace maximizado) modern** — currently legacy look even in modern mode. Two-column layout with preview pane (right) per `editor.jsx` `ExpandedEditor`.
- [ ] **Sidebar auto-collapse on narrow viewports** — wire `compact={sidebarCollapsed || windowWidth < 480}` via a `useMediaQuery` hook.
- [ ] **Search/⌘K** in `ExpandedEditor` per HANDOFF §6.
- [ ] **Mobile pass**: confirm 32px tap targets, sidebar collapse default-true below 480px.

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

**S3 — Layers modern**. Scene, Spectrum, and Looks now have modern top-level tabs. Next broad editor slice is Layers: split BG / Layers / Overlays into modern cards while preserving existing tab logic.

Reference: `.design-ref/panels.jsx` lines 92–201.
