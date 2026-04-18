import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { TrackTitleLayoutMode } from '@/types/wallpaper';
import type {
	DragState,
	PendingDragUpdate
} from '@/components/wallpaper/overlayInteraction/overlayInteractionTypes';

type OverlayDragTarget = {
	id: string;
	positionX: number;
	positionY: number;
};

type UseOverlayDragControllerOptions = {
	visible: boolean;
	viewportWidth: number;
	viewportHeight: number;
	logoPositionX: number;
	logoPositionY: number;
	audioTrackTitlePositionX: number;
	audioTrackTitlePositionY: number;
	audioTrackTimePositionX: number;
	audioTrackTimePositionY: number;
	spectrumPositionX: number;
	spectrumPositionY: number;
	setSelectedOverlayId: (id: string | null) => void;
	updateOverlay: (
		id: string,
		patch: { positionX?: number; positionY?: number }
	) => void;
	setLogoPositionX: (v: number) => void;
	setLogoPositionY: (v: number) => void;
	setAudioTrackTitleLayoutMode: (mode: TrackTitleLayoutMode) => void;
	setAudioTrackTitlePositionX: (v: number) => void;
	setAudioTrackTitlePositionY: (v: number) => void;
	setAudioTrackTimePositionX: (v: number) => void;
	setAudioTrackTimePositionY: (v: number) => void;
	setSpectrumPositionX: (v: number) => void;
	setSpectrumPositionY: (v: number) => void;
};

