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

// ─── Radial shape registry ───────────────────────────────────────────────
//
// Adding a new radial shape now requires only:
//   1. Add the id to `SpectrumRadialShape` (src/types/wallpaper.ts)
//   2. Add an entry below
// Everything else (UI list, labels, tunnel segments, math factor) derives
// from this single definition. TS enforces every union value has an entry
// via the `Record<SpectrumRadialShape, …>` type.
//
// Helpers:
//   - `nGon(sides, rotation)` builds a polygon factor at any sides count
//   - `nStar(points, inner, amplitude)` builds an M-pointed star
// So any N-sided polygon or M-pointed star is a 1-line entry.

export interface RadialShapeDefinition {
	id: SpectrumRadialShape;
	label: string;
	/**
	 * Radius modulation as a function of the shaped angle (angle +
	 * radialAngle offset). Returns the multiplier on `baseRadius` and the
	 * worst-case (minimum) factor used for the `minimumSafeRadius` clamp.
	 */
	factor: (shapedAngle: number) => { factor: number; minFactor: number };
	/** Segment count needed for clean rendering at tunnel-scale (many rings). */
	tunnelSegments: number;
}

function nGon(
	sides: number,
	rotation: number = 0
): RadialShapeDefinition['factor'] {
	const minFactor = Math.cos(Math.PI / sides);
	return (shapedAngle) => ({
		factor: getPolygonRadius(1, sides, shapedAngle + rotation),
		minFactor
	});
}

function nStar(
	points: number,
	baseRatio: number,
	spikeAmplitude: number
): RadialShapeDefinition['factor'] {
	return (shapedAngle) => ({
		factor:
			baseRatio + (Math.cos(shapedAngle * points) + 1) * spikeAmplitude,
		minFactor: baseRatio
	});
}

const RADIAL_SHAPE_DEFINITIONS: Record<
	SpectrumRadialShape,
	RadialShapeDefinition
> = {
	circle: {
		id: 'circle',
		label: 'Circle',
		factor: () => ({ factor: 1, minFactor: 1 }),
		tunnelSegments: 36
	},
	square: {
		id: 'square',
		label: 'Square',
		factor: nGon(4, Math.PI / 4),
		tunnelSegments: 32
	},
	triangle: {
		id: 'triangle',
		label: 'Triangle',
		factor: nGon(3, Math.PI / 2),
		tunnelSegments: 36
	},
	star: {
		id: 'star',
		label: 'Star',
		factor: nStar(5, 0.64, 0.18),
		tunnelSegments: 80
	},
	diamond: {
		id: 'diamond',
		label: 'Diamond',
		factor: nGon(4, 0),
		tunnelSegments: 32
	},
	hexagon: {
		id: 'hexagon',
		label: 'Hexagon',
		factor: nGon(6, Math.PI / 6),
		tunnelSegments: 48
	},
	octagon: {
		id: 'octagon',
		label: 'Octagon',
		factor: nGon(8, Math.PI / 8),
		tunnelSegments: 64
	},
	pentagon: {
		id: 'pentagon',
		label: 'Pentagon',
		factor: nGon(5, Math.PI / 5),
		tunnelSegments: 40
	},
	star6: {
		id: 'star6',
		label: '6-pt Star',
		factor: nStar(6, 0.6, 0.2),
		tunnelSegments: 96
	}
};

export function getRadialShapeDefinition(
	shape: SpectrumRadialShape
): RadialShapeDefinition {
	return RADIAL_SHAPE_DEFINITIONS[shape] ?? RADIAL_SHAPE_DEFINITIONS.circle;
}

export const RADIAL_SHAPE_IDS: ReadonlyArray<SpectrumRadialShape> =
	Object.freeze(Object.keys(RADIAL_SHAPE_DEFINITIONS) as SpectrumRadialShape[]);

export const RADIAL_SHAPE_LABELS: Readonly<
	Record<SpectrumRadialShape, string>
> = Object.freeze(
	Object.fromEntries(
		(Object.entries(RADIAL_SHAPE_DEFINITIONS) as [
			SpectrumRadialShape,
			RadialShapeDefinition
		][]).map(([id, def]) => [id, def.label])
	) as Record<SpectrumRadialShape, string>
);

export function getRadialShapeFactor(
	shape: SpectrumRadialShape,
	angle: number,
	radialAngle: number
): { factor: number; minFactor: number } {
	return getRadialShapeDefinition(shape).factor(angle + radialAngle);
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
