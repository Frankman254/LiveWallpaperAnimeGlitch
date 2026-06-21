# Offline Video Renderer — Design (NOT IMPLEMENTED)

> Status: **Design only.** Nothing in this document is built. It captures what a
> Blender-style, non-realtime exporter would require so we do not accidentally
> promise it from the current realtime recorder. Reviewed baseline: HEAD at the
> time of the media-key/output-sync sprint.

## Why the current recorder is not an offline renderer

The current internal recorder (`useRecordingExport` + `displayMediaCapture`)
uses `getDisplayMedia` + `MediaRecorder`. That pipeline is **realtime**:

- It captures whatever the screen/window actually paints, in wall-clock time.
- Output FPS is a _hint_ (`frameRate: { ideal, max }`), never a guarantee. If
  the machine drops to 40 FPS, the file is 40 FPS.
- The encoder runs live; quality is bounded by browser throttling, the chosen
  `videoBitsPerSecond`, and the capture surface resolution.
- Animation is driven by `requestAnimationFrame`, so the timeline is tied to
  real time and to the tab being focused/visible.

An offline renderer is the opposite: it evaluates the scene **at a fixed
timestamp T**, renders that frame at full quality however long it takes, then
advances T by `1 / fps`. Frame rate becomes an output property, not a runtime
constraint.

## Requirements for true offline rendering

1. **Deterministic timeline** — a project duration and a clock that can be set
   to an arbitrary T, independent of `requestAnimationFrame`.
2. **Frame-by-frame render** — render loop driven by a frame counter, not rAF.
3. **Fixed FPS + fixed resolution** — chosen up front, honored exactly.
4. **Audio decoding + analysis cache** — decode the track offline (e.g.
   `OfflineAudioContext`) and precompute the per-frame FFT/bands so the spectrum
   at time T is reproducible without playing audio in real time.
5. **Visual state evaluated at T** — every animated subsystem (spectrum,
   particles, background zoom, stage FX) must accept an explicit time/phase
   input instead of reading `performance.now()` internally.
6. **Master compositor canvas** — one canvas that composites every layer, so a
   single `getImageData`/`VideoFrame` per frame is the source of truth. Today
   layers render to separate canvases stacked by CSS.
7. **Encoder pipeline** — push each rendered frame into an encoder.

## Candidate browser technologies

| Tech                                        | Fit                  | Notes                                                                                    |
| ------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| `OffscreenCanvas`                           | Good                 | Render off the main thread; needed for a compositor that is not tied to the visible DOM. |
| `WebCodecs` (`VideoEncoder` + `VideoFrame`) | Best in-browser path | Frame-accurate encode, decoupled from realtime. Chromium-only today; Safari partial.     |
| `ffmpeg.wasm`                               | Heavy fallback       | Can mux/encode, but large download and slow; viable when WebCodecs is absent.            |
| `MediaRecorder`                             | **Not suitable**     | Realtime-only; cannot do frame-by-frame export. This is what we have now.                |

## Refactors required before any implementation

- **Master output compositor** — collapse the per-layer canvases into one
  composited surface (or render-to-texture pipeline).
- **Deterministic animation clock** — replace direct `performance.now()` reads
  in animated subsystems with an injected time source.
- **Timeline / project duration** — a concept the app does not currently have
  (it is an infinite live wallpaper).
- **Audio analysis cache** — precomputed FFT frames keyed by timestamp.
- **Render presets** — resolution / FPS / bitrate / codec selection.

These are large, cross-cutting changes. They should not be attempted alongside
feature work.

## Recommendation (roadmap)

- **V1 (now):** OBS + Presentation Mode. Documented, works, high quality.
- **V2:** Improve the realtime recorder where safe — bitrate/codec presets,
  clearer "FPS is a hint" messaging. Keep it labeled Experimental.
- **V3:** Offline renderer / desktop exporter (WebCodecs in-browser, or FFmpeg
  in a future desktop shell) built on the compositor + deterministic-clock
  refactors above.

Do not build V3 until the compositor and deterministic clock exist.
