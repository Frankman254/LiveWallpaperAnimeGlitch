import type { ReactNode } from 'react';
import { FONT, UI_COLORS } from '@/ui';

type FieldLabelProps = {
	children: ReactNode;
	tooltip?: string;
	className?: string;
};

export default function FieldLabel({
	children,
	tooltip,
	className = ''
}: FieldLabelProps) {
	return (
		<span
			className={`select-none cursor-default uppercase ${className}`}
			style={{
				color: UI_COLORS.fgMute,
				fontFamily: FONT.mono,
				fontSize: 10,
				fontWeight: 650,
				letterSpacing: '0.1em'
			}}
			title={tooltip}
		>
			{children}
		</span>
	);
}
