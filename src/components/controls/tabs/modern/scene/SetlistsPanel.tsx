import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Check, X, Music, Image as ImageIcon } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useDialog } from '@/components/controls/ui/DialogProvider';
import { resolveEditorImagePreviewUrl } from '@/lib/editorImagePreviews';
import {
	BLUR,
	Button,
	GLOW,
	IconButton,
	RADIUS,
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
									<Button
										size="sm"
										density="compact"
										variant="secondary"
										onClick={() =>
											setMembersForId(setlist.id)
										}
									>
										Members ({setlist.imageAssetIds.length}{' '}
										+ {setlist.trackIds.length})
									</Button>
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
			<SetlistMembersModal
				setlist={
					membersForId
						? (setlists.find(s => s.id === membersForId) ?? null)
						: null
				}
				backgroundImages={backgroundImages}
				audioTracks={audioTracks}
				imagePreviewQuality={imagePreviewQuality}
				onToggleImage={assetId => {
					if (membersForId)
						toggleSetlistImage(membersForId, assetId);
				}}
				onToggleTrack={trackId => {
					if (membersForId)
						toggleSetlistTrack(membersForId, trackId);
				}}
				onClose={() => setMembersForId(null)}
			/>
		</SectionCard>
	);
}


/**
 * Members editor as a portal-level modal.
 *
 * The previous popover lived inside the editor panel and inherited its
 * ~400px max width — completely cramped when curating a set out of 80+
 * images. Lifting to a viewport-fixed overlay gives the grid the full
 * window width minus the breathing margin, so an 8-column thumbnail grid
 * is realistic.
 *
 * Pattern mirrors `DialogProvider`: portal to body, backdrop blur, the
 * inner card is `transform: scale(editorUiScale)` so it matches the rest
 * of the editor sizing. Close on Escape / outside click.
 */
