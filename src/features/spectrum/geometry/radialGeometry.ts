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
// Adding a new radial shape requires only:
//   1. Add the id to `SpectrumRadialShape` (src/types/wallpaper.ts)
//   2. Add an entry to RADIAL_SHAPE_SOURCES below
// Everything else (UI list, labels, tunnel segments, math factor) derives
// from this single definition. TS enforces every union value has an entry
// via the `Record<SpectrumRadialShape, …>` type.
//
// ─── Four rules every shape author must know ─────────────────────────────
//
// 1. AUTHOR RAW GEOMETRY ONLY. A shape is a plain `(angle) => number`. Do NOT
//    normalize the peak to 1 and do NOT hand-write a `minFactor` — `calibrate()`
//    measures both from the curve itself. Hand-written minima drifted from the
//    real curve in the past (the flower family under-reported its trough and cut
//    through the logo), so the number is now always measured, never declared.
//
// 2. NEVER CLAMP. `Math.min(1, raw)` / `Math.max(floor, raw)` flatten a chunk of
//    the outline into a dead circular arc — the "capped at a limit radius" look.
//    Shape the curve so its natural extremes land where you want them instead.
//
// 3. KEEP THE TROUGH ABOVE 1/MAX_LOGO_FIT_INFLATION. "Fit around logo" scales
//    the shape by 1/minFactor; a deep trough turns a modest ring into an
//    off-screen one.
//
// 4. CANVAS Y GROWS DOWNWARD. `Math.sin(angle) > 0` is the BOTTOM of the screen.
//    Any shape with a vertical axis must account for that — reading it as a
//    maths axis is what rendered heart / drop / shield / cardioid upside down
//    before they were retired.
//
// Rules 2–4 are why the retired shapes are retired: a cusp or a concave bite
// cannot satisfy them, because r(θ) can only describe outlines that are
// star-shaped around their own centre. If a new shape needs to break one of
// these rules, it needs a different renderer, not a looser rule.
//
// Helpers:
//   - `nGon(sides, rotation)` builds a polygon factor at any sides count
//   - `nStar(points, inner, amplitude)` builds an M-pointed star
//   - `fromPolygon(vertices)` builds any straight-edged outline exactly
// So any N-sided polygon or M-pointed star is a 1-line entry.

/**
 * Raw, un-normalized radius as a function of the shaped angle.
 *
 * `criticalAngles` lets a shape declare angles where its curve has a corner, so
 * `calibrate` measures the true extreme instead of whatever a uniform sweep
 * happens to land near. Only shapes with actual vertices need it.
 */
type RawShapeFactor = ((shapedAngle: number) => number) & {
	criticalAngles?: readonly number[];
};

export interface RadialShapeDefinition {
	id: SpectrumRadialShape;
	label: string;
	/**
	 * Radius modulation as a function of the shaped angle (angle +
	 * radialAngle offset). Returns the multiplier on `baseRadius` — always
	 * peaking at exactly 1 — and the measured worst-case (minimum) factor used
	 * for the `minimumSafeRadius` clamp.
	 */
	factor: (shapedAngle: number) => { factor: number; minFactor: number };
	/** Segment count needed for clean rendering at tunnel-scale (many rings). */
	tunnelSegments: number;
}

interface RadialShapeSource {
	label: string;
	raw: RawShapeFactor;
	tunnelSegments: number;
}

/**
 * Measures a raw shape once and returns the public factor function.
 *
 * Normalizing to the measured peak means every shape fills exactly the radius
 * the user asked for, so they all look the same size in the picker. Deriving
 * `minFactor` from the measured trough means the "fit around logo" clamp is
 * neither over- nor under-protective — it can no longer drift away from the
 * curve it describes.
 */
function calibrate(
	raw: RawShapeFactor,
	samples = 2048
): RadialShapeDefinition['factor'] {
	let min = Infinity;
	let max = -Infinity;
	const observe = (angle: number) => {
		const value = raw(angle);
		if (value < min) min = value;
		if (value > max) max = value;
	};
	for (let i = 0; i < samples; i++) observe((i / samples) * Math.PI * 2);
	for (const angle of raw.criticalAngles ?? []) observe(angle);
	const peak = max > 1e-6 ? max : 1;
	const minFactor = Math.max(min / peak, 1e-4);
	return shapedAngle => ({ factor: raw(shapedAngle) / peak, minFactor });
}

function nGon(sides: number, rotation: number = 0): RawShapeFactor {
	return shapedAngle => getPolygonRadius(1, sides, shapedAngle + rotation);
}

