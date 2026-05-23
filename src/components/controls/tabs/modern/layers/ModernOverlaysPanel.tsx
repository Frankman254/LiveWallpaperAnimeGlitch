import { useRef, type ChangeEvent } from 'react';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { deleteImage, loadImage, saveImage } from '@/lib/db/imageDb';
import { useDialog } from '@/components/controls/ui/DialogProvider';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';
import {
	Button,
	IconButton,
	SectionCard,
	ToggleSwitch,
	UI_COLORS,
	FONT,
	ICON_SIZE
} from '@/ui';
import ModernOverlayInspector from './ModernOverlayInspector';

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

export default function ModernOverlaysPanel({
	onReset
}: {
	onReset: () => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const t = useT();
	const { confirm } = useDialog();
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
				height: initialSize.height,
				audioOpacityReactive: true,
				audioOpacityAmount: 0.35,
				audioOpacityInvert: false,
				audioOpacityChannel: 'kick'
			});
		}

		event.target.value = '';
	}

	async function removeOverlay(id: string, assetId: string, name: string) {
		const ok = await confirm({
			title: 'Delete overlay?',
			message: `Permanently delete "${name}"? The overlay configuration and its image asset will be removed. This cannot be undone.`,
			confirmLabel: 'Delete',
			cancelLabel: t.label_cancel ?? 'Cancel',
			tone: 'danger'
		});
		if (!ok) return;
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
													style={{
														color: UI_COLORS.fg
													}}
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
														overlay.assetId,
														overlay.name
													)
												}
												title="Delete overlay (with confirmation)"
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

			<ModernOverlayInspector
				selectedOverlay={selectedOverlay}
				onReset={onReset}
				onUpdateOverlay={store.updateOverlay}
			/>
		</div>
	);
}
