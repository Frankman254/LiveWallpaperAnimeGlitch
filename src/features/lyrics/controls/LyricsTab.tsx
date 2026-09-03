import { RotateCcw } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import {
	Button,
	EditorTabFooter,
	EditorTabHeader,
	EditorTabLayout,
	ICON_SIZE
} from '@/ui';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';
import LyricsTabBody from './LyricsTabBody';

export default function LyricsTab({ onReset }: { onReset: () => void }) {
	const t = useT();
	const { audioLyricsEnabled, setAudioLyricsEnabled } = useWallpaperStore(
		useShallow(s => ({
			audioLyricsEnabled: s.audioLyricsEnabled,
			setAudioLyricsEnabled: s.setAudioLyricsEnabled
		}))
	);

	return (
		<EditorTabLayout
			header={
				<EditorTabHeader
					title={t.tab_lyrics}
					subtitle={t.lyrics_subtitle}
					enabled={audioLyricsEnabled}
					onToggle={setAudioLyricsEnabled}
					switchAriaLabel={t.label_lyrics_enabled}
				/>
			}
			footer={
				<EditorTabFooter title={t.label_reset}>
					<Button
						type="button"
						onClick={onReset}
						size="sm"
						density="compact"
						variant="secondary"
						icon={<RotateCcw size={ICON_SIZE.xs} />}
					>
						{t.reset_tab}
					</Button>
				</EditorTabFooter>
			}
		>
			<LyricsTabBody onReset={onReset} />
		</EditorTabLayout>
	);
}
