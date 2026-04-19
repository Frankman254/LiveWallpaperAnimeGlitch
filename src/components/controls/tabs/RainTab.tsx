import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { RAIN_RANGES } from '@/config/ranges';
import type {
	ColorSourceMode,
	RainColorMode,
	RainParticleType
} from '@/types/wallpaper';
import SliderControl from '../SliderControl';
import ToggleControl from '../ToggleControl';
import EnumButtons from '../ui/EnumButtons';
import ColorInput from '../ui/ColorInput';
import SectionDivider from '../ui/SectionDivider';
import ResetButton from '../ui/ResetButton';

const PARTICLE_TYPES: RainParticleType[] = ['lines', 'drops', 'dots', 'bars'];
const COLOR_MODES: RainColorMode[] = ['solid', 'rainbow'];
const COLOR_SOURCES: ColorSourceMode[] = ['manual', 'background', 'theme'];

export default function RainTab({ onReset }: { onReset: () => void }) {
	const t = useT();
	const store = useWallpaperStore();
	return (
		<>
			<ResetButton label={t.reset_tab} onClick={onReset} />
			<ToggleControl
				label={t.label_rain_enabled}
				value={store.rainEnabled}
				onChange={store.setRainEnabled}
			/>
			{store.rainEnabled && (
				<>
					<SliderControl
						label={t.label_rain_intensity}
						value={store.rainIntensity}
						{...RAIN_RANGES.intensity}
						onChange={store.setRainIntensity}
					/>
					<SliderControl
						label={t.label_rain_count}
						value={store.rainDropCount}
						{...RAIN_RANGES.dropCount}
						onChange={store.setRainDropCount}
					/>
					<SliderControl
						label={t.label_rain_speed}
						value={store.rainSpeed}
						{...RAIN_RANGES.speed}
						onChange={store.setRainSpeed}
					/>

					<SectionDivider label={t.section_rain_direction} />
					<SliderControl
						label={t.label_rain_angle}
						value={store.rainAngle}
						{...RAIN_RANGES.angle}
						onChange={store.setRainAngle}
						unit="°"
					/>
					<SliderControl
						label={t.label_rain_rotation_z}
						value={store.rainMeshRotationZ}
						{...RAIN_RANGES.meshRotationZ}
						onChange={store.setRainMeshRotationZ}
						unit="°"
					/>

					<SectionDivider label={t.section_rain_style} />
					<div className="flex flex-col gap-1">
						<span
							className="text-xs"
							style={{ color: 'var(--editor-accent-soft)' }}
						>
							{t.label_color_source}
						</span>
						<EnumButtons<ColorSourceMode>
							options={COLOR_SOURCES}
							value={store.rainColorSource}
							onChange={store.setRainColorSource}
							labels={{
								manual: t.label_manual_color,
								background: t.label_current_image,
								theme: t.label_theme
							}}
						/>
					</div>
					{store.rainColorSource === 'manual' ? (
						<ColorInput
							label={t.label_rain_color}
							value={store.rainColor}
							onChange={store.setRainColor}
						/>
					) : (
						<span
							className="text-[11px]"
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							{store.rainColorSource === 'theme'
								? t.hint_theme_palette_auto
								: t.hint_background_palette_auto}
						</span>
					)}
					<div className="flex flex-col gap-1">
						<span
							className="text-xs"
							style={{ color: 'var(--editor-accent-soft)' }}
						>
							{t.label_color_mode}
						</span>
						<EnumButtons<RainColorMode>
							options={COLOR_MODES}
							value={store.rainColorMode}
							onChange={store.setRainColorMode}
						/>
					</div>
					<div className="flex flex-col gap-1">
						<span
							className="text-xs"
							style={{ color: 'var(--editor-accent-soft)' }}
						>
							{t.label_rain_type}
						</span>
						<EnumButtons<RainParticleType>
							options={PARTICLE_TYPES}
							value={store.rainParticleType}
							onChange={store.setRainParticleType}
						/>
					</div>
					<SliderControl
						label={t.label_rain_length}
						value={store.rainLength}
						{...RAIN_RANGES.length}
						onChange={store.setRainLength}
					/>
					<SliderControl
						label={t.label_rain_width}
						value={store.rainWidth}
						{...RAIN_RANGES.width}
						onChange={store.setRainWidth}
					/>
					<SliderControl
						label={t.label_rain_blur}
						value={store.rainBlur}
						{...RAIN_RANGES.blur}
						onChange={store.setRainBlur}
					/>
					<SliderControl
						label={t.label_variation}
						value={store.rainVariation}
						{...RAIN_RANGES.variation}
						onChange={store.setRainVariation}
					/>

					<span className="text-xs text-gray-500">
						{t.hint_rain_low_perf}
					</span>
				</>
			)}
		</>
	);
}
