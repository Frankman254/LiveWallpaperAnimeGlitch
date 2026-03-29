# LiveWallpaperAnimeGlitch

Audio-reactive live wallpaper and music visualizer editor built with Vite, React, Zustand, Three.js, and React Three Fiber.

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
