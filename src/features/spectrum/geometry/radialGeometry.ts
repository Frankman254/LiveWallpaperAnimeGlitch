import type { SpectrumRadialShape } from '@/types/wallpaper';

export function normalizeAngle(angle: number): number {
	const fullTurn = Math.PI * 2;
	let next = angle % fullTurn;
	if (next < 0) next += fullTurn;
	return next;
}

export function getPolygonRadius(baseRadius: number, sides: number, angle: number): number {
	const sector = (Math.PI * 2) / sides;
	const local = (normalizeAngle(angle + sector / 2) % sector) - sector / 2;
	return (baseRadius * Math.cos(Math.PI / sides)) / Math.cos(local);
}

export function getRadialShapeFactor(
	shape: SpectrumRadialShape,
	angle: number,
	radialAngle: number
): { factor: number; minFactor: number } {
	const shapedAngle = angle + radialAngle;
	switch (shape) {
		case 'diamond':
			return {
				factor: getPolygonRadius(1, 4, shapedAngle),
				minFactor: Math.cos(Math.PI / 4)
			};
		case 'square':
			return {
				factor: getPolygonRadius(1, 4, shapedAngle + Math.PI / 4),
				minFactor: Math.cos(Math.PI / 4)
			};
		case 'hexagon':
			return {
				factor: getPolygonRadius(1, 6, shapedAngle + Math.PI / 6),
				minFactor: Math.cos(Math.PI / 6)
			};
		case 'octagon':
			return {
				factor: getPolygonRadius(1, 8, shapedAngle + Math.PI / 8),
				minFactor: Math.cos(Math.PI / 8)
			};
		case 'triangle':
			return {
				factor: getPolygonRadius(1, 3, shapedAngle + Math.PI / 2),
				minFactor: Math.cos(Math.PI / 3)
			};
		case 'star': {
			const factor = 0.64 + (Math.cos(shapedAngle * 5) + 1) * 0.18;
			return { factor, minFactor: 0.64 };
		}
		case 'circle':
		default:
			return { factor: 1, minFactor: 1 };
	}
}

export function getRadialBaseRadius(
	shape: SpectrumRadialShape,
	baseRadius: number,
	angle: number,
	radialAngle: number,
	minimumSafeRadius = 0
): number {
	const { factor, minFactor } = getRadialShapeFactor(
		shape,
		angle,
		radialAngle
	);
	const effectiveBaseRadius =
		minimumSafeRadius > 0
			? Math.max(baseRadius, minimumSafeRadius / Math.max(minFactor, 0.0001))
			: baseRadius;
	return effectiveBaseRadius * factor;
}

/** Matches radial bar / wave sampling (first bin at top). */
export const RADIAL_SHAPE_SAMPLE_PHASE = -Math.PI / 2;

export const RADIAL_SHAPE_SEGMENTS = 96;

export function getSpectrumRadialAngleRad(radialAngleDeg: number): number {
	return (radialAngleDeg * Math.PI) / 180;
}

export function getShapedRadiusAtAngle(
	shape: SpectrumRadialShape,
	nominalRadius: number,
	angle: number,
	radialAngleRad: number,
	minimumSafeRadius = 0
): number {
	return getRadialBaseRadius(
		shape,
		nominalRadius,
		angle,
		radialAngleRad,
		minimumSafeRadius
	);
}

export function traceRadialShapeContour(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	shape: SpectrumRadialShape,
	nominalRadius: number,
	radialAngleRad: number,
	options?: {
		segments?: number;
		phase?: number;
		minimumSafeRadius?: number;
	}
): void {
	const segments = options?.segments ?? RADIAL_SHAPE_SEGMENTS;
	const phase = options?.phase ?? RADIAL_SHAPE_SAMPLE_PHASE;
	const minimumSafeRadius = options?.minimumSafeRadius ?? 0;

	for (let i = 0; i <= segments; i++) {
		const angle = phase + (i / segments) * Math.PI * 2;
		const r = getShapedRadiusAtAngle(
			shape,
			nominalRadius,
			angle,
			radialAngleRad,
			minimumSafeRadius
		);
		const x = cx + Math.cos(angle) * r;
		const y = cy + Math.sin(angle) * r;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.closePath();
}

/** Filled band between two shaped contours (e.g. tunnel tube walls). */
export function traceRadialShapeAnnulus(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	shape: SpectrumRadialShape,
	innerRadius: number,
	outerRadius: number,
	radialAngleRad: number,
	options?: {
		segments?: number;
		phase?: number;
	}
): void {
	const segments = options?.segments ?? RADIAL_SHAPE_SEGMENTS;
	const phase = options?.phase ?? RADIAL_SHAPE_SAMPLE_PHASE;

	for (let i = 0; i <= segments; i++) {
		const angle = phase + (i / segments) * Math.PI * 2;
		const r = getShapedRadiusAtAngle(shape, outerRadius, angle, radialAngleRad);
		const x = cx + Math.cos(angle) * r;
		const y = cy + Math.sin(angle) * r;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}

	for (let i = segments; i >= 0; i--) {
		const angle = phase + (i / segments) * Math.PI * 2;
		const r = getShapedRadiusAtAngle(shape, innerRadius, angle, radialAngleRad);
		const x = cx + Math.cos(angle) * r;
		const y = cy + Math.sin(angle) * r;
		if (i === segments) ctx.lineTo(x, y);
		else ctx.lineTo(x, y);
	}

	ctx.closePath();
}
