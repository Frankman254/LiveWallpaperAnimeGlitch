# Spectrum Engine — architecture refactor

## Goal

Lift the current ad-hoc family dispatching into a **single registry** so future families plug in without touching the renderer switch, the UI conditionals, or the preset wiring. No new features in this refactor — just consolidate what we already ship (`classic`, `oscilloscope`, `tunnel`, `liquid`, `orbital`) + activate the half-wired `spectrogram` renderer + leave clean hooks for `spiral` and other future families.

## Survey findings (current state)

The system is **most of the way there** already:

- Capabilities table exists: `src/features/spectrum/spectrumFamilyCapabilities.ts` (`supportsShape`, `supportsMirror`, `supportsTunnelFx`, etc).
- Renderers are co-located: `src/features/spectrum/renderers/{family}/{family}Renderer.ts` with mostly-uniform signatures.
- Family-specific presets exist: `spectrumTunnelPresets.ts`, `spectrumLiquidPresets.ts`, `spectrumFrameMemoryPresets.ts`.
- Macro system already family-aware: `spectrumStateTransforms.ts` has `getEnergyHeightRange()`, `getChaosRotationMax()` with family branches.

What's missing:

- **No central registry** — the renderer dispatch lives in `CircularSpectrum.ts:313-389` as an if/else cascade; capabilities live in their own file; presets live in 3 more files. Each is independent.
- **UI uses raw family checks** — `SpectrumMainSection.tsx` has `isClassic / isTunnel / isLiquid / isOrbital` flags it derives inline.
- **Spectrogram is dead code** — `normalizeSpectrumFamily('spectrogram') === 'classic'` (`spectrumControlConfig.ts:131-133`) silently downgrades it. Renderer + decay field exist, dispatcher branch + UI hookup do not.

## Architecture decisions

### Registry shape (Phase 1)

```ts
// src/features/spectrum/spectrumFamilyRegistry.ts
interface SpectrumFamilyDefinition {
	id: SpectrumFamily;
	label: string;
	description: string;

	// What the family can do — drives UI control visibility.
	capabilities: SpectrumFamilyCapabilities; // existing record

	// Tags for grouping in the family picker (e.g. "Geometric", "Generative",
	// "Temporal"). Optional, UI-only.
	categories: ReadonlyArray<SpectrumFamilyCategory>;

	// Which renderer to invoke. Receives whatever the dispatcher hands it.
	// All renderers conform to `SpectrumRenderer` (see below).
	render: SpectrumRenderer;

	// Family-default presets exposed to the UI. Standardized to
	// Safe / Balanced / Heavy; Showcase + Experimental optional.
	presets?: SpectrumFamilyPresetSet;
}
```

A `SpectrumFamilyCategory` is just a string union — no behavior, only UI grouping (`'geometric' | 'temporal' | 'generative' | 'depth'` etc).

### Renderer signature (Phase 2)

All renderers move to a unified shape:

```ts
type SpectrumRenderInput = {
	ctx: CanvasRenderingContext2D;
	canvas: { width: number; height: number };
	audio: {
		bins: Uint8Array;
		pixelHeights: Float32Array; // pre-sampled heights for bar-based families
		resolvedChannel: ResolvedAudioReactiveChannel;
	};
	runtime: SpectrumRuntimeState; // smoothed heights, peaks, histories
	settings: SpectrumSettings;
	dt: number;
	cx: number;
	cy: number;
};

type SpectrumRenderer = (input: SpectrumRenderInput) => void;
```

Today the renderers all take subsets of this. The refactor adapts them to the union by adding helpers — no behavior change. Spectrogram already needs `bins`, oscilloscope already keeps its own history; this is the lowest-common-denominator shape that covers all current families.

### Control schema (Phase 2 cont.)

Each family declares which control groups apply. The capabilities table already encodes this; we keep the same field names but expose them as a single typed interface read by both UI and presets.

UI rule: a control renders if its capability flag is `true` on the active family. No more `isTunnel && <...>` in tab files.

### Spectrogram activation (Phase 6)

1. Stop `normalizeSpectrumFamily()` from rewriting `'spectrogram' → 'classic'` (`spectrumControlConfig.ts:131-133`).
2. Add the dispatch branch in `CircularSpectrum.ts` that calls `drawSpectrogram(ctx, canvas, bins, runtime, settings)`. Bins already flow through `drawSpectrum`.
3. Register `spectrogram` in the new registry with `capabilities = { supportsHistory: true, supportsShape: false, ... }`.
4. UI: the family picker already lists `spectrogram` from the `SpectrumFamily` union; once capabilities filter the controls correctly, only the relevant sliders (decay, contrast, gradient) appear.
5. Macros (energy / softness / chaos) get spectrogram-aware ranges in `spectrumStateTransforms.ts` (extends existing branches).

