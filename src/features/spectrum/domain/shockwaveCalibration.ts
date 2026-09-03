import type { ResolvedAudioReactiveChannel } from '@/types/wallpaper';

export const SHOCKWAVE_THRESHOLD_CHANNELS: ResolvedAudioReactiveChannel[] = [
	'kick',
	'bass',
	'instrumental',
	'hihat',
	'vocal',
	'full'
];

export const DEFAULT_SHOCKWAVE_BAND_THRESHOLDS: Record<
	ResolvedAudioReactiveChannel,
	number
> = {
	kick: 0.58,
	bass: 0.5,
	instrumental: 0.42,
	hihat: 0.38,
	vocal: 0.4,
	full: 0.46
};

export const SHOCKWAVE_BAND_LABELS: Record<
	ResolvedAudioReactiveChannel,
	string
> = {
	kick: 'Kick',
	bass: 'Bass',
	instrumental: 'Instrumental',
	hihat: 'Hi-hat',
	vocal: 'Vocal',
	full: 'Full mix'
};
