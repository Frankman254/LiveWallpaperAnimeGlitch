import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { UI_COLORS, FONT, ICON_SIZE } from './tokens';
import { transition } from './tokens/motion';
import { cn } from './lib/cn';

type CollapsibleSectionProps = {
	title: ReactNode;
	badge?: ReactNode;
	defaultOpen?: boolean;
	dense?: boolean;
	className?: string;
	children: ReactNode;
};

export default function CollapsibleSection({
	title,
	badge,
	defaultOpen = false,
	dense = false,
	className,
	children
}: CollapsibleSectionProps) {
	const [open, setOpen] = useState(defaultOpen);
	const contentRef = useRef<HTMLDivElement | null>(null);
	const [contentHeight, setContentHeight] = useState<number>(0);
	const [animating, setAnimating] = useState(false);

	// Measure the children's natural height with a ResizeObserver so the
	// max-height animation always targets the current content size, even
	// when children re-render with new dimensions.
	useEffect(() => {
		const node = contentRef.current;
		if (!node || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(entries => {
			for (const entry of entries) {
				const next = entry.contentRect.height;
				setContentHeight(prev =>
					Math.abs(prev - next) < 0.5 ? prev : next
				);
			}
		});
		observer.observe(node);
		setContentHeight(node.scrollHeight);
		return () => observer.disconnect();
	}, []);

	// Flag during the transition so we can hold `overflow: hidden`; once
	// open animation finishes we drop it so popovers / focus rings inside
	// the section can paint outside the row.
	useEffect(() => {
		if (!open) {
			setAnimating(true);
			return undefined;
		}
		setAnimating(true);
		const id = window.setTimeout(() => setAnimating(false), 260);
		return () => window.clearTimeout(id);
	}, [open]);

	return (
		<div
			className={cn(className)}
			style={{ borderTop: `1px solid ${UI_COLORS.hairline}` }}
		>
			<button
				type="button"
				onClick={() => setOpen(o => !o)}
				aria-expanded={open}
				className="inline-flex w-full items-center justify-between"
				style={{
					padding: dense ? '8px 16px' : '12px 16px',
					background: 'transparent',
					border: 0,
					cursor: 'pointer',
					color: UI_COLORS.fgMute,
					fontSize: 11,
					fontWeight: 600,
					letterSpacing: '0.08em',
					textTransform: 'uppercase',
					fontFamily: FONT.mono
				}}
			>
				<span className="inline-flex items-center gap-2">
					<ChevronRight
						size={ICON_SIZE.xs}
						style={{
							transform: open ? 'rotate(90deg)' : 'none',
							transition: transition('transform')
						}}
					/>
					{title}
					{badge ? (
						<span
							style={{
								fontSize: 9,
								padding: '2px 6px',
								borderRadius: 999,
								background: UI_COLORS.accentSoft,
								color: UI_COLORS.accent,
								border: `1px solid ${UI_COLORS.accentBorder}`,
								letterSpacing: '0.1em'
							}}
						>
							{badge}
						</span>
					) : null}
				</span>
			</button>
			<div
				aria-hidden={!open}
				style={{
					maxHeight: open ? contentHeight : 0,
					opacity: open ? 1 : 0,
					overflow: open && !animating ? 'visible' : 'hidden',
					transition: transition('max-height, opacity', 'base')
				}}
			>
				<div ref={contentRef} style={{ padding: '0 16px 16px' }}>
					{children}
				</div>
			</div>
		</div>
	);
}
