import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import {
	resetManualSections,
	setSectionTarget
} from '@/features/spectrum/manual/spectrumManualRuntime';

/**
 * Wire window keyboard events to the spectrum manual section runtime.
 *
 * Mounted once at the WallpaperViewport level so the listener exists
 * regardless of which tab is open in the editor. Listener only attaches
 * when `spectrumDriveMode !== 'audio'` — in audio-only mode the keys do
 * nothing and the user keeps the full keyboard for editor shortcuts.
 *
 * Guards:
 *  - Ignores presses while focus is on an editable element so text fields,
 *    color hex inputs, and slot rename inputs aren't hijacked.
 *  - Ignores presses with modifier keys (Ctrl/Cmd/Alt) so Ctrl+1 etc. stay
 *    available for browser / OS shortcuts.
 *  - On unmount or mode flip back to 'audio', `resetManualSections()`
 *    clears any in-flight presses to avoid frozen-on bars.
 */
function isEditableTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	if (target.isContentEditable) return true;
	const tag = target.tagName.toLowerCase();
	return tag === 'input' || tag === 'textarea' || tag === 'select';
}

function normalizeKey(key: string): string {
	// `event.key` is case-sensitive for letters (Shift differentiates).
	// We store/compare in lowercase so binding `'a'` matches both `'a'` and
	// `'A'` without forcing the user to predict Shift state.
	return key.length === 1 ? key.toLowerCase() : key;
}

export function useSpectrumManualKeyboard(): void {
	const { driveMode, sections, bindings } = useWallpaperStore(
		useShallow(state => ({
			driveMode: state.spectrumDriveMode,
			sections: state.spectrumManualSections,
			bindings: state.spectrumManualBindings
		}))
	);

	useEffect(() => {
		if (driveMode === 'audio') {
			// Listener disabled; ensure any leftover targets are cleared.
			resetManualSections();
			return;
		}

		const safeSections = Math.max(
			0,
			Math.min(bindings.length, Math.round(sections))
		);
		const lookup = new Map<string, number>();
		for (let i = 0; i < safeSections; i++) {
			const key = bindings[i];
			if (typeof key === 'string' && key.length > 0) {
				lookup.set(normalizeKey(key), i);
			}
		}

		const handleDown = (event: KeyboardEvent) => {
			if (event.repeat) return;
			if (event.ctrlKey || event.metaKey || event.altKey) return;
			if (isEditableTarget(event.target)) return;
			const index = lookup.get(normalizeKey(event.key));
			if (index === undefined) return;
			event.preventDefault();
			setSectionTarget(index, 1);
		};

		const handleUp = (event: KeyboardEvent) => {
			if (isEditableTarget(event.target)) return;
			const index = lookup.get(normalizeKey(event.key));
			if (index === undefined) return;
			setSectionTarget(index, 0);
		};

		// `blur` on the window means the user tabbed away — release all keys
		// or they'd stick at full level until refocus.
		const handleBlur = () => resetManualSections();

		window.addEventListener('keydown', handleDown);
		window.addEventListener('keyup', handleUp);
		window.addEventListener('blur', handleBlur);
		return () => {
			window.removeEventListener('keydown', handleDown);
			window.removeEventListener('keyup', handleUp);
			window.removeEventListener('blur', handleBlur);
			resetManualSections();
		};
	}, [driveMode, sections, bindings]);
}
