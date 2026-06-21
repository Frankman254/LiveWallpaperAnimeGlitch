import { useEffect, useRef, useState } from 'react';
import type {
	DragEvent as ReactDragEvent,
	PointerEvent as ReactPointerEvent
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { WallpaperLayer } from '@/types/layers';
import type { BuiltInLayerId } from '@/types/wallpaper';
import { isOverlayImage } from './layerStackHelpers';

export function useLayerOrder(renderableLayers: WallpaperLayer[]) {
	const store = useWallpaperStore(
		useShallow(s => ({
			layerZIndices: s.layerZIndices,
			overlays: s.overlays,
			updateOverlay: s.updateOverlay,
			setLayerZIndex: s.setLayerZIndex,
			resetLayerZIndices: s.resetLayerZIndices
		}))
	);
	const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
	const [dropTargetLayerId, setDropTargetLayerId] = useState<string | null>(
		null
	);
	const dropTargetLayerIdRef = useRef<string | null>(null);
	const pointerDragRef = useRef<{
		pointerId: number;
		sourceId: string;
	} | null>(null);

	dropTargetLayerIdRef.current = dropTargetLayerId;

	function canReorder(layer: WallpaperLayer): boolean {
		return layer.kind !== 'controller';
	}

	function applyLayerOrder(nextOrder: WallpaperLayer[]) {
		const nextLayerZIndices = { ...store.layerZIndices };
		const overlayZIndexMap = new Map<string, number>();

		nextOrder.forEach((layer, index) => {
			const zIndex = index * 10;
			if (isOverlayImage(layer)) {
				overlayZIndexMap.set(layer.id, zIndex);
				return;
			}
			nextLayerZIndices[layer.id as BuiltInLayerId] = zIndex;
		});

		useWallpaperStore.setState({
			layerZIndices: nextLayerZIndices,
			overlays: store.overlays.map(overlay =>
				overlayZIndexMap.has(overlay.id)
					? {
							...overlay,
							zIndex:
								overlayZIndexMap.get(overlay.id) ??
								overlay.zIndex
						}
					: overlay
			)
		});
	}

	function moveLayer(layer: WallpaperLayer, direction: 'up' | 'down') {
		const reorderableLayers = renderableLayers.filter(canReorder);
		const currentIndex = reorderableLayers.findIndex(
			item => item.id === layer.id
		);
		if (currentIndex < 0) return;

		const targetIndex =
			direction === 'up' ? currentIndex - 1 : currentIndex + 1;
		if (targetIndex < 0 || targetIndex >= reorderableLayers.length) return;

		const nextOrder = [...reorderableLayers];
		const [movedLayer] = nextOrder.splice(currentIndex, 1);
		if (!movedLayer) return;
		nextOrder.splice(targetIndex, 0, movedLayer);
		applyLayerOrder(nextOrder);
	}

	function moveLayerToTarget(sourceId: string, targetId: string) {
		if (!sourceId || sourceId === targetId) return;
		const reorderableLayers = renderableLayers.filter(canReorder);
		const currentIndex = reorderableLayers.findIndex(
			item => item.id === sourceId
		);
		const targetIndex = reorderableLayers.findIndex(
			item => item.id === targetId
		);
		if (currentIndex < 0 || targetIndex < 0 || currentIndex === targetIndex)
			return;

		const nextOrder = [...reorderableLayers];
		const [movedLayer] = nextOrder.splice(currentIndex, 1);
		if (!movedLayer) return;
		const insertionIndex =
			currentIndex < targetIndex ? targetIndex - 1 : targetIndex;
		nextOrder.splice(insertionIndex, 0, movedLayer);
		applyLayerOrder(nextOrder);
	}

	function finishPointerDrag(pointerId?: number) {
		const current = pointerDragRef.current;
		if (!current) return;
		if (pointerId !== undefined && current.pointerId !== pointerId) return;

		const sourceId = current.sourceId;
		const targetId = dropTargetLayerIdRef.current;

		pointerDragRef.current = null;
		setDraggedLayerId(null);
		setDropTargetLayerId(null);

		if (targetId && targetId !== sourceId) {
			moveLayerToTarget(sourceId, targetId);
		}
	}

	useEffect(() => {
		function handlePointerLayerMove(event: PointerEvent) {
			const current = pointerDragRef.current;
			if (!current || current.pointerId !== event.pointerId) return;
			if (event.cancelable) event.preventDefault();

			const element = document.elementFromPoint(
				event.clientX,
				event.clientY
			);
			const card = element?.closest?.(
				'[data-layer-card-id]'
			) as HTMLElement | null;
			const targetId = card?.dataset.layerCardId ?? null;
			setDropTargetLayerId(
				targetId && targetId !== current.sourceId ? targetId : null
			);
		}

		function handlePointerLayerUp(event: PointerEvent) {
			finishPointerDrag(event.pointerId);
		}

		window.addEventListener('pointermove', handlePointerLayerMove, {
			passive: false
		});
		window.addEventListener('pointerup', handlePointerLayerUp);
		window.addEventListener('pointercancel', handlePointerLayerUp);
		return () => {
			window.removeEventListener('pointermove', handlePointerLayerMove);
			window.removeEventListener('pointerup', handlePointerLayerUp);
			window.removeEventListener('pointercancel', handlePointerLayerUp);
		};
	}, [
		dropTargetLayerId,
		renderableLayers,
		store.layerZIndices,
		store.overlays
	]);

	function updateZIndex(layer: WallpaperLayer, zIndex: number) {
		if (isOverlayImage(layer)) {
			store.updateOverlay(layer.id, { zIndex });
			return;
		}

		store.setLayerZIndex(layer.id as BuiltInLayerId, zIndex);
	}

	function getLayerMoveState(layer: WallpaperLayer) {
		const reorderableLayers = renderableLayers.filter(canReorder);
		const layerIndex = reorderableLayers.findIndex(
			item => item.id === layer.id
		);

		return {
			canMoveUp: layerIndex > 0,
			canMoveDown:
				layerIndex >= 0 && layerIndex < reorderableLayers.length - 1
		};
	}

	function handlePointerDragStart(
		layerId: string,
		event: ReactPointerEvent<HTMLButtonElement>
	) {
		if (event.cancelable) event.preventDefault();
		event.currentTarget.setPointerCapture?.(event.pointerId);
		pointerDragRef.current = {
			pointerId: event.pointerId,
			sourceId: layerId
		};
		setDraggedLayerId(layerId);
		setDropTargetLayerId(null);
	}

	function handleNativeDragStart(
		layerId: string,
		event: ReactDragEvent<HTMLDivElement>
	) {
		const layer = renderableLayers.find(item => item.id === layerId);
		if (!layer || !canReorder(layer)) return;
		setDraggedLayerId(layerId);
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/plain', layerId);
	}

	function handleNativeDragOver(
		layerId: string,
		event: ReactDragEvent<HTMLDivElement>
	) {
		const layer = renderableLayers.find(item => item.id === layerId);
		if (
			!layer ||
			!canReorder(layer) ||
			!draggedLayerId ||
			draggedLayerId === layerId
		)
			return;
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
		setDropTargetLayerId(layerId);
	}

	function handleNativeDragLeave(layerId: string) {
		setDropTargetLayerId(current => (current === layerId ? null : current));
	}

	function handleNativeDrop(
		layerId: string,
		event: ReactDragEvent<HTMLDivElement>
	) {
		const layer = renderableLayers.find(item => item.id === layerId);
		if (!layer || !canReorder(layer)) return;
		event.preventDefault();
		const sourceId =
			draggedLayerId || event.dataTransfer.getData('text/plain');
		moveLayerToTarget(sourceId, layerId);
		setDraggedLayerId(null);
		setDropTargetLayerId(null);
	}

	function handleNativeDragEnd() {
		setDraggedLayerId(null);
		setDropTargetLayerId(null);
	}

	return {
		draggedLayerId,
		dropTargetLayerId,
		canReorder,
		getLayerMoveState,
		resetLayerZIndices: store.resetLayerZIndices,
		moveLayer,
		updateZIndex,
		handlePointerDragStart,
		handleNativeDragStart,
		handleNativeDragOver,
		handleNativeDragLeave,
		handleNativeDrop,
		handleNativeDragEnd
	};
}
