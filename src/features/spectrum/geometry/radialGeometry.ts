import type { SpectrumRadialShape } from '@/types/wallpaper';

export function normalizeAngle(angle: number): number {
	const fullTurn = Math.PI * 2;
	let next = angle % fullTurn;
	if (next < 0) next += fullTurn;
	return next;
}

export function getPolygonRadius(
	baseRadius: number,
	sides: number,
	angle: number
): number {
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
	return shapedAngle => ({
		factor: getPolygonRadius(1, sides, shapedAngle + rotation),
		minFactor
	});
}

function nStar(
	points: number,
	baseRatio: number,
	spikeAmplitude: number
): RadialShapeDefinition['factor'] {
	return shapedAngle => ({
		factor:
			baseRatio + (Math.cos(shapedAngle * points) + 1) * spikeAmplitude,
		minFactor: baseRatio
	});
}

/**
 * Rhombus / playing-card diamond (♦). `widthRatio` is horizontal-over-vertical
 * (e.g. 0.62 ≈ tall gem). Vertices: top, right, bottom, left. The radius along
 * an arbitrary angle satisfies the rhombus edge equation |x|/a + |y|/b = 1.
 */
function rhombus(widthRatio: number): RadialShapeDefinition['factor'] {
	const a = widthRatio;
	const b = 1;
	const minFactor = (a * b) / Math.sqrt(a * a + b * b);
	return shapedAngle => {
		const c = Math.abs(Math.cos(shapedAngle));
		const s = Math.abs(Math.sin(shapedAngle));
		const denom = c / a + s / b;
		return {
			factor: denom > 0 ? 1 / denom : 1,
			minFactor
		};
	};
}

/**
 * Ellipse with vertical major axis. `widthRatio` is horizontal-over-vertical
 * (0.7 = clearly oval; 1 collapses to a circle).
 */
function ellipse(widthRatio: number): RadialShapeDefinition['factor'] {
	const a = widthRatio;
	const b = 1;
	// Normalize so the longest semi-axis maps to factor=1 (no canvas clipping).
	const peak = Math.max(a, b);
	const minFactor = Math.min(a, b) / peak;
	return shapedAngle => {
		const c = Math.cos(shapedAngle);
		const s = Math.sin(shapedAngle);
		const denom = Math.sqrt(b * b * c * c + a * a * s * s);
		const raw = denom > 0 ? (a * b) / denom : 1;
		return {
			factor: raw / peak,
			minFactor
		};
	};
}

/**
 * Smooth N-petal flower. `petals` is the lobe count, `depth` is the bump
 * amplitude (0..1), `base` is the trough radius.
 */
function flower(
	petals: number,
	depth: number,
	base: number
): RadialShapeDefinition['factor'] {
	const minFactor = base;
	const peak = base + depth;
	return shapedAngle => ({
		factor: base + (depth * (1 + Math.cos(petals * shapedAngle))) / 2,
		minFactor: minFactor / Math.max(peak, 0.0001)
	});
}

/**
 * Gear / cog: smooth circle baseline with a squared bump on top.
 * `teeth` is tooth count, `depth` is bump height (0..0.3 looks gear-like).
 */
function gear(teeth: number, depth: number): RadialShapeDefinition['factor'] {
	const base = 1 - depth / 2;
	const peak = 1 + depth / 2;
	return shapedAngle => {
		// Smooth-stepped square wave: tanh of cosine = gentle teeth without
		// aliasing on rotation.
		const raw = Math.tanh(4 * Math.cos(teeth * shapedAngle));
		const factor = base + ((raw + 1) / 2) * depth;
		return { factor: factor / peak, minFactor: base / peak };
	};
}

/**
 * Hypocycloid-style shape with `cusps` inward-pointing dents on a polygonal
 * outline. `depth` controls how deep the dents go (0.2 ≈ deltoid).
 */
function hypocycloid(
	cusps: number,
	depth: number
): RadialShapeDefinition['factor'] {
	const base = 1 - depth;
	return shapedAngle => ({
		factor: 1 - (depth * (1 - Math.cos(cusps * shapedAngle))) / 2,
		minFactor: base
	});
}

/**
 * Polygon with sides bulged outward (convex curves between vertices).
 * `bulgeAmplitude` adds extra radius at the mid-side angles.
 */
