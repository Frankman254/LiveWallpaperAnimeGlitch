import type { ReactNode } from 'react';
import { AudioDataProvider } from '@/context/AudioDataContext';
import { I18nProvider } from '@/lib/i18n';
import { DialogProvider } from '@/components/controls/ui/DialogProvider';

export default function WallpaperAppProviders({
	children
}: {
	children: ReactNode;
}) {
	return (
		<I18nProvider>
			<AudioDataProvider>
				<DialogProvider>{children}</DialogProvider>
			</AudioDataProvider>
		</I18nProvider>
	);
}
