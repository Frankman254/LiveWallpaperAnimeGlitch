export type BgView = 'pool' | 'active' | 'audio' | 'global';

const MODERN_BG_VIEW_STORAGE_KEY = 'lwag-modern-bg-view';

function isBgView(value: unknown): value is BgView {
	return (
		value === 'pool' ||
		value === 'active' ||
		value === 'audio' ||
		value === 'global'
	);
}

export function readPersistedBgView(canShowAudio: boolean): BgView {
	if (typeof window === 'undefined') return 'pool';
	try {
		const value = window.localStorage.getItem(MODERN_BG_VIEW_STORAGE_KEY);
		if (!isBgView(value)) return 'pool';
		if (value === 'audio' && !canShowAudio) return 'pool';
		return value;
	} catch {
		return 'pool';
	}
}

export function writePersistedBgView(value: BgView) {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(MODERN_BG_VIEW_STORAGE_KEY, value);
	} catch {
		/* localStorage unavailable - view restore is optional */
	}
}