function bulgedNGon(
	sides: number,
	bulgeAmplitude: number
): RadialShapeDefinition['factor'] {
	const polyMin = Math.cos(Math.PI / sides);
	return shapedAngle => {
		const polyR = getPolygonRadius(1, sides, shapedAngle);
		const mid = (1 - Math.cos(sides * shapedAngle)) / 2;
		const factor = polyR + bulgeAmplitude * mid * (1 - polyR);
		return {
			factor,
			minFactor: polyMin
		};
	};
}

/**
 * Polygon with sides pushed inward (concave curves between vertices).
 * `dentDepth` in [0, 0.4] is the visual "stretched-rubber" amount.
 */
function concaveNGon(
	sides: number,
	dentDepth: number
): RadialShapeDefinition['factor'] {
	const polyMin = Math.cos(Math.PI / sides);
	const minFactor = polyMin * (1 - dentDepth);
	return shapedAngle => {
		const polyR = getPolygonRadius(1, sides, shapedAngle);
		const mid = (1 - Math.cos(sides * shapedAngle)) / 2;
		return {
			factor: polyR * (1 - dentDepth * mid),
			minFactor
		};
	};
}

/**
 * Superellipse (|x|^n + |y|^n = 1) normalized so the widest diagonal stays at
 * factor ≤ 1. `n=2` is a circle, `n=4` is a "squircle", `n=8` is a rounded
 * square. For n>2 the peak radius is at 45° (diagonal), so we divide by that
 * peak to keep all factor values in (0, 1].
 */
function superellipse(n: number): RadialShapeDefinition['factor'] {
	// r(θ) = 1 / (|cos θ|^n + |sin θ|^n)^(1/n)
	// For n>2, peak is at 45° where both terms = (1/√2)^n.
	const half = Math.SQRT1_2;
	const halfN = Math.pow(half, n);
	// peakFactor > 1 for n>2 — this is the raw maximum factor before normalizing.
	const peakFactor = 1 / Math.pow(2 * halfN, 1 / n);
	// After dividing by peakFactor: diagonal = 1.0, cardinal axes = 1/peakFactor.
	const minFactor = 1 / peakFactor;
	return shapedAngle => {
		const c = Math.pow(Math.abs(Math.cos(shapedAngle)), n);
		const s = Math.pow(Math.abs(Math.sin(shapedAngle)), n);
		const denom = Math.pow(c + s, 1 / n);
		const raw = denom > 0 ? 1 / denom : 1;
		return {
			factor: raw / peakFactor,
			minFactor
		};
	};
}

/**
 * Cardioid (1 - cos) — heart-ish silhouette. Normalized so peak = 1 and
 * the cusp is clamped to `cuspFloor` so the renderer never sees r=0.
 */
function cardioid(cuspFloor: number): RadialShapeDefinition['factor'] {
	// Standard r = 1 - cos(θ - π/2) = 1 - sin(θ) → cusp at top (θ=π/2)
	// We rotate so the cusp points DOWN (heart sits upright): use 1 + sin(θ).
	// Then scale/offset into [cuspFloor, 1].
	return shapedAngle => {
		const raw = (1 + Math.sin(shapedAngle)) / 2; // 0..1
		const factor = cuspFloor + raw * (1 - cuspFloor);
		return { factor, minFactor: cuspFloor };
	};
}

/**
 * Crescent / banana moon. A pure limaçon is just an asymmetric egg — to read
 * as a moon we need an actual INWARD pinch on the opposite side, so we add
 * a second-harmonic dent term:
 *   r(θ) = base + a·cos(θ - tilt) − b·cos(2(θ - tilt))
 * The first harmonic gives the asymmetric bulge; the second creates a local
 * minimum on the "inside" of the crescent. Slight tilt makes the horns sit
 * naturally rather than aligning to the cardinal axes.
 *
 * Clamped to keep the dent above the renderer's safe radius.
 */
function moonCrescent(): RadialShapeDefinition['factor'] {
	const tilt = -Math.PI / 6;
	const base = 0.62;
	const bulge = 0.38;
	const dent = 0.18;
	const peak = base + bulge + dent; // ≈ 1.18
	const cuspFloor = 0.18;
	return shapedAngle => {
		const local = shapedAngle - tilt;
		const raw = base + bulge * Math.cos(local) - dent * Math.cos(2 * local);
		const clamped = Math.max(cuspFloor, raw);
		return {
			factor: clamped / peak,
			minFactor: cuspFloor / peak
		};
	};
}

/**
 * Teardrop. Round at the bottom, narrow point at the top.
 */
