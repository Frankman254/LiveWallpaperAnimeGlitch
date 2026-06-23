import { FileText, RotateCcw } from 'lucide-react';
import {
	Button,
	EditorTabFooter,
	EditorTabHeader,
	EditorTabLayout,
	ICON_SIZE,
	UI_COLORS
} from '@/ui';
import { useT } from '@/lib/i18n';
import LyricsTabBody from './LyricsTabBody';

export default function LyricsTab({ onReset }: { onReset: () => void }) {
	const t = useT();

	return (
		<EditorTabLayout
			header={
				<EditorTabHeader
					title={t.tab_lyrics}
					subtitle={t.lyrics_subtitle}
				>
					<FileText
						size={ICON_SIZE.sm}
						style={{ color: UI_COLORS.accent }}
					/>
				</EditorTabHeader>
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
