import { Button, UI_COLORS } from '@/ui';
import BgPreciseSliderControl from './BgPreciseSliderControl';

export default function FocusQuickControls({
	t,
	focusX,
	focusY,
	onCenterFocus,
	onChangeFocusPoint
}: {
	t: Record<string, string>;
	focusX: number | null;
	focusY: number | null;
	onCenterFocus: () => void;
	onChangeFocusPoint: (x: number | null, y: number | null) => void;
}) {
	return (
		<div
			className="flex flex-col gap-2 rounded-(--editor-radius-md) border px-2 py-2"
			style={{
				borderColor: UI_COLORS.border,
				background: 'rgba(0,0,0,0.12)'
			}}
		>
			<div className="flex items-center justify-between gap-2">
				<span
					className="text-[11px] font-semibold uppercase tracking-widest"
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					Focus
				</span>
				<Button
					onClick={onCenterFocus}
					size="sm"
					density="compact"
					variant="secondary"
					title={t.hint_image_focus_point}
				>
					{t.label_center_focus}
				</Button>
			</div>
			<div className="grid gap-2 sm:grid-cols-2">
				<BgPreciseSliderControl
					label="Focus X"
					value={focusX ?? 0.5}
					range={{ min: 0, max: 1, step: 0.01 }}
					onChange={value =>
						onChangeFocusPoint(value, focusY ?? 0.5)
					}
					resetValue={0.5}
				/>
				<BgPreciseSliderControl
					label="Focus Y"
					value={focusY ?? 0.5}
					range={{ min: 0, max: 1, step: 0.01 }}
					onChange={value =>
						onChangeFocusPoint(focusX ?? 0.5, value)
					}
					resetValue={0.5}
				/>
			</div>
		</div>
	);
}
