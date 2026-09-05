#!/usr/bin/env node
/**
 * Architecture boundary checks — enforces the dependency contract described in
 * docs/architecture/ARCHITECTURE.md.
 *
 * Unlike structure:check (which guards legacy naming), this walks the real
 * import graph and fails when a module imports across a forbidden layer edge.
 *
 * Rules that are already clean are enforced at ZERO. Rules that still have
 * known violations carry a frozen BASELINE: existing offenders are tolerated,
 * but the list may never grow. Removing an offender and forgetting to update
 * the baseline is also an error, so the debt count can only go down.
 *
 * Run: pnpm architecture:check
 */
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(root, 'src');

// ---------------------------------------------------------------------------
// Layer map. `zone(path)` answers "which architectural zone does this live in?"
// ---------------------------------------------------------------------------

/** Zones that may never be imported by anything outside themselves. */
const PRIVATE_ZONES = ['dev'];

/** Files exempt from the PRIVATE_ZONES rule (the app root mounts dev routes). */
const PRIVATE_ZONE_ENTRYPOINTS = ['App.tsx'];

/**
 * For each zone, the zones it is FORBIDDEN to import. Anything not listed is
 * allowed. Zones are the first path segment under src/.
 */
const FORBIDDEN = {
	// Pure vocabulary. Depends on nothing but itself.
	types: [
		'editor',
		'features',
		'components',
		'store',
		'context',
		'runtime',
		'pages',
		'hooks',
		'lib',
		'ui',
		'config',
		'utils',
		'services'
	],
	// Leaf helpers. Must stay reusable in isolation.
	config: [
		'editor',
		'features',
		'components',
		'store',
		'context',
		'runtime',
		'pages',
		'hooks',
		'lib',
		'ui',
		'services'
	],
	utils: [
		'editor',
		'features',
		'components',
		'store',
		'context',
		'runtime',
		'pages',
		'hooks',
		'lib',
		'ui',
		'services'
	],
	// Design system. Must not know the product exists.
	ui: [
		'components',
		'features',
		'store',
		'context',
		'runtime',
		'pages',
		'editor',
		'services'
	],
	// Shared editor chrome: store-connected, domain-agnostic. Sits above `ui/`
	// and below every domain, so `features/*` may import it (the one upward
	// edge the contract allows) but it may never import a domain back.
	editor: [
		'components',
		'features',
		'context',
		'runtime',
		'pages',
		'services'
	],
	// Domain-neutral logic + persistence.
	lib: [
		'components',
		'context',
		'runtime',
		'pages',
		'hooks',
		'store',
		'features',
		'services'
	],
	// Domain engines. May be driven by UI, never reach up into it.
	// `editor` is deliberately absent: a domain owns its own editor panel and
	// builds it out of shared chrome.
	features: ['components', 'pages'],
	// Application services: save/load a project, restore its assets, sync it.
	// They orchestrate the store, so they sit ABOVE it — but they render
	// nothing, which is exactly what kept them from living in `lib/`.
	services: ['components', 'pages', 'ui', 'editor', 'context'],
	// Global state. Owns data, not presentation.
	store: [
		'components',
		'context',
		'runtime',
		'pages',
		'hooks',
		'ui',
		'editor'
	]
};

/**
 * Frozen debt. Each entry is `from -> to` (paths relative to src/). These edges
 * exist today and are tolerated; the list may not grow. When you remove one,
 * delete its line here too.
 *
 * Last recount: 2026-09-02 — 37 edges after the logo migration (was 39).
 * See ARCHITECTURE.md "Deuda congelada".
 */
