import {
	resolveAudioChannelValue,
	type AudioSnapshot
} from '@/lib/audio/audioChannels';
import { publishSpectrumDiagnosticsSlice } from '@/lib/debug/spectrumDiagnosticsTelemetry';
import { setDebugSpectrumAudio } from '@/lib/debug/frameAudioDebugSnapshot';
import { sampleBinsForChannel } from '@/lib/audio/spectrumBinSampling';
import { normalizeSpectrumShape } from '@/features/spectrum/spectrumControlConfig';
import { useWallpaperStore } from '@/store/wallpaperStore';
import {
	type SpectrumSettings,
	MODE_TRANSITION_DURATION,
	getSpectrumRuntimeState,
	resizeFloatArrayPreserve,
	ensureFloatArrayLength,
	buildModeSignature,
	ensureSnapshotCanvas,
	copyCanvas,
	resetSpectrumRuntime
} from '@/features/spectrum/runtime/spectrumRuntime';
import {
	commitSpectrumFrameMemory,
	drawSpectrumEnergyBloom,
	drawSpectrumFrameMemoryUnderlay,
	drawSpectrumPeakRibbons,
	updateSpectrumShockwavesAndDraw
} from '@/features/spectrum/runtime/spectrumFrameEffects';
import {
	drawRadialBars,
	drawRadialBlocks,
	drawRadialWave,
	drawRadialDots
} from '@/features/spectrum/renderers/radial/radialRenderer';
import {
	drawLinearBars,
	drawLinearCapsules,
	drawLinearBlocks,
	drawLinearDots,
	drawLinearWave
} from '@/features/spectrum/renderers/linear/linearRenderer';
import {
	drawOscilloscope,
	pushOscilloscopeSample
} from '@/features/spectrum/renderers/oscilloscope/oscilloscopeRenderer';
import { drawSpectrogram } from '@/features/spectrum/renderers/spectrogram/spectrogramRenderer';
import { drawTunnel } from '@/features/spectrum/renderers/tunnel/tunnelRenderer';
import { drawLiquid } from '@/features/spectrum/renderers/liquid/liquidRenderer';
import { drawOrbital } from '@/features/spectrum/renderers/orbital/orbitalRenderer';
import {
	getSpectrumFamilyGpuCostHint,
	resolveSpectrumRenderQuality,
	spectrumShadowBlurScale
} from '@/lib/visual/performanceQuality';

export type { SpectrumSettings };

