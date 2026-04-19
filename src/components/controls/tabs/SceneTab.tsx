import { useState } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import SectionDivider from '../ui/SectionDivider';
import ResetButton from '../ui/ResetButton';
import {
	DiscoveryOnboardingCard,
	type DiscoveryRequestMainTab
} from '../DiscoveryOnboardingCard';

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
		store.userScenes.find(s => s.id === store.activeUserSceneId) ?? null;

	return (
		<>
			<DiscoveryOnboardingCard onRequestMainTab={onRequestMainTab} />

			<div className="flex flex-wrap items-center gap-2">
				<ResetButton label="Reset scene bindings" onClick={onReset} />
				<button
					type="button"
					title="Save current look as a new scene"
					onClick={() => store.addUserSceneFromCurrent()}
					className={btnClass}
					style={{
						borderColor: 'var(--editor-accent-border)',
						color: 'var(--editor-tag-fg)',
						background: 'var(--editor-tag-bg)'
					}}
				>
					Save scene from current
				</button>
				<button
					type="button"
					onClick={() => store.surpriseMe()}
					disabled={store.userScenes.length === 0}
					className={btnClass}
					style={{
						borderColor: 'var(--editor-active-fg)',
						color: 'var(--editor-active-fg)',
						opacity: store.userScenes.length === 0 ? 0.45 : 1
					}}
				>
					{t.label_surprise_me}
				</button>
			</div>
			<p
				className="text-[10px] leading-snug"
				style={{ color: 'var(--editor-accent-muted)' }}
			>
				{t.hint_scene_no_image_filters}
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

			<SectionDivider label="Your scenes" />
			{store.userScenes.length === 0 ? (
				<p
					className="text-[11px]"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					No scenes yet. Tune rain, particles, filters, spectrum, logo, and
					track title, then use &quot;Save scene from current&quot;.
				</p>
			) : (
				<ul className="flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-0.5">
					{store.userScenes.map(scene => {
						const isActive = store.activeUserSceneId === scene.id;
						const isRenaming = renameId === scene.id;
						return (
							<li
								key={scene.id}
								className="flex flex-col gap-1 rounded border px-2 py-1.5"
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
										onClick={() => store.applyUserSceneById(scene.id)}
										className="min-w-0 flex-1 truncate rounded border px-2 py-1 text-left text-[11px] font-semibold transition-colors hover:bg-white/5"
										style={{
											borderColor: 'var(--editor-accent-border)',
											color: 'var(--editor-accent-fg)'
										}}
									>
										{scene.name}
									</button>
									<button
										type="button"
										aria-label={t.label_favorite_toggle}
										title={t.label_favorite_toggle}
										onClick={() =>
											store.toggleFavoriteSceneId(scene.id)
										}
										className="flex h-7 w-7 shrink-0 items-center justify-center rounded border text-[12px]"
										style={{
											borderColor: 'var(--editor-accent-border)',
											color: store.favoriteSceneIds.includes(scene.id)
												? 'var(--editor-active-fg)'
												: 'var(--editor-accent-muted)'
										}}
									>
										{store.favoriteSceneIds.includes(scene.id)
											? '★'
											: '☆'}
									</button>
								</div>
								<div className="flex flex-wrap gap-1">
									{isRenaming ? (
										<>
											<input
												value={renameDraft}
												onChange={e =>
													setRenameDraft(e.target.value)
												}
												className="min-w-0 flex-1 rounded border px-1 py-0.5 text-[10px] outline-none"
												style={{
													borderColor:
														'var(--editor-accent-border)',
													background: 'var(--editor-bg)',
													color: 'var(--editor-accent-soft)'
												}}
											/>
											<button
												type="button"
												onClick={() => {
													store.renameUserScene(
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
													store.removeUserScene(scene.id)
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
						const isActive = image.assetId === store.activeImageId;
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
									src={image.thumbnailUrl ?? image.url ?? ''}
									alt=""
									className="h-9 w-14 shrink-0 rounded object-cover"
								/>
								<div className="min-w-0 flex-1">
									<div
										className="truncate text-[10px] font-medium"
										style={{ color: 'var(--editor-accent-fg)' }}
									>
										#{index + 1}
										{isActive ? ' · active' : ''}
									</div>
									<select
										className="mt-0.5 w-full max-w-44 truncate rounded border px-1 py-0.5 text-[10px] outline-none"
										style={{
											borderColor: 'var(--editor-accent-border)',
											background: 'var(--editor-bg)',
											color: 'var(--editor-accent-soft)'
										}}
										value={image.userSceneId ?? ''}
										onChange={event =>
											store.setBackgroundImageUserSceneId(
												image.assetId,
												event.target.value || null
											)
										}
									>
										<option value="">None (per-image logo / spectrum)</option>
										{store.userScenes.map(s => (
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
