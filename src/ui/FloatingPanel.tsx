import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { UI_COLORS, BLUR, GLOW, Z_INDEX } from './tokens';
import { transition } from './tokens/motion';
import { cn } from './lib/cn';

type FloatingPanelProps = {
	open: boolean;
	onClose: () => void;
	anchor?: 'top' | 'bottom' | 'left' | 'right';
	offset?: number;
	closeOnOutsideClick?: boolean;
	closeOnEscape?: boolean;
	zIndex?: number;
	className?: string;
	style?: CSSProperties;
	children: ReactNode;
};

const ANCHOR_POS: Record<NonNullable<FloatingPanelProps['anchor']>, CSSProperties> = {
	top: { bottom: '100%', left: 0, right: 0 },
	bottom: { top: '100%', left: 0, right: 0 },
	left: { right: '100%', top: 0, bottom: 0 },
	right: { left: '100%', top: 0, bottom: 0 }
};

export default function FloatingPanel({
	open,
	onClose,
	anchor = 'bottom',
	offset = 6,
	closeOnOutsideClick = true,
	closeOnEscape = true,
	zIndex = Z_INDEX.popover,
	className,
	style,
	children
}: FloatingPanelProps) {
	const ref = useRef<HTMLDivElement | null>(null);
	const [entered, setEntered] = useState(false);

	useEffect(() => {
		if (open) {
			// Defer one rAF so initial paint happens with opacity:0 + scale<1,
			// then the next paint flips to the final state and the CSS
			// transition can interpolate. Otherwise the panel snaps in.
			const id = requestAnimationFrame(() => setEntered(true));
			return () => cancelAnimationFrame(id);
		}
		setEntered(false);
		return undefined;
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const handlePointer = (event: PointerEvent) => {
			if (!closeOnOutsideClick) return;
			if (!ref.current) return;
			if (ref.current.contains(event.target as Node)) return;
			onClose();
		};
		const handleKey = (event: KeyboardEvent) => {
			if (!closeOnEscape) return;
			if (event.key === 'Escape') onClose();
		};
		window.addEventListener('pointerdown', handlePointer);
		window.addEventListener('keydown', handleKey);
		return () => {
			window.removeEventListener('pointerdown', handlePointer);
			window.removeEventListener('keydown', handleKey);
		};
	}, [open, closeOnOutsideClick, closeOnEscape, onClose]);

	if (!open) return null;

	const offsetStyle: CSSProperties = {};
	if (anchor === 'top') offsetStyle.marginBottom = offset;
	if (anchor === 'bottom') offsetStyle.marginTop = offset;
	if (anchor === 'left') offsetStyle.marginRight = offset;
	if (anchor === 'right') offsetStyle.marginLeft = offset;

	return (
		<div
			ref={ref}
			role="dialog"
			className={cn('absolute', className)}
			style={{
				...ANCHOR_POS[anchor],
				...offsetStyle,
				zIndex,
				background: UI_COLORS.shell,
				border: `1px solid ${UI_COLORS.borderStrong}`,
				borderRadius: 'var(--editor-radius-lg)',
				backdropFilter: BLUR.heavy,
				WebkitBackdropFilter: BLUR.heavy,
				boxShadow: GLOW.popover,
				opacity: entered ? 1 : 0,
				transform: entered ? 'translateY(0) scale(1)' : 'translateY(-4px) scale(0.97)',
				transformOrigin: 'top center',
				transition: transition('opacity, transform', 'fast'),
				...style
			}}
		>
			{children}
		</div>
	);
}
