import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { SPECTRUM_RANGES } from '@/config/ranges';
import {
	Caption,
	CollapsibleSection,
	EnumButtonGroup as EnumButtons,
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
	SHOCKWAVE_BAND_LABELS,
	SHOCKWAVE_THRESHOLD_CHANNELS
} from '@/features/spectrum/shockwaveCalibration';

const CONTROL_LABEL_STYLE = {
	color: UI_COLORS.fgMute,
	fontFamily: FONT.mono,
	fontSize: 10,
	fontWeight: 650,
	letterSpacing: '0.1em',
	textTransform: 'uppercase'
} as const;

type RotationDirectionOption = 'clockwise' | 'counterclockwise';
const ROTATION_DIRECTIONS: RotationDirectionOption[] = [
	'clockwise',
	'counterclockwise'
];

function getRotationDirection(value: number): RotationDirectionOption {
	return value < 0 ? 'counterclockwise' : 'clockwise';
}

function applyRotationDirection(
	speed: number,
	direction: RotationDirectionOption
): number {
	const magnitude = Math.abs(speed);
	return direction === 'counterclockwise' ? -magnitude : magnitude;
}

function isShockwaveEnabled(value: number): boolean {
	return value >= SPECTRUM_RANGES.bassShockwave.step;
}

export function SpectrumFxPanel() {
	const t = useT();
	const store = useWallpaperStore();
	const caps = getSpectrumFamilyCapabilities(store.spectrumFamily);
	const isRadial = store.spectrumMode === 'radial';
	const mainRotationDirection = getRotationDirection(
		store.spectrumRotationSpeed
	);
	const shockwaveThresholds = {
		...DEFAULT_SHOCKWAVE_BAND_THRESHOLDS,
		...store.spectrumShockwaveBandThresholds
	};

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
				<>
					<div className="flex flex-col gap-1">
						<span
							className="text-xs"
							style={{ color: 'var(--editor-accent-soft)' }}
						>
							{t.label_direction}
						</span>
						<EnumButtons<RotationDirectionOption>
							options={ROTATION_DIRECTIONS}
							value={mainRotationDirection}
							onChange={value =>
								store.setSpectrumRotationSpeed(
									applyRotationDirection(
										store.spectrumRotationSpeed,
										value
									)
								)
							}
							labels={{
								clockwise: t.label_clockwise,
								counterclockwise: t.label_counterclockwise
							}}
						/>
					</div>
					<SliderControl
						label={t.label_rotation_speed}
						value={Math.abs(store.spectrumRotationSpeed)}
						{...{ ...SPECTRUM_RANGES.rotationSpeed, min: 0 }}
						onChange={value =>
							store.setSpectrumRotationSpeed(
								applyRotationDirection(
									value,
									mainRotationDirection
								)
							)
						}
					/>
				</>
			) : null}

			<CollapsibleSection title="Frame memory" dense>
				<div className="flex min-w-0 flex-col gap-2">
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
				<CollapsibleSection title="Bass shockwave" dense>
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
								<div className="flex min-w-0 flex-col gap-1.5">
									<span style={CONTROL_LABEL_STYLE}>
										Band trigger thresholds
									</span>
									<Caption
										as="p"
										style={{
											color: 'var(--editor-accent-muted)'
										}}
									>
										Lower values make that band create
										shockwave lines more easily.
									</Caption>
									{SHOCKWAVE_THRESHOLD_CHANNELS.map(
										channel => (
											<SliderControl
												key={channel}
												label={`${SHOCKWAVE_BAND_LABELS[channel]} threshold`}
												value={
													shockwaveThresholds[channel]
												}
												{...SPECTRUM_RANGES.shockwaveBandThreshold}
												onChange={value =>
													store.setSpectrumShockwaveBandThreshold(
														channel,
														value
													)
												}
											/>
										)
									)}
								</div>
							</>
						) : null}
					</div>
				</CollapsibleSection>
			) : null}
		</div>
	);
}
