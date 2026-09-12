/** Own one pointer capture and release all listeners on every exit path. */
export function createPointerDragSession(onEnd: () => void) {
	let active: { element: HTMLElement; pointerId: number } | null = null;
	let detach = () => {};
	function finish() {
		const previous = active;
		if (!previous) return;
		active = null;
		detach();
		try {
			if (previous.element.hasPointerCapture(previous.pointerId)) {
				previous.element.releasePointerCapture(previous.pointerId);
			}
		} finally {
			onEnd();
		}
	}
	function matches(event: { pointerId: number }) {
		return active?.pointerId === event.pointerId;
	}
	return {
		finish,
		isActive: () => active !== null,
		move(event: { pointerId: number; buttons: number }) {
			if (!matches(event)) return false;
			// Recover when the release happened outside the browser.
			if ((event.buttons & 1) === 0) {
				finish();
				return false;
			}
			return true;
		},
		start(
			element: HTMLElement,
			event: { pointerId: number; button: number }
		) {
			if (event.button !== 0 || active) return false;
			const doc = element.ownerDocument;
			const view = doc.defaultView;
			if (!view) return false;
			element.setPointerCapture(event.pointerId);
			active = { element, pointerId: event.pointerId };
			const endPointer = (event: PointerEvent) => {
				if (matches(event)) finish();
			};
			const visibility = () => {
				if (doc.hidden) finish();
			};
			view.addEventListener('pointerup', endPointer, true);
			view.addEventListener('pointercancel', endPointer, true);
			view.addEventListener('blur', finish);
			doc.addEventListener('visibilitychange', visibility);
			element.addEventListener('lostpointercapture', endPointer);
			detach = () => {
				view.removeEventListener('pointerup', endPointer, true);
				view.removeEventListener('pointercancel', endPointer, true);
				view.removeEventListener('blur', finish);
				doc.removeEventListener('visibilitychange', visibility);
				element.removeEventListener('lostpointercapture', endPointer);
			};
			return true;
		}
	};
}
