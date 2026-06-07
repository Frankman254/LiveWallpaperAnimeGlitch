import { RAIN_RANGES } from '@/config/ranges';
import type {
	ColorSourceMode,
	RainColorMode,
	RainParticleType
} from '@/types/wallpaper';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';
import { CollapsibleSection, SectionCard, ToggleSwitch, UI_COLORS } from '@/ui';

import {
	ColorField,
	MotionSlider as Slider,
	OptionButtonGroup,
	ProfileSlotsGrid
} from './MotionSharedControls';
import {
	COLOR_SOURCES,
	RAIN_COLOR_MODES,
	RAIN_PARTICLE_TYPES,
	formatDecimal,
	formatInteger
} from './motionTabUtils';

type RainStore = Pick<
	WallpaperStore,
	| 'rainEnabled'
	| 'rainIntensity'
	| 'rainDropCount'
	| 'rainSpeed'
	| 'rainAngle'
	| 'rainMeshRotationZ'
	| 'rainColorSource'
	| 'rainColor'
	| 'rainColorMode'
	| 'rainParticleType'
	| 'rainLength'
	| 'rainWidth'
	| 'rainBlur'
	| 'rainVariation'
	| 'rainProfileSlots'
	| 'setRainEnabled'
	| 'setRainIntensity'
	| 'setRainDropCount'
	| 'setRainSpeed'
	| 'setRainAngle'
	| 'setRainMeshRotationZ'
	| 'setRainColorSource'
	| 'setRainColor'
	| 'setRainColorMode'
	| 'setRainParticleType'
	| 'setRainLength'
	| 'setRainWidth'
	| 'setRainBlur'
	| 'setRainVariation'
	| 'loadRainProfileSlot'
	| 'saveRainProfileSlot'
	| 'addRainProfileSlot'
	| 'removeRainProfileSlot'
>;

export function RainSection({
	store,
	colorSourceLabels,
	labels,
	showSavedProfiles = true
}: {
	store: RainStore;
	colorSourceLabels: Record<ColorSourceMode, string>;
	showSavedProfiles?: boolean;
	labels: {
		title: string;
		subtitle: string;
		enabled: string;
		intensity: string;
		count: string;
		speed: string;
		direction: string;
		angle: string;
		rotationZ: string;
		style: string;
		colorSource: string;
		color: string;
		colorMode: string;
		type: string;
		length: string;
		width: string;
		blur: string;
		variation: string;
		themeHint: string;
		imageHint: string;
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
			action={
				<div className="flex items-center gap-1.5">
					<ToggleSwitch
						checked={store.rainEnabled}
						onChange={store.setRainEnabled}
						size="sm"
						ariaLabel={labels.enabled}
					/>
				</div>
			}
			density="compact"
		>
			{store.rainEnabled ? (
				<div className="flex flex-col gap-3">
					<Slider
						label={labels.intensity}
						value={store.rainIntensity}
						{...RAIN_RANGES.intensity}
						onChange={store.setRainIntensity}
						variant="macro"
						formatValue={formatDecimal}
					/>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
						<Slider
							label={labels.count}
							value={store.rainDropCount}
							{...RAIN_RANGES.dropCount}
							onChange={store.setRainDropCount}
							variant="compact"
							formatValue={formatInteger}
						/>
						<Slider
							label={labels.speed}
							value={store.rainSpeed}
							{...RAIN_RANGES.speed}
							onChange={store.setRainSpeed}
							variant="compact"
							formatValue={formatDecimal}
						/>
					</div>
					<CollapsibleSection
						title={labels.direction}
						defaultOpen={false}
						dense
					>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<Slider
								label={labels.angle}
								value={store.rainAngle}
								{...RAIN_RANGES.angle}
								onChange={store.setRainAngle}
								unit="deg"
								variant="compact"
								formatValue={formatInteger}
							/>
							<Slider
								label={labels.rotationZ}
								value={store.rainMeshRotationZ}
								{...RAIN_RANGES.meshRotationZ}
								onChange={store.setRainMeshRotationZ}
								unit="deg"
								variant="compact"
								formatValue={formatInteger}
							/>
						</div>
					</CollapsibleSection>
					<CollapsibleSection
						title={labels.style}
						defaultOpen={false}
						dense
					>
						<div className="flex flex-col gap-3">
							<OptionButtonGroup<ColorSourceMode>
								label={labels.colorSource}
								options={COLOR_SOURCES}
								value={store.rainColorSource}
								onChange={store.setRainColorSource}
								labels={colorSourceLabels}
								columns={3}
							/>
							{store.rainColorSource === 'manual' ? (
								<ColorField
									label={labels.color}
									value={store.rainColor}
									onChange={store.setRainColor}
								/>
							) : (
								<span
									className="text-[11px]"
									style={{ color: UI_COLORS.fgMute }}
								>
									{store.rainColorSource === 'theme'
										? labels.themeHint
										: labels.imageHint}
								</span>
							)}
							<OptionButtonGroup<RainColorMode>
								label={labels.colorMode}
								options={RAIN_COLOR_MODES}
								value={store.rainColorMode}
								onChange={store.setRainColorMode}
								columns={2}
							/>
							<OptionButtonGroup<RainParticleType>
								label={labels.type}
								options={RAIN_PARTICLE_TYPES}
								value={store.rainParticleType}
								onChange={store.setRainParticleType}
								columns={2}
							/>
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<Slider
									label={labels.length}
									value={store.rainLength}
									{...RAIN_RANGES.length}
									onChange={store.setRainLength}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label={labels.width}
									value={store.rainWidth}
									{...RAIN_RANGES.width}
									onChange={store.setRainWidth}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label={labels.blur}
									value={store.rainBlur}
									{...RAIN_RANGES.blur}
									onChange={store.setRainBlur}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label={labels.variation}
									value={store.rainVariation}
									{...RAIN_RANGES.variation}
									onChange={store.setRainVariation}
									variant="compact"
									formatValue={formatDecimal}
								/>
							</div>
						</div>
					</CollapsibleSection>
					{showSavedProfiles ? (
						<CollapsibleSection
							title={labels.savedProfiles}
							defaultOpen={false}
							dense
						>
							<ProfileSlotsGrid
								slots={store.rainProfileSlots}
								activeIndex={null}
								onLoad={store.loadRainProfileSlot}
								onSave={store.saveRainProfileSlot}
								onAdd={store.addRainProfileSlot}
								onDelete={store.removeRainProfileSlot}
								loadLabel={labels.load}
								saveLabel={labels.save}
								slotLabel={labels.slot}
								emptyLabel={labels.empty}
								activeLabel={labels.active}
							/>
						</CollapsibleSection>
					) : null}
				</div>
			) : null}
		</SectionCard>
	);
}
