import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { SPECTRUM_RANGES } from '@/config/ranges';
import { DEFAULT_STATE } from '@/lib/constants';
import type { SpectrumRadialShape } from '@/types/wallpaper';
import {
	getSpectrumLiquidLayerFieldKey,
	getSpectrumLiquidLayerRigidShapeFieldKey,
	getSpectrumLiquidLayerShapeFieldKey,
	type SpectrumLiquidLayerParamKey
} from '@/features/spectrum/spectrumLiquidLayers';
import {
	SPECTRUM_RADIAL_SHAPE_LABELS,
	SPECTRUM_RADIAL_SHAPES
} from '@/features/spectrum/spectrumControlConfig';
import { SPECTRUM_RADIAL_SHAPE_ICONS } from '@/features/spectrum/geometry/radialShapeIcons';
import {
	SPECTRUM_FRAME_MEMORY_PRESET_IDS,
	type SpectrumFrameMemoryPresetId
} from '@/features/spectrum/spectrumFrameMemoryPresets';
import SliderControl from '../../SliderControl';
import ToggleControl from '../../ToggleControl';
import {
	Caption,
	CollapsibleSection,
	EnumButtonGroup as EnumButtons,
	FONT,
	SegmentedControl,
	UI_COLORS
} from '@/ui';

const CONTROL_LABEL_STYLE = {
	color: UI_COLORS.fgMute,
	fontFamily: FONT.mono,
	fontSize: 10,
	fontWeight: 650,
	letterSpacing: '0.1em',
	textTransform: 'uppercase'
} as const;

function LiquidLayerSection({
	layer,
	layerLabel,
	target
}: {
	layer: 1 | 2 | 3;
	layerLabel: string;
	target: 'main' | 'instance';
}) {
	const t = useT();
	const store = useWallpaperStore();
	const instance = useWallpaperStore(s => s.spectrumInstances[0]);
	const updateInstance = useWallpaperStore(s => s.updateSpectrumInstance);
	const setParam = useWallpaperStore(s => s.setSpectrumLiquidLayerParam);
	const setShape = useWallpaperStore(s => s.setSpectrumLiquidLayerShape);
	const setRigid = useWallpaperStore(
		s => s.setSpectrumLiquidLayerRigidShape
	);

	// Instances reuse the main key names, so one key builder serves both
	// targets; only the read/write source differs.
	const isInstance = target === 'instance';
	const source = isInstance && instance ? instance : store;

	const rigidKey = getSpectrumLiquidLayerRigidShapeFieldKey(layer);
	const rigidShape = source[rigidKey] as boolean;
	const canLayerShape = isInstance
		? (instance?.spectrumMode ?? 'radial') === 'radial'
		: store.spectrumMode === 'radial';
	const canRotateFigure = rigidShape && canLayerShape;

	const bind = (param: SpectrumLiquidLayerParamKey, value: number) => {
		if (isInstance) {
			if (instance) {
				updateInstance(instance.id, {
					[getSpectrumLiquidLayerFieldKey(layer, param)]: value
				});
			}
			return;
		}
		setParam(layer, param, value);
	};

	const read = (param: SpectrumLiquidLayerParamKey) =>
		source[getSpectrumLiquidLayerFieldKey(layer, param)] as number;
	const readShape = () =>
		source[getSpectrumLiquidLayerShapeFieldKey(layer)] as SpectrumRadialShape;
	const bindShape = (shape: SpectrumRadialShape) => {
		if (isInstance) {
			if (instance) {
				updateInstance(instance.id, {
					[getSpectrumLiquidLayerShapeFieldKey(layer)]: shape
				});
			}
			return;
		}
		setShape(layer, shape);
	};
	const bindRigid = (v: boolean) => {
		if (isInstance) {
			if (instance) {
				updateInstance(instance.id, { [rigidKey]: v });
			}
			return;
		}
		setRigid(layer, v);
	};
	const defaultValue = (param: SpectrumLiquidLayerParamKey) =>
		DEFAULT_STATE[getSpectrumLiquidLayerFieldKey(layer, param)] as number;

	return (
		<CollapsibleSection title={layerLabel} dense>
			<div className="flex min-w-0 flex-col gap-2">
				<ToggleControl
					label="Rigid shape"
					tooltip="Keeps this layer's contour stable and scales it with audio instead of wobbling every point."
					value={rigidShape}
					onChange={bindRigid}
				/>
				{canLayerShape ? (
					<CollapsibleSection
						title="Layer shape"
						defaultOpen={false}
						dense
					>
						<EnumButtons<SpectrumRadialShape>
							options={SPECTRUM_RADIAL_SHAPES}
							value={readShape()}
							onChange={bindShape}
							labels={SPECTRUM_RADIAL_SHAPE_ICONS}
							tooltips={SPECTRUM_RADIAL_SHAPE_LABELS}
						/>
					</CollapsibleSection>
				) : null}
				<SliderControl
					label={t.label_liquid_layer_opacity}
					value={read('opacity')}
					{...SPECTRUM_RANGES.liquidLayerOpacity}
					onChange={v => bind('opacity', v)}
					defaultValue={defaultValue('opacity')}
				/>
				<SliderControl
					label={t.label_liquid_layer_amp}
					value={read('amp')}
					{...SPECTRUM_RANGES.liquidLayerAmp}
					onChange={v => bind('amp', v)}
					defaultValue={defaultValue('amp')}
				/>
				<SliderControl
					label={t.label_liquid_layer_fill}
					value={read('fill')}
					{...SPECTRUM_RANGES.liquidLayerFill}
					onChange={v => bind('fill', v)}
					tooltip={t.hint_liquid_layer_fill}
					defaultValue={defaultValue('fill')}
				/>
				{rigidShape ? null : (
					<SliderControl
						label={t.label_liquid_layer_speed}
						value={read('speed')}
						{...SPECTRUM_RANGES.liquidLayerSpeed}
						onChange={v => bind('speed', v)}
						defaultValue={defaultValue('speed')}
					/>
				)}
				{canRotateFigure ? (
					<SliderControl
						label="Rotate figure"
						tooltip="Rotates this liquid layer's rigid contour. Use opposite signs across layers for counter-rotating shapes."
						value={read('rotationSpeed')}
						{...SPECTRUM_RANGES.rotationSpeed}
						onChange={v => bind('rotationSpeed', v)}
						defaultValue={defaultValue('rotationSpeed')}
					/>
				) : null}
			</div>
		</CollapsibleSection>
	);
}

