import { useEffect, useRef } from 'react';

type WakeLockSentinelLike = { release: () => Promise<void> };

/**
 * Keeps the screen awake while media is playing (Chrome/Android, desktop),
 * similar to video players. Releases when paused or on unmount.
 * Re-acquires after visibility returns to "visible" (browser policy releases the lock when hidden).
 */
export function usePlaybackWakeLock(shouldHold: boolean): void {
	const lockRef = useRef<WakeLockSentinelLike | null>(null);

	useEffect(() => {
		if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
			return undefined;
		}

		const wakeLock = navigator.wakeLock as
			| { request: (type: 'screen') => Promise<WakeLockSentinelLike> }
			| undefined;
		if (!wakeLock?.request) return undefined;

		let cancelled = false;

		const release = async () => {
			const lock = lockRef.current;
			lockRef.current = null;
			if (!lock) return;
			try {
				await lock.release();
			} catch {
				// ignore
			}
		};

		const acquire = async () => {
			if (cancelled || !shouldHold) {
				await release();
				return;
			}
			if (typeof document !== 'undefined' && document.hidden) {
				return;
			}
			try {
				await release();
				lockRef.current = await wakeLock.request('screen');
			} catch {
				lockRef.current = null;
			}
		};

		void acquire();

		const onVisibility = () => {
			void acquire();
		};
		document.addEventListener('visibilitychange', onVisibility);

		return () => {
			cancelled = true;
			document.removeEventListener('visibilitychange', onVisibility);
			void release();
		};
	}, [shouldHold]);
}
