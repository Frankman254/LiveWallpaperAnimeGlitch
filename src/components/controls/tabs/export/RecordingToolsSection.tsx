import EnumButtons from '@/ui/EnumButtonGroup';
import SectionDivider from '@/ui/SectionDivider';
import SliderControl from '../../SliderControl';
import ToggleControl from '../../ToggleControl';

type RecorderStatus = 'idle' | 'recording' | 'saved' | 'error';

type SupportedFormat = {
	id: string;
	label: string;
};

type RecordingToolsSectionProps = {
	status: RecorderStatus;
	statusLabel: string;
	errorMessage: string;
	hintRecordPreview: string;
	hintRecordFormat: string;
	sectionRecordingToolsLabel: string;
	sectionWindowToolsLabel: string;
	labelWindowModes: string;
	miniPlayerHint: string;
	fullscreenSupported: boolean;
	isFullscreen: boolean;
	isMiniPlayerOpen: boolean;
	canExpandMiniPlayer: boolean;
	labelEnterFullscreen: string;
	labelExitFullscreen: string;
	labelOpenMiniPlayer: string;
	labelCloseMiniPlayer: string;
	labelExpandMiniPlayer: string;
	labelRecordFormat: string;
	supportedFormats: SupportedFormat[];
	formatId: string;
	onFormatIdChange: (value: string) => void;
	labelRecordFps: string;
	fpsOptions: readonly string[];
	fps: string;
	onFpsChange: (value: string) => void;
	labelRecordBitrate: string;
	bitrateMbps: number;
	onBitrateChange: (value: number) => void;
	labelRecordAudio: string;
	includeAudio: boolean;
	onIncludeAudioChange: (value: boolean) => void;
	fullscreenAfterCapture: boolean;
	onFullscreenAfterCaptureChange: (value: boolean) => void;
	labelRecordFullscreenAfter: string;
	hintRecordFullscreenAfter: string;
	labelStartRecording: string;
	labelStopRecording: string;
	hasMediaRecorder: boolean;
	onToggleFullscreen: () => void;
	onToggleMiniPlayer: () => void;
	onExpandMiniPlayer: () => void;
	onStartRecording: () => void;
	onStopRecording: () => void;
};

function getStatusClass(status: RecorderStatus): string {
	if (status === 'recording') return 'text-red-400';
	if (status === 'saved') return 'text-green-400';
	if (status === 'error') return 'text-red-500';
	return 'text-cyan-400';
}

function ActionButton({
	children,
	disabled,
	full = false,
	onClick
}: {
	children: string;
	disabled?: boolean;
	full?: boolean;
	onClick: () => void;
}) {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={`${full ? 'w-full' : 'flex-1'} rounded border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40`}
			style={{
				background: 'var(--editor-button-bg)',
				borderColor: 'var(--editor-button-border)',
				color: 'var(--editor-button-fg)'
			}}
		>
			{children}
		</button>
	);
}

export default function RecordingToolsSection({
	status,
	statusLabel,
	errorMessage,
	hintRecordPreview,
	hintRecordFormat,
	sectionRecordingToolsLabel,
	sectionWindowToolsLabel,
	labelWindowModes,
	miniPlayerHint,
	fullscreenSupported,
	isFullscreen,
	isMiniPlayerOpen,
	canExpandMiniPlayer,
	labelEnterFullscreen,
	labelExitFullscreen,
	labelOpenMiniPlayer,
	labelCloseMiniPlayer,
	labelExpandMiniPlayer,
	labelRecordFormat,
	supportedFormats,
	formatId,
	onFormatIdChange,
	labelRecordFps,
	fpsOptions,
	fps,
	onFpsChange,
	labelRecordBitrate,
	bitrateMbps,
	onBitrateChange,
	labelRecordAudio,
	includeAudio,
	onIncludeAudioChange,
	fullscreenAfterCapture,
	onFullscreenAfterCaptureChange,
	labelRecordFullscreenAfter,
	hintRecordFullscreenAfter,
	labelStartRecording,
	labelStopRecording,
	hasMediaRecorder,
	onToggleFullscreen,
	onToggleMiniPlayer,
	onExpandMiniPlayer,
	onStartRecording,
	onStopRecording
}: RecordingToolsSectionProps) {
	return (
		<>
			<SectionDivider label={sectionRecordingToolsLabel} />
			<div className="flex flex-col gap-1">
				<span className={`text-xs ${getStatusClass(status)}`}>
					{statusLabel}
				</span>
				<span className="text-xs text-gray-500">
					{hintRecordPreview}
				</span>
				<span className="text-xs text-gray-500">
					{hintRecordFormat}
				</span>
				{errorMessage ? (
					<span
						className={`text-xs ${
							status === 'error'
								? 'text-red-500'
								: 'text-yellow-400'
						}`}
					>
						{errorMessage}
					</span>
				) : null}
			</div>

			<SectionDivider label={sectionWindowToolsLabel} />
			<div className="flex flex-col gap-1">
				<span
					className="text-xs"
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					{labelWindowModes}
				</span>
				<span className="text-xs text-gray-500">{miniPlayerHint}</span>
			</div>

			<div className="flex gap-2">
				{fullscreenSupported ? (
					<ActionButton
						onClick={onToggleFullscreen}
						disabled={status === 'recording'}
					>
						{isFullscreen
							? labelExitFullscreen
							: labelEnterFullscreen}
					</ActionButton>
				) : null}
				<ActionButton onClick={onToggleMiniPlayer}>
					{isMiniPlayerOpen
						? labelCloseMiniPlayer
						: labelOpenMiniPlayer}
				</ActionButton>
			</div>
			{isMiniPlayerOpen && canExpandMiniPlayer ? (
				<ActionButton full onClick={onExpandMiniPlayer}>
					{labelExpandMiniPlayer}
				</ActionButton>
			) : null}

			<div className="flex flex-col gap-1">
				<span
					className="text-xs"
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					{labelRecordFormat}
				</span>
				<EnumButtons<string>
					options={supportedFormats.map(candidate => candidate.id)}
					value={formatId}
					onChange={onFormatIdChange}
					labels={Object.fromEntries(
						supportedFormats.map(candidate => [
							candidate.id,
							candidate.label
						])
					)}
				/>
			</div>

			<div className="flex flex-col gap-1">
				<span
					className="text-xs"
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					{labelRecordFps}
				</span>
				<EnumButtons<string>
					options={[...fpsOptions]}
					value={fps}
					onChange={onFpsChange}
				/>
			</div>

			<SliderControl
				label={labelRecordBitrate}
				value={bitrateMbps}
				min={6}
				max={40}
				step={1}
				unit="Mbps"
				onChange={onBitrateChange}
			/>
			<ToggleControl
				label={labelRecordAudio}
				value={includeAudio}
				onChange={onIncludeAudioChange}
			/>
			<ToggleControl
				label={labelRecordFullscreenAfter}
				value={fullscreenAfterCapture}
				onChange={onFullscreenAfterCaptureChange}
			/>
			{fullscreenAfterCapture ? (
				<span className="text-xs text-gray-500">
					{hintRecordFullscreenAfter}
				</span>
			) : null}

			<div className="flex gap-2">
				<ActionButton
					onClick={onStartRecording}
					disabled={status === 'recording' || !hasMediaRecorder}
				>
					{labelStartRecording}
				</ActionButton>
				<button
					onClick={onStopRecording}
					disabled={status !== 'recording'}
					className="rounded border border-red-800 px-3 py-1.5 text-xs text-red-400 transition-colors hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-40"
				>
					{labelStopRecording}
				</button>
			</div>
		</>
	);
}
