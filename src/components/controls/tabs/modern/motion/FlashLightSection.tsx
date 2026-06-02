import { useShallow } from 'zustand/react/shallow';
import {
	CollapsibleSection,
	SectionCard,
	SegmentedControl,
	Slider,
	ToggleSwitch
} from '@/ui';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { FlashLightShape } from '@/features/stageFx/stageFxConfig';
import { ColorField } from './MotionSharedControls';
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
			threshold: state.flashLightThreshold,
			sensitivity: state.flashLightSensitivity,
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
			threshold: state.setFlashLightThreshold,
			sensitivity: state.setFlashLightSensitivity,
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
			<div className="flex flex-col gap-3">
				<Slider
					label="Intensity"
					value={s.intensity}
					min={0}
					max={0.62}
					step={0.01}
					onChange={set.intensity}
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
					<CollapsibleSection title="Advanced" defaultOpen={false} dense>
						<div className="flex flex-col gap-3">
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<Slider
									label="Threshold"
									value={s.threshold}
									min={0}
									max={1}
									step={0.01}
									onChange={set.threshold}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label="Sensitivity"
									value={s.sensitivity}
									min={0}
									max={2}
									step={0.01}
									onChange={set.sensitivity}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label="Decay"
									value={s.decay}
									min={0.1}
									max={6}
									step={0.1}
									onChange={set.decay}
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
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label="Brightness"
									value={s.brightness}
									min={0}
									max={2}
									step={0.01}
									onChange={set.brightness}
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
							<SegmentedControl<'lighter' | 'screen' | 'source-over'>
								value={s.blendMode}
								onChange={set.blendMode}
								options={[
									{ value: 'lighter', label: 'Add' },
									{ value: 'screen', label: 'Screen' },
									{ value: 'source-over', label: 'Normal' }
								]}
								size="sm"
								full
							/>
						</div>
					</CollapsibleSection>
				) : null}
			</div>
		</SectionCard>
	);
}
