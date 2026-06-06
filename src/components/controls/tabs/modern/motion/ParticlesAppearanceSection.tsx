import { AUDIO_REACTIVE_CHANNELS } from '@/lib/audio/audioChannels';
import {
	AUDIO_ROUTING_RANGES,
	LOGO_RANGES,
	PARTICLE_FILTER_RANGES,
	PARTICLE_RANGES
} from '@/config/ranges';
import { useT } from '@/lib/i18n';
import type {
	AudioReactiveChannel,
	ColorSourceMode,
	ParticleAudioDriftMode,
	ParticleColorMode,
	ParticleDepthFlowDirection,
	ParticleDepthFlowMode,
	ParticleRotationDirection
} from '@/types/wallpaper';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';
import { CollapsibleSection, SectionCard, UI_COLORS } from '@/ui';

import {
	ColorField,
	MotionSlider as Slider,
	OptionButtonGroup,
	ProfileSlotsGrid,
	SwitchRow
} from './MotionSharedControls';
import {
	COLOR_SOURCES,
	PARTICLE_COLOR_MODES,
	PARTICLE_ROTATION_DIRECTIONS,
	formatDecimal,
	formatInteger
} from './motionTabUtils';

type ParticlesAppearanceStore = Pick<
	WallpaperStore,
	| 'particleColorMode'
	| 'particleColorSource'
	| 'particleColor1'
	| 'particleColor2'
	| 'particleOpacity'
	| 'particleSizeMin'
	| 'particleSizeMax'
	| 'particleFadeInOut'
	| 'particleGlow'
	| 'particleGlowStrength'
	| 'particleRotationIntensity'
	| 'particleRotationDirection'
	| 'particleFilterBrightness'
	| 'particleFilterContrast'
	| 'particleFilterSaturation'
	| 'particleFilterBlur'
	| 'particleFilterHueRotate'
	| 'particleAudioReactive'
	| 'particleAudioChannel'
	| 'particleAudioSmoothing'
	| 'particleAudioSizeBoost'
	| 'particleAudioOpacityBoost'
	| 'particleAudioAttack'
	| 'particleAudioRelease'
	| 'particleAudioReactivitySpeed'
	| 'particleAudioPeakWindow'
	| 'particleAudioPeakFloor'
	| 'particleAudioPunch'
	| 'particleAudioDriftEnabled'
	| 'particleAudioDriftAngle'
	| 'particleAudioDriftAmount'
	| 'particleAudioDriftBase'
	| 'particleAudioDriftChannel'
	| 'particleAudioDriftThreshold'
	| 'particleAudioDriftRelease'
	| 'particleAudioDriftMode'
	| 'particleDepthFlowEnabled'
	| 'particleDepthFlowAmount'
	| 'particleDepthFlowDirection'
	| 'particleDepthFlowChannel'
	| 'particleDepthFlowThreshold'
	| 'particleDepthFlowSensitivity'
	| 'particleDepthFlowAttack'
	| 'particleDepthFlowRelease'
	| 'particleDepthFlowSpeed'
	| 'particleDepthFlowSpread'
	| 'particleDepthFlowFocusX'
	| 'particleDepthFlowFocusY'
	| 'particleDepthFlowMode'
	| 'particlesProfileSlots'
	| 'setParticleColorMode'
	| 'setParticleColorSource'
	| 'setParticleColor1'
	| 'setParticleColor2'
	| 'setParticleOpacity'
	| 'setParticleSizeMin'
	| 'setParticleSizeMax'
	| 'setParticleFadeInOut'
	| 'setParticleGlow'
	| 'setParticleGlowStrength'
	| 'setParticleRotationIntensity'
	| 'setParticleRotationDirection'
	| 'setParticleFilterBrightness'
	| 'setParticleFilterContrast'
	| 'setParticleFilterSaturation'
	| 'setParticleFilterBlur'
	| 'setParticleFilterHueRotate'
	| 'setParticleAudioReactive'
	| 'setParticleAudioChannel'
	| 'setParticleAudioSmoothing'
	| 'setParticleAudioSizeBoost'
	| 'setParticleAudioOpacityBoost'
	| 'setParticleAudioAttack'
	| 'setParticleAudioRelease'
	| 'setParticleAudioReactivitySpeed'
	| 'setParticleAudioPeakWindow'
	| 'setParticleAudioPeakFloor'
	| 'setParticleAudioPunch'
	| 'setParticleAudioDriftEnabled'
	| 'setParticleAudioDriftAngle'
	| 'setParticleAudioDriftAmount'
	| 'setParticleAudioDriftBase'
	| 'setParticleAudioDriftChannel'
	| 'setParticleAudioDriftThreshold'
	| 'setParticleAudioDriftRelease'
	| 'setParticleAudioDriftMode'
	| 'setParticleDepthFlowEnabled'
	| 'setParticleDepthFlowAmount'
	| 'setParticleDepthFlowDirection'
	| 'setParticleDepthFlowChannel'
	| 'setParticleDepthFlowThreshold'
	| 'setParticleDepthFlowSensitivity'
	| 'setParticleDepthFlowAttack'
	| 'setParticleDepthFlowRelease'
	| 'setParticleDepthFlowSpeed'
	| 'setParticleDepthFlowSpread'
	| 'setParticleDepthFlowFocusX'
	| 'setParticleDepthFlowFocusY'
	| 'setParticleDepthFlowMode'
	| 'loadParticlesProfileSlot'
	| 'saveParticlesProfileSlot'
	| 'addParticlesProfileSlot'
	| 'removeParticlesProfileSlot'
