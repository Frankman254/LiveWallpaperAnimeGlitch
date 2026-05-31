import type { ReactNode } from 'react';
import type { SpectrumRadialShape } from '@/types/wallpaper';
import {
	RADIAL_SHAPE_IDS,
	RADIAL_SHAPE_LABELS
} from './radialGeometry';
import ShapePreview from './ShapePreview';

/**
 * Precomputed SVG icon per radial shape, derived from the same factor
 * functions the renderer uses. Pass directly as `labels` to
 * `EnumButtonGroup<SpectrumRadialShape>` to show real geometry instead of
 * text labels.
 *
 * Pair with `SPECTRUM_RADIAL_SHAPE_LABELS` to drive tooltips so users still
 * get the human-readable name on hover.
 */
export const SPECTRUM_RADIAL_SHAPE_ICONS: Readonly<
	Record<SpectrumRadialShape, ReactNode>
> = Object.freeze(
	Object.fromEntries(
		RADIAL_SHAPE_IDS.map(id => [id, <ShapePreview key={id} shape={id} />])
	) as Record<SpectrumRadialShape, ReactNode>
);

/** Same data as `SPECTRUM_RADIAL_SHAPE_LABELS`, re-exported here for convenience. */
export const SPECTRUM_RADIAL_SHAPE_TOOLTIPS = RADIAL_SHAPE_LABELS;
