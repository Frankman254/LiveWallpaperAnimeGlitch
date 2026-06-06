import { PARTICLE_RANGES } from '@/config/ranges';
import type { ParticleLayerMode, ParticleShape } from '@/types/wallpaper';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';
import { SectionCard, ToggleSwitch } from '@/ui';

import {
	MotionSlider as Slider,
	OptionButtonGroup
} from './MotionSharedControls';
import {
	PARTICLE_LAYER_MODES,
	PARTICLE_SHAPES,
	formatDecimal,
	formatInteger
} from './motionTabUtils';

type ParticlesLayerStore = Pick<
	WallpaperStore,
	| 'particlesEnabled'
	| 'particleLayerMode'
	| 'particleShape'
	| 'particleCount'
	| 'particleSpeed'
	| 'setParticlesEnabled'
	| 'setParticleLayerMode'
	| 'setParticleShape'
	| 'setParticleCount'
	| 'setParticleSpeed'
>;

export function ParticlesLayerSection({
	store,
	effectiveParticleCount,
	particleLimit,
	particleShapeLabels,
	labels
}: {
	store: ParticlesLayerStore;
	effectiveParticleCount: number;
	particleLimit: number;
	particleShapeLabels: Record<ParticleShape, string>;
	labels: {
		title: string;
		layerMode: string;
		particleShape: string;
		count: string;
		speed: string;
		enabled: string;
	};
}) {
	return (
		<SectionCard
			title={labels.title}
			subtitle={`${effectiveParticleCount}/${particleLimit} active particles`}
			action={
				<div className="flex items-center gap-1.5">
					<ToggleSwitch
						checked={store.particlesEnabled}
						onChange={store.setParticlesEnabled}
						size="sm"
						ariaLabel={labels.enabled}
					/>
				</div>
			}
			density="compact"
		>
			{store.particlesEnabled ? (
				<div className="flex flex-col gap-3">
					<OptionButtonGroup<ParticleLayerMode>
						label={labels.layerMode}
						options={PARTICLE_LAYER_MODES}
						value={store.particleLayerMode}
						onChange={store.setParticleLayerMode}
						columns={3}
					/>
					<OptionButtonGroup<ParticleShape>
						label={labels.particleShape}
						options={PARTICLE_SHAPES}
						value={store.particleShape}
						onChange={store.setParticleShape}
						labels={particleShapeLabels}
					/>
					<Slider
						label={labels.count}
						value={store.particleCount}
						{...PARTICLE_RANGES.count}
						onChange={store.setParticleCount}
						variant="macro"
						formatValue={formatInteger}
						valueDisplay={
							effectiveParticleCount !== store.particleCount
								? `${formatInteger(store.particleCount)} / ${effectiveParticleCount}`
								: formatInteger(store.particleCount)
						}
					/>
					<Slider
						label={labels.speed}
						value={store.particleSpeed}
						{...PARTICLE_RANGES.speed}
						onChange={store.setParticleSpeed}
						variant="compact"
						formatValue={formatDecimal}
					/>
				</div>
			) : null}
		</SectionCard>
	);
}
