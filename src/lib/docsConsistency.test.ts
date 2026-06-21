import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Guards the Phase 1 fix: scripts/check-doc-consistency.mjs must validate the
// changelog against the *extracted* STORE_PERSIST_VERSION, not a hardcoded
// literal. This mirrors that dynamic check so a version bump that forgets the
// CHANGELOG fails here too — and so the script can never silently regress to a
// hardcoded number.
const root = resolve(__dirname, '../..');

function read(rel: string): string {
	return readFileSync(resolve(root, rel), 'utf8');
}

describe('docs consistency — dynamic store version', () => {
	const versionTs = read('src/lib/version.ts');
	const storePersist = Number(
		/STORE_PERSIST_VERSION\s*=\s*(\d+)/.exec(versionTs)?.[1]
	);

	it('extracts a numeric STORE_PERSIST_VERSION', () => {
		expect(Number.isInteger(storePersist)).toBe(true);
		expect(storePersist).toBeGreaterThan(0);
	});

	it('CHANGELOG documents the current STORE_PERSIST_VERSION', () => {
		const changelog = read('CHANGELOG.md');
		expect(
			changelog.includes(
				`STORE_PERSIST_VERSION\` is at **${storePersist}**`
			)
		).toBe(true);
	});

	it('check-doc-consistency script no longer hardcodes the version literal', () => {
		const script = read('scripts/check-doc-consistency.mjs');
		// The changelog assertion must interpolate storePersist, not embed a
		// literal `**96**`-style number.
		expect(script).toMatch(/is at \*\*\$\{storePersist\}\*\*/);
		expect(script).not.toMatch(/STORE_PERSIST_VERSION` is at \*\*\d+\*\*/);
	});
});
