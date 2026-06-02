import { useShallow } from 'zustand/react/shallow';
import {
	CollapsibleSection,
	SectionCard,
	SegmentedControl,
	Slider,
	ToggleSwitch
} from '@/ui';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type {
	CameraMotionDirection,
	CameraMotionMode
} from '@/features/stageFx/stageFxConfig';
import { formatDecimal } from './motionTabUtils';

/** Continuous camera movement. Peak vibration lives in `ScreenShakeSection`. */
export function CameraMotionSection() {
	const s = useWallpaperStore(
		useShallow(state => ({
			enabled: state.cameraMotionEnabled,
			mode: state.cameraMotionMode,
			amount: state.cameraMotionAmount,
			speed: state.cameraMotionSpeed,
			audioInfluence: state.cameraMotionAudioInfluence,
			audioChannel: state.cameraMotionAudioChannel,
			direction: state.cameraMotionDirection,
			advanced: state.uiMode === 'advanced'
		}))
	);
	const set = useWallpaperStore(
		useShallow(state => ({
			enabled: state.setCameraMotionEnabled,
			mode: state.setCameraMotionMode,
			amount: state.setCameraMotionAmount,
			speed: state.setCameraMotionSpeed,
			audioInfluence: state.setCameraMotionAudioInfluence,
			audioChannel: state.setCameraMotionAudioChannel,
			direction: state.setCameraMotionDirection
		}))
	);

	return (
		<SectionCard
			title="Camera Motion"
			subtitle="Continuous visual-layer movement; HUD stays fixed"
			action={
				<ToggleSwitch
					checked={s.enabled}
					onChange={set.enabled}
					size="sm"
					ariaLabel="Enable Camera Motion"
				/>
			}
			density="compact"
		>
			<div className="flex flex-col gap-3">
				<SegmentedControl<CameraMotionMode>
					value={s.mode}
					onChange={set.mode}
					options={[
						{ value: 'none', label: 'Off' },
						{ value: 'drift', label: 'Drift' },
						{ value: 'circle', label: 'Circle' },
						{ value: 'semicircle', label: 'Semi' },
						{ value: 'figure-eight', label: 'Eight' },
						{ value: 'orbit', label: 'Orbit' },
						{ value: 'pendulum', label: 'Pendulum' }
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
					onChange={set.amount}
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
									onChange={set.speed}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label="Audio influence"
									value={s.audioInfluence}
									min={0}
									max={1}
									step={0.01}
									onChange={set.audioInfluence}
									variant="compact"
									formatValue={formatDecimal}
								/>
							</div>
							<SegmentedControl<CameraMotionDirection>
								value={s.direction}
								onChange={set.direction}
								options={[
									{ value: 'cw', label: 'Clockwise' },
									{ value: 'ccw', label: 'Counter' }
								]}
								size="sm"
								full
							/>
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
							<p className="text-[11px] opacity-60">
								Target: All visual layers. Per-layer targeting remains a
								V2 render-graph task.
							</p>
						</div>
					</CollapsibleSection>
				) : null}
			</div>
		</SectionCard>
	);
}
