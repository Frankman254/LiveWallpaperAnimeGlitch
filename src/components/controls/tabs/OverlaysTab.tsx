import { useRef } from 'react';
import { deleteImage, loadImage, saveImage } from '@/lib/db/imageDb';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';
import SliderControl from '@/components/controls/SliderControl';
import ToggleControl from '@/components/controls/ToggleControl';
import ResetButton from '@/components/controls/ui/ResetButton';
import SectionDivider from '@/components/controls/ui/SectionDivider';
import EnumButtons from '@/components/controls/ui/EnumButtons';
import type { OverlayBlendMode, OverlayCropShape } from '@/types/wallpaper';

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

export default function OverlaysTab({ onReset }: { onReset: () => void }) {
	const inputRef = useRef<HTMLInputElement>(null);
	const t = useT();
	const store = useWallpaperStore();
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

	async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
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
		<>
			<ResetButton label={t.reset_tab} onClick={onReset} />

			<SectionDivider label={t.section_overlays} />
			<div className="flex flex-col gap-2">
				<button
					onClick={() => inputRef.current?.click()}
					className="rounded border px-3 py-1 text-xs transition-colors"
					style={{
						background: 'var(--editor-button-bg)',
						borderColor: 'var(--editor-button-border)',
						color: 'var(--editor-button-fg)'
					}}
				>
					{t.label_add_overlay}
				</button>
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					multiple
					onChange={handleFiles}
					className="hidden"
				/>
				<span
					className="text-[11px]"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					{t.label_overlay_hint}
				</span>
			</div>

			{store.overlays.length === 0 ? (
				<div
					className="text-xs"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					{t.empty_overlays}
				</div>
			) : (
				<div className="flex flex-col gap-2">
					{store.overlays
						.slice()
						.sort((a, b) => a.zIndex - b.zIndex)
						.map(overlay => {
							const selected =
								overlay.id === store.selectedOverlayId;
							return (
								<div
									key={overlay.id}
									className="rounded border px-3 py-2 transition-colors"
									style={{
										borderColor: selected
											? 'var(--editor-tag-border)'
											: 'var(--editor-accent-border)',
										background: selected
											? 'var(--editor-tag-bg)'
											: 'var(--editor-surface-bg)'
									}}
								>
									<div className="flex items-center gap-2">
										<button
											onClick={() =>
												store.setSelectedOverlayId(
													overlay.id
												)
											}
											className="flex-1 text-left"
										>
											<div
												className="text-xs"
												style={{
													color:
														'var(--editor-accent-soft)'
												}}
											>
												{overlay.name}
											</div>
											<div
												className="text-[11px]"
												style={{
													color:
														'var(--editor-accent-muted)'
												}}
											>
												z {overlay.zIndex} •{' '}
												{overlay.enabled
													? t.label_enabled
													: 'Off'}
											</div>
										</button>
										<button
											onClick={() =>
												void removeOverlay(
													overlay.id,
													overlay.assetId
												)
											}
											className="px-2 py-1 text-[11px] rounded border border-red-900 text-red-400 hover:border-red-600 transition-colors"
										>
											×
										</button>
									</div>
								</div>
							);
						})}
				</div>
			)}

			{selectedOverlay && (
				<>
					<SectionDivider label={t.label_selected_overlay} />
					<ToggleControl
						label={t.label_enabled}
						value={selectedOverlay.enabled}
						onChange={value =>
							store.updateOverlay(selectedOverlay.id, {
								enabled: value
							})
						}
					/>
					{selectedOverlay.enabled && (
						<>
							<SliderControl
								label={t.label_z_index}
								value={selectedOverlay.zIndex}
								min={0}
								max={200}
								step={1}
								onChange={value =>
									store.updateOverlay(selectedOverlay.id, {
										zIndex: value
									})
								}
							/>
							<SliderControl
								label={t.label_scale}
								value={selectedOverlay.scale}
								min={0.1}
								max={4}
								step={0.05}
								onChange={value =>
									store.updateOverlay(selectedOverlay.id, {
										scale: value
									})
								}
							/>
							<SliderControl
								label={t.label_rotation}
								value={selectedOverlay.rotation}
								min={-180}
								max={180}
								step={1}
								onChange={value =>
									store.updateOverlay(selectedOverlay.id, {
										rotation: value
									})
								}
								unit="deg"
							/>
							<SliderControl
								label={t.label_opacity}
								value={selectedOverlay.opacity}
								min={0}
								max={1}
								step={0.01}
								onChange={value =>
									store.updateOverlay(selectedOverlay.id, {
										opacity: value
									})
								}
							/>
							<div className="flex flex-col gap-1">
								<span
									className="text-xs"
									style={{ color: 'var(--editor-accent-soft)' }}
								>
									{t.label_blend_mode}
								</span>
								<EnumButtons<OverlayBlendMode>
									options={OVERLAY_BLEND_MODES}
									value={selectedOverlay.blendMode}
									onChange={value =>
										store.updateOverlay(selectedOverlay.id, {
											blendMode: value
										})
									}
									labels={OVERLAY_BLEND_LABELS}
								/>
							</div>
							<div className="flex flex-col gap-1">
								<span
									className="text-xs"
									style={{ color: 'var(--editor-accent-soft)' }}
								>
									{t.label_crop_shape}
								</span>
								<EnumButtons<OverlayCropShape>
									options={OVERLAY_CROP_SHAPES}
									value={selectedOverlay.cropShape}
									onChange={value =>
										store.updateOverlay(selectedOverlay.id, {
											cropShape: value
										})
									}
									labels={cropShapeLabels}
								/>
							</div>
							<SliderControl
								label={t.label_edge_fade}
								value={selectedOverlay.edgeFade}
								min={0}
								max={0.35}
								step={0.01}
								onChange={value =>
									store.updateOverlay(selectedOverlay.id, {
										edgeFade: value
									})
								}
							/>
							<SliderControl
								label={t.label_edge_blur}
								value={selectedOverlay.edgeBlur}
								min={0}
								max={24}
								step={0.5}
								unit="px"
								onChange={value =>
									store.updateOverlay(selectedOverlay.id, {
										edgeBlur: value
									})
								}
							/>
							<SliderControl
								label={t.label_edge_glow}
								value={selectedOverlay.edgeGlow}
								min={0}
								max={1}
								step={0.01}
								onChange={value =>
									store.updateOverlay(selectedOverlay.id, {
										edgeGlow: value
									})
								}
							/>
							<SliderControl
								label={t.label_position_x}
								value={selectedOverlay.positionX}
								min={-0.9}
								max={0.9}
								step={0.01}
								onChange={value =>
									store.updateOverlay(selectedOverlay.id, {
										positionX: value
									})
								}
							/>
							<SliderControl
								label={t.label_position_y}
								value={selectedOverlay.positionY}
								min={-0.9}
								max={0.9}
								step={0.01}
								onChange={value =>
									store.updateOverlay(selectedOverlay.id, {
										positionY: value
									})
								}
							/>
						</>
					)}
				</>
			)}
		</>
	);
}
