import { useShallow } from 'zustand/react/shallow';
import {
	CollapsibleSection,
	SectionCard,
	SegmentedControl,
	ToggleSwitch
} from '@/ui';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { FACTORY_DEFAULT_STATE } from '@/lib/factoryDefaults';
import type { FlashLightShape } from '@/features/stageFx/stageFxConfig';
import {
	ColorField,
	FxBandThresholdControls,
	MotionSlider as Slider
} from './MotionSharedControls';
import { formatDecimal } from './motionTabUtils';

export function FlashLightSection() {
	const s = useWallpaperStore(
		useShallow(state => ({
			enabled: state.flashLightEnabled,
			intensity: state.flashLightIntensity,
			colorSource: state.flashLightColorSource,
			color: state.flashLightColor,
			softness: state.flashLightSoftness,
			brightness: state.flashLightBrightness,
			decay: state.flashLightDecay,
			audioChannel: state.flashLightAudioChannel,
			bandThresholds: state.flashLightBandThresholds,
			sensitivity: state.flashLightSensitivity,
			retriggerMs: state.flashLightRetriggerMs,
			shape: state.flashLightShape,
			blendMode: state.flashLightBlendMode,
			advanced: state.uiMode === 'advanced'
		}))
	);
	const set = useWallpaperStore(
		useShallow(state => ({
			enabled: state.setFlashLightEnabled,
			intensity: state.setFlashLightIntensity,
			colorSource: state.setFlashLightColorSource,
			color: state.setFlashLightColor,
			softness: state.setFlashLightSoftness,
			brightness: state.setFlashLightBrightness,
			decay: state.setFlashLightDecay,
			audioChannel: state.setFlashLightAudioChannel,
			bandThreshold: state.setFlashLightBandThreshold,
			sensitivity: state.setFlashLightSensitivity,
			retriggerMs: state.setFlashLightRetriggerMs,
			shape: state.setFlashLightShape,
			blendMode: state.setFlashLightBlendMode
		}))
	);

	return (
		<SectionCard
			title="Flash Light"
			subtitle="Short shaped flashes triggered by hard audio peaks"
			action={
				<ToggleSwitch
					checked={s.enabled}
					onChange={set.enabled}
					size="sm"
					ariaLabel="Enable Flash Light"
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
						max={1}
						step={0.01}
						onChange={set.intensity}
						defaultValue={FACTORY_DEFAULT_STATE.flashLightIntensity}
						variant="macro"
						formatValue={formatDecimal}
					/>
					<SegmentedControl<FlashLightShape>
						value={s.shape}
						onChange={set.shape}
						options={[
							{ value: 'full-screen', label: 'Full' },
							{ value: 'circular-burst', label: 'Circle' },
							{ value: 'horizontal-blast', label: 'H Blast' },
							{ value: 'vertical-blast', label: 'V Blast' },
							{ value: 'center-bloom', label: 'Bloom' },
							{ value: 'edge-flash', label: 'Edges' },
							{ value: 'vignette-invert', label: 'Vignette' }
						]}
						size="sm"
						full
					/>
					{s.advanced ? (
						<CollapsibleSection
							title="Advanced"
							defaultOpen={false}
							dense
						>
							<div className="flex flex-col gap-3">
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
									<Slider
										label="Sensitivity"
										value={s.sensitivity}
										min={0}
										max={4}
										step={0.01}
										onChange={set.sensitivity}
										defaultValue={
											FACTORY_DEFAULT_STATE.flashLightSensitivity
										}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label="Decay"
										value={s.decay}
										min={0.1}
										max={10}
										step={0.1}
										onChange={set.decay}
										defaultValue={
											FACTORY_DEFAULT_STATE.flashLightDecay
										}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label="Softness"
										value={s.softness}
										min={0}
										max={1}
										step={0.01}
										onChange={set.softness}
										defaultValue={
											FACTORY_DEFAULT_STATE.flashLightSoftness
										}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label="Brightness"
										value={s.brightness}
										min={0}
										max={4}
										step={0.01}
										onChange={set.brightness}
										defaultValue={
											FACTORY_DEFAULT_STATE.flashLightBrightness
										}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label="Retrigger ms"
										value={s.retriggerMs}
										min={35}
										max={500}
										step={5}
										onChange={set.retriggerMs}
										defaultValue={
											FACTORY_DEFAULT_STATE.flashLightRetriggerMs
										}
										variant="compact"
										formatValue={formatDecimal}
									/>
								</div>
								<SegmentedControl<'kick' | 'bass' | 'full'>
									value={s.audioChannel}
									onChange={set.audioChannel}
									options={[
										{ value: 'kick', label: 'Kick' },
										{ value: 'bass', label: 'Bass' },
										{ value: 'full', label: 'Full' }
									]}
									size="sm"
									full
								/>
								<FxBandThresholdControls
									thresholds={s.bandThresholds}
									defaultThresholds={
										FACTORY_DEFAULT_STATE.flashLightBandThresholds
									}
									onChange={set.bandThreshold}
								/>
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
										label="Flash color"
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
