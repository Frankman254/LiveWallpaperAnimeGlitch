import type { ReactNode } from 'react';
import type { SpectrumRadialShape } from '@/types/wallpaper';
import { RADIAL_SHAPE_IDS } from './radialGeometry';
import ShapePreview from './ShapePreview';

/**
 * SVG icon per radial shape, derived from the same factor functions the
 * renderer uses. Pass directly as `labels` to
 * `EnumButtonGroup<SpectrumRadialShape>` to show real geometry instead of
 * text labels.
 *
 * Pass the live sharpness so the picker previews what will actually be drawn —
 * at high sharpness the silhouettes differ enough that unsharpened icons would
 * be picking a shape the render does not produce.
 *
 * Pair with `SPECTRUM_RADIAL_SHAPE_LABELS` to drive tooltips so users still
 * get the human-readable name on hover.
 */
export const buildRadialShapeIcons = (
	sharpness = 0
): Readonly<Record<SpectrumRadialShape, ReactNode>> =>
	Object.freeze(
		Object.fromEntries(
			RADIAL_SHAPE_IDS.map(id => [
				id,
				<ShapePreview key={id} shape={id} sharpness={sharpness} />
			])
		) as Record<SpectrumRadialShape, ReactNode>
	);
