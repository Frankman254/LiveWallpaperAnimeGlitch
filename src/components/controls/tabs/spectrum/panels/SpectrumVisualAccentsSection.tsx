import { useT } from '@/lib/i18n';
import type {
	SpectrumManualGlowMode,
	SpectrumColorMode
} from '@/types/wallpaper';
import {
	Caption,
	CollapsibleSection,
	EnumButtonGroup as EnumButtons,
	FONT,
	UI_COLORS
} from '@/ui';
import SliderControl from '../../../SliderControl';
import ToggleControl from '../../../ToggleControl';
import { SpectrumColorControls } from '../SpectrumColorControls';
import type { SpectrumInstanceSettings } from '@/types/wallpaper';
import { resolveSpectrumVisualAccentsCompat } from '@/features/spectrum/spectrumVisualAccentsCompat';

const CONTROL_LABEL_STYLE = {
	color: UI_COLORS.fgMute,
	fontFamily: FONT.mono,
	fontSize: 10,
	fontWeight: 650,
	letterSpacing: '0.1em',
	textTransform: 'uppercase'
} as const;

const GLOW_COLOR_MODES: SpectrumColorMode[] = ['solid', 'gradient'];

type VisualAccentsBinding = {
	settings: SpectrumInstanceSettings;
	update: (patch: Partial<SpectrumInstanceSettings>) => void;
};

function useVisualAccentsCompat(sp: SpectrumInstanceSettings) {
	return resolveSpectrumVisualAccentsCompat(sp);
}

/** Simple mode: Manual Glow + Neon Core toggles only. */
export function SpectrumVisualAccentsSimpleToggles({
	settings: sp,
	update
}: VisualAccentsBinding) {
	const t = useT();
	const compat = useVisualAccentsCompat(sp);

	return (
		<>
			{compat.manualGlowApplicable ? (
				<ToggleControl
					label={t.label_spectrum_manual_glow}
					value={sp.spectrumManualGlow}
					onChange={value => update({ spectrumManualGlow: value })}
				/>
			) : null}
			{compat.neonCoreApplicable ? (
				<ToggleControl
					label={t.label_spectrum_neon_core}
					value={sp.spectrumNeonCore}
					onChange={value => update({ spectrumNeonCore: value })}
				/>
			) : null}
		</>
	);
}

