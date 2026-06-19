import { useWallpaperStore } from '@/store/wallpaperStore';
import { useSpectrumTargetSettings } from '../useSpectrumTargetSettings';
import { useT } from '@/lib/i18n';
import { SPECTRUM_RANGES } from '@/config/ranges';
import { AdvancedOnly, useIsSimple } from '../../../UIMode';
import type {
	SpectrumRadialShape,
	SpectrumSpiralDotShape
} from '@/types/wallpaper';
import {
	Caption,
	CollapsibleSection,
	EnumButtonGroup as EnumButtons,
	FONT,
	OptionCardGrid,
	UI_COLORS
} from '@/ui';
import {
	SpectrumVisualAccentsSection,
	SpectrumVisualAccentsSimpleToggles
} from './SpectrumVisualAccentsSection';
import {
	SPECTRUM_RADIAL_SHAPE_LABELS,
	SPECTRUM_RADIAL_SHAPES
} from '@/features/spectrum/spectrumControlConfig';
import SliderControl from '../../../SliderControl';
import ToggleControl from '../../../ToggleControl';
import { SpectrumColorControls } from '../SpectrumColorControls';
import { SpectrumTunnelPresets } from '../SpectrumTunnelPresets';
import { SpectrumLiquidLayerControls } from '../SpectrumLiquidLayerControls';
import { getSpectrumFamilyCapabilities } from '@/features/spectrum/spectrumFamilyCapabilities';

const CONTROL_LABEL_STYLE = {
	color: UI_COLORS.fgMute,
	fontFamily: FONT.mono,
	fontSize: 10,
	fontWeight: 650,
	letterSpacing: '0.1em',
	textTransform: 'uppercase'
} as const;

const SPIRAL_DOT_SHAPES: SpectrumSpiralDotShape[] = [
	'circle',
	'square',
	'triangle',
	'diamond',
	'star',
	'plus',
	'mix'
];

const SPIRAL_DOT_SHAPE_LABELS: Record<SpectrumSpiralDotShape, string> = {
	circle: 'Circle',
	square: 'Square',
	triangle: 'Triangle',
	diamond: 'Diamond',
	star: 'Star',
	plus: 'Plus',
	mix: 'Mix'
};

type SpectrumStyleIntent = 'clean' | 'neon' | 'massive' | 'soft';

function IntentPreview({ intent }: { intent: SpectrumStyleIntent }) {
	if (intent === 'neon') {
		return (
			<div className="flex h-9 items-center justify-center gap-1">
				{[18, 30, 22, 34, 16].map((height, index) => (
					<span
						key={index}
						className="w-1.5 rounded-full bg-current"
						style={{
							height,
							boxShadow: '0 0 12px currentColor'
						}}
					/>
				))}
			</div>
		);
	}
	if (intent === 'massive') {
		return (
			<div className="flex h-9 items-end justify-center gap-1">
				{[26, 34, 30, 36, 28, 32].map((height, index) => (
					<span
						key={index}
						className="w-2 rounded-t bg-current"
						style={{ height }}
					/>
				))}
			</div>
		);
	}
	if (intent === 'soft') {
		return (
			<div className="flex h-9 items-center justify-center">
				<div className="h-6 w-16 rounded-full border border-current bg-current/10 blur-[0.2px]" />
			</div>
		);
	}
	return (
		<div className="flex h-9 items-end justify-center gap-1.5">
			{[14, 26, 18, 30, 20].map((height, index) => (
				<span
					key={index}
					className="w-1.5 rounded-sm bg-current"
					style={{ height }}
				/>
			))}
		</div>
	);
}

