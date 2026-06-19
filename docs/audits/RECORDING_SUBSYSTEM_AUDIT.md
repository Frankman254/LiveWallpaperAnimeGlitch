# Recording Subsystem Audit

**Date:** 2026-06-19  
**Scope:** In-browser recording/export capture paths — no implementation changes in this sprint.

## Executive summary

The current “recording” feature is a **legacy screen-capture wrapper** around `getDisplayMedia` + `MediaRecorder`. It does **not** capture an internal master compositor canvas. There is **no** `canvas.captureStream()` usage in the codebase.

**Recommendation:** **C — Keep OBS + Presentation Mode as supported V1 path; defer internal recording** until a master output compositor exists (see Phase 9 decision below).

---

## File inventory

| File                                                            | Role                                     | Classification          |
| --------------------------------------------------------------- | ---------------------------------------- | ----------------------- |
| `src/components/controls/tabs/export/useRecordingExport.ts`     | MediaRecorder + getDisplayMedia hook     | Partially working       |
| `src/components/controls/tabs/export/RecordingToolsSection.tsx` | Export tab UI                            | Working (UI only)       |
| `src/components/controls/tabs/modern/ExportTabBody.tsx`         | Wires recording + new output mode launch | Working                 |
| `src/features/recording/recordingMimeSupport.ts`                | MIME fallback helper (extracted)         | Working                 |
| `src/features/export/offlineExportPlanner.ts`                   | Documents recorder as fallback           | Working (planner)       |
| `src/features/export/renderFrame.ts`                            | Offline deterministic frame export       | Separate path           |
| `src/dev/recordingSmokeHarness/*`                               | DEV 5s smoke harness                     | Untested in CI (manual) |

## State model

- Recording status lives in **React hook-local state** (`idle | recording | saved | error`).
- **Not** persisted in Zustand or projects.
- No global recording state machine; no pause/resume in current hook.

## Capture pipeline (current)

```
User clicks Start Recording
  → navigator.mediaDevices.getDisplayMedia({ video: { frameRate }, audio? })
  → new MediaRecorder(stream, { mimeType?, videoBitsPerSecond })
  → recorder.start(250) — 250ms timeslice chunks
  → onstop → Blob(chunks) → save/download
```

### What is captured

- Whatever the user selects in the **browser screen/window picker** — typically the whole tab or window.
- **Not** guaranteed to match in-app layer compositing if DOM layout differs from expectation.
- Multiple canvases (background, particles, spectrum, stage FX) are composited by the **browser**, not by app code.

### What is NOT captured reliably

- A deterministic “project output” independent of browser chrome.
- Individual layer isolation.
- Offline-export-quality timing (recording is real-time only).

## Critical architectural question

> Is there one master/composited canvas containing every visual layer?

**No.** The render pipeline uses:

- DOM layers (`BackgroundImageLayerView`, overlays)
- Multiple `<canvas>` elements (`SceneLayerCanvas`, `AudioLayerCanvas`, `StageLightsCanvas`, etc.)
- WebGL/Three.js stages inside family-specific canvases

Browser window capture sees the final pixels, but **internal recording cannot use a single `captureStream()`** without a future master output compositor.

## Component classification

| Area                              | Status                | Notes                                                       |
| --------------------------------- | --------------------- | ----------------------------------------------------------- |
| MIME selection / fallback         | Working               | `MediaRecorder.isTypeSupported` filter                      |
| getDisplayMedia                   | Working               | Requires HTTPS; user picker required                        |
| MediaRecorder start/stop          | Working               | No pause/resume                                             |
| Chunk collection                  | Working               | 250ms timeslices; unbounded array growth on long recordings |
| Audio wiring                      | Partial               | Optional `audio: true` on display media — browser-dependent |
| Long recording memory             | Risk                  | All chunks kept in memory until stop                        |
| Multi-layer fidelity              | Architectural blocker | No master canvas                                            |
| Pause/resume                      | Dead                  | Not implemented                                             |
| Scene change during record        | Untested              | Should work visually if tab captured                        |
| Export tab settings (bitrate/fps) | Partial               | FPS hint only; browser may ignore                           |

## DEV smoke harness

Route: **`#/dev/recording-smoke`** (development only)

Tests:

- 5-second capture
- video-only / video+audio
- 30 / 60 FPS selection (browser may clamp)
- MIME fallback via shared helper
- Plays back blob locally

**Browser compatibility must be validated manually** — results vary by OS/browser/GPU.

## Phase 9 decision

**Chosen: C — Keep OBS as supported V1 path; defer internal recording.**

### Rationale

1. Presentation Mode (`#/present`) now provides clean output for OBS window capture.
2. Existing recorder is screen-picker based — poor UX for live shows and duplicates OBS.
3. No master canvas — option B requires substantial render architecture work.
4. Electron/FFmpeg (option D) explicitly out of scope.

### Prerequisites before revisiting internal recording

1. **Master output compositor** — single canvas or WebGL FBO with full scene graph.
2. **Stable output resolution / DPR policy** wired to compositor.
3. **Audio tap** from existing Web Audio graph (not display media).
4. **Memory-bounded chunk strategy** for long recordings.
5. **Pause/resume state machine** with explicit UX.

## Stale / dead settings

- Export tab implies deterministic offline export is the target path; screen recording labeled legacy in planner notes.
- MP4 availability is browser-dependent; UI correctly gates on `isTypeSupported`.

## Recommended next recording sprint (when approved)

1. Design master compositor API (read-only audit → implementation).
2. Prototype `compositorCanvas.captureStream(fps)` + MediaRecorder with app audio destination.
3. Keep OBS path documented as production fallback.
