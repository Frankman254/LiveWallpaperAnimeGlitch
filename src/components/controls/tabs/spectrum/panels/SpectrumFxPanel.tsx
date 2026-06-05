import { useWallpaperStore } from '@/store/wallpaperStore';
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
	const caps = getSpectrumFamilyCapabilities(store.spectrumFamily);
	const isRadial = store.spectrumMode === 'radial';
	const rotationHasFixed =
		store.spectrumRotationDrive === 'fixed' ||
		store.spectrumRotationDrive === 'fixed-audio';
	const rotationHasAudio =
		store.spectrumRotationDrive === 'audio' ||
		store.spectrumRotationDrive === 'fixed-audio';
	const shockwaveThresholds = {
		...DEFAULT_SHOCKWAVE_BAND_THRESHOLDS,
		...store.spectrumShockwaveBandThresholds
	};
	const selectedShockwaveThresholdChannel =
		getSelectedShockwaveThresholdChannel(store.spectrumShockwaveBandMode);

	return (
		<div className="flex min-w-0 flex-col gap-2">
			{caps.supportsPeakHold ? (
				<>
					<ToggleControl
						label={t.label_peak_hold}
						value={store.spectrumPeakHold}
						onChange={store.setSpectrumPeakHold}
					/>
					{store.spectrumPeakHold ? (
						<SliderControl
							label={t.label_peak_decay}
							value={store.spectrumPeakDecay}
							{...SPECTRUM_RANGES.peakDecay}
							onChange={store.setSpectrumPeakDecay}
						/>
					) : null}
				</>
			) : null}

			{isRadial && caps.supportsRotation ? (
				<CollapsibleSection title="Radial rotation" defaultOpen dense>
					<div className="flex flex-col gap-1">
						<span
							className="text-xs"
							style={{ color: 'var(--editor-accent-soft)' }}
						>
							Rotation drive
						</span>
						<EnumButtons<SpectrumRotationDrive>
							options={ROTATION_DRIVES}
							value={store.spectrumRotationDrive}
							onChange={store.setSpectrumRotationDrive}
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
							value={store.spectrumRotationDirection}
							onChange={store.setSpectrumRotationDirection}
							labels={{
								cw: t.label_clockwise,
								ccw: t.label_counterclockwise
							}}
						/>
					</div>
					{rotationHasFixed ? (
						<SliderControl
							label="Base rotation speed"
							value={Math.abs(store.spectrumRotationSpeed)}
							{...{ ...SPECTRUM_RANGES.rotationSpeed, min: 0 }}
							onChange={store.setSpectrumRotationSpeed}
							defaultValue={Math.abs(
								FACTORY_DEFAULT_STATE.spectrumRotationSpeed
							)}
						/>
					) : null}
					{rotationHasAudio ? (
						<>
							<SliderControl
								label="Audio rotation amount"
								value={store.spectrumRotationAudioAmount}
								min={0}
								max={4}
								step={0.01}
								onChange={store.setSpectrumRotationAudioAmount}
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
									value={store.spectrumRotationChannel}
									onChange={store.setSpectrumRotationChannel}
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
								value={store.spectrumRotationSmoothing}
								min={0}
								max={0.98}
								step={0.01}
								onChange={store.setSpectrumRotationSmoothing}
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
						value={store.spectrumFrameMemoryEnabled}
						onChange={store.setSpectrumFrameMemoryEnabled}
					/>
					<FeatureGate
						enabled={store.spectrumFrameMemoryEnabled}
						hint={t.hint_enable_to_configure}
					>
					<div className="flex flex-col gap-1">
						<span className="uppercase" style={CONTROL_LABEL_STYLE}>
							{t.label_spectrum_frame_presets}
						</span>
						<SpectrumFrameMemoryPresets target="main" />
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
							Motion Trails blur run at 30% intensity to protect
							GPU; History depth is capped by the active visual
							quality tier (see slider hint). Switch to
							Medium/High in Perf for the full effect.
						</Caption>
					) : null}
					<SliderControl
						label="Afterglow"
						value={store.spectrumAfterglow}
						{...SPECTRUM_RANGES.afterglow}
						onChange={store.setSpectrumAfterglow}
					/>
					<SliderControl
						label="Motion Trails"
						value={store.spectrumMotionTrails}
						{...SPECTRUM_RANGES.motionTrails}
						onChange={store.setSpectrumMotionTrails}
					/>
					<SliderControl
						label="Ghost Frames"
						value={store.spectrumGhostFrames}
						{...SPECTRUM_RANGES.ghostFrames}
						onChange={store.setSpectrumGhostFrames}
					/>
					<SliderControl
						label="History depth"
						tooltip="How many past frames stack into the ghost / motion-trail composite. Higher = longer visual memory + more GPU cost. The active visual quality tier still caps the effective depth (minimal tier tops out at 2)."
						value={store.spectrumFrameHistoryDepth}
						{...SPECTRUM_RANGES.frameHistoryDepth}
						onChange={store.setSpectrumFrameHistoryDepth}
					/>
					{store.spectrumGhostFrames > 0.35 ? (
						<Caption
							as="p"
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							High ghost-frame values can accumulate into a white
							blowout — try Safe preset or lower Afterglow / Glow.
						</Caption>
					) : null}
					</FeatureGate>
					<div className="flex min-w-0 flex-col gap-2">
						<SliderControl
							label="Peak Ribbons"
							value={store.spectrumPeakRibbons}
							{...SPECTRUM_RANGES.peakRibbons}
							onChange={store.setSpectrumPeakRibbons}
						/>
						{store.spectrumPeakRibbons > 0.001 ? (
							<SliderControl
								label={t.label_peak_ribbon_angle}
								value={store.spectrumPeakRibbonAngle}
								{...SPECTRUM_RANGES.peakRibbonAngle}
								onChange={store.setSpectrumPeakRibbonAngle}
								unit="deg"
							/>
						) : null}
						<SliderControl
							label="Energy Bloom"
							value={store.spectrumEnergyBloom}
							{...SPECTRUM_RANGES.energyBloom}
							onChange={store.setSpectrumEnergyBloom}
						/>
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
						<AudioChannelSelector
							value={store.spectrumShockwaveBandMode}
							onChange={store.setSpectrumShockwaveBandMode}
							label={t.label_shockwave_band_mode}
						/>
						<SliderControl
							label="Bass Shockwave"
							value={store.spectrumBassShockwave}
							{...SPECTRUM_RANGES.bassShockwave}
							onChange={store.setSpectrumBassShockwave}
						/>
						{isShockwaveEnabled(store.spectrumBassShockwave) ? (
							<>
								<div className="space-y-1">
									<div className="text-[11px] opacity-70">
										{t.label_shockwave_color_mode}
									</div>
									<EnumButtons<
										'cycle' | 'primary' | 'secondary'
									>
										value={store.spectrumShockwaveColorMode}
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
										onChange={
											store.setSpectrumShockwaveColorMode
										}
									/>
								</div>
								<SliderControl
									label={t.label_shockwave_thickness}
									value={store.spectrumShockwaveThickness}
									{...SPECTRUM_RANGES.shockwaveThickness}
									onChange={
										store.setSpectrumShockwaveThickness
									}
								/>
								<SliderControl
									label={t.label_shockwave_opacity}
									value={store.spectrumShockwaveOpacity}
									{...SPECTRUM_RANGES.shockwaveOpacity}
									onChange={store.setSpectrumShockwaveOpacity}
								/>
								<SliderControl
									label={t.label_shockwave_blur}
									value={store.spectrumShockwaveBlur}
									{...SPECTRUM_RANGES.shockwaveBlur}
									onChange={store.setSpectrumShockwaveBlur}
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
											Lower values make this band create
											shockwave lines more easily.
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
												store.setSpectrumShockwaveBandThreshold(
													selectedShockwaveThresholdChannel,
													value
												)
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
										Auto switches bands at runtime. Select a
										specific band to tune its trigger
										threshold.
									</Caption>
								)}
							</>
						) : null}
					</div>
				</CollapsibleSection>
			) : null}
		</div>
	);
}
