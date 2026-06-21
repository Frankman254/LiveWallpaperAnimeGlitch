import type { AudioPlaylistTrack } from '@/types/wallpaper';
import { Button, Slider, UI_COLORS } from '@/ui';
import { InfoText, MetricBar } from './AudioSharedControls';
import { formatTime } from './audioTabUtils';

type AudioTrackDetailLabels = {
	format: string;
	loudness: string;
	duration: string;
	intro: string;
	mixOut: string;
	playToAnalyze: string;
	beat: string;
	energy: string;
	density: string;
	setAsNext: string;
	queuedAsNext: string;
	delete: string;
	reanalyze: string;
};

export default function AudioTrackDetailPanel({
	track,
	onUpdate,
	onQueue,
	onRemove,
	onPlay,
	isQueued,
	isActive,
	labels
}: {
	track: AudioPlaylistTrack;
	onUpdate: (patch: Partial<AudioPlaylistTrack>) => void;
	onQueue: () => void;
	onRemove: () => void;
	onPlay: () => void;
	isQueued: boolean;
	isActive: boolean;
	labels: AudioTrackDetailLabels;
}) {
	const durationSeconds = (track.durationMs ?? 0) / 1000;
	const contentStartSeconds = (track.contentStartMs ?? 0) / 1000;
	const mixOutSeconds = (track.mixOutStartMs ?? track.durationMs ?? 0) / 1000;
	return (
		<div
			className="mt-1 flex flex-col gap-3 rounded-[var(--editor-radius-md)] border p-2"
			style={{
				borderColor: UI_COLORS.border,
				background: UI_COLORS.panel
			}}
		>
			<div
				className="grid grid-cols-1 gap-1 border-b pb-2 text-[10px] sm:grid-cols-3"
				style={{
					borderColor: UI_COLORS.hairline,
					color: UI_COLORS.fgMute
				}}
			>
				<span>
					{labels.format}: {track.mimeType.split('/')[1] || 'audio'}
				</span>
				<span>
					{labels.loudness}:{' '}
					{track.loudnessDb !== undefined
						? `${track.loudnessDb} dB`
						: '??'}
				</span>
				<span>
					{labels.duration}:{' '}
					{track.durationMs ? formatTime(durationSeconds) : '??'}
				</span>
			</div>
			{track.durationMs ? (
				<div className="flex flex-col gap-2">
					<Slider
						label={labels.intro}
						value={contentStartSeconds}
						min={0}
						max={durationSeconds * 0.4}
						step={0.1}
						onChange={value =>
							onUpdate({ contentStartMs: value * 1000 })
						}
						variant="compact"
						formatValue={formatTime}
					/>
					<Slider
						label={labels.mixOut}
						value={mixOutSeconds}
						min={durationSeconds * 0.5}
						max={durationSeconds}
						step={0.1}
						onChange={value =>
							onUpdate({ mixOutStartMs: value * 1000 })
						}
						variant="compact"
						formatValue={formatTime}
					/>
				</div>
			) : (
				<InfoText>{labels.playToAnalyze}</InfoText>
			)}
			<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
				{track.beatStrength !== undefined ? (
					<MetricBar label={labels.beat} value={track.beatStrength} />
				) : null}
				{track.energyScore !== undefined ? (
					<MetricBar
						label={labels.energy}
						value={track.energyScore}
					/>
				) : null}
				{track.densityScore !== undefined ? (
					<MetricBar
						label={labels.density}
						value={track.densityScore}
					/>
				) : null}
			</div>
			<div className="flex flex-wrap gap-1.5">
				{!isActive ? (
					<Button
						size="sm"
						density="compact"
						variant={isQueued ? 'primary' : 'secondary'}
						onClick={onQueue}
					>
						{isQueued ? labels.queuedAsNext : labels.setAsNext}
					</Button>
				) : null}
				<Button size="sm" density="compact" onClick={onPlay}>
					{labels.reanalyze}
				</Button>
				<Button
					size="sm"
					density="compact"
					variant="destructive"
					onClick={onRemove}
				>
					{labels.delete}
				</Button>
			</div>
		</div>
	);
}
