import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  esbuild: { jsx: 'automatic' },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { rollupOptions: { input: { main: fileURLToPath(new URL('./index.html', import.meta.url)), concept: fileURLToPath(new URL('./concept.html', import.meta.url)) } } },
});
