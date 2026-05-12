import { FileText } from 'lucide-react';
import { SectionCard, UI_COLORS } from '@/ui';
import { useT } from '@/lib/i18n';
import { LyricsTab } from '../../controlTabsLazy';

export default function ModernLyricsTab({
	onReset
}: {
	onReset: () => void;
}) {
	const t = useT();

	return (
		<div className="flex flex-col gap-2">
			<SectionCard
				title={t.tab_lyrics}
				subtitle="Lyrixa import, track target, sync timeline, and lyric source controls."
				density="compact"
				action={<FileText size={14} style={{ color: UI_COLORS.accent }} />}
			>
				<div
					className="rounded-[var(--editor-radius-md)] border p-2"
					style={{
						borderColor: UI_COLORS.hairline,
						background: UI_COLORS.overlay
					}}
				>
					<LyricsTab onReset={onReset} />
				</div>
			</SectionCard>
		</div>
	);
}
