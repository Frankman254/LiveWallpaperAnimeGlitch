import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
	plugins: [tailwindcss(), react(), glsl()],
	resolve: {
		alias: { '@': resolve(__dirname, 'src') }
	},
	server: {
		host: true,
		port: 5173
	},
	preview: {
		host: true, // expose on LAN (same as dev)
		port: 4173,
		// Keep a fixed origin (port) so browser localStorage matches `npm run serve`.
		strictPort: true
	},
	build: {
		target: 'es2020',
		minify: 'esbuild',
		chunkSizeWarningLimit: 800,
		rollupOptions: {
			output: {
				manualChunks(id) {
					const normalizedId = id.replaceAll('\\', '/');
					if (
						normalizedId.includes(
							'/src/components/controls/tabs/spectrum/'
						) ||
						normalizedId.includes(
							'/src/components/controls/tabs/modern/ModernSpectrumTab'
						)
					) {
						return 'spectrum-tab';
					}
					if (
						normalizedId.includes(
							'/src/components/controls/tabs/bg/'
						) ||
						normalizedId.includes(
							'/src/components/controls/tabs/modern/layers/'
						) ||
						normalizedId.includes(
							'/src/components/controls/tabs/modern/ModernLayersTab'
						) ||
						normalizedId.includes(
							'/src/components/controls/tabs/modern/ModernBackgroundPanel'
						)
					) {
						return 'layers-bg-tab';
					}
					if (
						normalizedId.includes(
							'/src/components/controls/tabs/modern/audio/'
						) ||
						normalizedId.includes(
							'/src/components/controls/tabs/modern/ModernAudioTab'
						)
					) {
						return 'audio-tab';
					}
					if (
						normalizedId.includes(
							'/src/components/controls/tabs/export/'
						) ||
						normalizedId.includes(
							'/src/components/controls/tabs/modern/ExportTabBody'
						) ||
						normalizedId.includes(
							'/src/components/controls/tabs/modern/ModernExportTab'
						)
					) {
						return 'export-tab';
					}
					if (
						normalizedId.includes(
							'/src/components/controls/tabs/modern/editor/'
						) ||
						normalizedId.includes(
							'/src/components/controls/tabs/modern/ModernEditorTab'
						)
					) {
						return 'editor-settings-tab';
					}
					if (!id.includes('node_modules')) return;
					if (id.includes('@react-three/drei')) {
						return 'drei-vendor';
					}
					if (id.includes('@react-three/fiber')) {
						return 'r3f-vendor';
					}
					if (id.includes('/three/')) {
						return 'three-core';
					}
					if (
						id.includes('react-router-dom') ||
						id.includes('/react/') ||
						id.includes('react-dom') ||
						id.includes('zustand')
					) {
						return 'react-vendor';
					}
					if (id.includes('framer-motion')) {
						return 'motion-vendor';
					}
				}
			}
		}
	}
});