>;

export function ParticlesAppearanceSection({
	store,
	particleColorModeLabels,
	colorSourceLabels,
	particleRotationLabels,
	audioChannelLabels,
	labels,
	isSimple = false
}: {
	store: ParticlesAppearanceStore;
	particleColorModeLabels: Record<ParticleColorMode, string>;
	colorSourceLabels: Record<ColorSourceMode, string>;
	particleRotationLabels: Record<ParticleRotationDirection, string>;
	audioChannelLabels: Record<AudioReactiveChannel, string>;
	isSimple?: boolean;
	labels: {
		title: string;
		subtitle: string;
		colorMode: string;
		colorSource: string;
		color1: string;
		color2: string;
		themeHint: string;
		imageHint: string;
		opacity: string;
		particleDetails: string;
		sizeMin: string;
		sizeMax: string;
		fadeInOut: string;
		glow: string;
		glowStrength: string;
		motionFilters: string;
		rotationIntensity: string;
		direction: string;
		brightness: string;
		contrast: string;
		saturation: string;
		blur: string;
		hueRotate: string;
		audioResponse: string;
		audioReactive: string;
		audioChannel: string;
		audioSizeBoost: string;
		audioOpacityBoost: string;
		audioDirectionalDrift: string;
		audioDirectionalDriftHint: string;
		audioDriftMode: string;
		audioDriftAngle: string;
		audioDriftAmount: string;
		audioDriftBase: string;
		audioDriftThreshold: string;
		audioDriftRelease: string;
		depthFlow: string;
		depthFlowHint: string;
		depthFlowDirection: string;
		depthFlowMode: string;
		depthFlowAmount: string;
		depthFlowFocusX: string;
		depthFlowFocusY: string;
		depthFlowThreshold: string;
		depthFlowSensitivity: string;
		depthFlowAttack: string;
		depthFlowRelease: string;
		depthFlowSpeed: string;
		depthFlowSpread: string;
		savedProfiles: string;
		load: string;
		save: string;
		slot: string;
		empty: string;
		active: string;
	};
}) {
	const t = useT();

	const driftModeLabels: Record<ParticleAudioDriftMode, string> = {
		velocity: t.particle_drift_mode_velocity,
		offset: t.particle_drift_mode_offset,
		burst: t.particle_drift_mode_burst
	};
	const driftModeOptions = ['velocity', 'offset', 'burst'] as const;

	const depthDirectionLabels: Record<ParticleDepthFlowDirection, string> = {
		towardViewer: t.particle_depth_direction_toward,
		awayFromViewer: t.particle_depth_direction_away
	};
	const depthDirectionOptions = ['towardViewer', 'awayFromViewer'] as const;

	const depthModeLabels: Record<ParticleDepthFlowMode, string> = {
		pullToCamera: t.particle_depth_mode_pull_to_camera,
		pushFromFocus: t.particle_depth_mode_push_from_focus,
		tunnelBurst: t.particle_depth_mode_tunnel_burst,
		snowRush: t.particle_depth_mode_snow_rush
	};
	const depthModeOptions = [
		'pullToCamera',
		'pushFromFocus',
		'tunnelBurst',
		'snowRush'
	] as const;

	return (
		<SectionCard
			title={labels.title}
			subtitle={labels.subtitle}
			density="compact"
		>
			<div className="flex flex-col gap-3">
				{/* ── Colors ── */}
				<OptionButtonGroup<ParticleColorMode>
					label={labels.colorMode}
					options={PARTICLE_COLOR_MODES}
					value={store.particleColorMode}
					onChange={store.setParticleColorMode}
					labels={particleColorModeLabels}
					columns={2}
				/>
				<OptionButtonGroup<ColorSourceMode>
					label={labels.colorSource}
					options={COLOR_SOURCES}
					value={store.particleColorSource}
					onChange={store.setParticleColorSource}
					labels={colorSourceLabels}
					columns={3}
				/>
				{store.particleColorSource === 'manual' &&
				store.particleColorMode !== 'rainbow' &&
				store.particleColorMode !== 'rotateRgb' ? (
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
						<ColorField
							label={labels.color1}
							value={store.particleColor1}
							onChange={store.setParticleColor1}
						/>
						<ColorField
							label={labels.color2}
							value={store.particleColor2}
							onChange={store.setParticleColor2}
						/>
					</div>
				) : (
					<span
						className="text-[11px]"
						style={{ color: UI_COLORS.fgMute }}
					>
						{store.particleColorSource === 'theme'
							? labels.themeHint
							: labels.imageHint}
					</span>
				)}
				<Slider
					label={labels.opacity}
					value={store.particleOpacity}
					{...PARTICLE_RANGES.opacity}
					onChange={store.setParticleOpacity}
					variant="compact"
					formatValue={formatDecimal}
				/>

				{/* ── Particle Details ── */}
				<CollapsibleSection
					title={labels.particleDetails}
					defaultOpen={false}
					dense
				>
					<div className="flex flex-col gap-3">
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<Slider
								label={labels.sizeMin}
								value={store.particleSizeMin}
								{...PARTICLE_RANGES.sizeMin}
								onChange={store.setParticleSizeMin}
								variant="compact"
								formatValue={formatDecimal}
							/>
							<Slider
								label={labels.sizeMax}
								value={store.particleSizeMax}
								{...PARTICLE_RANGES.sizeMax}
								onChange={store.setParticleSizeMax}
								variant="compact"
								formatValue={formatDecimal}
							/>
						</div>
						<span
							className="text-[11px]"
							style={{ color: UI_COLORS.fgMute }}
						>
							{t.hint_particle_size_cap}
						</span>
						<SwitchRow
							label={labels.fadeInOut}
							checked={store.particleFadeInOut}
							onChange={store.setParticleFadeInOut}
						/>
						<SwitchRow
							label={labels.glow}
							checked={store.particleGlow}
							onChange={store.setParticleGlow}
						/>
						{store.particleGlow ? (
							<Slider
								label={labels.glowStrength}
								value={store.particleGlowStrength}
								{...PARTICLE_RANGES.glowStrength}
								onChange={store.setParticleGlowStrength}
								variant="compact"
								formatValue={formatDecimal}
							/>
						) : null}
					</div>
				</CollapsibleSection>

				{/* ── Motion & Filters ── */}
				<CollapsibleSection
					title={labels.motionFilters}
					defaultOpen={false}
					dense
				>
					<div className="flex flex-col gap-3">
						<Slider
							label={labels.rotationIntensity}
							value={store.particleRotationIntensity}
							{...PARTICLE_RANGES.rotationIntensity}
							onChange={store.setParticleRotationIntensity}
							variant="compact"
							formatValue={formatDecimal}
						/>
						{store.particleRotationIntensity > 0 ? (
							<OptionButtonGroup<ParticleRotationDirection>
								label={labels.direction}
								options={PARTICLE_ROTATION_DIRECTIONS}
								value={store.particleRotationDirection}
								onChange={store.setParticleRotationDirection}
								labels={particleRotationLabels}
								columns={2}
							/>
						) : null}
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<Slider
								label={labels.brightness}
								value={store.particleFilterBrightness}
								{...PARTICLE_FILTER_RANGES.brightness}
								onChange={store.setParticleFilterBrightness}
								variant="compact"
								formatValue={formatDecimal}
							/>
							<Slider
								label={labels.contrast}
								value={store.particleFilterContrast}
								{...PARTICLE_FILTER_RANGES.contrast}
								onChange={store.setParticleFilterContrast}
								variant="compact"
								formatValue={formatDecimal}
							/>
							<Slider
								label={labels.saturation}
								value={store.particleFilterSaturation}
								{...PARTICLE_FILTER_RANGES.saturation}
								onChange={store.setParticleFilterSaturation}
								variant="compact"
								formatValue={formatDecimal}
							/>
							<Slider
								label={labels.blur}
								value={store.particleFilterBlur}
								{...PARTICLE_FILTER_RANGES.blur}
								onChange={store.setParticleFilterBlur}
								unit="px"
								variant="compact"
								formatValue={formatDecimal}
							/>
							<Slider
								label={labels.hueRotate}
								value={store.particleFilterHueRotate}
								{...PARTICLE_FILTER_RANGES.hueRotate}
								onChange={store.setParticleFilterHueRotate}
								unit="deg"
								variant="compact"
								formatValue={formatInteger}
							/>
						</div>
					</div>
				</CollapsibleSection>

				{/* ── Audio Directional Drift ── */}
				<SwitchRow
					label={labels.audioDirectionalDrift}
					checked={store.particleAudioDriftEnabled}
					onChange={store.setParticleAudioDriftEnabled}
				/>
				{store.particleAudioDriftEnabled ? (
					<>
						<span
							className="text-[11px]"
							style={{ color: UI_COLORS.fgMute }}
						>
							{labels.audioDirectionalDriftHint}
						</span>
						<OptionButtonGroup<AudioReactiveChannel>
							label={labels.audioChannel}
							options={AUDIO_REACTIVE_CHANNELS}
							value={store.particleAudioDriftChannel}
							onChange={store.setParticleAudioDriftChannel}
							labels={audioChannelLabels}
							columns={3}
						/>
						<OptionButtonGroup<ParticleAudioDriftMode>
							label={labels.audioDriftMode}
							options={driftModeOptions}
							value={store.particleAudioDriftMode}
							onChange={store.setParticleAudioDriftMode}
							labels={driftModeLabels}
							columns={3}
						/>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<Slider
								label={labels.audioDriftAngle}
								value={store.particleAudioDriftAngle}
								{...PARTICLE_RANGES.audioDriftAngle}
								onChange={store.setParticleAudioDriftAngle}
								unit="deg"
								variant="compact"
								formatValue={formatInteger}
							/>
							<Slider
								label={labels.audioDriftAmount}
								value={store.particleAudioDriftAmount}
								{...PARTICLE_RANGES.audioDriftAmount}
								onChange={store.setParticleAudioDriftAmount}
								variant="compact"
								formatValue={formatDecimal}
							/>
						</div>
						<span
							className="text-[11px]"
							style={{ color: UI_COLORS.fgMute }}
						>
							{t.hint_drift_angle}
						</span>
						{!isSimple ? (
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<Slider
									label={labels.audioDriftBase}
									value={store.particleAudioDriftBase}
									{...PARTICLE_RANGES.audioDriftBase}
									onChange={store.setParticleAudioDriftBase}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label={labels.audioDriftThreshold}
									value={store.particleAudioDriftThreshold}
									{...PARTICLE_RANGES.audioDriftThreshold}
									onChange={store.setParticleAudioDriftThreshold}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label={labels.audioDriftRelease}
									value={store.particleAudioDriftRelease}
									{...PARTICLE_RANGES.audioDriftRelease}
									onChange={store.setParticleAudioDriftRelease}
									variant="compact"
									formatValue={formatDecimal}
								/>
							</div>
						) : null}
						{!isSimple ? (
							<span
								className="text-[11px]"
								style={{ color: UI_COLORS.fgMute }}
							>
								{t.hint_drift_threshold}
							</span>
						) : null}
					</>
				) : null}

				{/* ── Depth Flow / Focus Warp ── */}
				<SwitchRow
					label={labels.depthFlow}
					checked={store.particleDepthFlowEnabled}
					onChange={store.setParticleDepthFlowEnabled}
				/>
				{store.particleDepthFlowEnabled ? (
					<>
						<span
							className="text-[11px]"
							style={{ color: UI_COLORS.fgMute }}
						>
							{labels.depthFlowHint}
						</span>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<Slider
								label={labels.depthFlowAmount}
								value={store.particleDepthFlowAmount}
								{...PARTICLE_RANGES.depthFlowAmount}
								onChange={store.setParticleDepthFlowAmount}
								variant="compact"
								formatValue={formatDecimal}
							/>
							<Slider
								label={labels.depthFlowFocusX}
								value={store.particleDepthFlowFocusX}
								{...PARTICLE_RANGES.depthFlowFocus}
								onChange={store.setParticleDepthFlowFocusX}
								variant="compact"
								formatValue={formatDecimal}
							/>
							<Slider
								label={labels.depthFlowFocusY}
								value={store.particleDepthFlowFocusY}
								{...PARTICLE_RANGES.depthFlowFocus}
								onChange={store.setParticleDepthFlowFocusY}
								variant="compact"
								formatValue={formatDecimal}
							/>
						</div>
						<span
							className="text-[11px]"
							style={{ color: UI_COLORS.fgMute }}
						>
							{t.hint_depth_flow_focus}
						</span>
						<OptionButtonGroup<ParticleDepthFlowDirection>
							label={labels.depthFlowDirection}
							options={depthDirectionOptions}
							value={store.particleDepthFlowDirection}
							onChange={store.setParticleDepthFlowDirection}
							labels={depthDirectionLabels}
							columns={2}
						/>
						{!isSimple ? (
							<>
								<OptionButtonGroup<AudioReactiveChannel>
									label={labels.audioChannel}
									options={AUDIO_REACTIVE_CHANNELS}
									value={store.particleDepthFlowChannel}
									onChange={store.setParticleDepthFlowChannel}
									labels={audioChannelLabels}
									columns={3}
								/>
								<OptionButtonGroup<ParticleDepthFlowMode>
									label={labels.depthFlowMode}
									options={depthModeOptions}
									value={store.particleDepthFlowMode}
									onChange={store.setParticleDepthFlowMode}
									labels={depthModeLabels}
									columns={2}
								/>
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
									<Slider
										label={labels.depthFlowThreshold}
										value={store.particleDepthFlowThreshold}
										{...PARTICLE_RANGES.depthFlowThreshold}
										onChange={store.setParticleDepthFlowThreshold}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={labels.depthFlowSensitivity}
										value={store.particleDepthFlowSensitivity}
										{...PARTICLE_RANGES.depthFlowSensitivity}
										onChange={store.setParticleDepthFlowSensitivity}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={labels.depthFlowAttack}
										value={store.particleDepthFlowAttack}
										{...PARTICLE_RANGES.depthFlowAttack}
										onChange={store.setParticleDepthFlowAttack}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={labels.depthFlowRelease}
										value={store.particleDepthFlowRelease}
										{...PARTICLE_RANGES.depthFlowRelease}
										onChange={store.setParticleDepthFlowRelease}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={labels.depthFlowSpeed}
										value={store.particleDepthFlowSpeed}
										{...PARTICLE_RANGES.depthFlowSpeed}
										onChange={store.setParticleDepthFlowSpeed}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={labels.depthFlowSpread}
										value={store.particleDepthFlowSpread}
										{...PARTICLE_RANGES.depthFlowSpread}
										onChange={store.setParticleDepthFlowSpread}
										variant="compact"
										formatValue={formatDecimal}
									/>
								</div>
								<span
									className="text-[11px]"
									style={{ color: UI_COLORS.fgMute }}
								>
									{t.hint_depth_flow_release}
								</span>
							</>
						) : null}
					</>
				) : null}

				{/* ── Audio Response ── */}
				<CollapsibleSection
					title={labels.audioResponse}
					defaultOpen={false}
					dense
				>
					<div className="flex flex-col gap-3">
						<SwitchRow
							label={labels.audioReactive}
							checked={store.particleAudioReactive}
							onChange={store.setParticleAudioReactive}
						/>
						{store.particleAudioReactive ? (
							<>
								<OptionButtonGroup<AudioReactiveChannel>
									label={labels.audioChannel}
									options={AUDIO_REACTIVE_CHANNELS}
									value={store.particleAudioChannel}
									onChange={store.setParticleAudioChannel}
									labels={audioChannelLabels}
									columns={3}
								/>
								<Slider
									label={t.label_smoothing}
									value={store.particleAudioSmoothing}
									{...AUDIO_ROUTING_RANGES.selectedChannelSmoothing}
									onChange={store.setParticleAudioSmoothing}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label={labels.audioSizeBoost}
									value={store.particleAudioSizeBoost}
									{...PARTICLE_RANGES.audioSizeBoost}
									onChange={store.setParticleAudioSizeBoost}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<span
									className="text-[11px]"
									style={{ color: UI_COLORS.fgMute }}
								>
									{t.hint_particle_audio_boost_cap}
								</span>
								<Slider
									label={labels.audioOpacityBoost}
									value={store.particleAudioOpacityBoost}
									{...PARTICLE_RANGES.audioOpacityBoost}
									onChange={store.setParticleAudioOpacityBoost}
									variant="compact"
									formatValue={formatDecimal}
								/>
								{!isSimple ? (
									<CollapsibleSection
										title={t.label_particle_envelope}
										defaultOpen={false}
										dense
									>
										<div className="flex flex-col gap-2">
											<Slider
												label={t.label_particle_attack}
												value={store.particleAudioAttack}
												{...LOGO_RANGES.attack}
												onChange={store.setParticleAudioAttack}
												variant="compact"
												formatValue={formatDecimal}
											/>
											<Slider
												label={t.label_particle_release}
												value={store.particleAudioRelease}
												{...LOGO_RANGES.release}
												onChange={store.setParticleAudioRelease}
												variant="compact"
												formatValue={formatDecimal}
											/>
											<Slider
												label={t.label_particle_response_speed}
												value={store.particleAudioReactivitySpeed}
												{...LOGO_RANGES.reactivitySpeed}
												onChange={
													store.setParticleAudioReactivitySpeed
												}
												variant="compact"
												formatValue={formatDecimal}
											/>
											<Slider
												label={t.label_particle_peak_window}
												value={store.particleAudioPeakWindow}
												{...LOGO_RANGES.peakWindow}
												onChange={store.setParticleAudioPeakWindow}
												variant="compact"
												formatValue={formatDecimal}
											/>
											<Slider
												label={t.label_particle_peak_floor}
												value={store.particleAudioPeakFloor}
												{...LOGO_RANGES.peakFloor}
												onChange={store.setParticleAudioPeakFloor}
												variant="compact"
												formatValue={formatDecimal}
											/>
											<Slider
												label={t.label_particle_punch}
												value={store.particleAudioPunch}
												{...LOGO_RANGES.punch}
												onChange={store.setParticleAudioPunch}
												variant="compact"
												formatValue={formatDecimal}
											/>
										</div>
									</CollapsibleSection>
								) : null}
							</>
						) : null}
					</div>
				</CollapsibleSection>

				{/* ── Saved Profiles ── */}
				<CollapsibleSection
					title={labels.savedProfiles}
					defaultOpen={false}
					dense
				>
					<ProfileSlotsGrid
						slots={store.particlesProfileSlots}
						activeIndex={null}
						onLoad={store.loadParticlesProfileSlot}
						onSave={store.saveParticlesProfileSlot}
						onAdd={store.addParticlesProfileSlot}
						onDelete={store.removeParticlesProfileSlot}
						loadLabel={labels.load}
						saveLabel={labels.save}
						slotLabel={labels.slot}
						emptyLabel={labels.empty}
						activeLabel={labels.active}
					/>
				</CollapsibleSection>
			</div>
		</SectionCard>
	);
}
