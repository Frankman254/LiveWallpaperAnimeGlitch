import type { ChangeEvent, DragEvent, RefObject } from 'react';
import {
	Clock,
	FolderPlus,
	Pause,
	Play,
	SkipBack,
	SkipForward,
	Upload
} from 'lucide-react';
import { useDialog } from '@/components/controls/ui/DialogProvider';
import { useT } from '@/lib/i18n';
import type { AudioPlaylistTrack } from '@/types/wallpaper';
import { Button, SectionCard, UI_COLORS, FONT, ICON_SIZE } from '@/ui';
import {
	MetricBar,
	SectionLabel,
	StatusPill,
	ToggleRow
} from './AudioSharedControls';
import AudioTrackRow from './AudioTrackRow';
import { cleanTrackName } from './audioTabUtils';

type VirtualAudioFile = {
	name: string;
	virtualId: string;
};

export default function AudioPlaylistSection({
	uploadRef,
	hasPlaylist,
	audioTracks,
	activeTrack,
	queuedTrack,
	activeAudioTrackId,
	queuedAudioTrackId,
	virtualFoldersEnabled,
	setVirtualFoldersEnabled,
	audioFolderLoaded,
	audioFiles,
	duplicateWarnings,
	dragIndex,
	dragOverIndex,
	expandedTrackId,
	setExpandedTrackId,
	enabledTracksCount,
	crossfadeState,
	effectiveAudioPaused,
	isCapturing,
	canMixNow,
	onUpload,
	onClearPlaylist,
	onAddAllVirtualAudio,
	onAddVirtualAudio,
	onDragStart,
	onDragOver,
	onDrop,
	onDragEnd,
	onMoveTrackUp,
	onMoveTrackDown,
	onUpdateTrack,
	onRemoveTrack,
	onPlayTrack,
	onQueueTrack,
	onPlayPrevTrack,
	onPlayNextTrack,
	onPlaybackToggle,
	onMixNow
}: {
	uploadRef: RefObject<HTMLInputElement | null>;
	hasPlaylist: boolean;
	audioTracks: AudioPlaylistTrack[];
	activeTrack: AudioPlaylistTrack | undefined;
	queuedTrack: AudioPlaylistTrack | undefined;
	activeAudioTrackId: string | null;
	queuedAudioTrackId: string | null;
	virtualFoldersEnabled: boolean;
	setVirtualFoldersEnabled: (value: boolean) => void;
	audioFolderLoaded: boolean;
	audioFiles: VirtualAudioFile[];
	duplicateWarnings: string[];
	dragIndex: number | null;
	dragOverIndex: number | null;
	expandedTrackId: string | null;
	setExpandedTrackId: (value: string | null) => void;
	enabledTracksCount: number;
	crossfadeState: { isFading: boolean; progress: number };
	effectiveAudioPaused: boolean;
	isCapturing: boolean;
	canMixNow: boolean;
	onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
	onClearPlaylist: () => void;
	onAddAllVirtualAudio: () => void;
	onAddVirtualAudio: (name: string, virtualId: string) => void;
	onDragStart: (index: number) => void;
	onDragOver: (event: DragEvent, index: number) => void;
	onDrop: (index: number) => void;
	onDragEnd: () => void;
	onMoveTrackUp: (index: number) => void;
	onMoveTrackDown: (index: number) => void;
	onUpdateTrack: (id: string, patch: Partial<AudioPlaylistTrack>) => void;
	onRemoveTrack: (id: string) => void;
	onPlayTrack: (id: string) => void;
	onQueueTrack: (id: string) => void;
	onPlayPrevTrack: () => void;
	onPlayNextTrack: () => void;
	onPlaybackToggle: () => void;
	onMixNow: () => void;
}) {
	const t = useT();
	const { confirm } = useDialog();
	async function handleClearPlaylist() {
		const ok = await confirm({
			title: 'Clear playlist?',
			message:
				'This removes ALL tracks from the playlist. Local file references cannot be re-loaded automatically — you would have to re-pick the files. This action cannot be undone.',
			confirmLabel: 'Clear playlist',
			cancelLabel: t.label_cancel ?? 'Cancel',
			tone: 'danger'
		});
		if (!ok) return;
		onClearPlaylist();
	}

	return (
		<SectionCard
			title={t.section_audio_playlist}
			subtitle={t.hint_auto_mix}
			density="compact"
			action={
				hasPlaylist ? (
					<Button
						size="sm"
						density="compact"
						variant="destructive"
						onClick={() => void handleClearPlaylist()}
						title={t.playlist_clear_tooltip}
					>
						{t.label_clear_playlist}
					</Button>
				) : null
			}
		>
			<div className="flex flex-col gap-3">
				<input
					ref={uploadRef}
					type="file"
					accept="audio/*"
					multiple
					onChange={onUpload}
					className="hidden"
				/>
				<Button
					size="lg"
					density="compact"
					full
					variant="secondary"
					icon={<Upload size={ICON_SIZE.sm} />}
					onClick={() => uploadRef.current?.click()}
				>
					<span className="flex min-w-0 flex-col items-center leading-tight">
						<span>
							{hasPlaylist
								? t.label_add_more_tracks
								: t.label_add_audio_files}
						</span>
						<span
							className="text-[9px] font-normal"
							style={{ color: UI_COLORS.fgMute }}
						>
							MP3 / WAV / FLAC / OGG
						</span>
					</span>
				</Button>
				<ToggleRow
					label={
						(t as Record<string, string>)
							.label_enable_virtual_folders ??
						'Enable Virtual Folders'
					}
					hint={
						(t as Record<string, string>).hint_virtual_folders ??
						'Scan and show local folders when available.'
					}
					checked={virtualFoldersEnabled}
					onChange={setVirtualFoldersEnabled}
				/>
				{virtualFoldersEnabled &&
				audioFolderLoaded &&
				audioFiles.length > 0 ? (
					<div
						className="flex flex-col gap-2 rounded-[var(--editor-radius-md)] border p-2"
						style={{
							borderColor: UI_COLORS.border,
							background: UI_COLORS.raised
						}}
					>
						<div className="flex items-center justify-between gap-2">
							<SectionLabel>
								{(t as Record<string, string>)
									.label_virtual_audio_folder ??
									'Virtual Folder'}{' '}
								({audioFiles.length})
							</SectionLabel>
							<Button
								size="sm"
								density="compact"
								icon={<FolderPlus size={ICON_SIZE.xs} />}
								onClick={onAddAllVirtualAudio}
							>
								Add All
							</Button>
						</div>
						<div className="editor-scroll flex max-h-32 flex-col gap-1 overflow-y-auto pr-1">
							{audioFiles.map(fileEntry => (
								<Button
									key={fileEntry.virtualId}
									size="sm"
									density="compact"
									variant="ghost"
									className="justify-between"
									onClick={() =>
										onAddVirtualAudio(
											fileEntry.name,
											fileEntry.virtualId
										)
									}
								>
									<span className="truncate">
										{fileEntry.name}
									</span>
									<span style={{ color: UI_COLORS.accent }}>
										Add
									</span>
								</Button>
							))}
						</div>
					</div>
				) : null}
				{duplicateWarnings.length > 0 ? (
					<div
						className="rounded-[var(--editor-radius-md)] border px-3 py-2 text-[10px]"
						style={{
							borderColor: UI_COLORS.warnBorder,
							background: UI_COLORS.warnSoft,
							color: UI_COLORS.warn
						}}
					>
						<span className="font-semibold">
							{t.label_skipped_duplicates}
						</span>{' '}
						{duplicateWarnings.join(', ')}
					</div>
				) : null}
				{activeTrack ? (
					<div
						className="flex min-w-0 items-center gap-2 rounded-[var(--editor-radius-md)] border px-3 py-2"
						style={{
							borderColor: UI_COLORS.accentBorder,
							background: UI_COLORS.accentSoft
						}}
					>
						<Play
							size={ICON_SIZE.sm}
							style={{ color: UI_COLORS.accent }}
						/>
						<div className="min-w-0 flex-1">
							<div
								className="truncate text-[12px] font-semibold"
								style={{ color: UI_COLORS.fg }}
							>
								{cleanTrackName(activeTrack.name)}
							</div>
							{activeTrack.energyScore !== undefined ? (
								<MetricBar
									label={t.label_energy}
									value={activeTrack.energyScore}
								/>
							) : null}
						</div>
						<StatusPill label={t.label_playing} tone="active" />
					</div>
				) : null}
				{queuedTrack ? (
					<div
						className="flex min-w-0 items-center gap-2 rounded-[var(--editor-radius-md)] border px-3 py-2"
						style={{
							borderColor: UI_COLORS.border,
							background: UI_COLORS.raised
						}}
					>
						<Clock
							size={ICON_SIZE.sm}
							style={{ color: UI_COLORS.fgMute }}
						/>
						<span
							className="min-w-0 flex-1 truncate text-[12px]"
							style={{ color: UI_COLORS.fg }}
						>
							{cleanTrackName(queuedTrack.name)}
						</span>
						<StatusPill label={t.label_up_next} />
					</div>
				) : null}
				{hasPlaylist ? (
					<div
						className="editor-scroll flex max-h-[15rem] flex-col gap-1 overflow-y-auto rounded-[var(--editor-radius-md)] border p-1"
						style={{
							borderColor: UI_COLORS.border,
							background: UI_COLORS.overlay
						}}
					>
						{audioTracks.map((track, index) => (
							<AudioTrackRow
								key={track.id}
								track={track}
								index={index}
								totalTracks={audioTracks.length}
								isActive={track.id === activeAudioTrackId}
								isQueued={track.id === queuedAudioTrackId}
								isDragging={dragIndex === index}
								isDragOver={dragOverIndex === index}
								isExpanded={expandedTrackId === track.id}
								setExpandedTrackId={setExpandedTrackId}
								onDragStart={onDragStart}
								onDragOver={onDragOver}
								onDrop={onDrop}
								onDragEnd={onDragEnd}
								onMoveTrackUp={onMoveTrackUp}
								onMoveTrackDown={onMoveTrackDown}
								onUpdateTrack={onUpdateTrack}
								onRemoveTrack={onRemoveTrack}
								onPlayTrack={onPlayTrack}
								onQueueTrack={onQueueTrack}
							/>
						))}
					</div>
				) : null}
				{hasPlaylist ? (
					<div className="grid grid-cols-3 gap-1.5">
						<Button
							size="sm"
							density="compact"
							icon={<SkipBack size={ICON_SIZE.xs} />}
							onClick={onPlayPrevTrack}
							disabled={
								enabledTracksCount < 2 ||
								crossfadeState.isFading
							}
							full
						>
							{t.label_previous_track}
						</Button>
						<Button
							size="sm"
							density="compact"
							variant={
								effectiveAudioPaused ? 'secondary' : 'primary'
							}
							icon={
								effectiveAudioPaused ? (
									<Play size={ICON_SIZE.xs} />
								) : (
									<Pause size={ICON_SIZE.xs} />
								)
							}
							onClick={onPlaybackToggle}
							disabled={!isCapturing}
							full
						>
							{effectiveAudioPaused ? t.resume : t.pause}
						</Button>
						<Button
							size="sm"
							density="compact"
							iconTrailing={<SkipForward size={ICON_SIZE.xs} />}
							onClick={onPlayNextTrack}
							disabled={
								enabledTracksCount < 2 ||
								crossfadeState.isFading
							}
							full
						>
							{t.label_next_track}
						</Button>
					</div>
				) : null}
				{audioTracks.length >= 2 ? (
					<Button
						size="md"
						density="compact"
						full
						variant="secondary"
						onClick={onMixNow}
						disabled={!canMixNow}
					>
						{!activeAudioTrackId
							? t.label_start_track_before_mix
							: queuedAudioTrackId
								? t.label_mix_now
								: t.label_auto_mix_now}
					</Button>
				) : null}
				{crossfadeState.isFading ? (
					<div className="flex flex-col gap-1">
						<div className="flex justify-between text-[10px]">
							<span style={{ color: UI_COLORS.accent }}>
								{t.label_crossfading}
							</span>
							<span
								className="tabular-nums"
								style={{
									color: UI_COLORS.fgMute,
									fontFamily: FONT.mono
								}}
							>
								{Math.round(crossfadeState.progress * 100)}%
							</span>
						</div>
						<div
							className="h-1.5 overflow-hidden rounded-full"
							style={{ background: UI_COLORS.overlay }}
						>
							<div
								className="h-full rounded-full"
								style={{
									width: `${crossfadeState.progress * 100}%`,
									background: UI_COLORS.accent
								}}
							/>
						</div>
					</div>
				) : null}
			</div>
		</SectionCard>
	);
}
