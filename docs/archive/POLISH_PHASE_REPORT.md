# Product Polish — Phase report

After the editor refactor closed, this phase focused on **feel, readability, sync, and premium quality**. No features, no architecture, no new tabs.

---

## Status

- [x] P1 — HUD progress bar sync
- [x] P2 — Editor Overlay readability
- [x] P3 — Micro UX polish
- [x] P4 — Control density audit
- [x] P5 — Visual consistency audit

---

## Deliverables

### 1. HUD sync — root cause + fix

**Root cause:** `HTMLMediaElement.currentTime` updates in 33–250ms bursts depending on the browser, but the MediaDock's RAF loop runs at ~16ms. Reading `currentTime` directly meant 2–15 consecutive frames painted the *same* time value, then jumped — visible stutter.

**Fix in `src/components/controls/MediaDock.tsx`:**

Added an interpolation layer between the audio's ground truth and the painted value:

- `lastFrameTimeRef`, `lastAudioTimeRef`, `displayTimeRef`, `effectivelyPausedRef`.
- `syncTransportSnapshot` now branches:
  - **Paused** → display tracks audio truth (no integration).
  - **Audio jumped** (>0.5s) → snap immediately (handles seeks, loops, track changes).
  - **Audio advanced** → accept new truth, but carry forward any drift up to 0.3s to avoid one-frame regressions.
  - **Audio quiet** (no change this frame, < 250ms since last update) → integrate `dt` forward. This is what makes the bar feel smooth at 60fps.
- Refs are re-seeded on mode switch (`isFileMode`), on optimistic seek commit, and on viewport changes — so the interpolator never starts from a stale baseline.

**Files changed:** `MediaDock.tsx`.

### 2. Overlay sizing strategy

Issue: in maximized mode the content column stretched to viewport width, making sliders and SectionCards look like debug panels.

**Strategy applied in `EditorOverlay.tsx`:**

- Content column wrapped in `max-w-[920px]` (default) / `2xl:max-w-[1080px]` (ultra-wide).
- Already constrained by the `xl:grid-cols-[minmax(0,1fr)_360px]` grid added earlier — the right aside (InsightsPane) keeps a fixed 360px, the main column now also clamps to a comfortable reading length.
- `mx-auto` keeps the column centered, giving symmetric breathing room on wide screens.

Reference: Figma / Ableton / Resolve, where the inspector column is intentionally narrower than the viewport.

### 3. Controls compacted

P4 audit found that the current layout already groups sliders correctly:

- `ModernTrackTitleTab` (26 sliders) wraps them in **16 grouping primitives** (`SectionCard`, `CollapsibleSection`, `AdvancedOnly`).
- `ModernLooksTab` keeps Cinematic FX (Vignette, Bloom, Luma, Lens, Heat) behind `AdvancedOnly` so Simple mode stays minimal.
- Cinematic / Glitch / Scanlines all live in their own SectionCards.

No structural changes needed — the existing density is already in the "high information, low chaos" target. Documented as audit-clean.

### 4. Interaction polish added

- **CommandPalette (`⌘K`)** — backdrop fades in (`opacity 0→1` over `fast`), modal slides + scales (`translateY(-8px) scale(0.98)` → final) with an `emphasized` cubic-bezier. Two-rAF defer ensures the initial paint has the "from" state so the CSS transition has something to interpolate.
- **FloatingPanel** (Select dropdown, anchor menus) — same `useState + rAF defer` pattern; pops in with `translateY(-4px) scale(0.97)` → final, `transform-origin: top center`. Closes return to null since the panel disappears.
- **Slider** — already had asymmetric transitions: `box-shadow + left` on `fast` standard, but transitions are **disabled while dragging** so the thumb tracks the cursor 1:1 with no perceived lag.
- **Mobile tap targets** — `Slider` reads `--slider-min-hit-height`, set to `32px` under `@media (pointer: coarse)` via `globals.css`. Desktop stays slim.

### 5. Visual consistency

P5 sweep results:

