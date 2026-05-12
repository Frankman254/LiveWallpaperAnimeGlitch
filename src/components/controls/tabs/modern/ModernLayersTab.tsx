import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
	ChevronDown,
	ChevronUp,
	GripVertical,
	Image as ImageIcon,
	Layers,
	Plus,
	RotateCcw,
	SlidersHorizontal,
	Trash2
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { BgTab } from '@/components/controls/controlTabsLazy';
import { AdvancedOnly, useIsSimple } from '@/components/controls/UIMode';
import { deleteImage, loadImage, saveImage } from '@/lib/db/imageDb';
import { useT } from '@/lib/i18n';
import {
	buildControllerLayers,
	buildOverlayLayers,
	buildSceneLayers
} from '@/lib/layers';
import { DEFAULT_STATE } from '@/lib/constants';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { OverlayLayer, WallpaperLayer } from '@/types/layers';
import type {
	BuiltInLayerId,
	OverlayBlendMode,
	OverlayCropShape,
	WallpaperState
} from '@/types/wallpaper';
import {
	Button,
	IconButton,
	SectionCard,
	SegmentedControl,
	Slider,
	ToggleSwitch,
	UI_COLORS,
	FONT,
	ICON_SIZE
} from '@/ui';

type LayersView = 'background' | 'stack' | 'overlays';

type SyntheticLayer = {
	id: 'global-background';
	title: string;
	kindLabel: string;
	enabled: boolean;
	lockedOrder: true;
	hasAsset: boolean;
};

const OVERLAY_BLEND_MODES: OverlayBlendMode[] = [
	'normal',
	'screen',
	'lighten',
	'multiply'
];

const OVERLAY_CROP_SHAPES: OverlayCropShape[] = [
	'rectangle',
	'rounded',
	'circle',
	'diamond'
];

const OVERLAY_BLEND_LABELS: Record<OverlayBlendMode, string> = {
	normal: 'Normal',
	screen: 'Screen',
	lighten: 'Lighten',
	multiply: 'Multiply'
};

function isOverlayImage(
	layer: WallpaperLayer
): layer is Extract<OverlayLayer, { type: 'overlay-image' }> {
	return layer.type === 'overlay-image';
}

function formatDecimal(value: number): string {
	return value.toFixed(2);
}

function formatInteger(value: number): string {
	return Math.round(value).toString();
}

