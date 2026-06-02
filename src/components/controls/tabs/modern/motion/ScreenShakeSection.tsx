import { useShallow } from 'zustand/react/shallow';
import {
	CollapsibleSection,
	SectionCard,
	SegmentedControl,
	ToggleSwitch
} from '@/ui';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { FACTORY_DEFAULT_STATE } from '@/lib/factoryDefaults';
import type { ScreenShakeMode } from '@/features/stageFx/stageFxConfig';
import {
	FxBandThresholdControls,
	MotionSlider as Slider
} from './MotionSharedControls';
import { formatDecimal } from './motionTabUtils';

export function ScreenShakeSection() {
	const s = useWallpaperStore(
		useShallow(state => ({
			enabled: state.cameraShakeEnabled,
			amount: state.cameraShakeAmount,
			decay: state.cameraShakeDecay,
			bandThresholds: state.cameraShakeBandThresholds,
			sensitivity: state.cameraShakeSensitivity,
			retriggerMs: state.cameraShakeRetriggerMs,
			channel: state.cameraShakeChannel,
			mode: state.cameraShakeMode,
			frequency: state.cameraShakeFrequency,
			roughness: state.cameraShakeRoughness,
			advanced: state.uiMode === 'advanced'
		}))
	);
	const set = useWallpaperStore(
		useShallow(state => ({
			enabled: state.setCameraShakeEnabled,
			amount: state.setCameraShakeAmount,
			decay: state.setCameraShakeDecay,
			bandThreshold: state.setCameraShakeBandThreshold,
			sensitivity: state.setCameraShakeSensitivity,
			retriggerMs: state.setCameraShakeRetriggerMs,
			channel: state.setCameraShakeChannel,
			mode: state.setCameraShakeMode,
			frequency: state.setCameraShakeFrequency,
			roughness: state.setCameraShakeRoughness
		}))
	);

	return (
		<SectionCard
			title="Screen Shake"
			subtitle="Peak-triggered impact vibration; HUD stays fixed"
			action={
				<ToggleSwitch
					checked={s.enabled}
					onChange={set.enabled}
					size="sm"
					ariaLabel="Enable Screen Shake"
				/>
			}
			density="compact"
		>
			{s.enabled ? (
				<div className="flex flex-col gap-3">
					<SegmentedControl<ScreenShakeMode>
						value={s.mode}
						onChange={set.mode}
						options={[
							{ value: 'horizontal', label: 'H' },
							{ value: 'vertical', label: 'V' },
							{ value: 'free', label: 'Free' },
							{ value: 'punch', label: 'Punch' },
							{ value: 'jitter', label: 'Jitter' },
							{ value: 'kick-snap', label: 'Snap' }
						]}
						size="sm"
						full
					/>
					<Slider
						label="Shake amount"
						value={s.amount}
						min={0}
						max={2}
						step={0.01}
						onChange={set.amount}
						defaultValue={FACTORY_DEFAULT_STATE.cameraShakeAmount}
						variant="macro"
						formatValue={formatDecimal}
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
										label="Decay"
										value={s.decay}
										min={0.2}
										max={0.995}
										step={0.005}
										onChange={set.decay}
										defaultValue={
											FACTORY_DEFAULT_STATE.cameraShakeDecay
										}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label="Frequency"
										value={s.frequency}
										min={1}
										max={70}
										step={1}
										onChange={set.frequency}
										defaultValue={
											FACTORY_DEFAULT_STATE.cameraShakeFrequency
										}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label="Impact sensitivity"
										value={s.sensitivity}
										min={0}
										max={4}
										step={0.01}
										onChange={set.sensitivity}
										defaultValue={
											FACTORY_DEFAULT_STATE.cameraShakeSensitivity
										}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label="Retrigger ms"
										value={s.retriggerMs}
										min={35}
										max={400}
										step={5}
										onChange={set.retriggerMs}
										defaultValue={
											FACTORY_DEFAULT_STATE.cameraShakeRetriggerMs
										}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label="Roughness"
										value={s.roughness}
										min={0}
										max={1}
										step={0.01}
										onChange={set.roughness}
										defaultValue={
											FACTORY_DEFAULT_STATE.cameraShakeRoughness
										}
										variant="compact"
										formatValue={formatDecimal}
									/>
								</div>
								<SegmentedControl<'kick' | 'bass' | 'full'>
									value={s.channel}
									onChange={set.channel}
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
										FACTORY_DEFAULT_STATE.cameraShakeBandThresholds
									}
									onChange={set.bandThreshold}
								/>
							</div>
						</CollapsibleSection>
					) : null}
				</div>
			) : null}
		</SectionCard>
	);
}
