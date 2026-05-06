import {
	createAudioChannelSelectionState,
	resolveAudioChannelValue,
	type AudioSnapshot
} from '@/lib/audio/audioChannels';
import { clearSpectrumDiagnosticsClone } from '@/lib/debug/spectrumDiagnosticsTelemetry';
import { publishLogoDiagnosticsTelemetry } from '@/lib/debug/logoDiagnosticsTelemetry';
import {
	normalizeSpectrumFamily,
	normalizeSpectrumShape
} from '@/features/spectrum/spectrumControlConfig';
import { applySpectrumPlacementToState } from '@/features/spectrum/runtime/spectrumPlacement';
import {
	resolveResponsiveLyricsSettings,
	resolveResponsiveLogoSettings,
	resolveResponsiveSpectrumSettings,
	resolveResponsiveTrackTitleSettings
} from '@/features/layout/responsiveLayout';
import {
	getEditorThemePalette,
	resolveModeDrivenColors,
	resolveThemeColor,
	type BackgroundPalette
} from '@/lib/backgroundPalette';
import { getLruEntry, setLruEntry } from '@/lib/lruCache';
import {
	clearDebugSpectrumClone,
	setDebugLogoAudio
} from '@/lib/debug/frameAudioDebugSnapshot';
import type { OverlayLayer } from '@/types/layers';
import type {
	ResolvedAudioReactiveChannel,
	WallpaperState
} from '@/types/wallpaper';
import { drawLogo, getLogoRenderState } from '@/components/audio/ReactiveLogo';
import { drawSpectrum } from '@/components/audio/CircularSpectrum';
import { drawTrackTitleOverlay } from '@/components/audio/TrackTitleOverlay';
import { drawLyricsOverlay } from '@/components/audio/LyricsOverlay';
import { resolveActiveAudioAssetId } from '@/lib/audio/activeTrack';

export interface OverlayRenderContext {
	ctx: CanvasRenderingContext2D;
	canvas: HTMLCanvasElement;
	state: WallpaperState;
	audio: AudioSnapshot;
	dt: number;
	trackTitle: string;
	trackCurrentTime: number;
	trackDuration: number;
	palette: BackgroundPalette;
}

const OVERLAY_IMAGE_CACHE_LIMIT = 12;
const imageCache = new Map<string, HTMLImageElement>();
const logoChannelSelection = createAudioChannelSelectionState('kick');

function getCachedImage(url: string): HTMLImageElement {
	const cached = getLruEntry(imageCache, url);
	if (cached) return cached;

	const image = new Image();
	image.src = url;
	setLruEntry(imageCache, url, image, OVERLAY_IMAGE_CACHE_LIMIT);
	return image;
}

function drawOverlayImage(
	layer: Extract<OverlayLayer, { type: 'overlay-image' }>,
	context: OverlayRenderContext
): void {
	if (!layer.imageUrl) return;

	const image = getCachedImage(layer.imageUrl);
	if (!image.complete || image.naturalWidth === 0) return;

	const cx =
		context.canvas.width / 2 + layer.positionX * context.canvas.width;
	const cy =
		context.canvas.height / 2 - layer.positionY * context.canvas.height;
	const width = layer.width * layer.scale;
	const height = layer.height * layer.scale;

	context.ctx.save();
	context.ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity));
	context.ctx.translate(cx, cy);
	context.ctx.rotate((layer.rotation * Math.PI) / 180);
	context.ctx.drawImage(image, -width / 2, -height / 2, width, height);
	context.ctx.restore();
}

function resolveLogoDrive(context: OverlayRenderContext): {
	amplitude: number;
	resolvedChannel: ResolvedAudioReactiveChannel;
	channelInstant: number;
	channelRouterSmoothed: number;
} {
	const { state, audio } = context;
	const resolved = resolveAudioChannelValue(
		audio.channels,
		state.logoBandMode,
		logoChannelSelection,
		state.logoAudioSmoothingEnabled ? state.logoAudioSmoothing : 0,
		state.audioAutoKickThreshold,
		state.audioAutoSwitchHoldMs,
		audio.timestampMs
	);
	const drive = state.logoAudioSmoothingEnabled
		? resolved.value
		: resolved.instantLevel;
	const amplitude = Math.min(
		3.2,
		Math.max(0, drive) * state.logoAudioSensitivity * 1.18
	);
	return {
		amplitude,
		resolvedChannel: resolved.resolvedChannel,
		channelInstant: resolved.instantLevel,
		channelRouterSmoothed: resolved.value
	};
}

