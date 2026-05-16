import { AUDIO_REACTIVE_CHANNELS } from '@/lib/audio/audioChannels';
import { PARTICLE_FILTER_RANGES, PARTICLE_RANGES } from '@/config/ranges';
import type {
	AudioReactiveChannel,
	ColorSourceMode,
	ParticleColorMode,
	ParticleRotationDirection
} from '@/types/wallpaper';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';
import { CollapsibleSection, SectionCard, Slider, UI_COLORS } from '@/ui';

import {
	ColorField,
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
	| 'particleScanlineIntensity'
	| 'particleScanlineSpacing'
	| 'particleScanlineThickness'
	| 'particleAudioReactive'
	| 'particleAudioChannel'
	| 'particleAudioSizeBoost'
	| 'particleAudioOpacityBoost'
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
	| 'setParticleScanlineIntensity'
	| 'setParticleScanlineSpacing'
	| 'setParticleScanlineThickness'
	| 'setParticleAudioReactive'
	| 'setParticleAudioChannel'
	| 'setParticleAudioSizeBoost'
	| 'setParticleAudioOpacityBoost'
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
	labels
}: {
	store: ParticlesAppearanceStore;
	particleColorModeLabels: Record<ParticleColorMode, string>;
	colorSourceLabels: Record<ColorSourceMode, string>;
	particleRotationLabels: Record<ParticleRotationDirection, string>;
	audioChannelLabels: Record<AudioReactiveChannel, string>;
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
		scanlines: string;
		spacing: string;
		thickness: string;
		audioResponse: string;
		audioReactive: string;
		audioChannel: string;
		audioSizeBoost: string;
		audioOpacityBoost: string;
		savedProfiles: string;
		load: string;
		save: string;
		slot: string;
		empty: string;
		active: string;
	};
}) {
	return (
		<SectionCard
			title={labels.title}
			subtitle={labels.subtitle}
			density="compact"
		>
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
						<Slider
							label={labels.scanlines}
							value={store.particleScanlineIntensity}
							{...PARTICLE_RANGES.scanlineIntensity}
							onChange={store.setParticleScanlineIntensity}
							variant="compact"
							formatValue={formatDecimal}
						/>
						{store.particleScanlineIntensity > 0 ? (
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<Slider
									label={labels.spacing}
									value={store.particleScanlineSpacing}
									{...PARTICLE_RANGES.scanlineSpacing}
									onChange={store.setParticleScanlineSpacing}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label={labels.thickness}
									value={store.particleScanlineThickness}
									{...PARTICLE_RANGES.scanlineThickness}
									onChange={store.setParticleScanlineThickness}
									variant="compact"
									formatValue={formatDecimal}
								/>
							</div>
						) : null}
					</div>
				</CollapsibleSection>
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
									label={labels.audioSizeBoost}
									value={store.particleAudioSizeBoost}
									{...PARTICLE_RANGES.audioSizeBoost}
									onChange={store.setParticleAudioSizeBoost}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label={labels.audioOpacityBoost}
									value={store.particleAudioOpacityBoost}
									{...PARTICLE_RANGES.audioOpacityBoost}
									onChange={store.setParticleAudioOpacityBoost}
									variant="compact"
									formatValue={formatDecimal}
								/>
							</>
						) : null}
					</div>
				</CollapsibleSection>
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
