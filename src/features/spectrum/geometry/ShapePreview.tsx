import { useMemo } from 'react';
import type { SpectrumRadialShape } from '@/types/wallpaper';
import {
	getRadialShapeDefinition,
	RADIAL_SHAPE_SAMPLE_PHASE
} from './radialGeometry';

/**
 * ShapePreview — renders any registered radial shape as an inline SVG by
 * sampling its `factor(angle)` function. Lets the picker show real geometry
 * instead of text labels without manually authoring one SVG per shape, and
 * stays in sync automatically when factors change.
 *
 * Keeps a small padding inside the viewBox so flower / spike shapes don't
 * clip at their max radius.
 */
type ShapePreviewProps = {
	shape: SpectrumRadialShape;
	size?: number;
	segments?: number;
	strokeWidth?: number;
	className?: string;
};

const VIEWBOX_RADIUS = 50;
const VIEWBOX_PADDING = 4;

export default function ShapePreview({
	shape,
	size = 18,
	segments = 96,
	strokeWidth = 0,
	className
}: ShapePreviewProps) {
	const points = useMemo(() => {
		const def = getRadialShapeDefinition(shape);
		// Find the actual peak factor so we can normalize the rendered shape
		// to fill the viewBox — `factor` is already in [0..~1] but some
		// definitions never reach 1 (e.g. squircle minFactor is ~0.84). Without
		// this rescale the preview would look smaller than the others in the
		// picker, which breaks visual comparison.
		let peak = 0;
		const raws: { factor: number; angle: number }[] = [];
		for (let i = 0; i < segments; i++) {
			const angle =
				RADIAL_SHAPE_SAMPLE_PHASE + (i / segments) * Math.PI * 2;
			const { factor } = def.factor(angle);
			peak = Math.max(peak, factor);
			raws.push({ factor, angle });
		}
		const scale = peak > 0 ? (VIEWBOX_RADIUS - VIEWBOX_PADDING) / peak : 1;
		const cx = VIEWBOX_RADIUS;
		const cy = VIEWBOX_RADIUS;
		return raws
			.map(({ factor, angle }) => {
				const r = factor * scale;
				const x = cx + Math.cos(angle) * r;
				const y = cy + Math.sin(angle) * r;
				return `${x.toFixed(2)},${y.toFixed(2)}`;
			})
			.join(' ');
	}, [shape, segments]);

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