export function SpectrumLiquidLayerControls({
	target = 'main'
}: {
	target?: 'main' | 'instance';
}) {
	const t = useT();
	const applyPreset = useWallpaperStore(s => s.applySpectrumLiquidPreset);

	const presetLabels: Record<SpectrumFrameMemoryPresetId, string> = {
		safe: t.label_spectrum_frame_preset_safe,
		balanced: t.label_spectrum_frame_preset_balanced,
		heavy: t.label_spectrum_frame_preset_heavy
	};

	return (
		<div className="flex min-w-0 flex-col gap-2">
			{target === 'main' ? (
				<div className="flex flex-col gap-1">
					<span className="uppercase" style={CONTROL_LABEL_STYLE}>
						{t.label_spectrum_liquid_presets}
					</span>
					<SegmentedControl
						size="sm"
						ariaLabel={t.label_spectrum_liquid_presets}
						value={null}
						options={SPECTRUM_FRAME_MEMORY_PRESET_IDS.map(id => ({
							value: id,
							label: presetLabels[id]
						}))}
						onChange={id => applyPreset(id)}
					/>
					<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
						{t.hint_spectrum_liquid_presets}
					</Caption>
				</div>
			) : null}
			<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
				{t.hint_spectrum_liquid_layers}
			</Caption>
			<LiquidLayerSection
				layer={1}
				layerLabel={t.label_liquid_layer_back}
				target={target}
			/>
			<LiquidLayerSection
				layer={2}
				layerLabel={t.label_liquid_layer_mid}
				target={target}
			/>
			<LiquidLayerSection
				layer={3}
				layerLabel={t.label_liquid_layer_front}
				target={target}
			/>
		</div>
	);
}
