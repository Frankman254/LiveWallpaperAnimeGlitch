import type {
	ColorSourceMode,
	SpectrumLinearDirection,
	SpectrumLinearOrientation,
	SpectrumProfileSettings
} from '@/types/wallpaper';

export function randomChoice<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export function randomFloat(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
	return Math.floor(randomFloat(min, max + 1));
}

export function generateRandomSpectrumParams(
	colorSource: ColorSourceMode
): Partial<SpectrumProfileSettings> {
	const mode = randomChoice(['radial', 'linear'] as const);

	const primaryColor = `hsl(${randomInt(0, 360)}, ${randomInt(60, 100)}%, ${randomInt(40, 60)}%)`;
	const secondaryColor = `hsl(${randomInt(0, 360)}, ${randomInt(60, 100)}%, ${randomInt(40, 60)}%)`;

	const isClone = Math.random() > 0.3;

	let posX = 0;
	let posY = 0;
	let orientation: SpectrumLinearOrientation = 'horizontal';
	let direction: SpectrumLinearDirection = 'normal';

	if (mode === 'linear') {
		const edge = randomChoice(['top', 'bottom', 'left', 'right'] as const);
		if (edge === 'top') {
			posY = 1;
			orientation = 'horizontal';
			direction = 'flipped';
		} else if (edge === 'bottom') {
			posY = -1;
			orientation = 'horizontal';
			direction = 'normal';
		} else if (edge === 'left') {
			posX = -1;
			orientation = 'vertical';
			direction = 'normal';
		} else if (edge === 'right') {
			posX = 1;
			orientation = 'vertical';
			direction = 'flipped';
		}
	} else {
		posX = randomFloat(-0.2, 0.2);
		posY = randomFloat(-0.2, 0.2);
	}

	const mainShapes =
		mode === 'radial'
			? (['bars', 'blocks', 'wave', 'dots'] as const)
			: (['bars', 'blocks', 'wave', 'dots', 'capsules'] as const);

	const cloneShapes = ['bars', 'blocks', 'wave', 'dots'] as const;

	return {
		spectrumEnabled: true,
		spectrumMode: mode,
		spectrumShape: randomChoice(mainShapes),
		spectrumColorSource: colorSource,
		spectrumColorMode: randomChoice([
			'solid',
			'gradient',
			'rainbow',
			'visible-rotate'
		] as const),
		spectrumPrimaryColor: primaryColor,
		spectrumSecondaryColor: secondaryColor,

		spectrumBarCount: randomChoice([32, 64, 128, 256]),
		spectrumBarWidth: randomFloat(2, 8),
		spectrumMinHeight: randomFloat(1, 10),
		spectrumMaxHeight: randomFloat(60, 300),
		spectrumSmoothing: randomFloat(0.4, 0.9),

		spectrumOpacity: randomFloat(0.4, 0.95),
		spectrumGlowIntensity: randomFloat(0, 1.5),
		spectrumShadowBlur: randomInt(0, 40),

		spectrumRotationSpeed: randomFloat(-1.5, 1.5),
		spectrumMirror: Math.random() > 0.5,
		spectrumPeakHold: Math.random() > 0.4,
		spectrumPeakDecay: randomFloat(0.005, 0.015),

		spectrumInnerRadius: randomFloat(40, 240),
		spectrumRadialShape: randomChoice([
			'circle',
			'square',
			'triangle',
			'star',
			'hexagon'
		] as const),
		spectrumRadialAngle: randomFloat(-180, 180),
		spectrumFollowLogo: mode === 'radial',
		spectrumRadialFitLogo: Math.random() > 0.5,
		spectrumLogoGap: randomInt(0, 32),

		spectrumLinearOrientation: orientation,
		spectrumLinearDirection: direction,
		spectrumPositionX: posX,
		spectrumPositionY: Math.max(-1, Math.min(1, posY)),
		spectrumSpan: 1.0,

		spectrumCircularClone: isClone,
		spectrumCloneStyle: randomChoice(cloneShapes),
		spectrumCloneRadialShape: randomChoice([
			'circle',
			'square',
			'triangle',
			'star',
			'hexagon'
		] as const),
		spectrumCloneScale: randomFloat(0.6, 1.5),
		spectrumCloneOpacity: randomFloat(0.4, 1.0),
		spectrumCloneColorSource: colorSource,
		spectrumCloneColorMode: randomChoice([
			'solid',
			'gradient',
			'rainbow',
			'visible-rotate'
		] as const),
		spectrumClonePrimaryColor: primaryColor,
		spectrumCloneSecondaryColor: secondaryColor
	};
}
