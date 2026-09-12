import { useEffect, useState } from 'react';
import { createPointerDragSession } from './pointerDragSession';

export function usePointerDrag(enabled = true, target?: string) {
	const [dragging, setDragging] = useState(false);
	const [session] = useState(() =>
		createPointerDragSession(() => setDragging(false))
	);
	useEffect(() => {
		if (!enabled) session.finish();
		return () => session.finish();
	}, [enabled, target, session]);
	return {
		dragging,
		session,
		start(
			element: HTMLElement,
			event: { pointerId: number; button: number }
		) {
			if (!enabled || !session.start(element, event)) return false;
			setDragging(true);
			return true;
		}
	};
}
