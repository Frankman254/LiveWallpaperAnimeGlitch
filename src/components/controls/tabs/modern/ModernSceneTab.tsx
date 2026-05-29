import { useEffect, useRef, useState } from 'react';
import {
	Plus,
	Sparkles,
	RotateCcw,
	X,
	Pencil,
	Check,
	Layers,
	List
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import SetlistsPanel from './scene/SetlistsPanel';
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

type FeatureColumn = {
	key: SceneSlotFeatureKey;
	label: string;
};
function buildFeatureColumns(t: ReturnType<typeof useT>): FeatureColumn[] {
	return [
		{ key: 'spectrumSlotIndex', label: t.tab_spectrum },
		{ key: 'looksSlotIndex', label: t.tab_looks },
		{ key: 'particlesSlotIndex', label: t.tab_particles },
		{ key: 'rainSlotIndex', label: t.tab_rain },
		{ key: 'logoSlotIndex', label: t.tab_logo },
		{ key: 'trackTitleSlotIndex', label: t.tab_track }
	];
}

const SIMPLE_KEYS: SceneSlotFeatureKey[] = [
	'spectrumSlotIndex',
	'looksSlotIndex'
];

type SceneView = 'scenes' | 'setlists';
const MODERN_SCENE_VIEW_STORAGE_KEY = 'lwag-modern-scene-view';

function isSceneView(value: unknown): value is SceneView {
	return value === 'scenes' || value === 'setlists';
}

function readPersistedSceneView(): SceneView {
	if (typeof window === 'undefined') return 'scenes';
	try {
		const value = window.localStorage.getItem(
			MODERN_SCENE_VIEW_STORAGE_KEY
		);
		return isSceneView(value) ? value : 'scenes';
	} catch {
		return 'scenes';
	}
}

function writePersistedSceneView(value: SceneView) {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(MODERN_SCENE_VIEW_STORAGE_KEY, value);
	} catch {
		/* localStorage unavailable — view restore is optional */
	}
}

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

	const [view, setView] = useState<SceneView>(() => readPersistedSceneView());
	function handleViewChange(next: SceneView) {
		setView(next);
		writePersistedSceneView(next);
	}

	const [renameId, setRenameId] = useState<string | null>(null);
	const [renameDraft, setRenameDraft] = useState('');
	const [pendingDeleteSceneId, setPendingDeleteSceneId] =
		useState<string | null>(null);
	const [openImageId, setOpenImageId] = useState<string | null>(null);
	const popoverRef = useRef<HTMLDivElement | null>(null);

	const activeScene =
		store.sceneSlots.find(s => s.id === store.activeSceneSlotId) ?? null;

	type AppliedSnapshot = Record<SceneSlotFeatureKey, number | null>;
	function snapshotBindings(scene: typeof activeScene): AppliedSnapshot | null {
		if (!scene) return null;
		return {
			spectrumSlotIndex: scene.spectrumSlotIndex,
			looksSlotIndex: scene.looksSlotIndex,
			particlesSlotIndex: scene.particlesSlotIndex,
			rainSlotIndex: scene.rainSlotIndex,
			logoSlotIndex: scene.logoSlotIndex,
			trackTitleSlotIndex: scene.trackTitleSlotIndex
		};
	}
	const [appliedSnapshot, setAppliedSnapshot] =
		useState<AppliedSnapshot | null>(() => snapshotBindings(activeScene));
	const [appliedSceneId, setAppliedSceneId] = useState<string | null>(
		() => activeScene?.id ?? null
	);

	useEffect(() => {
		// Reseat only when the scene IDENTITY changes (id), not on every
		// binding edit. Including activeScene/snapshotBindings would defeat
		// the dirty-diff because activeScene is a fresh reference each render.
		if (activeScene?.id !== appliedSceneId) {
			setAppliedSceneId(activeScene?.id ?? null);
			setAppliedSnapshot(snapshotBindings(activeScene));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeScene?.id, appliedSceneId]);

	const currentSnapshot = snapshotBindings(activeScene);
	const dirtyBindingKeys: SceneSlotFeatureKey[] = currentSnapshot
		? (Object.keys(currentSnapshot) as SceneSlotFeatureKey[]).filter(
				k => !appliedSnapshot || currentSnapshot[k] !== appliedSnapshot[k]
			)
		: [];
	const isDirty = dirtyBindingKeys.length > 0;

	function applyActiveSceneBindings() {
		if (!activeScene) return;
		store.applySceneSlotById(activeScene.id);
		setAppliedSnapshot(snapshotBindings(activeScene));
		setAppliedSceneId(activeScene.id);
	}

	function activateSceneFromRadio(sceneId: string) {
		const scene = store.sceneSlots.find(s => s.id === sceneId) ?? null;
		store.applySceneSlotById(sceneId);
		setAppliedSnapshot(snapshotBindings(scene));
		setAppliedSceneId(sceneId);
	}

	const allFeatureColumns = buildFeatureColumns(t);
	const featureColumns = allFeatureColumns.map(col => ({
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
				title={t.scene_btn_new_tooltip}
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
				title={t.scene_btn_reset_bindings_tooltip}
			>
				<RotateCcw size={ICON_SIZE.sm} />
			</IconButton>
		</div>
	);

	return (
		<div
			className={
				view === 'setlists'
					? 'flex h-full min-h-0 flex-col gap-2'
					: 'flex flex-col gap-2'
			}
		>
			<SegmentedControl<SceneView>
				value={view}
				onChange={handleViewChange}
				options={[
					{
						value: 'scenes',
						label: t.scene_section_scenes,
						icon: <Layers size={ICON_SIZE.xs} />
					},
					{
						value: 'setlists',
						label: t.scene_section_setlists,
						icon: <List size={ICON_SIZE.xs} />
					}
				]}
				size="sm"
				density="compact"
				full
				ariaLabel={t.scene_tab_aria}
			/>

			{view === 'setlists' ? <SetlistsPanel /> : null}

			{view === 'scenes' ? (
				<>
			<DiscoveryOnboardingCard onRequestMainTab={onRequestMainTab} />

			<SectionCard
				title={t.scene_section_scenes}
				subtitle={
					activeScene
						? `${t.scene_subtitle_active_prefix}: ${activeScene.name}`
						: t.scene_subtitle_click_to_activate
				}
				action={scenesAction}
				padded={false}
			>
				{store.sceneSlots.length === 0 ? (
					<p
						className="px-4 py-3 text-[11px]"
						style={{ color: UI_COLORS.fgMute }}
					>
						{t.scene_empty}
					</p>
				) : (
					<div className="flex flex-col">
						{store.sceneSlots.map((scene, idx) => {
							const isActive = store.activeSceneSlotId === scene.id;
							const isRenaming = renameId === scene.id;
							const isPendingDelete =
								pendingDeleteSceneId === scene.id;
							const boundCount = allFeatureColumns.filter(
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
										onClick={() => activateSceneFromRadio(scene.id)}
										title={t.scene_btn_activate}
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
												title={t.label_save}
											>
												<Check size={ICON_SIZE.sm} />
											</IconButton>
											<IconButton
												size="sm"
												onClick={() => setRenameId(null)}
												title={t.label_cancel}
											>
												<X size={ICON_SIZE.sm} />
											</IconButton>
										</>
									) : (
										<>
											<button
												type="button"
												onClick={() => activateSceneFromRadio(scene.id)}
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
												title={t.scene_hint_activate_rename}
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
												{boundCount} {t.scene_badge_bound}
											</span>
											<IconButton
												size="sm"
												onClick={() => {
													setRenameId(scene.id);
													setRenameDraft(scene.name);
												}}
												title={t.label_rename}
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
														{t.label_delete}
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															setPendingDeleteSceneId(null)
														}
													>
														{t.label_cancel}
													</Button>
												</div>
											) : (
												<IconButton
													size="sm"
													onClick={() =>
														setPendingDeleteSceneId(scene.id)
													}
													title={t.scene_btn_delete}
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
					title={t.scene_section_bindings}
					subtitle={t.scene_bindings_subtitle_template.replace(
						'{name}',
						activeScene.name
					)}
					padded={false}
				>
					<div className="flex flex-col gap-2 px-4 py-3">
						{visibleColumns.map(col => {
							const current = activeScene[col.key];
							const savedCount = col.slots.filter(
								s => s.values !== null
							).length;
							const options = col.slots.map((s, idx) => ({
								value: idx,
								label:
									s.values === null
										? `${s.name} (${t.scene_slot_empty_suffix})`
										: s.name,
								disabled: s.values === null
							}));
							const isRowDirty = dirtyBindingKeys.includes(col.key);
							return (
								<div
									key={col.key}
									className="flex items-center justify-between gap-3"
								>
									<span
										className="text-[12px] font-medium flex items-center gap-2"
										style={{ color: UI_COLORS.fg }}
									>
										{col.label}
										{isRowDirty ? (
											<span
												title={t.scene_dirty_dot}
												style={{
													width: 6,
													height: 6,
													borderRadius: '50%',
													background: UI_COLORS.accent,
													display: 'inline-block'
												}}
											/>
										) : null}
									</span>
									<div style={{ minWidth: 180 }}>
										<Select<number>
											value={current}
											options={options}
											placeholder={
												savedCount === 0
													? t.scene_select_no_saved_slots
													: t.label_none
											}
											size="sm"
											full
											ariaLabel={`${col.label} slot`}
											onChange={next => {
												store.updateSceneSlot(activeScene.id, {
													[col.key]: next
												} as Partial<typeof activeScene>);
											}}
										/>
									</div>
								</div>
							);
						})}
						<p
							className="text-[10px]"
							style={{ color: UI_COLORS.fgMute }}
						>
							{t.scene_bindings_hint}
						</p>
						{isSimple && hiddenColumnCount > 0 && (
							<p
								className="text-[10px]"
								style={{ color: UI_COLORS.fgMute }}
							>
								{t.scene_hidden_columns_hint_template.replace(
									'{n}',
									String(hiddenColumnCount)
								)}
							</p>
						)}
						{isDirty ? (
							<div
								className="mt-1 flex items-center justify-between gap-3 rounded px-3 py-2"
								style={{
									background: UI_COLORS.accentSoft,
									border: `1px solid ${UI_COLORS.accentBorder}`
								}}
							>
								<span
									className="text-[11px]"
									style={{ color: UI_COLORS.fg }}
								>
									{dirtyBindingKeys.length}{' '}
									{dirtyBindingKeys.length === 1
										? t.scene_binding_singular
										: t.scene_binding_plural}{' '}
									{t.scene_changes_pending_suffix}
								</span>
								<div className="flex items-center gap-1">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => {
											if (!activeScene || !appliedSnapshot)
												return;
											store.updateSceneSlot(
												activeScene.id,
												appliedSnapshot as Partial<typeof activeScene>
											);
										}}
									>
										{t.label_revert}
									</Button>
									<Button
										variant="primary"
										size="sm"
										onClick={applyActiveSceneBindings}
									>
										{t.label_apply_changes}
									</Button>
								</div>
							</div>
						) : null}
					</div>
				</SectionCard>
			)}

			<SectionCard
				title={t.scene_section_sequence}
				subtitle={t.scene_section_sequence_subtitle}
				padded={false}
				action={
					<SegmentedControl<EditorImagePreviewQuality>
						size="sm"
						value={store.editorImagePreviewQuality}
						onChange={store.setEditorImagePreviewQuality}
						ariaLabel={t.scene_thumbnail_quality_aria}
						options={[
							{
								value: 'optimized',
								label: t.label_quality_optimized
							},
							{ value: 'original', label: t.label_quality_original }
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
							{t.scene_empty_pool_hint}
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
											title={t.scene_image_label_template.replace(
												'{n}',
												String(index + 1)
											)}
										>
											<img
												src={resolveEditorImagePreviewUrl(
													image,
													store.editorImagePreviewQuality,
													isActive
												)}
												alt={t.scene_image_label_template.replace(
													'{n}',
													String(index + 1)
												)}
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
														{t.label_none}
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
				</>
			) : null}
		</div>
	);
}
