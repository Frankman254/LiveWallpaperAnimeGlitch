import { RotateCcw } from 'lucide-react';
import { AdvancedOnly } from '@/components/controls/UIMode';
import { useDialog } from '@/components/controls/ui/DialogProvider';
import { confirmResetOverlayLayout } from '@/components/controls/ui/confirmCritical';
import { useT } from '@/lib/i18n';
import type {
	OverlayBlendMode,
	OverlayCropShape,
	OverlayImageItem
} from '@/types/wallpaper';
import {
	IconButton,
	SectionCard,
	SegmentedControl,
	Slider,
	ToggleSwitch,
	UI_COLORS,
	FONT,
	ICON_SIZE
} from '@/ui';

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

function formatDecimal(value: number): string {
	return value.toFixed(2);
}

function formatInteger(value: number): string {
	return Math.round(value).toString();
}

type ModernOverlayInspectorProps = {
	selectedOverlay: OverlayImageItem | null;
	onReset: () => void;
	onUpdateOverlay: (id: string, patch: Partial<OverlayImageItem>) => void;
};

export default function ModernOverlayInspector({
	selectedOverlay,
	onReset,
	onUpdateOverlay
}: ModernOverlayInspectorProps) {
	const t = useT();
	const { confirm } = useDialog();
	if (!selectedOverlay) return null;
	const overlay = selectedOverlay;

	async function handleResetOverlay() {
		if (!(await confirmResetOverlayLayout(confirm, t, overlay.name))) {
			return;
		}
		onReset();
	}

	const cropShapeLabels: Record<OverlayCropShape, string> = {
		rectangle: t.crop_rectangle,
		rounded: t.crop_rounded,
		circle: t.crop_circle,
		diamond: t.crop_diamond
	};

	return (
		<SectionCard
			title={t.label_selected_overlay}
			subtitle={selectedOverlay.name}
			action={
				<div className="flex items-center gap-1.5">
					<ToggleSwitch
						checked={selectedOverlay.enabled}
						onChange={value =>
							onUpdateOverlay(selectedOverlay.id, {
								enabled: value
							})
						}
						size="sm"
						ariaLabel="Toggle selected overlay"
					/>
					<IconButton
						size="sm"
						density="compact"
						onClick={() => void handleResetOverlay()}
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
						onUpdateOverlay(selectedOverlay.id, {
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
						onUpdateOverlay(selectedOverlay.id, {
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
						onUpdateOverlay(selectedOverlay.id, {
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
						onUpdateOverlay(selectedOverlay.id, {
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
								onUpdateOverlay(selectedOverlay.id, {
									zIndex: value
								})
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
								onUpdateOverlay(selectedOverlay.id, {
									rotation: value
								})
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
									onUpdateOverlay(selectedOverlay.id, {
										blendMode: value
									})
								}
								options={OVERLAY_BLEND_MODES.map(value => ({
									value,
									label: OVERLAY_BLEND_LABELS[value]
								}))}
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
									onUpdateOverlay(selectedOverlay.id, {
										cropShape: value
									})
								}
								options={OVERLAY_CROP_SHAPES.map(value => ({
									value,
									label: cropShapeLabels[value]
								}))}
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
								onUpdateOverlay(selectedOverlay.id, {
									edgeFade: value
								})
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
								onUpdateOverlay(selectedOverlay.id, {
									edgeBlur: value
								})
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
								onUpdateOverlay(selectedOverlay.id, {
									edgeGlow: value
								})
							}
						/>
					</div>
				</div>
			</AdvancedOnly>
		</SectionCard>
	);
}
