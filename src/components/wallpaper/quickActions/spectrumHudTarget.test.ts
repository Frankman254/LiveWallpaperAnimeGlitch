import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const mem = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
	getItem: (k: string) => mem.get(k) ?? null,
	setItem: (k: string, v: string) => void mem.set(k, v),
	removeItem: (k: string) => void mem.delete(k),
	clear: () => void mem.clear()
};

const { useWallpaperStore } = await import('@/store/wallpaperStore');
const { partializeWallpaperStore } =
	await import('@/store/wallpaperStorePersistence');
const { buildSpectrumActions } =
	await import('@/components/wallpaper/quickActions/quickActionConfigs');
const { createDefaultSpectrumInstance } =
	await import('@/features/spectrum/spectrumInstanceModel');
const { en } = await import('@/lib/i18n/en');
const { es } = await import('@/lib/i18n/es');

const here = dirname(fileURLToPath(import.meta.url));

function baseOptions() {
	return {
		t: en as never,
		activeTarget: 'main' as const,
		setActiveTarget: vi.fn(),
		hasSecondSpectrum: true,
		targetVisible: true,
		toggleTargetVisible: vi.fn(),
		targetMirror: false,
		targetPeakHold: false,
		targetFollowLogo: false,
		targetRadialFitLogo: false,
		targetPixelate: false,
		updateTarget: vi.fn()
	};
}

describe('shared active spectrum target (editor + HUD)', () => {
	beforeEach(() => {
		mem.clear();
		useWallpaperStore.setState({
			activeSpectrumTarget: 'main',
			spectrumInstances: [createDefaultSpectrumInstance()]
		});
	});

	it('setActiveSpectrumTarget updates the shared field and persists a UI pref', () => {
		useWallpaperStore.getState().setActiveSpectrumTarget('instance');
		expect(useWallpaperStore.getState().activeSpectrumTarget).toBe(
			'instance'
		);
		expect(mem.get('lwag-spectrum-target')).toBe('instance');
	});

	it('excludes activeSpectrumTarget from project persistence', () => {
		const persisted = partializeWallpaperStore(
			useWallpaperStore.getState()
		);
		expect('activeSpectrumTarget' in persisted).toBe(false);
		expect('setActiveSpectrumTarget' in persisted).toBe(false);
	});

	it('editor and HUD read one shared target source', () => {
		// Both surfaces read useWallpaperStore().activeSpectrumTarget — there is
		// no second source, so a change on either is the same change.
		useWallpaperStore.getState().setActiveSpectrumTarget('instance');
		expect(useWallpaperStore.getState().activeSpectrumTarget).toBe(
			'instance'
		);
		useWallpaperStore.getState().setActiveSpectrumTarget('main');
		expect(useWallpaperStore.getState().activeSpectrumTarget).toBe('main');
	});

	it('HUD profile load applies to the active target only', () => {
		// Save a punchy MAIN look, then load it into the instance via the active
		// target (the HUD path passes activeSpectrumTarget).
		useWallpaperStore
			.getState()
			.patchSpectrumMain({ spectrumPixelate: true });
		useWallpaperStore.getState().saveSpectrumProfileSlot(0, 'main');
		useWallpaperStore
			.getState()
			.patchSpectrumMain({ spectrumPixelate: false });

		useWallpaperStore.getState().setActiveSpectrumTarget('instance');
		useWallpaperStore
			.getState()
			.loadSpectrumProfileSlot(
				0,
				useWallpaperStore.getState().activeSpectrumTarget
			);

		const state = useWallpaperStore.getState();
		expect(state.spectrumPixelate).toBe(false);
		expect(state.spectrumInstances[0]?.spectrumPixelate).toBe(true);
	});
});

describe('HUD spectrum bank is target-bound (one bank, no clone)', () => {
	it('S1/S2 buttons switch the active target', () => {
		const setActiveTarget = vi.fn();
		const actions = buildSpectrumActions({
			...baseOptions(),
			setActiveTarget
		});
		actions.find(a => a.label === en.qa_spec_s2)?.onClick?.();
		expect(setActiveTarget).toHaveBeenCalledWith('instance');
	});

	it('pixelate toggle writes only through updateTarget', () => {
		const updateTarget = vi.fn();
		const actions = buildSpectrumActions({
			...baseOptions(),
			targetPixelate: false,
			updateTarget
		});
		actions.find(a => a.label === en.qa_pixelate)?.onClick?.();
		expect(updateTarget).toHaveBeenCalledWith({ spectrumPixelate: true });
	});

	it('mirror toggle writes only through updateTarget', () => {
		const updateTarget = vi.fn();
		const actions = buildSpectrumActions({
			...baseOptions(),
			targetMirror: true,
			updateTarget
		});
		actions.find(a => a.label === en.qa_mirror)?.onClick?.();
		expect(updateTarget).toHaveBeenCalledWith({ spectrumMirror: false });
	});

	it('exposes exactly one S1 and one S2 tab — never duplicate banks', () => {
		const actions = buildSpectrumActions(baseOptions());
		expect(actions.filter(a => a.label === en.qa_spec_s1)).toHaveLength(1);
		expect(actions.filter(a => a.label === en.qa_spec_s2)).toHaveLength(1);
	});

	it('no HUD spectrum label/title mentions clone', () => {
		const actions = buildSpectrumActions(baseOptions());
		for (const a of actions) {
			expect(String(a.label).toLowerCase()).not.toContain('clon');
			expect(String(a.title).toLowerCase()).not.toContain('clon');
		}
	});
});

describe('live spectrum/HUD labels contain no "clone" wording', () => {
	// Scan the components that render Spectrum/HUD copy; resolve every t.<key>
	// they use and assert its EN + ES value has no clone wording. Dead i18n keys
	// are not referenced here, so they cannot leak into the UI.
	const liveFiles = [
		'../../controls/tabs/main/SpectrumTab.tsx',
		'./quickActionConfigs.tsx',
		'../SpectrumDiagnosticsHud.tsx',
		'../../controls/tabs/main/DiagnosticsAudioPreviews.tsx'
	];

	it('resolved live label values are clone-free', () => {
		const offenders: string[] = [];
		for (const rel of liveFiles) {
			const source = readFileSync(resolve(here, rel), 'utf8');
			for (const match of source.matchAll(/\bt\.([A-Za-z0-9_]+)/g)) {
				const key = match[1] as keyof typeof en;
				for (const [lang, dict] of [
					['en', en],
					['es', es]
				] as const) {
					const value = dict[key];
					if (
						typeof value === 'string' &&
						/clone|clon\b/i.test(value)
					) {
						offenders.push(`${lang}.${key} = "${value}" (${rel})`);
					}
				}
			}
		}
		expect(offenders, offenders.join('\n')).toEqual([]);
	});
});
