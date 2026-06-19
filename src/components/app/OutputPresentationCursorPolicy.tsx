import { useEffect, useRef } from 'react';
import { useRuntimeUiMode } from '@/runtime/useRuntimeUiMode';
import { useOutputPerformanceStore } from '@/runtime/outputPerformanceStore';

const CURSOR_HIDE_CLASS = 'lwag-output-hide-cursor';
const IDLE_MS = 2500;

export default function OutputPresentationCursorPolicy() {
	const { isOutputMode } = useRuntimeUiMode();
	const hideCursor = useOutputPerformanceStore(s => s.presentationHideCursor);
	const timerRef = useRef<number | null>(null);

	useEffect(() => {
		if (!isOutputMode || !hideCursor) {
			document.documentElement.classList.remove(CURSOR_HIDE_CLASS);
			return undefined;
		}

		function hideCursorNow() {
			document.documentElement.classList.add(CURSOR_HIDE_CLASS);
		}

		function showCursor() {
			document.documentElement.classList.remove(CURSOR_HIDE_CLASS);
			if (timerRef.current !== null) {
				window.clearTimeout(timerRef.current);
			}
			timerRef.current = window.setTimeout(hideCursorNow, IDLE_MS);
		}

		showCursor();
		window.addEventListener('mousemove', showCursor);
		window.addEventListener('pointerdown', showCursor);
		window.addEventListener('pointermove', showCursor);

		return () => {
			window.removeEventListener('mousemove', showCursor);
			window.removeEventListener('pointerdown', showCursor);
			window.removeEventListener('pointermove', showCursor);
			if (timerRef.current !== null) {
				window.clearTimeout(timerRef.current);
			}
			document.documentElement.classList.remove(CURSOR_HIDE_CLASS);
		};
	}, [hideCursor, isOutputMode]);

	return null;
}
