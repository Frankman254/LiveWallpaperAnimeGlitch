function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

/**
 * Thin bright core stroke over an existing colored trace. One extra stroke,
 * no blur. Assumes the caller has already built the path.
 */
export function drawNeonCorePass(
	ctx: CanvasRenderingContext2D,
	lineWidth: number,
	intensity: number,
	coreWidthFrac: number,
	strokeStyle: string | CanvasGradient
): void {
	const coreIntensity = clamp01(intensity);
	if (coreIntensity <= 0.01) return;
	const coreWidth = Math.max(
		0.6,
		lineWidth * clamp01(coreWidthFrac) * 0.42
	);
	ctx.save();
	ctx.shadowBlur = 0;
	ctx.globalAlpha *= 0.55 + coreIntensity * 0.45;
	ctx.lineWidth = coreWidth;
	ctx.strokeStyle = strokeStyle;
	ctx.stroke();
	ctx.restore();
}
