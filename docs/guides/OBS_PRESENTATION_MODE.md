# OBS Presentation Mode

This app supports a **clean render-only shell** for live shows and OBS window capture.

## Supported V1 workflow

1. Open **`#/present`** (or choose **Presentation Mode** from Export tab / ⌘K command palette).
2. Load the desired project/scene in the editor first, or switch scenes/setlists from keyboard/media session if already configured.
3. Optional: enter browser fullscreen after a user gesture (fullscreen is separate from Presentation Mode).
4. In OBS, add a **Window Capture** source targeting the browser window/tab showing the wallpaper.
5. Return to editing with **`Ctrl+Shift+E`**, navigate to **`#/edit`**, or hold the **top-left hot corner for 2 seconds**.

## Recommended OBS settings

| Setting     | Recommendation                                                                           |
| ----------- | ---------------------------------------------------------------------------------------- |
| Source type | Window Capture (preferred over Display Capture to avoid capturing editor UI)             |
| FPS         | Match browser target — **60** for motion-heavy scenes, **30** if CPU/GPU is tight        |
| Resolution  | Match canvas layout reference (commonly 1920×1080) — avoid upscaling in OBS              |
| Audio       | Capture **either** OBS desktop/window audio **or** app audio — not both (double capture) |
| Browser     | Enable hardware acceleration in Chrome/Edge settings                                     |

## Browser notes

- **Fullscreen (`Esc`)** exits browser fullscreen only; Presentation Mode stays active until you recover via shortcut or `#/edit`.
- A temporary on-screen hint appears for ~5 seconds: `Ctrl+Shift+E to return to the editor`.
- Presentation Mode is **session state** — it is not saved inside projects or profiles.

## What is hidden in Presentation Mode

The following are **unmounted**, not merely hidden:

- Control panel / maximized editor overlay
- HUD / Quick Actions launcher and MediaDock
- Diagnostics HUD stack and FPS overlay
- Drag interaction layer and edit markers
- Editor-only keyboard listeners (spectrum manual keys)

The render stage, audio runtime, slideshow/scene switching, and visual layers remain active.

## Performance

Use the output FPS overlay to compare approximate FPS/frame time. It is **opt-in
and OBS-safe** — hidden by default so it never leaks into a recording:

- Append **`?debug=fps`** to the route (e.g. `#/present?debug=fps`), or
- Press **Ctrl+Shift+F** to toggle it (works in the production build too).

It shows mode, performance mode, backing/CSS size, DPR, render scale, and approx
FPS + frame ms. Press **Ctrl+Shift+F** again to hide it before final capture. Do
not assume improvement without measuring on your target machine and scene
complexity.

> **Audio strategy (avoid double audio):** capture audio in **one** place only.
> Either let OBS capture **desktop audio** _or_ add the browser as an
> application/browser audio source — not both. If you hear an echo/phase, you
> have two audio paths active.

## Recording vs Presentation

- **`#/present`** — live output for OBS
- **`#/record`** — same clean shell with recording-oriented session settings (render scale cap, target FPS metadata)
- Legacy **screen recording** in Export tab uses `getDisplayMedia` and captures whatever is on screen — prefer OBS + `#/present` for production live output.

## Known limitations

- No dedicated master compositor canvas yet — OBS captures the browser window compositing DOM + multiple canvases.
- Secondary-window mini player (`#/preview`) is a legacy sync path; Presentation Mode in the same window is the supported V1 live path.
