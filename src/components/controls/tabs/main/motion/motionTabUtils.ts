import type {
	ColorSourceMode,
	ParticleColorMode,
	ParticleLayerMode,
	ParticleRotationDirection,
	ParticleShape,
	RainColorMode,
	RainParticleType
} from '@/types/wallpaper';

export type ProfileSlotLike = {
	name: string;
	values: unknown | null;
};

export const COLOR_SOURCES: ColorSourceMode[] = ['manual', 'image', 'theme'];

export const PARTICLE_COLOR_MODES: ParticleColorMode[] = [
	'solid',
	'gradient',
	'rainbow',
	'rotateRgb'
];

export const PARTICLE_LAYER_MODES: ParticleLayerMode[] = [
	'background',
	'foreground',
	'both'
];

export const PARTICLE_SHAPES: ParticleShape[] = [
	'circles',
	'squares',
	'triangles',
	'stars',
	'plus',
	'minus',
	'diamonds',
	'cross',
	'all'
];

export const PARTICLE_ROTATION_DIRECTIONS: ParticleRotationDirection[] = [
	'clockwise',
	'counterclockwise'
];

export const RAIN_PARTICLE_TYPES: RainParticleType[] = [
	'lines',
	'drops',
	'dots',
	'bars'
];

export const RAIN_COLOR_MODES: RainColorMode[] = ['solid', 'rainbow'];

export const MAX_MOTION_PROFILE_SLOTS = 20;

export const MAX_FEATURE_PROFILE_SLOTS = 10;

export function formatDecimal(value: number): string {
	return value.toFixed(2);
}

export function formatInteger(value: number): string {
	return Math.round(value).toString();
}

export function sharedColorSource(
	values: ColorSourceMode[]
): ColorSourceMode | null {
	const first = values[0];
	if (!first) return null;
	return values.every(value => value === first) ? first : null;
}
