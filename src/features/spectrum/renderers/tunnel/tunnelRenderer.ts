import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import type { SpectrumRuntimeState } from '@/features/spectrum/runtime/spectrumRuntime';
import { hexToRgb } from '@/features/spectrum/color/spectrumColor';

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
	const cx = canvas.width / 2 + (settings.spectrumPositionX ?? 0) * canvas.width * 0.5;
	const cy = canvas.height / 2 - (settings.spectrumPositionY ?? 0) * canvas.height * 0.5;
	const ringCount = settings.spectrumTunnelRingCount;
	const maxR = Math.min(canvas.width, canvas.height) * 0.48;
	const baseInnerR = settings.spectrumInnerRadius;
	const pixelHeights = runtime.pixelHeights;
	const barCount = pixelHeights.length;
	const rotation = runtime.rotation;

	const [arR, arG, arB] = hexToRgb(settings.spectrumPrimaryColor) ?? [0, 255, 255];
	const [brR, brG, brB] = hexToRgb(settings.spectrumSecondaryColor) ?? [255, 0, 255];
	const colorA = { r: arR, g: arG, b: arB };
	const colorB = { r: brR, g: brG, b: brB };

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

		// Color blend: inner rings → colorA, outer rings → colorB
		let strokeColor: string;
		if (settings.spectrumColorMode === 'rainbow') {
			const hue = (t * 300 + rotation * 30) % 360;
			strokeColor = `hsl(${hue.toFixed(0)}, 100%, ${(40 + energyNorm * 30).toFixed(0)}%)`;
		} else if (settings.spectrumColorMode === 'solid') {
			strokeColor = settings.spectrumPrimaryColor;
		} else {
			const r = Math.round(colorA.r * (1 - t) + colorB.r * t);
			const g = Math.round(colorA.g * (1 - t) + colorB.g * t);
			const b = Math.round(colorA.b * (1 - t) + colorB.b * t);
			strokeColor = `rgb(${r},${g},${b})`;
		}

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
