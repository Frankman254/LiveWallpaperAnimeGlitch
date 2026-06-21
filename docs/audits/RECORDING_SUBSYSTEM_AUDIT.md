# Recording Subsystem Audit

**Date:** 2026-06-20 (re-audit)  
**HEAD:** `0bf9d914` · prior audit 2026-06-19  
**Scope:** In-browser `getDisplayMedia` + `MediaRecorder` path and relationship to Output / Recording modes.

## Executive summary

The in-app recorder remains a **legacy screen-capture wrapper**. It does **not** encode from an internal master compositor. **Presentation Mode + OBS** is the supported production workflow.

Recording Mode (`#/record`) reduces render cost via backing scale but **does not** write video files.

---

## File inventory (current)

| File                          | Role                                | Classification           |
| ----------------------------- | ----------------------------------- | ------------------------ |
| `useRecordingExport.ts`       | Hook: capture, record, save         | Working with limitations |
| `displayMediaCapture.ts`      | `preferCurrentTab`, monitor exclude | Working with limitations |
| `RecordingToolsSection.tsx`   | Export UI                           | Working                  |
| `recordingMimeSupport.ts`     | MIME + VP9 preference               | Working                  |
| `OutputModeLaunchSection.tsx` | Live output launch (not recorder)   | Working                  |
| `outputRenderQuality.ts`      | Recording shell backing scale       | Verified (unit tests)    |
| `dev/recordingSmokeHarness/*` | 5s DEV smoke                        | Manual only              |

---

## Classification matrix

| Item                                   | Status                   | Notes                                                         |
| -------------------------------------- | ------------------------ | ------------------------------------------------------------- |
| `getDisplayMedia`                      | Working with limitations | User picker **required**; cannot auto-select without confirm  |
| `preferCurrentTab`                     | Working with limitations | Chrome/Edge; pre-selects tab in picker                        |
| `MediaRecorder` start/stop             | Verified working         | No pause/resume                                               |
| MIME selection                         | Verified working         | WebM VP9 preferred when supported                             |
| Audio inclusion                        | Working with limitations | `audio: true` on display media; browser-dependent             |
| Pause/resume                           | Broken / not implemented | —                                                             |
| Stop → save                            | Verified working         | `showSaveFilePicker` or download fallback                     |
| 30/60 FPS request                      | Working with limitations | `frameRate` **hint**; encoder may differ                      |
| Recording shell `recordingTargetFps`   | Verified (pacing)        | Caps RAF on canvases; **not** MediaRecorder FPS               |
| Recording shell `recordingRenderScale` | Verified (backing)       | 2D + WebGL DPR; not CSS transform                             |
| Fullscreen during record               | Working with limitations | Auto re-entry after picker; **manual toggle can end capture** |
| Scene changes during record            | Untested                 | Tab capture should reflect visually                           |
| App audio sync in file                 | Working with limitations | Tab audio if user shares tab with audio                       |
| Long recording memory                  | Architectural risk       | All chunks in RAM until stop                                  |
| Every visual layer in file             | Working with limitations | Only if tab/window capture includes composited pixels         |
| Pixel art crispness at scale 0.5       | Working with limitations | Double resampling possible                                    |
| Safari / Firefox                       | Untested                 | Manual matrix required                                        |

**Do not claim** MediaRecorder encodes exactly 60 FPS because `frameRate: 60` was passed — browsers treat this as a hint.

---

## Capture pipeline (current)

```
Export → Start Recording
  → exitFullscreen() if needed
  → getDisplayMedia({ preferCurrentTab, video: { frameRate }, audio? })
  → user confirms tab/window in browser UI
  → optional requestFullscreen() if "fullscreen after capture" enabled
  → MediaRecorder.start(250ms slices)
  → Stop → Blob → save picker or Downloads
```

If user clicks **manual fullscreen** during recording, `videoTrack.ended` may fire → recorder stops → save dialog (partial file).

---

## Output modes vs internal recorder

| Path                | Records to disk    | Clean UI                                       |
| ------------------- | ------------------ | ---------------------------------------------- |
| `#/present` + OBS   | Via OBS            | Yes                                            |
| `#/record` + OBS    | Via OBS            | Yes + render scale                             |
| Export tab recorder | Yes (experimental) | No (editor chrome unless user picks clean tab) |

---

## DEV smoke harness

`#/dev/recording-smoke` — 5s capture, local blob playback. **Not run in CI.**

---

## Practical recommendation

### Supported V1

1. Build scene in `#/edit`
2. **Presentation Mode** or **Recording Mode** for clean output
3. **OBS** Window Capture on browser window
4. Audio via OBS desktop or browser source

