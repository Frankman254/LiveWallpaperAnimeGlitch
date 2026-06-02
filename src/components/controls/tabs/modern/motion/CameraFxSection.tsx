import { useShallow } from 'zustand/react/shallow';
import {
	Button,
	CollapsibleSection,
	SectionCard,
	SegmentedControl,
	ToggleSwitch
} from '@/ui';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { FACTORY_DEFAULT_STATE } from '@/lib/factoryDefaults';
import type {
	CameraMotionDirection,
	CameraMotionDrive,
	CameraMotionMode,
	CameraMotionTarget
} from '@/features/stageFx/stageFxConfig';
import { formatDecimal } from './motionTabUtils';
import { MotionSlider as Slider } from './MotionSharedControls';

const CAMERA_MOTION_TARGETS: CameraMotionTarget[] = [
	'global-background',
	'background',
	'selected-overlay',
	'logo',
	'spectrum',
	'particles',
	'rain',
	'track-title',
	'lyrics',
	'stage-lights',
	'flash-light'
];

const CAMERA_MOTION_TARGET_LABELS: Record<CameraMotionTarget, string> = {
	'global-background': 'Global BG',
	background: 'Background',
	'selected-overlay': 'Overlays',
	logo: 'Logo',
	spectrum: 'Spectrum',
	particles: 'Particles',
	rain: 'Rain',
	'track-title': 'Track Title',
	lyrics: 'Lyrics',
	'stage-lights': 'Stage Lights',
	'flash-light': 'Flash Light'
};

/** Continuous camera movement. Peak vibration lives in `ScreenShakeSection`. */
export function CameraMotionSection() {
	const s = useWallpaperStore(
		useShallow(state => ({
			enabled: state.cameraMotionEnabled,
			mode: state.cameraMotionMode,
			amount: state.cameraMotionAmount,
			speed: state.cameraMotionSpeed,
			drive: state.cameraMotionDrive,
			audioInfluence: state.cameraMotionAudioInfluence,
			audioChannel: state.cameraMotionAudioChannel,
			direction: state.cameraMotionDirection,
			targets: state.cameraMotionTargets,
			hasOverlay: state.overlays.some(overlay => overlay.enabled),
			advanced: state.uiMode === 'advanced'
		}))
	);
	const set = useWallpaperStore(
		useShallow(state => ({
			enabled: state.setCameraMotionEnabled,
			mode: state.setCameraMotionMode,
			amount: state.setCameraMotionAmount,
			speed: state.setCameraMotionSpeed,
			drive: state.setCameraMotionDrive,
			audioInfluence: state.setCameraMotionAudioInfluence,
			audioChannel: state.setCameraMotionAudioChannel,
			direction: state.setCameraMotionDirection,
			targets: state.setCameraMotionTargets
		}))
	);
	const hasAudioDrive = s.drive === 'audio' || s.drive === 'fixed-audio';
	const availableTargets = s.hasOverlay
		? CAMERA_MOTION_TARGETS
		: CAMERA_MOTION_TARGETS.filter(target => target !== 'selected-overlay');
	const allTargetsEnabled = availableTargets.every(target =>
		s.targets.includes(target)
	);

	function toggleTarget(target: CameraMotionTarget) {
		if (target === 'selected-overlay' && !s.hasOverlay) return;
		const next = s.targets.includes(target)
			? s.targets.filter(item => item !== target)
			: [...s.targets, target];
		set.targets(next.length > 0 ? next : ['background']);
	}

	function toggleAllTargets() {
		set.targets(allTargetsEnabled ? ['background'] : [...availableTargets]);
	}

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
			{s.enabled ? (
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
						max={1.5}
						step={0.01}
						onChange={set.amount}
						defaultValue={FACTORY_DEFAULT_STATE.cameraMotionAmount}
						variant="macro"
						formatValue={formatDecimal}
					/>
					<SegmentedControl<CameraMotionDrive>
						value={s.drive}
						onChange={set.drive}
						options={[
							{ value: 'fixed', label: 'Fixed' },
							{ value: 'audio', label: 'Audio' },
							{ value: 'fixed-audio', label: 'Fixed + Audio' }
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
										label="Motion speed"
										value={s.speed}
										min={0}
										max={4}
										step={0.01}
										onChange={set.speed}
										defaultValue={
											FACTORY_DEFAULT_STATE.cameraMotionSpeed
										}
										variant="compact"
										formatValue={formatDecimal}
									/>
									{hasAudioDrive ? (
										<Slider
											label="Audio speed influence"
											value={s.audioInfluence}
											min={0}
											max={3}
											step={0.01}
											onChange={set.audioInfluence}
											defaultValue={
												FACTORY_DEFAULT_STATE.cameraMotionAudioInfluence
											}
											variant="compact"
											formatValue={formatDecimal}
										/>
									) : null}
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
								{hasAudioDrive ? (
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
								) : null}
								<div className="flex flex-col gap-1.5">
									<div className="flex items-center justify-between gap-2">
										<span className="text-xs text-[var(--editor-text-muted)]">
											Affected layers
										</span>
										<Button
											type="button"
											onClick={toggleAllTargets}
											size="sm"
											density="compact"
											variant={
												allTargetsEnabled
													? 'primary'
													: 'secondary'
											}
										>
											All
										</Button>
									</div>
									<div className="flex flex-wrap gap-1">
										{CAMERA_MOTION_TARGETS.map(target => {
											const disabled =
												target === 'selected-overlay' &&
												!s.hasOverlay;
											const active =
												s.targets.includes(target);
											return (
												<Button
													key={target}
													type="button"
													onClick={() =>
														toggleTarget(target)
													}
													disabled={disabled}
													variant={
														active
															? 'primary'
															: 'secondary'
													}
													size="sm"
													density="compact"
													active={active}
												>
													{
														CAMERA_MOTION_TARGET_LABELS[
															target
														]
													}
												</Button>
											);
										})}
									</div>
								</div>
							</div>
						</CollapsibleSection>
					) : null}
				</div>
			) : null}
		</SectionCard>
	);
}
