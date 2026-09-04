/**
 * Stage FX domain — React surface: stage lights, flash light, camera motion and
 * screen shake, plus the canvases that draw them.
 *
 * There is deliberately no `index.ts` beside this. The domain's model half is
 * `stageFxConfig.ts`, and it is imported from ~80 inline `import('...')` type
 * positions in `types/wallpaper.ts` and `store/wallpaperStoreTypes.ts`. Routing
 * those through a facade would be pure churn — they are type-only and erased at
 * build — and having two ways to import the same vocabulary is worse than one
 * clear deep path. So `stageFxConfig` stays deep-imported by design.
 *
 * Worth knowing: that module also owns `SpectrumRotationDrive`,
 * `SpectrumRotationChannel` and `RotationDirection`, which are spectrum
 * vocabulary living in the stage-FX config. See ARCHITECTURE.md §7.
 */
export { default as CameraFxStage } from './CameraFxStage';
export { default as FlashLightCanvas } from './FlashLightCanvas';
export { default as StageLightsCanvas } from './StageLightsCanvas';

export { StageLightsSection } from './controls/StageLightsSection';
export { LightsProfilesSection } from './controls/LightsProfilesSection';
export { FlashLightSection } from './controls/FlashLightSection';
export { CameraMotionSection } from './controls/CameraFxSection';
export { CameraFxProfilesSection } from './controls/CameraFxProfilesSection';
export { ScreenShakeSection } from './controls/ScreenShakeSection';
