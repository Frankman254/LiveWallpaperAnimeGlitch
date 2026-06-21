import { memo, type DragEvent } from 'react';
import { ChevronDown, ChevronUp, Settings, X } from 'lucide-react';
import { useDialog } from '@/components/controls/ui/DialogProvider';
import { useT } from '@/lib/i18n';
import type { AudioPlaylistTrack } from '@/types/wallpaper';
import { IconButton, UI_COLORS, FONT, ICON_SIZE } from '@/ui';
import AudioTrackDetailPanel from './AudioTrackDetailPanel';
import { cleanTrackName } from './audioTabUtils';

function AudioTrackRow({
	track,
	index,
	totalTracks,
	isActive,
	isQueued,
	isDragging,
	isDragOver,
	isExpanded,
	setExpandedTrackId,
	onDragStart,
	onDragOver,
	onDrop,
	onDragEnd,
	onMoveTrackUp,
	onMoveTrackDown,
	onUpdateTrack,
	onRemoveTrack,
	onPlayTrack,
	onQueueTrack
}: {
	track: AudioPlaylistTrack;
	index: number;
	totalTracks: number;
	isActive: boolean;
	isQueued: boolean;
	isDragging: boolean;
	isDragOver: boolean;
	isExpanded: boolean;
	setExpandedTrackId: (value: string | null) => void;
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
}) {
	const t = useT();
	const { confirm } = useDialog();
	async function handleRemoveTrack() {
		const ok = await confirm({
			title: 'Remove track?',
			message: `Remove "${cleanTrackName(track.name)}" from the playlist? This does not delete the file from disk, but local file references cannot be auto-reloaded.`,
			confirmLabel: 'Remove',
			cancelLabel: t.label_cancel ?? 'Cancel',
			tone: 'danger'
		});
		if (!ok) return;
		onRemoveTrack(track.id);
	}

	return (
		<div
			draggable={!isExpanded}
			onDragStart={() => onDragStart(index)}
			onDragOver={event => onDragOver(event, index)}
			onDrop={() => onDrop(index)}
			onDragEnd={onDragEnd}
			className="group flex flex-col gap-1.5 rounded-[var(--editor-radius-sm)] border px-2 py-1.5"
			style={{
				cursor: isExpanded ? 'default' : 'grab',
				opacity: isDragging ? 0.5 : 1,
				borderColor: isActive
					? UI_COLORS.accentBorder
					: isDragOver || isQueued
						? UI_COLORS.borderStrong
						: UI_COLORS.border,
				background: isActive
					? UI_COLORS.accentSoft
					: isQueued || isDragOver
						? UI_COLORS.raised
						: UI_COLORS.panel
			}}
		>
			<div className="flex min-w-0 items-center gap-1.5">
				<span
					className="flex w-5 shrink-0 justify-center text-[10px] tabular-nums"
					style={{
						color: isActive ? UI_COLORS.accent : UI_COLORS.fgMute,
						fontFamily: FONT.mono
					}}
				>
					{isActive ? '▶' : isQueued ? '…' : index + 1}
				</span>
				<button
					type="button"
					onClick={() => onPlayTrack(track.id)}
					className="min-w-0 flex-1 truncate bg-transparent p-0 text-left text-[12px] font-medium outline-none"
					style={{
						color: isActive ? UI_COLORS.accent : UI_COLORS.fg
					}}
					title={`${t.label_play_track}: ${track.name}`}
				>
					{cleanTrackName(track.name)}
				</button>
				{track.estimatedBpm ? (
					<span
						className="rounded px-1.5 py-0.5 text-[9px]"
						style={{
							background: UI_COLORS.overlay,
							color: UI_COLORS.fgMute,
							fontFamily: FONT.mono
						}}
					>
						{Math.round(track.estimatedBpm)} BPM
					</span>
				) : null}
				<IconButton
					size="sm"
					density="compact"
					active={isExpanded}
					onClick={() =>
						setExpandedTrackId(isExpanded ? null : track.id)
					}
					title={t.label_track_settings}
				>
					<Settings size={ICON_SIZE.xs} />
				</IconButton>
				{!isExpanded ? (
					<>
						<IconButton
							size="sm"
							density="compact"
							disabled={index === 0}
							onClick={() => onMoveTrackUp(index)}
							title={t.label_move_up}
						>
							<ChevronUp size={ICON_SIZE.xs} />
						</IconButton>
						<IconButton
							size="sm"
							density="compact"
							disabled={index === totalTracks - 1}
							onClick={() => onMoveTrackDown(index)}
							title={t.label_move_down}
						>
							<ChevronDown size={ICON_SIZE.xs} />
						</IconButton>
						<IconButton
							size="sm"
							density="compact"
							variant="destructive"
							onClick={() => void handleRemoveTrack()}
							title={t.label_remove_track}
						>
							<X size={ICON_SIZE.xs} />
						</IconButton>
					</>
				) : null}
			</div>
			{isExpanded ? (
				<AudioTrackDetailPanel
					track={track}
					onUpdate={patch => onUpdateTrack(track.id, patch)}
					onQueue={() => onQueueTrack(track.id)}
					onRemove={() => void handleRemoveTrack()}
					onPlay={() => onPlayTrack(track.id)}
					isQueued={isQueued}
					isActive={isActive}
					labels={{
						format: t.label_format,
						loudness: t.label_loudness,
						duration: t.label_duration,
						intro: t.label_intro_skip,
						mixOut: t.label_mix_out_point,
						playToAnalyze: t.hint_play_track_to_analyze,
						beat: t.label_beat,
						energy: t.label_energy,
						density: t.label_density,
						setAsNext: t.label_set_as_next,
						queuedAsNext: t.label_queued_as_next,
						delete: t.label_delete,
						reanalyze: t.label_reanalyze_track
					}}
				/>
			) : null}
		</div>
	);
}

export default memo(AudioTrackRow);
