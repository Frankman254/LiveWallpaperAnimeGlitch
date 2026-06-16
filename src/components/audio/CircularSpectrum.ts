import {
	resolveAudioChannelValue,
	type AudioSnapshot
} from '@/lib/audio/audioChannels';
import { publishSpectrumDiagnosticsSlice } from '@/lib/debug/spectrumDiagnosticsTelemetry';
import { setDebugSpectrumAudio } from '@/lib/debug/frameAudioDebugSnapshot';
import {
	sampleBinsForChannel,
	samplePeakForChannel
} from '@/lib/audio/spectrumBinSampling';
import { normalizeSpectrumShape } from '@/features/spectrum/spectrumControlConfig';
import { rotationDirectionSign } from '@/features/stageFx/stageFxConfig';
import { useWallpaperStore } from '@/store/wallpaperStore';
import {
	type SpectrumSettings,
	MODE_TRANSITION_DURATION,
	getSpectrumRuntimeState,
	resizeFloatArrayPreserve,
	ensureFloatArrayLength,
	applyRadialMirrorFold,
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

// Cross-family transition crossfade source. Captured continuously so a frame
// is ready the instant the user switches families/modes — but that switch is
// rare and the capture is a full-viewport copy, so we keep it at 5 Hz. The
// crossfade "from" frame can be up to ~200ms stale, which is imperceptible in
// the 320ms transition.
const TRANSITION_SNAPSHOT_CAPTURE_INTERVAL = 0.2;
const EMPTY_TIME_DOMAIN = new Uint8Array(0);

function clampSpectrumScale(value: number | undefined): number {
	return Math.min(3, Math.max(0.2, value ?? 1));
}

function resolveScaledSpectrumSettings(
	settings: SpectrumSettings
): SpectrumSettings {
	const scale = clampSpectrumScale(settings.spectrumScale);
	if (Math.abs(scale - 1) < 0.0001) return settings;
	return {
		...settings,
		spectrumMinHeight: settings.spectrumMinHeight * scale,
		spectrumMaxHeight: settings.spectrumMaxHeight * scale,
		spectrumBarWidth: Math.max(0.5, settings.spectrumBarWidth * scale),
		spectrumShadowBlur: settings.spectrumShadowBlur * scale,
		spectrumSpiralOuterRadius: settings.spectrumSpiralOuterRadius * scale
	};
}

export function drawSpectrum(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	audio: AudioSnapshot,
	settingsInput: SpectrumSettings,
	dt: number,
	instanceKey = 'primary'
): void {
	const settings = resolveScaledSpectrumSettings(settingsInput);
	const runtime = getSpectrumRuntimeState(instanceKey);
	const bins = audio.bins;
	const timeDomain = audio.timeDomain ?? EMPTY_TIME_DOMAIN;
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

	// Audio rotation follows the tallest current FFT point in the chosen band.
	// Its optional EMA can soften the hill shape without changing the source.
	const rotationDrive = settings.spectrumRotationDrive;
	const baseRotationSpeed =
		rotationDrive === 'off' || rotationDrive === 'audio'
			? 0
			: Math.abs(settings.spectrumRotationSpeed);
	const rotationHasAudio =
		rotationDrive === 'audio' || rotationDrive === 'fixed-audio';
	const rotationChannel =
		settings.spectrumRotationChannel === 'selected'
			? resolvedChannel
			: settings.spectrumRotationChannel;
	const rotationEnergy = samplePeakForChannel(bins, rotationChannel);
	let audioRotationTarget = 0;
	if (rotationHasAudio) {
		audioRotationTarget =
			Math.max(0, rotationEnergy) * settings.spectrumRotationAudioAmount;
	}
	const rotationSmoothing = Math.min(
		0.98,
		Math.max(0, settings.spectrumRotationSmoothing)
	);
	runtime.audioRotationSpeed =
		rotationHasAudio && audioRotationTarget > 0.0001
			? runtime.audioRotationSpeed * rotationSmoothing +
				audioRotationTarget * (1 - rotationSmoothing)
			: 0;
	if (!settings.spectrumRotationInvertOnLowEnergy) {
		runtime.rotationLowEnergyInvertSign = 1;
		runtime.rotationLowEnergyInvertPendingSign = 1;
		runtime.rotationLowEnergyInvertElapsedMs = 0;
	}
	const targetLowEnergyInvert: 1 | -1 =
		settings.spectrumRotationInvertOnLowEnergy &&
		rotationEnergy <=
			Math.max(0, Math.min(1, settings.spectrumRotationInvertThreshold))
			? -1
			: 1;
	const rotationInvertHoldMs = Math.max(
		0,
		Math.min(1000, settings.spectrumRotationInvertHoldMs)
	);
	if (targetLowEnergyInvert !== runtime.rotationLowEnergyInvertPendingSign) {
		runtime.rotationLowEnergyInvertPendingSign = targetLowEnergyInvert;
		runtime.rotationLowEnergyInvertElapsedMs = 0;
	} else if (targetLowEnergyInvert !== runtime.rotationLowEnergyInvertSign) {
		runtime.rotationLowEnergyInvertElapsedMs += dt * 1000;
		if (runtime.rotationLowEnergyInvertElapsedMs >= rotationInvertHoldMs) {
			runtime.rotationLowEnergyInvertSign = targetLowEnergyInvert;
			runtime.rotationLowEnergyInvertElapsedMs = 0;
		}
	} else {
		runtime.rotationLowEnergyInvertElapsedMs = 0;
	}
	const lowEnergyInvert = settings.spectrumRotationInvertOnLowEnergy
		? runtime.rotationLowEnergyInvertSign
		: 1;
	runtime.rotation +=
		rotationDirectionSign(settings.spectrumRotationDirection) *
		lowEnergyInvert *
		(baseRotationSpeed + runtime.audioRotationSpeed) *
		dt;

	const shockwaveEnabled =
		settings.spectrumBassShockwave > 0.001 &&
		settings.spectrumShockwaveOpacity > 0.001;
	const shockwaveResolved = shockwaveEnabled
		? resolveAudioChannelValue(
				audio.channels,
				settings.spectrumShockwaveBandMode,
				runtime.shockwaveChannelSelection,
				0,
				settings.audioAutoKickThreshold,
				settings.audioAutoSwitchHoldMs,
				audio.timestampMs
			)
		: null;

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

	// Radial mirror folds the per-bin heights into a vertically-symmetric figure
	// (each semicircle shows the full spectrum, reflected). Done once here so
	// every radial family inherits it. Linear mirror is handled per-renderer
	// (it reflects geometry across the axis, not the bin order), so it is left
	// untouched.
	if (
		settings.spectrumMirror &&
		settings.spectrumMode === 'radial' &&
		barCount > 1
	) {
		applyRadialMirrorFold(runtime.pixelHeights, barCount);
		if (settings.spectrumPeakHold) {
			applyRadialMirrorFold(runtime.pixelPeaks, barCount);
		}
	}

	const cx =
		canvas.width / 2 +
		(settings.spectrumPositionX ?? 0) * canvas.width * 0.5;
	const cy =
		canvas.height / 2 -
		(settings.spectrumPositionY ?? 0) * canvas.height * 0.5;
	const storeState = useWallpaperStore.getState();
	const performanceMode = storeState.performanceMode;
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
		instance: instanceKey === 'primary' ? 'primary' : 'clone'
	});

	if (storeState.showSpectrumDiagnosticsHud) {
		const followEffective = Boolean(
			settings.spectrumMode === 'radial' &&
			settings.spectrumFollowLogo &&
			settings.logoEnabled
		);
		publishSpectrumDiagnosticsSlice({
			instance: instanceKey,
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
	const audioGlowDrive =
		energyEnvelopeState.normalizedAmplitude *
		(settings.spectrumGlowAudioAmount ?? 0);
	const effectiveGlowIntensity = Math.min(
		6,
		settings.spectrumGlowIntensity + audioGlowDrive
	);
	// The glow-blur formula across every family is `shadowBlur × glowIntensity`,
	// so a preset with shadowBlur = 0 shows NO halo no matter how high the
	// (audio-boosted) glow intensity climbs — that's why "Glow by Audio" looked
	// dead on e.g. liquid layers. Give the audio-driven glow its own blur floor
	// so the halo is actually visible on peaks across classic, liquid, tunnel,
	// etc. Per-family caps (computeClassicGlowBlur / computeLiquidGlowBlur) and
	// the performance-mode scale still bound the final radius.
	const effectiveShadowBlur =
		audioGlowDrive > 0.001
			? Math.max(settings.spectrumShadowBlur, audioGlowDrive * 14)
			: settings.spectrumShadowBlur;
	const renderSettings = {
		...settings,
		spectrumGlowIntensity: effectiveGlowIntensity,
		spectrumShadowBlur: effectiveShadowBlur,
		spectrumRadialAngle: effectiveRadialAngleDeg
	};
	const radialAngle = (effectiveRadialAngleDeg * Math.PI) / 180;
	const resolvedShape = normalizeSpectrumShape(settings.spectrumShape);

	// Time-domain waveform now comes directly from AnalyserNode via
	// `audio.timeDomain`, so we no longer need to synthesize a history
	// buffer from the smoothed envelope. The oscilloscope renderer reads
	// the live PCM samples and the previous `pushOscilloscopeSample()` hack
	// is gone.

	// Extra instances draw after the main spectrum on the same canvas;
	// frame-memory FX (ghost / trails / afterglow source) are full-frame. Clip
	// to the radial ring so an instance's settings cannot composite over the
	// main spectrum.
	const shouldClipCloneRadialFx =
		instanceKey !== 'primary' && settings.spectrumMode === 'radial';
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
		(renderSettings.spectrumGlowReach ?? 1) *
		shadowBlurScale;
	ctx.shadowColor = renderSettings.spectrumPrimaryColor;

	// ── Route to family renderer via central registry ────────────────────────
	if (settings.spectrumOpacity > 0.001) {
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
	}

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
	if (shockwaveResolved) {
		updateSpectrumShockwavesAndDraw(
			ctx,
			canvas,
			runtime,
			renderSettings,
			dt,
			shockwaveResolved.instantLevel,
			shockwaveResolved.resolvedChannel,
			energyEnvelopeState.normalizedAmplitude,
			cx,
			cy,
			performanceMode,
			renderQuality
		);
	} else if (runtime.shockwaves && runtime.shockwaves.length > 0) {
		runtime.shockwaves.length = 0;
	}

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

	if (allowSnapshotTransition) {
		runtime.previousFrameCaptureElapsed += dt;
		if (
			!runtime.previousFrameCanvas ||
			runtime.previousFrameCaptureElapsed >=
				TRANSITION_SNAPSHOT_CAPTURE_INTERVAL
		) {
			runtime.previousFrameCanvas = ensureSnapshotCanvas(
				runtime.previousFrameCanvas,
				canvas.width,
				canvas.height
			);
			copyCanvas(canvas, runtime.previousFrameCanvas);
			runtime.previousFrameCaptureElapsed = 0;
		}
	} else {
		// Classic does not use cross-family snapshots. Avoid a full viewport
		// copy every frame and release a stale buffer after switching back.
		runtime.previousFrameCanvas = null;
		runtime.previousFrameCaptureElapsed = Number.POSITIVE_INFINITY;
	}
	commitSpectrumFrameMemory(runtime, canvas, settings, renderQuality);
}

export function resetSpectrum(): void {
	resetSpectrumRuntime();
}
