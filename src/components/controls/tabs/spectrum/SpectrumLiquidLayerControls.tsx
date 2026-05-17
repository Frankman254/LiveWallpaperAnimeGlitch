import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { SPECTRUM_RANGES } from '@/config/ranges';
import {
	getSpectrumLiquidLayerFieldKey,
	type SpectrumLiquidLayerParamKey
} from '@/features/spectrum/spectrumLiquidLayers';
import {
	SPECTRUM_FRAME_MEMORY_PRESET_IDS,
	type SpectrumFrameMemoryPresetId
} from '@/features/spectrum/spectrumFrameMemoryPresets';
import SliderControl from '../../SliderControl';
import { Caption, FONT, SegmentedControl, UI_COLORS } from '@/ui';

const CONTROL_LABEL_STYLE = {
	color: UI_COLORS.fgMute,
	fontFamily: FONT.mono,
	fontSize: 10,
	fontWeight: 650,
	letterSpacing: '0.1em',
	textTransform: 'uppercase'
} as const;

function LiquidLayerSliders({
	layer,
	layerLabel
}: {
	layer: 1 | 2 | 3;
	layerLabel: string;
}) {
	const t = useT();
	const store = useWallpaperStore();
	const setParam = useWallpaperStore(s => s.setSpectrumLiquidLayerParam);

	const bind = (param: SpectrumLiquidLayerParamKey, value: number) =>
		setParam(layer, param, value);

	const read = (param: SpectrumLiquidLayerParamKey) => {
		const key = getSpectrumLiquidLayerFieldKey(layer, param);
		return store[key] as number;
	};

	return (
		<div className="flex min-w-0 flex-col gap-2 rounded-lg border border-white/6 bg-white/[0.02] p-2.5">
			<span className="uppercase" style={CONTROL_LABEL_STYLE}>
				{layerLabel}
			</span>
			<SliderControl
				label={t.label_liquid_layer_opacity}
				value={read('opacity')}
				{...SPECTRUM_RANGES.liquidLayerOpacity}
				onChange={v => bind('opacity', v)}
			/>
			<SliderControl
				label={t.label_liquid_layer_amp}
				value={read('amp')}
				{...SPECTRUM_RANGES.liquidLayerAmp}
				onChange={v => bind('amp', v)}
			/>
			<SliderControl
				label={t.label_liquid_layer_fill}
				value={read('fill')}
				{...SPECTRUM_RANGES.liquidLayerFill}
				onChange={v => bind('fill', v)}
				tooltip={t.hint_liquid_layer_fill}
			/>
			<SliderControl
				label={t.label_liquid_layer_speed}
				value={read('speed')}
				{...SPECTRUM_RANGES.liquidLayerSpeed}
				onChange={v => bind('speed', v)}
			/>
		</div>
	);
}

export function SpectrumLiquidLayerControls() {
	const t = useT();
	const applyPreset = useWallpaperStore(s => s.applySpectrumLiquidPreset);

	const presetLabels: Record<SpectrumFrameMemoryPresetId, string> = {
		safe: t.label_spectrum_frame_preset_safe,
		balanced: t.label_spectrum_frame_preset_balanced,
		heavy: t.label_spectrum_frame_preset_heavy
	};

	return (
		<div className="flex min-w-0 flex-col gap-2">
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
			<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
				{t.hint_spectrum_liquid_layers}
			</Caption>
			<LiquidLayerSliders layer={1} layerLabel={t.label_liquid_layer_back} />
			<LiquidLayerSliders layer={2} layerLabel={t.label_liquid_layer_mid} />
			<LiquidLayerSliders layer={3} layerLabel={t.label_liquid_layer_front} />
		</div>
	);
}
