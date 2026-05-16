import { Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import { useT } from '@/lib/i18n';
import {
	Button,
	IconButton,
	SectionCard,
	Slider,
	UI_COLORS,
	FONT,
	ICON_SIZE
} from '@/ui';
import { InfoText, ToggleRow } from './AudioSharedControls';
import { formatDecimal, formatTime } from './audioTabUtils';

export default function AudioTransportSection({
	isFile,
	fileName,
	subtitle,
	currentTime,
	duration,
	seek,
	hasPlaylist,
	effectiveAudioPaused,
	onPlaybackToggle,
	fileVolume,
	setFileVolume,
	fileLoop,
	setFileLoop,
	onToggleAudioOnlyPause,
	onTogglePauseAll,
	motionPaused,
	isAdvanced,
	mediaSessionEnabled,
	setMediaSessionEnabled,
	onReset
}: {
	isFile: boolean;
	fileName: string;
	subtitle: string;
	currentTime: number;
	duration: number;
	seek: (seconds: number) => void;
	hasPlaylist: boolean;
	effectiveAudioPaused: boolean;
	onPlaybackToggle: () => void;
	fileVolume: number;
	setFileVolume: (value: number) => void;
	fileLoop: boolean;
	setFileLoop: (value: boolean) => void;
	onToggleAudioOnlyPause: () => void;
	onTogglePauseAll: () => void;
	motionPaused: boolean;
	isAdvanced: boolean;
	mediaSessionEnabled: boolean;
	setMediaSessionEnabled: (value: boolean) => void;
	onReset: () => void;
}) {
	const t = useT();

	return (
		<SectionCard
			title={t.section_audio_transport}
			subtitle={isFile ? fileName : subtitle}
			density="compact"
			action={
				<IconButton
					size="sm"
					density="compact"
					onClick={onReset}
					title={t.reset_tab}
				>
					<RotateCcw size={ICON_SIZE.xs} />
				</IconButton>
			}
		>
			<div className="flex flex-col gap-3">
				{isFile ? (
					<>
						<div className="flex flex-col gap-1">
							<input
								type="range"
								min={0}
								max={duration || 100}
								step={0.5}
								value={currentTime}
								onChange={event => seek(Number(event.target.value))}
								className="h-1 w-full cursor-pointer accent-[var(--lwag-accent)]"
							/>
							<div
								className="flex justify-between text-[11px] tabular-nums"
								style={{
									color: UI_COLORS.fgMute,
									fontFamily: FONT.mono
								}}
							>
								<span>{formatTime(currentTime)}</span>
								<span>{formatTime(duration)}</span>
							</div>
						</div>
						{!hasPlaylist ? (
							<Button
								size="sm"
								density="compact"
								variant={effectiveAudioPaused ? 'secondary' : 'primary'}
								icon={
									effectiveAudioPaused ? (
										<Play size={ICON_SIZE.xs} />
									) : (
										<Pause size={ICON_SIZE.xs} />
									)
								}
								onClick={onPlaybackToggle}
								full
							>
								{effectiveAudioPaused ? t.resume : t.pause}
							</Button>
						) : null}
						<Slider
							label={t.label_volume}
							value={fileVolume}
							min={0}
							max={1}
							step={0.01}
							onChange={setFileVolume}
							variant="compact"
							formatValue={formatDecimal}
						/>
						<ToggleRow label={t.label_loop} checked={fileLoop} onChange={setFileLoop} />
					</>
				) : null}
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
					<div className="flex flex-col gap-1.5">
						<InfoText>{t.hint_pause_audio_only}</InfoText>
						<Button
							size="sm"
							density="compact"
							icon={<Volume2 size={ICON_SIZE.xs} />}
							onClick={onToggleAudioOnlyPause}
						>
							{effectiveAudioPaused ? t.resume_audio_only : t.pause_audio_only}
						</Button>
					</div>
					<div className="flex flex-col gap-1.5">
						<InfoText>{t.hint_pause_all}</InfoText>
						<Button
							size="sm"
							density="compact"
							variant="warning"
							onClick={onTogglePauseAll}
						>
							{motionPaused ? t.resume_all : t.pause_all}
						</Button>
					</div>
				</div>
				{isAdvanced ? (
					<ToggleRow
						label={t.label_media_session}
						hint={t.hint_media_session}
						checked={mediaSessionEnabled}
						onChange={setMediaSessionEnabled}
					/>
				) : null}
			</div>
		</SectionCard>
	);
}
