import { describe, expect, it, vi } from 'vitest';
import { createPointerDragSession } from './pointerDragSession';

function setup() {
	const view = new EventTarget();
	const doc = Object.assign(new EventTarget(), {
		defaultView: view,
		hidden: false
	});
	let captured: number | null = null;
	const element = Object.assign(new EventTarget(), {
		ownerDocument: doc,
		setPointerCapture: vi.fn((id: number) => {
			captured = id;
		}),
		hasPointerCapture: (id: number) => captured === id,
		releasePointerCapture: vi.fn(() => {
			captured = null;
		})
	});
	const onEnd = vi.fn();
	const session = createPointerDragSession(onEnd);
	const start = (id = 1, button = 0) =>
		session.start(element as unknown as HTMLElement, {
			pointerId: id,
			button
		});
	const fire = (target: EventTarget, name: string, id = 1) =>
		target.dispatchEvent(Object.assign(new Event(name), { pointerId: id }));
	return { view, doc, element, session, start, fire, onEnd };
}

describe('pointer drag recovery', () => {
	it.each([
		'pointerup',
		'pointercancel',
		'blur',
		'lostpointercapture',
		'visibilitychange'
	])(
		'releases the drag on %s and allows the next control to start',
		reason => {
			const t = setup();
			expect(t.start()).toBe(true);
			expect(t.session.move({ pointerId: 1, buttons: 1 })).toBe(true);
			if (reason === 'visibilitychange') {
				t.doc.hidden = true;
				t.fire(t.doc, reason);
			} else
				t.fire(
					reason === 'lostpointercapture' ? t.element : t.view,
					reason
				);
			expect(t.session.isActive()).toBe(false);
			expect(t.session.move({ pointerId: 1, buttons: 1 })).toBe(false);
			expect(t.element.releasePointerCapture).toHaveBeenCalledWith(1);
			expect(t.onEnd).toHaveBeenCalledTimes(1);
			t.fire(t.view, 'blur');
			expect(t.onEnd).toHaveBeenCalledTimes(1);
			expect(t.start(2)).toBe(true);
			t.session.finish();
		}
	);

	it('recovers from a mouse release outside the browser without another pointerup', () => {
		const t = setup();
		t.start();
		expect(t.session.move({ pointerId: 1, buttons: 0 })).toBe(false);
		expect(t.session.isActive()).toBe(false);
		expect(t.onEnd).toHaveBeenCalledTimes(1);
	});

	it('ignores other pointers and non-primary buttons', () => {
		const t = setup();
		expect(t.start(1, 2)).toBe(false);
		t.start();
		expect(t.start(2)).toBe(false);
		t.fire(t.view, 'pointerup', 2);
		expect(t.session.move({ pointerId: 2, buttons: 0 })).toBe(false);
		expect(t.session.isActive()).toBe(true);
		t.session.finish();
	});

	it('cleans up on tool changes/unmount and tolerates an already released capture', () => {
		const t = setup();
		t.start();
		t.element.releasePointerCapture();
		t.session.finish();
		t.session.finish();
		expect(t.onEnd).toHaveBeenCalledTimes(1);
		expect(t.element.releasePointerCapture).toHaveBeenCalledTimes(1);
		t.fire(t.view, 'pointerup');
		expect(t.onEnd).toHaveBeenCalledTimes(1);
	});
});
