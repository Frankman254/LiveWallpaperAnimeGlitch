# LiveWallpaperAnimeGlitch

Audio-reactive live wallpaper and music visualizer editor built with Vite, React, Zustand, Three.js, and React Three Fiber.

## Documentation

- Main index: [docs/README.md](docs/README.md)
- Architecture: [docs/ARQUITECTURA_GENERAL.md](docs/ARQUITECTURA_GENERAL.md)
- Audio, render, shaders: [docs/AUDIO_RENDER_Y_SHADERS.md](docs/AUDIO_RENDER_Y_SHADERS.md)
- Project status: [docs/ESTADO_PROYECTO_0_2_0.md](docs/ESTADO_PROYECTO_0_2_0.md)
- Active plans: [docs/plans](docs/plans)
- Active status/handoffs: [docs/status](docs/status)
- Guides: [docs/guides](docs/guides)
- Historical docs: [docs/archive](docs/archive)

## What It Does

- Real-time editor and clean preview mode using hash routes:
    - `#/` editor
    - `#/preview` preview window
- Background image and slideshow workflow with IndexedDB-backed asset persistence
- MP3 playback controls plus desktop or microphone audio capture
- Circular and horizontal spectrum rendering
- Reactive logo overlay
- Background and foreground particles
- Rain, glitch, RGB shift, scanlines, parallax, and other wallpaper FX
- Built-in presets plus saveable custom presets

## Tech Stack

- Vite
- React 19
- TypeScript
- Zustand
- React Router
- Three.js
- React Three Fiber
- Tailwind CSS v4

## Getting Started

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm run serve
```

## Persistence Model

- Lightweight scene/settings state is persisted in `localStorage` under `lwag-state`
- Uploaded images and logos are stored in IndexedDB and restored on reload
- Preview windows stay in sync by rehydrating persisted state

## Notes

- This project is not using Next.js
- The app uses a `HashRouter`, so deep links are based on `#/...`
- Large production bundles currently trigger Vite's chunk-size warning

## Documentation Map

Use [docs/README.md](docs/README.md) as the source of truth for docs organization.
