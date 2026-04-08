import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { AUDIO_REACTIVE_CHANNELS } from '@/lib/audio/audioChannels';
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme';
import type { AudioReactiveChannel } from '@/types/wallpaper';
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
	const editorTheme = useWallpaperStore(state => state.editorTheme);
	const theme = EDITOR_THEME_CLASSES[editorTheme];
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
		<div className="flex flex-col gap-0.5">
			<span
				className={`text-xs ${theme.sectionTitle}`}
				style={{ color: 'var(--editor-accent-soft)' }}
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
