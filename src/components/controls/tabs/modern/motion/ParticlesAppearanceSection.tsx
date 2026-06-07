import { useState } from 'react';
import { Headphones, Layers, Palette } from 'lucide-react';
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
import {
	Button,
	CollapsibleSection,
	SectionCard,
	SegmentedControl,
	UI_COLORS
} from '@/ui';

import {
	ColorField,
	MotionSlider as Slider,
	OptionButtonGroup,
	SwitchRow
} from './MotionSharedControls';
import {
	COLOR_SOURCES,
	PARTICLE_COLOR_MODES,
	PARTICLE_ROTATION_DIRECTIONS,
	formatDecimal,
	formatInteger
} from './motionTabUtils';

// ── Persistent tab view ────────────────────────────────────────────────────
type ParticleView = 'look' | 'motion' | 'audio';

const PARTICLE_VIEW_KEY = 'lwag-particle-view';

function readView(): ParticleView {
	if (typeof window === 'undefined') return 'look';
	try {
		const v = window.localStorage.getItem(PARTICLE_VIEW_KEY);
		if (v === 'look' || v === 'motion' || v === 'audio') return v;
	} catch {
		// ignore
	}
	return 'look';
}

function writeView(v: ParticleView) {
	try {
		window.localStorage.setItem(PARTICLE_VIEW_KEY, v);
	} catch {
		// ignore
	}
}

// ── Store slice type ────────────────────────────────────────────────────────

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
	| 'particleGlowReach'
	| 'particleGlowAudioAmount'
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
	| 'setParticleGlowReach'
	| 'setParticleGlowAudioAmount'
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
		glowReach: string;
		audioGlowAmount: string;
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
		depthFlowFocusHint: string;
		centerFocus: string;
		depthFlowThreshold: string;
		depthFlowSensitivity: string;
		depthFlowAttack: string;
		depthFlowRelease: string;
		depthFlowSpeed: string;
		depthFlowSpread: string;
	};
}) {
	const t = useT();

	const [view, setView] = useState<ParticleView>(readView);


	function handleViewChange(next: ParticleView) {
		setView(next);
		writeView(next);
	}

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

	const viewOptions = [
		{
			value: 'look' as const,
			label: t.particle_view_look,
			icon: <Palette size={12} />
		},
		{
			value: 'motion' as const,
			label: t.particle_view_motion,
			icon: <Layers size={12} />
		},
		{
			value: 'audio' as const,
			label: t.particle_view_audio,
			icon: <Headphones size={12} />
		}
	];

	return (
		<SectionCard
			title={labels.title}
			subtitle={labels.subtitle}
			density="compact"
		>
			<div className="flex flex-col gap-3">
				{/* ── Tab switcher ── */}
				<SegmentedControl<ParticleView>
					value={view}
					onChange={handleViewChange}
					options={viewOptions}
					size="sm"
					density="compact"
					full
					ariaLabel={labels.title}
				/>

				{/* ════════════════════════════════════════
				    LOOK — colors, opacity, size, glow
				    ════════════════════════════════════════ */}
				{view === 'look' ? (
					<div className="flex flex-col gap-3">
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
								{/* Solid mode only uses color1; gradient + other
								    modes blend between both. */}
								{store.particleColorMode !== 'solid' ? (
									<ColorField
										label={labels.color2}
										value={store.particleColor2}
										onChange={store.setParticleColor2}
									/>
								) : null}
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
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
									<Slider
										label={labels.glow}
										value={
											store.particleGlow
												? store.particleGlowStrength
												: 0
										}
										{...PARTICLE_RANGES.glowStrength}
										onChange={value => {
											store.setParticleGlow(
												value >
													PARTICLE_RANGES.glowStrength.step / 2
											);
											store.setParticleGlowStrength(value);
										}}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={labels.glowReach}
										value={store.particleGlowReach}
										{...PARTICLE_RANGES.glowReach}
										onChange={store.setParticleGlowReach}
										variant="compact"
										formatValue={formatDecimal}
									/>
								</div>
							</div>
						</CollapsibleSection>
					</div>
				) : null}

				{/* ════════════════════════════════════════
				    MOTION — rotation, filters, wind, depth
				    ════════════════════════════════════════ */}
				{view === 'motion' ? (
					<div className="flex flex-col gap-3">
						{/* Rotation & CSS Filters */}
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

						{/* ── Audio Wind ── */}
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

						{/* ── Depth Flow ── */}
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
								{!isSimple ? (
									<OptionButtonGroup<ParticleDepthFlowMode>
										label={labels.depthFlowMode}
										options={depthModeOptions}
										value={store.particleDepthFlowMode}
										onChange={store.setParticleDepthFlowMode}
										labels={depthModeLabels}
										columns={2}
									/>
								) : null}
								<OptionButtonGroup<ParticleDepthFlowDirection>
									label={labels.depthFlowDirection}
									options={depthDirectionOptions}
									value={store.particleDepthFlowDirection}
									onChange={store.setParticleDepthFlowDirection}
									labels={depthDirectionLabels}
									columns={2}
								/>
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
									{labels.depthFlowFocusHint}
								</span>
								<Button
									type="button"
									size="sm"
									density="compact"
									variant="secondary"
									onClick={() => {
										store.setParticleDepthFlowFocusX(0.5);
										store.setParticleDepthFlowFocusY(0.5);
									}}
								>
									{labels.centerFocus}
								</Button>
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
					</div>
				) : null}

				{/* ════════════════════════════════════════
				    AUDIO — reactive, boost, envelope
				    ════════════════════════════════════════ */}
				{view === 'audio' ? (
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
								<Slider
									label={labels.audioGlowAmount}
									value={store.particleGlowAudioAmount}
									{...PARTICLE_RANGES.glowAudioAmount}
									onChange={store.setParticleGlowAudioAmount}
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
				) : null}

			</div>
		</SectionCard>
	);
}
