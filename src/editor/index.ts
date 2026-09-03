/**
 * Editor chrome — shared, store-connected UI that belongs to no single domain.
 *
 * This zone exists because two things were being conflated:
 *
 *   `ui/`      the design system. Pure presentation, knows nothing about this
 *              product, safe to lift into any app.
 *   `editor/`  the editor's own furniture: the advanced/simple mode gate, the
 *              confirm-dialog service, the slider and toggle bound to factory
 *              defaults, the theme resolver. Product-specific and wired to the
 *              store — so it cannot live in `ui/` — but shared by every tab, so
 *              it cannot live in a `features/*` domain either.
 *
 * Everything here is imported as `@/editor`. It is the one zone `features/*`
 * may import upward, precisely so a domain can own its editor panel without
 * reaching into `components/`.
 *
 * See docs/architecture/ARCHITECTURE.md §2 and §3.
 */

// ── mode gate (simple vs advanced editor) ───────────────────────────────────
export { AdvancedOnly, SimpleOnly, useIsAdvanced, useIsSimple } from './UIMode';

// ── dialogs / destructive-action confirmation ───────────────────────────────
export { DialogProvider, useDialog } from './DialogProvider';
export type { ConfirmDialogOptions } from './DialogProvider';
export {
	confirmResetTab,
	confirmResetLayerStack,
	confirmResetOverlayLayout,
	confirmResetSpectrumDefaults,
	confirmResetFiltersDefaults,
	confirmResetAllSettings,
	confirmClearStorage,
	confirmResetSlideshowTimestamps,
	confirmResetCalibrationOriginal,
	confirmResetCalibrationOverrides,
	resolveEditorOverlayResetLabel
} from './confirmCritical';
export type { ConfirmFn } from './confirmCritical';

// ── bound controls ──────────────────────────────────────────────────────────
export { default as SliderControl } from './SliderControl';
export { default as ToggleControl } from './ToggleControl';
export { default as AdaptiveColorInput } from './AdaptiveColorInput';
export { default as AudioChannelSelector } from './AudioChannelSelector';
export { default as ColorSourceShortcuts } from './ColorSourceShortcuts';
export { getFactoryNumericDefaultForSetter } from './factoryControlDefaults';
export { resolveSharedColorSource } from './colorSourceUtils';

// ── layout ──────────────────────────────────────────────────────────────────
export { default as CollapsibleSection } from './CollapsibleSection';
export { default as LabeledSection } from './LabeledSection';
export { default as TabSection } from './TabSection';
export { default as ProfileSlotsEditor } from './ProfileSlotsEditor';
export type { ProfileSlotsEditorProps } from './ProfileSlotsEditor';
export { default as ConnectedColorInput } from './ConnectedColorInput';
export {
	SectionLabel,
	HintText,
	OptionButtonGroup,
	SwitchRow,
	ColorSourceField,
	ProfileSlotsGrid
} from './advancedControls';

// ── theming / tokens ────────────────────────────────────────────────────────
export {
	DEFAULT_EDITOR_COLOR_VARS,
	getEditorRadiusVars,
	getEditorThemeColorVars,
	getScopedEditorThemeColorVars,
	resolveUIColor,
	EDITOR_THEME_CLASSES
} from './editorTheme';
export type {
	EditorManualColors,
	EditorVisualOptions,
	EditorThemeClasses
} from './editorTheme';
export * from './designTokens';
