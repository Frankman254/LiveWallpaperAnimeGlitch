import { useWallpaperStore } from '@/store/wallpaperStore';
import { useSpectrumTargetSettings } from '../useSpectrumTargetSettings';
import { useT } from '@/lib/i18n';
import { SPECTRUM_RANGES } from '@/config/ranges';
import { FACTORY_DEFAULT_STATE } from '@/lib/factoryDefaults';
import {
	Caption,
	CollapsibleSection,
	EnumButtonGroup as EnumButtons,
	FeatureGate,
	FONT,
	UI_COLORS
} from '@/ui';
import SliderControl from '../../../SliderControl';
import ToggleControl from '../../../ToggleControl';
import AudioChannelSelector from '../../../ui/AudioChannelSelector';
import { SpectrumFrameMemoryPresets } from '../SpectrumFrameMemoryPresets';
import { getSpectrumFamilyCapabilities } from '@/features/spectrum/spectrumFamilyCapabilities';
import {
	DEFAULT_SHOCKWAVE_BAND_THRESHOLDS,
	SHOCKWAVE_BAND_LABELS
} from '@/features/spectrum/shockwaveCalibration';
import type {
	ResolvedAudioReactiveChannel,
	SpectrumBandMode
} from '@/types/wallpaper';
import type {
	RotationDirection,
	SpectrumRotationChannel,
	SpectrumRotationDrive
} from '@/features/stageFx/stageFxConfig';

const CONTROL_LABEL_STYLE = {
	color: UI_COLORS.fgMute,
	fontFamily: FONT.mono,
	fontSize: 10,
	fontWeight: 650,
	letterSpacing: '0.1em',
	textTransform: 'uppercase'
} as const;

const ROTATION_DRIVES: SpectrumRotationDrive[] = [
	'off',
	'fixed',
	'audio',
	'fixed-audio'
];
const ROTATION_DIRECTIONS: RotationDirection[] = ['cw', 'ccw'];
const ROTATION_CHANNELS: SpectrumRotationChannel[] = [
	'kick',
	'bass',
	'full',
	'selected'
];

function isShockwaveEnabled(value: number): boolean {
	return value >= SPECTRUM_RANGES.bassShockwave.step;
}

function getSelectedShockwaveThresholdChannel(
	value: SpectrumBandMode
): ResolvedAudioReactiveChannel | null {
	return value === 'auto' ? null : value;
}

