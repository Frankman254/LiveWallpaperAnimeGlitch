#!/usr/bin/env node
/**
 * Lightweight codebase-structure checks. Guards the navigation cleanup so the
 * misleading "modern" naming does not creep back in. Intentionally NOT rigid —
 * it only asserts what has actually been migrated so far.
 *
 * Run: pnpm structure:check
 */
import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

// 1. The misleading legacy folder must be gone.
if (existsSync(resolve(root, 'src/components/controls/tabs/modern'))) {
	errors.push(
		'src/components/controls/tabs/modern still exists — rename it (current location: tabs/main)'
	);
}

// 2. No source file may import from the old /tabs/modern/ path.
function walk(dir, onFile) {
	for (const entry of readdirSync(dir)) {
		if (entry === 'node_modules' || entry.startsWith('.')) continue;
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) walk(full, onFile);
		else onFile(full);
	}
}

const offenders = [];
walk(resolve(root, 'src'), file => {
	if (!/\.(ts|tsx)$/.test(file)) return;
	const text = readFileSync(file, 'utf8');
	if (/tabs\/modern\//.test(text)) {
		offenders.push(file.replace(`${root}/`, ''));
	}
});
if (offenders.length > 0) {
	errors.push(
		`Imports still reference the old tabs/modern path:\n  - ${offenders.join('\n  - ')}`
	);
}

// 3. The structure doc must exist (so future agents can navigate).
if (!existsSync(resolve(root, 'docs/architecture/CODEBASE_STRUCTURE.md'))) {
	errors.push('Missing docs/architecture/CODEBASE_STRUCTURE.md');
}

if (errors.length > 0) {
	console.error('structure:check FAILED\n');
	for (const error of errors) console.error(`✗ ${error}`);
	process.exit(1);
}

console.log('structure:check OK — no stale tabs/modern references');
