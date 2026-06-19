import { create } from 'zustand';

export type RuntimeUiMode = 'edit' | 'presentation' | 'recording';

const SESSION_KEY = 'lwag-runtime-ui-mode';

function readSessionMode(): RuntimeUiMode | null {
	if (typeof sessionStorage === 'undefined') return null;
	try {
		const value = sessionStorage.getItem(SESSION_KEY);
		if (
			value === 'edit' ||
			value === 'presentation' ||
			value === 'recording'
		) {
			return value;
		}
	} catch {
		// sessionStorage may be blocked in embedded contexts
	}
	return null;
}

function writeSessionMode(mode: RuntimeUiMode): void {
	if (typeof sessionStorage === 'undefined') return;
	try {
		sessionStorage.setItem(SESSION_KEY, mode);
	} catch {
		// ignore
	}
}

export function isOutputMode(mode: RuntimeUiMode): boolean {
	return mode === 'presentation' || mode === 'recording';
}

type RuntimeUiModeStore = {
	mode: RuntimeUiMode;
	enterEditMode: () => void;
	enterPresentationMode: () => void;
	enterRecordingMode: () => void;
	exitOutputMode: () => void;
	setMode: (mode: RuntimeUiMode) => void;
	hydrateFromSession: () => void;
};

export const useRuntimeUiModeStore = create<RuntimeUiModeStore>(set => ({
	mode: readSessionMode() ?? 'edit',
	enterEditMode: () => {
		writeSessionMode('edit');
		set({ mode: 'edit' });
	},
	enterPresentationMode: () => {
		writeSessionMode('presentation');
		set({ mode: 'presentation' });
	},
	enterRecordingMode: () => {
		writeSessionMode('recording');
		set({ mode: 'recording' });
	},
	exitOutputMode: () => {
		writeSessionMode('edit');
		set({ mode: 'edit' });
	},
	setMode: mode => {
		writeSessionMode(mode);
		set({ mode });
	},
	hydrateFromSession: () => {
		const stored = readSessionMode();
		if (stored) set({ mode: stored });
	}
}));

/** Test hook — clears session mode. */
export function resetRuntimeUiModeForTests(): void {
	if (typeof sessionStorage !== 'undefined') {
		try {
			sessionStorage.removeItem(SESSION_KEY);
		} catch {
			// ignore
		}
	}
	useRuntimeUiModeStore.setState({ mode: 'edit' });
}
