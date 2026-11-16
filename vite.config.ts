import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' keeps every asset path relative, so the build works on GitHub Pages
// (served from a sub-path), on any static host, and from a local folder.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
  },
  server: { host: true },
});
