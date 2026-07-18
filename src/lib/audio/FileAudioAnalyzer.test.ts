import { afterEach, describe, expect, it, vi } from 'vitest';
import { FileAudioAnalyzer } from './FileAudioAnalyzer';

class FakeAudioElement {
	loop = false;
	src: string;
	paused = false;

	constructor(src: string) {
		this.src = src;
	}

	addEventListener() {}
	removeEventListener() {}
	pause() {
		this.paused = true;
	}
	play() {
		return Promise.resolve();
	}
}

describe('FileAudioAnalyzer lifecycle', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('releases the object URL when audio graph setup throws', async () => {
		const revokeObjectURL = vi.fn();
		vi.stubGlobal('URL', {
			createObjectURL: vi.fn(() => 'blob:test'),
			revokeObjectURL
		});
		vi.stubGlobal('Audio', FakeAudioElement);
		vi.stubGlobal(
			'AudioContext',
			class {
				constructor() {
					throw new Error('audio context unavailable');
				}
			}
		);

		const analyzer = new FileAudioAnalyzer({ name: 'track.mp3' } as File);
		await expect(analyzer.start()).rejects.toThrow(
			'audio context unavailable'
		);
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
	});
});
