import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import {
	CUSTOM_SCENE_ID,
	SCENE_PRESETS,
	findScenePresetById,
	type ScenePreset
} from '@/features/scenes/scenePresets';
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
	const activeScene = findScenePresetById(store.activeScenePresetId);

	const favoriteScenes = store.favoriteSceneIds
		.map(id => findScenePresetById(id))
		.filter((s): s is ScenePreset => s !== null);

	const recentScenes = store.recentSceneIds
		.map(id => findScenePresetById(id))
		.filter((s): s is ScenePreset => s !== null);

	const surpriseBtnClass =
		'rounded border px-2 py-1 text-[10px] font-medium transition-colors hover:bg-white/5';

	function sceneTitle(scene: ScenePreset) {
		return scene.id === CUSTOM_SCENE_ID ? t.label_scene_custom : scene.name;
	}

	const sceneChoicesForSlides = SCENE_PRESETS.filter(
		s => s.id !== CUSTOM_SCENE_ID || store.customSceneUserPatch
	);

	return (
		<>
			<DiscoveryOnboardingCard onRequestMainTab={onRequestMainTab} />

			<div className="flex flex-wrap items-center gap-2">
				<ResetButton label="Reset scene bindings" onClick={onReset} />
				<button
					type="button"
					title={t.hint_save_custom_scene}
					onClick={() => store.saveCustomSceneUserPatchFromCurrent()}
					className={surpriseBtnClass}
					style={{
						borderColor: 'var(--editor-accent-border)',
						color: 'var(--editor-tag-fg)',
						background: 'var(--editor-tag-bg)'
					}}
				>
					{t.label_save_custom_scene}
				</button>
				<button
					type="button"
					onClick={() => store.surpriseMe()}
					className={surpriseBtnClass}
					style={{
						borderColor: 'var(--editor-active-fg)',
						color: 'var(--editor-active-fg)'
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

			{favoriteScenes.length > 0 ? (
				<>
					<SectionDivider label={t.section_scene_favorites} />
					<div className="grid grid-cols-1 gap-1.5">
						{favoriteScenes.map(scene => {
							const isActive = store.activeScenePresetId === scene.id;
							const isFav = store.favoriteSceneIds.includes(scene.id);
							return (
								<div key={scene.id} className="relative">
									<button
										type="button"
										onClick={() => store.applyScenePreset(scene)}
										className="w-full rounded border py-1.5 pr-7 pl-2 text-left transition-colors hover:bg-white/5"
										style={{
											borderColor: isActive
												? 'var(--editor-accent-color)'
												: 'var(--editor-accent-border)',
											background: isActive
												? 'var(--editor-surface-bg)'
												: 'var(--editor-bg)',
											boxShadow: isActive
												? '0 0 0 1px color-mix(in srgb, var(--editor-accent-color) 55%, transparent), 0 4px 14px color-mix(in srgb, var(--editor-accent-color) 18%, transparent)'
												: 'inset 0 0 0 1px color-mix(in srgb, var(--editor-accent-color) 22%, transparent)'
										}}
									>
										<div
											className="text-[11px] font-semibold"
											style={{
												color: 'var(--editor-accent-fg)',
												opacity: isActive ? 1 : 0.92
											}}
										>
											{sceneTitle(scene)}
										</div>
										<div
											className="text-[10px]"
											style={{ color: 'var(--editor-accent-muted)' }}
										>
											{scene.description}
										</div>
									</button>
									<button
										type="button"
										aria-label={t.label_favorite_toggle}
										title={t.label_favorite_toggle}
										onClick={e => {
											e.preventDefault();
											e.stopPropagation();
											store.toggleFavoriteSceneId(scene.id);
										}}
										className="absolute top-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded border text-[12px] leading-none transition-colors hover:bg-white/10"
										style={{
											borderColor: 'var(--editor-accent-border)',
											color: isFav
												? 'var(--editor-active-fg)'
												: 'var(--editor-accent-muted)'
										}}
									>
										{isFav ? '★' : '☆'}
									</button>
								</div>
							);
						})}
					</div>
				</>
			) : null}

			{recentScenes.length > 0 ? (
				<>
					<SectionDivider label={t.section_scene_recent} />
					<div className="grid grid-cols-1 gap-1.5">
						{recentScenes.map(scene => {
							const isActive = store.activeScenePresetId === scene.id;
							const isFav = store.favoriteSceneIds.includes(scene.id);
							return (
								<div key={`recent-${scene.id}`} className="relative">
									<button
										type="button"
										onClick={() => store.applyScenePreset(scene)}
										className="w-full rounded border py-1.5 pr-7 pl-2 text-left transition-colors hover:bg-white/5"
										style={{
											borderColor: isActive
												? 'var(--editor-accent-color)'
												: 'var(--editor-accent-border)',
											background: isActive
												? 'var(--editor-surface-bg)'
												: 'var(--editor-bg)',
											boxShadow: isActive
												? '0 0 0 1px color-mix(in srgb, var(--editor-accent-color) 55%, transparent), 0 4px 14px color-mix(in srgb, var(--editor-accent-color) 18%, transparent)'
												: 'inset 0 0 0 1px color-mix(in srgb, var(--editor-accent-color) 22%, transparent)'
										}}
									>
										<div
											className="text-[11px] font-semibold"
											style={{
												color: 'var(--editor-accent-fg)',
												opacity: isActive ? 1 : 0.92
											}}
										>
											{sceneTitle(scene)}
										</div>
									</button>
									<button
										type="button"
										aria-label={t.label_favorite_toggle}
										title={t.label_favorite_toggle}
										onClick={e => {
											e.preventDefault();
											e.stopPropagation();
											store.toggleFavoriteSceneId(scene.id);
										}}
										className="absolute top-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded border text-[12px] leading-none transition-colors hover:bg-white/10"
										style={{
											borderColor: 'var(--editor-accent-border)',
											color: isFav
												? 'var(--editor-active-fg)'
												: 'var(--editor-accent-muted)'
										}}
									>
										{isFav ? '★' : '☆'}
									</button>
								</div>
							);
						})}
					</div>
				</>
			) : null}

			<SectionDivider label="Scene presets" />
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
						{t.label_scene_global_prefix}{' '}
					</span>
					<strong style={{ color: 'var(--editor-accent-soft)' }}>
						{sceneTitle(activeScene)}
					</strong>
				</div>
			) : null}
			<div className="grid grid-cols-1 gap-1.5">
				{SCENE_PRESETS.map(scene => {
					const isActive = store.activeScenePresetId === scene.id;
					const isFav = store.favoriteSceneIds.includes(scene.id);
					const customLocked =
						scene.id === CUSTOM_SCENE_ID &&
						!store.customSceneUserPatch;
					return (
						<div key={scene.id} className="relative">
							<button
								type="button"
								disabled={customLocked}
								onClick={() => store.applyScenePreset(scene)}
								className="w-full rounded border py-1.5 pr-7 pl-2 text-left transition-colors hover:bg-white/5 disabled:cursor-not-allowed"
								style={{
									borderColor: isActive
										? 'var(--editor-accent-color)'
										: 'var(--editor-accent-border)',
									background: isActive
										? 'var(--editor-surface-bg)'
										: 'var(--editor-bg)',
									boxShadow: isActive
										? '0 0 0 1px color-mix(in srgb, var(--editor-accent-color) 55%, transparent), 0 4px 14px color-mix(in srgb, var(--editor-accent-color) 18%, transparent)'
										: 'inset 0 0 0 1px color-mix(in srgb, var(--editor-accent-color) 22%, transparent)',
									opacity: customLocked ? 0.42 : 1
								}}
							>
								<div
									className="text-[11px] font-semibold"
									style={{
										color: 'var(--editor-accent-fg)',
										opacity: isActive ? 1 : 0.92
									}}
								>
									{sceneTitle(scene)}
								</div>
								<div
									className="text-[10px]"
									style={{ color: 'var(--editor-accent-muted)' }}
								>
									{scene.description}
								</div>
							</button>
							<button
								type="button"
								aria-label={t.label_favorite_toggle}
								title={t.label_favorite_toggle}
								onClick={e => {
									e.preventDefault();
									e.stopPropagation();
									store.toggleFavoriteSceneId(scene.id);
								}}
								className="absolute top-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded border text-[12px] leading-none transition-colors hover:bg-white/10"
								style={{
									borderColor: 'var(--editor-accent-border)',
									color: isFav
										? 'var(--editor-active-fg)'
										: 'var(--editor-accent-muted)'
								}}
							>
								{isFav ? '★' : '☆'}
							</button>
						</div>
					);
				})}
			</div>

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
										value={image.sceneOverrideId ?? ''}
										onChange={event =>
											store.setBackgroundImageSceneOverride(
												image.assetId,
												event.target.value || null
											)
										}
									>
										<option value="">None (use global)</option>
										{sceneChoicesForSlides.map(s => (
											<option key={s.id} value={s.id}>
												{sceneTitle(s)}
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