function nStar(
	points: number,
	baseRatio: number,
	spikeAmplitude: number
): RawShapeFactor {
	return shapedAngle =>
		baseRatio + (Math.cos(shapedAngle * points) + 1) * spikeAmplitude;
}

const cross2 = (ax: number, ay: number, bx: number, by: number): number =>
	ax * by - ay * bx;

/**
 * Exact outline of any straight-edged polygon, given its vertices in unit
 * space. Returns the distance from the origin to the boundary along `angle`.
 *
 * This is how shapes that must have real corners (a cross needs right angles,
 * a bowtie needs straight edges) get them: trigonometric stand-ins like
 * `|cos 2θ|^p` produce rounded lumps with a spike at the tip, which is the
 * opposite of the intended silhouette.
 *
 * The polygon must contain the origin and be star-shaped around it — true for
 * every shape here. Takes the farthest crossing so rays that pass exactly
 * through a vertex still resolve.
 */
function fromPolygon(
	vertices: ReadonlyArray<readonly [number, number]>
): RawShapeFactor {
	const radiusAt: RawShapeFactor = shapedAngle => {
		const dx = Math.cos(shapedAngle);
		const dy = Math.sin(shapedAngle);
		let best = 0;
		for (let i = 0; i < vertices.length; i++) {
			const [px, py] = vertices[i];
			const [qx, qy] = vertices[(i + 1) % vertices.length];
			const ex = qx - px;
			const ey = qy - py;
			const denom = cross2(dx, dy, ex, ey);
			if (Math.abs(denom) < 1e-12) continue;
			const s = cross2(px, py, dx, dy) / denom;
			if (s < -1e-9 || s > 1 + 1e-9) continue;
			const t = cross2(px, py, ex, ey) / denom;
			if (t > best) best = t;
		}
		return best;
	};
	// Every corner is an extreme of the curve; measure them exactly.
	radiusAt.criticalAngles = vertices.map(([x, y]) => Math.atan2(y, x));
	return radiusAt;
}

/**
 * Rhombus / playing-card diamond (♦). `widthRatio` is horizontal-over-vertical
 * (e.g. 0.62 ≈ tall gem). Vertices: top, right, bottom, left. The radius along
 * an arbitrary angle satisfies the rhombus edge equation |x|/a + |y|/b = 1.
 */
function rhombus(widthRatio: number): RawShapeFactor {
	const a = widthRatio;
	const b = 1;
	return shapedAngle => {
		const c = Math.abs(Math.cos(shapedAngle));
		const s = Math.abs(Math.sin(shapedAngle));
		const denom = c / a + s / b;
		return denom > 0 ? 1 / denom : 1;
	};
}

/**
 * Ellipse with vertical major axis. `widthRatio` is horizontal-over-vertical
 * (0.7 = clearly oval; 1 collapses to a circle).
 */
function ellipse(widthRatio: number): RawShapeFactor {
	const a = widthRatio;
	const b = 1;
	return shapedAngle => {
		const c = Math.cos(shapedAngle);
		const s = Math.sin(shapedAngle);
		const denom = Math.sqrt(b * b * c * c + a * a * s * s);
		return denom > 0 ? (a * b) / denom : 1;
	};
}

/**
 * Smooth N-petal flower. `petals` is the lobe count, `depth` is the bump
 * amplitude (0..1), `base` is the trough radius.
 */
function flower(petals: number, depth: number, base: number): RawShapeFactor {
	return shapedAngle =>
		base + (depth * (1 + Math.cos(petals * shapedAngle))) / 2;
}

/**
 * Gear / cog: smooth circle baseline with a squared bump on top.
 * `teeth` is tooth count, `depth` is bump height (0..0.3 looks gear-like).
 */
function gear(teeth: number, depth: number): RawShapeFactor {
	const base = 1 - depth / 2;
	return shapedAngle => {
		// Smooth-stepped square wave: tanh of cosine = gentle teeth without
		// aliasing on rotation.
		const raw = Math.tanh(4 * Math.cos(teeth * shapedAngle));
		return base + ((raw + 1) / 2) * depth;
	};
}

/**
 * Hypocycloid-style shape with `cusps` inward-pointing dents on a polygonal
 * outline. `depth` controls how deep the dents go (0.2 ≈ deltoid).
 */
function hypocycloid(cusps: number, depth: number): RawShapeFactor {
	return shapedAngle => 1 - (depth * (1 - Math.cos(cusps * shapedAngle))) / 2;
}

/**
 * Polygon with sides bulged outward (convex curves between vertices).
 * `bulgeAmplitude` adds extra radius at the mid-side angles.
 */