### Spiral prep (Phase 7) — registry-only

No renderer yet. We add `SpectrumFamily` doesn't get `'spiral'` until we implement it, but the registry shape allows it to slot in cleanly when ready: declare capabilities, hand a `render` function, presets, done. No UI wiring needed.

## Migration steps

Each step ends with a green build before moving to the next.

1. **Add the registry file** with all 5 (+1 pending) family definitions. No consumer migration yet — registry coexists with the current dispatch.
2. **Switch `CircularSpectrum.ts` dispatcher to read from the registry** — same behavior, registry-driven.
3. **Activate spectrogram**: remove the normalize, register it, verify it renders.
4. **Migrate UI**: replace `isClassic / isTunnel / isLiquid / isOrbital` flags in `SpectrumMainSection.tsx` with a helper `useSpectrumCapabilities(family)` that returns the cap record.
5. **Standardize presets**: the existing tunnel/liquid preset files get a `Safe / Balanced / Heavy` named view; `frameMemoryPresets` stays orthogonal (cross-family effect).
6. **Cleanup**: remove `normalizeSpectrumFamily` branch for spectrogram, drop dead `if (family === 'classic')` checks now derivable from caps.

## Files that will change

| Step | Files                                                                                                                      |
| ---- | -------------------------------------------------------------------------------------------------------------------------- |
| 1    | `src/features/spectrum/spectrumFamilyRegistry.ts` (NEW), keep `spectrumFamilyCapabilities.ts` as the cap source            |
| 2    | `src/components/audio/CircularSpectrum.ts` (dispatcher)                                                                    |
| 3    | `src/features/spectrum/spectrumControlConfig.ts` (drop normalize), `spectrumStateTransforms.ts` (spectrogram macro ranges) |
| 4    | `src/components/controls/tabs/spectrum/SpectrumMainSection.tsx` (capability-driven sections)                               |
| 5    | `src/features/spectrum/presets/*` (re-shape) — optional, only if cheap                                                     |
| 6    | grep cleanup pass                                                                                                          |

## Non-goals (explicit)

- Not redesigning the Spectrum tab UI.
- Not adding new audio analysis features.
- Not building Spiral.
- Not implementing radial Spectrogram (linear-first per brief).
- Not touching the clone composition rules.

## Verification

After each step:

- `npx tsc --noEmit -p tsconfig.app.json`
- `pnpm build`
- Smoke test: switch through all 6 families in the panel; ensure no broken render.

## Deliverables (final)

### 1. Architecture overview

This file. Plus `src/features/spectrum/spectrumFamilyRegistry.ts` which is the only place a new family touches to wire itself in.

### 2. Family registry structure

```
SPECTRUM_FAMILY_REGISTRY: ReadonlyArray<SpectrumFamilyDefinition>
SpectrumFamilyDefinition {
  id, label, description
  categories: ('geometric' | 'temporal' | 'depth' | 'generative' | 'analytic')[]
  capabilities: SpectrumFamilyCapabilities   // re-exported from existing file
  renderKind: 'classic-linear' | 'classic-radial' | 'oscilloscope' | 'tunnel' | 'liquid' | 'orbital' | 'spectrogram'
  macroTuning: { energyHeight…, energyGlow, chaosRotation…, afterglowMax, motionTrailsMax }
}

dispatchSpectrumRenderer(family, mode, input) → owns the render switch
getSpectrumFamilyDefinition(family) → reader API
```

### 3. Capability system

`spectrumFamilyCapabilities.ts` left untouched (already had the full record) and re-exported through the registry. The dispatcher reads `renderKind`; the UI reads `capabilities.supports*`; the macro inference reads `macroTuning`. No `if (family === 'tunnel')` branches needed for any of these — adding a family is a single registry entry.

### 4. Control schema

`SpectrumMainSection.tsx` was hand-driven (`isClassic`, `isTunnel`, `isLiquid`, `isOrbital` derived inline). The control-visibility checks now read from capabilities:

