import type { CSSProperties, ReactNode } from 'react';
import { FONT, UI_COLORS, TYPE } from './tokens';
import { cn } from './lib/cn';

type FieldLabelProps = {
	children: ReactNode;
	tooltip?: string;
	className?: string;
	style?: CSSProperties;
};

export default function FieldLabel({
	children,
	tooltip,
	className,
	style
}: FieldLabelProps) {
	return (
		<span
			className={cn('select-none cursor-default uppercase', className)}
			style={{
				color: UI_COLORS.fgMute,
				fontFamily: FONT.mono,
				fontSize: TYPE.caption,
				fontWeight: 650,
				letterSpacing: '0.1em',
				...style
			}}
			title={tooltip}
		>
			{children}
		</span>
	);
}