function bulgedNGon(sides: number, bulgeAmplitude: number): RawShapeFactor {
	return shapedAngle => {
		const polyR = getPolygonRadius(1, sides, shapedAngle);
		const mid = (1 - Math.cos(sides * shapedAngle)) / 2;
		return polyR + bulgeAmplitude * mid * (1 - polyR);
	};
}

/**
 * Polygon with sides pushed inward (concave curves between vertices).
 * `dentDepth` in [0, 0.4] is the visual "stretched-rubber" amount.
 */
function concaveNGon(sides: number, dentDepth: number): RawShapeFactor {
	return shapedAngle => {
		const polyR = getPolygonRadius(1, sides, shapedAngle);
		const mid = (1 - Math.cos(sides * shapedAngle)) / 2;
		return polyR * (1 - dentDepth * mid);
	};
}

/**
 * Superellipse (|x|^n + |y|^n = 1). `n=2` is a circle, `n=4` is a "squircle",
 * `n=8` is a rounded square. The 45° diagonal is the peak for n>2; `calibrate`
 * normalizes it, so nothing here has to.
 */
function superellipse(n: number): RawShapeFactor {
	return shapedAngle => {
		const c = Math.pow(Math.abs(Math.cos(shapedAngle)), n);
		const s = Math.pow(Math.abs(Math.sin(shapedAngle)), n);
		const denom = Math.pow(c + s, 1 / n);
		return denom > 0 ? 1 / denom : 1;
	};
}

/**
 * Wavy / scalloped circle — many small smooth bumps around the perimeter.
 */
