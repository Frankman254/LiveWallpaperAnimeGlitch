import { useShallow } from 'zustand/react/shallow';
import {
	CollapsibleSection,
	SectionCard,
	SegmentedControl,
	Slider,
	ToggleSwitch
} from '@/ui';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { CameraMotionMode } from '@/features/stageFx/stageFxConfig';
import { formatDecimal } from './motionTabUtils';

/**
 * Camera FX controls (Task 3/4). Macro = enable + motion mode + amount;
 * Advanced reveals motion speed/audio influence and the full shake controls.
 * Render-side wrapper: `features/stageFx/CameraFxStage`.
 */
export function CameraFxSection() {
	const s = useWallpaperStore(
		useShallow(state => ({
			enabled: state.cameraFxEnabled,
			mode: state.cameraMotionMode,
			amount: state.cameraMotionAmount,
			speed: state.cameraMotionSpeed,
			audioInfluence: state.cameraMotionAudioInfluence,
			shakeEnabled: state.cameraShakeEnabled,
			shakeAmount: state.cameraShakeAmount,
			shakeDecay: state.cameraShakeDecay,
			shakeThreshold: state.cameraShakeThreshold,
			shakeChannel: state.cameraShakeChannel,
			advanced: state.uiMode === 'advanced'
		}))
	);
	const set = useWallpaperStore(
		useShallow(state => ({
			setEnabled: state.setCameraFxEnabled,
			setMode: state.setCameraMotionMode,
			setAmount: state.setCameraMotionAmount,
			setSpeed: state.setCameraMotionSpeed,
			setAudioInfluence: state.setCameraMotionAudioInfluence,
			setShakeEnabled: state.setCameraShakeEnabled,
			setShakeAmount: state.setCameraShakeAmount,
			setShakeDecay: state.setCameraShakeDecay,
			setShakeThreshold: state.setCameraShakeThreshold,
			setShakeChannel: state.setCameraShakeChannel
		}))
	);

	return (
		<SectionCard
			title="Camera FX"
			subtitle="Screen shake + drift/circle/figure-eight motion"
			action={
				<ToggleSwitch
					checked={s.enabled}
					onChange={set.setEnabled}
					size="sm"
					ariaLabel="Enable Camera FX"
				/>
			}
			density="compact"
		>
			<div className="flex flex-col gap-3">
				<SegmentedControl<CameraMotionMode>
					value={s.mode}
					onChange={set.setMode}
					options={[
						{ value: 'none', label: 'Off' },
						{ value: 'drift', label: 'Drift' },
						{ value: 'circle', label: 'Circle' },
						{ value: 'semicircle', label: 'Semi' },
						{ value: 'figure-eight', label: 'Eight' }
					]}
					size="sm"
					full
				/>
				<Slider
					label="Motion amount"
					value={s.amount}
					min={0}
					max={1}
					step={0.01}
					onChange={set.setAmount}
					variant="macro"
					formatValue={formatDecimal}
				/>

				{s.advanced ? (
					<CollapsibleSection title="Advanced" defaultOpen={false} dense>
						<div className="flex flex-col gap-3">
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<Slider
									label="Motion speed"
									value={s.speed}
									min={0}
									max={2}
									step={0.01}
									onChange={set.setSpeed}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label="Audio influence"
									value={s.audioInfluence}
									min={0}
									max={1}
									step={0.01}
									onChange={set.setAudioInfluence}
									variant="compact"
									formatValue={formatDecimal}
								/>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-[11px]">Screen shake</span>
								<ToggleSwitch
									checked={s.shakeEnabled}
									onChange={set.setShakeEnabled}
									size="sm"
									ariaLabel="Enable screen shake"
								/>
							</div>
							{s.shakeEnabled ? (
								<>
									<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
										<Slider
											label="Shake amount"
											value={s.shakeAmount}
											min={0}
											max={1}
											step={0.01}
											onChange={set.setShakeAmount}
											variant="compact"
											formatValue={formatDecimal}
										/>
										<Slider
											label="Shake decay"
											value={s.shakeDecay}
											min={0.5}
											max={0.98}
											step={0.01}
											onChange={set.setShakeDecay}
											variant="compact"
											formatValue={formatDecimal}
										/>
										<Slider
											label="Shake threshold"
											value={s.shakeThreshold}
											min={0}
											max={1}
											step={0.01}
											onChange={set.setShakeThreshold}
											variant="compact"
											formatValue={formatDecimal}
										/>
									</div>
									<SegmentedControl<'kick' | 'bass' | 'full'>
										value={s.shakeChannel}
										onChange={set.setShakeChannel}
										options={[
											{ value: 'kick', label: 'Kick' },
											{ value: 'bass', label: 'Bass' },
											{ value: 'full', label: 'Full' }
										]}
										size="sm"
										full
									/>
								</>
							) : null}
						</div>
					</CollapsibleSection>
				) : null}
			</div>
		</SectionCard>
	);
}
