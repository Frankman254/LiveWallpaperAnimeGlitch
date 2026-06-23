import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n';
import {
	cellToLogoPosition,
	logoPositionToCell,
	resolveLogoGridDims
} from '@/features/logo/logoPositionGrid';

function readAspectRatio(): number {
	if (typeof window === 'undefined') return 16 / 9;
	const h = window.innerHeight || 1;
	return (window.innerWidth || 16) / h;
}

/**
 * HUD logo position picker: a matrix of cells that mirrors the canvas aspect.
 * One tap snaps the logo to that cell's center via the same `logoPositionX/Y`
 * state the Logo tab edits — reactivity, size, and presets are untouched.
 */
export default function QuickActionsLogoPositionGrid({
	logoPositionX,
	logoPositionY,
	setLogoPositionX,
	setLogoPositionY,
	isRainbow
}: {
	logoPositionX: number;
	logoPositionY: number;
	setLogoPositionX: (value: number) => void;
	setLogoPositionY: (value: number) => void;
	isRainbow: boolean;
}) {
	const t = useT();
	const [aspect, setAspect] = useState(readAspectRatio);

	useEffect(() => {
		const onResize = () => setAspect(readAspectRatio());
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	const dims = resolveLogoGridDims(aspect);
	const activeCell = logoPositionToCell(
		{ x: logoPositionX, y: logoPositionY },
		dims
	);

	return (
		<div className="flex flex-col gap-1.5">
			<span
				className="text-[9px] font-bold uppercase tracking-wider"
				style={{
					color: isRainbow ? '#08080e' : 'var(--editor-accent-muted)'
				}}
			>
				{t.qa_logo_position}
			</span>
			<div
				className="grid w-fit gap-1"
				style={{
					gridTemplateColumns: `repeat(${dims.cols}, 1.4rem)`,
					gridAutoRows: '1.4rem'
				}}
			>
				{Array.from({ length: dims.rows }).map((_, row) =>
					Array.from({ length: dims.cols }).map((__, col) => {
						const active =
							activeCell.col === col && activeCell.row === row;
						return (
							<button
								key={`${row}-${col}`}
								type="button"
								aria-label={`${t.qa_logo_position} ${col + 1},${row + 1}`}
								title={t.qa_logo_position_t}
								onClick={() => {
									const next = cellToLogoPosition(
										{ col, row },
										dims
									);
									setLogoPositionX(next.x);
									setLogoPositionY(next.y);
								}}
								className="h-full w-full border transition-all duration-150 hover:-translate-y-0.5"
								style={{
									borderRadius: 'var(--editor-radius-sm)',
									borderColor: active
										? 'var(--editor-accent-color)'
										: 'var(--editor-accent-border)',
									background: active
										? 'var(--editor-accent-color)'
										: 'color-mix(in srgb, var(--editor-button-bg) 70%, transparent)',
									boxShadow: active
										? '0 0 0 1px color-mix(in srgb, var(--editor-accent-color) 55%, transparent)'
										: 'none'
								}}
							/>
						);
					})
				)}
			</div>
		</div>
	);
}
