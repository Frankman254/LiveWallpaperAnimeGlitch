/**
 * Lists modules under src/ that nothing reachable imports.
 *
 * Resolves the real import graph — static imports, re-exports and dynamic
 * import() — then walks it from the actual entry points (src/main.tsx, App.tsx
 * and every *.test.ts[x]). A module is only reported when no path reaches it.
 *
 * Written after an audit that searched by NAME flagged a file with 13 live
 * importers as "safe to delete". Grep tells you where a word appears; only the
 * graph tells you what runs. Reads nothing, deletes nothing — run it, then
 * check each hit for a live replacement before removing anything.
 *
 * Usage: node scripts/find-unreachable.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const files = [];
(function walk(d) {
	for (const e of fs.readdirSync(d, { withFileTypes: true })) {
		const p = path.join(d, e.name);
		if (e.isDirectory()) walk(p);
		else if (/\.(ts|tsx)$/.test(e.name)) files.push(p);
	}
})(SRC);

const exists = p => fs.existsSync(p) && fs.statSync(p).isFile();
function resolve(spec, fromFile) {
	let base;
	if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2));
	else if (spec.startsWith('.'))
		base = path.resolve(path.dirname(fromFile), spec);
	else return null;
	for (const c of [
		base,
		base + '.ts',
		base + '.tsx',
		path.join(base, 'index.ts'),
		path.join(base, 'index.tsx')
	])
		if (exists(c)) return c;
	return null;
}

// static imports + re-exports + dynamic import()
const RE =
	/(?:^|\n)\s*(?:import|export)\s[^;]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;

const graph = new Map();
const importers = new Map(files.map(f => [f, new Set()]));
for (const f of files) {
	const src = fs.readFileSync(f, 'utf8');
	const out = new Set();
	for (const m of src.matchAll(RE)) {
		const spec = m[1] || m[2] || m[3];
		const r = resolve(spec, f);
		if (r) {
			out.add(r);
			importers.get(r)?.add(f);
		}
	}
	graph.set(f, out);
}

// reachability from real entry points (app + every test file)
const entries = files.filter(
	f =>
		/src\/main\.tsx$/.test(f) ||
		/\.test\.(ts|tsx)$/.test(f) ||
		/src\/App\.tsx$/.test(f)
);
const seen = new Set();
const stack = [...entries];
while (stack.length) {
	const f = stack.pop();
	if (seen.has(f)) continue;
	seen.add(f);
	for (const d of graph.get(f) || []) stack.push(d);
}

const orphans = files.filter(f => !seen.has(f));
const loc = f => fs.readFileSync(f, 'utf8').split('\n').length;
orphans.sort((a, b) => loc(b) - loc(a));
let total = 0;
console.log(
	`entries=${entries.length} files=${files.length} reachable=${seen.size} UNREACHABLE=${orphans.length}\n`
);
for (const f of orphans) {
	const n = loc(f);
	total += n;
	const imp = importers.get(f).size;
	console.log(
		`${String(n).padStart(5)}  imp=${imp}  ${path.relative(SRC, f)}`
	);
}
console.log(`\nTOTAL unreachable LOC: ${total}`);