const BASELINE = [
	// types/ still borrows domain vocabulary instead of owning it. All of these
	// are type positions (`import('...').Foo`), so they are erased at build —
	// the debt is conceptual, not a runtime cycle.
	//
	// The featureProfiles one is not fixable by moving a file, and it is worth
	// knowing why before someone tries: the profile settings types are
	// `Pick<WallpaperState, typeof SOME_KEYS[number]>` — derived FROM the very
	// interface that then holds them in its slot fields. The key arrays are
	// runtime values (they drive extract/build), so they cannot live in
	// `types/`, and `WallpaperState` cannot describe a slot without them.
	'types/wallpaper.ts -> features/lyrics/domain/types.ts',
	'types/wallpaper.ts -> features/calibration/calibrationConfig.ts',
	'types/wallpaper.ts -> features/filterLooks/filterLooks.ts',
	'types/wallpaper.ts -> features/stageFx/stageFxConfig.ts',
	'types/wallpaper.ts -> store/featureProfiles.ts',

	// ui/ → producto: RESUELTO. Los tres widgets conectados (ProfileSlotsEditor,
	// ConnectedColorInput, y el CollapsibleSection con memoria de workspace)
	// se movieron a `editor/`, que es la zona donde sí pueden hablar con el store.

	// lib/ acting as an application service rather than a pure library.
	'lib/i18n/index.tsx -> store/wallpaperStore.ts',

	// lib/ pulling domain defaults out of features/: RESOLVED. `lib/constants`
	// was never a library — it was the factory scene document, so it is now
	// `store/defaultState`, and `store/` is allowed to read domain defaults.
	// `featureProfiles`, `factoryDefaults`, `backgroundImages` and `presets`
	// followed it to the zone that actually owns each one.
	// These used to be seven DEEP imports into single spectrum modules, because
	// the barrel loaded a module that read DEFAULT_STATE back out of
	// lib/constants — a circular initialisation that crashed 18 suites. The
	// domain now owns its own defaults (features/spectrum/domain/spectrumDefaults),
	// so the barrel is safe and these are two ordinary facade edges. They stay
	// debt only because `lib/` should not reach into `features/` at all: the
	// remaining fix is moving DEFAULT_STATE itself out of `lib/`.

	// editor/ → domain: MotionSharedControls carries `FxBandThresholdControls`,
	// which is stageFx UI, not generic chrome. Proof that this module is
	// misfiled — split that control into features/stageFx/controls and this
	// edge disappears. (It also duplicates editor/advancedControls; see the
	// findings section of ARCHITECTURE.md.)
	'editor/MotionSharedControls.tsx -> features/stageFx/stageFxConfig.ts'
];

// ---------------------------------------------------------------------------
// Import graph
// ---------------------------------------------------------------------------

const SOURCE_RE = /\.(ts|tsx)$/;
const RESOLVE_EXTS = ['.ts', '.tsx', '/index.ts', '/index.tsx', ''];

function walk(dir, files = []) {
	for (const entry of readdirSync(dir)) {
		if (entry === 'node_modules' || entry.startsWith('.')) continue;
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) walk(full, files);
		else if (SOURCE_RE.test(full)) files.push(full);
	}
	return files;
}

function resolveSpecifier(spec, fromFile) {
	let base;
	if (spec.startsWith('@/')) base = join(srcRoot, spec.slice(2));
	else if (spec.startsWith('.')) base = resolve(dirname(fromFile), spec);
	else return null; // bare package import
	for (const ext of RESOLVE_EXTS) {
		const candidate = base + ext;
		try {
			if (statSync(candidate).isFile()) return candidate;
		} catch {
			// keep trying
		}
	}
	return null;
}

const rel = file => file.replace(`${srcRoot}/`, '');
const zone = path => path.split('/')[0];

