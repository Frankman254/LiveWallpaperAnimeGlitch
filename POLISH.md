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

## Remaining premium polish debt

Intentionally deferred (none of these are bugs — they're "nice to have"):

1. **CollapsibleSection entrance animation** — currently snaps open/closed. Smooth height transitions in React require measuring children or using a library; the snap is acceptable for now but a `max-height` + `overflow: hidden` interpolation would feel nicer.
2. **Tab content cross-fade** — switching between modern tabs is instant. A 100–160ms cross-fade would feel more premium. Trade-off: requires keeping the outgoing tab mounted briefly.
3. **`ModernEditorTab` (865 lines) sub-component extraction** — the editor settings tab is the largest remaining file. Splitting it into per-section panels would help maintainability + open the door for individual `memo` boundaries.
4. **Live preview in `EditorOverlayInsightsPane`** — current pane shows perf metrics + scene info. A real wallpaper thumbnail would require mounting a shared scaled canvas. Out of scope for polish.
5. **Slider drag haptic** — on supported devices, `navigator.vibrate(5)` on the thumb pickup would add tactile feedback. Optional.
6. **`controls/ui/` final consolidation** — 6 real components (AdaptiveColorInput, AudioChannelSelector, CollapsibleSection, ColorSourceShortcuts, DialogProvider, TabSection) still live in the legacy folder. They're real components (not bridges), and migrating them into `@/ui` is a sweep of its own.
7. **Tracking widest class lint** — `tracking-[0.1em]` could be `tracking-widest` (Tailwind canonical). One occurrence in `ControlPanel.tsx` reported by the linter; left as-is because the current value matches the design intent precisely.

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
