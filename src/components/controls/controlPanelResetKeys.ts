import type { WallpaperState } from '@/types/wallpaper';

export type MainTabId =
	| 'scene'
	| 'spectrum'
	| 'looks'
	| 'layers'
	| 'motion'
	| 'audio'
	| 'advanced';

export type AdvancedSubTab =
	| 'track'
	| 'logo'
	| 'diagnostics'
	| 'editor'
	| 'export'
	| 'perf';

export const LEGACY_TAB_KEYS: Record<string, (keyof WallpaperState)[]> = {
	layers: ['layerZIndices'],
	presets: [
		'imageScale',
		'imagePositionX',
		'imagePositionY',
		'imageBassReactive',
		'backgroundImageEnabled',
		'imageOpacity',
		'imageAudioSmoothingEnabled',
		'imageAudioSmoothing',
		'imageOpacityReactive',
		'imageOpacityReactiveAmount',
		'imageOpacityReactiveInvert',
		'imageOpacityReactiveThreshold',
		'imageOpacityReactiveSoftness',
		'imageBlurReactive',
		'imageBlurReactiveAmount',
		'imageBlurReactiveInvert',
		'imageBlurReactiveThreshold',
		'imageBlurReactiveSoftness',
		'imageBassScaleIntensity',
		'imageAudioReactiveDecay',
		'imageBassAttack',
		'imageBassRelease',
		'imageBassReactivitySpeed',
		'imageBassPeakWindow',
		'imageBassPeakFloor',
		'imageBassPunch',
		'imageBassReactiveScaleIntensity',
		'imageAudioChannel',
		'imageFitMode',
		'imageMirror',
		'imageRotation',
		'parallaxStrength',
		'globalBackgroundEnabled',
		'globalBackgroundScale',
		'globalBackgroundPositionX',
		'globalBackgroundPositionY',
		'globalBackgroundFitMode',
		'globalBackgroundOpacity',
		'globalBackgroundBrightness',
		'globalBackgroundContrast',
		'globalBackgroundSaturation',
		'globalBackgroundBlur',
		'globalBackgroundHueRotate',
		'slideshowEnabled',
		'slideshowInterval',
		'slideshowTransitionDuration',
		'slideshowTransitionType',
		'slideshowTransitionIntensity',
		'slideshowTransitionAudioDrive',
		'slideshowTransitionAudioChannel',
		'slideshowAudioCheckpointsEnabled',
		'slideshowTrackChangeSyncEnabled'
	],
	filters: [
		'filterTargets',
		'filterOpacity',
		'filterBrightness',
		'filterContrast',
		'filterSaturation',
		'filterBlur',
		'filterHueRotate',
		'filterVignette',
		'filterBloom',
		'filterLumaThreshold',
		'filterLensWarp',
		'filterHeatDistortion',
		'activeFilterLookId',
		'scanlineIntensity',
		'scanlineMode',
		'scanlineSpacing',
		'scanlineThickness',
		'rgbShift',
		'noiseIntensity',
		'rgbShiftAudioReactive',
		'rgbShiftAudioSensitivity',
		'rgbShiftAudioChannel',
		'rgbShiftAudioSmoothingEnabled',
		'rgbShiftAudioSmoothing'
	],
	audio: [
		'audioPaused',
		'motionPaused',
		'fftSize',
		'audioAutoKickThreshold',
		'audioAutoSwitchHoldMs'
	],
	track: [
		'audioTrackTitleLayoutMode',
		'audioTrackTitleFontStyle',
		'audioTrackTitleUppercase',
		'audioTrackTitleEnabled',
		'audioTrackTitlePositionX',
		'audioTrackTitlePositionY',
		'audioTrackTitleFontSize',
		'audioTrackTitleLetterSpacing',
		'audioTrackTitleWidth',
		'audioTrackTitleOpacity',
		'audioTrackTitleScrollSpeed',
		'audioTrackTitleRgbShift',
		'audioTrackTitleTextColorSource',
		'audioTrackTitleTextColor',
		'audioTrackTitleStrokeColorSource',
		'audioTrackTitleStrokeColor',
		'audioTrackTitleStrokeWidth',
		'audioTrackTitleGlowColorSource',
		'audioTrackTitleGlowColor',
		'audioTrackTitleGlowBlur',
		'audioTrackTitleBackdropEnabled',
		'audioTrackTitleBackdropColorSource',
		'audioTrackTitleBackdropColor',
		'audioTrackTitleBackdropOpacity',
		'audioTrackTitleBackdropPadding',
		'audioTrackTitleFilterBrightness',
		'audioTrackTitleFilterContrast',
		'audioTrackTitleFilterSaturation',
		'audioTrackTitleFilterBlur',
		'audioTrackTitleFilterHueRotate',
		'audioTrackTimeEnabled',
		'audioTrackTimePositionX',
		'audioTrackTimePositionY',
		'audioTrackTimeFontStyle',
		'audioTrackTimeFontSize',
		'audioTrackTimeLetterSpacing',
		'audioTrackTimeOpacity',
		'audioTrackTimeRgbShift',
		'audioTrackTimeTextColorSource',
		'audioTrackTimeTextColor',
		'audioTrackTimeStrokeColorSource',
		'audioTrackTimeStrokeColor',
		'audioTrackTimeStrokeWidth',
		'audioTrackTimeGlowColorSource',
		'audioTrackTimeGlowColor',
		'audioTrackTimeGlowBlur',
		'audioTrackTimeFilterBrightness',
		'audioTrackTimeFilterContrast',
		'audioTrackTimeFilterSaturation',
		'audioTrackTimeFilterBlur',
		'audioTrackTimeFilterHueRotate'
	],
	spectrum: [
		'spectrumEnabled',
		'spectrumMode',
		'spectrumLinearOrientation',
		'spectrumLinearDirection',
		'spectrumRadialShape',
		'spectrumRadialAngle',
		'spectrumRadialFitLogo',
		'spectrumFollowLogo',
		'spectrumLogoGap',
		'spectrumCircularClone',
		'spectrumColorSource',
		'spectrumShape',
		'spectrumSpan',
		'spectrumCloneOpacity',
		'spectrumCloneScale',
		'spectrumCloneGap',
		'spectrumCloneFamily',
		'spectrumCloneTunnelRingCount',
		'spectrumCloneStyle',
		'spectrumCloneRadialShape',
		'spectrumCloneRadialAngle',
		'spectrumCloneBarCount',
		'spectrumCloneBarWidth',
		'spectrumCloneMinHeight',
		'spectrumCloneMaxHeight',
		'spectrumCloneSmoothing',
		'spectrumCloneGlowIntensity',
		'spectrumCloneShadowBlur',
		'spectrumCloneColorSource',
		'spectrumClonePrimaryColor',
		'spectrumCloneSecondaryColor',
		'spectrumCloneColorMode',
		'spectrumCloneBandMode',
		'spectrumCloneAudioSmoothingEnabled',
		'spectrumCloneAudioSmoothing',
		'spectrumCloneRotationSpeed',
		'spectrumCloneMirror',
		'spectrumClonePeakHold',
		'spectrumClonePeakDecay',
		'spectrumCloneFollowLogo',
		'spectrumCloneRadialFitLogo',
		'spectrumCloneWaveFillOpacity',
		'spectrumBarCount',
		'spectrumBarWidth',
		'spectrumMinHeight',
		'spectrumMaxHeight',
		'spectrumSmoothing',
		'spectrumAudioSmoothingEnabled',
		'spectrumAudioSmoothing',
		'spectrumOpacity',
		'spectrumGlowIntensity',
		'spectrumShadowBlur',
		'spectrumPrimaryColor',
		'spectrumSecondaryColor',
		'spectrumColorMode',
		'spectrumBandMode',
		'spectrumWaveFillOpacity',
		'spectrumMirror',
		'spectrumPeakHold',
		'spectrumPeakDecay',
		'spectrumRotationSpeed',
		'spectrumInnerRadius',
		'spectrumPositionX',
		'spectrumPositionY'
	],
	logo: [
		'logoEnabled',
		'logoBaseSize',
		'logoPositionX',
		'logoPositionY',
		'logoAudioSmoothingEnabled',
		'logoAudioSmoothing',
		'logoAudioSensitivity',
		'logoReactiveScaleIntensity',
		'logoBandMode',
		'logoReactivitySpeed',
		'logoAttack',
		'logoRelease',
		'logoMinScale',
		'logoMaxScale',
		'logoPunch',
		'logoPeakWindow',
		'logoPeakFloor',
		'logoGlowColorSource',
		'logoGlowColor',
		'logoGlowBlur',
		'logoShadowEnabled',
		'logoShadowColorSource',
		'logoShadowColor',
		'logoShadowBlur',
		'logoBackdropEnabled',
		'logoBackdropColorSource',
		'logoBackdropColor',
		'logoBackdropOpacity',
		'logoBackdropPadding'
	],
	diagnostics: [
		'showBackgroundScaleMeter',
		'showSpectrumDiagnosticsHud',
		'showLogoDiagnosticsHud',
		'diagnosticsHudPositionX',
		'diagnosticsHudPositionY'
	],
	particles: [
		'particlesEnabled',
		'particleLayerMode',
		'particleCount',
		'particleSpeed',
		'particleShape',
		'particleColorSource',
		'particleColorMode',
		'particleColor1',
		'particleColor2',
		'particleOpacity',
		'particleFilterBrightness',
		'particleFilterContrast',
		'particleFilterSaturation',
		'particleFilterBlur',
		'particleFilterHueRotate',
		'particleScanlineIntensity',
		'particleScanlineSpacing',
		'particleScanlineThickness',
		'particleRotationIntensity',
		'particleRotationDirection',
		'particleSizeMin',
		'particleSizeMax',
		'particleGlow',
		'particleGlowStrength',
		'particleFadeInOut',
		'particleAudioReactive',
		'particleAudioChannel',
		'particleAudioSizeBoost',
		'particleAudioOpacityBoost'
	],
	rain: [
		'rainEnabled',
		'rainIntensity',
		'rainDropCount',
		'rainAngle',
		'rainMeshRotationZ',
		'rainColorSource',
		'rainColor',
		'rainColorMode',
		'rainParticleType',
		'rainLength',
		'rainWidth',
		'rainBlur',
		'rainSpeed',
		'rainVariation'
	],
	editor: [
		'showFps',
		'controlPanelAnchor',
		'fpsOverlayAnchor',
		'layoutResponsiveEnabled',
		'layoutBackgroundReframeEnabled',
		'layoutReferenceWidth',
		'layoutReferenceHeight',
		'editorTheme',
		'editorThemeColorSource',
		'editorCornerRadius',
		'editorControlCornerRadius',
		'editorManualAccentColor',
		'editorManualSecondaryColor',
		'editorManualBackdropColor',
		'editorManualTextPrimaryColor',
		'editorManualTextSecondaryColor',
		'editorManualBackdropOpacity',
		'editorManualBlurPx',
		'editorManualSurfaceOpacity',
		'quickActionsEnabled',
		'quickActionsPositionX',
		'quickActionsPositionY',
		'quickActionsLauncherPositionX',
		'quickActionsLauncherPositionY',
		'quickActionsBackdropOpacity',
		'quickActionsBlurPx',
		'quickActionsScale',
		'quickActionsLauncherSize',
		'quickActionsColorSource',
		'quickActionsManualAccentColor',
		'quickActionsManualSecondaryColor',
		'quickActionsManualBackdropColor',
		'quickActionsManualTextPrimaryColor',
		'quickActionsManualTextSecondaryColor',
		'quickActionsManualSurfaceOpacity'
	],
	overlays: [],
	export: [],
	perf: ['performanceMode']
};