- Style selector: `caps.supportsShape`
- Tunnel preset block: `caps.supportsTunnelFx`
- Liquid layer panel: `caps.supportsLiquidLayers`
- Wave fill: `caps.supportsWaveFill`
  The remaining `isTunnel / isLiquid / isOrbital` references in the file are kept on purpose — they gate **per-family hint text** (each family has unique copy) and are 1:1 with the family id, so a capability flag would just hide the same information behind another name.

### 5. Files changed

| File                                                            | What                                                                                                                                                           |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/spectrum/spectrumFamilyRegistry.ts` (NEW)         | Registry + dispatcher + macro tuning per family                                                                                                                |
| `src/components/audio/CircularSpectrum.ts`                      | Removed 7-arm if/else cascade; now `dispatchSpectrumRenderer(family, mode, ctx)`. Dropped 6 direct renderer imports.                                           |
| `src/features/spectrum/spectrumControlConfig.ts`                | `normalizeSpectrumFamily('spectrogram')` no longer maps to `'classic'`. `SPECTRUM_FAMILIES` array now includes `'spectrogram'` so the family picker offers it. |
| `src/components/controls/tabs/spectrum/SpectrumMainSection.tsx` | Style / tunnel-preset / liquid-layer sections derive from capabilities.                                                                                        |
| `src/features/spectrum/spectrumStateTransforms.ts`              | Energy / Chaos / afterglow / motion-trails ranges read from `macroTuning` instead of family branches.                                                          |

### 6. Spectrogram → Spiral (replaced)

The Spectrogram renderer ships in code but is **hidden from the picker** — the full-width yellow waterfall it produced was visually intrusive and didn't fit the editor aesthetic. `normalizeSpectrumFamily()` falls back to `'classic'` for anyone with `'spectrogram'` persisted, so no save state breaks.

**Replacement: Spiral** (`renderKind: 'spiral'`). Bins distributed along a logarithmic-feel spiral that grows outward from the center; each bin is a glowing dot whose size + brightness track its amplitude. The whole spiral rotates with `spectrumRotationSpeed`. New family on the picker, clone-friendly (concentric main + clone around the logo).

- ✅ `src/features/spectrum/renderers/spiral/spiralRenderer.ts` — ~70 lines
- ✅ Registered in `spectrumFamilyRegistry`
- ✅ Capability flags: `supportsBarWidth` (dot size), `supportsRotation`, `supportsShockwave`
- ✅ `SPECTRUM_FAMILIES` + `SPECTRUM_CLONE_FAMILIES` + `SPECTRUM_FAMILY_LABELS` + picker preview SVG
- ✅ Macro tuning: matches the energy / chaos profile of generative families.

### 7. Remaining technical debt

- **Per-family hint text** in `SpectrumMainSection.tsx` still uses `isTunnel / isLiquid / isOrbital` literals. Moving to `description` from the registry would centralize copy but would also force i18n through the registry — out of scope for this refactor.
- **`supportsFillControl()` helper** in `spectrumStateTransforms.ts` still has its own short branch on `family === 'liquid' / 'oscilloscope'`. Easy to migrate to `caps.supportsWaveFill` once we audit the call sites.
- **`SPECTRUM_CLONE_FAMILIES` array** in `spectrumControlConfig.ts` is parallel to the main `SPECTRUM_FAMILIES` array. Could become a `capabilities.supportsClone` flag.
- **Frame effects skip in shockwave** (`spectrumFrameEffects.ts:297`) still does `if (family === 'spectrogram') return`. Move to `caps.supportsShockwave` after verifying the clone variant matches.
- **Spectrogram macro tuning** is conservative — needs real-world calibration once the user A/B tests it.
- **Spiral family** is _not_ added to the union yet — adding `'spiral'` to `SpectrumFamily` will require a no-op registry entry + renderer skeleton + UI picker entry. Architecture supports it, but not pre-emptively wired.

### 8. Recommended next families

All of these are 1-registry-entry adds once the renderer exists:

- **Spiral** — radial freq-to-angle mapping; reuses radial-shape utilities; clone-friendly.
- **Halo / Pulse** — single ring that swells with bass; minimal renderer; `supportsShockwave: true`, no shape.
- **VU / LED meter** — linear segmented bar; high info-density, low GPU cost; `supportsShape: false`, `supportsMirror: true`.
- **Spectrogram radial** — second `renderKind: 'spectrogram-radial'` once the linear version is dialed in.
- **Terrain** — frequency × time as a 3D heightmap. Likely needs WebGL, so it'd ship behind a `capabilities.requiresWebGL` flag the dispatcher can check.
