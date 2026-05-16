import { RotateCcw } from 'lucide-react';

import { PARTICLE_RANGES } from '@/config/ranges';
import type {
	ParticleLayerMode,
	ParticleShape,
	WallpaperState
} from '@/types/wallpaper';
import {
	ICON_SIZE,
	IconButton,
	SectionCard,
	Slider,
	ToggleSwitch
} from '@/ui';

import { OptionButtonGroup } from './MotionSharedControls';
import {
	PARTICLE_LAYER_MODES,
	PARTICLE_SHAPES,
	formatDecimal,
	formatInteger
} from './motionTabUtils';

type ParticlesLayerStore = Pick<
	WallpaperState,
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
	onResetParticles,
	labels
}: {
	store: ParticlesLayerStore;
	effectiveParticleCount: number;
	particleLimit: number;
	particleShapeLabels: Record<ParticleShape, string>;
	onResetParticles: () => void;
	labels: {
		title: string;
		layerMode: string;
		particleShape: string;
		count: string;
		speed: string;
		enabled: string;
		reset: string;
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
					<IconButton
						size="sm"
						density="compact"
						onClick={onResetParticles}
						title={labels.reset}
					>
						<RotateCcw size={ICON_SIZE.xs} />
					</IconButton>
				</div>
			}
			density="compact"
		>
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
		</SectionCard>
	);
}
