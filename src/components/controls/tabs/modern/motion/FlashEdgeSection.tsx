import { useShallow } from 'zustand/react/shallow';
import {
	CollapsibleSection,
	SectionCard,
	SegmentedControl,
	ToggleSwitch
} from '@/ui';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { FACTORY_DEFAULT_STATE } from '@/lib/factoryDefaults';
import { ColorField, MotionSlider as Slider } from './MotionSharedControls';
import { formatDecimal } from './motionTabUtils';

type Target = 'logo' | 'bg';

function useFlashEdgeState(target: Target) {
	return useWallpaperStore(
		useShallow(state => ({
			enabled:
				target === 'logo'
					? state.logoFlashEdgeEnabled
					: state.bgFlashEdgeEnabled,
			intensityMult:
				target === 'logo'
					? state.logoFlashEdgeIntensityMult
					: state.bgFlashEdgeIntensityMult,
			thickness:
				target === 'logo'
					? state.logoFlashEdgeThickness
					: state.bgFlashEdgeThickness,
			radius:
				target === 'logo'
					? state.logoFlashEdgeRadius
					: state.bgFlashEdgeRadius,
			colorMode:
				target === 'logo'
					? state.logoFlashEdgeColorMode
					: state.bgFlashEdgeColorMode,
			color:
				target === 'logo'
					? state.logoFlashEdgeColor
					: state.bgFlashEdgeColor,
			advanced: state.uiMode === 'advanced',
			flashLightEnabled: state.flashLightEnabled
		}))
	);
}

function useFlashEdgeSetters(target: Target) {
	return useWallpaperStore(
		useShallow(state =>
			target === 'logo'
				? {
						enabled: state.setLogoFlashEdgeEnabled,
						intensityMult: state.setLogoFlashEdgeIntensityMult,
						thickness: state.setLogoFlashEdgeThickness,
						radius: state.setLogoFlashEdgeRadius,
						colorMode: state.setLogoFlashEdgeColorMode,
						color: state.setLogoFlashEdgeColor
					}
				: {
						enabled: state.setBgFlashEdgeEnabled,
						intensityMult: state.setBgFlashEdgeIntensityMult,
						thickness: state.setBgFlashEdgeThickness,
						radius: state.setBgFlashEdgeRadius,
						colorMode: state.setBgFlashEdgeColorMode,
						color: state.setBgFlashEdgeColor
					}
		)
	);
}

/**
 * Sección compacta de Contorno Neon Reactivo por capa.
 * Calibración (timing/sensibilidad/threshold) vive en Flash Light.
 * Esta sección solo controla intensidad, forma y color del contorno.
 */
export function FlashEdgeSection({ target }: { target: Target }) {
	const t = useT();
	const s = useFlashEdgeState(target);
	const set = useFlashEdgeSetters(target);

	const subtitle =
		target === 'logo' ? t.sfx_flash_edge_logo_hint : t.sfx_flash_edge_bg_hint;

	const defs =
		target === 'logo'
			? {
					intensityMult: FACTORY_DEFAULT_STATE.logoFlashEdgeIntensityMult,
					thickness: FACTORY_DEFAULT_STATE.logoFlashEdgeThickness,
					radius: FACTORY_DEFAULT_STATE.logoFlashEdgeRadius
				}
			: {
					intensityMult: FACTORY_DEFAULT_STATE.bgFlashEdgeIntensityMult,
					thickness: FACTORY_DEFAULT_STATE.bgFlashEdgeThickness,
					radius: FACTORY_DEFAULT_STATE.bgFlashEdgeRadius
				};

	return (
		<SectionCard
			title={t.sfx_flash_edge_title}
			subtitle={subtitle}
			action={
				<ToggleSwitch
					checked={s.enabled}
					onChange={set.enabled}
					size="sm"
					ariaLabel={t.sfx_flash_edge_enable}
				/>
			}
			density="compact"
		>
			{s.enabled ? (
				<div className="flex flex-col gap-3">
					{/* Simple: intensidad + color */}
					<Slider
						label={t.sfx_flash_edge_intensity_mult}
						value={s.intensityMult}
						min={0.1}
						max={3}
						step={0.05}
						onChange={set.intensityMult}
						defaultValue={defs.intensityMult}
						variant="macro"
						formatValue={formatDecimal}
					/>
					<SegmentedControl<'flash' | 'manual'>
						value={s.colorMode}
						onChange={set.colorMode}
						options={[
							{
								value: 'flash',
								label: t.sfx_flash_edge_color_mode_flash
							},
							{
								value: 'manual',
								label: t.sfx_flash_edge_color_mode_manual
							}
						]}
						size="sm"
						full
					/>
					{s.colorMode === 'manual' ? (
						<ColorField
							label={t.sfx_flash_edge_color}
							value={s.color}
							onChange={set.color}
						/>
					) : null}

					{/* Advanced: grosor y radio de bloom */}
					{s.advanced ? (
						<CollapsibleSection
							title={t.sfx_advanced}
							defaultOpen={false}
							dense
						>
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<Slider
									label={t.sfx_flash_edge_thickness}
									value={s.thickness}
									min={1}
									max={16}
									step={0.5}
									onChange={set.thickness}
									defaultValue={defs.thickness}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label={t.sfx_flash_edge_radius}
									value={s.radius}
									min={0}
									max={40}
									step={1}
									onChange={set.radius}
									defaultValue={defs.radius}
									variant="compact"
									formatValue={formatDecimal}
								/>
							</div>
						</CollapsibleSection>
					) : null}

					{/* Indicador de calibración */}
					<p
						style={{
							fontSize: 10,
							opacity: 0.5,
							margin: 0,
							lineHeight: 1.4
						}}
					>
						{t.sfx_flash_edge_calibration_hint}
					</p>
				</div>
			) : null}
		</SectionCard>
	);
}