function teardrop(): RadialShapeDefinition['factor'] {
	const cuspFloor = 0.18;
	return shapedAngle => {
		// 0 at top (θ = -π/2), 1 at bottom.
		const t = (1 - Math.sin(shapedAngle)) / 2;
		// Bias toward fullness so the round bottom dominates.
		const eased = Math.pow(t, 0.6);
		const factor = cuspFloor + eased * (1 - cuspFloor);
		return { factor, minFactor: cuspFloor };
	};
}

/**
 * Wavy / scalloped circle — many small smooth bumps around the perimeter.
 */
function scalloped(
	bumps: number,
	amplitude: number
): RadialShapeDefinition['factor'] {
	const base = 1 - amplitude / 2;
	const peak = 1 + amplitude / 2;
	return shapedAngle => {
		const raw =
			base + (amplitude * (1 + Math.cos(bumps * shapedAngle))) / 2;
		return {
			factor: raw / peak,
			minFactor: base / peak
		};
	};
}

function smoothstep(edge0: number, edge1: number, x: number): number {
	const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
	return t * t * (3 - 2 * t);
}

/**
 * Cat-ear silhouette for logo-hugging radial spectra.
 * Keeps most of the ring circular, then lifts two sharp peaks near the top
 * with a small center dip between them so the outline reads as ears instead
 * of a simple flower.
 */
function catEars(): RadialShapeDefinition['factor'] {
	const base = 0.84;
	const peak = 1.22;
	return shapedAngle => {
		const topAligned = Math.atan2(
			Math.sin(shapedAngle + Math.PI / 2),
			Math.cos(shapedAngle + Math.PI / 2)
		);
		const topGate = 1 - smoothstep(0.72, 2.2, Math.abs(topAligned));
		const arch = Math.exp(-Math.pow(topAligned / 0.9, 2)) * 0.08;
		const leftEar =
			Math.exp(-Math.pow((topAligned + 0.62) / 0.16, 2)) * 0.28;
		const rightEar =
			Math.exp(-Math.pow((topAligned - 0.62) / 0.16, 2)) * 0.28;
		const centerDip =
			Math.exp(-Math.pow(topAligned / 0.22, 2)) * 0.08 * topGate;
		const raw =
			base + arch * topGate + (leftEar + rightEar) * topGate - centerDip;
		return {
			factor: Math.max(base, raw) / peak,
			minFactor: base / peak
		};
	};
}

/**
 * Two-lobed Valentine heart (♥).
 * - |sin(2θ)| → symmetric bumps at ≈50° and ≈130° (upper quadrants)
 * - (1-|sinθ|) → extra roundness at the horizontal sides (fuller body)
 * - sinθ → asymmetry: top wide, bottom tapers to a cusp
 * Max factor ≈ 0.94 (< 1) so no canvas clipping.
 */
function valentineHeart(): RadialShapeDefinition['factor'] {
	const base = 0.38;
	const lobe = 0.30; // two-bump amplitude
	const round = 0.15; // body-width term (peaks at 0°/180°)
	const fall = 0.30; // up/down asymmetry
	const cuspFloor = 0.06;
	return shapedAngle => {
		const raw =
			base +
			lobe * Math.abs(Math.sin(2 * shapedAngle)) +
			round * (1 - Math.abs(Math.sin(shapedAngle))) +
			fall * Math.sin(shapedAngle);
		return { factor: Math.max(cuspFloor, raw), minFactor: cuspFloor };
	};
}

/**
 * Cross / plus (+) with wide flat arms.
 * Uses |cos(2θ)|^p: peaks exactly at 0°/90°/180°/270° (arm centres, factor=1)
 * and drops to `minFactor` at the 45° corners. Power p<1 keeps the tops flat
 * (wide arms) rather than the pointed tips you'd get from a normal star.
 * Factor is always ≤ 1 — no canvas clipping.
 */
function cross(
	minFactor: number,
	sharpness: number
): RadialShapeDefinition['factor'] {
	const depth = 1 - minFactor;
	return shapedAngle => ({
		factor:
			minFactor +
			depth *
				Math.pow(Math.abs(Math.cos(2 * shapedAngle)), sharpness),
		minFactor
	});
}

/**
 * Horizontal double-lobe (butterfly wings). Two lobes pointing left/right
 * with a waist at top/bottom. `base` is the minimum radius at 90°/270°.
 */
