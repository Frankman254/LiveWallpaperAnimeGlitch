import { useEffect, useRef } from 'react';
import { useRuntimeUiMode } from '@/runtime/useRuntimeUiMode';
import { useOutputPerformanceStore } from '@/runtime/outputPerformanceStore';

export default function OutputPresentationCursorPolicy() {
	const { isPresentationMode } = useRuntimeUiMode();
	const hideCursor = useOutputPerformanceStore(s => s.presentationHideCursor);
	const timerRef = useRef<number | null>(null);

	useEffect(() => {
		if (!isPresentationMode || !hideCursor) {
			document.body.style.cursor = '';
			return undefined;
		}

		function showCursor() {
			document.body.style.cursor = 'default';
			if (timerRef.current !== null) {
				window.clearTimeout(timerRef.current);
			}
			timerRef.current = window.setTimeout(() => {
				document.body.style.cursor = 'none';
			}, 2000);
		}

		showCursor();
		window.addEventListener('mousemove', showCursor);
		window.addEventListener('pointerdown', showCursor);

		return () => {
			window.removeEventListener('mousemove', showCursor);
			window.removeEventListener('pointerdown', showCursor);
			if (timerRef.current !== null) {
				window.clearTimeout(timerRef.current);
			}
			document.body.style.cursor = '';
		};
	}, [hideCursor, isPresentationMode]);

	return null;
}
