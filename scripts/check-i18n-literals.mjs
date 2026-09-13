#!/usr/bin/env node
/**
 * Flags UI strings written directly in Spanish instead of going through
 * `useT()`. The app ships in EN and ES, and hardcoded Spanish showed up in the
 * English UI (Calibration, Looks, Insights) until 2026-09.
 *
 * Heuristic on purpose: a string literal or JSX text containing Spanish-only
 * characters (á é í ó ú ñ ¿ ¡). Comments, tests and the dictionaries in
 * src/lib/i18n are skipped. Strings that are data, not UI, go in ALLOW.
 *
 * Run: pnpm i18n:check
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', 'i18n']);
const ALLOW = [
	// Romaji/Spanish sample lyrics and font names are content, not UI.
];
const SPANISH = /[áéíóúñÁÉÍÓÚÑ¿¡]/;
const LITERAL = /(['"`])((?:\\.|(?!\1).)*?)\1|>([^<>{}]+)</g;

function walk(dir, onFile) {
	for (const entry of readdirSync(dir)) {
		if (SKIP_DIRS.has(entry) || entry.startsWith('.')) continue;
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) walk(full, onFile);
		else onFile(full);
	}
}

function stripComments(line, state) {
	let out = '';
	for (let i = 0; i < line.length; i++) {
		if (state.block) {
			if (line.startsWith('*/', i)) {
				state.block = false;
				i++;
			}
			continue;
		}
		if (line.startsWith('/*', i)) {
			state.block = true;
			i++;
			continue;
		}
		if (line.startsWith('//', i) && !/:$/.test(out)) break;
		out += line[i];
	}
	return out;
}

const offenders = [];
walk(resolve(root, 'src'), file => {
	if (!/\.(ts|tsx)$/.test(file) || /\.test\.tsx?$/.test(file)) return;
	const rel = file.replace(`${root}/`, '');
	const state = { block: false };
	readFileSync(file, 'utf8')
		.split('\n')
		.forEach((raw, index) => {
			const code = stripComments(raw, state);
			// JSX text on its own line (`<span>\n  texto\n</span>`) has no
			// quotes or brackets for LITERAL to catch.
			const bare = code.trim();
			if (
				file.endsWith('.tsx') &&
				SPANISH.test(bare) &&
				!/[=(){};'"`<>]/.test(bare)
			) {
				offenders.push(`${rel}:${index + 1}  ${bare}`);
				return;
			}
			for (const match of code.matchAll(LITERAL)) {
				const text = match[2] ?? match[3] ?? '';
				if (!SPANISH.test(text)) continue;
				if (ALLOW.some(allowed => text.includes(allowed))) continue;
				offenders.push(`${rel}:${index + 1}  ${text.trim()}`);
			}
		});
});

if (offenders.length > 0) {
	console.error(
		`i18n:check FAILED — ${offenders.length} hardcoded Spanish string(s). Move them to src/lib/i18n/{en,es}.ts:\n`
	);
	for (const offender of offenders) console.error(`  ${offender}`);
	process.exit(1);
}
console.log('i18n:check OK — no hardcoded Spanish UI strings');
