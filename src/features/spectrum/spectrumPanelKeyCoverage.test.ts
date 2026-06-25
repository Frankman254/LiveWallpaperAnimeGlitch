import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SPECTRUM_INSTANCE_SETTING_KEYS } from '@/features/spectrum/spectrumInstanceModel';

/**
 * Ownership guard (Phase 5): every spectrum setting key that a target-bound
 * editor panel writes through `update({ ... })` MUST exist in
 * SPECTRUM_INSTANCE_SETTING_KEYS. Otherwise the second spectrum silently fails
 * to persist/behave for that key (the panel binds to the active target, but the
 * key has no instance slot). This scans the panel sources so a future panel
 * adding `update({ spectrumNewKey })` without registering the key fails CI.
 */

const here = dirname(fileURLToPath(import.meta.url));
const panelsDir = join(here, '../../components/controls/tabs/spectrum');

/** Files under the spectrum editor that bind to useSpectrumTargetSettings. */
function collectPanelSources(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			out.push(...collectPanelSources(full));
			continue;
		}
		if (!entry.name.endsWith('.tsx') && !entry.name.endsWith('.ts'))
			continue;
		if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx'))
			continue;
		out.push(full);
	}
	return out;
}

// Matches `update({ spectrumXxx:` — the per-call key written through the
// target-bound updater. Single-key updates are the dominant form in panels.
const UPDATE_KEY_RE = /update\(\{\s*(spectrum[A-Za-z0-9]+)\s*:/g;

describe('spectrum panel key coverage', () => {
	const registered = new Set<string>(SPECTRUM_INSTANCE_SETTING_KEYS);

	it('every key written by a target-bound panel is a registered instance key', () => {
		const sources = collectPanelSources(panelsDir);
		expect(sources.length).toBeGreaterThan(0);

		const offenders: Array<{ file: string; key: string }> = [];
		for (const file of sources) {
			const text = readFileSync(file, 'utf8');
			for (const match of text.matchAll(UPDATE_KEY_RE)) {
				const key = match[1]!;
				if (!registered.has(key)) {
					offenders.push({
						file: file.slice(file.indexOf('spectrum')),
						key
					});
				}
			}
		}

		expect(
			offenders,
			`Panel update({ key }) writes missing from SPECTRUM_INSTANCE_SETTING_KEYS:\n${offenders
				.map(o => ` - ${o.key} (${o.file})`)
				.join('\n')}`
		).toEqual([]);
	});
});