### Experimental

1. Export tab → configure WebM VP9, 60 FPS hint, bitrate
2. Enable **fullscreen after capture**
3. Confirm **this tab** in picker
4. Do **not** toggle fullscreen manually while recording
5. Stop → save dialog

### Deferred

- Master compositor + `canvas.captureStream()`
- Pause/resume
- Memory-bounded chunk streaming
- Guaranteed MP4/H.264 across browsers

---

## Prerequisites before internal recording v2

1. Single output compositor (all layers)
2. Audio tap from Web Audio graph
3. Bounded chunk writer
4. Explicit record state machine in UI (including output shell)

---

## Stale settings / dead paths

- `OutputRenderScaleStage` (CSS scale) — **removed**; replaced by `outputRenderQuality.ts`
- `useOutputModeAudioAutostart` — **removed** after shared provider fix

---

## Media-key / output-sync sprint findings

### Recorder status decision — **Experimental / Legacy. OBS remains V1.**

Audited the realtime recorder (`useRecordingExport`, `displayMediaCapture`,
`recordingMimeSupport`):

- **Capture source:** `getDisplayMedia` (screen/window capture), _not_
  `canvas.captureStream()`. There is no master compositor canvas.
- **Encoder:** `MediaRecorder`, VP9/opus preferred with VP8 → WebM → MP4
  fallback already implemented (`getSupportedRecordingFormats`).
- **Bitrate:** already configurable (`videoBitsPerSecond`, default 18 Mbps).
- **FPS:** a _hint_ only (`frameRate: { ideal, max }`), never guaranteed.

**Conclusion:** the quality ceiling is inherent to realtime `MediaRecorder` +
`getDisplayMedia` (browser throttling, no frame-accurate encode, large files).
The pieces a user would tune (bitrate, codec, FPS hint) already exist; no safe
change makes it match OBS. It stays **Experimental**, and OBS Window Capture is
the recommended V1 path. A true non-realtime path is scoped in
`docs/architecture/OFFLINE_VIDEO_RENDERER_DESIGN.md` (V3, not built).

### Media-key playback / analyser desync — root cause + fix

**Root cause:** `navigator.mediaSession.playbackState` was never set anywhere in
the codebase. With it left at the default `'none'`, the browser guesses
play-vs-pause from the raw media element, which diverges from the app's
canonical `audioPaused` state. That single gap explains all three reported
symptoms:

- F8 "pause then immediately resume" (browser fires the wrong action handler).
- F7/F9 previous/next inert (no active media session on macOS).
- Resume-while-paused-before-Presentation plays audio but the canvas stays
  frozen — audio resumed natively while React paused flags stayed stale, so
  `getAudioSnapshot()` kept returning the empty snapshot.

**Fix:** `resolveMediaSessionPlaybackState()` + an effect in
`useAudioPlaybackEffects` that keeps `navigator.mediaSession.playbackState`
synced to `audioCaptureState` + `audioPaused`. Media Session play/pause/next/prev
handlers already route to the canonical `resumeCapture`/`pauseCapture`/
`playNextTrack`/`playPrevTrack` commands.

**Validation status:**

| Check                               | Status                            |
| ----------------------------------- | --------------------------------- |
| Unit: playbackState resolver        | ✅ tested                         |
| Mac F8 single-toggle                | ⏳ pending hardware validation    |
| Mac F7 previous / F9 next           | ⏳ pending hardware validation    |
| Presentation resume → canvas reacts | ⏳ pending hardware validation    |
| Windows media keys                  | ⏳ Untested (no Windows hardware) |

> Hardware media-key behavior cannot be exercised headlessly. The code fix and
> root cause are verified by reasoning + unit test; the OS-key matrix above must
> be ticked by a human before claiming "working".

### Output FPS overlay (OBS-safe)

`OutputModeDevDiagnostics` was DEV-build-only, so it never appeared in the
production build used for OBS. Now opt-in via **`?debug=fps`** (e.g.
`#/present?debug=fps`) or the **Ctrl+Shift+F** toggle (sessionStorage-backed).
Never visible by default; shows mode, perf mode, backing/css size, DPR, render
scale, approx FPS + frame ms. Hide again with Ctrl+Shift+F before final capture.

---

## Device target policy

| Device class     | Intended use                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Phone / tablet   | Preview + light control only. No guaranteed recording/export; heavy effects may be limited. Not a performance-baseline target. |
| Laptop / desktop | **Recommended** for Presentation/Recording. OBS workflow supported. Performance baselines are measured here.                   |

The app is not hard-blocked on mobile; this is a guidance policy, not a gate.
