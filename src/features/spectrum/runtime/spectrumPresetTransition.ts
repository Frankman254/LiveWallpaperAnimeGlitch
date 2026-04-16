let activeTransitionToken = 0;

/**
 * Stops any in-flight spectrum transition token so external state updates
 * (scene changes, slideshow overrides, slot loads) never leave stale work around.
 */
export function invalidateSpectrumPresetMorph(): void {
	activeTransitionToken += 1;
}

export function getSpectrumTransitionToken(): number {
	return activeTransitionToken;
}