function getCloneSpectrumState(
	state: WallpaperState,
	logoScale: number
): WallpaperState {
	const placement = applySpectrumPlacementToState(state, {
		variant: 'clone-circular',
		logoScale
	});
	return {
		...placement,
		spectrumFamily: normalizeSpectrumFamily(state.spectrumCloneFamily),
		spectrumTunnelRingCount: state.spectrumCloneTunnelRingCount,
		spectrumOpacity: state.spectrumCloneOpacity,
		spectrumRadialShape: state.spectrumCloneRadialShape,
		spectrumRadialAngle: state.spectrumCloneRadialAngle,
		spectrumShape: normalizeSpectrumShape(state.spectrumCloneStyle),
		spectrumBarCount: state.spectrumCloneBarCount,
		spectrumBarWidth: Math.max(1, state.spectrumCloneBarWidth),
		spectrumMinHeight: Math.max(
			1,
			state.spectrumCloneMinHeight * Math.max(0.5, state.spectrumCloneScale)
		),
		spectrumMaxHeight: Math.max(
			12,
			state.spectrumCloneMaxHeight * state.spectrumCloneScale
		),
		spectrumSmoothing: state.spectrumCloneSmoothing,
		spectrumGlowIntensity: state.spectrumCloneGlowIntensity,
		spectrumShadowBlur: state.spectrumCloneShadowBlur,
		spectrumPrimaryColor: state.spectrumClonePrimaryColor,
		spectrumSecondaryColor: state.spectrumCloneSecondaryColor,
		spectrumColorMode: state.spectrumCloneColorMode,
		spectrumBandMode: state.spectrumCloneBandMode,
		spectrumAudioSmoothingEnabled:
			state.spectrumCloneAudioSmoothingEnabled,
		spectrumAudioSmoothing: state.spectrumCloneAudioSmoothing,
		spectrumWaveFillOpacity: state.spectrumCloneWaveFillOpacity,
		spectrumRotationSpeed: state.spectrumCloneRotationSpeed,
		spectrumMirror: state.spectrumCloneMirror,
		spectrumPeakHold: state.spectrumClonePeakHold,
		spectrumPeakDecay: state.spectrumClonePeakDecay,
		spectrumPeakRibbons: state.spectrumClonePeakRibbons,
		spectrumAfterglow: state.spectrumCloneAfterglow,
		spectrumMotionTrails: state.spectrumCloneMotionTrails,
		spectrumGhostFrames: state.spectrumCloneGhostFrames,
		spectrumEnergyBloom: state.spectrumCloneEnergyBloom,
		spectrumBassShockwave: state.spectrumCloneBassShockwave,
		spectrumShockwaveBandMode: state.spectrumCloneShockwaveBandMode,
		spectrumShockwaveThickness: state.spectrumCloneShockwaveThickness,
		spectrumShockwaveOpacity: state.spectrumCloneShockwaveOpacity,
		spectrumShockwaveBlur: state.spectrumCloneShockwaveBlur,
		spectrumShockwaveColorMode: state.spectrumCloneShockwaveColorMode,
		spectrumPeakRibbonAngle: state.spectrumClonePeakRibbonAngle
	};
}

function resolveMainSpectrumState(
	state: WallpaperState,
	backgroundPalette: BackgroundPalette,
	themePalette: BackgroundPalette
): WallpaperState & { spectrumRainbowColors?: string[] } {
	const resolvedColors = resolveModeDrivenColors(
		state.spectrumColorSource,
		state.spectrumPrimaryColor,
		state.spectrumSecondaryColor,
		backgroundPalette,
		themePalette
	);
	return {
		...state,
		spectrumPrimaryColor: resolvedColors.primaryColor,
		spectrumSecondaryColor: resolvedColors.secondaryColor,
		spectrumRainbowColors: resolvedColors.rainbowColors
	};
}

function resolveCloneSpectrumState(
	state: WallpaperState,
	backgroundPalette: BackgroundPalette,
	themePalette: BackgroundPalette,
	logoScale: number
): WallpaperState & { spectrumRainbowColors?: string[] } {
	const cloneState = getCloneSpectrumState(state, logoScale);
	const resolvedColors = resolveModeDrivenColors(
		state.spectrumCloneColorSource,
		state.spectrumClonePrimaryColor,
		state.spectrumCloneSecondaryColor,
		backgroundPalette,
		themePalette
	);
	return {
		...cloneState,
		spectrumPrimaryColor: resolvedColors.primaryColor,
		spectrumSecondaryColor: resolvedColors.secondaryColor,
		spectrumRainbowColors: resolvedColors.rainbowColors
	};
}