- **Icon sizes** — 68 uses of `ICON_SIZE.*` tokens vs 2 hardcoded `size={14}` in `ModernLyricsTab` and `ModernExportTab`. **Both fixed** → `ICON_SIZE.sm`.
- **Motion tokens** (`MOTION.duration`, `MOTION.easing`) — every component that animates already imports `transition()` from `@/ui/tokens/motion`. No string-literal `transition: 'all 200ms ease'` patches found in the modern tabs.
- **Spacing** — SectionCard padding flows through `--section-card-compact-*` CSS vars; the EditorOverlay overrides them in maximized mode. Consistent.
- **Typography** — section titles use the same uppercase / mono / `0.16em` tracking pattern across all Modern tabs (audited by grep on `tracking-[0.1em]` and `tracking-[0.16em]`; minor `0.1em` lint warnings remain but they're pre-existing).
- **Glow** — `GLOW.popover` for floating panels, `GLOW.ring` for slider thumb hover, `GLOW.*` for accent halos. No raw `box-shadow` strings introduced in this slice.

---

## Polish debt — closed

All 7 items closed in a follow-up pass.

1. **CollapsibleSection entrance animation** — `src/ui/CollapsibleSection.tsx` now renders children always, measures content height with `ResizeObserver`, and animates `max-height` + `opacity` with the canonical `transition('max-height, opacity', 'base')`. `aria-hidden` toggles for screen readers; `overflow: hidden` only during the transition so nested popovers / focus rings paint correctly once fully open. API unchanged — 5 consumers untouched.
2. **Tab content cross-fade** — new `src/ui/TabFade.tsx` primitive (~50 lines, exported from `@/ui`) wraps any keyed content and runs a 120ms opacity transition on `tabKey` change. Outgoing children stay mounted during the fade-out, then swap. Applied at the `ControlTabSuspense` boundary in both `ControlPanel` (using `activeScrollKey = tab/advanced:sub`) and `EditorOverlay` (using `effectiveActive`).
3. **`ModernEditorTab` sub-component extraction** — split 865 → **116 lines** orchestrator + 5 sub-section files + 1 helpers file under `tabs/modern/editor/`:
   - `EditorPanelSection.tsx` (144) — FPS, panel corner, corner radius sliders, UI scale presets
   - `ThemeSection.tsx` (107) — editor theme + manual color source + ManualColors (conditional)
   - `AppearanceSection.tsx` (97) — preview quality + backdrop / surface / item opacity / blur
   - `ResponsiveLayoutSection.tsx` (125) — viewport ref resolution + draft state self-contained
   - `QuickActionsSection.tsx` (260) — quick-actions HUD layout / style / colors (conditional)
   - `editorTabHelpers.tsx` (159) — shared `ColorField`, `ResolutionField`, `MetricTile`, constants, format helpers
   - Orchestrator keeps an inline `GlobalColorShortcutsSection` because it reconciles across many sibling color-source fields; extracting it would only duplicate the giant `useShallow` slice.
   - Each sub-section owns a focused `useShallow`, so changing one field no longer re-renders the others — meaningful perf win.
4. **Live preview in `EditorOverlayInsightsPane`** — added a `Preview` `SectionCard` at the top of the right pane with a 16:9 thumbnail of the active background image (via `resolveEditorImagePreviewUrl()`). Falls back to a "Sin fondo" placeholder when there's no active image. Static image — a real live canvas mount is still deferred because it'd need a shared scaled framebuffer.
5. **Slider drag haptic** — `src/ui/Slider.tsx` `onPointerDown` now calls `navigator.vibrate(5)` on coarse pointers (skipped when `e.pointerType === 'mouse'`). Silent no-op on unsupported browsers.
6. **`controls/ui/` final consolidation** — audit reaffirmed the 6 components are real (lógica única + multi-consumer). The `controls/ui/CollapsibleSection.tsx` "bridge" was about to be deleted but it has 1 active consumer (`LyricsTabBody`, 6 call sites) and provides genuine API sugar (`label` alias, `defaultOpen=true` default, gap wrapper). Decision reversed: **kept as a thin component**, documented here.
7. **Tracking widest lint** — replaced `tracking-[0.1em]` → `tracking-widest` in `Slider.tsx`, `ControlPanel.tsx`, `ModernSceneTab.tsx`, `ModernDiagnosticsTab.tsx`, `SpectrumStyleSelector.tsx`.

## Remaining (genuinely deferred)

- **EditorOverlayInsightsPane live canvas preview** — a real wallpaper thumbnail (not just the BG image) requires mounting a second scaled `<Canvas>` r3f or capturing the main GL context. Both have GL context / perf trade-offs that don't belong in a polish sprint.
- **`controls/ui/` 6 real components migration to `@/ui`** — `AdaptiveColorInput`, `AudioChannelSelector`, `ColorSourceShortcuts`, `DialogProvider`, `TabSection`, `CollapsibleSection` wrapper. Real components with multi-consumer usage; moving them is a path-only refactor with no behavior change. Low value, low urgency.

---

## Files changed (this phase)

```
src/components/controls/MediaDock.tsx              (HUD sync interpolation)
src/components/controls/EditorOverlay.tsx          (max-width readability)
src/components/controls/CommandPalette.tsx         (entrance animation)
src/components/controls/tabs/modern/ModernLyricsTab.tsx   (icon size token)
src/components/controls/tabs/modern/ModernExportTab.tsx   (icon size token)
src/ui/FloatingPanel.tsx                           (entrance animation)
POLISH.md                                          (this file)
```
