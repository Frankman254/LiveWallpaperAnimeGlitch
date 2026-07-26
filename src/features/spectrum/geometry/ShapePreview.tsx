import { useMemo } from 'react';
import type { SpectrumRadialShape } from '@/types/wallpaper';
import {
	applyRadialSharpness,
	getRadialShapeDefinition,
	RADIAL_SHAPE_SAMPLE_PHASE
} from './radialGeometry';

/**
 * ShapePreview — renders any registered radial shape as an inline SVG by
 * sampling its `factor(angle)` function. Lets the picker show real geometry
 * instead of text labels without manually authoring one SVG per shape, and
 * stays in sync automatically when factors change.
 *
 * Deliberately does NOT rescale what it samples. It used to hunt for each
 * shape's peak and stretch it to fill the box, which made the picker lie: a
 * shape that rendered at 76% of the requested radius still looked full-size
 * here. Peaks are normalized in the registry now, so sampling straight through
 * is both simpler and honest.
 *
 * Keeps a small padding inside the viewBox so stroked previews don't clip.
 */
type ShapePreviewProps = {
	shape: SpectrumRadialShape;
	size?: number;
	segments?: number;
	strokeWidth?: number;
	/** Mirrors the live "sharp points" setting so the picker matches the render. */
	sharpness?: number;
	className?: string;
};

const VIEWBOX_RADIUS = 50;
const VIEWBOX_PADDING = 4;

export default function ShapePreview({
	shape,
	size = 18,
	segments = 96,
	strokeWidth = 0,
	sharpness = 0,
	className
}: ShapePreviewProps) {
	const points = useMemo(() => {
		const def = getRadialShapeDefinition(shape);
		const scale = VIEWBOX_RADIUS - VIEWBOX_PADDING;
		const cx = VIEWBOX_RADIUS;
		const cy = VIEWBOX_RADIUS;
		const coords: string[] = [];
		for (let i = 0; i < segments; i++) {
			const angle =
				RADIAL_SHAPE_SAMPLE_PHASE + (i / segments) * Math.PI * 2;
			const { factor, minFactor } = def.factor(angle);
			const r =
				applyRadialSharpness(factor, minFactor, sharpness) * scale;
			const x = cx + Math.cos(angle) * r;
			const y = cy + Math.sin(angle) * r;
			coords.push(`${x.toFixed(2)},${y.toFixed(2)}`);
		}
		return coords.join(' ');
	}, [shape, segments, sharpness]);

	const filled = strokeWidth === 0;
	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${VIEWBOX_RADIUS * 2} ${VIEWBOX_RADIUS * 2}`}
			className={className}
			aria-hidden
			focusable={false}
		>
			<polygon
				points={points}
				fill={filled ? 'currentColor' : 'none'}
				stroke={filled ? 'none' : 'currentColor'}
				strokeWidth={strokeWidth}
				strokeLinejoin="round"
				strokeLinecap="round"
			/>
		</svg>
	);
}
