import type {
	AudioMixMode,
	AudioTransitionStyle
} from '@/types/wallpaper';

export const FFT_SIZES = ['512', '1024', '2048', '4096'] as const;
export const FFT_PRESETS = [
	{ id: 'fast', label: 'Fast', fftSize: 512 },
	{ id: 'balanced', label: 'Balanced', fftSize: 2048 },
	{ id: 'detailed', label: 'Detailed', fftSize: 4096 }
] as const;
export const MIX_MODES = [
	{ id: 'sequential', icon: '->' },
	{ id: 'energy-match', icon: '~=' },
	{ id: 'contrast', icon: '<>' }
] as const satisfies ReadonlyArray<{ id: AudioMixMode; icon: string }>;
export const TRANSITION_STYLES = [
	'linear',
	'smooth',
	'quick',
	'early-blend',
	'late-blend'
] as const satisfies ReadonlyArray<AudioTransitionStyle>;

export function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
	const minutes = Math.floor(seconds / 60);
	const sec = Math.floor(seconds % 60);
	return `${minutes}:${sec.toString().padStart(2, '0')}`;
}

export function cleanTrackName(name: string): string {
	return name.replace(/\.(mp3|wav|ogg|flac|m4a|aac|webm|opus)$/i, '');
}

export function formatDecimal(value: number): string {
	return value.toFixed(2);
}

export function formatInteger(value: number): string {
	return Math.round(value).toString();
}
