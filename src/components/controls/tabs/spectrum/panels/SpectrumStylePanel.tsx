import { useWallpaperStore } from '@/store/wallpaperStore';
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
	const isClassic = store.spectrumFamily === 'classic';
	const isTunnel = store.spectrumFamily === 'tunnel';
	const isOscilloscope = store.spectrumFamily === 'oscilloscope';
	const isSpiral = store.spectrumFamily === 'spiral';
	const isRadial = store.spectrumMode === 'radial';
	const caps = getSpectrumFamilyCapabilities(store.spectrumFamily);

	const barBudget = (store.layoutReferenceWidth ?? 1920) * 1.6;
	const barFootprint = store.spectrumBarCount * store.spectrumBarWidth;
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
		if (
			store.spectrumGlowIntensity >= 1.8 ||
			store.spectrumShadowBlur >= 42
		) {
			return 'neon';
		}
		if (store.spectrumMaxHeight >= 280 || store.spectrumBarWidth >= 5) {
			return 'massive';
		}
		if (
			store.spectrumOpacity <= 0.75 ||
			store.spectrumWaveFillOpacity >= 0.4
		) {
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
		store.setSpectrumBarCount(preset.barCount);
		if (caps.supportsBarWidth) store.setSpectrumBarWidth(preset.barWidth);
		store.setSpectrumMinHeight(preset.minHeight);
		store.setSpectrumMaxHeight(preset.maxHeight);
		store.setSpectrumOpacity(preset.opacity);
		store.setSpectrumWaveFillOpacity(preset.waveFillOpacity);
		store.setSpectrumGlowIntensity(preset.glowIntensity);
		store.setSpectrumShadowBlur(preset.shadowBlur);

		if (isTunnel) {
			store.setSpectrumTunnelRingCount(
				intent === 'massive' ? 18 : intent === 'soft' ? 8 : 12
			);
			store.setSpectrumTunnelDepthFalloff(
				intent === 'soft' ? 0.35 : 0.55
			);
			store.setSpectrumTunnelWallOpacity(
				intent === 'neon' ? 0.38 : intent === 'soft' ? 0.16 : 0.25
			);
			store.setSpectrumTunnelPulseStrength(
				intent === 'massive' ? 0.7 : intent === 'neon' ? 0.55 : 0.3
			);
		}
	}

	if (isSimple) {
		return (
			<div className="flex min-w-0 flex-col gap-2">
				<SpectrumColorControls
					label={t.label_color_mode}
					source={store.spectrumColorSource}
					onSourceChange={store.setSpectrumColorSource}
					colorMode={store.spectrumColorMode}
					onColorModeChange={store.setSpectrumColorMode}
					primaryColor={store.spectrumPrimaryColor}
					onPrimaryColorChange={store.setSpectrumPrimaryColor}
					primaryLabel={t.label_primary_color}
					secondaryColor={store.spectrumSecondaryColor}
					onSecondaryColorChange={store.setSpectrumSecondaryColor}
					secondaryLabel={t.label_secondary_color}
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
						value={store.spectrumMirror}
						onChange={store.setSpectrumMirror}
					/>
				) : null}
			</div>
		);
	}

	return (
		<div className="flex min-w-0 flex-col gap-2">
			<SpectrumColorControls
				label={t.label_color_mode}
				source={store.spectrumColorSource}
				onSourceChange={store.setSpectrumColorSource}
				colorMode={store.spectrumColorMode}
				onColorModeChange={store.setSpectrumColorMode}
				primaryColor={store.spectrumPrimaryColor}
				onPrimaryColorChange={store.setSpectrumPrimaryColor}
				primaryLabel={t.label_primary_color}
				secondaryColor={store.spectrumSecondaryColor}
				onSecondaryColorChange={store.setSpectrumSecondaryColor}
				secondaryLabel={t.label_secondary_color}
			/>

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
					value={store.spectrumBarCount}
					{...SPECTRUM_RANGES.barCount}
					onChange={store.setSpectrumBarCount}
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
						value={store.spectrumBarWidth}
						{...SPECTRUM_RANGES.barWidth}
						onChange={store.setSpectrumBarWidth}
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

			<div className="flex min-w-0 flex-col gap-2">
				<SliderControl
					label={t.label_min_height}
					value={store.spectrumMinHeight}
					{...SPECTRUM_RANGES.minHeight}
					onChange={store.setSpectrumMinHeight}
				/>
				<SliderControl
					label={t.label_max_height}
					value={store.spectrumMaxHeight}
					{...SPECTRUM_RANGES.maxHeight}
					onChange={store.setSpectrumMaxHeight}
				/>
			</div>

			<SliderControl
				label={t.label_opacity}
				value={store.spectrumOpacity}
				{...SPECTRUM_RANGES.opacity}
				onChange={store.setSpectrumOpacity}
			/>

			{((isClassic && store.spectrumShape === 'wave') ||
				(!isClassic && caps.supportsWaveFill)) && (
				<SliderControl
					label={t.label_wave_fill_opacity}
					value={store.spectrumWaveFillOpacity}
					{...SPECTRUM_RANGES.waveFillOpacity}
					onChange={store.setSpectrumWaveFillOpacity}
				/>
			)}

			{caps.supportsMirror ? (
				<ToggleControl
					label={isRadial ? t.label_mirror_sym : t.label_mirror_ud}
					value={store.spectrumMirror}
					onChange={store.setSpectrumMirror}
				/>
			) : null}

			{isRadial && caps.supportsRadialShape ? (
				<SliderControl
					label="Rotate figure"
					tooltip="Rotates only the selected radial figure contour. The spectrum motion stays independent."
					value={store.spectrumFigureRotationSpeed}
					{...SPECTRUM_RANGES.rotationSpeed}
					onChange={store.setSpectrumFigureRotationSpeed}
				/>
			) : null}

			<CollapsibleSection title="Glow & finish" dense>
				<div className="flex min-w-0 flex-col gap-2">
					<SliderControl
						label={t.label_glow}
						value={store.spectrumGlowIntensity}
						{...SPECTRUM_RANGES.glowIntensity}
						onChange={store.setSpectrumGlowIntensity}
					/>
					<SliderControl
						label={t.label_shadow_blur}
						value={store.spectrumShadowBlur}
						{...SPECTRUM_RANGES.shadowBlur}
						onChange={store.setSpectrumShadowBlur}
					/>
				</div>
			</CollapsibleSection>

			{hasFamilySurface ? (
				<CollapsibleSection title={familySurfaceLabel} dense>
					<div className="flex min-w-0 flex-col gap-2">
						{caps.supportsOscilloscopeLineWidth ? (
							<SliderControl
								label="Line Width"
								value={store.spectrumOscilloscopeLineWidth}
								{...SPECTRUM_RANGES.barWidth}
								onChange={
									store.setSpectrumOscilloscopeLineWidth
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
									value={store.spectrumTunnelRingCount}
									{...SPECTRUM_RANGES.tunnelRingCount}
									onChange={store.setSpectrumTunnelRingCount}
								/>
								<SliderControl
									label={t.label_tunnel_depth_falloff}
									value={store.spectrumTunnelDepthFalloff}
									{...SPECTRUM_RANGES.tunnelDepthFalloff}
									onChange={
										store.setSpectrumTunnelDepthFalloff
									}
								/>
								<SliderControl
									label={t.label_tunnel_wall_opacity}
									value={store.spectrumTunnelWallOpacity}
									{...SPECTRUM_RANGES.tunnelWallOpacity}
									onChange={
										store.setSpectrumTunnelWallOpacity
									}
								/>
								<SliderControl
									label={t.label_tunnel_pulse_strength}
									value={store.spectrumTunnelPulseStrength}
									{...SPECTRUM_RANGES.tunnelPulseStrength}
									onChange={
										store.setSpectrumTunnelPulseStrength
									}
								/>
								<AdvancedOnly>
									<SliderControl
										label={t.label_tunnel_ring_spacing}
										value={store.spectrumTunnelRingSpacing}
										{...SPECTRUM_RANGES.tunnelRingSpacing}
										onChange={
											store.setSpectrumTunnelRingSpacing
										}
									/>
									<ToggleControl
										label="Alternate ring rotation"
										tooltip="Counter-rotates every other ring (radial mode only). One ring spins clockwise, the next counter-clockwise, etc. Creates a layered depth illusion when used with non-circle radial shapes."
										value={
											store.spectrumTunnelAlternateRotation
										}
										onChange={
											store.setSpectrumTunnelAlternateRotation
										}
									/>
								</AdvancedOnly>
							</div>
						) : null}
						{caps.supportsLiquidLayers ? (
							<AdvancedOnly>
								<SpectrumLiquidLayerControls />
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
									value={store.spectrumSpiralShape}
									onChange={store.setSpectrumSpiralShape}
									labels={SPECTRUM_RADIAL_SHAPE_LABELS}
								/>
								<SliderControl
									label="Turns"
									value={store.spectrumSpiralTurns}
									{...SPECTRUM_RANGES.spiralTurns}
									onChange={store.setSpectrumSpiralTurns}
								/>
								<SliderControl
									label="Outer radius"
									value={store.spectrumSpiralOuterRadius}
									{...SPECTRUM_RANGES.spiralOuterRadius}
									onChange={
										store.setSpectrumSpiralOuterRadius
									}
								/>
								<SliderControl
									label="Tightness"
									value={store.spectrumSpiralTightness}
									{...SPECTRUM_RANGES.spiralTightness}
									onChange={store.setSpectrumSpiralTightness}
								/>
								<SliderControl
									label="Arms"
									value={store.spectrumSpiralArms}
									{...SPECTRUM_RANGES.spiralArms}
									onChange={store.setSpectrumSpiralArms}
								/>
								<SliderControl
									label="Audio → turns"
									tooltip="Audio amplitude inflates the turn count on hits"
									value={store.spectrumSpiralAudioTurns}
									{...SPECTRUM_RANGES.spiralAudioTurns}
									onChange={store.setSpectrumSpiralAudioTurns}
								/>
								<ToggleControl
									label="Logarithmic radius"
									value={store.spectrumSpiralLogarithmic}
									onChange={
										store.setSpectrumSpiralLogarithmic
									}
								/>
								<ToggleControl
									label="Gradient stroke"
									value={store.spectrumSpiralGradientStroke}
									onChange={
										store.setSpectrumSpiralGradientStroke
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
									value={store.spectrumSpiralDotShape}
									onChange={store.setSpectrumSpiralDotShape}
									labels={SPIRAL_DOT_SHAPE_LABELS}
								/>
								<SliderControl
									label="Connecting line"
									tooltip="Stroke width of the line that joins consecutive dots along the spiral arm. Drag all the way to 0 to hide the line entirely and show only the dots."
									value={store.spectrumSpiralStrokeWidth}
									{...SPECTRUM_RANGES.spiralStrokeWidth}
									onChange={
										store.setSpectrumSpiralStrokeWidth
									}
								/>
								{store.spectrumSpiralStrokeWidth > 0 ? (
									<button
										type="button"
										onClick={() =>
											store.setSpectrumSpiralStrokeWidth(
												0
											)
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
									label="Sweep speed"
									tooltip="Lower = wave lags / persists across frames (smoother motion). Higher = wave snaps to raw PCM each frame (sharper, the original brusque behavior)."
									value={
										store.spectrumOscilloscopeScrollSpeed
									}
									{...SPECTRUM_RANGES.oscilloscopeScrollSpeed}
									onChange={
										store.setSpectrumOscilloscopeScrollSpeed
									}
								/>
								<ToggleControl
									label="Reactive line width"
									value={
										store.spectrumOscilloscopeReactiveWidth
									}
									onChange={
										store.setSpectrumOscilloscopeReactiveWidth
									}
								/>
								<ToggleControl
									label="Phosphor afterglow"
									value={store.spectrumOscilloscopePhosphor}
									onChange={
										store.setSpectrumOscilloscopePhosphor
									}
								/>
								{store.spectrumOscilloscopePhosphor ? (
									<SliderControl
										label="Phosphor decay"
										tooltip="Higher values fade the trail faster. Lower values leave a long ghost trace."
										value={
											store.spectrumOscilloscopePhosphorDecay
										}
										{...SPECTRUM_RANGES.oscilloscopePhosphorDecay}
										onChange={
											store.setSpectrumOscilloscopePhosphorDecay
										}
									/>
								) : null}
								<ToggleControl
									label="CRT reticle"
									value={store.spectrumOscilloscopeGrid}
									onChange={store.setSpectrumOscilloscopeGrid}
								/>
								{store.spectrumOscilloscopeGrid ? (
									<SliderControl
										label="Grid divisions"
										value={
											store.spectrumOscilloscopeGridDivisions
										}
										{...SPECTRUM_RANGES.oscilloscopeGridDivisions}
										onChange={
											store.setSpectrumOscilloscopeGridDivisions
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
