import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import {
	SCENE_PRESETS,
	findScenePresetById
} from '@/features/scenes/scenePresets';
import SectionDivider from '../ui/SectionDivider';
import ResetButton from '../ui/ResetButton';

export default function SceneTab({ onReset }: { onReset: () => void }) {
	const t = useT();
	const store = useWallpaperStore();
	const activeScene = findScenePresetById(store.activeScenePresetId);

	return (
		<>
			<ResetButton label="Reset scene bindings" onClick={onReset} />
			<p
				className="text-[10px] leading-snug"
				style={{ color: 'var(--editor-accent-muted)' }}
			>
				{t.hint_scene_no_image_filters}
			</p>

			<SectionDivider label="Scene presets" />
			{activeScene ? (
				<div
					className="rounded-md px-3 py-1.5 text-[11px]"
					style={{
						background: 'var(--editor-surface-bg)',
						color: 'var(--editor-active-fg)',
						border: '1px solid var(--editor-active-fg)',
						opacity: 0.9
					}}
				>
					Scene global: <strong>{activeScene.name}</strong>
				</div>
			) : null}
			<div className="grid grid-cols-1 gap-1.5">
				{SCENE_PRESETS.map(scene => {
					const isActive = store.activeScenePresetId === scene.id;
					return (
						<button
							key={scene.id}
							type="button"
							onClick={() => store.applyScenePreset(scene)}
							className="rounded border px-2 py-1.5 text-left transition-colors hover:bg-white/5"
							style={{
								borderColor: isActive
									? 'var(--editor-active-fg)'
									: 'var(--editor-accent-border)',
								background: isActive
									? 'var(--editor-surface-bg)'
									: 'var(--editor-bg)'
							}}
						>
							<div
								className="text-[11px] font-semibold"
								style={{ color: 'var(--editor-accent-fg)' }}
							>
								{scene.name}
							</div>
							<div
								className="text-[10px]"
								style={{ color: 'var(--editor-accent-muted)' }}
							>
								{scene.description}
							</div>
						</button>
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
											color: 'var(--editor-accent-fg)'
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
										{SCENE_PRESETS.map(s => (
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
