import type { WallpaperState } from '@/types/wallpaper';

export type FilterLookId =
	| 'crt'
	| 'vhs'
	| 'cyber-neon'
	| 'dream-bloom'
	| 'monochrome-ink'
	| 'club-glitch'
	| 'glass-mist'
	| 'infrared-pulse';

export type FilterLookPreset = {
	id: FilterLookId;
	name: string;
	description: string;
	tags: string[];
	settings: Pick<
		WallpaperState,
		| 'filterBrightness'
		| 'filterContrast'
		| 'filterSaturation'
		| 'filterBlur'
		| 'filterHueRotate'
		| 'filterOpacity'
		| 'rgbShift'
		| 'noiseIntensity'
		| 'scanlineIntensity'
		| 'scanlineMode'
		| 'scanlineSpacing'
		| 'scanlineThickness'
	>;
};

export const FILTER_LOOK_PRESETS: FilterLookPreset[] = [
	{
		id: 'crt',
		name: 'CRT',
		description: 'Verde retro con scanlines y contraste alto.',
		tags: ['retro', 'scanlines', 'terminal'],
		settings: {
			filterBrightness: 0.92,
			filterContrast: 1.35,
			filterSaturation: 0.6,
			filterBlur: 0.4,
			filterHueRotate: 0,
			filterOpacity: 1,
			rgbShift: 0.001,
			noiseIntensity: 0.06,
			scanlineIntensity: 0.28,
			scanlineMode: 'always',
			scanlineSpacing: 640,
			scanlineThickness: 1.4
		}
	},
	{
		id: 'vhs',
		name: 'VHS',
		description: 'Desenfoque suave, ruido y desalineación RGB.',
		tags: ['analog', 'soft', 'nostalgia'],
		settings: {
			filterBrightness: 0.98,
			filterContrast: 1.12,
			filterSaturation: 1.18,
			filterBlur: 1.1,
			filterHueRotate: -8,
			filterOpacity: 1,
			rgbShift: 0.006,
			noiseIntensity: 0.14,
			scanlineIntensity: 0.12,
			scanlineMode: 'pulse',
			scanlineSpacing: 760,
			scanlineThickness: 1.6
		}
	},
	{
		id: 'cyber-neon',
		name: 'Cyber Neon',
		description: 'Saturación fuerte y brillos neón con offset RGB.',
		tags: ['neon', 'vivid', 'glow'],
		settings: {
			filterBrightness: 1.08,
			filterContrast: 1.28,
			filterSaturation: 1.7,
			filterBlur: 0.2,
			filterHueRotate: 18,
			filterOpacity: 1,
			rgbShift: 0.004,
			noiseIntensity: 0.04,
			scanlineIntensity: 0.08,
			scanlineMode: 'burst',
			scanlineSpacing: 900,
			scanlineThickness: 1.1
		}
	},
	{
		id: 'dream-bloom',
		name: 'Dream Bloom',
		description: 'Look etéreo con blur y tonos suaves.',
		tags: ['dreamy', 'soft', 'pastel'],
		settings: {
			filterBrightness: 1.12,
			filterContrast: 0.92,
			filterSaturation: 1.24,
			filterBlur: 2.2,
			filterHueRotate: 20,
			filterOpacity: 1,
			rgbShift: 0.0015,
			noiseIntensity: 0.02,
			scanlineIntensity: 0,
			scanlineMode: 'always',
			scanlineSpacing: 800,
			scanlineThickness: 1.2
		}
	},
	{
		id: 'monochrome-ink',
		name: 'Monochrome Ink',
		description: 'Monocromo con contraste fuerte.',
		tags: ['mono', 'ink', 'high-contrast'],
		settings: {
			filterBrightness: 0.95,
			filterContrast: 1.45,
			filterSaturation: 0,
			filterBlur: 0.1,
			filterHueRotate: 0,
			filterOpacity: 1,
			rgbShift: 0,
			noiseIntensity: 0.03,
			scanlineIntensity: 0.05,
			scanlineMode: 'always',
			scanlineSpacing: 840,
			scanlineThickness: 1
		}
	},
	{
		id: 'club-glitch',
		name: 'Club Glitch',
		description: 'Contraste agresivo y desplazamiento RGB visible.',
		tags: ['glitch', 'club', 'aggressive'],
		settings: {
			filterBrightness: 1.04,
			filterContrast: 1.5,
			filterSaturation: 1.55,
			filterBlur: 0.2,
			filterHueRotate: 36,
			filterOpacity: 1,
			rgbShift: 0.01,
			noiseIntensity: 0.22,
			scanlineIntensity: 0.18,
			scanlineMode: 'beat',
			scanlineSpacing: 720,
			scanlineThickness: 1.8
		}
	},
	{
		id: 'glass-mist',
		name: 'Glass Mist',
		description: 'Suave, limpio y ligeramente difuminado.',
		tags: ['glass', 'minimal', 'mist'],
		settings: {
			filterBrightness: 1.06,
			filterContrast: 1.06,
			filterSaturation: 1.08,
			filterBlur: 1.6,
			filterHueRotate: 6,
			filterOpacity: 1,
			rgbShift: 0.0008,
			noiseIntensity: 0.01,
			scanlineIntensity: 0,
			scanlineMode: 'always',
			scanlineSpacing: 960,
			scanlineThickness: 1
		}
	},
	{
		id: 'infrared-pulse',
		name: 'Infrared Pulse',
		description: 'Tono cálido intenso con estética térmica.',
		tags: ['infrared', 'warm', 'pulse'],
		settings: {
			filterBrightness: 1.04,
			filterContrast: 1.34,
			filterSaturation: 1.48,
			filterBlur: 0.5,
			filterHueRotate: 62,
			filterOpacity: 1,
			rgbShift: 0.003,
			noiseIntensity: 0.05,
			scanlineIntensity: 0.06,
			scanlineMode: 'pulse',
			scanlineSpacing: 820,
			scanlineThickness: 1.2
		}
	}
];

export function findFilterLookById(id: string): FilterLookPreset | undefined {
	return FILTER_LOOK_PRESETS.find(look => look.id === id);
}
