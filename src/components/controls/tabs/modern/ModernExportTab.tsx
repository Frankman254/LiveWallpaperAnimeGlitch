import { Download } from 'lucide-react';
import { UI_COLORS } from '@/ui';
import { useT } from '@/lib/i18n';
import ExportTabBody from './ExportTabBody';
import ModernLegacyTabAdapter from './ModernLegacyTabAdapter';

export default function ModernExportTab() {
	const t = useT();

	return (
		<ModernLegacyTabAdapter
			title={t.tab_export}
			subtitle="Project bundles, selective export, asset handling, and video export settings."
			action={<Download size={14} style={{ color: UI_COLORS.accent }} />}
		>
			<ExportTabBody />
		</ModernLegacyTabAdapter>
	);
}
