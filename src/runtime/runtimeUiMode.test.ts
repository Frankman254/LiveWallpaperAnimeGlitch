import { describe, expect, it, beforeEach } from 'vitest';

const mem = new Map<string, string>();
(globalThis as Record<string, unknown>).sessionStorage = {
	getItem: (k: string) => mem.get(k) ?? null,
	setItem: (k: string, v: string) => void mem.set(k, v),
	removeItem: (k: string) => void mem.delete(k),
	clear: () => mem.clear()
};

import {
	isOutputMode,
	resetRuntimeUiModeForTests,
	useRuntimeUiModeStore
} from './runtimeUiModeStore';
import {
	resolveAppShellFromRoute,
	resolveOutputRoute,
	resolveRuntimeUiModeFromRoute
} from './resolveAppShell';

describe('runtimeUiModeStore', () => {
	beforeEach(() => {
		mem.clear();
		resetRuntimeUiModeForTests();
	});

	it('starts in edit mode by default', () => {
		expect(useRuntimeUiModeStore.getState().mode).toBe('edit');
	});

	it('transitions presentation → recording → edit', () => {
		const store = useRuntimeUiModeStore.getState();
		store.enterPresentationMode();
		expect(useRuntimeUiModeStore.getState().mode).toBe('presentation');
		expect(isOutputMode('presentation')).toBe(true);

		store.enterRecordingMode();
		expect(useRuntimeUiModeStore.getState().mode).toBe('recording');

		store.exitOutputMode();
		expect(useRuntimeUiModeStore.getState().mode).toBe('edit');
		expect(isOutputMode('edit')).toBe(false);
	});

	it('persists mode to sessionStorage without touching project data', () => {
		useRuntimeUiModeStore.getState().enterPresentationMode();
		expect(sessionStorage.getItem('lwag-runtime-ui-mode')).toBe(
			'presentation'
		);
		useRuntimeUiModeStore.setState({ mode: 'edit' });
		useRuntimeUiModeStore.getState().hydrateFromSession();
		expect(useRuntimeUiModeStore.getState().mode).toBe('presentation');
	});
});

describe('resolveAppShell', () => {
	it('maps routes to shell and mode', () => {
		expect(resolveAppShellFromRoute('/edit')).toBe('edit');
		expect(resolveAppShellFromRoute('/present')).toBe('output');
		expect(resolveAppShellFromRoute('/record')).toBe('output');
		expect(resolveRuntimeUiModeFromRoute('/present')).toBe('presentation');
		expect(resolveRuntimeUiModeFromRoute('/record')).toBe('recording');
		expect(resolveOutputRoute('presentation')).toBe('/present');
		expect(resolveOutputRoute('recording')).toBe('/record');
		expect(resolveOutputRoute('edit')).toBe('/edit');
	});
});

describe('output shell mounting contract', () => {
	it('output routes never resolve to edit shell', () => {
		for (const path of ['/present', '/record']) {
			expect(resolveAppShellFromRoute(path)).toBe('output');
			expect(resolveRuntimeUiModeFromRoute(path)).not.toBe('edit');
		}
	});
});
