import type { ReactNode } from 'react';
import { AudioDataProvider } from '@/context/AudioDataContext';
import { I18nProvider } from '@/lib/i18n';
import { DialogProvider } from '@/components/controls/ui/DialogProvider';
import { useAutoSleepMode } from '@/hooks/useAutoSleepMode';

function SleepModeBootstrap() {
	useAutoSleepMode();
	return null;
}

export default function WallpaperAppProviders({
	children
}: {
	children: ReactNode;
}) {
	return (
		<I18nProvider>
			<AudioDataProvider>
				<DialogProvider>
					<SleepModeBootstrap />
					{children}
				</DialogProvider>
			</AudioDataProvider>
		</I18nProvider>
	);
}