function wings(base: number): RadialShapeDefinition['factor'] {
	const amplitude = 1 - base;
	return shapedAngle => ({
		factor: base + amplitude * Math.abs(Math.cos(shapedAngle)),
		minFactor: base
	});
}

/**
 * Bowtie / hourglass: extreme version of `wings` where the waist nearly
 * collapses to a point. Gives a figure-8 feel turned on its side.
 */
function bowtie(): RadialShapeDefinition['factor'] {
	const cuspFloor = 0.05;
	return shapedAngle => {
		const raw = Math.abs(Math.cos(shapedAngle));
		return { factor: Math.max(cuspFloor, raw), minFactor: cuspFloor };
	};
}

/**
 * Heraldic shield: rounded at the top, tapering to a pointed cusp at the
 * bottom. Extra width at the horizontal mid-level gives the characteristic
 * "broad shoulder" silhouette. Factor is clamped to ≤ 1 — no canvas clipping.
 */
function shieldShape(): RadialShapeDefinition['factor'] {
	const cuspFloor = 0.12;
	return shapedAngle => {
		// t=1 at top (90°), t=0 at bottom (-90°)
		const t = (1 + Math.sin(shapedAngle)) / 2;
		// Power 0.4 keeps the upper portion wide before tapering sharply
		const eased = Math.pow(t, 0.4);
		// sideBoost peaks at 0°/180° (horizontal) and is scaled by t so it
		// only applies above the equator — no extra width near the bottom cusp
		const sideBoost = Math.cos(shapedAngle) ** 2 * 0.15 * Math.sqrt(t);
		const raw = cuspFloor + eased * (1 - cuspFloor) + sideBoost;
		// Clamp to 1 so the shape never exceeds the circle radius
		return { factor: Math.min(1, raw), minFactor: cuspFloor };
	};
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
		// Tall rhombus (♦) — visually distinct from `square` which is just a
		// 4-gon at 45°. Width 0.62 ≈ playing-card diamond proportions.
		label: 'Diamond',
		factor: rhombus(0.62),
		tunnelSegments: 48
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
	},
	oval: {
		id: 'oval',
		// Vertical-major ellipse — fills the "smooth tall blob" niche that the
		// polygon roster lacks. Slightly narrower than diamond on purpose so
		// the two read differently in the picker.
		label: 'Oval',
		factor: ellipse(0.7),
		tunnelSegments: 64
	},
	lens: {
		id: 'lens',
		label: 'Lens',
		// Horizontal-major ellipse — landscape pill.
		factor: ellipse(1 / 0.55),
		tunnelSegments: 64
	},
	squircle: {
		id: 'squircle',
		label: 'Squircle',
		factor: superellipse(4),
		tunnelSegments: 64
	},
	roundedSquare: {
		id: 'roundedSquare',
		label: 'Rounded sq.',
		factor: superellipse(8),
		tunnelSegments: 72
	},
	cardioid: {
		id: 'cardioid',
		label: 'Cardioid',
		factor: cardioid(0.18),
		tunnelSegments: 72
	},
	heart: {
		id: 'heart',
		label: 'Heart',
		// Two-lobe Valentine ♥: |sin 2θ| places symmetric bumps upper-left and
		// upper-right; sin θ bias pulls bottom to a cusp.
		factor: valentineHeart(),
		tunnelSegments: 80
	},
	moon: {
		id: 'moon',
		label: 'Moon',
		factor: moonCrescent(),
		tunnelSegments: 64
	},
	drop: {
		id: 'drop',
		label: 'Drop',
		factor: teardrop(),
		tunnelSegments: 72
	},
	flower4: {
		id: 'flower4',
		label: 'Flower 4',
		factor: flower(4, 0.35, 0.55),
		tunnelSegments: 80
	},
	flower5: {
		id: 'flower5',
		label: 'Flower 5',
		factor: flower(5, 0.35, 0.55),
		tunnelSegments: 88
	},
	flower6: {
		id: 'flower6',
		label: 'Flower 6',
		factor: flower(6, 0.32, 0.6),
		tunnelSegments: 96
	},
	flower8: {
		id: 'flower8',
		label: 'Flower 8',
		factor: flower(8, 0.28, 0.65),
		tunnelSegments: 112
	},
	lobed3: {
		id: 'lobed3',
		label: 'Lobed 3',
		// 3-lobed shamrock vibe — wider lobes than flower3.
		factor: flower(3, 0.45, 0.5),
		tunnelSegments: 72
	},
	gear6: {
		id: 'gear6',
		label: 'Gear 6',
		factor: gear(6, 0.22),
		tunnelSegments: 96
	},
	gear12: {
		id: 'gear12',
		label: 'Gear 12',
		factor: gear(12, 0.18),
		tunnelSegments: 144
	},
	scalloped: {
		id: 'scalloped',
		label: 'Scalloped',
		factor: scalloped(14, 0.14),
		tunnelSegments: 144
	},
	deltoid: {
		id: 'deltoid',
		// 3-cusp inward-bowed triangle (think Reuleaux gone concave).
		label: 'Deltoid',
		factor: hypocycloid(3, 0.32),
		tunnelSegments: 72
	},
	astroid: {
		id: 'astroid',
		label: 'Astroid',
		factor: hypocycloid(4, 0.38),
		tunnelSegments: 80
	},
	bulgedTriangle: {
		id: 'bulgedTriangle',
		label: 'Tri bulge',
		factor: bulgedNGon(3, 0.55),
		tunnelSegments: 80
	},
	bulgedSquare: {
		id: 'bulgedSquare',
		label: 'Sq bulge',
		factor: bulgedNGon(4, 0.4),
		tunnelSegments: 80
	},
	concaveTriangle: {
		id: 'concaveTriangle',
		// Triangle whose sides dent inward - "spinning ninja star" silhouette.
		label: 'Tri concave',
		factor: concaveNGon(3, 0.32),
		tunnelSegments: 72
	},
	catEars: {
		id: 'catEars',
		label: 'Cat ears',
		factor: catEars(),
		tunnelSegments: 96
	},
	starburst10: {
		id: 'starburst10',
		label: '10-pt Star',
		factor: nStar(10, 0.55, 0.22),
		tunnelSegments: 144
	},
	starburst12: {
		id: 'starburst12',
		label: '12-pt Star',
		factor: nStar(12, 0.55, 0.22),
		tunnelSegments: 160
	},
	cross: {
		id: 'cross',
		label: 'Cross',
		// minFactor=0.35 (corner width), sharpness=0.3 (flat-topped arms)
		factor: cross(0.35, 0.3),
		tunnelSegments: 96
	},
	star3: {
		id: 'star3',
		label: '3-pt Star',
		factor: nStar(3, 0.32, 0.34),
		tunnelSegments: 72
	},
	wings: {
		id: 'wings',
		label: 'Wings',
		factor: wings(0.22),
		tunnelSegments: 80
	},
	shield: {
		id: 'shield',
		label: 'Shield',
		factor: shieldShape(),
		tunnelSegments: 80
	},
	bowtie: {
		id: 'bowtie',
		label: 'Bowtie',
		factor: bowtie(),
		tunnelSegments: 80
	}
};

