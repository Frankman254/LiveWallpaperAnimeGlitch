import { useEffect, useRef, useState } from 'react';
import ResetButton from '@/components/controls/ui/ResetButton';
import SectionDivider from '@/components/controls/ui/SectionDivider';
import SliderControl from '@/components/controls/SliderControl';
import ToggleControl from '@/components/controls/ToggleControl';
import { DEFAULT_STATE } from '@/lib/constants';
import { useT } from '@/lib/i18n';
import {
	buildControllerLayers,
	buildOverlayLayers,
	buildSceneLayers
} from '@/lib/layers';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { OverlayLayer, WallpaperLayer } from '@/types/layers';
import type { BuiltInLayerId } from '@/types/wallpaper';

function isOverlayImage(
	layer: WallpaperLayer
): layer is Extract<OverlayLayer, { type: 'overlay-image' }> {
	return layer.type === 'overlay-image';
}

type SyntheticLayer = {
	id: 'global-background';
	title: string;
	kindLabel: string;
	enabled: boolean;
	lockedOrder: true;
	hasAsset: boolean;
};

export default function LayersTab({
	onReset: _onReset
}: {
	onReset: () => void;
}) {
	const t = useT();
	const store = useWallpaperStore();
	const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
	const [dropTargetLayerId, setDropTargetLayerId] = useState<string | null>(
		null
	);
	const dropTargetLayerIdRef = useRef<string | null>(null);
	dropTargetLayerIdRef.current = dropTargetLayerId;
	const pointerDragRef = useRef<{
		pointerId: number;
		sourceId: string;
	} | null>(null);

	const renderableLayers = [
		...buildSceneLayers(store),
		...buildOverlayLayers(store)
	].sort((a, b) => a.zIndex - b.zIndex);
	const controllerLayers = buildControllerLayers(store).sort(
		(a, b) => a.zIndex - b.zIndex
	);
	const globalBackgroundLayer: SyntheticLayer = {
		id: 'global-background',
		title: t.label_global_background_image,
		kindLabel: 'scene • global-background',
		enabled: store.globalBackgroundEnabled,
		lockedOrder: true,
		hasAsset: Boolean(store.globalBackgroundUrl || store.globalBackgroundId)
	};

	function getLayerLabel(layer: WallpaperLayer): string {
		if (layer.type === 'overlay-image') return layer.name;

		const labels: Record<string, string> = {
			'background-image': t.label_scene_background,
			slideshow: 'Slideshow',
			logo: 'Logo',
			'track-title': t.tab_track,
			spectrum: 'Spectrum',
			'particle-background': 'Particles Back',
			'particle-foreground': 'Particles Front',
			rain: 'Rain'
		};

		return labels[layer.id] ?? layer.type;
	}

	function setParticleLayerEnabled(
		target: 'background' | 'foreground',
		enabled: boolean
	) {
		if (target === 'background') {
			if (enabled) {
				store.setParticlesEnabled(true);
				if (store.particleLayerMode === 'foreground')
					store.setParticleLayerMode('both');
				else store.setParticleLayerMode('background');
				return;
			}

			if (!store.particlesEnabled) return;
			if (store.particleLayerMode === 'both')
				store.setParticleLayerMode('foreground');
			else if (store.particleLayerMode === 'background')
				store.setParticlesEnabled(false);
			return;
		}

		if (enabled) {
			store.setParticlesEnabled(true);
			if (store.particleLayerMode === 'background')
				store.setParticleLayerMode('both');
			else store.setParticleLayerMode('foreground');
			return;
		}

		if (!store.particlesEnabled) return;
		if (store.particleLayerMode === 'both')
			store.setParticleLayerMode('background');
		else if (store.particleLayerMode === 'foreground')
			store.setParticlesEnabled(false);
	}

	function toggleLayer(layer: WallpaperLayer, enabled: boolean) {
		if (isOverlayImage(layer)) {
			store.updateOverlay(layer.id, { enabled });
			return;
		}

		switch (layer.id) {
			case 'background-image':
				store.setBackgroundImageEnabled(enabled);
				return;
			case 'slideshow':
				store.setSlideshowEnabled(enabled);
				return;
			case 'logo':
				store.setLogoEnabled(enabled);
				return;
			case 'track-title':
				if (enabled) {
					store.setAudioTrackTitleEnabled(true);
				} else {
					store.setAudioTrackTitleEnabled(false);
					store.setAudioTrackTimeEnabled(false);
				}
				return;
			case 'spectrum':
				store.setSpectrumEnabled(enabled);
				return;
			case 'particle-background':
				setParticleLayerEnabled('background', enabled);
				return;
			case 'particle-foreground':
				setParticleLayerEnabled('foreground', enabled);
				return;
			case 'rain':
				store.setRainEnabled(enabled);
				return;
			default:
				return;
		}
	}

	function updateZIndex(layer: WallpaperLayer, zIndex: number) {
		if (isOverlayImage(layer)) {
			store.updateOverlay(layer.id, { zIndex });
			return;
		}

		store.setLayerZIndex(layer.id as BuiltInLayerId, zIndex);
	}

	function canToggle(layer: WallpaperLayer): boolean {
		return (
			isOverlayImage(layer) ||
			[
				'background-image',
				'slideshow',
				'logo',
				'track-title',
				'spectrum',
				'particle-background',
				'particle-foreground',
				'rain'
			].includes(layer.id)
		);
	}

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
			direction === 'up' ? currentIndex + 1 : currentIndex - 1;
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

	function handlePointerLayerMove(event: PointerEvent) {
		const current = pointerDragRef.current;
		if (!current || current.pointerId !== event.pointerId) return;
		if (event.cancelable) event.preventDefault();

		const element = document.elementFromPoint(event.clientX, event.clientY);
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

	useEffect(() => {
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
	}, [dropTargetLayerId]);

	function restoreLayerDefaults() {
		store.resetLayerZIndices();
		store.setBackgroundImageEnabled(DEFAULT_STATE.backgroundImageEnabled);
		store.setGlobalBackgroundEnabled(DEFAULT_STATE.globalBackgroundEnabled);
	}

	function renderGlobalBackgroundCard(layer: SyntheticLayer) {
		return (
			<div
				key={layer.id}
				className="rounded border border-cyan-900 bg-black/40 p-3 flex flex-col gap-2"
			>
				<div className="flex items-start gap-3">
					<div className="flex-1">
						<div className="text-xs text-cyan-300">
							{layer.title}
						</div>
						<div className="text-[11px] text-cyan-700 uppercase tracking-widest">
							{layer.kindLabel}
						</div>
					</div>
				</div>

				<ToggleControl
					label={t.label_enabled}
					value={layer.enabled}
					onChange={store.setGlobalBackgroundEnabled}
				/>

				<div className="text-[11px] text-cyan-700">
					{layer.hasAsset
						? t.label_layer_order_locked
						: t.label_no_image_loaded}
				</div>
			</div>
		);
	}

	function renderLayerCard(layer: WallpaperLayer) {
		const reorderableLayers = renderableLayers.filter(canReorder);
		const layerIndex = reorderableLayers.findIndex(
			item => item.id === layer.id
		);
		const canMoveDown = layerIndex > 0;
		const canMoveUp =
			layerIndex >= 0 && layerIndex < reorderableLayers.length - 1;
		const isDragSource = draggedLayerId === layer.id;
		const isDropTarget =
			dropTargetLayerId === layer.id && draggedLayerId !== layer.id;

		return (
			<div
				key={layer.id}
				data-layer-card-id={layer.id}
				draggable={canReorder(layer)}
				onDragStart={event => {
					if (!canReorder(layer)) return;
					setDraggedLayerId(layer.id);
					event.dataTransfer.effectAllowed = 'move';
					event.dataTransfer.setData('text/plain', layer.id);
				}}
				onDragOver={event => {
					if (
						!canReorder(layer) ||
						!draggedLayerId ||
						draggedLayerId === layer.id
					)
						return;
					event.preventDefault();
					event.dataTransfer.dropEffect = 'move';
					setDropTargetLayerId(layer.id);
				}}
				onDragLeave={() => {
					setDropTargetLayerId(current =>
						current === layer.id ? null : current
					);
				}}
				onDrop={event => {
					if (!canReorder(layer)) return;
					event.preventDefault();
					const sourceId =
						draggedLayerId ||
						event.dataTransfer.getData('text/plain');
					moveLayerToTarget(sourceId, layer.id);
					setDraggedLayerId(null);
					setDropTargetLayerId(null);
				}}
				onDragEnd={() => {
					setDraggedLayerId(null);
					setDropTargetLayerId(null);
				}}
				className={`rounded border bg-black/40 p-3 flex flex-col gap-2 transition-colors ${
					isDropTarget ? 'border-cyan-400' : 'border-cyan-900'
				} ${isDragSource ? 'opacity-60' : ''}`}
			>
				<div className="flex items-start gap-3">
					<div className="flex-1">
						<div className="text-xs text-cyan-300">
							{getLayerLabel(layer)}
						</div>
						<div className="text-[11px] text-cyan-700 uppercase tracking-widest">
							{layer.kind} • {layer.type}
						</div>
					</div>
					{canReorder(layer) ? (
						<button
							type="button"
							onPointerDown={event => {
								if (event.cancelable) event.preventDefault();
								event.currentTarget.setPointerCapture?.(
									event.pointerId
								);
								pointerDragRef.current = {
									pointerId: event.pointerId,
									sourceId: layer.id
								};
								setDraggedLayerId(layer.id);
								setDropTargetLayerId(null);
							}}
							className="rounded border border-cyan-800 px-2 py-1 text-[11px] text-cyan-500 transition-colors hover:border-cyan-500"
							style={{ touchAction: 'none' }}
							title={t.label_reorder_layer}
						>
							↕
						</button>
					) : null}
					{isOverlayImage(layer) ? (
						<button
							onClick={() => store.setSelectedOverlayId(layer.id)}
							className="px-2 py-1 text-[11px] rounded border border-cyan-800 text-cyan-400 hover:border-cyan-500 transition-colors"
						>
							{t.label_open_overlay}
						</button>
					) : null}
				</div>

				{canToggle(layer) ? (
					<ToggleControl
						label={t.label_enabled}
						value={layer.enabled}
						onChange={value => toggleLayer(layer, value)}
					/>
				) : (
					<div className="text-[11px] text-cyan-700">
						{t.label_layer_managed}
					</div>
				)}

				{canReorder(layer) ? (
					<>
						<div className="grid grid-cols-2 gap-2">
							<button
								onClick={() => moveLayer(layer, 'down')}
								disabled={!canMoveDown}
								className="rounded border border-cyan-800 px-3 py-1 text-xs text-cyan-400 transition-colors hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
							>
								{t.label_move_down}
							</button>
							<button
								onClick={() => moveLayer(layer, 'up')}
								disabled={!canMoveUp}
								className="rounded border border-cyan-800 px-3 py-1 text-xs text-cyan-400 transition-colors hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
							>
								{t.label_move_up}
							</button>
						</div>
						<SliderControl
							label={t.label_z_index}
							value={layer.zIndex}
							min={0}
							max={200}
							step={1}
							onChange={value => updateZIndex(layer, value)}
						/>
					</>
				) : (
					<div className="text-[11px] text-cyan-700">
						{t.label_layer_order_locked}
					</div>
				)}
			</div>
		);
	}

	return (
		<>
			<ResetButton
				label={t.label_restore_default_stack}
				onClick={restoreLayerDefaults}
			/>
			<SectionDivider label={t.section_layers} />
			<span className="text-[11px] text-cyan-700">
				{t.hint_restore_default_stack}
			</span>

			<div className="flex flex-col gap-3">
				<SectionDivider label={t.section_global_stack} />
				{renderGlobalBackgroundCard(globalBackgroundLayer)}
				{renderableLayers.map(renderLayerCard)}

				<SectionDivider label={t.section_controller_layers} />
				{controllerLayers.map(renderLayerCard)}
			</div>
		</>
	);
}
