import type { ReactNode } from 'react';
import { AudioDataProvider } from '@/context/AudioDataContext';
import { I18nProvider } from '@/lib/i18n';
import { DialogProvider } from '@/components/controls/ui/DialogProvider';
import { useAutoSleepMode } from '@/hooks/useAutoSleepMode';
import { usePlaybackWakeLock } from '@/hooks/usePlaybackWakeLock';
import { useAudioData } from '@/hooks/useAudioData';
import { useWallpaperStore } from '@/store/wallpaperStore';

function SleepModeBootstrap() {
	useAutoSleepMode();
	return null;
}

function PlaybackWakeLockBootstrap() {
	const { captureMode, isPaused } = useAudioData();
	const audioCaptureState = useWallpaperStore(s => s.audioCaptureState);
	const audioPaused = useWallpaperStore(s => s.audioPaused);
	const mediaPlaying =
		audioCaptureState === 'active' &&
		!audioPaused &&
		!(captureMode === 'file' && isPaused);
	usePlaybackWakeLock(mediaPlaying);
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
					<PlaybackWakeLockBootstrap />
					{children}
				</DialogProvider>
			</AudioDataProvider>
		</I18nProvider>
	);
}