export function useOverlayDragController(options: UseOverlayDragControllerOptions) {
	const dragRef = useRef<DragState | null>(null);
	const frameRef = useRef<number | null>(null);
	const pendingUpdateRef = useRef<PendingDragUpdate | null>(null);

	function commitPendingDragUpdate() {
		const pending = pendingUpdateRef.current;
		if (!pending) return;
		pendingUpdateRef.current = null;

		if (pending.kind === 'overlay') {
			options.updateOverlay(pending.id, {
				positionX: pending.positionX,
				positionY: pending.positionY
			});
			return;
		}

		if (pending.kind === 'logo') {
			options.setLogoPositionX(pending.positionX);
			options.setLogoPositionY(pending.positionY);
			return;
		}

		if (pending.kind === 'track-title') {
			options.setAudioTrackTitlePositionX(pending.positionX);
			options.setAudioTrackTitlePositionY(pending.positionY);
			return;
		}

		if (pending.kind === 'track-time') {
			options.setAudioTrackTimePositionX(pending.positionX);
			options.setAudioTrackTimePositionY(pending.positionY);
			return;
		}

		options.setSpectrumPositionX(pending.positionX);
		options.setSpectrumPositionY(pending.positionY);
	}

	function flushDragFrame() {
		frameRef.current = null;
		commitPendingDragUpdate();
	}

	function scheduleDragUpdate(update: PendingDragUpdate) {
		pendingUpdateRef.current = update;
		if (frameRef.current !== null) return;
		frameRef.current = window.requestAnimationFrame(flushDragFrame);
	}

	function finishDrag(pointerId?: number) {
		if (!dragRef.current) return;
		if (pointerId !== undefined && dragRef.current.pointerId !== pointerId) return;
		if (frameRef.current !== null) {
			window.cancelAnimationFrame(frameRef.current);
			frameRef.current = null;
		}
		commitPendingDragUpdate();
		window.removeEventListener('pointermove', handlePointerMove);
		window.removeEventListener('pointerup', handlePointerUp);
		window.removeEventListener('pointercancel', handlePointerUp);
		dragRef.current = null;
	}

	function handlePointerMove(event: PointerEvent) {
		const drag = dragRef.current;
		if (!drag || drag.pointerId !== event.pointerId) return;
		if (event.cancelable) event.preventDefault();

		const dx = event.clientX - drag.startClientX;
		const dy = event.clientY - drag.startClientY;

		if (drag.kind === 'overlay') {
			scheduleDragUpdate({
				kind: 'overlay',
				id: drag.id,
				positionX: drag.startPositionX + dx / Math.max(options.viewportWidth, 1),
				positionY: drag.startPositionY - dy / Math.max(options.viewportHeight, 1)
			});
			return;
		}

		if (drag.kind === 'logo') {
			scheduleDragUpdate({
				kind: 'logo',
				positionX:
					drag.startPositionX + dx / Math.max(options.viewportWidth * 0.5, 1),
				positionY:
					drag.startPositionY - dy / Math.max(options.viewportHeight * 0.5, 1)
			});
			return;
		}

		if (drag.kind === 'track-title') {
			scheduleDragUpdate({
				kind: 'track-title',
				positionX:
					drag.startPositionX + dx / Math.max(options.viewportWidth * 0.5, 1),
				positionY:
					drag.startPositionY - dy / Math.max(options.viewportHeight * 0.5, 1)
			});
			return;
		}

		if (drag.kind === 'track-time') {
			scheduleDragUpdate({
				kind: 'track-time',
				positionX:
					drag.startPositionX + dx / Math.max(options.viewportWidth * 0.5, 1),
				positionY:
					drag.startPositionY - dy / Math.max(options.viewportHeight * 0.5, 1)
			});
			return;
		}

		scheduleDragUpdate({
			kind: 'spectrum',
			positionX:
				drag.startPositionX + dx / Math.max(options.viewportWidth * 0.5, 1),
			positionY:
				drag.startPositionY - dy / Math.max(options.viewportHeight * 0.5, 1)
		});
	}

	function handlePointerUp(event: PointerEvent) {
		finishDrag(event.pointerId);
	}

	function attachDragListeners() {
		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
		window.addEventListener('pointercancel', handlePointerUp);
	}

	function handleOverlayPointerDown(
		event: ReactPointerEvent<HTMLButtonElement>,
		overlay: OverlayDragTarget
	) {
		if (event.cancelable) event.preventDefault();
		event.currentTarget.setPointerCapture?.(event.pointerId);
		options.setSelectedOverlayId(overlay.id);
		dragRef.current = {
			kind: 'overlay',
			id: overlay.id,
			pointerId: event.pointerId,
			startClientX: event.clientX,
			startClientY: event.clientY,
			startPositionX: overlay.positionX,
			startPositionY: overlay.positionY
		};
		attachDragListeners();
	}

	function handleLogoPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
		if (event.cancelable) event.preventDefault();
		event.currentTarget.setPointerCapture?.(event.pointerId);
		dragRef.current = {
			kind: 'logo',
			pointerId: event.pointerId,
			startClientX: event.clientX,
			startClientY: event.clientY,
			startPositionX: options.logoPositionX,
			startPositionY: options.logoPositionY
		};
		attachDragListeners();
	}

	function handleSpectrumPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
		if (event.cancelable) event.preventDefault();
		event.currentTarget.setPointerCapture?.(event.pointerId);
		dragRef.current = {
			kind: 'spectrum',
			pointerId: event.pointerId,
			startClientX: event.clientX,
			startClientY: event.clientY,
			startPositionX: options.spectrumPositionX,
			startPositionY: options.spectrumPositionY
		};
		attachDragListeners();
	}

	function handleTrackTitlePointerDown(
		event: ReactPointerEvent<HTMLButtonElement>
	) {
		if (event.cancelable) event.preventDefault();
		event.currentTarget.setPointerCapture?.(event.pointerId);
		options.setAudioTrackTitleLayoutMode('free');
		dragRef.current = {
			kind: 'track-title',
			pointerId: event.pointerId,
			startClientX: event.clientX,
			startClientY: event.clientY,
			startPositionX: options.audioTrackTitlePositionX,
			startPositionY: options.audioTrackTitlePositionY
		};
		attachDragListeners();
	}

	function handleTrackTimePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
		if (event.cancelable) event.preventDefault();
		event.currentTarget.setPointerCapture?.(event.pointerId);
		dragRef.current = {
			kind: 'track-time',
			pointerId: event.pointerId,
			startClientX: event.clientX,
			startClientY: event.clientY,
			startPositionX: options.audioTrackTimePositionX,
			startPositionY: options.audioTrackTimePositionY
		};
		attachDragListeners();
	}

	/* eslint-disable react-hooks/exhaustive-deps */
	useEffect(() => {
		if (!options.visible) {
			if (frameRef.current !== null) {
				window.cancelAnimationFrame(frameRef.current);
				frameRef.current = null;
			}
			commitPendingDragUpdate();
			window.removeEventListener('pointermove', handlePointerMove);
			window.removeEventListener('pointerup', handlePointerUp);
			window.removeEventListener('pointercancel', handlePointerUp);
			dragRef.current = null;
		}

		return () => {
			if (frameRef.current !== null) {
				window.cancelAnimationFrame(frameRef.current);
				frameRef.current = null;
			}
			commitPendingDragUpdate();
			window.removeEventListener('pointermove', handlePointerMove);
			window.removeEventListener('pointerup', handlePointerUp);
			window.removeEventListener('pointercancel', handlePointerUp);
			dragRef.current = null;
			pendingUpdateRef.current = null;
		};
	}, [options.visible]);
	/* eslint-enable react-hooks/exhaustive-deps */

	return {
		handleOverlayPointerDown,
		handleLogoPointerDown,
		handleSpectrumPointerDown,
		handleTrackTitlePointerDown,
		handleTrackTimePointerDown
	};
}