export function SpectrumStylePanel() {
	const t = useT();
	const isSimple = useIsSimple();
	const store = useWallpaperStore();
	const { settings: sp, update, target } = useSpectrumTargetSettings();
	const isClassic = sp.spectrumFamily === 'classic';
	const isTunnel = sp.spectrumFamily === 'tunnel';
	const isLiquid = sp.spectrumFamily === 'liquid';
	const isOscilloscope = sp.spectrumFamily === 'oscilloscope';
	const isSpiral = sp.spectrumFamily === 'spiral';
	const isRadial = sp.spectrumMode === 'radial';
	const caps = getSpectrumFamilyCapabilities(sp.spectrumFamily);

	const barBudget = (store.layoutReferenceWidth ?? 1920) * 1.6;
	const barFootprint = sp.spectrumBarCount * sp.spectrumBarWidth;
	const barOverflow = barFootprint > barBudget;

	const familySurfaceLabel = isTunnel
		? 'Tunnel surface'
		: isSpiral
			? 'Spiral shape'
			: isOscilloscope
				? 'Scope CRT'
				: 'Liquid layers';
	const hasFamilySurface =
		caps.supportsOscilloscopeLineWidth ||
		caps.supportsTunnelFx ||
		caps.supportsLiquidLayers ||
		isSpiral;

	function resolveIntent(): SpectrumStyleIntent {
		if (sp.spectrumGlowIntensity >= 1.8 || sp.spectrumShadowBlur >= 42) {
			return 'neon';
		}
		if (sp.spectrumMaxHeight >= 280 || sp.spectrumBarWidth >= 5) {
			return 'massive';
		}
		if (sp.spectrumOpacity <= 0.75 || sp.spectrumWaveFillOpacity >= 0.4) {
			return 'soft';
		}
		return 'clean';
	}

	function applyIntent(intent: SpectrumStyleIntent) {
		const presets: Record<
			SpectrumStyleIntent,
			{
				barCount: number;
				barWidth: number;
				minHeight: number;
				maxHeight: number;
				opacity: number;
				waveFillOpacity: number;
				glowIntensity: number;
				shadowBlur: number;
			}
		> = {
			clean: {
				barCount: 96,
				barWidth: 3,
				minHeight: 4,
				maxHeight: 180,
				opacity: 0.85,
				waveFillOpacity: 0.15,
				glowIntensity: 0.5,
				shadowBlur: 12
			},
			neon: {
				barCount: 112,
				barWidth: 2.5,
				minHeight: 6,
				maxHeight: 220,
				opacity: 0.95,
				waveFillOpacity: 0.3,
				glowIntensity: 2.2,
				shadowBlur: 48
			},
			massive: {
				barCount: 128,
				barWidth: 5,
				minHeight: 8,
				maxHeight: 330,
				opacity: 1,
				waveFillOpacity: 0.2,
				glowIntensity: 1.2,
				shadowBlur: 28
			},
			soft: {
				barCount: 80,
				barWidth: 6,
				minHeight: 3,
				maxHeight: 130,
				opacity: 0.68,
				waveFillOpacity: 0.45,
				glowIntensity: 0.8,
				shadowBlur: 26
			}
		};
		const preset = presets[intent];
		(value => update({ spectrumBarCount: value }))(preset.barCount);
		if (caps.supportsBarWidth)
			(value => update({ spectrumBarWidth: value }))(preset.barWidth);
		(value => update({ spectrumMinHeight: value }))(preset.minHeight);
		(value => update({ spectrumMaxHeight: value }))(preset.maxHeight);
		(value => update({ spectrumOpacity: value }))(preset.opacity);
		(value => update({ spectrumWaveFillOpacity: value }))(
			preset.waveFillOpacity
		);
		(value => update({ spectrumGlowIntensity: value }))(
			preset.glowIntensity
		);
		(value => update({ spectrumShadowBlur: value }))(preset.shadowBlur);

		if (isTunnel) {
			(value => update({ spectrumTunnelRingCount: value }))(
				intent === 'massive' ? 18 : intent === 'soft' ? 8 : 12
			);
			(value => update({ spectrumTunnelDepthFalloff: value }))(
				intent === 'soft' ? 0.35 : 0.55
			);
			(value => update({ spectrumTunnelWallOpacity: value }))(
				intent === 'neon' ? 0.38 : intent === 'soft' ? 0.16 : 0.25
			);
			(value => update({ spectrumTunnelPulseStrength: value }))(
				intent === 'massive' ? 0.7 : intent === 'neon' ? 0.55 : 0.3
			);
		}
	}

	if (isSimple) {
		return (
			<div className="flex min-w-0 flex-col gap-2">
				<SpectrumColorControls
					label={t.label_color_mode}
					source={sp.spectrumColorSource}
					onSourceChange={value =>
						update({ spectrumColorSource: value })
					}
					colorMode={sp.spectrumColorMode}
					onColorModeChange={value =>
						update({ spectrumColorMode: value })
					}
					primaryColor={sp.spectrumPrimaryColor}
					onPrimaryColorChange={value =>
						update({ spectrumPrimaryColor: value })
					}
					primaryLabel={t.label_primary_color}
					secondaryColor={sp.spectrumSecondaryColor}
					onSecondaryColorChange={value =>
						update({ spectrumSecondaryColor: value })
					}
					secondaryLabel={t.label_secondary_color}
				/>

				<SpectrumVisualAccentsSimpleToggles
					settings={sp}
					update={update}
				/>

				<div className="flex flex-col gap-2">
					<span className="uppercase" style={CONTROL_LABEL_STYLE}>
						Visual intent
					</span>
					<OptionCardGrid<SpectrumStyleIntent>
						items={[
							{
								value: 'clean',
								label: 'Clean',
								description: 'Readable shape, restrained glow.',
								preview: <IntentPreview intent="clean" />
							},
							{
								value: 'neon',
								label: 'Neon',
								description: 'Bright edges and stronger aura.',
								preview: <IntentPreview intent="neon" />
							},
							{
								value: 'massive',
								label: 'Massive',
								description: 'Tall, dense and high-impact.',
								preview: <IntentPreview intent="massive" />
							},
							{
								value: 'soft',
								label: 'Soft',
								description: 'Lower contrast, smoother body.',
								preview: <IntentPreview intent="soft" />
							}
						]}
						value={resolveIntent()}
						onChange={applyIntent}
						columns={2}
						density="compact"
						ariaLabel="Spectrum visual intent"
					/>
					<Caption as="p">
						Switch to Advanced for exact bar count, glow, blur and
						family-specific surface controls.
					</Caption>
				</div>

				{caps.supportsMirror ? (
					<ToggleControl
						label={
							isRadial ? t.label_mirror_sym : t.label_mirror_ud
						}
						value={sp.spectrumMirror}
						onChange={value => update({ spectrumMirror: value })}
					/>
				) : null}
			</div>
		);
	}

	return (
		<div className="flex min-w-0 flex-col gap-2">
			<SpectrumColorControls
				label={t.label_color_mode}
				source={sp.spectrumColorSource}
				onSourceChange={value => update({ spectrumColorSource: value })}
				colorMode={sp.spectrumColorMode}
				onColorModeChange={value =>
					update({ spectrumColorMode: value })
				}
				primaryColor={sp.spectrumPrimaryColor}
				onPrimaryColorChange={value =>
					update({ spectrumPrimaryColor: value })
				}
				primaryLabel={t.label_primary_color}
				secondaryColor={sp.spectrumSecondaryColor}
				onSecondaryColorChange={value =>
					update({ spectrumSecondaryColor: value })
				}
				secondaryLabel={t.label_secondary_color}
			/>

			<SpectrumVisualAccentsSection settings={sp} update={update} />

			<div className="flex min-w-0 flex-col gap-2">
				<SliderControl
					label={
						isOscilloscope
							? 'Sample resolution'
							: isTunnel
								? 'Ring segments'
								: t.label_bar_count
					}
					tooltip={
						isOscilloscope
							? 'Number of PCM samples plotted per frame. Lower = chunkier wave + much better perf (scope draws one canvas segment per sample; raw PCM is 2048 points which is expensive).'
							: undefined
					}
					value={sp.spectrumBarCount}
					{...SPECTRUM_RANGES.barCount}
					onChange={value => update({ spectrumBarCount: value })}
				/>
				{isTunnel ? (
					<Caption
						as="p"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						{t.hint_tunnel_bar_count}
					</Caption>
				) : null}
				{caps.supportsBarWidth ? (
					<SliderControl
						label={isTunnel ? 'Ring line width' : t.label_bar_width}
						value={sp.spectrumBarWidth}
						{...SPECTRUM_RANGES.barWidth}
						onChange={value => update({ spectrumBarWidth: value })}
					/>
				) : null}
				{barOverflow ? (
					<Caption
						as="p"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						Bar count × width may clip at this viewport — reduce one
						for cleaner spacing.
					</Caption>
				) : null}
			</div>

			{isOscilloscope ? null : (
				<div className="flex min-w-0 flex-col gap-2">
					<SliderControl
						label={t.label_min_height}
						value={sp.spectrumMinHeight}
						{...SPECTRUM_RANGES.minHeight}
						onChange={value => update({ spectrumMinHeight: value })}
					/>
					<SliderControl
						label={t.label_max_height}
						value={sp.spectrumMaxHeight}
						{...SPECTRUM_RANGES.maxHeight}
						onChange={value => update({ spectrumMaxHeight: value })}
					/>
				</div>
			)}

			<SliderControl
				label={t.label_opacity}
				value={sp.spectrumOpacity}
				{...SPECTRUM_RANGES.opacity}
				onChange={value => update({ spectrumOpacity: value })}
			/>

			{((isClassic && sp.spectrumShape === 'wave') ||
				(!isClassic && caps.supportsWaveFill)) && (
				<SliderControl
					label={t.label_wave_fill_opacity}
					value={sp.spectrumWaveFillOpacity}
					{...SPECTRUM_RANGES.waveFillOpacity}
					onChange={value =>
						update({ spectrumWaveFillOpacity: value })
					}
				/>
			)}

			{caps.supportsMirror ? (
				<ToggleControl
					label={isRadial ? t.label_mirror_sym : t.label_mirror_ud}
					value={sp.spectrumMirror}
					onChange={value => update({ spectrumMirror: value })}
				/>
			) : null}

			{isRadial && caps.supportsRadialShape && !isLiquid ? (
				<SliderControl
					label="Rotate figure"
					tooltip="Rotates only the selected radial figure contour. The spectrum motion stays independent."
					value={sp.spectrumFigureRotationSpeed}
					{...SPECTRUM_RANGES.rotationSpeed}
					onChange={value =>
						update({ spectrumFigureRotationSpeed: value })
					}
					defaultValue={0}
				/>
			) : null}

			<CollapsibleSection title={t.spectrum_section_glow_finish} dense>
				<div className="flex min-w-0 flex-col gap-2">
					<SliderControl
						label={t.label_glow}
						value={sp.spectrumGlowIntensity}
						{...SPECTRUM_RANGES.glowIntensity}
						onChange={value =>
							update({ spectrumGlowIntensity: value })
						}
					/>
					<SliderControl
						label={t.label_glow_reach}
						value={sp.spectrumGlowReach}
						{...SPECTRUM_RANGES.glowReach}
						onChange={value => update({ spectrumGlowReach: value })}
					/>
					<SliderControl
						label={t.label_shadow_blur}
						value={sp.spectrumShadowBlur}
						{...SPECTRUM_RANGES.shadowBlur}
						onChange={value =>
							update({ spectrumShadowBlur: value })
						}
					/>
					<ToggleControl
						label={t.label_spectrum_pixelate}
						value={sp.spectrumPixelate}
						onChange={value => update({ spectrumPixelate: value })}
					/>
					{sp.spectrumPixelate ? (
						<>
							<SliderControl
								label={t.label_spectrum_pixelate_scale}
								value={sp.spectrumPixelateScale}
								{...SPECTRUM_RANGES.pixelateScale}
								onChange={value =>
									update({ spectrumPixelateScale: value })
								}
							/>
							<Caption as="p">{t.spectrum_pixelate_hint}</Caption>
						</>
					) : null}
				</div>
			</CollapsibleSection>

			{hasFamilySurface ? (
				<CollapsibleSection title={familySurfaceLabel} dense>
					<div className="flex min-w-0 flex-col gap-2">
						{caps.supportsOscilloscopeLineWidth ? (
							<SliderControl
								label="Line Width"
								value={sp.spectrumOscilloscopeLineWidth}
								{...SPECTRUM_RANGES.barWidth}
								onChange={value =>
									update({
										spectrumOscilloscopeLineWidth: value
									})
								}
							/>
						) : null}
						{caps.supportsTunnelFx ? (
							<div className="flex min-w-0 flex-col gap-2">
								<div className="flex flex-col gap-1">
									<span
										className="uppercase"
										style={CONTROL_LABEL_STYLE}
									>
										{t.label_spectrum_tunnel_presets}
									</span>
									<SpectrumTunnelPresets />
									<Caption
										as="p"
										style={{
											color: 'var(--editor-accent-muted)'
										}}
									>
										{t.hint_spectrum_tunnel_presets}
									</Caption>
								</div>
								<SliderControl
									label={t.label_ring_count}
									value={sp.spectrumTunnelRingCount}
									{...SPECTRUM_RANGES.tunnelRingCount}
									onChange={value =>
										update({
											spectrumTunnelRingCount: value
										})
									}
								/>
								<SliderControl
									label={t.label_tunnel_depth_falloff}
									value={sp.spectrumTunnelDepthFalloff}
									{...SPECTRUM_RANGES.tunnelDepthFalloff}
									onChange={value =>
										update({
											spectrumTunnelDepthFalloff: value
										})
									}
								/>
								<SliderControl
									label={t.label_tunnel_wall_opacity}
									value={sp.spectrumTunnelWallOpacity}
									{...SPECTRUM_RANGES.tunnelWallOpacity}
									onChange={value =>
										update({
											spectrumTunnelWallOpacity: value
										})
									}
								/>
								<SliderControl
									label={t.label_tunnel_pulse_strength}
									value={sp.spectrumTunnelPulseStrength}
									{...SPECTRUM_RANGES.tunnelPulseStrength}
									onChange={value =>
										update({
											spectrumTunnelPulseStrength: value
										})
									}
								/>
								<AdvancedOnly>
									<SliderControl
										label={t.label_tunnel_ring_spacing}
										value={sp.spectrumTunnelRingSpacing}
										{...SPECTRUM_RANGES.tunnelRingSpacing}
										onChange={value =>
											update({
												spectrumTunnelRingSpacing: value
											})
										}
									/>
									<ToggleControl
										label="Alternate ring rotation"
										tooltip="Counter-rotates every other ring (radial mode only). One ring spins clockwise, the next counter-clockwise, etc. Creates a layered depth illusion when used with non-circle radial shapes."
										value={
											sp.spectrumTunnelAlternateRotation
										}
										onChange={value =>
											update({
												spectrumTunnelAlternateRotation:
													value
											})
										}
									/>
								</AdvancedOnly>
							</div>
						) : null}
						{caps.supportsLiquidLayers ? (
							<AdvancedOnly>
								<SpectrumLiquidLayerControls target={target} />
							</AdvancedOnly>
						) : null}
						{isSpiral ? (
							<div className="flex min-w-0 flex-col gap-2">
								<span
									className="uppercase"
									style={CONTROL_LABEL_STYLE}
								>
									Spiral shape
								</span>
								<EnumButtons<SpectrumRadialShape>
									options={SPECTRUM_RADIAL_SHAPES}
									value={sp.spectrumSpiralShape}
									onChange={value =>
										update({ spectrumSpiralShape: value })
									}
									labels={SPECTRUM_RADIAL_SHAPE_LABELS}
								/>
								<SliderControl
									label="Turns"
									value={sp.spectrumSpiralTurns}
									{...SPECTRUM_RANGES.spiralTurns}
									onChange={value =>
										update({ spectrumSpiralTurns: value })
									}
								/>
								<SliderControl
									label="Outer radius"
									value={sp.spectrumSpiralOuterRadius}
									{...SPECTRUM_RANGES.spiralOuterRadius}
									onChange={value =>
										update({
											spectrumSpiralOuterRadius: value
										})
									}
								/>
								<SliderControl
									label="Tightness"
									value={sp.spectrumSpiralTightness}
									{...SPECTRUM_RANGES.spiralTightness}
									onChange={value =>
										update({
											spectrumSpiralTightness: value
										})
									}
								/>
								<SliderControl
									label="Arms"
									value={sp.spectrumSpiralArms}
									{...SPECTRUM_RANGES.spiralArms}
									onChange={value =>
										update({ spectrumSpiralArms: value })
									}
								/>
								<SliderControl
									label="Audio → turns"
									tooltip="Audio amplitude inflates the turn count on hits"
									value={sp.spectrumSpiralAudioTurns}
									{...SPECTRUM_RANGES.spiralAudioTurns}
									onChange={value =>
										update({
											spectrumSpiralAudioTurns: value
										})
									}
								/>
								<ToggleControl
									label="Logarithmic radius"
									value={sp.spectrumSpiralLogarithmic}
									onChange={value =>
										update({
											spectrumSpiralLogarithmic: value
										})
									}
								/>
								<ToggleControl
									label="Gradient stroke"
									value={sp.spectrumSpiralGradientStroke}
									onChange={value =>
										update({
											spectrumSpiralGradientStroke: value
										})
									}
								/>
								<span
									className="uppercase"
									style={CONTROL_LABEL_STYLE}
								>
									Dot shape
								</span>
								<EnumButtons<SpectrumSpiralDotShape>
									options={SPIRAL_DOT_SHAPES}
									value={sp.spectrumSpiralDotShape}
									onChange={value =>
										update({
											spectrumSpiralDotShape: value
										})
									}
									labels={SPIRAL_DOT_SHAPE_LABELS}
								/>
								<SliderControl
									label="Connecting line"
									tooltip="Stroke width of the line that joins consecutive dots along the spiral arm. Drag all the way to 0 to hide the line entirely and show only the dots."
									value={sp.spectrumSpiralStrokeWidth}
									{...SPECTRUM_RANGES.spiralStrokeWidth}
									onChange={value =>
										update({
											spectrumSpiralStrokeWidth: value
										})
									}
								/>
								{sp.spectrumSpiralStrokeWidth > 0 ? (
									<button
										type="button"
										onClick={() =>
											(value =>
												update({
													spectrumSpiralStrokeWidth:
														value
												}))(0)
										}
										className="self-start rounded px-2 py-1 transition"
										style={{
											border: '1px solid var(--editor-tag-border)',
											background: 'transparent',
											color: 'var(--editor-accent-muted)',
											fontSize: 10,
											letterSpacing: '0.08em',
											textTransform: 'uppercase'
										}}
									>
										Hide line
									</button>
								) : null}
							</div>
						) : null}
						{isOscilloscope ? (
							<div className="flex min-w-0 flex-col gap-2">
								<span
									className="uppercase"
									style={CONTROL_LABEL_STYLE}
								>
									Scope
								</span>
								<SliderControl
									label="Scope height"
									tooltip="Vertical amplitude of the scope trace. This is separate from trace response."
									value={sp.spectrumMaxHeight}
									{...SPECTRUM_RANGES.maxHeight}
									onChange={value =>
										update({ spectrumMaxHeight: value })
									}
								/>
								<SliderControl
									label="Trace response"
									tooltip="Lower = wave lags / persists across frames. Higher = snaps faster to live PCM. Height is controlled by Scope height."
									value={sp.spectrumOscilloscopeScrollSpeed}
									{...SPECTRUM_RANGES.oscilloscopeScrollSpeed}
									onChange={value =>
										update({
											spectrumOscilloscopeScrollSpeed:
												value
										})
									}
								/>
								<ToggleControl
									label="Reactive line width"
									value={sp.spectrumOscilloscopeReactiveWidth}
									onChange={value =>
										update({
											spectrumOscilloscopeReactiveWidth:
												value
										})
									}
								/>
								<ToggleControl
									label="Phosphor afterglow"
									value={sp.spectrumOscilloscopePhosphor}
									onChange={value =>
										update({
											spectrumOscilloscopePhosphor: value
										})
									}
								/>
								{sp.spectrumOscilloscopePhosphor ? (
									<SliderControl
										label="Phosphor decay"
										tooltip="Higher values fade the trail faster. Lower values leave a long ghost trace."
										value={
											sp.spectrumOscilloscopePhosphorDecay
										}
										{...SPECTRUM_RANGES.oscilloscopePhosphorDecay}
										onChange={value =>
											update({
												spectrumOscilloscopePhosphorDecay:
													value
											})
										}
									/>
								) : null}
								<ToggleControl
									label="CRT reticle"
									value={sp.spectrumOscilloscopeGrid}
									onChange={value =>
										update({
											spectrumOscilloscopeGrid: value
										})
									}
								/>
								{sp.spectrumOscilloscopeGrid ? (
									<SliderControl
										label="Grid divisions"
										value={
											sp.spectrumOscilloscopeGridDivisions
										}
										{...SPECTRUM_RANGES.oscilloscopeGridDivisions}
										onChange={value =>
											update({
												spectrumOscilloscopeGridDivisions:
													value
											})
										}
									/>
								) : null}
							</div>
						) : null}
					</div>
				</CollapsibleSection>
			) : null}
		</div>
	);
}
