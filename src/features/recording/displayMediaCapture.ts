import type { RecordingFps } from './recordingMimeSupport';

/** Chrome / Edge display-capture hints not yet in all TS DOM libs. */
export type DisplayMediaStreamOptionsExtended = DisplayMediaStreamOptions & {
	preferCurrentTab?: boolean;
	selfBrowserSurface?: 'include' | 'exclude';
	monitorTypeSurfaces?: 'include' | 'exclude';
	surfaceSwitching?: 'include' | 'exclude';
};

export function buildDisplayMediaRequest(
	fps: RecordingFps,
	includeAudio: boolean
): DisplayMediaStreamOptionsExtended {
	const frameRate = Number(fps);
	const width = typeof window !== 'undefined' ? window.screen.width : 1920;
	const height = typeof window !== 'undefined' ? window.screen.height : 1080;

	return {
		video: {
			frameRate: { ideal: frameRate, max: frameRate },
			width: { ideal: width },
			height: { ideal: height }
		},
		audio: includeAudio,
		// Pre-select this tab in the picker (still requires one browser confirm click).
		preferCurrentTab: true,
		selfBrowserSurface: 'include',
		monitorTypeSurfaces: 'exclude',
		surfaceSwitching: 'exclude'
	};
}

export async function requestDisplayCapture(
	fps: RecordingFps,
	includeAudio: boolean
): Promise<MediaStream> {
	if (!navigator.mediaDevices?.getDisplayMedia) {
		throw new Error('screen-capture-unavailable');
	}
	return navigator.mediaDevices.getDisplayMedia(
		buildDisplayMediaRequest(fps, includeAudio)
	);
}
