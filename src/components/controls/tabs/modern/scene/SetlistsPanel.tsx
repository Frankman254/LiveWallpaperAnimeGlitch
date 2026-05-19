import { useEffect, useRef, useState } from 'react';
import { Plus, Check, X, Music, Image as ImageIcon } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useDialog } from '@/components/controls/ui/DialogProvider';
import { resolveEditorImagePreviewUrl } from '@/lib/editorImagePreviews';
import {
	Button,
	FloatingPanel,
	IconButton,
	SectionCard,
	UI_COLORS,
	FONT,
	ICON_SIZE
} from '@/ui';

/**
 * SetlistsPanel — UI for the Setlist concept (curated subsets of the
 * global image pool + audio playlist). Lives inside the Scene tab as a
 * sub-tab next to Scene Slots.
 *
 * V1 scope:
 *   - Create / rename / delete (with confirm) / activate / deactivate
 *   - Member management via a "Members" popover: checklist of all images +
 *     tracks with toggle. The pool/playlist views also filter when a
 *     setlist is active (handled in their own components), so the user
 *     can also pick by selecting the active set and walking the pool.
 *
 * Out of scope for V1: drag-drop reordering, duplicate setlist, color
 * tag/cover image. Add when asked.
 */

export default function SetlistsPanel() {
	const { confirm } = useDialog();
	const {
		setlists,
		activeSetlistId,
		backgroundImages,
		audioTracks,
		imagePreviewQuality,
		addSetlist,
		renameSetlist,
		deleteSetlist,
		setActiveSetlistId,
		toggleSetlistImage,
		toggleSetlistTrack
	} = useWallpaperStore(
		useShallow(s => ({
			setlists: s.setlists,
			activeSetlistId: s.activeSetlistId,
			backgroundImages: s.backgroundImages,
			audioTracks: s.audioTracks,
			imagePreviewQuality: s.editorImagePreviewQuality,
			addSetlist: s.addSetlist,
			renameSetlist: s.renameSetlist,
			deleteSetlist: s.deleteSetlist,
			setActiveSetlistId: s.setActiveSetlistId,
			toggleSetlistImage: s.toggleSetlistImage,
			toggleSetlistTrack: s.toggleSetlistTrack
		}))
	);

	const [renameId, setRenameId] = useState<string | null>(null);
	const [renameDraft, setRenameDraft] = useState('');
	const [membersForId, setMembersForId] = useState<string | null>(null);
	const renameInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (renameId && renameInputRef.current) {
			renameInputRef.current.focus();
			renameInputRef.current.select();
		}
	}, [renameId]);

	async function handleDelete(id: string, name: string) {
		const ok = await confirm({
			title: 'Delete setlist?',
			message: `Delete "${name}"? The global pool and playlist are NOT affected — only this curated bookmark goes away. This cannot be undone.`,
			confirmLabel: 'Delete',
			cancelLabel: 'Cancel',
			tone: 'danger'
		});
		if (!ok) return;
		deleteSetlist(id);
	}

	function commitRename(id: string) {
		const next = renameDraft.trim();
		if (next.length > 0) renameSetlist(id, next);
		setRenameId(null);
	}

	return (
		<SectionCard
			title="Setlists"
			subtitle={
				activeSetlistId
					? 'Pool + playlist are filtered to the active setlist'
					: 'Curate subsets of the global pool for each mix/video'
			}
			action={
				<IconButton
					size="sm"
					density="compact"
					onClick={() => addSetlist()}
					title="New setlist"
				>
					<Plus size={ICON_SIZE.sm} />
				</IconButton>
			}
			density="compact"
			padded={false}
		>
			{setlists.length === 0 ? (
				<p
					className="px-4 py-3 text-[11px]"
					style={{ color: UI_COLORS.fgMute }}
				>
					No setlists yet. Click + to create one and assign images +
					tracks. Activating a setlist hides everything else.
				</p>
			) : (
				<div className="flex flex-col">
					{setlists.map((setlist, idx) => {
						const isActive = activeSetlistId === setlist.id;
						const isRenaming = renameId === setlist.id;
						const showMembers = membersForId === setlist.id;
						return (
							<div
								key={setlist.id}
								className="flex flex-col gap-2 px-4 py-2"
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
								<div className="flex items-center gap-2">
									{isRenaming ? (
										<input
											ref={renameInputRef}
											value={renameDraft}
											onChange={e =>
												setRenameDraft(e.target.value)
											}
											onBlur={() =>
												commitRename(setlist.id)
											}
											onKeyDown={e => {
												if (e.key === 'Enter')
													commitRename(setlist.id);
												if (e.key === 'Escape')
													setRenameId(null);
											}}
											className="flex-1 rounded border px-2 py-0.5 text-[12px] outline-none"
											style={{
												background: UI_COLORS.raised,
												borderColor:
													UI_COLORS.accentBorder,
												color: UI_COLORS.fg
											}}
										/>
									) : (
										<button
											type="button"
											onClick={() => {
												setRenameDraft(setlist.name);
												setRenameId(setlist.id);
											}}
											className="flex-1 text-left text-[12px] font-medium"
											style={{
												color: isActive
													? UI_COLORS.accent
													: UI_COLORS.fg,
												fontFamily: FONT.ui
											}}
											title="Click to rename"
										>
											{setlist.name}
										</button>
									)}
									<span
										className="text-[10px] tabular-nums"
										style={{
											color: UI_COLORS.fgMute,
											fontFamily: FONT.mono
										}}
									>
										{setlist.imageAssetIds.length} img ·{' '}
										{setlist.trackIds.length} trk
									</span>
								</div>
								<div className="flex flex-wrap items-center gap-1.5">
									{isActive ? (
										<Button
											size="sm"
											density="compact"
											variant="secondary"
											onClick={() =>
												setActiveSetlistId(null)
											}
										>
											Deactivate
										</Button>
									) : (
										<Button
											size="sm"
											density="compact"
											variant="primary"
											onClick={() =>
												setActiveSetlistId(setlist.id)
											}
										>
											Activate
										</Button>
									)}
									<div className="relative">
										<Button
											size="sm"
											density="compact"
											variant="secondary"
											onClick={() =>
												setMembersForId(
													showMembers
														? null
														: setlist.id
												)
											}
										>
											Members
										</Button>
										<FloatingPanel
											open={showMembers}
											onClose={() =>
												setMembersForId(null)
											}
											anchor="bottom"
											className="min-w-[18rem] max-w-[24rem] p-2 max-h-[60vh] overflow-y-auto custom-scrollbar"
										>
											<SetlistMembersEditor
												setlist={setlist}
												backgroundImages={
													backgroundImages
												}
												audioTracks={audioTracks}
												imagePreviewQuality={
													imagePreviewQuality
												}
												onToggleImage={assetId =>
													toggleSetlistImage(
														setlist.id,
														assetId
													)
												}
												onToggleTrack={trackId =>
													toggleSetlistTrack(
														setlist.id,
														trackId
													)
												}
											/>
										</FloatingPanel>
									</div>
									<IconButton
										size="sm"
										density="compact"
										variant="destructive"
										onClick={() =>
											void handleDelete(
												setlist.id,
												setlist.name
											)
										}
										title="Delete setlist (with confirmation)"
									>
										<X size={ICON_SIZE.xs} />
									</IconButton>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</SectionCard>
	);
}

function SetlistMembersEditor({
	setlist,
	backgroundImages,
	audioTracks,
	imagePreviewQuality,
	onToggleImage,
	onToggleTrack
}: {
	setlist: import('@/types/wallpaper').Setlist;
	backgroundImages: import('@/types/wallpaper').BackgroundImageItem[];
	audioTracks: import('@/types/wallpaper').AudioPlaylistTrack[];
	imagePreviewQuality: import('@/types/wallpaper').EditorImagePreviewQuality;
	onToggleImage: (assetId: string) => void;
	onToggleTrack: (trackId: string) => void;
}) {
	const imageMembers = new Set(setlist.imageAssetIds);
	const trackMembers = new Set(setlist.trackIds);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-1">
				<div
					className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest"
					style={{
						color: UI_COLORS.fgMute,
						fontFamily: FONT.mono
					}}
				>
					<ImageIcon size={ICON_SIZE.xs} aria-hidden />
					Images ({setlist.imageAssetIds.length}/
					{backgroundImages.length})
				</div>
				{backgroundImages.length === 0 ? (
					<p
						className="text-[10px]"
						style={{ color: UI_COLORS.fgFaint }}
					>
						No images in pool yet.
					</p>
				) : (
					<div className="grid grid-cols-4 gap-1">
						{backgroundImages.map(img => {
							const checked = imageMembers.has(img.assetId);
							const previewUrl = resolveEditorImagePreviewUrl(
								img,
								imagePreviewQuality,
								false
							);
							return (
								<button
									key={img.assetId}
									type="button"
									onClick={() => onToggleImage(img.assetId)}
									className="relative aspect-square overflow-hidden rounded border transition"
									style={{
										borderColor: checked
											? UI_COLORS.accent
											: UI_COLORS.border,
										opacity: checked ? 1 : 0.55
									}}
									title={
										checked
											? 'Click to remove from setlist'
											: 'Click to add to setlist'
									}
								>
									{previewUrl ? (
										<img
											src={previewUrl}
											alt=""
											className="h-full w-full object-cover"
										/>
									) : (
										<div
											className="h-full w-full"
											style={{
												background: UI_COLORS.raised
											}}
										/>
									)}
									{checked ? (
										<div
											className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full"
											style={{
												background: UI_COLORS.accent,
												color: UI_COLORS.accentFg
											}}
										>
											<Check
												size={10}
												strokeWidth={3}
												aria-hidden
											/>
										</div>
									) : null}
								</button>
							);
						})}
					</div>
				)}
			</div>
			<div className="flex flex-col gap-1">
				<div
					className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest"
					style={{
						color: UI_COLORS.fgMute,
						fontFamily: FONT.mono
					}}
				>
					<Music size={ICON_SIZE.xs} aria-hidden />
					Tracks ({setlist.trackIds.length}/{audioTracks.length})
				</div>
				{audioTracks.length === 0 ? (
					<p
						className="text-[10px]"
						style={{ color: UI_COLORS.fgFaint }}
					>
						No tracks in playlist yet.
					</p>
				) : (
					<div className="flex flex-col gap-0.5">
						{audioTracks.map(track => {
							const checked = trackMembers.has(track.id);
							return (
								<button
									key={track.id}
									type="button"
									onClick={() => onToggleTrack(track.id)}
									className="flex items-center gap-2 rounded border px-2 py-1 text-left text-[11px] transition"
									style={{
										borderColor: checked
											? UI_COLORS.accent
											: UI_COLORS.border,
										background: checked
											? UI_COLORS.accentSoft
											: 'transparent',
										color: checked
											? UI_COLORS.fg
											: UI_COLORS.fgMute
									}}
								>
									<span
										className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
										style={{
											borderColor: checked
												? UI_COLORS.accent
												: UI_COLORS.border,
											background: checked
												? UI_COLORS.accent
												: 'transparent',
											color: UI_COLORS.accentFg
										}}
									>
										{checked ? (
											<Check
												size={10}
												strokeWidth={3}
												aria-hidden
											/>
										) : null}
									</span>
									<span className="truncate flex-1">
										{track.name || 'Untitled'}
									</span>
								</button>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
