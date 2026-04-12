import SliderControl from '@/components/controls/SliderControl';
import ToggleControl from '@/components/controls/ToggleControl';
import SectionDivider from '@/components/controls/ui/SectionDivider';
import { useDialog } from '@/components/controls/ui/DialogProvider';
import type { BackgroundImageItem } from '@/types/wallpaper';
import BgSectionCard from './BgSectionCard';
import BgSlideshowControls from './BgSlideshowControls';
import { useLocalFolders } from '@/hooks/useLocalFolders';
import { useWallpaperStore } from '@/store/wallpaperStore';

export default function SlideshowPoolSection({
	t,
	imageIds,
	backgroundImages,
	activeImage,
	activeImageIndex,
	showPoolThumbnails,
	onToggleShowThumbnails,
	onMultiUploadClick,
	onClearAllImages,
	onSetActiveImage,
	onRemoveImage,
	onMoveLeft,
	onMoveRight,
	onShuffle,
	onVirtualImageSelect
}: {
	t: Record<string, string>;
	imageIds: string[];
	backgroundImages: BackgroundImageItem[];
	activeImage: BackgroundImageItem | null;
	activeImageIndex: number;
	showPoolThumbnails: boolean;
	onToggleShowThumbnails: (value: boolean) => void;
	onMultiUploadClick: () => void;
	onClearAllImages: () => void;
	onSetActiveImage: (id: string) => void;
	onRemoveImage: (index: number) => void;
	onMoveLeft: () => void;
	onMoveRight: () => void;
	onShuffle: () => void;
	onVirtualImageSelect: (virtualId: string, fileName: string) => void;
}) {
	const { confirm } = useDialog();
	const localFolders = useLocalFolders();

	async function handleShuffle() {
		const ok = await confirm({
			title: t.label_shuffle_order,
			message: t.confirm_shuffle_order,
			confirmLabel: t.label_shuffle_order,
			cancelLabel: t.label_cancel,
			tone: 'warning'
		});
		if (!ok) return;
		onShuffle();
	}

	return (
		<BgSectionCard
			title={t.label_slideshow_pool}
			hint={t.hint_slideshow_pool}
		>
			<div className="flex gap-2">
				<button
					onClick={onMultiUploadClick}
					className="flex-1 rounded border px-3 py-1 text-xs transition-colors"
					style={{
						background: 'var(--editor-button-bg)',
						borderColor: 'var(--editor-button-border)',
						color: 'var(--editor-button-fg)'
					}}
				>
					{t.upload_images}
				</button>
				{imageIds.length > 0 && (
					<button
						onClick={onClearAllImages}
						className="rounded border border-red-900 px-2 py-1 text-xs text-red-500 transition-colors hover:border-red-600"
					>
						✕
					</button>
				)}
			</div>

			<div className="mt-2 mb-1">
				<ToggleControl
					label={(t as any).label_enable_virtual_folders ?? 'Enable Virtual Folders'}
					value={useWallpaperStore(state => state.virtualFoldersEnabled)}
					onChange={useWallpaperStore.getState().setVirtualFoldersEnabled}
					tooltip={(t as any).hint_virtual_folders ?? 'Scan and show local folders (may cause lag if many files)'}
				/>
			</div>

			{useWallpaperStore.getState().virtualFoldersEnabled && localFolders.imageFolderLoaded && localFolders.imageFiles.length > 0 && (
				<div
					className="flex flex-col gap-2 rounded border px-2 py-2"
					style={{
						borderColor: 'var(--editor-button-border)',
						background: 'var(--editor-surface-bg)'
					}}
				>
					<div className="flex justify-between items-center pb-1 border-b" style={{ borderColor: 'var(--editor-accent-border)' }}>
						<span className="text-[10px]" style={{ color: 'var(--editor-accent-soft)' }}>
							📁 {(t as any).label_virtual_image_folder ?? 'Virtual Folder'} ({localFolders.imageFiles.length})
						</span>
						<button
							onClick={() => {
								for (const fileConf of localFolders.imageFiles) {
									onVirtualImageSelect(fileConf.virtualId, fileConf.name);
								}
							}}
							className="rounded px-2 flex-shrink-0 ml-2 py-1 text-[10px] bg-cyan-900/30 text-cyan-400 border border-cyan-800/60 transition-colors hover:bg-cyan-800/50"
						>
							+ Add All
						</button>
					</div>

					<div className="flex flex-col max-h-32 overflow-y-auto gap-0.5 pr-1 mt-1 custom-scrollbar">
						{localFolders.imageFiles.map(f => (
							<button
								key={f.virtualId}
								onClick={() => onVirtualImageSelect(f.virtualId, f.name)}
								className="flex justify-between items-center px-1.5 py-1 text-xs rounded transition-colors text-left group"
								style={{ color: 'var(--editor-button-fg)' }}
								onMouseEnter={e => (e.currentTarget.style.background = 'var(--editor-button-bg)')}
								onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
							>
								<span className="truncate pr-2">{f.name}</span>
								<span className="text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
									Add
								</span>
							</button>
						))}
					</div>
				</div>
			)}

			{backgroundImages.length > 0 && (
				<div className="flex flex-col gap-2">
					<ToggleControl
						label={t.label_show_bg_thumbnails}
						value={showPoolThumbnails}
						onChange={onToggleShowThumbnails}
						tooltip={t.hint_show_bg_thumbnails}
					/>

					{activeImage && backgroundImages.length > 1 && (
						<>
							<span
								className="text-[11px]"
								style={{ color: 'var(--editor-accent-muted)' }}
							>
								{t.hint_shuffle_order}
							</span>
							<div className="grid grid-cols-3 gap-2">
								<button
									onClick={onMoveLeft}
									disabled={activeImageIndex <= 0}
									className="rounded border px-3 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40"
									style={{
										background: 'var(--editor-button-bg)',
										borderColor: 'var(--editor-button-border)',
										color: 'var(--editor-button-fg)'
									}}
								>
									{t.label_move_left}
								</button>
								<button
									onClick={onMoveRight}
									disabled={
										activeImageIndex < 0 ||
										activeImageIndex >=
											backgroundImages.length - 1
									}
									className="rounded border px-3 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40"
									style={{
										background: 'var(--editor-button-bg)',
										borderColor: 'var(--editor-button-border)',
										color: 'var(--editor-button-fg)'
									}}
								>
									{t.label_move_right}
								</button>
								<button
									onClick={() => void handleShuffle()}
									className="rounded border px-3 py-1 text-xs transition-colors"
									style={{
										background: 'var(--editor-button-bg)',
										borderColor: 'var(--editor-button-border)',
										color: 'var(--editor-button-fg)'
									}}
								>
									{t.label_shuffle_order}
								</button>
							</div>
						</>
					)}

					{showPoolThumbnails && (
						<div className="flex flex-col gap-2">
							<div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-[16rem] overflow-y-auto pr-1 custom-scrollbar">
								{backgroundImages.map((image, imageIndex) => {
									const isActive = activeImage?.assetId === image.assetId;
									return (
										<div
											key={image.assetId}
											className="relative group aspect-video"
										>
											<img
												src={image.url ?? ''}
												alt=""
												loading="lazy"
												onClick={() => onSetActiveImage(image.assetId)}
												className={`w-full h-full cursor-pointer rounded object-cover transition-colors border-2 ${
													isActive
														? 'border-cyan-500 scale-[1.02]'
														: 'border-transparent hover:border-gray-500'
												}`}
											/>
											<button
												onClick={() => onRemoveImage(imageIndex)}
												className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600/90 text-xs leading-none text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
											>
												×
											</button>
											<span
												className="pointer-events-none absolute bottom-0 left-0 rounded-tr px-1.5 py-0.5 text-[9px] font-medium tracking-wider"
												style={{
													background: 'rgba(0,0,0,0.7)',
													color: 'white'
												}}
											>
												{imageIndex + 1}
											</span>
										</div>
									);
								})}
							</div>
							<span className="self-end text-[10px] text-gray-500">
								{backgroundImages.length} {t.label_images_loaded}
							</span>
						</div>
					)}

					{!showPoolThumbnails && (
						<span
							className="text-[11px]"
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							{backgroundImages.length} {t.label_images_loaded}
						</span>
					)}
				</div>
			)}

			{backgroundImages.length > 1 ? (
				<>
					<SectionDivider label={t.section_slideshow} />
					<BgSlideshowControls />
				</>
			) : (
				<span
					className="text-[11px]"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					{t.hint_slideshow_pool}
				</span>
			)}
		</BgSectionCard>
	);
}