export function SpectrumFxPanel() {
	const t = useT();
	const store = useWallpaperStore();
	const { settings: sp, update, target } = useSpectrumTargetSettings();
	const caps = getSpectrumFamilyCapabilities(sp.spectrumFamily);
	const isRadial = sp.spectrumMode === 'radial';
	const rotationHasFixed =
		sp.spectrumRotationDrive === 'fixed' ||
		sp.spectrumRotationDrive === 'fixed-audio';
	const rotationHasAudio =
		sp.spectrumRotationDrive === 'audio' ||
		sp.spectrumRotationDrive === 'fixed-audio';
	const shockwaveThresholds = {
		...DEFAULT_SHOCKWAVE_BAND_THRESHOLDS,
		...sp.spectrumShockwaveBandThresholds
	};
	const selectedShockwaveThresholdChannel =
		getSelectedShockwaveThresholdChannel(sp.spectrumShockwaveBandMode);

	return (
		<div className="flex min-w-0 flex-col gap-2">
			{caps.supportsPeakHold ? (
				<>
					<ToggleControl
						label={t.label_peak_hold}
						value={sp.spectrumPeakHold}
						onChange={value => update({ spectrumPeakHold: value })}
					/>
					{sp.spectrumPeakHold ? (
						<SliderControl
							label={t.label_peak_decay}
							value={sp.spectrumPeakDecay}
							{...SPECTRUM_RANGES.peakDecay}
							onChange={value =>
								update({ spectrumPeakDecay: value })
							}
						/>
					) : null}
				</>
			) : null}

			{isRadial && caps.supportsRotation ? (
				<CollapsibleSection
					title={t.spectrum_section_radial_rotation}
					defaultOpen
					dense
				>
					<div className="flex flex-col gap-1">
						<span
							className="text-xs"
							style={{ color: 'var(--editor-accent-soft)' }}
						>
							Rotation drive
						</span>
						<EnumButtons<SpectrumRotationDrive>
							options={ROTATION_DRIVES}
							value={sp.spectrumRotationDrive}
							onChange={value =>
								update({ spectrumRotationDrive: value })
							}
							labels={{
								off: 'Off',
								fixed: 'Fixed',
								audio: 'Audio',
								'fixed-audio': 'Fixed + Audio'
							}}
						/>
					</div>
					<div className="flex flex-col gap-1">
						<span
							className="text-xs"
							style={{ color: 'var(--editor-accent-soft)' }}
						>
							{t.label_direction}
						</span>
						<EnumButtons<RotationDirection>
							options={ROTATION_DIRECTIONS}
							value={sp.spectrumRotationDirection}
							onChange={value =>
								update({ spectrumRotationDirection: value })
							}
							labels={{
								cw: t.label_clockwise,
								ccw: t.label_counterclockwise
							}}
						/>
					</div>
					<ToggleControl
						label="Invert on low energy"
						value={sp.spectrumRotationInvertOnLowEnergy}
						onChange={value =>
							update({ spectrumRotationInvertOnLowEnergy: value })
						}
					/>
					{sp.spectrumRotationInvertOnLowEnergy ? (
						<>
							<SliderControl
								label="Low energy threshold"
								value={sp.spectrumRotationInvertThreshold}
								{...SPECTRUM_RANGES.rotationInvertThreshold}
								onChange={value =>
									update({
										spectrumRotationInvertThreshold: value
									})
								}
								defaultValue={
									FACTORY_DEFAULT_STATE.spectrumRotationInvertThreshold
								}
							/>
							<SliderControl
								label="Direction hold"
								value={sp.spectrumRotationInvertHoldMs}
								{...SPECTRUM_RANGES.rotationInvertHoldMs}
								onChange={value =>
									update({
										spectrumRotationInvertHoldMs: value
									})
								}
								defaultValue={
									FACTORY_DEFAULT_STATE.spectrumRotationInvertHoldMs
								}
								unit="ms"
							/>
							<Caption
								as="p"
								style={{
									color: 'var(--editor-accent-muted)'
								}}
							>
								When the selected rotation band falls below this
								level, radial rotation flips direction until the
								band rises again.
							</Caption>
						</>
					) : null}
					{rotationHasFixed ? (
						<SliderControl
							label="Base rotation speed"
							value={Math.abs(sp.spectrumRotationSpeed)}
							{...{ ...SPECTRUM_RANGES.rotationSpeed, min: 0 }}
							onChange={value =>
								update({ spectrumRotationSpeed: value })
							}
							defaultValue={Math.abs(
								FACTORY_DEFAULT_STATE.spectrumRotationSpeed
							)}
						/>
					) : null}
					{rotationHasAudio ? (
						<>
							<SliderControl
								label="Audio rotation amount"
								value={sp.spectrumRotationAudioAmount}
								min={0}
								max={4}
								step={0.01}
								onChange={value =>
									update({
										spectrumRotationAudioAmount: value
									})
								}
								defaultValue={
									FACTORY_DEFAULT_STATE.spectrumRotationAudioAmount
								}
							/>
							<div className="flex flex-col gap-1">
								<span
									className="text-xs"
									style={{
										color: 'var(--editor-accent-soft)'
									}}
								>
									Audio channel
								</span>
								<EnumButtons<SpectrumRotationChannel>
									options={ROTATION_CHANNELS}
									value={sp.spectrumRotationChannel}
									onChange={value =>
										update({
											spectrumRotationChannel: value
										})
									}
									labels={{
										kick: 'Kick',
										bass: 'Bass',
										full: 'Full',
										selected: 'Selected'
									}}
								/>
							</div>
							<SliderControl
								label="Rotation smoothing"
								value={sp.spectrumRotationSmoothing}
								min={0}
								max={0.98}
								step={0.01}
								onChange={value =>
									update({ spectrumRotationSmoothing: value })
								}
								defaultValue={
									FACTORY_DEFAULT_STATE.spectrumRotationSmoothing
								}
							/>
						</>
					) : null}
				</CollapsibleSection>
			) : null}

			<CollapsibleSection title={t.spectrum_section_frame_memory} dense>
				<div className="flex min-w-0 flex-col gap-2">
					<ToggleControl
						label={t.label_enabled}
						value={sp.spectrumFrameMemoryEnabled}
						onChange={value =>
							update({ spectrumFrameMemoryEnabled: value })
						}
					/>
					<FeatureGate
						enabled={sp.spectrumFrameMemoryEnabled}
						hint={t.hint_enable_to_configure}
					>
						<div className="flex flex-col gap-1">
							<span
								className="uppercase"
								style={CONTROL_LABEL_STYLE}
							>
								{t.label_spectrum_frame_presets}
							</span>
							<SpectrumFrameMemoryPresets target={target} />
							<Caption
								as="p"
								style={{ color: 'var(--editor-accent-muted)' }}
							>
								{t.hint_spectrum_frame_presets}
							</Caption>
						</div>
						{store.performanceMode === 'low' ? (
							<Caption
								as="p"
								style={{ color: 'var(--editor-accent-muted)' }}
							>
								Performance: <strong>Low</strong>. Afterglow /
								Motion Trails blur run at 30% intensity to
								protect GPU; History depth is capped by the
								active visual quality tier (see slider hint).
								Switch to Medium/High in Perf for the full
								effect.
							</Caption>
						) : null}
						<SliderControl
							label="Afterglow"
							value={sp.spectrumAfterglow}
							{...SPECTRUM_RANGES.afterglow}
							onChange={value =>
								update({ spectrumAfterglow: value })
							}
						/>
						<SliderControl
							label="Motion Trails"
							value={sp.spectrumMotionTrails}
							{...SPECTRUM_RANGES.motionTrails}
							onChange={value =>
								update({ spectrumMotionTrails: value })
							}
						/>
						<SliderControl
							label="Ghost Frames"
							value={sp.spectrumGhostFrames}
							{...SPECTRUM_RANGES.ghostFrames}
							onChange={value =>
								update({ spectrumGhostFrames: value })
							}
						/>
						<SliderControl
							label="History depth"
							tooltip="How many past frames stack into the ghost / motion-trail composite. Higher = longer visual memory + more GPU cost. The active visual quality tier still caps the effective depth (minimal tier tops out at 2)."
							value={sp.spectrumFrameHistoryDepth}
							{...SPECTRUM_RANGES.frameHistoryDepth}
							onChange={value =>
								update({ spectrumFrameHistoryDepth: value })
							}
						/>
						{sp.spectrumGhostFrames > 0.35 ? (
							<Caption
								as="p"
								style={{ color: 'var(--editor-accent-muted)' }}
							>
								High ghost-frame values can accumulate into a
								white blowout — try Safe preset or lower
								Afterglow / Glow.
							</Caption>
						) : null}
					</FeatureGate>
					<div className="flex min-w-0 flex-col gap-2">
						<ToggleControl
							label="Peak Ribbons"
							value={sp.spectrumPeakRibbonsEnabled}
							onChange={value =>
								update({ spectrumPeakRibbonsEnabled: value })
							}
						/>
						<FeatureGate
							enabled={sp.spectrumPeakRibbonsEnabled}
							hint={t.hint_enable_to_configure}
						>
							<SliderControl
								label="Intensity"
								value={sp.spectrumPeakRibbons}
								{...SPECTRUM_RANGES.peakRibbons}
								onChange={value =>
									update({ spectrumPeakRibbons: value })
								}
							/>
							{sp.spectrumPeakRibbons > 0.001 ? (
								<SliderControl
									label={t.label_peak_ribbon_angle}
									value={sp.spectrumPeakRibbonAngle}
									{...SPECTRUM_RANGES.peakRibbonAngle}
									onChange={value =>
										update({
											spectrumPeakRibbonAngle: value
										})
									}
									unit="deg"
								/>
							) : null}
						</FeatureGate>
						<ToggleControl
							label="Energy Bloom"
							value={sp.spectrumEnergyBloomEnabled}
							onChange={value =>
								update({ spectrumEnergyBloomEnabled: value })
							}
						/>
						<FeatureGate
							enabled={sp.spectrumEnergyBloomEnabled}
							hint={t.hint_enable_to_configure}
						>
							<SliderControl
								label="Intensity"
								value={sp.spectrumEnergyBloom}
								{...SPECTRUM_RANGES.energyBloom}
								onChange={value =>
									update({ spectrumEnergyBloom: value })
								}
							/>
						</FeatureGate>
					</div>
				</div>
			</CollapsibleSection>

			{caps.supportsShockwave ? (
				<CollapsibleSection
					title={t.spectrum_section_bass_shockwave}
					dense
				>
					<div className="flex min-w-0 flex-col gap-2">
						<Caption
							as="p"
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							{t.hint_bass_shockwave}
						</Caption>
						<ToggleControl
							label="Bass Shockwave"
							value={sp.spectrumBassShockwaveEnabled}
							onChange={value =>
								update({ spectrumBassShockwaveEnabled: value })
							}
						/>
						<FeatureGate
							enabled={sp.spectrumBassShockwaveEnabled}
							hint={t.hint_enable_to_configure}
						>
							<AudioChannelSelector
								value={sp.spectrumShockwaveBandMode}
								onChange={value =>
									update({ spectrumShockwaveBandMode: value })
								}
								label={t.label_shockwave_band_mode}
							/>
							<SliderControl
								label="Intensity"
								value={sp.spectrumBassShockwave}
								{...SPECTRUM_RANGES.bassShockwave}
								onChange={value =>
									update({ spectrumBassShockwave: value })
								}
							/>
							{isShockwaveEnabled(sp.spectrumBassShockwave) ? (
								<>
									<div className="space-y-1">
										<div className="text-[11px] opacity-70">
											{t.label_shockwave_color_mode}
										</div>
										<EnumButtons<
											'cycle' | 'primary' | 'secondary'
										>
											value={
												sp.spectrumShockwaveColorMode
											}
											options={[
												'cycle',
												'primary',
												'secondary'
											]}
											labels={{
												cycle: t.label_shockwave_color_cycle,
												primary:
													t.label_shockwave_color_primary,
												secondary:
													t.label_shockwave_color_secondary
											}}
											onChange={value =>
												update({
													spectrumShockwaveColorMode:
														value
												})
											}
										/>
									</div>
									<SliderControl
										label={t.label_shockwave_thickness}
										value={sp.spectrumShockwaveThickness}
										{...SPECTRUM_RANGES.shockwaveThickness}
										onChange={value =>
											update({
												spectrumShockwaveThickness:
													value
											})
										}
									/>
									<SliderControl
										label={t.label_shockwave_opacity}
										value={sp.spectrumShockwaveOpacity}
										{...SPECTRUM_RANGES.shockwaveOpacity}
										onChange={value =>
											update({
												spectrumShockwaveOpacity: value
											})
										}
									/>
									<SliderControl
										label={t.label_shockwave_blur}
										value={sp.spectrumShockwaveBlur}
										{...SPECTRUM_RANGES.shockwaveBlur}
										onChange={value =>
											update({
												spectrumShockwaveBlur: value
											})
										}
									/>
									{selectedShockwaveThresholdChannel ? (
										<div className="flex min-w-0 flex-col gap-1.5">
											<span style={CONTROL_LABEL_STYLE}>
												Selected band trigger
											</span>
											<Caption
												as="p"
												style={{
													color: 'var(--editor-accent-muted)'
												}}
											>
												Lower values make this band
												create shockwave lines more
												easily.
											</Caption>
											<SliderControl
												label={`${SHOCKWAVE_BAND_LABELS[selectedShockwaveThresholdChannel]} threshold`}
												value={
													shockwaveThresholds[
														selectedShockwaveThresholdChannel
													]
												}
												{...SPECTRUM_RANGES.shockwaveBandThreshold}
												defaultValue={
													DEFAULT_SHOCKWAVE_BAND_THRESHOLDS[
														selectedShockwaveThresholdChannel
													]
												}
												onChange={value =>
													update({
														spectrumShockwaveBandThresholds:
															{
																...shockwaveThresholds,
																[selectedShockwaveThresholdChannel]:
																	value
															}
													})
												}
											/>
										</div>
									) : (
										<Caption
											as="p"
											style={{
												color: 'var(--editor-accent-muted)'
											}}
										>
											Auto switches bands at runtime.
											Select a specific band to tune its
											trigger threshold.
										</Caption>
									)}
								</>
							) : null}
						</FeatureGate>
					</div>
				</CollapsibleSection>
			) : null}
		</div>
	);
}
