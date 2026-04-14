import type { SpectrumPreset } from '@/features/spectrum/presets/spectrumPresets';
import type { SpectrumProfileSettings, WallpaperState } from '@/types/wallpaper';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';
import { extractSpectrumProfileSettings } from '@/lib/featureProfiles';
import { pushRecentUnique } from '@/features/discovery/recentIds';
import { DISCOVERY_RECENT_MAX } from '@/features/discovery/constants';

type SpectrumNumericKey = {
	[K in keyof SpectrumProfileSettings]: SpectrumProfileSettings[K] extends number
		? K
		: never;
}[keyof SpectrumProfileSettings];

const MORPH_NUMERIC_KEYS: SpectrumNumericKey[] = [
	'spectrumBarCount',
	'spectrumBarWidth',
	'spectrumMinHeight',
	'spectrumMaxHeight',
	'spectrumSmoothing',
	'spectrumOpacity',
	'spectrumGlowIntensity',
	'spectrumShadowBlur',
	'spectrumRotationSpeed',
	'spectrumWaveFillOpacity',
	'spectrumSpan',
	'spectrumInnerRadius',
	'spectrumRadialAngle',
	'spectrumLogoGap',
	'spectrumPositionX',
	'spectrumPositionY',
	'spectrumAfterglow',
	'spectrumMotionTrails',
	'spectrumGhostFrames',
	'spectrumPeakRibbons',
	'spectrumBassShockwave',
	'spectrumEnergyBloom',
	'spectrumOscilloscopeLineWidth',
	'spectrumTunnelRingCount',
	'spectrumSpectrogramDecay',
	'spectrumCloneOpacity',
	'spectrumCloneScale',
	'spectrumCloneGap',
	'spectrumCloneRadialAngle',
	'spectrumCloneBarCount',
	'spectrumCloneBarWidth',
	'spectrumCloneMinHeight',
	'spectrumCloneMaxHeight',
	'spectrumCloneSmoothing',
	'spectrumCloneGlowIntensity',
	'spectrumCloneShadowBlur',
	'spectrumCloneAudioSmoothing',
	'spectrumCloneRotationSpeed',
	'spectrumClonePeakDecay',
	'spectrumCloneWaveFillOpacity'
];

const MORPH_COLOR_KEYS: Array<
	| 'spectrumPrimaryColor'
	| 'spectrumSecondaryColor'
	| 'spectrumClonePrimaryColor'
	| 'spectrumCloneSecondaryColor'
> = [
	'spectrumPrimaryColor',
	'spectrumSecondaryColor',
	'spectrumClonePrimaryColor',
	'spectrumCloneSecondaryColor'
];

let activeTransitionToken = 0;

/**
 * Stops any in-flight preset morph RAF ticks so external state updates
 * (e.g. scene / slideshow) do not leave the store half-interpolated.
 */
export function invalidateSpectrumPresetMorph(): void {
	activeTransitionToken += 1;
}

function clamp01(value: number): number {
	return Math.min(1, Math.max(0, value));
}

function easeInOut(value: number): number {
	return value * value * (3 - 2 * value);
}

function parseHex(color: string): [number, number, number] | null {
	const normalized = color.trim();
	const full = normalized.startsWith('#') ? normalized.slice(1) : normalized;
	if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
	return [
		parseInt(full.slice(0, 2), 16),
		parseInt(full.slice(2, 4), 16),
		parseInt(full.slice(4, 6), 16)
	];
}

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

function lerpColor(from: string, to: string, t: number): string {
	const fromRgb = parseHex(from);
	const toRgb = parseHex(to);
	if (!fromRgb || !toRgb) return t < 1 ? from : to;
	const r = Math.round(lerp(fromRgb[0], toRgb[0], t));
	const g = Math.round(lerp(fromRgb[1], toRgb[1], t));
	const b = Math.round(lerp(fromRgb[2], toRgb[2], t));
	return `#${r.toString(16).padStart(2, '0')}${g
		.toString(16)
		.padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getNow(): number {
	return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

type WallpaperSetState = (
	partial:
		| Partial<WallpaperState>
		| ((state: WallpaperStore) => Partial<WallpaperState>)
) => void;
type WallpaperGetState = () => WallpaperStore;

export function applySpectrumPresetWithTransition(
	set: WallpaperSetState,
	get: WallpaperGetState,
	preset: SpectrumPreset,
	durationMs = 460
): void {
	invalidateSpectrumPresetMorph();
	const token = activeTransitionToken;
	const start = getNow();
	const from = extractSpectrumProfileSettings(get());
	const to = preset.settings;
	const structuralPatch: Partial<SpectrumProfileSettings> = {};
	for (const key of Object.keys(to) as Array<keyof SpectrumProfileSettings>) {
		if (MORPH_NUMERIC_KEYS.includes(key as SpectrumNumericKey)) continue;
		if (
			key === 'spectrumPrimaryColor' ||
			key === 'spectrumSecondaryColor' ||
			key === 'spectrumClonePrimaryColor' ||
			key === 'spectrumCloneSecondaryColor'
		) {
			continue;
		}
		(structuralPatch as Record<string, unknown>)[key] = to[key];
	}

	set({
		...structuralPatch,
		activeSpectrumPresetId: preset.id,
		recentSpectrumPresetIds: pushRecentUnique(
			get().recentSpectrumPresetIds,
			preset.id,
			DISCOVERY_RECENT_MAX
		)
	});

	const tick = () => {
		if (token !== activeTransitionToken) return;
		const elapsed = getNow() - start;
		const t = clamp01(elapsed / Math.max(1, durationMs));
		const eased = easeInOut(t);
		const patch: Partial<SpectrumProfileSettings> = {};

		for (const key of MORPH_NUMERIC_KEYS) {
			const fromValue = from[key];
			const toValue = to[key];
			if (typeof fromValue !== 'number' || typeof toValue !== 'number') continue;
			const value = lerp(fromValue, toValue, eased);
			patch[key] =
				Number.isInteger(fromValue) && Number.isInteger(toValue)
					? Math.round(value)
					: value;
		}

		for (const key of MORPH_COLOR_KEYS) {
			patch[key] = lerpColor(from[key], to[key], eased);
		}

		set(patch);
		if (t < 1 && typeof requestAnimationFrame !== 'undefined') {
			requestAnimationFrame(tick);
		} else {
			set({
				...to,
				activeSpectrumPresetId: preset.id
			});
		}
	};

	if (typeof requestAnimationFrame === 'undefined') {
		set({
			...to,
			activeSpectrumPresetId: preset.id,
			recentSpectrumPresetIds: pushRecentUnique(
				get().recentSpectrumPresetIds,
				preset.id,
				DISCOVERY_RECENT_MAX
			)
		});
		return;
	}
	requestAnimationFrame(tick);
}
