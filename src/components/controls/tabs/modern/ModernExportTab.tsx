import { Download } from 'lucide-react';
import { ICON_SIZE, UI_COLORS } from '@/ui';
import { useT } from '@/lib/i18n';
import ExportTabBody from './ExportTabBody';
import ModernLegacyTabAdapter from './ModernLegacyTabAdapter';

export default function ModernExportTab() {
	const t = useT();

	return (
		<ModernLegacyTabAdapter
			title={t.tab_export}
			subtitle={t.export_subtitle}
			action={<Download size={ICON_SIZE.sm} style={{ color: UI_COLORS.accent }} />}
		>
			<ExportTabBody />
		</ModernLegacyTabAdapter>
	);
}
