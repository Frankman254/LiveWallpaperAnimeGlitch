import { useWallpaperStore } from '@/store/wallpaperStore';
import BackgroundScaleMeter from '@/components/wallpaper/BackgroundScaleMeter';
import SpectrumDiagnosticsHud from '@/components/wallpaper/SpectrumDiagnosticsHud';
import LogoDiagnosticsHud from '@/components/wallpaper/LogoDiagnosticsHud';

export default function DiagnosticsHudStack() {
	const showBg = useWallpaperStore(s => s.showBackgroundScaleMeter);
	const showSpectrum = useWallpaperStore(s => s.showSpectrumDiagnosticsHud);
	const showLogo = useWallpaperStore(s => s.showLogoDiagnosticsHud);

	if (!showBg && !showSpectrum && !showLogo) return null;

	return (
		<div className="pointer-events-none fixed left-3 top-14 z-130 flex w-[min(calc(100vw-1.5rem),288px)] flex-col gap-2">
			{showBg && <BackgroundScaleMeter />}
			{showSpectrum && <SpectrumDiagnosticsHud />}
			{showLogo && <LogoDiagnosticsHud />}
		</div>
	);
}
