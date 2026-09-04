import { AUDIO_REACTIVE_CHANNELS } from '@/lib/audio/audioChannels';
import { useT } from '@/lib/i18n';
import type { AudioReactiveChannel } from '@/types/wallpaper';
import { Button, FONT, UI_COLORS } from '@/ui';

export default function BgAudioChannelSelector({
	value,
	onChange,
	label
}: {
	value: AudioReactiveChannel;
	onChange: (value: AudioReactiveChannel) => void;
	label?: string;
}) {
	const t = useT();
	const labels: Record<AudioReactiveChannel, string> = {
		auto: t.channel_auto,
		kick: t.channel_kick,
		instrumental: t.channel_instrumental,
		bass: t.channel_bass,
		hihat: t.channel_hihat,
		vocal: t.channel_vocal,
		full: t.channel_full
	};

	return (
		<div className="flex flex-col gap-1.5">
			<span
				className="uppercase"
				style={{
					color: UI_COLORS.fgMute,
					fontFamily: FONT.mono,
					fontSize: 10,
					fontWeight: 650,
					letterSpacing: '0.1em'
				}}
			>
				{label ?? t.label_audio_channel}
			</span>
			<div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
				{AUDIO_REACTIVE_CHANNELS.map(channel => (
					<Button
						key={channel}
						size="sm"
						density="compact"
						variant={value === channel ? 'primary' : 'secondary'}
						active={value === channel}
						onClick={() => onChange(channel)}
						full
					>
						{labels[channel]}
					</Button>
				))}
			</div>
		</div>
	);
}