export function resolveCanvasInteractionTab(
	main: MainTabId,
	advanced: AdvancedSubTab
): string | null {
	switch (main) {
		case 'scene':
			return 'presets';
		case 'spectrum':
			return 'spectrum';
		case 'looks':
			return 'filters';
		case 'layers':
			return 'layers';
		case 'motion':
			return 'particles';
		case 'audio':
			return 'audio';
		case 'advanced':
			return advanced;
		default:
			return null;
	}
}

export const MAIN_TAB_RESET_KEYS: Record<MainTabId, (keyof WallpaperState)[]> = {
	scene: [],
	spectrum: LEGACY_TAB_KEYS.spectrum ?? [],
	looks: LEGACY_TAB_KEYS.filters ?? [],
	layers: [
		...(LEGACY_TAB_KEYS.presets ?? []),
		...(LEGACY_TAB_KEYS.layers ?? [])
	],
	motion: [
		...(LEGACY_TAB_KEYS.particles ?? []),
		...(LEGACY_TAB_KEYS.rain ?? [])
	],
	audio: LEGACY_TAB_KEYS.audio ?? [],
	advanced: []
};

export const ADVANCED_RESET_KEYS: Record<
	AdvancedSubTab,
	(keyof WallpaperState)[]
> = {
	track: LEGACY_TAB_KEYS.track ?? [],
	logo: LEGACY_TAB_KEYS.logo ?? [],
	diagnostics: LEGACY_TAB_KEYS.diagnostics ?? [],
	editor: LEGACY_TAB_KEYS.editor ?? [],
	export: LEGACY_TAB_KEYS.export ?? [],
	perf: LEGACY_TAB_KEYS.perf ?? []
};

function partitionEditorKeysForOverlay(
	editorKeys: (keyof WallpaperState)[]
): { hud: (keyof WallpaperState)[]; editorUi: (keyof WallpaperState)[] } {
	const hud: (keyof WallpaperState)[] = [];
	const editorUi: (keyof WallpaperState)[] = [];
	for (const k of editorKeys) {
		if (String(k).startsWith('quickActions')) {
			hud.push(k);
		} else {
			editorUi.push(k);
		}
	}
	return { hud, editorUi };
}

const { hud: editorOverlayHudKeys, editorUi: editorOverlayEditorUiKeys } =
	partitionEditorKeysForOverlay(LEGACY_TAB_KEYS.editor ?? []);

/** Reset keys for the full-screen editor grid (HUD vs editor UI split). */
export const EDITOR_OVERLAY_TAB_KEYS: Record<string, (keyof WallpaperState)[]> = {
	...LEGACY_TAB_KEYS,
	editor: editorOverlayEditorUiKeys,
	hud: editorOverlayHudKeys
};
