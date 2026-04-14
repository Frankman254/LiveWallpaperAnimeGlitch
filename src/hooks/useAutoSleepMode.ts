import { useEffect } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';

export function useAutoSleepMode(): void {
	const sleepModeEnabled = useWallpaperStore(state => state.sleepModeEnabled);
	const sleepModeDelaySeconds = useWallpaperStore(
		state => state.sleepModeDelaySeconds
	);

	useEffect(() => {
		if (typeof document === 'undefined') return undefined;

		const markInteraction = () => {
			lastInteractionAt = Date.now();
			const state = useWallpaperStore.getState();
			if (state.sleepModeActive && !document.hidden) {
				state.setSleepModeActive(false);
			}
		};

		let lastInteractionAt = Date.now();

		const updateSleepState = () => {
			const state = useWallpaperStore.getState();
			if (!state.sleepModeEnabled) {
				if (state.sleepModeActive) state.setSleepModeActive(false);
				return;
			}

			const isAudioActive =
				state.audioCaptureState === 'active' && !state.audioPaused;
			const idleForMs = Date.now() - lastInteractionAt;
			const isIdle = idleForMs >= state.sleepModeDelaySeconds * 1000;

			// Never sleep if audio is actively playing (user might be listening in background)
			// Only sleep if audio is inactive AND (document is hidden OR inactivity threshold reached)
			const shouldSleep =
				!isAudioActive && (document.hidden || isIdle);

			if (state.sleepModeActive !== shouldSleep) {
				state.setSleepModeActive(shouldSleep);
			}
		};

		const interactionEvents: Array<keyof WindowEventMap> = [
			'mousemove',
			'mousedown',
			'keydown',
			'touchstart',
			'wheel'
		];

		const visibilityHandler = () => {
			if (!document.hidden) {
				lastInteractionAt = Date.now();
			}
			updateSleepState();
		};

		for (const eventName of interactionEvents) {
			window.addEventListener(eventName, markInteraction, {
				passive: true
			});
		}
		document.addEventListener('visibilitychange', visibilityHandler);
		const timer = window.setInterval(updateSleepState, 1000);
		updateSleepState();

		return () => {
			for (const eventName of interactionEvents) {
				window.removeEventListener(eventName, markInteraction);
			}
			document.removeEventListener('visibilitychange', visibilityHandler);
			window.clearInterval(timer);
		};
	}, [sleepModeDelaySeconds, sleepModeEnabled]);
}