function SetlistMembersModal({
	setlist,
	backgroundImages,
	audioTracks,
	imagePreviewQuality,
	onToggleImage,
	onToggleTrack,
	onClose
}: {
	setlist: import('@/types/wallpaper').Setlist | null;
	backgroundImages: import('@/types/wallpaper').BackgroundImageItem[];
	audioTracks: import('@/types/wallpaper').AudioPlaylistTrack[];
	imagePreviewQuality: import('@/types/wallpaper').EditorImagePreviewQuality;
	onToggleImage: (assetId: string) => void;
	onToggleTrack: (trackId: string) => void;
	onClose: () => void;
}) {
	const uiScale = useWallpaperStore(s =>
		Math.min(2, Math.max(0.7, s.editorUiScale ?? 1))
	);

	// Esc to close. body scroll lock while open so the wallpaper underneath
	// can't double-scroll.
	useEffect(() => {
		if (!setlist) return undefined;
		const handleKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleKey);
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			window.removeEventListener('keydown', handleKey);
			document.body.style.overflow = previousOverflow;
		};
	}, [setlist, onClose]);

	if (!setlist) return null;
	if (typeof document === 'undefined') return null;

	const imageMembers = new Set(setlist.imageAssetIds);
	const trackMembers = new Set(setlist.trackIds);

	const modal = (
		<div
			className="fixed inset-0 z-[170] flex items-center justify-center p-4"
			style={{
				background: UI_COLORS.overlayHi,
				backdropFilter: BLUR.heavy,
				WebkitBackdropFilter: BLUR.heavy
			}}
			onClick={onClose}
		>
			<div
				className="flex w-full max-w-[min(1100px,calc(100vw-2rem))] max-h-[calc(100vh-3rem)] flex-col border"
				style={{
					background: UI_COLORS.shell,
					borderColor: UI_COLORS.borderStrong,
					borderRadius: RADIUS.lg,
					boxShadow: GLOW.modal,
					color: UI_COLORS.fg,
					transform:
						uiScale === 1 ? undefined : `scale(${uiScale})`,
					transformOrigin: 'center center'
				}}
				onClick={event => event.stopPropagation()}
			>
				<header
					className="flex items-center justify-between gap-3 border-b px-4 py-3"
					style={{ borderColor: UI_COLORS.hairline }}
				>
					<div className="flex flex-col gap-0.5">
						<h2
							className="text-[14px] font-semibold"
							style={{ color: UI_COLORS.fg }}
						>
							{setlist.name} · Members
						</h2>
						<p
							className="text-[11px]"
							style={{ color: UI_COLORS.fgMute }}
						>
							Click a thumbnail or track to toggle membership.
							Esc to close.
						</p>
					</div>
					<IconButton
						size="sm"
						density="compact"
						onClick={onClose}
						title="Close (Esc)"
					>
						<X size={ICON_SIZE.sm} />
					</IconButton>
				</header>
				<div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
					<div className="flex flex-col gap-4">
						<section>
							<div
								className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-widest"
								style={{
									color: UI_COLORS.fgMute,
									fontFamily: FONT.mono
								}}
							>
								<ImageIcon
									size={ICON_SIZE.xs}
									aria-hidden
								/>
								Images ({setlist.imageAssetIds.length}/
								{backgroundImages.length})
							</div>
							{backgroundImages.length === 0 ? (
								<p
									className="text-[11px]"
									style={{ color: UI_COLORS.fgFaint }}
								>
									No images in the global pool yet.
								</p>
							) : (
								<div
									className="grid gap-2"
									style={{
										// Responsive 6→10 cols based on
										// viewport, ~110px min tile so a
										// 4K-wide overlay shows ~10 cols.
										gridTemplateColumns:
											'repeat(auto-fill, minmax(110px, 1fr))'
									}}
								>
									{backgroundImages.map(img => {
										const checked = imageMembers.has(
											img.assetId
										);
										const previewUrl =
											resolveEditorImagePreviewUrl(
												img,
												imagePreviewQuality,
												false
											);
										return (
											<button
												key={img.assetId}
												type="button"
												onClick={() =>
													onToggleImage(img.assetId)
												}
												className="relative aspect-square overflow-hidden rounded border transition"
												style={{
													borderColor: checked
														? UI_COLORS.accent
														: UI_COLORS.border,
													opacity: checked ? 1 : 0.55
												}}
												title={
													checked
														? 'Click to remove'
														: 'Click to add'
												}
											>
												{previewUrl ? (
													<img
														src={previewUrl}
														alt=""
														className="h-full w-full object-cover"
														loading="lazy"
													/>
												) : (
													<div
														className="h-full w-full"
														style={{
															background:
																UI_COLORS.raised
														}}
													/>
												)}
												{checked ? (
													<div
														className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full"
														style={{
															background:
																UI_COLORS.accent,
															color: UI_COLORS.accentFg
														}}
													>
														<Check
															size={12}
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
						</section>
						<section>
							<div
								className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-widest"
								style={{
									color: UI_COLORS.fgMute,
									fontFamily: FONT.mono
								}}
							>
								<Music size={ICON_SIZE.xs} aria-hidden />
								Tracks ({setlist.trackIds.length}/
								{audioTracks.length})
							</div>
							{audioTracks.length === 0 ? (
								<p
									className="text-[11px]"
									style={{ color: UI_COLORS.fgFaint }}
								>
									No tracks in the playlist yet.
								</p>
							) : (
								<div
									className="grid gap-1"
									style={{
										gridTemplateColumns:
											'repeat(auto-fill, minmax(260px, 1fr))'
									}}
								>
									{audioTracks.map(track => {
										const checked = trackMembers.has(
											track.id
										);
										return (
											<button
												key={track.id}
												type="button"
												onClick={() =>
													onToggleTrack(track.id)
												}
												className="flex items-center gap-2 rounded border px-2 py-1.5 text-left text-[12px] transition"
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
						</section>
					</div>
				</div>
				<footer
					className="flex items-center justify-between gap-2 border-t px-4 py-2"
					style={{ borderColor: UI_COLORS.hairline }}
				>
					<span
						className="text-[10px]"
						style={{
							color: UI_COLORS.fgMute,
							fontFamily: FONT.mono
						}}
					>
						{setlist.imageAssetIds.length} img ·{' '}
						{setlist.trackIds.length} trk
					</span>
					<Button
						size="sm"
						density="compact"
						variant="primary"
						onClick={onClose}
					>
						Done
					</Button>
				</footer>
			</div>
		</div>
	);

	return createPortal(modal, document.body);
}
