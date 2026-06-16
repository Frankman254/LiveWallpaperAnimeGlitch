import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

// Isolated test config: pure-logic unit tests run in a Node environment and do
// NOT load the build plugins (react / glsl / tailwind). Keep the `@` alias in
// sync with vite.config.ts so `@/...` imports resolve the same way.
export default defineConfig({
	resolve: {
		alias: { '@': resolve(__dirname, 'src') }
	},
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.test.ts'],
		// Exclude anything that needs a DOM/canvas/audio context for now; this
		// suite is pure logic only (Fase 3 of the alpha roadmap).
		exclude: ['node_modules/**', 'dist/**', 'src/**/*.dom.test.ts']
	}
});
