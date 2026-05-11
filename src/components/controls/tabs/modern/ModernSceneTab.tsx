import { useEffect, useRef, useState } from 'react';
import { Plus, Sparkles, RotateCcw, X, Pencil } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import Card from '../../ui/Card';
import Field from '../../ui/Field';
import SectionLabel from '../../ui/SectionLabel';
import Button from '../../ui/Button';
import IconButton from '../../ui/IconButton';
import ThemedSelect from '../../ui/ThemedSelect';
import { useIsSimple } from '../../UIMode';
import {
	DiscoveryOnboardingCard,
	type DiscoveryRequestMainTab
} from '../../DiscoveryOnboardingCard';
import { ICON_SIZE } from '../../ui/designTokens';

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
			removeSceneSlot: s.removeSceneSlot,
			renameSceneSlot: s.renameSceneSlot,
			applySceneSlotById: s.applySceneSlotById,
			updateSceneSlot: s.updateSceneSlot,
			setBackgroundImageSceneSlotId: s.setBackgroundImageSceneSlotId,
			addSceneSlot: s.addSceneSlot,
			surpriseMe: s.surpriseMe
		}))
	);
	const isSimple = useIsSimple();

	const [renameId, setRenameId] = useState<string | null>(null);
	const [renameDraft, setRenameDraft] = useState('');
	const [pendingDeleteSceneId, setPendingDeleteSceneId] =
		useState<string | null>(null);
	const [openImageId, setOpenImageId] = useState<string | null>(null);
	const openImagePopoverRef = useRef<HTMLDivElement | null>(null);

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
		const handlePointerDown = (event: PointerEvent) => {
			if (openImagePopoverRef.current?.contains(event.target as Node))
				return;
			setOpenImageId(null);
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpenImageId(null);
		};
		window.addEventListener('pointerdown', handlePointerDown);
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('pointerdown', handlePointerDown);
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [openImageId]);

	function confirmSceneDelete(sceneId: string) {
		store.removeSceneSlot(sceneId);
		if (renameId === sceneId) setRenameId(null);
		setPendingDeleteSceneId(null);
	}

	function assignSceneToImage(assetId: string, sceneSlotId: string | null) {
		store.setBackgroundImageSceneSlotId(assetId, sceneSlotId);
		if (assetId === store.activeImageId && sceneSlotId) {
			store.applySceneSlotById(sceneSlotId);
		}
		setOpenImageId(null);
	}

	const scenesHeaderAction = (
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
			<IconButton size="sm" onClick={onReset} title="Reset scene bindings">
				<RotateCcw size={ICON_SIZE.sm} />
			</IconButton>
		</div>
	);

	return (
		<div className="flex flex-col gap-3">
			<DiscoveryOnboardingCard onRequestMainTab={onRequestMainTab} />

			<Card
				title="Scenes"
				subtitle={
					activeScene ? `Active: ${activeScene.name}` : 'Click to activate'
				}
				action={scenesHeaderAction}
				padded={false}
			>
				{store.sceneSlots.length === 0 ? (
					<p
						className="px-4 py-3 text-[11px]"
						style={{ color: 'var(--editor-accent-muted)' }}
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
												? '1px solid color-mix(in srgb, var(--editor-tag-border) 50%, transparent)'
												: undefined,
										background: isActive
											? 'color-mix(in srgb, var(--lwag-accent) 12%, transparent)'
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
											border: `2px solid ${isActive ? 'var(--lwag-accent)' : 'color-mix(in srgb, var(--editor-tag-border) 70%, transparent)'}`,
											background: isActive
												? 'var(--lwag-accent)'
												: 'transparent'
										}}
									>
										{isActive ? (
											<span
												style={{
													width: 8,
													height: 8,
													borderRadius: 999,
													background: 'var(--editor-active-fg)'
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
													border:
														'1px solid var(--lwag-accent)',
													background:
														'rgba(0, 0, 0, 0.32)',
													color:
														'var(--editor-accent-fg)'
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
												<span className="text-[11px] font-semibold">
													✓
												</span>
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
												className="min-w-0 flex-1 truncate text-left text-[13px] font-medium transition-opacity hover:opacity-80"
												style={{
													color: isActive
														? 'var(--lwag-accent)'
														: 'var(--editor-accent-fg)'
												}}
												title="Click to activate · Double-click to rename"
											>
												{scene.name}
											</button>
											<span
												className="rounded px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em]"
												style={{
													background:
														'color-mix(in srgb, var(--lwag-accent) 12%, transparent)',
													color: 'var(--lwag-accent)',
													border:
														'1px solid color-mix(in srgb, var(--lwag-accent) 30%, transparent)',
													fontFamily:
														'"JetBrains Mono", ui-monospace, monospace'
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
			</Card>

			{activeScene && (
				<Card
					title="Bindings"
					subtitle={`What each subsystem uses when "${activeScene.name}" activates`}
					padded={false}
				>
					<div className="flex flex-col gap-1 px-4 py-3">
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
								<Field key={col.key} label={col.label} layout="row">
									<div style={{ minWidth: 160 }}>
										<ThemedSelect<number>
											value={current}
											options={options}
											ariaLabel={`${col.label} slot`}
											placeholder="None"
											onChange={next => {
												store.updateSceneSlot(activeScene.id, {
													[col.key]: next
												} as Partial<typeof activeScene>);
												store.applySceneSlotById(activeScene.id);
											}}
										/>
									</div>
								</Field>
							);
						})}
						{isSimple && hiddenColumnCount > 0 && (
							<p
								className="text-[10px]"
								style={{ color: 'var(--editor-accent-muted)' }}
							>
								{hiddenColumnCount} more subsystems available in
								Advanced mode.
							</p>
						)}
					</div>
				</Card>
			)}

			<Card title="Sequence" subtitle="Per-image scene assignment" padded={false}>
				<div className="px-4 py-3">
					{store.backgroundImages.length === 0 ? (
						<p
							className="text-[11px]"
							style={{ color: 'var(--editor-accent-muted)' }}
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
											onClick={() =>
												setOpenImageId(
													isOpen ? null : image.assetId
												)
											}
											className="relative overflow-hidden transition-all"
											style={{
												width: '100%',
												aspectRatio: '16 / 10',
												border: `1px solid ${isActive ? 'var(--lwag-accent)' : isOpen ? 'var(--lwag-accent)' : 'color-mix(in srgb, var(--editor-tag-border) 60%, transparent)'}`,
												borderRadius:
													'var(--editor-radius-md)',
												background: 'rgba(0,0,0,0.32)',
												boxShadow: isActive
													? '0 0 0 1px var(--lwag-accent), 0 4px 12px color-mix(in srgb, var(--lwag-accent) 30%, transparent)'
													: undefined
											}}
											title={`Image ${index + 1}`}
										>
											<img
												src={
													image.thumbnailUrl ??
													image.url ??
													''
												}
												alt={`Image ${index + 1}`}
												className="block h-full w-full object-cover"
												loading="lazy"
												decoding="async"
											/>
											{assignedScene && (
												<div
													className="absolute bottom-0 left-0 right-0 truncate px-1.5 py-0.5 text-[9px] font-medium"
													style={{
														background:
															'linear-gradient(0deg, rgba(0,0,0,0.85), rgba(0,0,0,0.3))',
														color: 'var(--editor-accent-fg)'
													}}
												>
													{assignedScene.name}
												</div>
											)}
										</button>
										{isOpen && (
											<div
												ref={openImagePopoverRef}
												className="absolute left-0 right-0 top-0 z-20 p-1.5"
												style={{
													borderRadius:
														'var(--editor-radius-md)',
													border:
														'1px solid var(--lwag-accent)',
													background:
														'var(--editor-shell-bg)',
													backdropFilter:
														'blur(24px) saturate(140%)',
													WebkitBackdropFilter:
														'blur(24px) saturate(140%)',
													boxShadow:
														'0 16px 40px rgba(0, 0, 0, 0.55)'
												}}
											>
												<div className="mb-1 flex items-center justify-between gap-2 px-1">
													<SectionLabel>
														Image #{index + 1}
													</SectionLabel>
													<IconButton
														size="sm"
														onClick={() => setOpenImageId(null)}
														title="Close"
													>
														<X size={ICON_SIZE.sm} />
													</IconButton>
												</div>
												<div className="editor-scroll flex max-h-44 flex-col gap-1 overflow-y-auto">
													<Button
														variant={
															image.sceneSlotId === null
																? 'primary'
																: 'secondary'
														}
														size="sm"
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
											</div>
										)}
										<span
											className="text-[10px]"
											style={{
												color: isActive
													? 'var(--lwag-accent)'
													: 'var(--editor-accent-muted)',
												fontFamily:
													'"JetBrains Mono", ui-monospace, monospace'
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
			</Card>
		</div>
	);
}
