import { FileAudio } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { Button, SectionCard, ICON_SIZE } from '@/ui';
import { InfoText, StatusPill } from './AudioSharedControls';

type StatusTone = 'default' | 'active' | 'warn' | 'danger';

export default function AudioCaptureSection({
	captureMode,
	state,
	isCapturing,
	statusLabel,
	statusTone,
	onStartCapture,
	onStopCapture
}: {
	captureMode: string;
	state: string;
	isCapturing: boolean;
	statusLabel: Record<string, string>;
	statusTone: Record<string, StatusTone>;
	onStartCapture: () => void;
	onStopCapture: () => void;
}) {
	const t = useT();

	return (
		<SectionCard
			title={t.section_audio_capture}
			subtitle={
				captureMode === 'microphone'
					? t.hint_mobile_mode
					: t.hint_capture_window_audio
			}
			density="compact"
			action={
				<StatusPill
					label={statusLabel[state] ?? t.status_idle}
					tone={statusTone[state] ?? 'default'}
				/>
			}
		>
			<div className="flex flex-col gap-3">
				{state === 'no-audio-track' ? (
					<InfoText>{t.hint_share_tab}</InfoText>
				) : null}
				<div className="grid grid-cols-[1fr_auto] gap-1.5">
					<Button
						size="sm"
						density="compact"
						onClick={onStartCapture}
						disabled={isCapturing || state === 'requesting'}
						icon={<FileAudio size={ICON_SIZE.xs} />}
						full
					>
						{state === 'requesting'
							? t.requesting
							: captureMode === 'microphone'
								? t.capture_mic
								: t.capture_desktop}
					</Button>
					<Button
						size="sm"
						density="compact"
						variant="destructive"
						onClick={onStopCapture}
						disabled={!isCapturing}
					>
						{t.stop}
					</Button>
				</div>
			</div>
		</SectionCard>
	);
}
