import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import type { SpectrumRuntimeState } from '@/features/spectrum/runtime/spectrumRuntime';
import { getColor } from '@/features/spectrum/color/spectrumColor';

/**
 * Draw orbiting particle trails — one orbit per frequency bar.
 * Bars with higher energy push their particle to a wider orbit.
 * `spectrumRotationSpeed` controls base orbital speed.
 */
export function drawOrbital(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings,
	dt: number
): void {
	const pixelHeights = runtime.pixelHeights;
	const barCount = Math.max(pixelHeights.length, 1);
	const cx = canvas.width / 2 + (settings.spectrumPositionX ?? 0) * canvas.width * 0.5;
	const cy = canvas.height / 2 - (settings.spectrumPositionY ?? 0) * canvas.height * 0.5;
	const innerR = settings.spectrumInnerRadius;
	const maxH = settings.spectrumMaxHeight;
	const maxR = innerR + maxH;
	const baseSpeed = Math.max(0.1, settings.spectrumRotationSpeed * 0.8 + 0.3);

	// Initialize per-bar orbital angles
	if (!runtime.orbitalAngles || runtime.orbitalAngles.length !== barCount) {
		runtime.orbitalAngles = new Float32Array(barCount);
		for (let i = 0; i < barCount; i++) {
			runtime.orbitalAngles[i] = (i / barCount) * Math.PI * 2;
		}
	}

	// Advance orbital angles
	for (let i = 0; i < barCount; i++) {
		const energyNorm = Math.min((pixelHeights[i] ?? 0) / Math.max(maxH, 1), 1);
		// Higher energy = faster orbit + each bar slightly different speed
		const orbitalSpeed = baseSpeed * (0.5 + energyNorm * 1.5) * (1 + (i % 8) * 0.04);
		runtime.orbitalAngles[i] = (runtime.orbitalAngles[i] + orbitalSpeed * dt) % (Math.PI * 2);
	}

	ctx.save();
	ctx.shadowBlur = settings.spectrumShadowBlur * settings.spectrumGlowIntensity;

	// Draw particles — group into orbital shells for visual clarity
	const shellCount = Math.min(barCount, 8);
	const barsPerShell = Math.ceil(barCount / shellCount);

	for (let shell = 0; shell < shellCount; shell++) {
		const shellT = shell / Math.max(shellCount - 1, 1); // 0..1
		const shellInnerR = innerR + shellT * (maxR - innerR) * 0.7;

		let shellEnergy = 0;
		const shellStart = shell * barsPerShell;
		const shellEnd = Math.min(barCount, shellStart + barsPerShell);
		for (let b = shellStart; b < shellEnd; b++) {
			shellEnergy += (pixelHeights[b] ?? 0);
		}
		shellEnergy /= Math.max(shellEnd - shellStart, 1);
		const shellNorm = Math.min(shellEnergy / Math.max(maxH, 1), 1);
		const shellR = shellInnerR + shellNorm * (maxH * 0.3);

		const particleColor = getColor(
			settings,
			shellT + runtime.rotation / (Math.PI * 2) + shellNorm * 0.06
		);

		ctx.shadowColor = particleColor;

		// Draw particles in this shell
		for (let b = shellStart; b < shellEnd; b++) {
			const energyNorm = Math.min((pixelHeights[b] ?? 0) / Math.max(maxH, 1), 1);
			const angle = runtime.orbitalAngles[b] ?? 0;
			const r = shellR + energyNorm * maxH * 0.12;

			const x = cx + Math.cos(angle) * r;
			const y = cy + Math.sin(angle) * r;

			// Particle size scales with energy
			const dotRadius = settings.spectrumBarWidth * (0.8 + energyNorm * 1.5);
			const alpha = settings.spectrumOpacity * (0.3 + energyNorm * 0.7);

			ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
			ctx.fillStyle = particleColor;
			ctx.beginPath();
			ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
			ctx.fill();

			// Draw a short trail line toward the center of orbit
			if (settings.spectrumGlowIntensity > 0.5) {
				const prevAngle = angle - 0.15;
				const tx = cx + Math.cos(prevAngle) * r;
				const ty = cy + Math.sin(prevAngle) * r;
				ctx.save();
				ctx.globalAlpha *= 0.35;
				ctx.strokeStyle = particleColor;
				ctx.lineWidth = dotRadius * 0.7;
				ctx.beginPath();
				ctx.moveTo(tx, ty);
				ctx.lineTo(x, y);
				ctx.stroke();
				ctx.restore();
			}
		}

		// Draw orbital ring guide (faint)
		if (settings.spectrumOpacity > 0.3) {
			ctx.save();
			ctx.globalAlpha = settings.spectrumOpacity * 0.08 * (0.3 + shellNorm * 0.7);
			ctx.strokeStyle = particleColor;
			ctx.lineWidth = 1;
			ctx.shadowBlur = 0;
			ctx.beginPath();
			ctx.arc(cx, cy, shellR, 0, Math.PI * 2);
			ctx.stroke();
			ctx.restore();
		}
	}

	ctx.restore();
}
