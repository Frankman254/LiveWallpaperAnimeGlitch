# MVP Product Architecture Plan

Status: Phase 1 foundation implemented; Phase 2A offline audio analysis
foundation implemented; Phase 2B audio-layer render-frame contract
implemented.

This document defines the product direction for turning the current live
wallpaper/music visualizer editor into a sellable MVP. It is intentionally
phased: the current real-time editor must keep working while export, timeline,
performance, and sharing are made product-grade.

## 1. Product Architecture Overview

The product should be treated as five owned subsystems:

- State/document owner: `src/store`, `src/lib/projectSettings.ts`,
  `src/lib/wallpaperPersistenceCoordinator.ts`. This remains the source of
  truth for projects, presets, scene slots, and persisted versions.
- Renderer owner: `src/components/wallpaper`, `src/components/audio`,
  `src/features/spectrum`. This owns preview rendering today and will expose
  deterministic render entry points for export.
- Audio owner: `src/context/audioData`, `src/lib/audio`. This owns live
  playback, playlist state, and future offline analysis.
- Editor UI owner: `src/components/controls`, `src/components/wallpaper`.
  This owns workflow, timeline UX, HUD, and inspector panels.
- Export owner: `src/features/export`. This owns export plans, job lifecycle,
  render contracts, browser capabilities, progress, cancellation, and future
  encoding adapters.

The MVP architecture should not introduce another hidden source of truth. The
exporter must consume a frozen project-state snapshot and referenced assets. It
must not read random live UI state while rendering.

## 2. Offline Export Architecture

Recommended browser-side direction:

- Use file/playlist audio only for offline export MVP. Desktop and microphone
  capture are live inputs and cannot be deterministically exported offline.
- Create an `OfflineExportJob` from a frozen state snapshot, selected audio
  assets, resolution, FPS, quality mode, and duration.
- Decode audio assets with Web Audio APIs into an offline analysis source.
- Render frame-by-frame into an owned canvas at fixed resolution.
- Feed frames to an encoder adapter without retaining all frames in memory.
- Report progress by phase: prepare, decode audio, analyze, render, encode,
  mux, save, done.
- Cancel with `AbortController` and release canvases/audio buffers/chunks.

Encoding reality:

- Browser MP4 is not guaranteed. `MediaRecorder` MP4 support is inconsistent
  and is real-time oriented, not robust offline export.
- WebCodecs is the recommended browser primitive for serious export, but MP4
  muxing still needs a muxer layer. A future desktop wrapper can delegate muxing
  to native ffmpeg.
- MVP browser path should be "MP4-friendly": deterministic frames plus audio
  timeline, WebCodecs when available, and a clean adapter boundary for WebM,
  MP4 muxer, or desktop-native muxing later.

Client-side now:

- Project state snapshotting.
- Asset dependency resolution.
- Offline export planning and readiness.
- Deterministic render contracts.
- Progress/cancel model.

Modularized for future desktop app:

- Encoder adapter interface.
- Asset provider interface.
- Offline audio analysis interface.
- Render session interface.
- Job manifest format.

## 3. Offline Render Model

The current preview is real-time and RAF-driven. Export requires a timeline
model:

```ts
renderFrame({
  frameIndex,
  timeMs,
  deltaMs,
  fps,
  width,
  height,
  stateSnapshot,
  audioSnapshot,
  runtime
});
```

Required changes by phase:

- Extract pure drawing entry points from React canvas components.
- Replace `window.innerWidth/window.innerHeight` reads with explicit viewport
  dimensions from the render context.
- Replace live `getAudioSnapshot()` reads with an `AudioAnalysisSource` that can
  resolve `getSnapshotAt(timeMs)`.
- Scope visual runtime caches by render session. Global maps such as spectrum
  runtime state are acceptable for preview, but export needs job-scoped runtime
  to avoid contamination between preview and export.
- Track title/time must come from the same timeline metadata as the exported
  audio, not from current live playback state.

The export renderer should match preview by sharing draw functions, not by
recording the preview DOM.

## 4. Timeline / Pro Editor UX Plan

Do not redesign the whole editor first. Add a professional workflow layer over
the existing controls.

Phase approach:

- Add a bottom timeline strip with audio ruler, current playhead, scene markers,
  and image spans.
- Show waveform preview for file/playlist audio using cached offline waveform
  peaks.
- Represent slideshow images as blocks assigned to time ranges.
- Show transitions as visible handles between blocks.
- Add quick navigation: previous marker, next marker, jump to image, jump to
  track section.
- Keep the current inspector tabs as detailed property editors.
- Later, allow scene blocks to reference scene slots, spectrum slots, looks
  slots, particles/rain/logo/track-title slots.

