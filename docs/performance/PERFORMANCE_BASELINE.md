# Performance Baseline

**Purpose:** Repeatable methodology for measuring frame time.  
**Rule:** Do not cite numbers here unless measured on your machine in a focused browser window.

## Environment template

Record for each run:

| Field              | Example                           |
| ------------------ | --------------------------------- |
| Date               |                                   |
| Machine / GPU      |                                   |
| Browser            | Chrome / Brave / Safari + version |
| Viewport           | 1920×1080, 2560×1440, 3440×1440   |
| `devicePixelRatio` | 1, 2, …                           |
| Scene              | Demo / named project              |
| `performanceMode`  | low / medium / high               |
| Output mode        | edit / presentation / recording   |

## Modes to compare

1. **Edit** (`#/edit`) — panel closed, HUD visible optional
2. **Presentation** (`#/present`)
3. **Recording** scale 1.0 / 0.75 / 0.5 (`#/record`)

## Spectrum pixel scenarios

| Scenario      | Settings                                      |
| ------------- | --------------------------------------------- |
| Baseline      | Classic bars, no pixelate                     |
| Pixel shape   | Classic linear, `spectrumShape: pixel`        |
| Pixelate only | Any family, `spectrumPixelate: true`, scale 4 |
| Both          | Pixel shape + pixelate                        |
| Heavy         | Above + manual glow + visual accents          |

Also test **two spectrum instances** enabled.

## Measurement sources

1. **DEV overlay** — `OutputModeDevDiagnostics` (bottom-left, ~1s FPS estimate)
2. **Editor** — `CanvasFpsOverlay` when diagnostics enabled
3. **Chrome Performance** — record 10s, report average frame time
4. **Optional** — log `performance.now()` delta in DEV only (not shipped)

## Allocation checks (pixelate)

In Chrome Performance → Memory:

- `pixelateSceneCanvas` / `pixelateSmallCanvas` should resize only on dimension or scale change
- No per-frame canvas `new` in hot path (verified by code review; re-verify after changes)

## Recording + pixel grid

When `recordingRenderScale < 1`:

- Inspect whether pixel blocks stay **crisp** or **soft**
- Document if double resampling (pixelate down/up + recording backing scale) is acceptable

## Results log

| Date | Mode | Resolution | DPR | Scene | Avg FPS | Avg ms | Notes |
| ---- | ---- | ---------- | --- | ----- | ------- | ------ | ----- |
|      |      |            |     |       |         |        |       |

_Leave empty until measured._

## Automation limitation

Headless / background tabs throttle `requestAnimationFrame` (~2 FPS). **Always measure in a focused window.**