function scalloped(bumps: number, amplitude: number): RawShapeFactor {
	const base = 1 - amplitude / 2;
	return shapedAngle =>
		base + (amplitude * (1 + Math.cos(bumps * shapedAngle))) / 2;
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
 *
 * The circular lower two thirds are deliberate here (it's the head), which is
 * why this is the one shape allowed a long constant-radius stretch.
 */
function catEars(): RawShapeFactor {
	const base = 0.84;
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
		return Math.max(base, raw);
	};
}

/** Plus sign with real right angles. `armHalfWidth` in (0, 1). */
function crossPolygon(armHalfWidth: number): RawShapeFactor {
	const w = armHalfWidth;
	return fromPolygon([
		[1, -w],
		[1, w],
		[w, w],
		[w, 1],
		[-w, 1],
		[-w, w],
		[-1, w],
		[-1, -w],
		[-w, -w],
		[-w, -1],
		[w, -1],
		[w, -w]
	]);
}

/**
 * Bowtie / hourglass with straight edges and a finite waist.
 *
 * An ideal bowtie pinches to a single point, which no radial shape can express
 * (the waist would be r=0 in every direction outside the wedge). A finite waist
 * half-height keeps the silhouette readable and the trough well above the
 * "fit around logo" floor.
 */
function bowtie(): RawShapeFactor {
	const tipHalfHeight = 0.62;
	const waistHalfHeight = 0.34;
	return fromPolygon([
		[1, -tipHalfHeight],
		[1, tipHalfHeight],
		[0, waistHalfHeight],
		[-1, tipHalfHeight],
		[-1, -tipHalfHeight],
		[0, -waistHalfHeight]
	]);
}

const RADIAL_SHAPE_SOURCES: Record<SpectrumRadialShape, RadialShapeSource> = {
	circle: {
		label: 'Circle',
		raw: () => 1,
		tunnelSegments: 36
	},
	square: {
		label: 'Square',
		raw: nGon(4, Math.PI / 4),
		tunnelSegments: 32
	},
	triangle: {
		label: 'Triangle',
		raw: nGon(3, Math.PI / 2),
		tunnelSegments: 36
	},
	star: {
		label: 'Star',
		raw: nStar(5, 0.64, 0.18),
		tunnelSegments: 80
	},
	diamond: {
		// Tall rhombus (♦) — visually distinct from `square` which is just a
		// 4-gon at 45°. Width 0.62 ≈ playing-card diamond proportions.
		label: 'Diamond',
		raw: rhombus(0.62),
		tunnelSegments: 48
	},
	hexagon: {
		label: 'Hexagon',
		raw: nGon(6, Math.PI / 6),
		tunnelSegments: 48
	},
	octagon: {
		label: 'Octagon',
		raw: nGon(8, Math.PI / 8),
		tunnelSegments: 64
	},
	pentagon: {
		label: 'Pentagon',
		raw: nGon(5, Math.PI / 5),
		tunnelSegments: 40
	},
	star6: {
		label: '6-pt Star',
		raw: nStar(6, 0.6, 0.2),
		tunnelSegments: 96
	},
	oval: {
		// Vertical-major ellipse — fills the "smooth tall blob" niche that the
		// polygon roster lacks. Slightly narrower than diamond on purpose so
		// the two read differently in the picker.
		label: 'Oval',
		raw: ellipse(0.7),
		tunnelSegments: 64
	},
	lens: {
		label: 'Lens',
		// Horizontal-major ellipse — landscape pill.
		raw: ellipse(1 / 0.55),
		tunnelSegments: 64
	},
	squircle: {
		label: 'Squircle',
		raw: superellipse(4),
		tunnelSegments: 64
	},
	roundedSquare: {
		label: 'Rounded sq.',
		raw: superellipse(8),
		tunnelSegments: 72
	},
	flower4: {
		label: 'Flower 4',
		raw: flower(4, 0.35, 0.55),
		tunnelSegments: 80
	},
	flower5: {
		label: 'Flower 5',
		raw: flower(5, 0.35, 0.55),
		tunnelSegments: 88
	},
	flower6: {
		label: 'Flower 6',
		raw: flower(6, 0.32, 0.6),
		tunnelSegments: 96
	},
	flower8: {
		label: 'Flower 8',
		raw: flower(8, 0.28, 0.65),
		tunnelSegments: 112
	},
	lobed3: {
		label: 'Lobed 3',
		// 3-lobed shamrock vibe — wider lobes than flower3.
		raw: flower(3, 0.45, 0.5),
		tunnelSegments: 72
	},
	gear6: {
		label: 'Gear 6',
		raw: gear(6, 0.22),
		tunnelSegments: 96
	},
	gear12: {
		label: 'Gear 12',
		raw: gear(12, 0.18),
		tunnelSegments: 144
	},
	scalloped: {
		label: 'Scalloped',
		raw: scalloped(14, 0.14),
		tunnelSegments: 144
	},
	deltoid: {
		// 3-cusp inward-bowed triangle (think Reuleaux gone concave).
		label: 'Deltoid',
		raw: hypocycloid(3, 0.32),
		tunnelSegments: 72
	},
	astroid: {
		label: 'Astroid',
		raw: hypocycloid(4, 0.38),
		tunnelSegments: 80
	},
	bulgedTriangle: {
		label: 'Tri bulge',
		raw: bulgedNGon(3, 0.55),
		tunnelSegments: 80
	},
	bulgedSquare: {
		label: 'Sq bulge',
		raw: bulgedNGon(4, 0.4),
		tunnelSegments: 80
	},
	concaveTriangle: {
		// Triangle whose sides dent inward - "spinning ninja star" silhouette.
		label: 'Tri concave',
		raw: concaveNGon(3, 0.32),
		tunnelSegments: 72
	},
	catEars: {
		label: 'Cat ears',
		raw: catEars(),
		tunnelSegments: 96
	},
	starburst10: {
		label: '10-pt Star',
		raw: nStar(10, 0.55, 0.22),
		tunnelSegments: 144
	},
	starburst12: {
		label: '12-pt Star',
		raw: nStar(12, 0.55, 0.22),
		tunnelSegments: 160
	},
	cross: {
		label: 'Cross',
		// True plus sign — right angles, flat arm tips, no rounded lumps.
		raw: crossPolygon(0.32),
		tunnelSegments: 96
	},
	star3: {
		label: '3-pt Star',
		raw: nStar(3, 0.32, 0.34),
		tunnelSegments: 72
	},
	bowtie: {
		label: 'Bowtie',
		raw: bowtie(),
		tunnelSegments: 80
	}
};

const RADIAL_SHAPE_DEFINITIONS: Record<
	SpectrumRadialShape,
	RadialShapeDefinition
> = Object.freeze(
	Object.fromEntries(
		(
			Object.entries(RADIAL_SHAPE_SOURCES) as [
				SpectrumRadialShape,
				RadialShapeSource
			][]
		).map(([id, source]) => [
			id,
			{
				id,
				label: source.label,
				factor: calibrate(source.raw),
				tunnelSegments: source.tunnelSegments
			} satisfies RadialShapeDefinition
		])
	) as Record<SpectrumRadialShape, RadialShapeDefinition>
);

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

/**
 * Highest multiplier "fit around logo" may apply to the requested radius.
 *
 * Clearing the logo means scaling the whole shape up by 1/minFactor. Left
 * unbounded that is catastrophic for deep-trough shapes — the old bowtie asked
 * for 20×, so a 120px ring was drawn at 2400px and its lobes left the screen
 * while the waist sat at the requested radius. The deepest legitimate outline
 * (triangle) needs 2.0×, so 3.5 leaves headroom without allowing a blow-up.
 */
export const MAX_LOGO_FIT_INFLATION = 3.5;

/**
 * Maximum exponent applied by the "sharp points" control. 1 leaves the shape
 * untouched; higher values narrow every lobe toward its peak.
 */
const MAX_SHARPNESS_EXPONENT = 3.5;

/**
 * Narrows a shape's lobes toward their tips without changing its bounds.
 *
 * Remaps the normalized factor within its own [minFactor, 1] band, so the peak
 * still reaches exactly 1 and the trough never drops below `minFactor` — the
 * logo-fit guarantee is unaffected by how sharp the user makes the points.
 * `sharpness = 0` is an exact no-op, so saved presets render unchanged.
 */
export function applyRadialSharpness(
	factor: number,
	minFactor: number,
	sharpness: number
): number {
	if (sharpness <= 0) return factor;
	const span = 1 - minFactor;
	// A circle has no lobes to sharpen.
	if (span < 1e-6) return factor;
	const t = Math.max(0, Math.min(1, (factor - minFactor) / span));
	const exponent = 1 + Math.min(1, sharpness) * (MAX_SHARPNESS_EXPONENT - 1);
	return minFactor + Math.pow(t, exponent) * span;
}

export function getRadialShapeFactor(
	shape: SpectrumRadialShape,
	angle: number,
	radialAngle: number,
	sharpness = 0
): { factor: number; minFactor: number } {
	const { factor, minFactor } = getRadialShapeDefinition(shape).factor(
		angle + radialAngle
	);
	return {
		factor: applyRadialSharpness(factor, minFactor, sharpness),
		minFactor
	};
}

export function getRadialBaseRadius(
	shape: SpectrumRadialShape,
	baseRadius: number,
	angle: number,
	radialAngle: number,
	minimumSafeRadius = 0,
	sharpness = 0
): number {
	const { factor, minFactor } = getRadialShapeFactor(
		shape,
		angle,
		radialAngle,
		sharpness
	);
	if (minimumSafeRadius <= 0) return baseRadius * factor;

	const inflation = Math.min(
		1 / Math.max(minFactor, 1e-4),
		MAX_LOGO_FIT_INFLATION
	);
	const effectiveBaseRadius = Math.max(
		baseRadius,
		minimumSafeRadius * inflation
	);
	// Final guard: even if the cap bit (it should not — every shape is authored
	// with minFactor above 1/MAX_LOGO_FIT_INFLATION), nothing may enter the logo.
	return Math.max(effectiveBaseRadius * factor, minimumSafeRadius);
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
	minimumSafeRadius = 0,
	sharpness = 0
): number {
	return getRadialBaseRadius(
		shape,
		nominalRadius,
		angle,
		radialAngleRad,
		minimumSafeRadius,
		sharpness
	);
}

type RadialContourOptions = {
	segments?: number;
	phase?: number;
	minimumSafeRadius?: number;
	sharpness?: number;
};

export function traceRadialShapeContour(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	shape: SpectrumRadialShape,
	nominalRadius: number,
	radialAngleRad: number,
	options?: RadialContourOptions
): void {
	const segments = options?.segments ?? RADIAL_SHAPE_SEGMENTS;
	const phase = options?.phase ?? RADIAL_SHAPE_SAMPLE_PHASE;
	const minimumSafeRadius = options?.minimumSafeRadius ?? 0;
	const sharpness = options?.sharpness ?? 0;

	for (let i = 0; i <= segments; i++) {
		const angle = phase + (i / segments) * Math.PI * 2;
		const r = getShapedRadiusAtAngle(
			shape,
			nominalRadius,
			angle,
			radialAngleRad,
			minimumSafeRadius,
			sharpness
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
	options?: RadialContourOptions
): void {
	const segments = options?.segments ?? RADIAL_SHAPE_SEGMENTS;
	const phase = options?.phase ?? RADIAL_SHAPE_SAMPLE_PHASE;
	const minimumSafeRadius = options?.minimumSafeRadius ?? 0;
	const sharpness = options?.sharpness ?? 0;

	for (let i = 0; i <= segments; i++) {
		const angle = phase + (i / segments) * Math.PI * 2;
		const r = getShapedRadiusAtAngle(
			shape,
			outerRadius,
			angle,
			radialAngleRad,
			minimumSafeRadius,
			sharpness
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
			radialAngleRad,
			minimumSafeRadius,
			sharpness
		);
		const x = cx + Math.cos(angle) * r;
		const y = cy + Math.sin(angle) * r;
		if (i === segments) ctx.lineTo(x, y);
		else ctx.lineTo(x, y);
	}

	ctx.closePath();
}
