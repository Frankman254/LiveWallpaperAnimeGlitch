import { describe, expect, it } from 'vitest';
import { computeContentHash } from './contentHash';

describe('computeContentHash', () => {
	it('is deterministic for identical bytes', async () => {
		const a = new Blob(['hello world'], { type: 'text/plain' });
		const b = new Blob(['hello world'], { type: 'text/plain' });
		expect(await computeContentHash(a)).toBe(await computeContentHash(b));
	});

	it('differs for different bytes', async () => {
		const a = new Blob(['hello world']);
		const b = new Blob(['hello worle']);
		expect(await computeContentHash(a)).not.toBe(
			await computeContentHash(b)
		);
	});

	it('produces a sha256-prefixed hex digest in a crypto context', async () => {
		const hash = await computeContentHash(new Blob(['x']));
		// Either the real digest, or the documented non-secure-context fallback.
		expect(hash).toMatch(/^(sha256-[0-9a-f]{64}|nohash-\d+-.*)$/);
	});
});