/** Advanced mode: full Visual Accents collapsible section. */
export function SpectrumVisualAccentsSection({
	settings: sp,
	update
}: VisualAccentsBinding) {
	const t = useT();
	const compat = useVisualAccentsCompat(sp);
	const glowModeOptions: SpectrumManualGlowMode[] = compat.supportsPeaksGlow
		? ['core-halo', 'gradient', 'peaks']
		: ['core-halo', 'gradient'];

	if (!compat.visualAccentsApplicable) return null;

	return (
		<CollapsibleSection
			title={t.label_spectrum_visual_accents}
			defaultOpen={false}
		>
			<div className="flex min-w-0 flex-col gap-2">
				{compat.manualGlowApplicable ? (
					<>
						<ToggleControl
							label={t.label_spectrum_manual_glow}
							value={sp.spectrumManualGlow}
							onChange={value =>
								update({ spectrumManualGlow: value })
							}
						/>
						{sp.spectrumManualGlow ? (
							<div className="flex min-w-0 flex-col gap-1">
								<span
									className="uppercase"
									style={CONTROL_LABEL_STYLE}
								>
									{t.label_spectrum_manual_glow_mode}
								</span>
								<EnumButtons<SpectrumManualGlowMode>
									options={glowModeOptions}
									value={sp.spectrumManualGlowMode}
									onChange={value =>
										update({
											spectrumManualGlowMode: value
										})
									}
									labels={{
										'core-halo':
											t.label_glow_mode_core_halo,
										gradient: t.label_glow_mode_gradient,
										peaks: t.label_glow_mode_peaks
									}}
								/>
								<Caption as="p">
									{sp.spectrumManualGlowMode === 'peaks'
										? t.spectrum_glow_peaks_hint
										: t.spectrum_manual_glow_hint}
								</Caption>
								<div className="mt-1 flex min-w-0 flex-col gap-2">
									<span
										className="uppercase"
										style={CONTROL_LABEL_STYLE}
									>
										{t.label_glow_colors}
									</span>
									<SpectrumColorControls
										label={t.label_color_mode}
										source={sp.spectrumGlowColorSource}
										onSourceChange={value =>
											update({
												spectrumGlowColorSource: value
											})
										}
										colorMode={sp.spectrumGlowColorMode}
										onColorModeChange={value =>
											update({
												spectrumGlowColorMode: value
											})
										}
										colorModeOptions={GLOW_COLOR_MODES}
										primaryColor={
											sp.spectrumGlowPrimaryColor
										}
										onPrimaryColorChange={value =>
											update({
												spectrumGlowPrimaryColor: value
											})
										}
										primaryLabel={t.label_primary_color}
										secondaryColor={
											sp.spectrumGlowSecondaryColor
										}
										onSecondaryColorChange={value =>
											update({
												spectrumGlowSecondaryColor:
													value
											})
										}
										secondaryLabel={t.label_secondary_color}
									/>
								</div>
							</div>
						) : null}
					</>
				) : null}

				{compat.neonCoreApplicable ? (
					<>
						<ToggleControl
							label={t.label_spectrum_neon_core}
							value={sp.spectrumNeonCore}
							onChange={value =>
								update({ spectrumNeonCore: value })
							}
						/>
						{sp.spectrumNeonCore ? (
							<>
								<SliderControl
									label={t.label_spectrum_neon_core_intensity}
									value={sp.spectrumNeonCoreIntensity}
									min={0}
									max={1}
									step={0.05}
									onChange={value =>
										update({
											spectrumNeonCoreIntensity: value
										})
									}
								/>
								<SliderControl
									label={t.label_spectrum_neon_core_width}
									value={sp.spectrumNeonCoreWidth}
									min={0.1}
									max={0.8}
									step={0.05}
									onChange={value =>
										update({
											spectrumNeonCoreWidth: value
										})
									}
								/>
								<Caption as="p">
									{t.spectrum_neon_core_hint}
								</Caption>
							</>
						) : null}
					</>
				) : null}

				{compat.rgbSplitApplicable ? (
					<>
						<ToggleControl
							label={t.label_spectrum_rgb_split}
							value={sp.spectrumRgbSplit}
							onChange={value =>
								update({ spectrumRgbSplit: value })
							}
						/>
						{sp.spectrumRgbSplit ? (
							<>
								<SliderControl
									label={t.label_spectrum_rgb_split_amount}
									value={sp.spectrumRgbSplitAmount}
									min={0}
									max={1}
									step={0.05}
									onChange={value =>
										update({
											spectrumRgbSplitAmount: value
										})
									}
								/>
								<Caption as="p">
									{t.spectrum_rgb_split_hint}
								</Caption>
							</>
						) : null}
					</>
				) : null}

				{compat.gradientFlowApplicable ? (
					<>
						<ToggleControl
							label={t.label_spectrum_gradient_flow}
							value={sp.spectrumGradientFlow}
							onChange={value =>
								update({ spectrumGradientFlow: value })
							}
						/>
						{sp.spectrumGradientFlow ? (
							<>
								<SliderControl
									label={t.label_spectrum_gradient_flow_speed}
									value={sp.spectrumGradientFlowSpeed}
									min={0}
									max={1}
									step={0.05}
									onChange={value =>
										update({
											spectrumGradientFlowSpeed: value
										})
									}
								/>
								<ToggleControl
									label={t.label_spectrum_gradient_flow_audio}
									value={sp.spectrumGradientFlowAudio}
									onChange={value =>
										update({
											spectrumGradientFlowAudio: value
										})
									}
								/>
								<EnumButtons<'forward' | 'reverse'>
									options={['forward', 'reverse']}
									value={sp.spectrumGradientFlowDirection}
									onChange={value =>
										update({
											spectrumGradientFlowDirection: value
										})
									}
									labels={{
										forward: t.label_gradient_flow_forward,
										reverse: t.label_gradient_flow_reverse
									}}
								/>
								<Caption as="p">
									{t.spectrum_gradient_flow_hint}
								</Caption>
							</>
						) : null}
					</>
				) : null}

				{compat.peakSparksApplicable ? (
					<>
						<ToggleControl
							label={t.label_spectrum_peak_sparks}
							value={sp.spectrumPeakSparks}
							onChange={value =>
								update({ spectrumPeakSparks: value })
							}
						/>
						{sp.spectrumPeakSparks ? (
							<>
								<SliderControl
									label={t.label_spectrum_peak_sparks_amount}
									value={sp.spectrumPeakSparksAmount}
									min={2}
									max={12}
									step={1}
									onChange={value =>
										update({
											spectrumPeakSparksAmount: value
										})
									}
								/>
								<SliderControl
									label={t.label_spectrum_peak_sparks_size}
									value={sp.spectrumPeakSparksSize}
									min={1}
									max={8}
									step={0.5}
									onChange={value =>
										update({
											spectrumPeakSparksSize: value
										})
									}
								/>
								<SliderControl
									label={
										t.label_spectrum_peak_sparks_threshold
									}
									value={sp.spectrumPeakSparksThreshold}
									min={0.2}
									max={0.95}
									step={0.05}
									onChange={value =>
										update({
											spectrumPeakSparksThreshold: value
										})
									}
								/>
								<Caption as="p">
									{t.spectrum_peak_sparks_hint}
								</Caption>
							</>
						) : null}
					</>
				) : null}

				{compat.echoTraceApplicable ? (
					<>
						<ToggleControl
							label={t.label_spectrum_echo_trace}
							value={sp.spectrumEchoTrace}
							onChange={value =>
								update({ spectrumEchoTrace: value })
							}
						/>
						{sp.spectrumEchoTrace ? (
							<>
								<EnumButtons<'one' | 'two'>
									options={['one', 'two']}
									value={
										sp.spectrumEchoTraceCount === 2
											? 'two'
											: 'one'
									}
									onChange={value =>
										update({
											spectrumEchoTraceCount:
												value === 'two' ? 2 : 1
										})
									}
									labels={{
										one: t.label_echo_trace_one,
										two: t.label_echo_trace_two
									}}
								/>
								<SliderControl
									label={t.label_spectrum_echo_trace_opacity}
									value={sp.spectrumEchoTraceOpacity}
									min={0.05}
									max={0.8}
									step={0.05}
									onChange={value =>
										update({
											spectrumEchoTraceOpacity: value
										})
									}
								/>
								<SliderControl
									label={t.label_spectrum_echo_trace_offset}
									value={sp.spectrumEchoTraceOffset}
									min={0}
									max={16}
									step={1}
									onChange={value =>
										update({
											spectrumEchoTraceOffset: value
										})
									}
								/>
								<SliderControl
									label={t.label_spectrum_echo_trace_decay}
									value={sp.spectrumEchoTraceDecay}
									min={0.3}
									max={0.95}
									step={0.05}
									onChange={value =>
										update({
											spectrumEchoTraceDecay: value
										})
									}
								/>
								<Caption as="p">
									{t.spectrum_echo_trace_hint}
								</Caption>
							</>
						) : null}
					</>
				) : null}
			</div>
		</CollapsibleSection>
	);
}
