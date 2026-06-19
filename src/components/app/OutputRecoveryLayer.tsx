import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRuntimeUiMode } from '@/runtime/useRuntimeUiMode';

const RECOVERY_HINT =
	'Ctrl+Shift+E to return to the editor. Hold top-left corner for 2s as backup.';

export default function OutputRecoveryLayer() {
	const navigate = useNavigate();
	const { isOutputMode, enterEditMode } = useRuntimeUiMode();
	const [hintVisible, setHintVisible] = useState(false);
	const hotCornerStartRef = useRef<number | null>(null);
	const hotCornerTimerRef = useRef<number | null>(null);

	useEffect(() => {
		if (!isOutputMode) {
			setHintVisible(false);
			return undefined;
		}
		setHintVisible(true);
		const timer = window.setTimeout(() => setHintVisible(false), 5000);
		return () => window.clearTimeout(timer);
	}, [isOutputMode]);

	useEffect(() => {
		if (!isOutputMode) return undefined;

		function returnToEditor() {
			enterEditMode();
			navigate('/edit', { replace: true });
		}

		function onKeyDown(event: KeyboardEvent) {
			if (
				event.ctrlKey &&
				event.shiftKey &&
				event.key.toLowerCase() === 'e'
			) {
				event.preventDefault();
				returnToEditor();
			}
		}

		function clearHotCornerTimer() {
			if (hotCornerTimerRef.current !== null) {
				window.clearTimeout(hotCornerTimerRef.current);
				hotCornerTimerRef.current = null;
			}
			hotCornerStartRef.current = null;
		}

		function onPointerDown(event: PointerEvent) {
			if (event.clientX > 48 || event.clientY > 48) return;
			hotCornerStartRef.current = performance.now();
			clearHotCornerTimer();
			hotCornerTimerRef.current = window.setTimeout(() => {
				returnToEditor();
			}, 2000);
		}

		function onPointerUp(event: PointerEvent) {
			if (event.clientX > 48 && event.clientY > 48) return;
			clearHotCornerTimer();
		}

		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('pointerdown', onPointerDown);
		window.addEventListener('pointerup', onPointerUp);
		window.addEventListener('pointercancel', onPointerUp);

		return () => {
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('pointerdown', onPointerDown);
			window.removeEventListener('pointerup', onPointerUp);
			window.removeEventListener('pointercancel', onPointerUp);
			clearHotCornerTimer();
		};
	}, [enterEditMode, isOutputMode, navigate]);

	if (!isOutputMode) return null;

	return (
		<>
			{hintVisible ? (
				<div
					className="pointer-events-none fixed top-3 left-1/2 z-[120] -translate-x-1/2 rounded border border-white/20 bg-black/75 px-4 py-2 text-xs text-white/85 backdrop-blur-sm"
					role="status"
				>
					{RECOVERY_HINT}
				</div>
			) : null}
			<div
				className="fixed top-0 left-0 z-[119] h-12 w-12"
				aria-hidden
				title="Hold 2s to return to editor"
			/>
		</>
	);
}
