import {
	Music2,
	Pause,
	Play,
	Repeat,
	SkipBack,
	SkipForward
} from 'lucide-react';
import IconButton from '../ui/IconButton';
import { ICON_SIZE } from '../ui/designTokens';
import type { DockInsetStyle } from './types';

export default function MediaDockTransportRow({
	isFileMode,
	effectivelyPaused,
	audioFileLoop,
	trackName,
	hudIconBtn,
	primaryHudIconBtn,
	edgeInsetStyle,
	onTogglePlay,
	onPrevTrack,
	onNextTrack,
	onToggleLoop
}: {
	isFileMode: boolean;
	effectivelyPaused: boolean;
	audioFileLoop: boolean;
	trackName: string;
	hudIconBtn: string;
	primaryHudIconBtn: string;
	edgeInsetStyle: DockInsetStyle;
	onTogglePlay: () => void;
	onPrevTrack: () => void;
	onNextTrack: () => void;
	onToggleLoop: () => void;
}) {
	return (
		<div
			className="flex w-full flex-wrap items-center gap-2 sm:flex-nowrap"
			style={edgeInsetStyle}
		>
			<div className="flex shrink-0 items-center gap-1">
				{isFileMode ? (
					<IconButton
						onClick={onPrevTrack}
						title="Previous track"
						className={hudIconBtn}
					>
						<SkipBack size={ICON_SIZE.sm} />
					</IconButton>
				) : (
					<span
						className="flex h-7 w-7 shrink-0 items-center justify-center border"
						aria-hidden
						style={{
							borderRadius: 'var(--editor-radius-md)',
							background:
								'color-mix(in srgb, var(--editor-button-bg) 55%, transparent)',
							borderColor:
								'color-mix(in srgb, var(--editor-button-border) 70%, transparent)',
							color: 'var(--editor-accent-muted)',
							backdropFilter: 'blur(6px)',
							WebkitBackdropFilter: 'blur(6px)'
						}}
					>
						<Music2 size={ICON_SIZE.sm} />
					</span>
				)}

				<IconButton
					active
					onClick={onTogglePlay}
					title={effectivelyPaused ? 'Play' : 'Pause'}
					className={`${primaryHudIconBtn} shrink-0`}
					style={{
						boxShadow:
							'0 0 6px color-mix(in srgb, var(--editor-accent-color) 60%, transparent)'
					}}
				>
					{effectivelyPaused ? (
						<Play size={ICON_SIZE.sm} className="ml-0.5" />
					) : (
						<Pause size={ICON_SIZE.sm} />
					)}
				</IconButton>

				{isFileMode ? (
					<IconButton
						onClick={onNextTrack}
						title="Next track"
						className={hudIconBtn}
					>
						<SkipForward size={ICON_SIZE.sm} />
					</IconButton>
				) : null}
				{isFileMode ? (
					<IconButton
						active={audioFileLoop}
						onClick={onToggleLoop}
						title="Repeat track"
						className={hudIconBtn}
					>
						<Repeat size={ICON_SIZE.sm} />
					</IconButton>
				) : null}
			</div>

			<span
				className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-snug"
				style={{ color: 'var(--editor-accent-soft)' }}
				title={trackName}
			>
				{trackName}
			</span>
		</div>
	);
}
