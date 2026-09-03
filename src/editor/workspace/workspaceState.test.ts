import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	WORKSPACE_PERSIST_VERSION,
	createEmptyWorkspaceState,
	panelKey,
	parseWorkspaceState,
	getSubTab,
	setSubTab,
	subscribeWorkspaceState,
	updateWorkspaceState,
	readWorkspaceState,
	resetWorkspaceStateCache
} from './workspaceState';
import { WORKSPACE_ONLY_KEYS } from '@/lib/workspaceKeys';
import { FACTORY_DEFAULT_STATE } from '@/lib/factoryDefaults';

/**
 * The workspace holds where the user was working, not what they made. Its only
 * hard requirement is that a bad payload can never break the editor on boot —
 * it must always degrade to "fresh editor", never throw and never return a
 * half-formed object that callers then read blindly.
 */

describe('parseWorkspaceState — hostile input', () => {
	it.each([
		['null', null],
		['undefined', undefined],
		['a string', 'nope'],
		['a number', 42],
		['an array', [1, 2, 3]],
		['an empty object', {}]
	])('falls back to a fresh workspace for %s', (_label, input) => {
		expect(parseWorkspaceState(input)).toEqual(createEmptyWorkspaceState());
	});

	it('discards a payload written by a different version', () => {
		const stored = {
			version: WORKSPACE_PERSIST_VERSION + 1,
			navigation: { mainTab: 'spectrum', subTabs: { advanced: 'logo' } },
			panels: { 'spectrum/style': { scrollTop: 684 } }
		};
		// No migration by design: a lost scroll position costs one scroll, a
		// migration bug costs real work.
		expect(parseWorkspaceState(stored)).toEqual(
			createEmptyWorkspaceState()
		);
	});

	it('keeps the good parts of a partially corrupt payload', () => {
		const parsed = parseWorkspaceState({
			version: WORKSPACE_PERSIST_VERSION,
			navigation: {
				mainTab: 'spectrum',
				subTabs: { advanced: 'logo', broken: 42 }
			},
			panels: {
				'spectrum/style': {
					scrollTop: 684,
					openSections: ['radial', 7]
				},
				'scenes/library': { scrollTop: 'NaN' },
				busted: 'not an object'
			}
		});

		expect(parsed.navigation.mainTab).toBe('spectrum');
		expect(parsed.navigation.subTabs).toEqual({ advanced: 'logo' });
		expect(parsed.panels['spectrum/style']?.scrollTop).toBe(684);
		expect(parsed.panels['spectrum/style']?.openSections).toEqual([
			'radial'
		]);
		// Present but empty rather than carrying a bogus scroll value.
		expect(parsed.panels['scenes/library']).toEqual({});
		expect(parsed.panels.busted).toBeUndefined();
	});

	it('rejects negative and non-finite scroll offsets', () => {
		const parsed = parseWorkspaceState({
			version: WORKSPACE_PERSIST_VERSION,
			navigation: { subTabs: {} },
			panels: {
				a: { scrollTop: -50 },
				b: { scrollTop: Number.POSITIVE_INFINITY },
				c: { scrollTop: 0 }
			}
		});

		expect(parsed.panels.a?.scrollTop).toBeUndefined();
		expect(parsed.panels.b?.scrollTop).toBeUndefined();
		expect(parsed.panels.c?.scrollTop).toBe(0);
	});

	it('drops a non-string main tab instead of restoring it', () => {
		const parsed = parseWorkspaceState({
			version: WORKSPACE_PERSIST_VERSION,
			navigation: { mainTab: 7, subTabs: {} },
			panels: {}
		});
		expect(parsed.navigation.mainTab).toBeUndefined();
	});

	it('round-trips a healthy payload unchanged', () => {
		const stored = {
			version: WORKSPACE_PERSIST_VERSION,
			navigation: {
				mainTab: 'spectrum',
				subTabs: { advanced: 'logo', layers: 'overlays' }
			},
			panels: {
				'spectrum/style': {
					scrollTop: 684,
					scrollLeft: 0,
					openSections: ['radial', 'shape']
				}
			}
		};
		expect(parseWorkspaceState(stored)).toEqual(stored);
	});
});

describe('panelKey', () => {
	it('builds a route from stable ids, never positions', () => {
		expect(panelKey('spectrum', 'style')).toBe('spectrum/style');
		expect(panelKey('advanced', 'logo', 'placement')).toBe(
			'advanced/logo/placement'
		);
	});

	it('skips missing segments so a partial route stays addressable', () => {
		expect(panelKey('spectrum', undefined)).toBe('spectrum');
		expect(panelKey('spectrum', null, 'style')).toBe('spectrum/style');
	});
});

