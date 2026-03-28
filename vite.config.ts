import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glsl from 'vite-plugin-glsl'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [tailwindcss(), react(), glsl()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,  // expose on LAN (same as dev)
    port: 4173,
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
  },
})
