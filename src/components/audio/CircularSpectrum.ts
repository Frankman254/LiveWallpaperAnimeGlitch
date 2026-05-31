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
import { dispatchSpectrumRenderer } from '@/features/spectrum/spectrumFamilyRegistry';
import {
	getSectionLevel,
	tickManualSections
} from '@/features/spectrum/manual/spectrumManualRuntime';
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
	const timeDomain = audio.timeDomain ?? new Uint8Array(0);
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
	runtime.figureRotation += settings.spectrumFigureRotationSpeed * dt;
	let accumulatedEnergy = 0;
	const {
		resolvedChannel,
		instantLevel: channelInstant,
		value: channelSmoothed
	} = resolveAudioChannelValue(
		audio.channels,
		settings.spectrumBandMode,
		runtime.channelSelection,
		settings.spectrumAudioSmoothing,
		settings.audioAutoKickThreshold,
		settings.audioAutoSwitchHoldMs,
		audio.timestampMs
	);
	const channelDrive = channelSmoothed;

	const shockwaveResolved = resolveAudioChannelValue(
		audio.channels,
		settings.spectrumShockwaveBandMode,
		runtime.shockwaveChannelSelection,
		0,
		settings.audioAutoKickThreshold,
		settings.audioAutoSwitchHoldMs,
		audio.timestampMs
	);
	const shockwaveInstant = shockwaveResolved.instantLevel;

	// Manual drive: tick the section envelopes once per frame, then blend per
	// bin inside the loop. The keyboard handler in the viewport pushes
	// section targets between renders — ticking here keeps the runtime
	// frame-rate independent regardless of which family draws.
	const driveMode = settings.spectrumDriveMode;
	const manualActive = driveMode !== 'audio';
	if (manualActive) {
		tickManualSections(
			settings.spectrumManualAttack,
			settings.spectrumManualRelease,
			dt
		);
	}
	const manualSections = Math.max(
		1,
		Math.min(12, Math.round(settings.spectrumManualSections))
	);
	const manualAddWeight = Math.max(
		0,
		Math.min(1, settings.spectrumManualAddWeight)
	);

	for (let i = 0; i < barCount; i++) {
		// No synthetic "idle" signal when FFT bins are empty (paused / no capture):
		// diagnostics and routing previews must read true silence as zeros.
		let rawValue =
			bins.length === 0
				? 0
				: sampleBinsForChannel(bins, i, barCount, resolvedChannel);

		// Blend with manual section signal. We sample the section that
		// covers this bin's index range; sections are evenly distributed
		// across `barCount`. `manual` mode discards the FFT entirely, the
		// other two combine.
		if (manualActive) {
			const sectionIdx = Math.min(
				manualSections - 1,
				Math.floor((i / barCount) * manualSections)
			);
			const sectionLevel = getSectionLevel(sectionIdx);
			if (driveMode === 'max') {
				rawValue = Math.max(rawValue, sectionLevel);
			} else if (driveMode === 'add') {
				rawValue = Math.min(
					1,
					rawValue + sectionLevel * manualAddWeight
				);
			} else {
				// 'manual'
				rawValue = sectionLevel;
			}
		}

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
			attack: settings.spectrumEnvelopeAttack,
			release: settings.spectrumEnvelopeRelease,
			responseSpeed: settings.spectrumEnvelopeReactivitySpeed,
			peakWindow: settings.spectrumEnvelopePeakWindow,
			peakFloor: settings.spectrumEnvelopePeakFloor,
			punch: settings.spectrumEnvelopePunch,
			scaleIntensity: 1,
			min: 0,
			max: 1
		}
	);
	// `spectrumGainExpressiveness` shapes how deep the whole spectrum breathes
	// between beats. 0 ignores the envelope, 0.5 preserves the legacy
	// `0.84 + drive * 0.24` feel, 1 is cinematic, and values above 1 can drop
	// close to silence when Min Height is 0.
	const gainExpr = Math.max(
		0,
		Math.min(3, settings.spectrumGainExpressiveness)
	);
	const mainGainExpr = Math.min(1, gainExpr);
	const extraGainExpr = Math.max(0, gainExpr - 1);
	const gainBase = Math.max(
		0,
		1 - mainGainExpr * 0.32 - extraGainExpr * 0.34
	);
	const gainRange = mainGainExpr * 0.48 + extraGainExpr * 0.32;
	const globalGain = Math.min(
		1.6,
		gainBase +
			Math.max(energyEnvelopeState.normalizedAmplitude, channelDrive) *
				gainRange
	);

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
		const followEffective = Boolean(
			settings.spectrumMode === 'radial' &&
			settings.spectrumFollowLogo &&
			settings.logoEnabled
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
			familyGpuCostHint: getSpectrumFamilyGpuCostHint(
				settings.spectrumFamily
			),
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
	const usesLayeredLiquidShape = settings.spectrumFamily === 'liquid';
	const effectiveRadialAngleDeg = usesLayeredLiquidShape
		? 0
		: settings.spectrumRadialAngle +
			(runtime.figureRotation * 180) / Math.PI;
	const renderSettings = {
		...settings,
		spectrumRadialAngle: effectiveRadialAngleDeg
	};
	const radialAngle = (effectiveRadialAngleDeg * Math.PI) / 180;
	const resolvedShape = normalizeSpectrumShape(settings.spectrumShape);

	// Time-domain waveform now comes directly from AnalyserNode via
	// `audio.timeDomain`, so we no longer need to synthesize a history
	// buffer from the smoothed envelope. The oscilloscope renderer reads
	// the live PCM samples and the previous `pushOscilloscopeSample()` hack
	// is gone.

	// Circular clone draws after the main spectrum on the same canvas; frame-memory FX
	// (ghost / trails / afterglow source) are full-frame. Clip to the radial ring so clone
	// settings cannot composite over the linear main spectrum.
	const shouldClipCloneRadialFx =
		instanceKey === 'clone-circular' && settings.spectrumMode === 'radial';
	if (shouldClipCloneRadialFx) {
		const ghost = Math.min(1, Math.max(0, settings.spectrumGhostFrames));
		const trails = Math.min(1, Math.max(0, settings.spectrumMotionTrails));
		const ribbons = Math.min(
			1.5,
			Math.max(0, settings.spectrumPeakRibbons)
		);
		const clipR =
			settings.spectrumInnerRadius +
			settings.spectrumMaxHeight +
			36 +
			ribbons * 10 +
			(ghost + trails) * 52;
		ctx.save();
		ctx.beginPath();
		ctx.arc(cx, cy, clipR, 0, Math.PI * 2);
		ctx.clip();
	}

	drawSpectrumFrameMemoryUnderlay(
		ctx,
		canvas,
		runtime,
		renderSettings,
		energyEnvelopeState.normalizedAmplitude,
		performanceMode,
		renderQuality
	);
	drawSpectrumEnergyBloom(
		ctx,
		canvas,
		renderSettings,
		energyEnvelopeState.normalizedAmplitude,
		cx,
		cy,
		renderQuality
	);

	ctx.save();
	ctx.globalAlpha = settings.spectrumOpacity;
	ctx.shadowBlur =
		renderSettings.spectrumShadowBlur *
		renderSettings.spectrumGlowIntensity *
		shadowBlurScale;
	ctx.shadowColor = renderSettings.spectrumPrimaryColor;

	// ── Route to family renderer via central registry ────────────────────────
	dispatchSpectrumRenderer(
		renderSettings.spectrumFamily,
		renderSettings.spectrumMode,
		{
			ctx,
			canvas,
			bins,
			timeDomain,
			runtime,
			settings: renderSettings,
			dt,
			cx,
			cy,
			resolvedShape,
			barCount,
			radialAngle
		}
	);

	ctx.restore();

	drawSpectrumPeakRibbons(
		ctx,
		canvas,
		runtime,
		renderSettings,
		cx,
		cy,
		renderQuality
	);
	updateSpectrumShockwavesAndDraw(
		ctx,
		canvas,
		runtime,
		renderSettings,
		dt,
		shockwaveInstant,
		shockwaveResolved.resolvedChannel,
		energyEnvelopeState.normalizedAmplitude,
		cx,
		cy,
		performanceMode,
		renderQuality
	);

	if (shouldClipCloneRadialFx) {
		ctx.restore();
	}

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
	commitSpectrumFrameMemory(runtime, canvas, settings, renderQuality);
}

export function resetSpectrum(): void {
	resetSpectrumRuntime();
}
