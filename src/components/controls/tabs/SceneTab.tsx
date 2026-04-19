import { useState } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import SectionDivider from '../ui/SectionDivider';
import ResetButton from '../ui/ResetButton';
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
 *
 * Subsystems covered:
 *  - Spectrum (owned by Spectrum tab slots)
 *  - Looks    (owned by Filters tab slots)
 *  - Particles (owned by Particles tab slots)
 *  - Rain     (owned by Rain tab slots)
 *  - Logo     (owned by Logo tab slots)
 *  - Track Title (owned by Track Title tab slots)
 *
 * Layers are structural (z-order) and NEVER part of a Scene. Motion (combined
 * particles+rain) is intentionally excluded; use the granular Particles/Rain
 * references instead.
 */
export default function SceneTab({
	onReset,
	onRequestMainTab
}: {
	onReset: () => void;
	onRequestMainTab?: (tab: DiscoveryRequestMainTab) => void;
}) {
	const t = useT();
	const store = useWallpaperStore();
	const [renameId, setRenameId] = useState<string | null>(null);
	const [renameDraft, setRenameDraft] = useState('');

	const btnClass =
		'rounded border px-2 py-1 text-[10px] font-medium transition-colors hover:bg-white/5';

	const activeScene =
		store.sceneSlots.find(s => s.id === store.activeSceneSlotId) ?? null;

	const featureColumns: Array<{
		key: SceneSlotFeatureKey;
		label: string;
		slots: ReadonlyArray<{ name: string }>;
	}> = [
		{
			key: 'spectrumSlotIndex',
			label: 'Spectrum',
			slots: store.spectrumProfileSlots
		},
		{
			key: 'looksSlotIndex',
			label: 'Looks',
			slots: store.looksProfileSlots
		},
		{
			key: 'particlesSlotIndex',
			label: 'Particles',
			slots: store.particlesProfileSlots
		},
		{
			key: 'rainSlotIndex',
			label: 'Rain',
			slots: store.rainProfileSlots
		},
		{
			key: 'logoSlotIndex',
			label: 'Logo',
			slots: store.logoProfileSlots
		},
		{
			key: 'trackTitleSlotIndex',
			label: 'Track Title',
			slots: store.trackTitleProfileSlots
		}
	];

	return (
		<>
			<DiscoveryOnboardingCard onRequestMainTab={onRequestMainTab} />

			<div className="flex flex-wrap items-center gap-2">
				<ResetButton
					label="Reset scene bindings"
					onClick={onReset}
				/>
				<button
					type="button"
					title="Create a new empty scene slot (compose references)"
					onClick={() => store.addSceneSlot()}
					className={btnClass}
					style={{
						borderColor: 'var(--editor-accent-border)',
						color: 'var(--editor-tag-fg)',
						background: 'var(--editor-tag-bg)'
					}}
				>
					New scene slot
				</button>
				<button
					type="button"
					onClick={() => store.surpriseMe()}
					disabled={store.sceneSlots.length === 0}
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

			<p
				className="text-[10px] leading-snug"
				style={{ color: 'var(--editor-accent-muted)' }}
			>
				Scene slots store only <strong>references</strong> to feature
				slots (Spectrum, Looks, Particles, Rain, Logo, Track Title).
				Leave a field empty to skip that subsystem on activation. Save
				your named slots in each feature tab first — they&apos;ll appear
				in the dropdowns below.
			</p>

			{activeScene ? (
				<div
					className="rounded-md px-3 py-1.5 text-[11px]"
					style={{
						background: 'var(--editor-surface-bg)',
						border: '1px solid var(--editor-accent-border)',
						opacity: 0.95
					}}
				>
					<span style={{ color: 'var(--editor-accent-muted)' }}>
						Last applied scene:{' '}
					</span>
					<strong style={{ color: 'var(--editor-accent-soft)' }}>
						{activeScene.name}
					</strong>
				</div>
			) : null}

			<SectionDivider label="Scene slots" />
			{store.sceneSlots.length === 0 ? (
				<p
					className="text-[11px]"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					No scene slots yet. Click &quot;New scene slot&quot; to
					create one, then pick which feature slot to reference.
				</p>
			) : (
				<ul className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto pr-0.5">
					{store.sceneSlots.map(scene => {
						const isActive = store.activeSceneSlotId === scene.id;
						const isRenaming = renameId === scene.id;
						return (
							<li
								key={scene.id}
								className="flex flex-col gap-1.5 rounded border px-2 py-1.5"
								style={{
									borderColor: isActive
										? 'var(--editor-accent-color)'
										: 'var(--editor-accent-border)',
									background: 'var(--editor-tag-bg)'
								}}
							>
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() =>
											store.applySceneSlotById(scene.id)
										}
										className="min-w-0 flex-1 truncate rounded border px-2 py-1 text-left text-[11px] font-semibold transition-colors hover:bg-white/5"
										style={{
											borderColor:
												'var(--editor-accent-border)',
											color: 'var(--editor-accent-fg)'
										}}
									>
										{scene.name}
									</button>
									{isRenaming ? (
										<>
											<input
												value={renameDraft}
												onChange={e =>
													setRenameDraft(
														e.target.value
													)
												}
												className="min-w-0 flex-1 rounded border px-1 py-0.5 text-[10px] outline-none"
												style={{
													borderColor:
														'var(--editor-accent-border)',
													background:
														'var(--editor-bg)',
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
												Cancel
											</button>
										</>
									) : (
										<>
											<button
												type="button"
												onClick={() => {
													setRenameId(scene.id);
													setRenameDraft(scene.name);
												}}
												className={btnClass}
												style={{
													borderColor:
														'var(--editor-accent-border)',
													color: 'var(--editor-accent-muted)'
												}}
											>
												Rename
											</button>
											<button
												type="button"
												onClick={() =>
													store.removeSceneSlot(
														scene.id
													)
												}
												className={btnClass}
												style={{
													borderColor:
														'var(--editor-tag-border)',
													color: 'var(--editor-tag-fg)'
												}}
											>
												Delete
											</button>
										</>
									)}
								</div>
								<div className="grid grid-cols-2 gap-1.5">
									{featureColumns.map(col => {
										const current = scene[col.key];
										return (
											<label
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
												<select
													className="w-full truncate rounded border px-1 py-0.5 text-[10px] outline-none"
													style={{
														borderColor:
															'var(--editor-accent-border)',
														background:
															'var(--editor-bg)',
														color: 'var(--editor-accent-soft)'
													}}
													value={
														current === null
															? ''
															: String(current)
													}
													onChange={event => {
														const raw =
															event.target.value;
														const nextIndex =
															raw === ''
																? null
																: Number(raw);
														store.updateSceneSlot(
															scene.id,
															{
																[col.key]:
																	Number.isFinite(
																		nextIndex
																	)
																		? nextIndex
																		: null
															} as Partial<
																typeof scene
															>
														);
													}}
												>
													<option value="">
														— Skip (no apply) —
													</option>
													{col.slots.map((s, idx) => (
														<option
															key={`${col.key}-${idx}`}
															value={idx}
														>
															{idx + 1}. {s.name}
														</option>
													))}
												</select>
											</label>
										);
									})}
								</div>
							</li>
						);
					})}
				</ul>
			)}

			<SectionDivider label="Scene per slideshow image" />
			<p
				className="text-[10px] leading-snug"
				style={{ color: 'var(--editor-accent-muted)' }}
			>
				{t.hint_scene_per_slide}
			</p>
			{store.backgroundImages.length === 0 ? (
				<p
					className="text-xs"
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					Add images in Layers → Background pool first.
				</p>
			) : (
				<ul className="mt-2 flex max-h-56 flex-col gap-1.5 overflow-y-auto pr-0.5">
					{store.backgroundImages.map((image, index) => {
						const isActive =
							image.assetId === store.activeImageId;
						return (
							<li
								key={image.assetId}
								className="flex items-center gap-2 rounded border px-1.5 py-1"
								style={{
									borderColor: isActive
										? 'var(--editor-active-fg)'
										: 'var(--editor-accent-border)',
									background: 'var(--editor-tag-bg)'
								}}
							>
								<img
									src={
										image.thumbnailUrl ??
										image.url ??
										''
									}
									alt=""
									className="h-9 w-14 shrink-0 rounded object-cover"
								/>
								<div className="min-w-0 flex-1">
									<div
										className="truncate text-[10px] font-medium"
										style={{
											color: 'var(--editor-accent-fg)'
										}}
									>
										#{index + 1}
										{isActive ? ' · active' : ''}
									</div>
									<select
										className="mt-0.5 w-full max-w-44 truncate rounded border px-1 py-0.5 text-[10px] outline-none"
										style={{
											borderColor:
												'var(--editor-accent-border)',
											background: 'var(--editor-bg)',
											color: 'var(--editor-accent-soft)'
										}}
										value={image.sceneSlotId ?? ''}
										onChange={event =>
											store.setBackgroundImageSceneSlotId(
												image.assetId,
												event.target.value || null
											)
										}
									>
										<option value="">
											None (per-image overrides only)
										</option>
										{store.sceneSlots.map(s => (
											<option key={s.id} value={s.id}>
												{s.name}
											</option>
										))}
									</select>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</>
	);
}
