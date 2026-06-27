import { useEffect, useRef } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import {
	transitionSubsystemForLayerType,
	visualTransitionProgress
} from '@/features/visualTransition/visualTransitionCoordinator';
import type { VisualTransitionSubsystem } from '@/types/wallpaper';

export { transitionSubsystemForLayerType };

/**
 * FASE 0 of the smooth image transition: fades a layer wrapper from 0 → 1 while
 * a `visualTransition` that touches this subsystem is active, so the new look
 * settles in instead of snapping when the active image (and its bound spectrum,
 * particles, rain, logo, …) changes.
 *
 * Implementation notes:
 *  - Drives `style.opacity` imperatively from a single rAF — no React re-render
 *    per frame, no `setInterval`. `opacity` is never part of the wrapper's React
 *    style object, so React leaves the imperative value alone across re-renders.
 *  - The loop only runs while a relevant transition is live; between transitions
 *    nothing is scheduled and opacity is left at its natural value.
 *  - Reduced-motion and a disabled transition both report `durationMs <= 0`, so
 *    the loop never starts (no fade) and `performanceMode` already scales the
 *    duration upstream in `createVisualTransitionSnapshot`.
 */
export function useVisualTransitionFade(
	subsystem: VisualTransitionSubsystem | null
) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!subsystem) return undefined;
		let raf = 0;
		let activeId: string | null = null;

		const clearOpacity = () => {
			const el = ref.current;
			if (el) el.style.opacity = '';
		};

		const tick = () => {
			raf = 0;
			const el = ref.current;
			const transition = useWallpaperStore.getState().visualTransition;
			if (!el || !transition || transition.id !== activeId) {
				clearOpacity();
				activeId = null;
				return;
			}
			// `startedAtMs` is wall-clock (`Date.now()`); progress MUST use the
			// same clock. `performance.now()` is a different epoch and would clamp
			// progress to 0 forever, freezing the layer at opacity 0 (invisible).
			const progress = visualTransitionProgress(transition, Date.now());
			if (progress >= 1) {
				el.style.opacity = '';
				activeId = null;
				return;
			}
			el.style.opacity = String(progress);
			raf = requestAnimationFrame(tick);
		};

		const maybeStart = () => {
			const transition = useWallpaperStore.getState().visualTransition;
			if (
				!transition ||
				transition.id === activeId ||
				transition.durationMs <= 0 ||
				!transition.subsystems.includes(subsystem)
			) {
				return;
			}
			activeId = transition.id;
			if (raf) cancelAnimationFrame(raf);
			raf = requestAnimationFrame(tick);
		};

		// Catch a transition that is already live when this layer mounts, then
		// react to every later transition the store publishes.
		maybeStart();
		const unsubscribe = useWallpaperStore.subscribe(() => maybeStart());

		return () => {
			if (raf) cancelAnimationFrame(raf);
			unsubscribe();
			activeId = null;
			clearOpacity();
		};
	}, [subsystem]);

	return ref;
}