function resolveLogoColorState(
	state: WallpaperState,
	backgroundPalette: BackgroundPalette,
	themePalette: BackgroundPalette
): WallpaperState {
	return {
		...state,
		logoGlowColor: resolveThemeColor(
			state.logoGlowColorSource,
			state.logoGlowColor,
			backgroundPalette,
			themePalette,
			'accent'
		),
		logoShadowColor: resolveThemeColor(
			state.logoShadowColorSource,
			state.logoShadowColor,
			backgroundPalette,
			themePalette,
			'accent'
		),
		logoBackdropColor: resolveThemeColor(
			state.logoBackdropColorSource,
			state.logoBackdropColor,
			backgroundPalette,
			themePalette,
			'backdrop'
		)
	};
}

function resolveTrackColorState(
	state: WallpaperState,
	backgroundPalette: BackgroundPalette,
	themePalette: BackgroundPalette
): WallpaperState {
	return {
		...state,
		audioTrackTitleTextColor: resolveThemeColor(
			state.audioTrackTitleTextColorSource,
			state.audioTrackTitleTextColor,
			backgroundPalette,
			themePalette,
			'text'
		),
		audioTrackTitleStrokeColor: resolveThemeColor(
			state.audioTrackTitleStrokeColorSource,
			state.audioTrackTitleStrokeColor,
			backgroundPalette,
			themePalette,
			'accent'
		),
		audioTrackTitleGlowColor: resolveThemeColor(
			state.audioTrackTitleGlowColorSource,
			state.audioTrackTitleGlowColor,
			backgroundPalette,
			themePalette,
			'secondary'
		),
		audioTrackTitleBackdropColor: resolveThemeColor(
			state.audioTrackTitleBackdropColorSource,
			state.audioTrackTitleBackdropColor,
			backgroundPalette,
			themePalette,
			'backdrop'
		),
		audioTrackTimeTextColor: resolveThemeColor(
			state.audioTrackTimeTextColorSource,
			state.audioTrackTimeTextColor,
			backgroundPalette,
			themePalette,
			'text'
		),
		audioTrackTimeStrokeColor: resolveThemeColor(
			state.audioTrackTimeStrokeColorSource,
			state.audioTrackTimeStrokeColor,
			backgroundPalette,
			themePalette,
			'accent'
		),
		audioTrackTimeGlowColor: resolveThemeColor(
			state.audioTrackTimeGlowColorSource,
			state.audioTrackTimeGlowColor,
			backgroundPalette,
			themePalette,
			'secondary'
		)
	};
}

function resolveLyricsColorState(
	state: WallpaperState,
	backgroundPalette: BackgroundPalette,
	themePalette: BackgroundPalette
): WallpaperState {
	return {
		...state,
		audioLyricsActiveColor: resolveThemeColor(
			state.audioLyricsActiveColorSource,
			state.audioLyricsActiveColor,
			backgroundPalette,
			themePalette,
			'text'
		),
		audioLyricsInactiveColor: resolveThemeColor(
			state.audioLyricsInactiveColorSource,
			state.audioLyricsInactiveColor,
			backgroundPalette,
			themePalette,
			'secondary'
		),
		audioLyricsGlowColor: resolveThemeColor(
			state.audioLyricsGlowColorSource,
			state.audioLyricsGlowColor,
			backgroundPalette,
			themePalette,
			'secondary'
		),
		audioLyricsBackdropColor: resolveThemeColor(
			state.audioLyricsBackdropColorSource,
			state.audioLyricsBackdropColor,
			backgroundPalette,
			themePalette,
			'backdrop'
		)
	};
}

function resolveResponsiveOverlayState(
	state: WallpaperState,
	canvasWidth: number,
	canvasHeight: number
): WallpaperState {
	return resolveResponsiveLyricsSettings(
		resolveResponsiveTrackTitleSettings(
			resolveResponsiveSpectrumSettings(
				resolveResponsiveLogoSettings(state, canvasWidth, canvasHeight),
				canvasWidth,
				canvasHeight
			),
			canvasWidth,
			canvasHeight
		),
		canvasWidth,
		canvasHeight
	);
}