describe('workspace / project boundary', () => {
	/**
	 * The two must never converge. A key that belongs to the wallpaper does not
	 * belong here, and editor chrome must not reach the project store's
	 * exported shape.
	 */
	it('lists only keys that exist on the wallpaper state', () => {
		const factory = FACTORY_DEFAULT_STATE as unknown as Record<
			string,
			unknown
		>;
		for (const key of WORKSPACE_ONLY_KEYS as readonly string[]) {
			expect(key in factory, `${key} is not a wallpaper state key`).toBe(
				true
			);
		}
	});

	it('claims no key that renders into the wallpaper', () => {
		// A crude but effective guard: anything the renderer reads is prefixed
		// with its subsystem. If one of these ever lands in the workspace list,
		// exporting a project would stop carrying part of the look.
		const RENDERED_PREFIXES = [
			'spectrum',
			'logo',
			'particle',
			'rain',
			'image',
			'background',
			'overlay',
			'audioLyrics',
			'audioTrackTitle',
			'stageLights',
			'flashLight',
			'cameraFx'
		];
		for (const key of WORKSPACE_ONLY_KEYS as readonly string[]) {
			// `activeSpectrumTarget` is the one exception: it selects which
			// spectrum the EDITOR is pointing at and changes nothing on canvas.
			if (key === 'activeSpectrumTarget') continue;
			for (const prefix of RENDERED_PREFIXES) {
				expect(
					key.startsWith(prefix),
					`${key} looks like rendered state but is marked workspace-only`
				).toBe(false);
			}
		}
	});

	it('does not overlap with the workspace navigation store', () => {
		// Navigation lives in its own storage entry; nothing about it may be
		// expressed as a wallpaper state key.
		const workspace = createEmptyWorkspaceState();
		const factory = FACTORY_DEFAULT_STATE as unknown as Record<
			string,
			unknown
		>;
		for (const key of Object.keys(workspace)) {
			expect(key in factory, `${key} duplicates a project key`).toBe(
				false
			);
		}
	});
});

describe('section open state — scoping and safety', () => {
	/**
	 * Sections are addressed by `panel/sectionId`. Two panels may legitimately
	 * hold sections with the same name, and they must not share a bucket.
	 */
	const withSections = (route: string, sections: string[]) => ({
		version: WORKSPACE_PERSIST_VERSION,
		navigation: { subTabs: {} },
		panels: { [route]: { openSections: sections } }
	});

	it('keeps same-named sections in different panels apart', () => {
		const parsed = parseWorkspaceState({
			version: WORKSPACE_PERSIST_VERSION,
			navigation: { subTabs: {} },
			panels: {
				'spectrum/style': { openSections: ['Colors'] },
				'logo/style': { openSections: [] }
			}
		});

		expect(parsed.panels['spectrum/style']?.openSections).toEqual([
			'Colors'
		]);
		expect(parsed.panels['logo/style']?.openSections).toEqual([]);
	});

	it('distinguishes "never recorded" from "recorded as closed"', () => {
		// The difference decides whether a panel's `defaultOpen` still applies:
		// no record → the panel decides; an empty list → the user closed it.
		const untouched = parseWorkspaceState({
			version: WORKSPACE_PERSIST_VERSION,
			navigation: { subTabs: {} },
			panels: { 'spectrum/style': { scrollTop: 10 } }
		});
		expect(
			untouched.panels['spectrum/style']?.openSections
		).toBeUndefined();

		const closed = parseWorkspaceState(withSections('spectrum/style', []));
		expect(closed.panels['spectrum/style']?.openSections).toEqual([]);
	});

	it('survives a panel route that no longer exists', () => {
		// Renaming a tab leaves orphan routes behind; they must be inert, not
		// throw and not resurface under a different panel.
		const parsed = parseWorkspaceState(
			withSections('tab-that-was-removed/style', ['Colors'])
		);
		expect(parsed.panels['tab-that-was-removed/style']).toBeDefined();
		expect(parsed.panels['spectrum/style']).toBeUndefined();
	});
});

describe('sub-tab routing — what unlocks per-sub-view scroll', () => {
	beforeEach(() => resetWorkspaceStateCache());

	it('records a sub-view per tab, keyed by id', () => {
		setSubTab('spectrum', 'style');
		setSubTab('motion', 'rain');

		expect(getSubTab('spectrum')).toBe('style');
		expect(getSubTab('motion')).toBe('rain');
		expect(getSubTab('scene')).toBeUndefined();
	});

	it('builds a route that separates sub-views of the same tab', () => {
		// The bug this closes: every sub-view of a tab shared one scroll
		// bucket, so switching sub-view restored a stranger's offset.
		expect(panelKey('spectrum', 'style')).toBe('spectrum/style');
		expect(panelKey('spectrum', 'audio')).toBe('spectrum/audio');
		expect(panelKey('spectrum', undefined)).toBe('spectrum');
	});

	it('notifies subscribers so the shell can follow the active route', () => {
		const listener = vi.fn();
		const unsubscribe = subscribeWorkspaceState(listener);

		setSubTab('spectrum', 'style');
		expect(listener).toHaveBeenCalled();

		unsubscribe();
		listener.mockClear();
		setSubTab('spectrum', 'audio');
		expect(listener).not.toHaveBeenCalled();
	});

	it('keeps sub-views and section state in the same entry without collision', () => {
		setSubTab('spectrum', 'style');
		updateWorkspaceState(current => ({
			...current,
			panels: {
				...current.panels,
				'spectrum/style': { scrollTop: 684, openSections: ['radial'] }
			}
		}));

		const state = readWorkspaceState();
		expect(state.navigation.subTabs.spectrum).toBe('style');
		expect(state.panels['spectrum/style']?.scrollTop).toBe(684);
	});
});
