/**
 * "Randomize motion" generator. Rolls a believable particle look — counts,
 * sizes, glow and audio reactivity stay inside the real ranges and dependent
 * pairs are kept sane (size max is always > min, opacity/count never collapse
 * to invisible). Rain and Stage FX are left untouched so a roll never silently
 * turns on heavy effects.
 */

import { PARTICLE_RANGES } from '@/config/ranges';
import {
	randomChance,
	randomChoice,
	randomInRange,
	randomVividColor,
	snapToRange
} from '@/lib/randomize';
import type {
	AudioReactiveChannel,
	ColorSourceMode,
	ParticleColorMode,
	ParticleLayerMode,
	ParticleRotationDirection,
	ParticleShape,
	WallpaperState
} from '@/types/wallpaper';

type MotionRandomPatch = Partial<
	Pick<
		WallpaperState,
		| 'particlesEnabled'
		| 'particleLayerMode'
		| 'particleShape'
		| 'particleCount'
		| 'particleSpeed'
		| 'particleLifetime'
		| 'particleSizeMin'
		| 'particleSizeMax'
		| 'particleOpacity'
		| 'particleGlow'
		| 'particleGlowStrength'
		| 'particleColorSource'
		| 'particleColorMode'
		| 'particleColor1'
		| 'particleColor2'
		| 'particleRotationIntensity'
		| 'particleRotationDirection'
		| 'particleAudioReactive'
		| 'particleAudioChannel'
		| 'particleAudioSizeBoost'
		| 'particleAudioOpacityBoost'
	>
>;

const PARTICLE_SHAPES: ParticleShape[] = [
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

const PARTICLE_COLOR_MODES: ParticleColorMode[] = [
	'solid',
	'gradient',
	'rainbow',
	'rotateRgb'
];

const LAYER_MODES: ParticleLayerMode[] = [
	'background',
	'foreground',
	'both'
];

const ROTATION_DIRECTIONS: ParticleRotationDirection[] = [
	'clockwise',
	'counterclockwise'
];

// Bias toward channels that carry steady musical energy so the particles
// visibly react rather than sitting still on sparse bands.
const AUDIO_CHANNELS: AudioReactiveChannel[] = [
	'instrumental',
	'kick',
	'bass',
	'full'
];

export function generateRandomMotionProfile(
	colorSource: ColorSourceMode
): MotionRandomPatch {
	// Size: pick a floor, then guarantee the ceiling sits above it so the
	// renderer never receives min > max (which collapses every particle to one
	// size / can read as inert).
	const sizeMin = randomInRange(PARTICLE_RANGES.sizeMin, { min: 2, max: 6 });
	const sizeMax = snapToRange(
		sizeMin + randomInRange(PARTICLE_RANGES.sizeMax, { min: 4, max: 16 }),
		PARTICLE_RANGES.sizeMax
	);

	const glow = randomChance(0.6);
	const rotates = randomChance(0.5);

	return {
		particlesEnabled: true,
		particleLayerMode: randomChoice(LAYER_MODES),
		particleShape: randomChoice(PARTICLE_SHAPES),
		// Count stays in a lively-but-safe band (step is 10 in the range).
		particleCount: snapToRange(
			randomInRange(PARTICLE_RANGES.count, { min: 40, max: 160 }),
			PARTICLE_RANGES.count
		),
		particleSpeed: randomInRange(PARTICLE_RANGES.speed, {
			min: 0.2,
			max: 1.6
		}),
		// Long enough to actually watch motion play out before respawn.
		particleLifetime: randomInRange(PARTICLE_RANGES.lifetime, {
			min: 0.8,
			max: 2.5
		}),
		particleSizeMin: sizeMin,
		particleSizeMax: sizeMax,
		// Never near-invisible.
		particleOpacity: randomInRange(PARTICLE_RANGES.opacity, {
			min: 0.5,
			max: 0.95
		}),
		particleGlow: glow,
		particleGlowStrength: glow
			? randomInRange(PARTICLE_RANGES.glowStrength, {
					min: 0.3,
					max: 1.0
				})
			: 0,
		particleColorSource: colorSource,
		particleColorMode: randomChoice(PARTICLE_COLOR_MODES),
		particleColor1: randomVividColor(),
		particleColor2: randomVividColor(),
		particleRotationIntensity: rotates
			? randomInRange(PARTICLE_RANGES.rotationIntensity, {
					min: 0.3,
					max: 2
				})
			: 0,
		particleRotationDirection: randomChoice(ROTATION_DIRECTIONS),
		// Reactive by default so the roll feels alive with the music.
		particleAudioReactive: true,
		particleAudioChannel: randomChoice(AUDIO_CHANNELS),
		particleAudioSizeBoost: randomInRange(PARTICLE_RANGES.audioSizeBoost, {
			min: 1.5,
			max: 4
		}),
		particleAudioOpacityBoost: randomInRange(
			PARTICLE_RANGES.audioOpacityBoost,
			{ min: 0.1, max: 0.4 }
		)
	};
}
