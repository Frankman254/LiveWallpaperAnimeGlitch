import type { DragEvent, PointerEvent } from 'react';
import {
	ChevronDown,
	ChevronUp,
	GripVertical
} from 'lucide-react';
import { AdvancedOnly } from '@/components/controls/UIMode';
import { useT } from '@/lib/i18n';
import type { WallpaperLayer } from '@/types/layers';
import {
	Button,
	IconButton,
	Slider,
	ToggleSwitch,
	UI_COLORS,
	FONT,
	ICON_SIZE
} from '@/ui';
import {
	formatInteger,
	isOverlayImage,
	type SyntheticLayer
} from './layerStackHelpers';

type ModernGlobalBackgroundCardProps = {
	layer: SyntheticLayer;
	onToggle: (enabled: boolean) => void;
};

export function ModernGlobalBackgroundCard({
	layer,
	onToggle
}: ModernGlobalBackgroundCardProps) {
	const t = useT();

	return (
		<div
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
					onChange={onToggle}
					size="sm"
					ariaLabel="Toggle global background"
				/>
			</div>
			<div className="mt-1 text-[11px]" style={{ color: UI_COLORS.fgMute }}>
				{layer.hasAsset ? t.label_layer_order_locked : t.label_no_image_loaded}
			</div>
		</div>
	);
}

type ModernLayerCardProps = {
	layer: WallpaperLayer;
	label: string;
	canReorder: boolean;
	canToggle: boolean;
	canMoveUp: boolean;
	canMoveDown: boolean;
	isDragSource: boolean;
	isDropTarget: boolean;
	onPointerDragStart: (
		layerId: string,
		event: PointerEvent<HTMLButtonElement>
	) => void;
	onNativeDragStart: (
		layerId: string,
		event: DragEvent<HTMLDivElement>
	) => void;
	onNativeDragOver: (
		layerId: string,
		event: DragEvent<HTMLDivElement>
	) => void;
	onNativeDragLeave: (layerId: string) => void;
	onNativeDrop: (
		layerId: string,
		event: DragEvent<HTMLDivElement>
	) => void;
	onNativeDragEnd: () => void;
	onOpenOverlay: (id: string) => void;
	onToggle: (layer: WallpaperLayer, enabled: boolean) => void;
	onMove: (layer: WallpaperLayer, direction: 'up' | 'down') => void;
	onUpdateZIndex: (layer: WallpaperLayer, zIndex: number) => void;
};

export function ModernLayerCard({
	layer,
	label,
	canReorder,
	canToggle,
	canMoveUp,
	canMoveDown,
	isDragSource,
	isDropTarget,
	onPointerDragStart,
	onNativeDragStart,
	onNativeDragOver,
	onNativeDragLeave,
	onNativeDrop,
	onNativeDragEnd,
	onOpenOverlay,
	onToggle,
	onMove,
	onUpdateZIndex
}: ModernLayerCardProps) {
	const t = useT();

	return (
		<div
			data-layer-card-id={layer.id}
			draggable={canReorder}
			onDragStart={event => onNativeDragStart(layer.id, event)}
			onDragOver={event => onNativeDragOver(layer.id, event)}
			onDragLeave={() => onNativeDragLeave(layer.id)}
			onDrop={event => onNativeDrop(layer.id, event)}
			onDragEnd={onNativeDragEnd}
			className="rounded-[var(--editor-radius-md)] border px-3 py-2 transition-opacity"
			style={{
				borderColor: isDropTarget
					? UI_COLORS.accentBorder
					: UI_COLORS.border,
				background: isDropTarget ? UI_COLORS.accentSoft : UI_COLORS.raised,
				opacity: isDragSource ? 0.62 : 1
			}}
		>
			<div className="flex items-center gap-2">
				{canReorder ? (
					<AdvancedOnly>
						<button
							type="button"
							onPointerDown={event =>
								onPointerDragStart(layer.id, event)
							}
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
						{label}
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
						onClick={() => onOpenOverlay(layer.id)}
					>
						Open
					</Button>
				) : null}

				{canToggle ? (
					<ToggleSwitch
						checked={layer.enabled}
						onChange={value => onToggle(layer, value)}
						size="sm"
						ariaLabel={`Toggle ${label}`}
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

			{canReorder ? (
				<AdvancedOnly>
					<div className="mt-2 grid grid-cols-[auto_auto_1fr] items-center gap-1.5">
						<IconButton
							size="sm"
							density="compact"
							onClick={() => onMove(layer, 'up')}
							disabled={!canMoveUp}
							title={t.label_move_up}
						>
							<ChevronUp size={ICON_SIZE.xs} />
						</IconButton>
						<IconButton
							size="sm"
							density="compact"
							onClick={() => onMove(layer, 'down')}
							disabled={!canMoveDown}
							title={t.label_move_down}
						>
							<ChevronDown size={ICON_SIZE.xs} />
						</IconButton>
						<Slider
							label={t.label_z_index}
							value={layer.zIndex}
							min={0}
							max={200}
							step={1}
							variant="compact"
							formatValue={formatInteger}
							onChange={value => onUpdateZIndex(layer, value)}
						/>
					</div>
				</AdvancedOnly>
			) : null}
		</div>
	);
}
