import { useEffect, useRef, useState } from 'react';
import { Plus, Check, X, Music, Image as ImageIcon } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useDialog } from '@/components/controls/ui/DialogProvider';
import { resolveEditorImagePreviewUrl } from '@/lib/editorImagePreviews';
import { useT } from '@/lib/i18n';
import {
	Button,
	IconButton,
	SectionCard,
	ToggleSwitch,
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
	const t = useT();
	const { confirm } = useDialog();
	const {
		setlists,
		activeSetlistId,
		backgroundImages,
		audioTracks,
		imagePreviewQuality,
		showSetlistHud,
		addSetlist,
		renameSetlist,
		deleteSetlist,
		setActiveSetlistId,
		toggleSetlistImage,
		toggleSetlistTrack,
		setShowSetlistHud
	} = useWallpaperStore(
		useShallow(s => ({
			setlists: s.setlists,
			activeSetlistId: s.activeSetlistId,
			backgroundImages: s.backgroundImages,
			audioTracks: s.audioTracks,
			imagePreviewQuality: s.editorImagePreviewQuality,
			showSetlistHud: s.showSetlistHud,
			addSetlist: s.addSetlist,
			renameSetlist: s.renameSetlist,
			deleteSetlist: s.deleteSetlist,
			setActiveSetlistId: s.setActiveSetlistId,
			toggleSetlistImage: s.toggleSetlistImage,
			toggleSetlistTrack: s.toggleSetlistTrack,
			setShowSetlistHud: s.setShowSetlistHud
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
			title: t.setlists_delete_title,
			message: t.setlists_delete_message_template.replace('{name}', name),
			confirmLabel: t.setlists_btn_delete,
			cancelLabel: t.setlists_btn_cancel,
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
			title={t.setlists_section_title}
			subtitle={
				activeSetlistId
					? t.setlists_subtitle_active
					: t.setlists_subtitle_idle
			}
			action={
				<IconButton
					size="sm"
					density="compact"
					onClick={() => addSetlist()}
					title={t.setlists_btn_new}
				>
					<Plus size={ICON_SIZE.sm} />
				</IconButton>
			}
			density="compact"
			padded={false}
		>
			<div
				className="flex items-center justify-between gap-2 border-b px-4 py-1.5"
				style={{
					borderColor: UI_COLORS.hairline,
					color: UI_COLORS.fgMute,
					fontSize: 11
				}}
			>
				<span style={{ fontFamily: FONT.mono }}>
					{t.setlists_label_show_hud_chip}
				</span>
				<ToggleSwitch
					size="sm"
					checked={showSetlistHud}
					onChange={setShowSetlistHud}
					ariaLabel={t.setlists_aria_toggle_chip}
				/>
			</div>
			{setlists.length === 0 ? (
				<p
					className="px-4 py-3 text-[11px]"
					style={{ color: UI_COLORS.fgMute }}
				>
					{t.setlists_empty_state}
				</p>
			) : (
				// Body grows with content. The outer editor-scroll container in
				// ControlPanel/EditorOverlay owns scrolling; an inner
				// overflow-y-auto here would swallow wheel events when its
				// content fits but the outer page needs to scroll (e.g. after
				// opening Members on a long setlist).
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
											title={t.setlists_tooltip_click_rename}
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
										{t.setlists_count_template
											.replace(
												'{images}',
												String(
													setlist.imageAssetIds.length
												)
											)
											.replace(
												'{tracks}',
												String(setlist.trackIds.length)
											)}
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
											{t.setlists_btn_deactivate}
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
											{t.setlists_btn_activate}
										</Button>
									)}
									<Button
										size="sm"
										density="compact"
										variant={
											membersForId === setlist.id
												? 'primary'
												: 'secondary'
										}
										onClick={() =>
											setMembersForId(
												membersForId === setlist.id
													? null
													: setlist.id
											)
										}
									>
										{membersForId === setlist.id
											? t.setlists_btn_hide_members
											: t.setlists_btn_members_template
													.replace(
														'{images}',
														String(
															setlist
																.imageAssetIds
																.length
														)
													)
													.replace(
														'{tracks}',
														String(
															setlist.trackIds
																.length
														)
													)}
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
										title={t.setlists_tooltip_delete}
									>
										<X size={ICON_SIZE.xs} />
									</IconButton>
								</div>
								{membersForId === setlist.id ? (
									<SetlistMembersEditor
										setlist={setlist}
										backgroundImages={backgroundImages}
										audioTracks={audioTracks}
										imagePreviewQuality={
											imagePreviewQuality
										}
										t={t}
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
								) : null}
							</div>
						);
					})}
				</div>
			)}
		</SectionCard>
	);
}

/**
 * Inline members editor — rendered below the setlist card when the user
 * clicks "Members". Uses the available width naturally (no popover, no
 * modal). Image grid auto-fills based on the editor panel's current
 * width — wider panel = more columns.
 */
function SetlistMembersEditor({
	setlist,
	backgroundImages,
	audioTracks,
	imagePreviewQuality,
	t,
	onToggleImage,
	onToggleTrack
}: {
	setlist: import('@/types/wallpaper').Setlist;
	backgroundImages: import('@/types/wallpaper').BackgroundImageItem[];
	audioTracks: import('@/types/wallpaper').AudioPlaylistTrack[];
	imagePreviewQuality: import('@/types/wallpaper').EditorImagePreviewQuality;
	t: import('@/lib/i18n').Translations;
	onToggleImage: (assetId: string) => void;
	onToggleTrack: (trackId: string) => void;
}) {
	const imageMembers = new Set(setlist.imageAssetIds);
	const trackMembers = new Set(setlist.trackIds);

	return (
		<div
			className="mt-2 flex flex-col gap-3 rounded-md border p-2"
			style={{
				borderColor: UI_COLORS.hairline,
				background: UI_COLORS.raised
			}}
		>
			<section className="flex flex-col gap-1">
				<div
					className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest"
					style={{
						color: UI_COLORS.fgMute,
						fontFamily: FONT.mono
					}}
				>
					<ImageIcon size={ICON_SIZE.xs} aria-hidden />
					{t.setlists_members_images_label_template
						.replace(
							'{selected}',
							String(setlist.imageAssetIds.length)
						)
						.replace('{total}', String(backgroundImages.length))}
				</div>
				{backgroundImages.length === 0 ? (
					<p
						className="text-[10px]"
						style={{ color: UI_COLORS.fgFaint }}
					>
						{t.setlists_members_no_images}
					</p>
				) : (
					<div
						className="grid gap-1"
						style={{
							gridTemplateColumns:
								'repeat(auto-fill, minmax(72px, 1fr))'
						}}
					>
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
											? t.setlists_members_img_remove_tooltip
											: t.setlists_members_img_add_tooltip
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
												background: UI_COLORS.shell
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
			</section>
			<section className="flex flex-col gap-1">
				<div
					className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest"
					style={{
						color: UI_COLORS.fgMute,
						fontFamily: FONT.mono
					}}
				>
					<Music size={ICON_SIZE.xs} aria-hidden />
					{t.setlists_members_tracks_label_template
						.replace('{selected}', String(setlist.trackIds.length))
						.replace('{total}', String(audioTracks.length))}
				</div>
				{audioTracks.length === 0 ? (
					<p
						className="text-[10px]"
						style={{ color: UI_COLORS.fgFaint }}
					>
						{t.setlists_members_no_tracks}
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
										{track.name || t.setlists_track_untitled}
									</span>
								</button>
							);
						})}
					</div>
				)}
			</section>
		</div>
	);
}