The model is closer to a lightweight arrangement editor than a full After
Effects clone.

## 5. Performance Improvement Plan

Quick wins:

- Keep RAF-driven work inside small render components, not broad panels.
- Narrow Zustand subscriptions with selectors.
- Cache thumbnails, decoded image dimensions, palettes, and waveform peaks.
- Add export/preview quality modes and per-layer quality caps.
- Avoid redoing palette, spectrum bin routing, and layout calculations per UI
  render.

Medium refactors:

- Introduce a render graph/layer plan generated from state.
- Add dirty flags per visual subsystem.
- Share one audio snapshot per frame across all audio-reactive layers.
- Move heavy image/postprocess helpers behind reusable canvas buffer pools.
- Normalize viewport/resolution scaling at render context boundaries.

High-risk/high-reward:

- OffscreenCanvas worker renderer.
- WebGL/WebGPU compositor for all visual layers.
- Desktop app export using native ffmpeg.
- Workerized offline audio FFT analysis for long tracks.

## 6. Preset / Project Sharing Model

Current `.lwag` package is a good start, but MVP sharing needs explicit bundle
structure and dependencies.

Recommended project bundle v2:

```text
manifest.json
state.json
assets/images/...
assets/audio/...
assets/thumbnails/...
presets/spectrum.json
presets/looks.json
presets/scenes.json
```

Preset pack model:

- `packId`, `version`, `createdWith`, `author`, `license`, `tags`.
- `presets[]` with type: scene, spectrum, looks, particles, rain, logo,
  track-title, background.
- `dependencies[]` by asset ID and preset ID.
- Optional thumbnails and preview metadata.

Rules:

- Scene slots reference other slots. They should not flatten every setting.
- Missing assets become explicit warnings with disabled layers or placeholders.
- Import must support migration by bundle version.
- Presets should be importable without overwriting the whole project.

## 7. Phased Roadmap

Phase 1: MVP foundation

- Freeze ownership boundaries.
- Add offline export contracts and browser readiness planner.
- Keep existing screen recording as legacy/preview recording.
- Document export limitations honestly.
- Prepare UI so users can see whether a project is export-ready.

Phase 2: Basic offline export path

- Decode file/playlist audio offline.
- Build `AudioAnalysisSource.getSnapshotAt(timeMs)`.
- Extract render-frame entry points for background, spectrum, logo, track title,
  particles/rain where practical.
- Implement fixed-resolution frame rendering at 30/60 FPS.
- Encode via WebCodecs where available; provide WebM first if MP4 muxing is not
  available.

Phase 3: Professional workflow

- Add timeline strip, waveform cache, scene blocks, markers, and transition
  handles.
- Add scene assignments over time.
- Add project/preset pack import modes.
- Add export presets for YouTube, social, ultrawide, and portrait.

Phase 4: Premium/pro direction

- Desktop export with native ffmpeg.
- Batch export.
- 4K/high bitrate profiles.
- Advanced timeline automation.
- Marketplace/shareable preset packs.
- Branded template packs.

## 8. Recommended First Implementation Phase

Implemented now:

- `src/features/export` owns offline export planning contracts.
- `ExportTab` shows offline export readiness without pretending export is done.
- This phase does not change renderer behavior, audio playback, persistence, or
  project file formats.

Phase 2A implemented after Phase 1:

- `OfflineAudioAnalysisSource` decodes imported file/playlist audio without
  touching playback.
- It exposes deterministic `getSnapshotAt(timeMs)` snapshots compatible with
  the existing `AudioSnapshot` shape.
- It resets smoothing when time goes backwards, so sequential export from
  frame 0 remains deterministic.
- `ExportTab` can run a real offline audio analysis test against the selected
  export audio asset.
- This is not video export yet. It is the audio source needed before
  `renderFrame(timeMs)` can match preview.

Phase 2B implemented after Phase 2A:

- Preview audio layers now use a shared `renderAudioLayerFrame(...)` helper.
- Export has `createOfflineAudioLayerRenderSession(...)`, which can render
  logo, spectrum, and track-title layers into an owned canvas for a specific
  timeline frame.
- The session consumes `OfflineAudioAnalysisSource.getSnapshotAt(timeMs)`, so
  audio-reactive overlays no longer require live playback for export tests.
- The current logo/spectrum renderers still keep some runtime state in module
  scope; the session resets that state at creation for deterministic standalone
  jobs. Full job-scoped renderer state remains a later renderer refactor.

Next phase should not start until the render model is explicitly adapted. The
root technical task is extracting deterministic `renderFrame(timeMs)` paths
from the current RAF/live-audio preview pipeline.
