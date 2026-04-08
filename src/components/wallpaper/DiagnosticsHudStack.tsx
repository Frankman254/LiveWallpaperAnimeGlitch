import { useWallpaperStore } from '@/store/wallpaperStore';
import BackgroundScaleMeter from '@/components/wallpaper/BackgroundScaleMeter';
import SpectrumDiagnosticsHud from '@/components/wallpaper/SpectrumDiagnosticsHud';
import LogoDiagnosticsHud from '@/components/wallpaper/LogoDiagnosticsHud';
import { useBackgroundPalette } from '@/hooks/useBackgroundPalette';
import { getScopedEditorThemeColorVars } from '@/components/controls/editorTheme';

export default function DiagnosticsHudStack() {
	const showBg = useWallpaperStore(s => s.showBackgroundScaleMeter);
	const showSpectrum = useWallpaperStore(s => s.showSpectrumDiagnosticsHud);
	const showLogo = useWallpaperStore(s => s.showLogoDiagnosticsHud);
	const editorTheme = useWallpaperStore(s => s.editorTheme);
	const editorThemeColorSource = useWallpaperStore(
		s => s.editorThemeColorSource
	);
	const editorManualAccentColor = useWallpaperStore(
		s => s.editorManualAccentColor
	);
	const editorManualSecondaryColor = useWallpaperStore(
		s => s.editorManualSecondaryColor
	);
	const editorManualBackdropColor = useWallpaperStore(
		s => s.editorManualBackdropColor
	);
	const backgroundPalette = useBackgroundPalette();
	const themeVars = getScopedEditorThemeColorVars(
		editorThemeColorSource,
		backgroundPalette,
		editorTheme,
		{
			accent: editorManualAccentColor,
			secondary: editorManualSecondaryColor,
			backdrop: editorManualBackdropColor
		}
	);

	if (!showBg && !showSpectrum && !showLogo) return null;

	return (
		<div
			className="pointer-events-none fixed left-3 top-14 z-130 flex w-[min(calc(100vw-1.5rem),288px)] flex-col gap-2"
			style={themeVars}
		>
			{showBg && <BackgroundScaleMeter />}
			{showSpectrum && <SpectrumDiagnosticsHud />}
			{showLogo && <LogoDiagnosticsHud />}
		</div>
	);
}
