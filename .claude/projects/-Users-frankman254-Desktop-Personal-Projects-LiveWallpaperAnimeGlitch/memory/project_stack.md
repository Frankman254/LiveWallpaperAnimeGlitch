---
name: Project: Live Wallpaper Anime Glitch
description: Vite + React + TS + Three.js. Migrado de Next.js. Stack y estructura definidos.
type: project
---

Vite + React + TypeScript + Zustand + React Three Fiber (Three.js shaders) + Canvas 2D.

**Routes**: `/#/` and `/#/editor` → EditorPage, `/#/preview` → PreviewPage (shared Zustand state + localStorage sync).

**State store**: `src/store/wallpaperStore.ts` — Zustand with IndexedDB persist (name: `lwag-state`, version: 4).

**Layer system**: SceneLayers (Three.js: background-image, particles, rain, fx) + OverlayLayers (Canvas 2D: logo, spectrum, overlay-images) — built in `src/lib/layers.ts`.

**Shader**: `src/shaders/backgroundFragment.glsl` — handles glitch, scanlines, noise, RGB shift, fit modes, and crossfade transitions.

**Why:** Long-term project to build a production-grade visual editor for anime/cyberpunk audio-reactive wallpapers.

**How to apply:** When editing rendering, check BackgroundPlane.tsx (Three.js mesh) + the GLSL shaders. Canvas 2D effects are in CircularSpectrum.ts and ReactiveLogo.ts.