export function drawSpectrum(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	audio: AudioSnapshot,
	settings: SpectrumSettings,
	dt: number,
	instanceKey = 'primary'
): void {
	const runtime = getSpectrumRuntimeState(instanceKey);
	const bins = audio.bins;
	runtime.idleTime += dt;
	const allowSnapshotTransition = settings.spectrumFamily !== 'classic';

	const modeSignature = buildModeSignature(settings);
	if (
		allowSnapshotTransition &&
		runtime.lastModeSignature &&
		modeSignature !== runtime.lastModeSignature
	) {
		runtime.modeTransitionSnapshotCanvas = ensureSnapshotCanvas(
			runtime.modeTransitionSnapshotCanvas,
			canvas.width,
			canvas.height
		);
		copyCanvas(
			runtime.previousFrameCanvas ?? canvas,
			runtime.modeTransitionSnapshotCanvas
		);
		runtime.modeTransitionElapsed = 0;
	}
	runtime.lastModeSignature = modeSignature;
	if (!allowSnapshotTransition) {
		runtime.modeTransitionSnapshotCanvas = null;
		runtime.modeTransitionElapsed = MODE_TRANSITION_DURATION;
	}

	const barCount = settings.spectrumBarCount;
	if (runtime.smoothedHeights.length !== barCount) {
		runtime.smoothedHeights = resizeFloatArrayPreserve(
			runtime.smoothedHeights,
			barCount
		);
		runtime.peakHeights = resizeFloatArrayPreserve(
			runtime.peakHeights,
			barCount
		);
		runtime.pixelHeights = ensureFloatArrayLength(
			runtime.pixelHeights,
			barCount
		);
		runtime.pixelPeaks = ensureFloatArrayLength(
			runtime.pixelPeaks,
			barCount
		);
	}

	runtime.rotation += settings.spectrumRotationSpeed * dt;
	let accumulatedEnergy = 0;
	const {
		resolvedChannel,
		instantLevel: channelInstant,
		value: channelSmoothed
	} = resolveAudioChannelValue(
		audio.channels,
		settings.spectrumBandMode,
		runtime.channelSelection,
		settings.spectrumAudioSmoothingEnabled
			? settings.spectrumAudioSmoothing
			: 0,
		settings.audioAutoKickThreshold,
		settings.audioAutoSwitchHoldMs,
		audio.timestampMs
	);
	const channelDrive = settings.spectrumAudioSmoothingEnabled
		? channelSmoothed
		: channelInstant;

	for (let i = 0; i < barCount; i++) {
		const rawValue =
			bins.length === 0
				? (Math.sin(runtime.idleTime * 1.5 + i * 0.25) * 0.5 + 0.5) *
					0.08
				: sampleBinsForChannel(bins, i, barCount, resolvedChannel);
		accumulatedEnergy += rawValue;

		runtime.smoothedHeights[i] =
			runtime.smoothedHeights[i] * settings.spectrumSmoothing +
			rawValue * (1 - settings.spectrumSmoothing);
		const height =
			settings.spectrumMinHeight +
			runtime.smoothedHeights[i] *
				(settings.spectrumMaxHeight - settings.spectrumMinHeight);

		if (settings.spectrumPeakHold) {
			if (height > runtime.peakHeights[i])
				runtime.peakHeights[i] = height;
			else
				runtime.peakHeights[i] = Math.max(
					settings.spectrumMinHeight,
					runtime.peakHeights[i] -
						settings.spectrumPeakDecay * settings.spectrumMaxHeight
				);
		}
	}

	const energyEnvelopeState = runtime.energyEnvelope.tick(
		accumulatedEnergy / Math.max(barCount, 1),
		Math.max(dt, 1 / 120),
		{
			attack: 0.52,
			release: 0.12,
			responseSpeed: 1.55,
			peakWindow: 1.8,
			peakFloor: 0.06,
			punch: 0.04,
			scaleIntensity: 1,
			min: 0,
			max: 1
		}
	);
	const globalGain =
		0.84 +
		Math.max(energyEnvelopeState.normalizedAmplitude, channelDrive) * 0.24;

	for (let i = 0; i < barCount; i++) {
		runtime.pixelHeights[i] =
			settings.spectrumMinHeight +
			runtime.smoothedHeights[i] *
				(settings.spectrumMaxHeight - settings.spectrumMinHeight) *
				globalGain;
		runtime.pixelPeaks[i] =
			settings.spectrumMinHeight +
			Math.max(0, runtime.peakHeights[i] - settings.spectrumMinHeight) *
				globalGain;
	}

	const cx =
		canvas.width / 2 +
		(settings.spectrumPositionX ?? 0) * canvas.width * 0.5;
	const cy =
		canvas.height / 2 -
		(settings.spectrumPositionY ?? 0) * canvas.height * 0.5;
	const performanceMode = useWallpaperStore.getState().performanceMode;
	const renderQuality = resolveSpectrumRenderQuality(
		performanceMode,
		settings.spectrumFamily
	);
	const shadowBlurScale = spectrumShadowBlurScale(renderQuality);

	const meanBinEnergy = accumulatedEnergy / Math.max(barCount, 1);
	setDebugSpectrumAudio({
		bandModeRequested: settings.spectrumBandMode,
		resolvedChannel,
		channelInstant,
		channelRouterSmoothed: channelSmoothed,
		meanBinEnergy,
		globalGain,
		barCount,
		instance: instanceKey === 'clone-circular' ? 'clone' : 'primary'
	});

	if (useWallpaperStore.getState().showSpectrumDiagnosticsHud) {
		const store = useWallpaperStore.getState();
		const followEffective = Boolean(
			settings.spectrumFollowLogo && store.logoEnabled
		);
		publishSpectrumDiagnosticsSlice({
			instance:
				instanceKey === 'clone-circular' ? 'clone-circular' : 'primary',
			bandModeRequested: settings.spectrumBandMode,
			resolvedChannel,
			channelInstant,
			channelSmoothed,
			meanBinEnergy,
			envelopeNormalized: energyEnvelopeState.normalizedAmplitude,
			globalGain,
			spectrumMode: settings.spectrumMode,
			spectrumFamily: settings.spectrumFamily,
			renderQualityTier: renderQuality,
			familyGpuCostHint: getSpectrumFamilyGpuCostHint(settings.spectrumFamily),
			followLogoSetting: settings.spectrumFollowLogo,
			followLogoEffective: followEffective,
			innerRadius: settings.spectrumInnerRadius,
			canvasCx: cx,
			canvasCy: cy,
			positionNormX: settings.spectrumPositionX ?? 0,
			positionNormY: settings.spectrumPositionY ?? 0,
			barCount
		});
	}
	const radialAngle = (settings.spectrumRadialAngle * Math.PI) / 180;
	const resolvedShape = normalizeSpectrumShape(settings.spectrumShape);

	// ── Push oscilloscope sample every frame (channel amplitude as pseudo-waveform) ──
	pushOscilloscopeSample(runtime, channelDrive * 255);

	drawSpectrumFrameMemoryUnderlay(
		ctx,
		canvas,
		runtime,
		settings,
		energyEnvelopeState.normalizedAmplitude,
		performanceMode,
		renderQuality
	);
	drawSpectrumEnergyBloom(
		ctx,
		canvas,
		settings,
		energyEnvelopeState.normalizedAmplitude,
		cx,
		cy,
		renderQuality
	);

	ctx.save();
	ctx.globalAlpha = settings.spectrumOpacity;
	ctx.shadowBlur =
		settings.spectrumShadowBlur *
		settings.spectrumGlowIntensity *
		shadowBlurScale;
	ctx.shadowColor = settings.spectrumPrimaryColor;

	// ── Route non-classic spectrum families ──────────────────────────────────
	if (settings.spectrumFamily === 'oscilloscope') {
		drawOscilloscope(ctx, canvas, runtime, settings);
	} else if (settings.spectrumFamily === 'spectrogram') {
		drawSpectrogram(ctx, canvas, audio.bins, runtime, settings);
	} else if (settings.spectrumFamily === 'tunnel') {
		drawTunnel(ctx, canvas, runtime, settings);
	} else if (settings.spectrumFamily === 'liquid') {
		drawLiquid(ctx, canvas, runtime, settings);
	} else if (settings.spectrumFamily === 'orbital') {
		drawOrbital(ctx, canvas, runtime, settings, dt);
	} else if (settings.spectrumMode === 'radial') {
		switch (resolvedShape) {
			case 'bars':
				drawRadialBars(
					ctx,
					cx,
					cy,
					runtime.pixelHeights,
					runtime.pixelPeaks,
					barCount,
					settings,
					runtime.rotation,
					radialAngle
				);
				break;
			case 'blocks':
				drawRadialBlocks(
					ctx,
					cx,
					cy,
					runtime.pixelHeights,
					barCount,
					settings,
					runtime.rotation,
					radialAngle
				);
				break;
			case 'wave':
				drawRadialWave(
					ctx,
					canvas,
					cx,
					cy,
					runtime.pixelHeights,
					barCount,
					settings,
					runtime.rotation,
					radialAngle
				);
				break;
			case 'dots':
				drawRadialDots(
					ctx,
					cx,
					cy,
					runtime.pixelHeights,
					barCount,
					settings,
					runtime.rotation,
					radialAngle
				);
				break;
		}
	} else if (resolvedShape === 'wave') {
		drawLinearWave(ctx, canvas, runtime.pixelHeights, barCount, settings);
	} else if (resolvedShape === 'dots') {
		drawLinearDots(ctx, canvas, runtime.pixelHeights, barCount, settings);
	} else if (resolvedShape === 'blocks') {
		drawLinearBlocks(ctx, canvas, runtime.pixelHeights, barCount, settings);
	} else if (resolvedShape === 'capsules') {
		drawLinearCapsules(
			ctx,
			canvas,
			runtime.pixelHeights,
			barCount,
			settings
		);
	} else {
		drawLinearBars(
			ctx,
			canvas,
			runtime.pixelHeights,
			runtime.pixelPeaks,
			barCount,
			settings
		);
	}

	ctx.restore();

	drawSpectrumPeakRibbons(
		ctx,
		canvas,
		runtime,
		settings,
		cx,
		cy,
		renderQuality
	);
	updateSpectrumShockwavesAndDraw(
		ctx,
		canvas,
		runtime,
		settings,
		dt,
		channelInstant,
		energyEnvelopeState.normalizedAmplitude,
		cx,
		cy,
		performanceMode,
		renderQuality
	);

	if (
		allowSnapshotTransition &&
		runtime.modeTransitionSnapshotCanvas &&
		runtime.modeTransitionElapsed < MODE_TRANSITION_DURATION
	) {
		runtime.modeTransitionElapsed = Math.min(
			MODE_TRANSITION_DURATION,
			runtime.modeTransitionElapsed + dt
		);
		const progress =
			runtime.modeTransitionElapsed / MODE_TRANSITION_DURATION;
		const eased = progress * progress * (3 - 2 * progress);
		const alpha = 1 - eased;
		if (alpha > 0.001) {
			ctx.save();
			ctx.globalAlpha = alpha;
			ctx.drawImage(
				runtime.modeTransitionSnapshotCanvas,
				0,
				0,
				canvas.width,
				canvas.height
			);
			ctx.restore();
		} else {
			runtime.modeTransitionSnapshotCanvas = null;
		}
	}

	runtime.previousFrameCanvas = ensureSnapshotCanvas(
		runtime.previousFrameCanvas,
		canvas.width,
		canvas.height
	);
	copyCanvas(canvas, runtime.previousFrameCanvas);
	commitSpectrumFrameMemory(runtime, canvas, performanceMode, renderQuality);
}

export function resetSpectrum(): void {
	resetSpectrumRuntime();
}
