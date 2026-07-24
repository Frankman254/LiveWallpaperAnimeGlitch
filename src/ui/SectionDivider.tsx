import { FONT, UI_COLORS, TYPE } from './tokens';

type SectionDividerProps = {
	label?: string;
};

export default function SectionDivider({ label }: SectionDividerProps) {
	return (
		<div className="my-2 flex items-center gap-2.5">
			<div
				className="h-px flex-1"
				style={{
					background: `linear-gradient(90deg, transparent, ${UI_COLORS.accentBorder}, transparent)`
				}}
			/>
			{label ? (
				<span
					className="whitespace-nowrap border px-2 py-0.5 uppercase"
					style={{
						borderRadius: 'var(--editor-radius-md)',
						color: UI_COLORS.fgMute,
						borderColor: UI_COLORS.border,
						background: UI_COLORS.panel,
						fontFamily: FONT.mono,
						fontSize: TYPE.caption,
						fontWeight: 650,
						letterSpacing: '0.2em'
					}}
				>
					{label}
				</span>
			) : null}
			<div
				className="h-px flex-1"
				style={{
					background: `linear-gradient(90deg, transparent, ${UI_COLORS.accentBorder}, transparent)`
				}}
			/>
		</div>
	);
}
