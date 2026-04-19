import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import type { SpectrumRuntimeState } from '@/features/spectrum/runtime/spectrumRuntime';
import { getColor } from '@/features/spectrum/color/spectrumColor';
import { getLinearBase } from '@/features/spectrum/renderers/linear/linearRenderer';

/**
 * Draw a tunnel-style visualizer: concentric rings that pulse with audio.
 * `spectrumTunnelRingCount` controls number of rings.
 * Each ring maps to a frequency band and scales with amplitude.
 */
export function drawTunnel(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings
): void {
	if (settings.spectrumMode === 'linear') {
		drawTunnelLinear(ctx, canvas, runtime, settings);
	} else {
		drawTunnelRadial(ctx, canvas, runtime, settings);
	}
}

function drawTunnelRadial(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings
): void {
	const cx = canvas.width / 2 + (settings.spectrumPositionX ?? 0) * canvas.width * 0.5;
	const cy = canvas.height / 2 - (settings.spectrumPositionY ?? 0) * canvas.height * 0.5;
	const ringCount = settings.spectrumTunnelRingCount;
	const maxR = Math.min(canvas.width, canvas.height) * 0.48;
	const baseInnerR = settings.spectrumInnerRadius;
	const pixelHeights = runtime.pixelHeights;
	const barCount = pixelHeights.length;
	const rotation = runtime.rotation;

	ctx.save();
	ctx.lineCap = 'round';

	for (let ring = 0; ring < ringCount; ring++) {
		const t = ring / Math.max(ringCount - 1, 1); // 0 (innermost) → 1 (outermost)
		const baseR = baseInnerR + t * (maxR - baseInnerR);

		// Sample average energy for this ring's frequency band
		const bandStart = Math.floor(t * barCount * 0.8);
		const bandEnd = Math.min(barCount - 1, Math.floor((t + 1 / ringCount) * barCount * 0.8) + 1);
		let bandEnergy = 0;
		let bandSamples = 0;
		for (let b = bandStart; b <= bandEnd; b++) {
			bandEnergy += (pixelHeights[b] ?? 0);
			bandSamples++;
		}
		const avgEnergy = bandSamples > 0 ? bandEnergy / bandSamples : 0;
		const energyNorm = Math.min(avgEnergy / Math.max(settings.spectrumMaxHeight, 1), 1);

		// Ring radius pulses outward with audio
		const pulseR = baseR + energyNorm * settings.spectrumMaxHeight * 0.25;

		const strokeColor = getColor(
			settings,
			t + rotation / (Math.PI * 2) + energyNorm * 0.08
		);

		const alpha = settings.spectrumOpacity * (1 - t * 0.4) * (0.3 + energyNorm * 0.7);
		ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
		ctx.strokeStyle = strokeColor;
		ctx.lineWidth = settings.spectrumBarWidth * (1 - t * 0.5) + 1;
		ctx.shadowColor = strokeColor;
		ctx.shadowBlur = settings.spectrumShadowBlur * settings.spectrumGlowIntensity * energyNorm;

		// Draw segmented ring for audio-reactive detail
		const segments = Math.max(6, Math.floor(barCount / ringCount));
		const angleStep = (Math.PI * 2) / segments;
		const rotOffset = rotation + t * 0.5;

		ctx.beginPath();
		for (let seg = 0; seg <= segments; seg++) {
			const angle = seg * angleStep + rotOffset;
			// Each segment radius slightly varies with its local bar energy
			const segBin = Math.floor((seg / segments) * barCount);
			const localEnergy = Math.min(
				(pixelHeights[segBin] ?? 0) / Math.max(settings.spectrumMaxHeight, 1),
				1
			);
			const segR = pulseR + localEnergy * settings.spectrumMaxHeight * 0.1;
			const x = cx + Math.cos(angle) * segR;
			const y = cy + Math.sin(angle) * segR;
			if (seg === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.closePath();
		ctx.stroke();
	}

	ctx.restore();
}

/**
 * Linear tunnel: stacked polylines along the spectrum axis (frequency → space),
 * with depth rings perpendicular to that axis — analog to radial rings but in
 * linear layout (respects span, orientation, direction).
 */
function drawTunnelLinear(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings
): void {
	const w = canvas.width;
	const h = canvas.height;
	const { baseX, baseY, direction } = getLinearBase(canvas, settings);
	const isVertical = settings.spectrumLinearOrientation === 'vertical';
	const ringCount = settings.spectrumTunnelRingCount;
	const maxD = Math.min(w, h) * 0.48;
	const baseInnerD = settings.spectrumInnerRadius;
	const pixelHeights = runtime.pixelHeights;
	const barCount = Math.max(pixelHeights.length, 1);

	const spanF = Math.max(0.2, Math.min(1, settings.spectrumSpan ?? 1));
	const totalSpan = (isVertical ? h : w) * spanF;
	const axisStart = isVertical ? (h - totalSpan) / 2 : (w - totalSpan) / 2;

	ctx.save();
	ctx.lineCap = 'round';

	for (let ring = 0; ring < ringCount; ring++) {
		const t = ring / Math.max(ringCount - 1, 1);

		const bandStart = Math.floor(t * barCount * 0.8);
		const bandEnd = Math.min(barCount - 1, Math.floor((t + 1 / ringCount) * barCount * 0.8) + 1);
		let bandEnergy = 0;
		let bandSamples = 0;
		for (let b = bandStart; b <= bandEnd; b++) {
			bandEnergy += (pixelHeights[b] ?? 0);
			bandSamples++;
		}
		const avgEnergy = bandSamples > 0 ? bandEnergy / bandSamples : 0;
		const energyNorm = Math.min(avgEnergy / Math.max(settings.spectrumMaxHeight, 1), 1);

		const baseD = baseInnerD + t * (maxD - baseInnerD);
		const pulseD = baseD + energyNorm * settings.spectrumMaxHeight * 0.25;

		// No global rotation in linear layout — rotation only skewed rainbow phase and looked like spin.
		const strokeColor = getColor(settings, t + energyNorm * 0.08);

		const alpha = settings.spectrumOpacity * (1 - t * 0.4) * (0.3 + energyNorm * 0.7);
		ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
		ctx.strokeStyle = strokeColor;
		ctx.lineWidth = settings.spectrumBarWidth * (1 - t * 0.5) + 1;
		ctx.shadowColor = strokeColor;
		ctx.shadowBlur = settings.spectrumShadowBlur * settings.spectrumGlowIntensity * energyNorm;

		const segments = Math.max(6, Math.floor(barCount / ringCount));

		ctx.beginPath();
		for (let seg = 0; seg <= segments; seg++) {
			const frac = seg / Math.max(segments, 1);
			const segBin = Math.floor(frac * barCount);
			const localEnergy = Math.min(
				(pixelHeights[segBin] ?? 0) / Math.max(settings.spectrumMaxHeight, 1),
				1
			);
			const offsetD = pulseD + localEnergy * settings.spectrumMaxHeight * 0.1;

			if (isVertical) {
				const y = axisStart + frac * totalSpan;
				const x = baseX + direction * offsetD;
				if (seg === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			} else {
				const x = axisStart + frac * totalSpan;
				const y = baseY + direction * offsetD;
				if (seg === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
		}
		ctx.stroke();
	}

	ctx.restore();
}
