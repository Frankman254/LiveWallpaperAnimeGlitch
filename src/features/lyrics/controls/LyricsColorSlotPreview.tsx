import { useId } from 'react';
import {
	resolveLyricsColorStopOffsets,
	resolveLyricsColorStops
} from '@/features/lyrics/domain/lyricsColorModes';
import type { ResolvedLyricsColorSlot } from '@/features/lyrics/domain/lyricsColorModes';

/**
 * Which part of a lyric line a color slot paints.
 *
 * The color controls are named after the paint (Fill, Stroke, Glow, Backdrop),
 * but until now a user had to open the wallpaper to learn which part of the
 * text each one actually touches. This preview draws the SAME resolved slot
 * the canvas draws — same resolver, same stop distribution — on a mock glyph,
 * so the part→control mapping is visible right next to the pickers.
 *
 * The animated modes (`visible-rotate`, `complete-rotate`) are shown at phase
 * 0: a static legend cannot follow the clock, and the canvas itself re-bakes
 * its lines per quantized step for the same reason.
 */
export type LyricsSlotPreviewRole = 'fill' | 'stroke' | 'glow' | 'backdrop';

const W = 160;
const H = 44;
/** Panel-dark; glow and backdrop need a dark stage to read correctly. */
const PANEL = '#0b0b10';
/** Neutral lyric ink used whenever a slot other than `fill` is on display. */
const INK = '#f9fafb';

const GLYPH = {
	x: W / 2,
	y: 31,
	textAnchor: 'middle' as const,
	fontSize: 26,
	fontWeight: 700,
	fontFamily: 'system-ui, sans-serif'
};

export default function LyricsColorSlotPreview({
	role,
	resolved,
	title
}: {
	role: LyricsSlotPreviewRole;
	resolved: ResolvedLyricsColorSlot;
	title: string;
}) {
	const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
	const stops = resolveLyricsColorStops(resolved);
	// A single stop is a plain color; multiple stops become a horizontal
	// gradient, mirroring `createLyricsHorizontalPaint`'s left..right span.
	const solid = stops.length === 1 ? stops[0] : undefined;
	const gid = `lcp-${uid}`;
	const paint = solid ?? `url(#${gid})`;

	return (
		<svg
			viewBox={`0 0 ${W} ${H}`}
			role="img"
			aria-label={title}
			style={{
				width: '100%',
				maxWidth: W,
				height: 'auto',
				display: 'block'
			}}
		>
			<title>{title}</title>
			<defs>
				{solid ? null : (
					<linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
						{resolveLyricsColorStopOffsets(stops).map(
							([offset, color]) => (
								<stop
									key={`${offset}-${color}`}
									offset={offset}
									stopColor={color}
								/>
							)
						)}
					</linearGradient>
				)}
				{role === 'glow' ? (
					<filter
						id={`${gid}-blur`}
						x="-40%"
						y="-40%"
						width="180%"
						height="180%"
					>
						<feGaussianBlur stdDeviation="3" />
					</filter>
				) : null}
			</defs>
			<rect x="0" y="0" width={W} height={H} rx="6" fill={PANEL} />
			{role === 'backdrop' ? (
				<rect
					x="10"
					y="6"
					width={W - 20}
					height={H - 12}
					rx="8"
					fill={paint}
				/>
			) : null}
			{role === 'glow' ? (
				<text
					{...GLYPH}
					fill={stops[0]}
					stroke={stops[0]}
					strokeWidth="6"
					filter={`url(#${gid}-blur)`}
				>
					Aa
				</text>
			) : null}
			{role === 'fill' ? (
				<text {...GLYPH} fill={paint} stroke={PANEL} strokeWidth="1">
					Aa
				</text>
			) : role === 'stroke' ? (
				<text
					{...GLYPH}
					fill="#6b7280"
					stroke={paint}
					strokeWidth="3"
					paintOrder="stroke"
				>
					Aa
				</text>
			) : (
				<text {...GLYPH} fill={INK}>
					Aa
				</text>
			)}
		</svg>
	);
}
