import { FileText, RotateCcw } from 'lucide-react';
import { Button, ICON_SIZE, UI_COLORS } from '@/ui';
import { useT } from '@/lib/i18n';
import LyricsTabBody from './LyricsTabBody';
import ModernLegacyTabAdapter from './ModernLegacyTabAdapter';

export default function ModernLyricsTab({
	onReset
}: {
	onReset: () => void;
}) {
	const t = useT();

	return (
		<ModernLegacyTabAdapter
			title={t.tab_lyrics}
			subtitle="Lyrixa import, track target, sync timeline, and lyric source controls."
			action={
				<div className="flex items-center gap-1.5">
					<FileText size={14} style={{ color: UI_COLORS.accent }} />
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
				</div>
			}
		>
			<LyricsTabBody onReset={onReset} />
		</ModernLegacyTabAdapter>
	);
}
