import { Download } from 'lucide-react';
import { EditorTabHeader, EditorTabLayout, ICON_SIZE, UI_COLORS } from '@/ui';
import { useT } from '@/lib/i18n';
import ExportTabBody from './ExportTabBody';

export default function ModernExportTab() {
	const t = useT();

	return (
		<EditorTabLayout
			header={
				<EditorTabHeader
					title={t.tab_export}
					subtitle={t.export_subtitle}
				>
					<Download
						size={ICON_SIZE.sm}
						style={{ color: UI_COLORS.accent }}
					/>
				</EditorTabHeader>
			}
		>
			<ExportTabBody />
		</EditorTabLayout>
	);
}
