import { useT } from '@/lib/i18n';
import { AUDIO_REACTIVE_CHANNELS } from '@/lib/audio/audioChannels';
import type { AudioReactiveChannel } from '@/types/wallpaper';
import { FONT, UI_COLORS } from '@/ui';
import EnumButtons from './EnumButtons';

interface AudioChannelSelectorProps {
	value: AudioReactiveChannel;
	onChange: (value: AudioReactiveChannel) => void;
	label?: string;
}

export default function AudioChannelSelector({
	value,
	onChange,
	label
}: AudioChannelSelectorProps) {
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
		<div className="flex flex-col gap-2">
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
			<EnumButtons<AudioReactiveChannel>
				options={AUDIO_REACTIVE_CHANNELS}
				value={value}
				onChange={onChange}
				labels={labels}
			/>
		</div>
	);
}
