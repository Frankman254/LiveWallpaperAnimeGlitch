# Stage FX Performance Audit — TODO

> **Status:** Planning only. Do not optimize until after particles stabilization is merged.

---

## Components to audit

| File | Renderer | Priority |
|---|---|---|
| `src/features/stageFx/StageLightsCanvas.tsx` | Canvas 2D | HIGH |
| `src/features/stageFx/FlashLightCanvas.tsx` | Canvas 2D (offscreen cache) | MEDIUM |
| `src/features/stageFx/CameraFxStage.tsx` | CSS transforms on DOM | LOW |
| `src/features/edgeGlow/edgeGlowRenderer.ts` | Canvas 2D (called from render pipeline) | MEDIUM |
| `src/features/edgeGlow/flashEdgeRenderer.ts` | Canvas 2D (called from render pipeline) | MEDIUM |
| Screen shake (inside `CameraFxStage`) | CSS transforms | LOW |

---

## StageLightsCanvas — suspected hotspots

### Critical
- **4× shadowBlur per beam × up to 16 beams = 64 blur passes/frame** at high settings.  
  Each beam draws: main gradient, haze layer, core stroke, flare — all with `shadowBlur`.  
  *Audit question:* Can haze and flare passes share a single blur pass via offscreen compositing?

- **3 gradients created per beam per frame** (`createLinearGradient` / `createRadialGradient`).  
  48 gradient allocations/frame at max beam count.  
  *Audit question:* Can beam gradients be cached to offscreen canvases keyed on angle + color, and invalidated only on color/size change?

### Secondary
- `beamCount` budget: already capped at 5/10/16 per perf mode — verify the scaling is aggressive enough for low-end devices.
- Verify `stageLightsEnabled = false` returns before any canvas work (currently: yes, but confirm no leftover `clearRect` each frame when disabled).
- DPR: canvas is fullscreen at CSS pixels. Verify it does not multiply by `window.devicePixelRatio` on retina screens — that quadruples pixel fill.

---

## FlashLightCanvas — suspected hotspots

### Secondary (mostly fine)
- Shape caching is implemented and works on cache hit. **Audit the cache invalidation logic** — if color/softness animate (e.g., audio-driven color), cache thrashes on every frame. Confirm those params are stable during playback.
- `updateFlashEdgeDrive()` is called every frame even when `flashLightEnabled = false`. Negligible cost but worth confirming it's intentional (drives Flash Edge renderers independently).

---

## Flash Edge Renderer (`flashEdgeRenderer.ts`) — suspected hotspots

### High (logo path)
- **Image blur filter** (`ctx.filter = 'blur(Xpx)'`) applied before `ctx.drawImage()` — this forces a GPU rasterisation pass over the entire image.  
  *Audit question:* Is the blurred image result stable frame-to-frame when `flashDrive` is not at peak? If so, cache the blurred composite to an offscreen canvas and skip redraw when drive hasn't changed.

- Double-pass rendering (blurred + arc stroke) happens every frame even at low drive. Guard `blurPx > 0.5` exists but the arc stroke still runs.  
  *Audit question:* Can the arc stroke be skipped below a drive threshold (e.g. `< 0.01`)?

### Background path
- Two `shadowBlur` rect-stroke passes per frame. Verify blur values are capped and do not respond proportionally to audio amplitude in a way that defeats the cap.

---

## Edge Glow Renderer (`edgeGlowRenderer.ts`) — suspected hotspots

### Medium
- **FFT bin peak scan** inside envelope tick: linear scan over raw bins every frame.  
  *Audit question:* Is this scan bounded? High FFT sizes (2048+) could make the range non-trivial.
- **Double-pass arc stroke + shadowBlur** — similar to Flash Edge. Both passes render each frame.  
  *Audit question:* Skip both passes when envelope value is below `0.005`.
- Called from logo/background render pipelines — not a separate component. The call sites should gate on `edgeGlowEnabled` before calling the renderer (confirm no call-site leak).

---

## CameraFxStage / ScreenShake — low priority

- DOM transform string allocation per motion target per frame: acceptable (5–10 strings/frame).
- `Math.random()` jitter calls: fast, not a concern.
- MutationObserver for new motion targets: only fires on layout change, not per frame.
- **Audit question:** When both `cameraMotionEnabled` and `cameraShakeEnabled` are false, confirm the RAF loop is paused entirely, not just early-returning.

---

## Cross-cutting checks for all Stage FX

1. **Rendering while visually inactive** — each component should not touch the GPU/canvas at all when its feature is disabled. Current status:
   - StageLightsCanvas: ✓ early return
   - FlashLightCanvas: ✓ early return (but drive still updates)
   - EdgeGlow/FlashEdge: called from pipeline, fast-path inside — verify call sites are gated

2. **DPR scaling** — none of the Stage FX canvases currently scale by `devicePixelRatio`. Confirm this is intentional. On 2× retina, CSS-pixel canvases render at half resolution which may look soft for glows.

3. **`clearRect` cost** — full-canvas `clearRect` every frame is cheap but verify Stage Lights does not `clearRect` when disabled (wasted composite op).

4. **`globalCompositeOperation`** resets — verify `lighter` / `screen` blend modes are always reset to `source-over` after drawing to avoid bleed into unrelated layers.

5. **Performance-mode gating** — Stage Lights already has per-mode beam caps. Verify Flash Edge and Edge Glow respect `performanceMode` (currently they appear to use fixed blur caps regardless of mode).

---

## Suggested audit order

1. `StageLightsCanvas` — highest impact, biggest loop
2. `flashEdgeRenderer` (logo path) — image blur filter is expensive
3. `edgeGlowRenderer` — FFT scan + double pass
4. `FlashLightCanvas` — verify cache invalidation
5. `CameraFxStage` — low risk, last

---

## Out of scope for this audit

- Particle system (covered by particle performance sprint)
- Spectrum renderer (separate audit)
- Background image pipeline