export function getRadialShapeDefinition(
	shape: SpectrumRadialShape
): RadialShapeDefinition {
	return RADIAL_SHAPE_DEFINITIONS[shape] ?? RADIAL_SHAPE_DEFINITIONS.circle;
}

export const RADIAL_SHAPE_IDS: ReadonlyArray<SpectrumRadialShape> =
	Object.freeze(
		Object.keys(RADIAL_SHAPE_DEFINITIONS) as SpectrumRadialShape[]
	);

export const RADIAL_SHAPE_LABELS: Readonly<
	Record<SpectrumRadialShape, string>
> = Object.freeze(
	Object.fromEntries(
		(
			Object.entries(RADIAL_SHAPE_DEFINITIONS) as [
				SpectrumRadialShape,
				RadialShapeDefinition
			][]
		).map(([id, def]) => [id, def.label])
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
			? Math.max(
					baseRadius,
					minimumSafeRadius / Math.max(minFactor, 0.0001)
				)
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
		const r = getShapedRadiusAtAngle(
			shape,
			outerRadius,
			angle,
			radialAngleRad
		);
		const x = cx + Math.cos(angle) * r;
		const y = cy + Math.sin(angle) * r;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}

	for (let i = segments; i >= 0; i--) {
		const angle = phase + (i / segments) * Math.PI * 2;
		const r = getShapedRadiusAtAngle(
			shape,
			innerRadius,
			angle,
			radialAngleRad
		);
		const x = cx + Math.cos(angle) * r;
		const y = cy + Math.sin(angle) * r;
		if (i === segments) ctx.lineTo(x, y);
		else ctx.lineTo(x, y);
	}

	ctx.closePath();
}
