import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { UI_COLORS, FONT, GLOW, ICON_SIZE } from './tokens';
import { transition } from './tokens/motion';
import { cn } from './lib/cn';

export type SliderVariant = 'compact' | 'normal' | 'macro';

type SliderProps = {
	value: number;
	onChange: (next: number) => void;
	min?: number;
	max?: number;
	step?: number;
	label?: ReactNode;
	unit?: string;
	hint?: ReactNode;
	variant?: SliderVariant;
	locked?: boolean;
	onReset?: () => void;
	defaultValue?: number;
	formatValue?: (v: number) => string;
	valueDisplay?: ReactNode;
	className?: string;
};

const VARIANT_SPEC: Record<
	SliderVariant,
	{
		trackH: number;
		thumb: number;
		valueFs: number;
		labelFs: number;
		gap: number;
	}
> = {
	compact: { trackH: 3, thumb: 10, valueFs: 10, labelFs: 11, gap: 6 },
	normal: { trackH: 4, thumb: 12, valueFs: 11, labelFs: 12, gap: 8 },
	macro: { trackH: 6, thumb: 18, valueFs: 22, labelFs: 11, gap: 10 }
};

export default function Slider({
	value,
	onChange,
	min = 0,
	max = 100,
	step = 1,
	label,
	unit,
	hint,
	variant = 'normal',
	locked = false,
	onReset,
	defaultValue,
	formatValue,
	valueDisplay,
	className
}: SliderProps) {
	const spec = VARIANT_SPEC[variant];
	const [hover, setHover] = useState(false);
	const [dragging, setDragging] = useState(false);
	const trackRef = useRef<HTMLDivElement | null>(null);
	const range = max - min;
	const pct = range === 0 ? 0 : ((value - min) / range) * 100;
	const display = formatValue
		? formatValue(value)
		: `${Number.isInteger(step) ? Math.round(value) : value}${unit ?? ''}`;
	const reset =
		onReset ??
		(defaultValue === undefined ? undefined : () => onChange(defaultValue));

	const updateFromX = useCallback(
		(clientX: number) => {
			const track = trackRef.current;
			if (!track) return;
			const rect = track.getBoundingClientRect();
			if (rect.width === 0) return;
			const ratio = Math.max(
				0,
				Math.min(1, (clientX - rect.left) / rect.width)
			);
			const raw = min + ratio * range;
			const snapped = Math.round(raw / step) * step;
			onChange(Math.max(min, Math.min(max, snapped)));
		},
		[min, max, range, step, onChange]
	);

	return (
		<div
			className={cn('flex flex-col', className)}
			style={{
				gap: spec.gap,
				padding:
					variant === 'macro'
						? '10px 0'
						: variant === 'compact'
							? '4px 0'
							: '5px 0'
			}}
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
		>
			{variant === 'macro' ? (
				<div className="flex items-end justify-between gap-3">
					<div className="min-w-0 flex flex-col gap-0.5">
						{label ? (
							<span
								className="uppercase tracking-widest"
								onClick={reset}
								style={{
									color: UI_COLORS.fgMute,
									cursor: reset ? 'pointer' : undefined,
									fontFamily: FONT.mono,
									fontSize: spec.labelFs,
									fontWeight: 600
								}}
							>
								{label}
							</span>
						) : null}
						{hint ? (
							<span
								style={{
									color: UI_COLORS.fgFaint,
									fontSize: 10
								}}
							>
								{hint}
							</span>
						) : null}
					</div>
					<span
						className="tabular-nums"
						style={{
							color: UI_COLORS.fg,
							fontFamily: FONT.mono,
							fontSize: spec.valueFs,
							fontWeight: 600,
							lineHeight: 1
						}}
					>
						{display}
					</span>
				</div>
			) : (
				<div className="flex items-center justify-between gap-2">
					<span
						className="inline-flex items-center gap-1.5"
						onClick={reset}
						style={{
							color: UI_COLORS.fg,
							cursor: reset ? 'pointer' : undefined,
							fontSize: spec.labelFs,
							fontWeight: 500
						}}
					>
						{label}
						{hint ? (
							<span
								style={{
									color: UI_COLORS.fgFaint,
									fontSize: 10
								}}
							>
								{hint}
							</span>
						) : null}
					</span>
					<div className="flex items-center gap-1.5">
						{hover && reset ? (
							<button
								type="button"
								onClick={reset}
								title="Reset to default"
								className="inline-flex items-center justify-center p-0.5"
								style={{
									background: 'transparent',
									border: 0,
									color: UI_COLORS.fgFaint,
									cursor: 'pointer'
								}}
							>
								<RotateCcw size={ICON_SIZE.xs} />
							</button>
						) : null}
						<span
							className="tabular-nums"
							style={{
								fontFamily: FONT.mono,
								fontSize: spec.valueFs,
								color: UI_COLORS.fg,
								background: UI_COLORS.overlay,
								padding: '2px 8px',
								borderRadius: 'var(--editor-radius-sm)',
								minWidth: 48,
								textAlign: 'right',
								border: `1px solid ${UI_COLORS.border}`
							}}
						>
							{valueDisplay ?? display}
						</span>
					</div>
				</div>
			)}
			<div
				ref={trackRef}
				onPointerDown={e => {
					if (locked) return;
					e.currentTarget.setPointerCapture(e.pointerId);
					setDragging(true);
					// Subtle haptic confirmation on touch devices (Android/iOS 16+).
					// Silent no-op on desktops and browsers without the API.
					if (
						typeof navigator !== 'undefined' &&
						typeof navigator.vibrate === 'function' &&
						e.pointerType !== 'mouse'
					) {
						navigator.vibrate(5);
					}
					updateFromX(e.clientX);
				}}
				onPointerMove={e => {
					if (dragging) updateFromX(e.clientX);
				}}
				onPointerUp={e => {
					setDragging(false);
					e.currentTarget.releasePointerCapture(e.pointerId);
				}}
				style={{
					position: 'relative',
					height: Math.max(22, spec.thumb + 8),
					// Lift the hit area to a 32px tap target on touch devices
					// (CSS `@media (pointer: coarse)`), keeps desktop slim.
					minHeight: 'var(--slider-min-hit-height, auto)',
					cursor: locked ? 'not-allowed' : 'pointer',
					opacity: locked ? 0.4 : 1,
					touchAction: 'none'
				}}
			>
				<div
					aria-hidden
					style={{
						position: 'absolute',
						top: '50%',
						left: 0,
						right: 0,
						transform: 'translateY(-50%)',
						height: spec.trackH,
						background: UI_COLORS.overlay,
						borderRadius: 999,
						overflow: 'hidden'
					}}
				>
					<div
						style={{
							height: '100%',
							width: `${pct}%`,
							background: UI_COLORS.accent,
							boxShadow: variant === 'macro' ? GLOW.md : GLOW.sm,
							transition: dragging
								? 'none'
								: transition('width', 'fast')
						}}
					/>
				</div>
				<div
					aria-hidden
					style={{
						position: 'absolute',
						top: '50%',
						left: `${pct}%`,
						transform: 'translate(-50%, -50%)',
						width: spec.thumb,
						height: spec.thumb,
						borderRadius: '50%',
						background: UI_COLORS.thumb,
						border: `2px solid ${UI_COLORS.accent}`,
						boxShadow: hover || dragging ? GLOW.ring : 'none',
						transition: dragging
							? 'none'
							: transition('box-shadow, left', 'fast')
					}}
				/>
			</div>
		</div>
	);
}