function collectEdges() {
	const edges = [];
	for (const file of walk(srcRoot)) {
		const text = readFileSync(file, 'utf8');
		const patterns = [
			/import\s+(?:type\s+)?[^;]*?from\s*['"]([^'"]+)['"]/g,
			/export\s+(?:type\s+)?[^;]*?from\s*['"]([^'"]+)['"]/g,
			/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
		];
		for (const pattern of patterns) {
			for (const match of text.matchAll(pattern)) {
				const target = resolveSpecifier(match[1], file);
				if (!target || target === file) continue;
				edges.push({ from: rel(file), to: rel(target) });
			}
		}
	}
	return edges;
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

const edges = collectEdges();
const errors = [];
const baseline = new Set(BASELINE);
const usedBaseline = new Set();
const newViolations = [];

for (const edge of edges) {
	const fromZone = zone(edge.from);
	const toZone = zone(edge.to);
	if (fromZone === toZone) continue;

	const forbidden =
		(FORBIDDEN[fromZone] ?? []).includes(toZone) ||
		(PRIVATE_ZONES.includes(toZone) &&
			!PRIVATE_ZONE_ENTRYPOINTS.includes(edge.from));
	if (!forbidden) continue;

	const key = `${edge.from} -> ${edge.to}`;
	if (baseline.has(key)) {
		usedBaseline.add(key);
		continue;
	}
	if (!newViolations.some(v => v === key)) newViolations.push(key);
}

if (newViolations.length > 0) {
	errors.push(
		`New layer violations (see docs/architecture/ARCHITECTURE.md):\n  - ${newViolations.join('\n  - ')}`
	);
}

const staleBaseline = BASELINE.filter(key => !usedBaseline.has(key));
if (staleBaseline.length > 0) {
	errors.push(
		`Baseline entries no longer exist — delete them from scripts/check-architecture.mjs:\n  - ${staleBaseline.join('\n  - ')}`
	);
}

// Value-level import cycles. Type-only cycles are erased by the compiler, so
// this only reports edges that survive to runtime.
const valueEdges = new Map();
for (const file of walk(srcRoot)) {
	const text = readFileSync(file, 'utf8');
	const deps = new Set();
	const valuePatterns = [
		/import\s+(?!type\s)[^;]*?from\s*['"]([^'"]+)['"]/g,
		/export\s+(?!type\s)[^;]*?from\s*['"]([^'"]+)['"]/g
	];
	for (const pattern of valuePatterns) {
		for (const match of text.matchAll(pattern)) {
			const target = resolveSpecifier(match[1], file);
			if (target && target !== file) deps.add(target);
		}
	}
	valueEdges.set(file, [...deps]);
}

const KNOWN_CYCLES = [
	// Empty, and it should stay that way. The one entry that used to live here
	// (DEFAULT_STATE needing spectrum defaults while the spectrum hydrator
	// needed DEFAULT_STATE) was broken by giving the domain its own defaults
	// and letting lib/constants compose them one-way. If you are about to add
	// an entry here, move the shared values into the domain instead.
];
const knownCycles = new Set(KNOWN_CYCLES);
const seenCycles = new Set();
const newCycles = [];
const color = new Map();
const stack = [];

function visit(node) {
	color.set(node, 1);
	stack.push(node);
	for (const dep of valueEdges.get(node) ?? []) {
		if (!valueEdges.has(dep)) continue;
		if (color.get(dep) === 1) {
			const cycle = stack.slice(stack.indexOf(dep)).map(rel);
			const key = [...cycle].sort().join('|');
			if (!seenCycles.has(key)) {
				seenCycles.add(key);
				if (!knownCycles.has(key)) {
					newCycles.push(cycle.concat(cycle[0]).join(' -> '));
				}
			}
		} else if (!color.has(dep)) visit(dep);
	}
	color.set(node, 2);
	stack.pop();
}
for (const file of valueEdges.keys()) if (!color.has(file)) visit(file);

if (newCycles.length > 0) {
	errors.push(`New runtime import cycles:\n  - ${newCycles.join('\n  - ')}`);
}

const staleCycles = KNOWN_CYCLES.filter(key => !seenCycles.has(key));
if (staleCycles.length > 0) {
	errors.push(
		`KNOWN_CYCLES entries no longer exist — delete them from scripts/check-architecture.mjs:\n  - ${staleCycles.join('\n  - ')}`
	);
}

// The contract itself must exist, or none of the above means anything.
if (!existsSync(resolve(root, 'docs/architecture/ARCHITECTURE.md'))) {
	errors.push('Missing docs/architecture/ARCHITECTURE.md');
}

if (errors.length > 0) {
	console.error('architecture:check FAILED\n');
	for (const error of errors) console.error(`✗ ${error}\n`);
	process.exit(1);
}

console.log(
	`architecture:check OK — ${edges.length} imports scanned, ` +
		`${BASELINE.length} frozen debt edges, ${KNOWN_CYCLES.length} known cycles. ` +
		'No new boundary violations.'
);
