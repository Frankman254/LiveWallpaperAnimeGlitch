import { AdvancedOnly } from '@/components/controls/UIMode';
import { useDialog } from '@/components/controls/ui/DialogProvider';
import { IMAGE_RANGES, GLOBAL_FILTER_RANGES } from '@/config/ranges';
import BgFitModeSelector from './BgFitModeSelector';
import BgSectionCard from './BgSectionCard';
import BgPreciseSliderControl from './BgPreciseSliderControl';
import type { ImageFitMode } from '@/types/wallpaper';
import type { SliderRange } from '@/types/controls';
import { Button, Slider, ToggleSwitch, UI_COLORS, FONT } from '@/ui';

function formatDecimal(value: number): string {
	return value.toFixed(2);
}

function formatInteger(value: number): string {
	return Math.round(value).toString();
}

export default function GlobalBackgroundSection({
	t,
	globalBackgroundId,
	globalBackgroundUrl,
	globalBackgroundEnabled,
	globalBackgroundFitMode,
	globalBackgroundScale,
	globalBackgroundPositionX,
	globalBackgroundPositionY,
	globalBackgroundPositionXRange,
	globalBackgroundPositionYRange,
	globalBackgroundOpacity,
	globalBackgroundBrightness,
	globalBackgroundContrast,
	globalBackgroundSaturation,
	globalBackgroundBlur,
	globalBackgroundHueRotate,
	onUploadClick,
	onRemove,
	onToggleEnabled,
	onChangeFitMode,
	onChangeScale,
	onChangePositionX,
	onChangePositionY,
	onChangeOpacity,
	onChangeBrightness,
	onChangeContrast,
	onChangeSaturation,
	onChangeBlur,
	onChangeHueRotate
}: {
	t: Record<string, string>;
	globalBackgroundId: string | null;
	globalBackgroundUrl: string | null;
	globalBackgroundEnabled: boolean;
	globalBackgroundFitMode: ImageFitMode;
	globalBackgroundScale: number;
	globalBackgroundPositionX: number;
	globalBackgroundPositionY: number;
	globalBackgroundPositionXRange: SliderRange;
	globalBackgroundPositionYRange: SliderRange;
	globalBackgroundOpacity: number;
	globalBackgroundBrightness: number;
	globalBackgroundContrast: number;
	globalBackgroundSaturation: number;
	globalBackgroundBlur: number;
	globalBackgroundHueRotate: number;
	onUploadClick: () => void;
	onRemove: () => void;
	onToggleEnabled: (value: boolean) => void;
	onChangeFitMode: (value: ImageFitMode) => void;
	onChangeScale: (value: number) => void;
	onChangePositionX: (value: number) => void;
	onChangePositionY: (value: number) => void;
	onChangeOpacity: (value: number) => void;
	onChangeBrightness: (value: number) => void;
	onChangeContrast: (value: number) => void;
	onChangeSaturation: (value: number) => void;
	onChangeBlur: (value: number) => void;
	onChangeHueRotate: (value: number) => void;
}) {
	const { confirm } = useDialog();
	async function handleRemove() {
		const ok = await confirm({
			title: 'Remove global background?',
			message:
				'This unsets the global background image. The image file itself is not deleted, but the editor loses the reference and you will need to re-pick it from disk.',
			confirmLabel: 'Remove',
			cancelLabel: t.label_cancel ?? 'Cancel',
			tone: 'danger'
		});
		if (!ok) return;
		onRemove();
	}
	return (
		<BgSectionCard
			title={t.label_global_background_image}
			hint={t.hint_global_background}
		>
			<div
				className="flex items-center justify-between gap-3 rounded-[var(--editor-radius-md)] border px-3 py-2"
				style={{
					borderColor: UI_COLORS.border,
					background: UI_COLORS.raised
				}}
			>
				<span
					className="text-[12px] font-medium"
					style={{ color: UI_COLORS.fg }}
				>
					{t.label_enabled}
				</span>
				<ToggleSwitch
					checked={globalBackgroundEnabled}
					onChange={onToggleEnabled}
					size="sm"
					ariaLabel={t.label_enabled}
				/>
			</div>

			{globalBackgroundEnabled && (
				<>
					<div className="flex gap-2">
						<Button
							onClick={onUploadClick}
							size="sm"
							density="compact"
							variant="primary"
							full
						>
							{t.upload_images}
						</Button>
						{globalBackgroundId && (
							<Button
								onClick={() => void handleRemove()}
								size="sm"
								density="compact"
								variant="destructive"
								title="Remove (with confirmation)"
							>
								{t.remove_global_background}
							</Button>
						)}
					</div>

					{globalBackgroundUrl && (
						<>
							<div
								className="w-full overflow-hidden rounded border"
								style={{
									borderColor: 'var(--editor-accent-border)',
									background: 'var(--editor-surface-bg)'
								}}
							>
								<img
									src={globalBackgroundUrl}
									alt=""
									className="h-20 w-full object-cover"
								/>
							</div>

							<BgFitModeSelector
								label={t.label_fit_mode}
								value={globalBackgroundFitMode}
								onChange={onChangeFitMode}
							/>

							<BgPreciseSliderControl
								label={t.label_scale}
								value={globalBackgroundScale}
								range={IMAGE_RANGES.scale}
								onChange={onChangeScale}
								resetValue={1}
								mode="log"
							/>
							<BgPreciseSliderControl
								label={t.label_position_x}
								value={globalBackgroundPositionX}
								range={globalBackgroundPositionXRange}
								onChange={onChangePositionX}
								resetValue={0}
							/>
							<BgPreciseSliderControl
								label={t.label_position_y}
								value={globalBackgroundPositionY}
								range={globalBackgroundPositionYRange}
								onChange={onChangePositionY}
								resetValue={0}
							/>
							<BgPreciseSliderControl
								label={t.label_global_background_opacity}
								value={globalBackgroundOpacity}
								range={IMAGE_RANGES.opacity}
								onChange={onChangeOpacity}
								resetValue={1}
							/>

							<AdvancedOnly>
							<div
								className="border-t pt-2"
								style={{ borderColor: UI_COLORS.hairline }}
							>
								<div
									className="mb-1 text-[10px] uppercase tracking-[0.12em]"
									style={{
										color: UI_COLORS.fgMute,
										fontFamily: FONT.mono
									}}
								>
									{t.tab_filters}
								</div>
								<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
									<Slider
										label={t.label_brightness}
										value={globalBackgroundBrightness}
										{...GLOBAL_FILTER_RANGES.brightness}
										onChange={onChangeBrightness}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={t.label_contrast}
										value={globalBackgroundContrast}
										{...GLOBAL_FILTER_RANGES.contrast}
										onChange={onChangeContrast}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={t.label_saturation}
										value={globalBackgroundSaturation}
										{...GLOBAL_FILTER_RANGES.saturation}
										onChange={onChangeSaturation}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={t.label_blur}
										value={globalBackgroundBlur}
										{...GLOBAL_FILTER_RANGES.blur}
										unit="px"
										onChange={onChangeBlur}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={t.label_hue_rotate}
										value={globalBackgroundHueRotate}
										{...GLOBAL_FILTER_RANGES.hueRotate}
										unit="deg"
										onChange={onChangeHueRotate}
										variant="compact"
										formatValue={formatInteger}
									/>
								</div>
							</div>
							</AdvancedOnly>
						</>
					)}
				</>
			)}
		</BgSectionCard>
	);
}
