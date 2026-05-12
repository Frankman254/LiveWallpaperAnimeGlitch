import type { ColorSourceMode } from '@/types/wallpaper';
import { useT } from '@/lib/i18n';
import { FONT, SegmentedControl, UI_COLORS } from '@/ui';

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

	return (
		<div className="flex flex-col gap-1">
			{label ? (
				<div className="flex items-center justify-between gap-2">
					<span
						className="uppercase"
						style={{
							color: UI_COLORS.fgMute,
							fontFamily: FONT.mono,
							fontSize: compact ? 9 : 10,
							fontWeight: 650,
							letterSpacing: '0.1em'
						}}
					>
						{label}
					</span>
					<span
						className="text-[10px] uppercase tracking-wider"
						style={{
							color: UI_COLORS.fgFaint,
							fontFamily: FONT.mono
						}}
					>
						{value === null
							? t.label_mixed
							: sourceLabels[value]}
					</span>
				</div>
			) : null}
			<SegmentedControl<ColorSourceMode>
				value={value}
				onChange={onChange}
				options={ORDER.map(source => ({
					value: source,
					label: sourceLabels[source]
				}))}
				size={compact ? 'sm' : 'md'}
				density="compact"
				full
				ariaLabel={label ?? t.label_color_source}
			/>
			{hint ? (
				<span
					className="text-[10px] leading-snug"
					style={{ color: UI_COLORS.fgMute }}
				>
					{hint}
				</span>
			) : null}
		</div>
	);
}
