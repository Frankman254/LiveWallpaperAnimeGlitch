import { Download } from 'lucide-react';
import { SectionCard, UI_COLORS } from '@/ui';
import { useT } from '@/lib/i18n';
import { ExportTab } from '../../controlTabsLazy';

export default function ModernExportTab() {
	const t = useT();

	return (
		<div className="flex flex-col gap-2">
			<SectionCard
				title={t.tab_export}
				subtitle="Project bundles, selective export, asset handling, and video export settings."
				density="compact"
				action={<Download size={14} style={{ color: UI_COLORS.accent }} />}
			>
				<div
					className="rounded-[var(--editor-radius-md)] border p-2"
					style={{
						borderColor: UI_COLORS.hairline,
						background: UI_COLORS.overlay
					}}
				>
					<ExportTab />
				</div>
			</SectionCard>
		</div>
	);
}
