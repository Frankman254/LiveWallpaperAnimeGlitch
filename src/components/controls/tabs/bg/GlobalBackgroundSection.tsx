import SliderControl from '@/components/controls/SliderControl';
import ToggleControl from '@/components/controls/ToggleControl';
import SectionDivider from '@/components/controls/ui/SectionDivider';
import { IMAGE_RANGES, GLOBAL_FILTER_RANGES } from '@/config/ranges';
import BgFitModeSelector from './BgFitModeSelector';
import BgSectionCard from './BgSectionCard';
import type { ImageFitMode } from '@/types/wallpaper';
import type { SliderRange } from '@/types/controls';

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
	return (
		<BgSectionCard
			title={t.label_global_background_image}
			hint={t.hint_global_background}
		>
			<ToggleControl
				label={t.label_enabled}
				value={globalBackgroundEnabled}
				onChange={onToggleEnabled}
			/>

			<div className="flex gap-2">
				<button
					onClick={onUploadClick}
					className="flex-1 rounded border px-3 py-1 text-xs transition-colors"
					style={{
						background: 'var(--editor-button-bg)',
						borderColor: 'var(--editor-button-border)',
						color: 'var(--editor-button-fg)'
					}}
				>
					{t.upload_images}
				</button>
				{globalBackgroundId && (
					<button
						onClick={onRemove}
						className="rounded border border-red-900 px-2 py-1 text-xs text-red-500 transition-colors hover:border-red-600"
					>
						{t.remove_global_background}
					</button>
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

					<SliderControl
						label={t.label_scale}
						value={globalBackgroundScale}
						{...IMAGE_RANGES.scale}
						onChange={onChangeScale}
					/>
					<SliderControl
						label={t.label_position_x}
						value={globalBackgroundPositionX}
						{...globalBackgroundPositionXRange}
						onChange={onChangePositionX}
					/>
					<SliderControl
						label={t.label_position_y}
						value={globalBackgroundPositionY}
						{...globalBackgroundPositionYRange}
						onChange={onChangePositionY}
					/>
					<SliderControl
						label={t.label_global_background_opacity}
						value={globalBackgroundOpacity}
						{...IMAGE_RANGES.opacity}
						onChange={onChangeOpacity}
					/>

					<SectionDivider label={t.tab_filters} />
					<SliderControl
						label={t.label_brightness}
						value={globalBackgroundBrightness}
						{...GLOBAL_FILTER_RANGES.brightness}
						onChange={onChangeBrightness}
					/>
					<SliderControl
						label={t.label_contrast}
						value={globalBackgroundContrast}
						{...GLOBAL_FILTER_RANGES.contrast}
						onChange={onChangeContrast}
					/>
					<SliderControl
						label={t.label_saturation}
						value={globalBackgroundSaturation}
						{...GLOBAL_FILTER_RANGES.saturation}
						onChange={onChangeSaturation}
					/>
					<SliderControl
						label={t.label_blur}
						value={globalBackgroundBlur}
						{...GLOBAL_FILTER_RANGES.blur}
						unit="px"
						onChange={onChangeBlur}
					/>
					<SliderControl
						label={t.label_hue_rotate}
						value={globalBackgroundHueRotate}
						{...GLOBAL_FILTER_RANGES.hueRotate}
						unit="deg"
						onChange={onChangeHueRotate}
					/>
				</>
			)}
		</BgSectionCard>
	);
}
