# Motion Stabilization Status

_Last updated: 2026-06-08 — Motion Stabilization Sprint_

Snapshot of the Motion subsystem after the recent feature additions (Particles
Audio Drift, Particles Depth Flow, Stage Lights, Flash Light, Camera Motion,
Screen Shake, Motion profiles, QuickActions integration). This is a
stabilization record, not a roadmap for new features.

---

## Stable

These are validated and considered production-ready.

- **Particles — appearance / surface / glow / filters.** Fully wired, persisted,
  and captured by Particles + Motion profile slots.
- **Particles — audio response (envelope).** Smoothing, size/opacity boost,
  attack/release, response speed, peak window/floor, punch. Captured by
  profiles. Audio size boost is renderer-capped.
- **Particles — Audio Directional Drift.** Mode (velocity / soft offset / burst
  impulse), channel, angle, amount, base, threshold, release. Captured by
  profiles.
- **Particles — Depth Flow.** Mode (pull / push / tunnel / snow), direction,
  channel, amount, focus X/Y, threshold, sensitivity, attack, release, speed,
  spread. Captured by profiles.
- **Rain (Classic Rain).** Enabled, intensity, count, speed, angle, tilt,
  particle type, length/width/blur/variation, color source/mode/color. Captured
  by Rain + Motion profile slots. Frozen feature set (see V2 debt).
- **Motion / Particles / Rain profile slots.** Save, load, factory defaults,
  res export/import, canonical importer, and QuickActions load/save all
  round-trip the full particles + rain field set. Verified against
  `PARTICLES_PROFILE_KEYS`, `RAIN_PROFILE_KEYS`, `MOTION_PROFILE_KEYS`.
- **QuickActions / HUD Motion controls.** Freeze/unfreeze, Stage Lights, Flash
  Light, Camera FX, Screen Shake, particle audio/glow toggles. All wired to the
  correct store setters, translated (`sfx_hud_*`, `qa_*`), no dead buttons, no
  duplicated controls fighting the editor.
- **Stage FX disabled/perf guards.** Stage Lights and Flash Light skip their
  draw pass when disabled / asleep / below alpha threshold; Camera FX stops its
  RAF entirely when neither motion nor shake is active. Performance-mode
  reductions are in place (beam count, blur, haze/core/flare passes, frame
  throttle 30/45/60).

## Experimental

Functional but not fully hardened; treat changes here with care.

- **Flash Edge / Reactive Neon Edge** (`FlashEdgeSection`, `EdgeGlowSection`).
  Present and translated, but not part of the core Motion profile validation
  pass this sprint.
- **Stage Lights high-quality mode.** The `high` performance path enables haze +
  larger blur multipliers; visually rich but the heaviest per-beam cost.
- **Camera target selection.** Camera FX applies to discovered
  `data-camera-motion-layer` targets via a MutationObserver. Works, but explicit
  per-target selection UI is not implemented.

## V1 debt (address next)

- **Stage FX is not captured by any profile slot.** Stage Lights, Flash Light,
  Camera Motion, and Screen Shake persist globally (store + export/import +
  factory defaults) but are **intentionally not bundled** into Motion /
  Particles / Rain profile slots — those slots are documented as a
  particles + rain bundle only. Loading a Motion profile deliberately does not
  reshape Stage FX. Giving Stage FX its own profile subsystem is deferred (see
  V2) to avoid scope expansion in this sprint.
- **Stage FX per-frame allocations.** `StageLightsCanvas` allocates ~3 gradients
  per beam per frame (geometry is dynamic, so they can't be cached cheaply).
  Guarded by early-outs (disabled / `beamAlpha < 0.002`), but the allocation
  pattern + `shadowBlur` passes remain the dominant cost at high beam counts.
  Architectural, not a bug.
- **Idle RAF for disabled Stage Lights / Flash Light.** Both keep a throttled
  RAF alive while disabled (getState + clearRect only). Negligible, but could be
  gated on `enabled` at the mount level.
- **UI control-type inconsistency.** Mode selection uses `SegmentedControl` in
  `StageLightsSection` but `OptionButtonGroup` in `ParticlesAppearanceSection`;
  Stage Lights renders boolean toggles via an inline `.map` while Particles/Rain
  use the shared `SwitchRow`. Both are valid and not confusing, so they were
  left as-is to avoid churn. Normalize to one shared mode-control + `SwitchRow`
  when the design system gets its next pass.

## V2 debt (future, larger efforts)

- **Rain as a particle-emitter preset.** Migrate Classic Rain into Particle
  Emitters / Streak particles and retire the standalone Rain subsystem once the
  particle path reaches parity. Code is marked (`RainSection.tsx`,
  `RainLayer.tsx`).
- **Stage FX profile slots.** A dedicated Stage FX profile/slot bundle (lights +
  flash + camera + shake) so the full stage look can be saved/recalled like
  particles and rain.
- **Multi-layer background.**
- **Multi-layer spectrum.**
- **Full compositor graph** (unify background / spectrum / particles / rain /
  stage FX layering under one ordered graph).

---

## This sprint's changes

- **i18n:** Moved all remaining hardcoded Motion UI text to `en.ts` / `es.ts`.
  New keys cover Particles appearance subtitle, particle details, envelope
  (smoothing / attack / release / response speed / peak window / peak floor /
  punch), Audio Directional Drift (label + hint + mode/angle/amount/base/
  threshold/release + mode options), and Depth Flow (label + hint + all
  field labels + direction/mode options), plus two helper texts. Stage Lights
  was already fully `sfx_*`-keyed from a prior sprint.
- **No control was added or removed.** Reorganization was limited to i18n.
- **Rain** marked conceptually as _Classic Rain_ with an inline V2 migration
  TODO in `RainSection.tsx` and `RainLayer.tsx`.
- **Profiles:** audited — particles (incl. drift + depth flow) and rain are
  fully captured; Stage FX exclusion documented above as deliberate.
