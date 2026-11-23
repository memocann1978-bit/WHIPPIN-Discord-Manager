import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
export default defineConfig({ plugins: [react()], base: './', server: { host: '127.0.0.1' }, build: { rollupOptions: { input: { desktop: resolve(__dirname, 'index.html'), mobile: resolve(__dirname, 'mobile.html') } } } });