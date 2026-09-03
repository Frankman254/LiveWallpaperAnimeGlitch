/**
 * Logo domain — public surface.
 *
 * Everything outside `features/logo/` imports from here, never from a file
 * inside. That keeps the internal layout free to change: move a renderer,
 * split a module, rename a helper — as long as this facade still exports the
 * same names, nothing else in the repo needs to know.
 *
 * See docs/architecture/ARCHITECTURE.md §3 (Ownership).
 *
 * Layout:
 *   domain/       position grid math — pure, no React, no store
 *   runtime/      per-frame canvas 2D renderer + its module state
 *   presets/      quick profiles
 *   diagnostics/  telemetry bus + the HUD that reads it
 *   controls/     the logo's own editor UI
 *
 * Still outside: `components/controls/tabs/main/LogoTab.tsx`. It depends on
 * shared editor chrome (UIMode, DialogProvider, advancedControls) that lives in
 * `components/` and is used by ~20 tabs. Moving the tab before that chrome is
 * extracted would make `features/` import `components/`, which the contract
 * forbids. Extract the chrome first, then the tab lands in `controls/`.
 */

// ── domain ──────────────────────────────────────────────────────────────────
export {
	LOGO_GRID_SHORT_DIVISIONS,
	LOGO_POSITION_NUDGE_STEP,
	LOGO_POSITION_CENTER,
	nudgeLogoAxis,
	nudgeLogoPosition,
	resolveLogoGridDims,
	cellToLogoPosition,
	logoPositionToCell
} from './domain/logoPositionGrid';
export type {
	LogoGridDims,
	LogoGridCell,
	LogoNudgeDirection
} from './domain/logoPositionGrid';

// ── runtime ─────────────────────────────────────────────────────────────────
export {
	drawLogo,
	getSmoothedAmplitude,
	getCachedLogoImage,
	getLogoRotation,
	getLogoRenderState,
	resetLogo,
	resetLogoRotation
} from './runtime/ReactiveLogo';

// ── presets ─────────────────────────────────────────────────────────────────
export { LOGO_QUICK_PROFILES } from './presets/logoProfiles';
export type { LogoQuickProfile } from './presets/logoProfiles';

// ── diagnostics ─────────────────────────────────────────────────────────────
export {
	publishLogoDiagnosticsTelemetry,
	resetLogoDiagnosticsTelemetry,
	subscribeLogoDiagnosticsTelemetry,
	getLogoDiagnosticsSnapshot
} from './diagnostics/logoDiagnosticsTelemetry';
export type { LogoDiagnosticsSnapshot } from './diagnostics/logoDiagnosticsTelemetry';
export { default as LogoDiagnosticsHud } from './diagnostics/LogoDiagnosticsHud';

// ── controls ────────────────────────────────────────────────────────────────
export { default as QuickActionsLogoPositionGrid } from './controls/QuickActionsLogoPositionGrid';