function createOverlayId(): string {
	return `overlay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getImageDimensions(
	url: string
): Promise<{ width: number; height: number }> {
	return new Promise(resolve => {
		const image = new Image();
		image.onload = () => {
			resolve({
				width: image.naturalWidth || 200,
				height: image.naturalHeight || 200
			});
		};
		image.onerror = () => resolve({ width: 200, height: 200 });
		image.src = url;
	});
}

function fitOverlayBox(
	width: number,
	height: number
): { width: number; height: number } {
	const maxSize = 220;
	const ratio = Math.min(1, maxSize / Math.max(width, height, 1));
	return {
		width: Math.max(48, Math.round(width * ratio)),
		height: Math.max(48, Math.round(height * ratio))
	};
}

export default function ModernLayersTab({
	onReset
}: {
	onReset: () => void;
}) {
	const isSimple = useIsSimple();
	const [view, setView] = useState<LayersView>(
		isSimple ? 'background' : 'stack'
	);

	useEffect(() => {
		if (isSimple && view === 'overlays') setView('background');
	}, [isSimple, view]);

	const options = isSimple
		? ([
				{
					value: 'background',
					label: 'BG',
					icon: <ImageIcon size={ICON_SIZE.xs} />
				},
				{
					value: 'stack',
					label: 'Stack',
					icon: <Layers size={ICON_SIZE.xs} />
				}
			] as const)
		: ([
				{
					value: 'background',
					label: 'BG',
					icon: <ImageIcon size={ICON_SIZE.xs} />
				},
				{
					value: 'stack',
					label: 'Stack',
					icon: <Layers size={ICON_SIZE.xs} />
				},
				{
					value: 'overlays',
					label: 'Overlays',
					icon: <SlidersHorizontal size={ICON_SIZE.xs} />
				}
			] as const);

	return (
		<div className="flex flex-col gap-2">
			<SectionCard
				title="Layers"
				subtitle="Background, render order, and overlay images"
				action={
					<IconButton
						size="sm"
						density="compact"
						onClick={onReset}
						title="Reset layer settings"
					>
						<RotateCcw size={ICON_SIZE.sm} />
					</IconButton>
				}
				density="compact"
			>
				<SegmentedControl<LayersView>
					value={view}
					onChange={setView}
					options={options}
					size="sm"
					density="compact"
					full
					ariaLabel="Layer sections"
				/>
			</SectionCard>

			{view === 'background' ? <BgTab onReset={onReset} /> : null}
			{view === 'stack' ? <ModernLayerStackPanel /> : null}
			{view === 'overlays' ? <ModernOverlaysPanel onReset={onReset} /> : null}
		</div>
	);
}

function ModernLayerStackPanel() {
	const t = useT();
	const store = useWallpaperStore(
		useShallow(s => ({
			globalBackgroundEnabled: s.globalBackgroundEnabled,
			globalBackgroundUrl: s.globalBackgroundUrl,
			globalBackgroundId: s.globalBackgroundId,
			layerZIndices: s.layerZIndices,
			overlays: s.overlays,
			backgroundImages: s.backgroundImages,
			backgroundImageEnabled: s.backgroundImageEnabled,
			slideshowEnabled: s.slideshowEnabled,
			logoEnabled: s.logoEnabled,
			audioTrackTitleEnabled: s.audioTrackTitleEnabled,
			audioTrackTimeEnabled: s.audioTrackTimeEnabled,
			audioLyricsEnabled: s.audioLyricsEnabled,
			spectrumEnabled: s.spectrumEnabled,
			rainEnabled: s.rainEnabled,
			performanceMode: s.performanceMode,
			particlesEnabled: s.particlesEnabled,
			particleLayerMode: s.particleLayerMode,
			updateOverlay: s.updateOverlay,
			setBackgroundImageEnabled: s.setBackgroundImageEnabled,
			setSlideshowEnabled: s.setSlideshowEnabled,
			setLogoEnabled: s.setLogoEnabled,
			setAudioTrackTitleEnabled: s.setAudioTrackTitleEnabled,
			setAudioTrackTimeEnabled: s.setAudioTrackTimeEnabled,
			setAudioLyricsEnabled: s.setAudioLyricsEnabled,
			setSpectrumEnabled: s.setSpectrumEnabled,
			setRainEnabled: s.setRainEnabled,
			setParticlesEnabled: s.setParticlesEnabled,
			setParticleLayerMode: s.setParticleLayerMode,
			setLayerZIndex: s.setLayerZIndex,
			resetLayerZIndices: s.resetLayerZIndices,
			setGlobalBackgroundEnabled: s.setGlobalBackgroundEnabled,
			setSelectedOverlayId: s.setSelectedOverlayId
		}))
	);
	const fullStore = useWallpaperStore.getState() as WallpaperState;
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

	const renderableLayers = [
		...buildSceneLayers(fullStore),
		...buildOverlayLayers(fullStore)
	].sort((a, b) => a.zIndex - b.zIndex);
	const controllerLayers = buildControllerLayers(fullStore).sort(
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
			lyrics: t.tab_lyrics,
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
			case 'lyrics':
				store.setAudioLyricsEnabled(enabled);
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
				'lyrics',
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
				className="rounded-[var(--editor-radius-md)] border px-3 py-2"
				style={{
					borderColor: UI_COLORS.border,
					background: UI_COLORS.raised
				}}
			>
				<div className="flex items-center gap-2">
					<div className="min-w-0 flex-1">
						<div
							className="truncate text-[12px] font-semibold"
							style={{ color: UI_COLORS.fg }}
						>
							{layer.title}
						</div>
						<div
							className="truncate text-[10px] uppercase tracking-[0.12em]"
							style={{ color: UI_COLORS.fgMute, fontFamily: FONT.mono }}
						>
							{layer.kindLabel}
						</div>
					</div>
					<span
						className="rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.12em]"
						style={{
							borderColor: UI_COLORS.border,
							color: UI_COLORS.fgFaint,
							fontFamily: FONT.mono
						}}
					>
						Locked
					</span>
					<ToggleSwitch
						checked={layer.enabled}
						onChange={store.setGlobalBackgroundEnabled}
						size="sm"
						ariaLabel="Toggle global background"
					/>
				</div>
				<div
					className="mt-1 text-[11px]"
					style={{ color: UI_COLORS.fgMute }}
				>
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
				className="rounded-[var(--editor-radius-md)] border px-3 py-2 transition-opacity"
				style={{
					borderColor: isDropTarget
						? UI_COLORS.accentBorder
						: UI_COLORS.border,
					background: isDropTarget
						? UI_COLORS.accentSoft
						: UI_COLORS.raised,
					opacity: isDragSource ? 0.62 : 1
				}}
			>
				<div className="flex items-center gap-2">
					{canReorder(layer) ? (
						<AdvancedOnly>
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
								className="grid shrink-0 place-items-center rounded-[var(--editor-radius-sm)] border"
								style={{
									width: 24,
									height: 24,
									background: UI_COLORS.overlay,
									borderColor: UI_COLORS.border,
									color: UI_COLORS.fgMute,
									touchAction: 'none'
								}}
								title={t.label_reorder_layer}
							>
								<GripVertical size={ICON_SIZE.sm} />
							</button>
						</AdvancedOnly>
					) : null}

					<div className="min-w-0 flex-1">
						<div
							className="truncate text-[12px] font-semibold"
							style={{ color: UI_COLORS.fg }}
						>
							{getLayerLabel(layer)}
						</div>
						<div
							className="truncate text-[10px] uppercase tracking-[0.12em]"
							style={{ color: UI_COLORS.fgMute, fontFamily: FONT.mono }}
						>
							{layer.kind} • {layer.type} • z {layer.zIndex}
						</div>
					</div>

					{isOverlayImage(layer) ? (
						<Button
							size="sm"
							density="compact"
							variant="ghost"
							onClick={() => store.setSelectedOverlayId(layer.id)}
						>
							Open
						</Button>
					) : null}

					{canToggle(layer) ? (
						<ToggleSwitch
							checked={layer.enabled}
							onChange={value => toggleLayer(layer, value)}
							size="sm"
							ariaLabel={`Toggle ${getLayerLabel(layer)}`}
						/>
					) : (
						<span
							className="rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.12em]"
							style={{
								borderColor: UI_COLORS.border,
								color: UI_COLORS.fgFaint,
								fontFamily: FONT.mono
							}}
						>
							Managed
						</span>
					)}
				</div>

				{canReorder(layer) ? (
					<AdvancedOnly>
						<div className="mt-2 grid grid-cols-[auto_auto_1fr] items-center gap-1.5">
							<IconButton
								size="sm"
								density="compact"
								onClick={() => moveLayer(layer, 'down')}
								disabled={!canMoveDown}
								title={t.label_move_down}
							>
								<ChevronDown size={ICON_SIZE.xs} />
							</IconButton>
							<IconButton
								size="sm"
								density="compact"
								onClick={() => moveLayer(layer, 'up')}
								disabled={!canMoveUp}
								title={t.label_move_up}
							>
								<ChevronUp size={ICON_SIZE.xs} />
							</IconButton>
							<Slider
								label={t.label_z_index}
								value={layer.zIndex}
								min={0}
								max={200}
								step={1}
								variant="compact"
								formatValue={formatInteger}
								onChange={value => updateZIndex(layer, value)}
							/>
						</div>
					</AdvancedOnly>
				) : null}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<SectionCard
				title={t.section_global_stack}
				subtitle={t.hint_restore_default_stack}
				action={
					<Button
						size="sm"
						density="compact"
						variant="secondary"
						onClick={restoreLayerDefaults}
						icon={<RotateCcw size={ICON_SIZE.xs} />}
					>
						Reset
					</Button>
				}
				density="compact"
			>
				<div className="flex flex-col gap-2">
					{renderGlobalBackgroundCard(globalBackgroundLayer)}
					{renderableLayers.map(renderLayerCard)}
				</div>
			</SectionCard>

			<SectionCard
				title={t.section_controller_layers}
				subtitle="HUD, diagnostics, and editor-only control layers"
				density="compact"
			>
				<div className="flex flex-col gap-2">
					{controllerLayers.map(renderLayerCard)}
				</div>
			</SectionCard>
		</div>
	);
}

function ModernOverlaysPanel({ onReset }: { onReset: () => void }) {
	const inputRef = useRef<HTMLInputElement>(null);
	const t = useT();
	const store = useWallpaperStore(
		useShallow(s => ({
			overlays: s.overlays,
			selectedOverlayId: s.selectedOverlayId,
			layerZIndices: s.layerZIndices,
			addOverlay: s.addOverlay,
			removeOverlay: s.removeOverlay,
			updateOverlay: s.updateOverlay,
			setSelectedOverlayId: s.setSelectedOverlayId
		}))
	);
	const selectedOverlay =
		store.overlays.find(
			overlay => overlay.id === store.selectedOverlayId
		) ?? null;
	const cropShapeLabels: Record<OverlayCropShape, string> = {
		rectangle: t.crop_rectangle,
		rounded: t.crop_rounded,
		circle: t.crop_circle,
		diamond: t.crop_diamond
	};

	async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
		const files = Array.from(event.target.files ?? []);
		if (files.length === 0) return;
		const builtInZ = [
			0,
			10,
			20,
			30,
			60,
			70,
			...Object.values(store.layerZIndices)
		].filter((value): value is number => Number.isFinite(value));
		const overlayZ = store.overlays
			.map(overlay => overlay.zIndex)
			.filter((value): value is number => Number.isFinite(value));
		const baseZIndex = Math.max(90, ...builtInZ, ...overlayZ) + 1;

		for (const [index, file] of files.entries()) {
			const assetId = await saveImage(file);
			const url = await loadImage(assetId);
			if (!url) continue;
			const dimensions = await getImageDimensions(url);
			const initialSize = fitOverlayBox(
				dimensions.width,
				dimensions.height
			);

			store.addOverlay({
				id: createOverlayId(),
				assetId,
				name: file.name.replace(/\.[^.]+$/, '') || 'Overlay',
				url,
				enabled: true,
				zIndex: baseZIndex + index,
				positionX: 0,
				positionY: 0,
				scale: 1,
				rotation: 0,
				opacity: 1,
				blendMode: 'normal',
				cropShape: 'rectangle',
				edgeFade: 0.08,
				edgeBlur: 0,
				edgeGlow: 0.12,
				width: initialSize.width,
				height: initialSize.height
			});
		}

		event.target.value = '';
	}

	async function removeOverlay(id: string, assetId: string) {
		await deleteImage(assetId);
		store.removeOverlay(id);
	}

	return (
		<div className="flex flex-col gap-2">
			<SectionCard
				title={t.section_overlays}
				subtitle={t.label_overlay_hint}
				action={
					<Button
						size="sm"
						density="compact"
						variant="primary"
						icon={<Plus size={ICON_SIZE.xs} />}
						onClick={() => inputRef.current?.click()}
					>
						{t.label_add_overlay}
					</Button>
				}
				density="compact"
			>
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					multiple
					onChange={handleFiles}
					className="hidden"
				/>

				{store.overlays.length === 0 ? (
					<div
						className="rounded-[var(--editor-radius-md)] border px-3 py-3 text-[12px]"
						style={{
							borderColor: UI_COLORS.border,
							background: UI_COLORS.raised,
							color: UI_COLORS.fgMute
						}}
					>
						{t.empty_overlays}
					</div>
				) : (
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
						{store.overlays
							.slice()
							.sort((a, b) => a.zIndex - b.zIndex)
							.map(overlay => {
								const selected =
									overlay.id === store.selectedOverlayId;
								return (
									<div
										key={overlay.id}
										className="rounded-[var(--editor-radius-md)] border p-2"
										style={{
											borderColor: selected
												? UI_COLORS.accentBorder
												: UI_COLORS.border,
											background: selected
												? UI_COLORS.accentSoft
												: UI_COLORS.raised
										}}
									>
										<button
											type="button"
											onClick={() =>
												store.setSelectedOverlayId(
													overlay.id
												)
											}
											className="flex w-full items-center gap-2 text-left"
											>
											{overlay.url ? (
												<img
													src={overlay.url}
													alt=""
													className="h-10 w-10 shrink-0 rounded-[var(--editor-radius-sm)] object-cover"
												/>
											) : (
												<span
													className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--editor-radius-sm)]"
													style={{
														background:
															UI_COLORS.overlay,
														color: UI_COLORS.fgMute
													}}
												>
													<ImageIcon
														size={ICON_SIZE.sm}
													/>
												</span>
											)}
											<span className="min-w-0 flex-1">
												<span
													className="block truncate text-[12px] font-semibold"
													style={{ color: UI_COLORS.fg }}
												>
													{overlay.name}
												</span>
												<span
													className="block truncate text-[10px] uppercase tracking-[0.12em]"
													style={{
														color: UI_COLORS.fgMute,
														fontFamily: FONT.mono
													}}
												>
													z {overlay.zIndex} •{' '}
													{overlay.enabled
														? t.label_enabled
														: 'Off'}
												</span>
											</span>
										</button>
										<div className="mt-2 flex items-center justify-between gap-2">
											<ToggleSwitch
												checked={overlay.enabled}
												onChange={value =>
													store.updateOverlay(
														overlay.id,
														{ enabled: value }
													)
												}
												size="sm"
												ariaLabel={`Toggle ${overlay.name}`}
											/>
											<IconButton
												size="sm"
												density="compact"
												variant="destructive"
												onClick={() =>
													void removeOverlay(
														overlay.id,
														overlay.assetId
													)
												}
												title="Delete overlay"
											>
												<Trash2 size={ICON_SIZE.xs} />
											</IconButton>
										</div>
									</div>
								);
							})}
					</div>
				)}
			</SectionCard>

			{selectedOverlay ? (
				<SectionCard
					title={t.label_selected_overlay}
					subtitle={selectedOverlay.name}
					action={
						<div className="flex items-center gap-1.5">
							<ToggleSwitch
								checked={selectedOverlay.enabled}
								onChange={value =>
									store.updateOverlay(selectedOverlay.id, {
										enabled: value
									})
								}
								size="sm"
								ariaLabel="Toggle selected overlay"
							/>
							<IconButton
								size="sm"
								density="compact"
								onClick={onReset}
								title="Reset selected overlay"
							>
								<RotateCcw size={ICON_SIZE.xs} />
							</IconButton>
						</div>
					}
					density="compact"
				>
					<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
						<Slider
							label={t.label_scale}
							value={selectedOverlay.scale}
							min={0.1}
							max={4}
							step={0.05}
							variant="compact"
							formatValue={formatDecimal}
							onChange={value =>
								store.updateOverlay(selectedOverlay.id, {
									scale: value
								})
							}
						/>
						<Slider
							label={t.label_opacity}
							value={selectedOverlay.opacity}
							min={0}
							max={1}
							step={0.01}
							variant="compact"
							formatValue={formatDecimal}
							onChange={value =>
								store.updateOverlay(selectedOverlay.id, {
									opacity: value
								})
							}
						/>
						<Slider
							label={t.label_position_x}
							value={selectedOverlay.positionX}
							min={-0.9}
							max={0.9}
							step={0.01}
							variant="compact"
							formatValue={formatDecimal}
							onChange={value =>
								store.updateOverlay(selectedOverlay.id, {
									positionX: value
								})
							}
						/>
						<Slider
							label={t.label_position_y}
							value={selectedOverlay.positionY}
							min={-0.9}
							max={0.9}
							step={0.01}
							variant="compact"
							formatValue={formatDecimal}
							onChange={value =>
								store.updateOverlay(selectedOverlay.id, {
									positionY: value
								})
							}
						/>
					</div>

					<AdvancedOnly>
						<div
							className="mt-2 border-t pt-2"
							style={{ borderColor: UI_COLORS.hairline }}
						>
							<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
								<Slider
									label={t.label_z_index}
									value={selectedOverlay.zIndex}
									min={0}
									max={200}
									step={1}
									variant="compact"
									formatValue={formatInteger}
									onChange={value =>
										store.updateOverlay(
											selectedOverlay.id,
											{ zIndex: value }
										)
									}
								/>
								<Slider
									label={t.label_rotation}
									value={selectedOverlay.rotation}
									min={-180}
									max={180}
									step={1}
									unit="deg"
									variant="compact"
									formatValue={formatInteger}
									onChange={value =>
										store.updateOverlay(
											selectedOverlay.id,
											{ rotation: value }
										)
									}
								/>
							</div>
							<div className="mt-2 grid grid-cols-1 gap-2">
								<div className="flex flex-col gap-1">
									<span
										className="text-[10px] uppercase tracking-[0.12em]"
										style={{
											color: UI_COLORS.fgMute,
											fontFamily: FONT.mono
										}}
									>
										{t.label_blend_mode}
									</span>
									<SegmentedControl<OverlayBlendMode>
										value={selectedOverlay.blendMode}
										onChange={value =>
											store.updateOverlay(
												selectedOverlay.id,
												{ blendMode: value }
											)
										}
										options={OVERLAY_BLEND_MODES.map(
											value => ({
												value,
												label: OVERLAY_BLEND_LABELS[value]
											})
										)}
										size="sm"
										density="compact"
										full
									/>
								</div>
								<div className="flex flex-col gap-1">
									<span
										className="text-[10px] uppercase tracking-[0.12em]"
										style={{
											color: UI_COLORS.fgMute,
											fontFamily: FONT.mono
										}}
									>
										{t.label_crop_shape}
									</span>
									<SegmentedControl<OverlayCropShape>
										value={selectedOverlay.cropShape}
										onChange={value =>
											store.updateOverlay(
												selectedOverlay.id,
												{ cropShape: value }
											)
										}
										options={OVERLAY_CROP_SHAPES.map(
											value => ({
												value,
												label: cropShapeLabels[value]
											})
										)}
										size="sm"
										density="compact"
										full
									/>
								</div>
							</div>
							<div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
								<Slider
									label={t.label_edge_fade}
									value={selectedOverlay.edgeFade}
									min={0}
									max={0.35}
									step={0.01}
									variant="compact"
									formatValue={formatDecimal}
									onChange={value =>
										store.updateOverlay(
											selectedOverlay.id,
											{ edgeFade: value }
										)
									}
								/>
								<Slider
									label={t.label_edge_blur}
									value={selectedOverlay.edgeBlur}
									min={0}
									max={24}
									step={0.5}
									unit="px"
									variant="compact"
									formatValue={formatDecimal}
									onChange={value =>
										store.updateOverlay(
											selectedOverlay.id,
											{ edgeBlur: value }
										)
									}
								/>
								<Slider
									label={t.label_edge_glow}
									value={selectedOverlay.edgeGlow}
									min={0}
									max={1}
									step={0.01}
									variant="compact"
									formatValue={formatDecimal}
									onChange={value =>
										store.updateOverlay(
											selectedOverlay.id,
											{ edgeGlow: value }
										)
									}
								/>
							</div>
						</div>
					</AdvancedOnly>
				</SectionCard>
			) : null}
		</div>
	);
}
