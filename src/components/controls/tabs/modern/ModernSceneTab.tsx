import { useEffect, useRef, useState } from 'react';
import { Plus, Sparkles, RotateCcw, X, Pencil, Check } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { resolveEditorImagePreviewUrl } from '@/lib/editorImagePreviews';
import {
	SectionCard,
	Button,
	IconButton,
	Select,
	SegmentedControl,
	FloatingPanel,
	UI_COLORS,
	FONT,
	ICON_SIZE
} from '@/ui';
import type { EditorImagePreviewQuality } from '@/types/wallpaper';
import { useIsSimple } from '../../UIMode';
import {
	DiscoveryOnboardingCard,
	type DiscoveryRequestMainTab
} from '../../DiscoveryOnboardingCard';

type SceneSlotFeatureKey =
	| 'spectrumSlotIndex'
	| 'looksSlotIndex'
	| 'particlesSlotIndex'
	| 'rainSlotIndex'
	| 'logoSlotIndex'
	| 'trackTitleSlotIndex';

const ALL_FEATURE_COLUMNS: Array<{
	key: SceneSlotFeatureKey;
	label: string;
}> = [
	{ key: 'spectrumSlotIndex', label: 'Spectrum' },
	{ key: 'looksSlotIndex', label: 'Looks' },
	{ key: 'particlesSlotIndex', label: 'Particles' },
	{ key: 'rainSlotIndex', label: 'Rain' },
	{ key: 'logoSlotIndex', label: 'Logo' },
	{ key: 'trackTitleSlotIndex', label: 'Track' }
];

const SIMPLE_KEYS: SceneSlotFeatureKey[] = [
	'spectrumSlotIndex',
	'looksSlotIndex'
];

