import { useShallow } from 'zustand/react/shallow';
import {
	CollapsibleSection,
	SectionCard,
	SegmentedControl,
	ToggleSwitch
} from '@/ui';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { FACTORY_DEFAULT_STATE } from '@/lib/factoryDefaults';
import type {
	StageLightsMovementMode,
	StageLightsOrigin
} from '@/features/stageFx/stageFxConfig';
import {
	ColorField,
	FxBandThresholdControls,
	MotionSlider as Slider
} from './MotionSharedControls';
import { formatDecimal, formatInteger } from './motionTabUtils';

export function StageLightsSection() {
	const s = useWallpaperStore(
		useShallow(state => ({
			enabled: state.stageLightsEnabled,
			intensity: state.stageLightsIntensity,
			minCount: state.stageLightsMinBeamCount,
			maxCount: state.stageLightsMaxBeamCount,
			beamWidth: state.stageLightsBeamWidth,
			beamLength: state.stageLightsBeamLength,
			softness: state.stageLightsSoftness,
			speed: state.stageLightsSpeed,
			fixedMotion: state.stageLightsFixedMotion,
			colorSource: state.stageLightsColorSource,
			color: state.stageLightsColor,
			audioReactive: state.stageLightsAudioReactive,
			audioChannel: state.stageLightsAudioChannel,
			audioAmount: state.stageLightsAudioAmount,
			audioOscillationAmount: state.stageLightsAudioOscillationAmount,
			audioHoldMs: state.stageLightsAudioHoldMs,
			audioDecay: state.stageLightsAudioDecay,
			audioGateEnabled: state.stageLightsAudioGateEnabled,
			bandThresholds: state.stageLightsBandThresholds,
			opacity: state.stageLightsOpacity,
			blendMode: state.stageLightsBlendMode,
			origin: state.stageLightsOrigin,
			movementMode: state.stageLightsMovementMode,
			invertDirection: state.stageLightsInvertDirection,
			mirrorDirections: state.stageLightsMirrorDirections,
			advanced: state.uiMode === 'advanced'
		}))
	);
	const set = useWallpaperStore(
		useShallow(state => ({
			enabled: state.setStageLightsEnabled,
			intensity: state.setStageLightsIntensity,
			minCount: state.setStageLightsMinBeamCount,
			maxCount: state.setStageLightsMaxBeamCount,
			beamWidth: state.setStageLightsBeamWidth,
			beamLength: state.setStageLightsBeamLength,
			softness: state.setStageLightsSoftness,
			speed: state.setStageLightsSpeed,
			fixedMotion: state.setStageLightsFixedMotion,
			colorSource: state.setStageLightsColorSource,
			color: state.setStageLightsColor,
			audioReactive: state.setStageLightsAudioReactive,
			audioChannel: state.setStageLightsAudioChannel,
			audioAmount: state.setStageLightsAudioAmount,
			audioOscillationAmount: state.setStageLightsAudioOscillationAmount,
			audioHoldMs: state.setStageLightsAudioHoldMs,
			audioDecay: state.setStageLightsAudioDecay,
			audioGateEnabled: state.setStageLightsAudioGateEnabled,
			bandThreshold: state.setStageLightsBandThreshold,
			opacity: state.setStageLightsOpacity,
			blendMode: state.setStageLightsBlendMode,
			origin: state.setStageLightsOrigin,
			movementMode: state.setStageLightsMovementMode,
			invertDirection: state.setStageLightsInvertDirection,
			mirrorDirections: state.setStageLightsMirrorDirections
		}))
	);
	const hasSweep = s.speed > 0;

	return (
		<SectionCard
			title="Stage Lights"
			subtitle="Directional concert beams from configurable edges"
			action={
				<ToggleSwitch
					checked={s.enabled}
					onChange={set.enabled}
					size="sm"
					ariaLabel="Enable Stage Lights"
				/>
			}
			density="compact"
		>
			{s.enabled ? (
				<div className="flex flex-col gap-3">
					<Slider
						label="Intensity"
						value={s.intensity}
						min={0}
						max={2}
						step={0.01}
						onChange={set.intensity}
						defaultValue={
							FACTORY_DEFAULT_STATE.stageLightsIntensity
						}
						variant="macro"
						formatValue={formatDecimal}
					/>
					<div className="flex flex-col gap-1">
						<span className="text-xs text-[var(--editor-text-muted)]">
							Sweep style
						</span>
						<SegmentedControl<StageLightsMovementMode>
							value={s.movementMode}
							onChange={set.movementMode}
							options={[
								{ value: 'top-down', label: 'Down' },
								{ value: 'bottom-up', label: 'Up' },
								{ value: 'left-right', label: 'Right' },
								{ value: 'right-left', label: 'Left' },
								{ value: 'cross-sweep', label: 'Cross' },
								{ value: 'radial-sweep', label: 'Radial' },
								{ value: 'circular-sweep', label: 'Circle' }
							]}
							size="sm"
							full
						/>
					</div>

					{s.advanced ? (
						<CollapsibleSection
							title="Advanced"
							defaultOpen={false}
							dense
						>
							<div className="flex flex-col gap-3">
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
									<Slider
										label="Min beams"
										value={s.minCount}
										min={1}
										max={16}
										step={1}
										onChange={set.minCount}
										defaultValue={
											FACTORY_DEFAULT_STATE.stageLightsMinBeamCount
										}
										variant="compact"
										formatValue={formatInteger}
									/>
									<Slider
										label="Max beams"
										value={s.maxCount}
										min={1}
										max={16}
										step={1}
										onChange={set.maxCount}
										defaultValue={
											FACTORY_DEFAULT_STATE.stageLightsMaxBeamCount
										}
										variant="compact"
										formatValue={formatInteger}
									/>
									<Slider
										label="Beam thickness"
										value={s.beamWidth}
										min={0}
										max={1}
										step={0.01}
										onChange={set.beamWidth}
										defaultValue={
											FACTORY_DEFAULT_STATE.stageLightsBeamWidth
										}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label="Beam reach"
										value={s.beamLength}
										min={0.15}
										max={1.35}
										step={0.01}
										onChange={set.beamLength}
										defaultValue={
											FACTORY_DEFAULT_STATE.stageLightsBeamLength
										}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label="Edge glow"
										value={s.softness}
										min={0}
										max={1}
										step={0.01}
										onChange={set.softness}
										defaultValue={
											FACTORY_DEFAULT_STATE.stageLightsSoftness
										}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label="Sweep speed"
										value={s.speed}
										min={0}
										max={4}
										step={0.01}
										onChange={set.speed}
										defaultValue={
											FACTORY_DEFAULT_STATE.stageLightsSpeed
										}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label="Opacity"
										value={s.opacity}
										min={0}
										max={1}
										step={0.01}
										onChange={set.opacity}
										defaultValue={
											FACTORY_DEFAULT_STATE.stageLightsOpacity
										}
										variant="compact"
										formatValue={formatDecimal}
									/>
								</div>
								<SegmentedControl<StageLightsOrigin>
									value={s.origin}
									onChange={set.origin}
									options={[
										{ value: 'top', label: 'Top' },
										{ value: 'bottom', label: 'Bottom' },
										{ value: 'left', label: 'Left' },
										{ value: 'right', label: 'Right' },
										{ value: 'top-bottom', label: 'T+B' },
										{ value: 'sides', label: 'Sides' },
										{ value: 'all', label: 'All' }
									]}
									size="sm"
									full
								/>
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
									{[
										...(hasSweep
											? [
													[
														'Reverse sweep',
														s.invertDirection,
														set.invertDirection
													],
													[
														'Mirror beams',
														s.mirrorDirections,
														set.mirrorDirections
													]
												]
											: []),
										[
											'Audio reactive',
											s.audioReactive,
											set.audioReactive
										],
										...(s.audioReactive
											? [
													[
														'Move without audio',
														s.fixedMotion,
														set.fixedMotion
													],
													[
														'Off below threshold',
														s.audioGateEnabled,
														set.audioGateEnabled
													]
												]
											: [])
									].map(([label, checked, onChange]) => (
										<div
											key={label as string}
											className="flex items-center justify-between gap-2"
										>
											<span className="text-[11px]">
												{label as string}
											</span>
											<ToggleSwitch
												checked={checked as boolean}
												onChange={
													onChange as (
														value: boolean
													) => void
												}
												size="sm"
												ariaLabel={label as string}
											/>
										</div>
									))}
								</div>
								{s.audioReactive ? (
									<>
										<SegmentedControl<
											'kick' | 'bass' | 'full'
										>
											value={s.audioChannel}
											onChange={set.audioChannel}
											options={[
												{
													value: 'kick',
													label: 'Kick'
												},
												{
													value: 'bass',
													label: 'Bass'
												},
												{ value: 'full', label: 'Full' }
											]}
											size="sm"
											full
										/>
										<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
											<Slider
												label="Audio intensity boost"
												value={s.audioAmount}
												min={0}
												max={4}
												step={0.01}
												onChange={set.audioAmount}
												defaultValue={
													FACTORY_DEFAULT_STATE.stageLightsAudioAmount
												}
												variant="compact"
												formatValue={formatDecimal}
											/>
											<Slider
												label="Audio sweep boost"
												value={s.audioOscillationAmount}
												min={0}
												max={2}
												step={0.01}
												onChange={
													set.audioOscillationAmount
												}
												defaultValue={
													FACTORY_DEFAULT_STATE.stageLightsAudioOscillationAmount
												}
												variant="compact"
												formatValue={formatDecimal}
											/>
											<Slider
												label="Light hold (ms)"
												value={s.audioHoldMs}
												min={0}
												max={600}
												step={10}
												onChange={set.audioHoldMs}
												defaultValue={
													FACTORY_DEFAULT_STATE.stageLightsAudioHoldMs
												}
												variant="compact"
												formatValue={formatInteger}
											/>
											<Slider
												label="Fade decay"
												value={s.audioDecay}
												min={0.2}
												max={0.995}
												step={0.005}
												onChange={set.audioDecay}
												defaultValue={
													FACTORY_DEFAULT_STATE.stageLightsAudioDecay
												}
												variant="compact"
												formatValue={formatDecimal}
											/>
										</div>
										<FxBandThresholdControls
											thresholds={s.bandThresholds}
											defaultThresholds={
												FACTORY_DEFAULT_STATE.stageLightsBandThresholds
											}
											onChange={set.bandThreshold}
										/>
									</>
								) : null}
								<SegmentedControl<'manual' | 'theme' | 'image'>
									value={s.colorSource}
									onChange={set.colorSource}
									options={[
										{ value: 'theme', label: 'Theme' },
										{ value: 'image', label: 'Image' },
										{ value: 'manual', label: 'Manual' }
									]}
									size="sm"
									full
								/>
								{s.colorSource === 'manual' ? (
									<ColorField
										label="Beam color"
										value={s.color}
										onChange={set.color}
									/>
								) : null}
								<SegmentedControl<
									'lighter' | 'screen' | 'source-over'
								>
									value={s.blendMode}
									onChange={set.blendMode}
									options={[
										{ value: 'lighter', label: 'Add' },
										{ value: 'screen', label: 'Screen' },
										{
											value: 'source-over',
											label: 'Normal'
										}
									]}
									size="sm"
									full
								/>
							</div>
						</CollapsibleSection>
					) : null}
				</div>
			) : null}
		</SectionCard>
	);
}
