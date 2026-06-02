import { useShallow } from 'zustand/react/shallow';
import {
	CollapsibleSection,
	SectionCard,
	SegmentedControl,
	Slider,
	ToggleSwitch
} from '@/ui';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { ColorField } from './MotionSharedControls';
import { formatDecimal, formatInteger } from './motionTabUtils';

/**
 * Stage Lights FX controls (Task 2/4). Macro controls always visible; detailed
 * controls revealed in Advanced UI mode. The render-side layer is
 * `features/stageFx/StageLightsCanvas`.
 */
export function StageLightsSection() {
	const s = useWallpaperStore(
		useShallow(state => ({
			enabled: state.stageLightsEnabled,
			intensity: state.stageLightsIntensity,
			beamCount: state.stageLightsBeamCount,
			beamWidth: state.stageLightsBeamWidth,
			softness: state.stageLightsSoftness,
			speed: state.stageLightsSpeed,
			colorSource: state.stageLightsColorSource,
			color: state.stageLightsColor,
			audioReactive: state.stageLightsAudioReactive,
			audioChannel: state.stageLightsAudioChannel,
			peakFlash: state.stageLightsPeakFlash,
			peakThreshold: state.stageLightsPeakThreshold,
			opacity: state.stageLightsOpacity,
			blendMode: state.stageLightsBlendMode,
			advanced: state.uiMode === 'advanced'
		}))
	);
	const set = useWallpaperStore(
		useShallow(state => ({
			setEnabled: state.setStageLightsEnabled,
			setIntensity: state.setStageLightsIntensity,
			setBeamCount: state.setStageLightsBeamCount,
			setBeamWidth: state.setStageLightsBeamWidth,
			setSoftness: state.setStageLightsSoftness,
			setSpeed: state.setStageLightsSpeed,
			setColorSource: state.setStageLightsColorSource,
			setColor: state.setStageLightsColor,
			setAudioReactive: state.setStageLightsAudioReactive,
			setAudioChannel: state.setStageLightsAudioChannel,
			setPeakFlash: state.setStageLightsPeakFlash,
			setPeakThreshold: state.setStageLightsPeakThreshold,
			setOpacity: state.setStageLightsOpacity,
			setBlendMode: state.setStageLightsBlendMode
		}))
	);

	return (
		<SectionCard
			title="Stage Lights"
			subtitle="Hardstyle concert beams reacting to the kick"
			action={
				<ToggleSwitch
					checked={s.enabled}
					onChange={set.setEnabled}
					size="sm"
					ariaLabel="Enable Stage Lights"
				/>
			}
			density="compact"
		>
			<div className="flex flex-col gap-3">
				<Slider
					label="Intensity"
					value={s.intensity}
					min={0}
					max={1}
					step={0.01}
					onChange={set.setIntensity}
					variant="macro"
					formatValue={formatDecimal}
				/>
				{s.advanced ? (
					<>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<Slider
								label="Beams"
								value={s.beamCount}
								min={1}
								max={12}
								step={1}
								onChange={set.setBeamCount}
								variant="compact"
								formatValue={formatInteger}
							/>
							<Slider
								label="Opacity"
								value={s.opacity}
								min={0}
								max={0.85}
								step={0.01}
								onChange={set.setOpacity}
								variant="compact"
								formatValue={formatDecimal}
							/>
						</div>
						<SegmentedControl<'manual' | 'theme' | 'image'>
							value={s.colorSource}
							onChange={set.setColorSource}
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
								onChange={set.setColor}
							/>
						) : null}
					</>
				) : null}

				{s.advanced ? (
					<CollapsibleSection title="Advanced" defaultOpen={false} dense>
						<div className="flex flex-col gap-3">
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<Slider
									label="Beam width"
									value={s.beamWidth}
									min={0}
									max={1}
									step={0.01}
									onChange={set.setBeamWidth}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label="Softness"
									value={s.softness}
									min={0}
									max={1}
									step={0.01}
									onChange={set.setSoftness}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label="Sweep speed"
									value={s.speed}
									min={0}
									max={2}
									step={0.01}
									onChange={set.setSpeed}
									variant="compact"
									formatValue={formatDecimal}
								/>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-[11px]">Audio reactive</span>
								<ToggleSwitch
									checked={s.audioReactive}
									onChange={set.setAudioReactive}
									size="sm"
									ariaLabel="Stage Lights audio reactive"
								/>
							</div>
							{s.audioReactive ? (
								<>
									<SegmentedControl<'kick' | 'bass' | 'full'>
										value={s.audioChannel}
										onChange={set.setAudioChannel}
										options={[
											{ value: 'kick', label: 'Kick' },
											{ value: 'bass', label: 'Bass' },
											{ value: 'full', label: 'Full' }
										]}
										size="sm"
										full
									/>
									<div className="flex items-center justify-between">
										<span className="text-[11px]">
											Peak flash
										</span>
										<ToggleSwitch
											checked={s.peakFlash}
											onChange={set.setPeakFlash}
											size="sm"
											ariaLabel="Stage Lights peak flash"
										/>
									</div>
									{s.peakFlash ? (
										<Slider
											label="Peak threshold"
											value={s.peakThreshold}
											min={0}
											max={1}
											step={0.01}
											onChange={set.setPeakThreshold}
											variant="compact"
											formatValue={formatDecimal}
										/>
									) : null}
								</>
							) : null}
							<SegmentedControl<
								'lighter' | 'screen' | 'source-over'
							>
								value={s.blendMode}
								onChange={set.setBlendMode}
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