export default function ModernSceneTab({
	onReset,
	onRequestMainTab
}: {
	onReset: () => void;
	onRequestMainTab?: (tab: DiscoveryRequestMainTab) => void;
}) {
	const t = useT();
	const store = useWallpaperStore(
		useShallow(s => ({
			sceneSlots: s.sceneSlots,
			activeSceneSlotId: s.activeSceneSlotId,
			spectrumProfileSlots: s.spectrumProfileSlots,
			looksProfileSlots: s.looksProfileSlots,
			particlesProfileSlots: s.particlesProfileSlots,
			rainProfileSlots: s.rainProfileSlots,
			logoProfileSlots: s.logoProfileSlots,
			trackTitleProfileSlots: s.trackTitleProfileSlots,
			backgroundImages: s.backgroundImages,
			activeImageId: s.activeImageId,
			editorImagePreviewQuality: s.editorImagePreviewQuality,
			removeSceneSlot: s.removeSceneSlot,
			renameSceneSlot: s.renameSceneSlot,
			applySceneSlotById: s.applySceneSlotById,
			updateSceneSlot: s.updateSceneSlot,
			setBackgroundImageSceneSlotId: s.setBackgroundImageSceneSlotId,
			setActiveImageId: s.setActiveImageId,
			addSceneSlot: s.addSceneSlot,
			surpriseMe: s.surpriseMe,
			setEditorImagePreviewQuality: s.setEditorImagePreviewQuality
		}))
	);
	const isSimple = useIsSimple();

	const [renameId, setRenameId] = useState<string | null>(null);
	const [renameDraft, setRenameDraft] = useState('');
	const [pendingDeleteSceneId, setPendingDeleteSceneId] =
		useState<string | null>(null);
	const [openImageId, setOpenImageId] = useState<string | null>(null);
	const popoverRef = useRef<HTMLDivElement | null>(null);

	const activeScene =
		store.sceneSlots.find(s => s.id === store.activeSceneSlotId) ?? null;

	const featureColumns = ALL_FEATURE_COLUMNS.map(col => ({
		...col,
		slots: (() => {
			switch (col.key) {
				case 'spectrumSlotIndex':
					return store.spectrumProfileSlots;
				case 'looksSlotIndex':
					return store.looksProfileSlots;
				case 'particlesSlotIndex':
					return store.particlesProfileSlots;
				case 'rainSlotIndex':
					return store.rainProfileSlots;
				case 'logoSlotIndex':
					return store.logoProfileSlots;
				case 'trackTitleSlotIndex':
					return store.trackTitleProfileSlots;
			}
		})()
	}));

	const visibleColumns = isSimple
		? featureColumns.filter(c => SIMPLE_KEYS.includes(c.key))
		: featureColumns;
	const hiddenColumnCount = featureColumns.length - visibleColumns.length;

	useEffect(() => {
		if (!openImageId) return;
		const handlePointer = (event: PointerEvent) => {
			if (popoverRef.current?.contains(event.target as Node)) return;
			setOpenImageId(null);
		};
		const handleKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpenImageId(null);
		};
		window.addEventListener('pointerdown', handlePointer);
		window.addEventListener('keydown', handleKey);
		return () => {
			window.removeEventListener('pointerdown', handlePointer);
			window.removeEventListener('keydown', handleKey);
		};
	}, [openImageId]);

	function confirmSceneDelete(sceneId: string) {
		store.removeSceneSlot(sceneId);
		if (renameId === sceneId) setRenameId(null);
		setPendingDeleteSceneId(null);
	}

	function assignSceneToImage(assetId: string, sceneSlotId: string | null) {
		store.setBackgroundImageSceneSlotId(assetId, sceneSlotId);
		store.setActiveImageId(assetId);
		setOpenImageId(null);
	}

	const scenesAction = (
		<div className="flex items-center gap-1">
			<IconButton
				size="sm"
				onClick={() => store.addSceneSlot()}
				title="New scene"
			>
				<Plus size={ICON_SIZE.sm} />
			</IconButton>
			<IconButton
				size="sm"
				onClick={() => store.surpriseMe()}
				title={t.label_surprise_me}
			>
				<Sparkles size={ICON_SIZE.sm} />
			</IconButton>
			<IconButton
				size="sm"
				onClick={onReset}
				title="Reset scene bindings"
			>
				<RotateCcw size={ICON_SIZE.sm} />
			</IconButton>
		</div>
	);

	return (
		<div className="flex flex-col gap-2">
			<DiscoveryOnboardingCard onRequestMainTab={onRequestMainTab} />

			<SectionCard
				title="Scenes"
				subtitle={
					activeScene ? `Active: ${activeScene.name}` : 'Click to activate'
				}
				action={scenesAction}
				padded={false}
			>
				{store.sceneSlots.length === 0 ? (
					<p
						className="px-4 py-3 text-[11px]"
						style={{ color: UI_COLORS.fgMute }}
					>
						No scenes yet. Click + to create one.
					</p>
				) : (
					<div className="flex flex-col">
						{store.sceneSlots.map((scene, idx) => {
							const isActive = store.activeSceneSlotId === scene.id;
							const isRenaming = renameId === scene.id;
							const isPendingDelete =
								pendingDeleteSceneId === scene.id;
							const boundCount = ALL_FEATURE_COLUMNS.filter(
								col =>
									scene[col.key] !== null &&
									scene[col.key] !== undefined
							).length;

							return (
								<div
									key={scene.id}
									className="flex items-center gap-2 px-4 py-2"
									style={{
										borderTop:
											idx > 0
												? `1px solid ${UI_COLORS.hairline}`
												: undefined,
										background: isActive
											? UI_COLORS.accentSoft
											: 'transparent'
									}}
								>
									<button
										type="button"
										onClick={() =>
											store.applySceneSlotById(scene.id)
										}
										title="Activate scene"
										className="shrink-0 grid place-items-center"
										style={{
											width: 22,
											height: 22,
											borderRadius: 999,
											border: `2px solid ${isActive ? UI_COLORS.accent : UI_COLORS.border}`,
											background: isActive
												? UI_COLORS.accent
												: 'transparent',
											cursor: 'pointer'
										}}
									>
										{isActive ? (
											<span
												style={{
													width: 8,
													height: 8,
													borderRadius: 999,
													background: UI_COLORS.accentFg
												}}
											/>
										) : null}
									</button>

									{isRenaming ? (
										<>
											<input
												value={renameDraft}
												onChange={e =>
													setRenameDraft(e.target.value)
												}
												onKeyDown={e => {
													if (e.key === 'Enter') {
														store.renameSceneSlot(
															scene.id,
															renameDraft
														);
														setRenameId(null);
													}
													if (e.key === 'Escape')
														setRenameId(null);
												}}
												autoFocus
												className="min-w-0 flex-1 rounded px-2 py-1 text-[12px] outline-none"
												style={{
													border: `1px solid ${UI_COLORS.accent}`,
													background: UI_COLORS.overlay,
													color: UI_COLORS.fg
												}}
											/>
											<IconButton
												size="sm"
												onClick={() => {
													store.renameSceneSlot(
														scene.id,
														renameDraft
													);
													setRenameId(null);
												}}
												title="Save"
											>
												<Check size={ICON_SIZE.sm} />
											</IconButton>
											<IconButton
												size="sm"
												onClick={() => setRenameId(null)}
												title="Cancel"
											>
												<X size={ICON_SIZE.sm} />
											</IconButton>
										</>
									) : (
										<>
											<button
												type="button"
												onClick={() =>
													store.applySceneSlotById(scene.id)
												}
												onDoubleClick={() => {
													setRenameId(scene.id);
													setRenameDraft(scene.name);
												}}
												className="min-w-0 flex-1 truncate text-left text-[13px] font-medium"
												style={{
													color: isActive
														? UI_COLORS.accent
														: UI_COLORS.fg,
													background: 'transparent',
													border: 0,
													cursor: 'pointer'
												}}
												title="Click to activate · Double-click to rename"
											>
												{scene.name}
											</button>
											<span
												className="rounded px-1.5 py-0.5 text-[9px] uppercase tracking-widest tabular-nums"
												style={{
													background: UI_COLORS.accentSoft,
													color: UI_COLORS.accent,
													border: `1px solid ${UI_COLORS.accentBorder}`,
													fontFamily: FONT.mono
												}}
											>
												{boundCount} bound
											</span>
											<IconButton
												size="sm"
												onClick={() => {
													setRenameId(scene.id);
													setRenameDraft(scene.name);
												}}
												title="Rename"
											>
												<Pencil size={ICON_SIZE.sm} />
											</IconButton>
											{isPendingDelete ? (
												<div className="flex items-center gap-1">
													<Button
														variant="destructive"
														size="sm"
														onClick={() =>
															confirmSceneDelete(scene.id)
														}
													>
														Delete
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															setPendingDeleteSceneId(null)
														}
													>
														Cancel
													</Button>
												</div>
											) : (
												<IconButton
													size="sm"
													onClick={() =>
														setPendingDeleteSceneId(scene.id)
													}
													title="Delete scene"
												>
													<X size={ICON_SIZE.sm} />
												</IconButton>
											)}
										</>
									)}
								</div>
							);
						})}
					</div>
				)}
			</SectionCard>

			{activeScene && (
				<SectionCard
					title="Bindings"
					subtitle={`What each subsystem uses when "${activeScene.name}" activates`}
					padded={false}
				>
					<div className="flex flex-col gap-2 px-4 py-3">
						{visibleColumns.map(col => {
							const current = activeScene[col.key];
							const options = col.slots
								.map((s, idx) => ({
									idx,
									name: s.name,
									values: s.values
								}))
								.filter(o => o.values !== null)
								.map(o => ({ value: o.idx, label: o.name }));
							return (
								<div
									key={col.key}
									className="flex items-center justify-between gap-3"
								>
									<span
										className="text-[12px] font-medium"
										style={{ color: UI_COLORS.fg }}
									>
										{col.label}
									</span>
									<div style={{ minWidth: 180 }}>
										<Select<number>
											value={current}
											options={options}
											placeholder="None"
											size="sm"
											full
											ariaLabel={`${col.label} slot`}
											onChange={next => {
												store.updateSceneSlot(activeScene.id, {
													[col.key]: next
												} as Partial<typeof activeScene>);
												store.applySceneSlotById(activeScene.id);
											}}
										/>
									</div>
								</div>
							);
						})}
						{isSimple && hiddenColumnCount > 0 && (
							<p
								className="text-[10px]"
								style={{ color: UI_COLORS.fgMute }}
							>
								{hiddenColumnCount} more subsystems available in
								Advanced mode.
							</p>
						)}
					</div>
				</SectionCard>
			)}

			<SectionCard
				title="Sequence"
				subtitle="Per-image scene assignment"
				padded={false}
				action={
					<SegmentedControl<EditorImagePreviewQuality>
						size="sm"
						value={store.editorImagePreviewQuality}
						onChange={store.setEditorImagePreviewQuality}
						ariaLabel="Thumbnail quality"
						options={[
							{ value: 'optimized', label: 'Optimized' },
							{ value: 'original', label: 'Original' }
						]}
					/>
				}
			>
				<div className="px-4 py-3">
					{store.backgroundImages.length === 0 ? (
						<p
							className="text-[11px]"
							style={{ color: UI_COLORS.fgMute }}
						>
							Add images in Layers → Background pool first.
						</p>
					) : (
						<div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
							{store.backgroundImages.map((image, index) => {
								const isActive =
									image.assetId === store.activeImageId;
								const isOpen = openImageId === image.assetId;
								const assignedScene = store.sceneSlots.find(
									s => s.id === image.sceneSlotId
								);
								return (
									<div
										key={image.assetId}
										className="relative flex flex-col gap-1"
									>
										<button
											type="button"
											onClick={() => {
												store.setActiveImageId(image.assetId);
												setOpenImageId(
													isOpen ? null : image.assetId
												);
											}}
											className="relative overflow-hidden"
											style={{
												width: '100%',
												aspectRatio: '16 / 10',
												border: `1px solid ${isActive ? UI_COLORS.accent : isOpen ? UI_COLORS.accent : UI_COLORS.border}`,
												borderRadius:
													'var(--editor-radius-md)',
												background: UI_COLORS.overlay,
												cursor: 'pointer',
												boxShadow: isActive
													? `0 0 0 1px ${UI_COLORS.accent}, 0 4px 12px ${UI_COLORS.accentSoft}`
													: undefined
											}}
											title={`Image ${index + 1}`}
										>
											<img
												src={resolveEditorImagePreviewUrl(
													image,
													store.editorImagePreviewQuality,
													isActive
												)}
												alt={`Image ${index + 1}`}
												className="block h-full w-full object-cover"
												loading="lazy"
												decoding="async"
											/>
											{assignedScene ? (
												<div
													className="absolute bottom-0 left-0 right-0 truncate px-1.5 py-0.5 text-[9px] font-medium"
													style={{
														background:
															'linear-gradient(0deg, rgba(0,0,0,0.85), rgba(0,0,0,0.3))',
														color: UI_COLORS.fg
													}}
												>
													{assignedScene.name}
												</div>
											) : null}
										</button>
										<div ref={popoverRef}>
											<FloatingPanel
												open={isOpen}
												onClose={() => setOpenImageId(null)}
												anchor="bottom"
												offset={4}
												style={{ padding: 6, width: 'auto' }}
											>
												<div className="flex flex-col gap-1 min-w-[160px]">
													<Button
														variant={
															image.sceneSlotId === null
																? 'primary'
																: 'secondary'
														}
														size="sm"
														full
														onClick={() =>
															assignSceneToImage(
																image.assetId,
																null
															)
														}
													>
														None
													</Button>
													{store.sceneSlots.map(scene => (
														<Button
															key={scene.id}
															variant={
																image.sceneSlotId ===
																scene.id
																	? 'primary'
																	: 'secondary'
															}
															size="sm"
															full
															onClick={() =>
																assignSceneToImage(
																	image.assetId,
																	scene.id
																)
															}
														>
															{scene.name}
														</Button>
													))}
												</div>
											</FloatingPanel>
										</div>
										<span
											className="text-[10px] tabular-nums"
											style={{
												color: isActive
													? UI_COLORS.accent
													: UI_COLORS.fgMute,
												fontFamily: FONT.mono
											}}
										>
											#{index + 1}
											{isActive ? ' ●' : ''}
										</span>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</SectionCard>
		</div>
	);
}
