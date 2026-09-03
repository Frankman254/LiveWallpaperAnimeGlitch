import type { Translations } from '@/lib/i18n';
import type { ConfirmDialogOptions } from './DialogProvider';

export type ConfirmFn = (options: ConfirmDialogOptions) => Promise<boolean>;

function withReplacements(
	template: string,
	replacements: Record<string, string>
): string {
	let text = template;
	for (const [key, value] of Object.entries(replacements)) {
		text = text.split(`{${key}}`).join(value);
	}
	return text;
}

async function ask(
	confirm: ConfirmFn,
	options: ConfirmDialogOptions
): Promise<boolean> {
	return confirm(options);
}

export async function confirmResetTab(
	confirm: ConfirmFn,
	t: Translations,
	sectionLabel: string
): Promise<boolean> {
	return ask(confirm, {
		title: t.confirm_reset_tab_title,
		message: withReplacements(t.confirm_reset_tab_message, {
			section: sectionLabel
		}),
		confirmLabel: t.label_confirm_reset,
		cancelLabel: t.label_cancel,
		tone: 'warning'
	});
}

export async function confirmResetLayerStack(
	confirm: ConfirmFn,
	t: Translations
): Promise<boolean> {
	return ask(confirm, {
		title: t.confirm_reset_layers_stack_title,
		message: t.hint_restore_default_stack,
		confirmLabel: t.label_restore_default_stack,
		cancelLabel: t.label_cancel,
		tone: 'warning'
	});
}

export async function confirmResetOverlayLayout(
	confirm: ConfirmFn,
	t: Translations,
	overlayName: string
): Promise<boolean> {
	return ask(confirm, {
		title: t.confirm_reset_overlay_title,
		message: withReplacements(t.confirm_reset_overlay_message, {
			name: overlayName
		}),
		confirmLabel: t.label_confirm_reset,
		cancelLabel: t.label_cancel,
		tone: 'warning'
	});
}

export async function confirmResetSpectrumDefaults(
	confirm: ConfirmFn,
	t: Translations
): Promise<boolean> {
	return ask(confirm, {
		title: t.confirm_reset_spectrum_defaults_title,
		message: t.confirm_reset_spectrum_defaults_message,
		confirmLabel: t.label_reset_spectrum_defaults,
		cancelLabel: t.label_cancel,
		tone: 'warning'
	});
}

export async function confirmResetFiltersDefaults(
	confirm: ConfirmFn,
	t: Translations
): Promise<boolean> {
	return ask(confirm, {
		title: t.confirm_reset_filters_defaults_title,
		message: t.confirm_reset_filters_defaults_message,
		confirmLabel: t.label_reset_filters_only,
		cancelLabel: t.label_cancel,
		tone: 'warning'
	});
}

export async function confirmResetAllSettings(
	confirm: ConfirmFn,
	t: Translations
): Promise<boolean> {
	return ask(confirm, {
		title: t.confirm_reset_all_title,
		message: t.confirm_reset_all_message,
		confirmLabel: t.reset_all,
		cancelLabel: t.label_cancel,
		tone: 'danger'
	});
}

export async function confirmClearStorage(
	confirm: ConfirmFn,
	t: Translations
): Promise<boolean> {
	return ask(confirm, {
		title: t.confirm_clear_storage_title,
		message: t.confirm_clear_storage_message,
		confirmLabel: t.clear_storage,
		cancelLabel: t.label_cancel,
		tone: 'danger'
	});
}

export async function confirmResetSlideshowTimestamps(
	confirm: ConfirmFn,
	t: Translations
): Promise<boolean> {
	return ask(confirm, {
		title: t.confirm_reset_slideshow_timestamps_title,
		message: t.confirm_reset_slideshow_timestamps_message,
		confirmLabel: t.label_confirm_reset,
		cancelLabel: t.label_cancel,
		tone: 'warning'
	});
}

export async function confirmResetCalibrationOriginal(
	confirm: ConfirmFn,
	t: Translations
): Promise<boolean> {
	return ask(confirm, {
		title: t.confirm_reset_calibration_original_title,
		message: t.confirm_reset_calibration_original_message,
		confirmLabel: t.label_confirm_reset,
		cancelLabel: t.label_cancel,
		tone: 'warning'
	});
}

export async function confirmResetCalibrationOverrides(
	confirm: ConfirmFn,
	t: Translations
): Promise<boolean> {
	return ask(confirm, {
		title: t.confirm_reset_calibration_overrides_title,
		message: t.confirm_reset_calibration_overrides_message,
		confirmLabel: t.label_confirm_reset,
		cancelLabel: t.label_cancel,
		tone: 'warning'
	});
}

export function resolveEditorOverlayResetLabel(
	tabId: string,
	t: Translations
): string {
	const labels: Record<string, string> = {
		scene: t.tab_scene,
		layers: t.tab_layers,
		presets: t.tab_presets,
		overlays: t.tab_overlays,
		spectrum: t.tab_spectrum,
		filters: t.tab_looks,
		motion: t.tab_motion,
		particles: t.tab_particles,
		rain: t.tab_rain,
		logo: t.tab_logo,
		track: t.tab_track,
		lyrics: t.tab_lyrics,
		audio: t.tab_audio,
		editor: t.tab_editor,
		diagnostics: t.tab_diagnostics,
		export: t.tab_export,
		perf: t.tab_perf
	};
	return labels[tabId] ?? tabId;
}

export function resolveResetSectionLabel(
	tab: string,
	advancedSub: string | undefined,
	t: Translations
): string {
	if (tab === 'scene') return t.tab_scene;
	if (tab === 'layers') return t.tab_layers;
	if (tab === 'looks') return t.tab_looks;
	if (tab === 'spectrum') return t.tab_spectrum;
	if (tab === 'motion') return t.tab_motion;
	if (tab === 'audio') return t.tab_audio;
	if (tab === 'advanced' && advancedSub) {
		const advancedLabels: Record<string, string> = {
			track: t.tab_track,
			lyrics: t.tab_lyrics,
			logo: t.tab_logo,
			calibration: 'Calibration',
			diagnostics: t.tab_diagnostics,
			editor: t.tab_editor,
			export: t.tab_export,
			perf: t.tab_perf
		};
		return advancedLabels[advancedSub] ?? t.tab_advanced;
	}
	return t.tab_advanced;
}