export function drawOverlayLayer(
	layer: OverlayLayer,
	context: OverlayRenderContext
): void {
	if (!layer.enabled) return;
	const themePalette = getEditorThemePalette(context.state.editorTheme);
	const responsiveState = resolveResponsiveOverlayState(
		context.state,
		context.canvas.width,
		context.canvas.height
	);

	if (layer.type === 'overlay-image') {
		drawOverlayImage(layer, context);
		return;
	}

	if (layer.type === 'logo') {
		const logoDrive = resolveLogoDrive(context);
		const resolvedState = resolveLogoColorState(
			responsiveState,
			context.palette,
			themePalette
		);
		drawLogo(
			context.ctx,
			context.canvas,
			logoDrive.amplitude,
			context.dt,
			resolvedState
		);
		const rs = getLogoRenderState();
		const st = resolvedState;
		setDebugLogoAudio({
			bandModeRequested: st.logoBandMode,
			resolvedChannel: logoDrive.resolvedChannel,
			channelInstant: logoDrive.channelInstant,
			channelRouterSmoothed: logoDrive.channelRouterSmoothed,
			driveScaled: logoDrive.amplitude,
			envelopeScale: rs.scale
		});
		if (context.state.showLogoDiagnosticsHud) {
			publishLogoDiagnosticsTelemetry({
				bandModeRequested: st.logoBandMode,
				resolvedChannel: logoDrive.resolvedChannel,
				channelInstant: logoDrive.channelInstant,
				driveScaled: logoDrive.amplitude,
				envelopeScale: rs.scale,
				normalizedAmplitude: rs.normalizedAmplitude,
				smoothedAmplitude: rs.smoothedAmplitude,
				adaptivePeak: rs.adaptivePeak,
				adaptiveFloor: rs.adaptiveFloor,
				logoBaseSize: st.logoBaseSize,
				renderedSize: st.logoBaseSize * rs.scale,
				logoPositionX: st.logoPositionX,
				logoPositionY: st.logoPositionY,
				spectrumFollowLogo: st.spectrumFollowLogo,
				spectrumUsesLogoPlacement: Boolean(
					st.spectrumEnabled &&
					st.spectrumMode === 'radial' &&
					st.spectrumFollowLogo &&
					st.logoEnabled
				),
				logoEnabled: st.logoEnabled
			});
		}
		return;
	}

	if (layer.type === 'track-title') {
		const resolvedState = resolveTrackColorState(
			responsiveState,
			context.palette,
			themePalette
		);
		drawTrackTitleOverlay(
			context.ctx,
			context.canvas,
			context.trackTitle,
			context.trackCurrentTime,
			context.trackDuration,
			context.dt,
			resolvedState
		);
		return;
	}

	if (layer.type === 'lyrics') {
		const resolvedState = resolveLyricsColorState(
			responsiveState,
			context.palette,
			themePalette
		);
		drawLyricsOverlay(
			context.ctx,
			context.canvas,
			resolvedState,
			resolveActiveAudioAssetId(resolvedState),
			context.trackCurrentTime,
			context.trackDuration
		);
		return;
	}

	if (layer.type === 'spectrum') {
		const willDrawCircular =
			responsiveState.spectrumCircularClone &&
			responsiveState.logoEnabled;
		if (!willDrawCircular) {
			clearDebugSpectrumClone();
		}

		if (responsiveState.showSpectrumDiagnosticsHud) {
			clearSpectrumDiagnosticsClone();
		}

		const logoScale = getLogoRenderState().scale;
		const primarySpectrumState = applySpectrumPlacementToState(
			responsiveState,
			{
				variant: 'main',
				logoScale
			}
		);
		const resolvedPrimarySpectrumState = resolveMainSpectrumState(
			primarySpectrumState,
			context.palette,
			themePalette
		);

		drawSpectrum(
			context.ctx,
			context.canvas,
			context.audio,
			resolvedPrimarySpectrumState,
			context.dt,
			'primary'
		);

		// Circular Spectrum renders independently of main spectrum mode.
		// It is always radial and always follows the logo (see getCloneSpectrumState).
		if (willDrawCircular) {
			drawSpectrum(
				context.ctx,
				context.canvas,
				context.audio,
				resolveCloneSpectrumState(
					responsiveState,
					context.palette,
					themePalette,
					logoScale
				),
				context.dt,
				'clone-circular'
			);
		}
	}
}
