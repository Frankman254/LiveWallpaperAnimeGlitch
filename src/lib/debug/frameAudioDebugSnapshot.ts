import type {
	AudioReactiveChannel,
	ResolvedAudioReactiveChannel
} from '@/types/wallpaper';

/** Last-write-per-frame audio routing for the wallpaper BG canvas (slideshow layer). */
export type BgAudioDebugSnapshot = {
	requestChannel: AudioReactiveChannel;
	resolvedChannel: ResolvedAudioReactiveChannel;
	channelInstant: number;
	channelRouterSmoothed: number;
	envelopeBoost: number;
	hasSlideshowLayer: boolean;
};

export type SpectrumAudioDebugSnapshot = {
	bandModeRequested: AudioReactiveChannel;
	resolvedChannel: ResolvedAudioReactiveChannel;
	channelInstant: number;
	channelRouterSmoothed: number;
	meanBinEnergy: number;
	globalGain: number;
	barCount: number;
	instance: 'primary' | 'clone';
};

export type LogoAudioDebugSnapshot = {
	bandModeRequested: AudioReactiveChannel;
	resolvedChannel: ResolvedAudioReactiveChannel;
	channelInstant: number;
	channelRouterSmoothed: number;
	driveScaled: number;
	envelopeScale: number;
};

let bg: BgAudioDebugSnapshot | null = null;
let spectrumPrimary: SpectrumAudioDebugSnapshot | null = null;
let spectrumClone: SpectrumAudioDebugSnapshot | null = null;
let logo: LogoAudioDebugSnapshot | null = null;

export function setDebugBgAudio(next: BgAudioDebugSnapshot | null): void {
	bg = next;
}

export function setDebugSpectrumAudio(next: SpectrumAudioDebugSnapshot): void {
	if (next.instance === 'clone') {
		spectrumClone = next;
	} else {
		spectrumPrimary = next;
	}
}

/** Call when the circular clone is not drawn this frame so the UI does not show stale clone data. */
export function clearDebugSpectrumClone(): void {
	spectrumClone = null;
}

export function setDebugLogoAudio(next: LogoAudioDebugSnapshot | null): void {
	logo = next;
}

export function getDebugBgAudio(): BgAudioDebugSnapshot | null {
	return bg;
}

export function getDebugSpectrumPrimary(): SpectrumAudioDebugSnapshot | null {
	return spectrumPrimary;
}

export function getDebugSpectrumClone(): SpectrumAudioDebugSnapshot | null {
	return spectrumClone;
}

export function getDebugLogoAudio(): LogoAudioDebugSnapshot | null {
	return logo;
}
