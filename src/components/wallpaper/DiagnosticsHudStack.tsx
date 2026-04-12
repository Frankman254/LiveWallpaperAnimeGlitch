import { useWallpaperStore } from '@/store/wallpaperStore';
import BackgroundScaleMeter from '@/components/wallpaper/BackgroundScaleMeter';
import SpectrumDiagnosticsHud from '@/components/wallpaper/SpectrumDiagnosticsHud';
import LogoDiagnosticsHud from '@/components/wallpaper/LogoDiagnosticsHud';
import { useBackgroundPalette } from '@/hooks/useBackgroundPalette';
import {
	getEditorRadiusVars,
	getScopedEditorThemeColorVars
} from '@/components/controls/editorTheme';

export default function DiagnosticsHudStack() {
	const showBg = useWallpaperStore(s => s.showBackgroundScaleMeter);
	const showSpectrum = useWallpaperStore(s => s.showSpectrumDiagnosticsHud);
	const showLogo = useWallpaperStore(s => s.showLogoDiagnosticsHud);
	const editorTheme = useWallpaperStore(s => s.editorTheme);
	const editorCornerRadius = useWallpaperStore(s => s.editorCornerRadius);
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
	const editorManualTextPrimaryColor = useWallpaperStore(
		s => s.editorManualTextPrimaryColor
	);
	const editorManualTextSecondaryColor = useWallpaperStore(
		s => s.editorManualTextSecondaryColor
	);
	const editorManualBackdropOpacity = useWallpaperStore(
		s => s.editorManualBackdropOpacity
	);
	const editorManualBlurPx = useWallpaperStore(s => s.editorManualBlurPx);
	const editorManualSurfaceOpacity = useWallpaperStore(
		s => s.editorManualSurfaceOpacity
	);
	const editorManualItemOpacity = useWallpaperStore(
		s => s.editorManualItemOpacity
	);
	const backgroundPalette = useBackgroundPalette();
	const themeVars = getScopedEditorThemeColorVars(
		editorThemeColorSource,
		backgroundPalette,
		editorTheme,
		{
			accent: editorManualAccentColor,
			secondary: editorManualSecondaryColor,
			backdrop: editorManualBackdropColor,
			textPrimary: editorManualTextPrimaryColor,
			textSecondary: editorManualTextSecondaryColor
		},
		{
			backdropOpacity: editorManualBackdropOpacity,
			blurPx: editorManualBlurPx,
			surfaceOpacity: editorManualSurfaceOpacity,
			itemOpacity: editorManualItemOpacity
		}
	);
	const radiusVars = getEditorRadiusVars(editorCornerRadius);

	if (!showBg && !showSpectrum && !showLogo) return null;

	return (
		<div
			className="pointer-events-none fixed left-3 top-14 z-130 flex w-[min(calc(100vw-1.5rem),288px)] flex-col gap-2"
			style={{ ...themeVars, ...radiusVars }}
		>
			{showBg && <BackgroundScaleMeter />}
			{showSpectrum && <SpectrumDiagnosticsHud />}
			{showLogo && <LogoDiagnosticsHud />}
		</div>
	);
}
