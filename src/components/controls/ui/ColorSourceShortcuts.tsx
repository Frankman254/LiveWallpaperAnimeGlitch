import type { ColorSourceMode } from '@/types/wallpaper';
import { useT } from '@/lib/i18n';

const ORDER: ColorSourceMode[] = ['manual', 'theme', 'image'];

type Props = {
	/** Current shared value, or `null` when sub-sources are mixed. */
	value: ColorSourceMode | null;
	onChange: (value: ColorSourceMode) => void;
	/** Optional label rendered above the row. */
	label?: string;
	/** Optional helper text shown below. */
	hint?: string;
	/**
	 * `compact` shrinks paddings/typography for HUD usage; default rows are
	 * sized for the editor panel.
	 */
	compact?: boolean;
};

/**
 * Triadic Manual / Theme / Current Image picker. Used both in tab headers
 * (per-feature scope) and in the HUD (per-feature shortcuts + global). Wire
 * `onChange` to the appropriate bulk action exposed by `systemSlice`
 * (`setSpectrumColorSources`, `syncAllColorSources`, …) so the same component
 * can drive any scope.
 */
export default function ColorSourceShortcuts({
	value,
	onChange,
	label,
	hint,
	compact = false
}: Props) {
	const t = useT();
	const sourceLabels: Record<ColorSourceMode, string> = {
		manual: t.label_manual_color,
		theme: t.label_theme,
		image: t.label_current_image
	};
	const buttonClass = compact
		? 'flex-1 rounded border px-2 py-1 text-[10px] font-medium uppercase tracking-wide transition-colors'
		: 'flex-1 rounded border px-3 py-1.5 text-xs font-medium transition-colors';

	return (
		<div className="flex flex-col gap-1">
			{label ? (
				<div className="flex items-center justify-between gap-2">
					<span
						className={
							compact
								? 'text-[10px] uppercase tracking-wider'
								: 'text-xs'
						}
						style={{ color: 'var(--editor-accent-soft)' }}
					>
						{label}
					</span>
					<span
						className="text-[10px] uppercase tracking-wider"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						{value === null
							? t.label_mixed
							: sourceLabels[value]}
					</span>
				</div>
			) : null}
			<div className="flex gap-1">
				{ORDER.map(source => {
					const active = value === source;
					return (
						<button
							key={source}
							type="button"
							onClick={() => onChange(source)}
							className={buttonClass}
							style={
								active
									? {
											borderRadius:
												'var(--editor-radius-sm)',
											background:
												'var(--editor-active-bg)',
											borderColor:
												'var(--editor-accent-color)',
											color: 'var(--editor-active-fg)',
											boxShadow:
												'0 0 6px var(--editor-accent-color)'
										}
									: {
											borderRadius:
												'var(--editor-radius-sm)',
											background:
												'var(--editor-tag-bg)',
											borderColor:
												'var(--editor-tag-border)',
											color: 'var(--editor-tag-fg)'
										}
							}
						>
							{sourceLabels[source]}
						</button>
					);
				})}
			</div>
			{hint ? (
				<span
					className="text-[10px] leading-snug"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					{hint}
				</span>
			) : null}
		</div>
	);
}
