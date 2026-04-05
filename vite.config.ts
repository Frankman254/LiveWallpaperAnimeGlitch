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
		port: 4173
	},
	build: {
		target: 'es2020',
		minify: 'esbuild',
		chunkSizeWarningLimit: 800,
		rollupOptions: {
			output: {
				manualChunks(id) {
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
						id.includes('react-dom')
					) {
						return 'react-vendor';
					}
					if (id.includes('framer-motion')) {
						return 'motion-vendor';
					}
					if (id.includes('zustand')) {
						return 'state-vendor';
					}
				}
			}
		}
	}
});
