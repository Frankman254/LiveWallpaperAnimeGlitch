import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import SectionDivider from '../ui/SectionDivider';
import ResetButton from '../ui/ResetButton';
import ThemedSelect from '../ui/ThemedSelect';
import { useIsSimple } from '../UIMode';
import {
	DiscoveryOnboardingCard,
	type DiscoveryRequestMainTab
} from '../DiscoveryOnboardingCard';

type SceneSlotFeatureKey =
	| 'spectrumSlotIndex'
	| 'looksSlotIndex'
	| 'particlesSlotIndex'
	| 'rainSlotIndex'
	| 'logoSlotIndex'
	| 'trackTitleSlotIndex';

/**
 * Scene tab — composition-only UI.
 *
 * A Scene slot is a named record of references to other feature slots. This
 * tab never edits raw feature values; it only picks which feature slot to
 * reference. `null` in a reference means "do not apply this subsystem" when
 * the scene is activated.
 */

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

export default function SceneTab({
	onReset,
	onRequestMainTab
}: {
	onReset: () => void;
	onRequestMainTab?: (tab: DiscoveryRequestMainTab) => void;
}) {
	const t = useT();
	const store = useWallpaperStore();
	const isSimple = useIsSimple();

	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [renameId, setRenameId] = useState<string | null>(null);
	const [renameDraft, setRenameDraft] = useState('');
	const [openImageId, setOpenImageId] = useState<string | null>(null);
	const [pendingDeleteSceneId, setPendingDeleteSceneId] = useState<
		string | null
	>(null);
	const openImagePopoverRef = useRef<HTMLDivElement | null>(null);

	const btnClass =
		'rounded border px-2 py-1 text-[10px] font-medium transition-colors hover:bg-white/5';

	const activeScene =
		store.sceneSlots.find(s => s.id === store.activeSceneSlotId) ?? null;

	// Feature columns to show based on mode
	const featureColumns = ALL_FEATURE_COLUMNS.map(col => ({
		...col,
		slots: (() => {
			switch (col.key) {
				case 'spectrumSlotIndex': return store.spectrumProfileSlots;
				case 'looksSlotIndex': return store.looksProfileSlots;
				case 'particlesSlotIndex': return store.particlesProfileSlots;
				case 'rainSlotIndex': return store.rainProfileSlots;
				case 'logoSlotIndex': return store.logoProfileSlots;
				case 'trackTitleSlotIndex': return store.trackTitleProfileSlots;
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
			if (openImagePopoverRef.current?.contains(event.target as Node)) {
				return;
			}
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
		if (expandedId === sceneId) setExpandedId(null);
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

	return (
		<>
			<DiscoveryOnboardingCard onRequestMainTab={onRequestMainTab} />

			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-2">
				<ResetButton label="Reset scene bindings" onClick={onReset} />
				<button
					type="button"
					onClick={() => store.addSceneSlot()}
					className={btnClass}
					style={{
						borderColor: 'var(--editor-accent-border)',
						color: 'var(--editor-tag-fg)',
						background: 'var(--editor-tag-bg)'
					}}
				>
					+ New scene
				</button>
				<button
					type="button"
					onClick={() => store.surpriseMe()}
					disabled={store.sceneSlots.length === 0}
					title="Randomly pick feature slots across all scenes"
					className={btnClass}
					style={{
						borderColor: 'var(--editor-active-fg)',
						color: 'var(--editor-active-fg)',
						opacity: store.sceneSlots.length === 0 ? 0.45 : 1
					}}
				>
					{t.label_surprise_me}
				</button>
			</div>

			{/* Active scene indicator */}
			{activeScene && (
				<div
					className="rounded px-2.5 py-1 text-[11px]"
					style={{
						background: 'var(--editor-surface-bg)',
						border: '1px solid var(--editor-accent-border)'
					}}
				>
					<span style={{ color: 'var(--editor-accent-muted)' }}>
						Active:{' '}
					</span>
					<strong style={{ color: 'var(--editor-accent-soft)' }}>
						{activeScene.name}
					</strong>
				</div>
			)}

			{/* Scene slots — accordion */}
			<SectionDivider label="Scenes" />
			{store.sceneSlots.length === 0 ? (
				<p
					className="text-[11px]"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					No scenes yet. Click &quot;+ New scene&quot; to create one.
				</p>
			) : (
				<ul className="flex flex-col gap-1.5">
					{store.sceneSlots.map(scene => {
						const isActive = store.activeSceneSlotId === scene.id;
						const isExpanded = expandedId === scene.id;
						const isRenaming = renameId === scene.id;
						const isPendingDelete = pendingDeleteSceneId === scene.id;

						// Tags for bound features shown in collapsed view
						const boundLabels = ALL_FEATURE_COLUMNS.filter(
							col =>
								scene[col.key] !== null &&
								scene[col.key] !== undefined
						).map(col => col.label);

						return (
							<li
								key={scene.id}
								className="rounded border"
								style={{
									borderColor: isActive
										? 'var(--editor-accent-color)'
										: 'var(--editor-accent-border)',
									background: 'var(--editor-tag-bg)'
								}}
							>
								{/* Header row — always visible */}
								<div className="flex min-w-0 items-center gap-1.5 px-2 py-1.5">
									{/* Chevron expand/collapse */}
									<button
										type="button"
										onClick={() =>
											setExpandedId(
												isExpanded ? null : scene.id
											)
										}
										className="shrink-0 transition-opacity hover:opacity-70"
										style={{
											color: 'var(--editor-accent-muted)'
										}}
										aria-label={
											isExpanded ? 'Collapse' : 'Expand'
										}
									>
										{isExpanded ? (
											<ChevronDown size={13} />
										) : (
											<ChevronRight size={13} />
										)}
									</button>

									{/* Name — activate on click, rename on double-click */}
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
												className="min-w-0 flex-1 rounded border px-1.5 py-0.5 text-[11px] outline-none"
												style={{
													borderColor:
														'var(--editor-accent-border)',
													background:
														'var(--editor-shell-bg)',
													color: 'var(--editor-accent-soft)'
												}}
											/>
											<button
												type="button"
												onClick={() => {
													store.renameSceneSlot(
														scene.id,
														renameDraft
													);
													setRenameId(null);
												}}
												className={btnClass}
												style={{
													borderColor:
														'var(--editor-accent-border)',
													color: 'var(--editor-accent-fg)'
												}}
											>
												Save
											</button>
											<button
												type="button"
												onClick={() => setRenameId(null)}
												className={btnClass}
												style={{
													borderColor:
														'var(--editor-accent-border)',
													color: 'var(--editor-accent-muted)'
												}}
											>
												×
											</button>
										</>
									) : (
										<>
											<button
												type="button"
												onClick={() =>
													store.applySceneSlotById(
														scene.id
													)
												}
												onDoubleClick={() => {
													setRenameId(scene.id);
													setRenameDraft(scene.name);
												}}
												title="Click to activate · Double-click to rename"
												className="min-w-0 flex-1 truncate text-left text-[11px] font-semibold transition-opacity hover:opacity-80"
												style={{
													color: isActive
														? 'var(--editor-active-fg)'
														: 'var(--editor-accent-fg)'
												}}
											>
												{scene.name}
											</button>

											{/* Bound feature tags (collapsed view only) */}
											{!isExpanded &&
												boundLabels.length > 0 && (
													<div className="flex shrink-0 gap-1">
														{boundLabels
															.slice(0, 3)
															.map(label => (
																<span
																	key={label}
																	className="rounded px-1 py-0.5 text-[9px] font-medium"
																	style={{
																		background:
																			'var(--editor-active-bg)',
																		color: 'var(--editor-active-fg)'
																	}}
																>
																	{label}
																</span>
															))}
														{boundLabels.length >
															3 && (
															<span
																className="rounded px-1 py-0.5 text-[9px]"
																style={{
																	color: 'var(--editor-accent-muted)'
																}}
															>
																+
																{boundLabels.length -
																	3}
															</span>
														)}
													</div>
												)}

											{/* Delete */}
											{isPendingDelete ? (
												<div className="flex shrink-0 items-center gap-1">
													<button
														type="button"
														onClick={() =>
															confirmSceneDelete(
																scene.id
															)
														}
														className={btnClass}
														style={{
															borderColor:
																'rgba(248, 113, 113, 0.45)',
															color: '#fee2e2',
															background:
																'rgba(127, 29, 29, 0.35)'
														}}
													>
														Delete
													</button>
													<button
														type="button"
														onClick={() =>
															setPendingDeleteSceneId(
																null
															)
														}
														className={btnClass}
														style={{
															borderColor:
																'var(--editor-accent-border)',
															color: 'var(--editor-accent-muted)',
															background:
																'var(--editor-surface-bg)'
														}}
													>
														Cancel
													</button>
												</div>
											) : (
												<button
													type="button"
													onClick={() =>
														setPendingDeleteSceneId(
															scene.id
														)
													}
													className="shrink-0 px-1 text-[13px] leading-none transition-opacity hover:opacity-60"
													title="Delete scene"
													style={{
														color: 'var(--editor-accent-muted)'
													}}
												>
													×
												</button>
											)}
										</>
									)}
								</div>

								{/* Expanded — feature slot dropdowns */}
								{isExpanded && (
									<div
										className="grid grid-cols-1 gap-x-2 gap-y-1.5 px-2 pt-1.5 pb-2 md:grid-cols-2 xl:grid-cols-3"
										style={{
											borderTop:
												'1px solid var(--editor-accent-border)'
										}}
									>
										{visibleColumns.map(col => {
											const current = scene[col.key];
											const options = col.slots
												.map((s, idx) => ({
													idx,
													name: s.name,
													values: s.values
												}))
												.filter(o => o.values !== null)
												.map(o => ({
													value: o.idx,
													label: o.name
												}));
											return (
												<div
													key={col.key}
													className="flex flex-col gap-0.5"
												>
													<span
														className="text-[10px]"
														style={{
															color: 'var(--editor-accent-muted)'
														}}
													>
														{col.label}
													</span>
													<ThemedSelect<number>
														value={current}
														options={options}
														ariaLabel={`${col.label} slot`}
														placeholder="None"
														onChange={next => {
															store.updateSceneSlot(
																scene.id,
																{
																	[col.key]:
																		next
																} as Partial<
																	typeof scene
																>
															);
															store.applySceneSlotById(
																scene.id
															);
														}}
													/>
												</div>
											);
										})}
										{isSimple && hiddenColumnCount > 0 && (
											<p
												className="col-span-2 text-[10px]"
												style={{
													color: 'var(--editor-accent-muted)'
												}}
											>
												{hiddenColumnCount} more
												subsystems available in Advanced
												mode.
											</p>
										)}
									</div>
								)}
							</li>
						);
					})}
				</ul>
			)}

			{/* Sequence — per-image scene assignment */}
			<SectionDivider label="Sequence" />
			{store.backgroundImages.length === 0 ? (
				<p
					className="text-xs"
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					Add images in Layers → Background pool first.
				</p>
			) : (
				<div className="flex flex-col gap-2">
					<div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3">
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
									className="relative flex flex-col items-center gap-1"
								>
									<button
										type="button"
										onClick={() =>
											setOpenImageId(
												isOpen ? null : image.assetId
											)
										}
										className="relative overflow-hidden rounded border transition-all"
										style={{
											borderColor: isActive
												? 'var(--editor-active-fg)'
												: isOpen
													? 'var(--editor-accent-color)'
													: 'var(--editor-accent-border)',
											boxShadow: isActive
												? '0 0 6px var(--editor-accent-color)'
												: undefined,
											width: '100%'
										}}
										title={`Image ${index + 1} — click to assign scene`}
									>
										<img
											src={
												image.thumbnailUrl ??
												image.url ??
												''
											}
											alt={`Image ${index + 1}`}
											className="block object-cover"
											loading="lazy"
											decoding="async"
											style={{ width: '100%', height: 82 }}
										/>
										{assignedScene && (
											<div
												className="absolute bottom-0 left-0 right-0 truncate px-1 py-0.5 text-[8px] font-medium"
												style={{
													background:
														'rgba(0,0,0,0.65)',
													color: 'var(--editor-active-fg)'
												}}
											>
												{assignedScene.name}
											</div>
										)}
									</button>
									{isOpen && (
										<div
											ref={openImagePopoverRef}
											className="absolute inset-x-1 top-1 z-20 rounded border p-1 shadow-xl backdrop-blur-sm"
											style={{
												borderColor:
													'var(--editor-accent-color)',
												background:
													'color-mix(in srgb, var(--editor-surface-bg) 92%, transparent)',
												boxShadow:
													'0 8px 24px rgba(0, 0, 0, 0.28)'
											}}
										>
											<div className="mb-1 flex items-center justify-between gap-2 px-1">
												<span
													className="text-[10px] font-semibold"
													style={{
														color: 'var(--editor-accent-fg)'
													}}
												>
													Image #{index + 1}
												</span>
												<button
													type="button"
													onClick={() =>
														setOpenImageId(null)
													}
													className="px-1 text-[11px] leading-none transition-opacity hover:opacity-70"
													style={{
														color: 'var(--editor-accent-muted)'
													}}
													aria-label="Close scene assignment"
												>
													x
												</button>
											</div>
											<div className="editor-scroll flex max-h-40 flex-col gap-1 overflow-y-auto">
												<button
													type="button"
													onClick={() =>
														assignSceneToImage(
															image.assetId,
															null
														)
													}
													className="rounded border px-2 py-1 text-left text-[10px] transition-colors hover:opacity-90"
													style={{
														borderColor:
															image.sceneSlotId ===
															null
																? 'var(--editor-accent-color)'
																: 'var(--editor-accent-border)',
														background:
															image.sceneSlotId ===
															null
																? 'var(--editor-active-bg)'
																: 'var(--editor-surface-bg)',
														color:
															image.sceneSlotId ===
															null
																? 'var(--editor-active-fg)'
																: 'var(--editor-accent-soft)'
													}}
												>
													None
												</button>
												{store.sceneSlots.map(scene => {
													const isSelected =
														image.sceneSlotId ===
														scene.id;
													return (
														<button
															key={scene.id}
															type="button"
															onClick={() =>
																assignSceneToImage(
																	image.assetId,
																	scene.id
																)
															}
															className="rounded border px-2 py-1 text-left text-[10px] transition-colors hover:opacity-90"
															style={{
																borderColor:
																	isSelected
																		? 'var(--editor-accent-color)'
																		: 'var(--editor-accent-border)',
																background:
																	isSelected
																		? 'var(--editor-active-bg)'
																		: 'var(--editor-surface-bg)',
																color:
																	isSelected
																		? 'var(--editor-active-fg)'
																		: 'var(--editor-accent-soft)'
															}}
														>
															{scene.name}
														</button>
													);
												})}
											</div>
										</div>
									)}
									<span
										className="text-[9px]"
										style={{
											color: isActive
												? 'var(--editor-active-fg)'
												: 'var(--editor-accent-muted)'
										}}
									>
										#{index + 1}
										{isActive ? ' ●' : ''}
									</span>
								</div>
							);
						})}
					</div>

					{/* Scene selector for the open image — full-width, no nested scroll */}
				</div>
			)}
		</>
	);
}
