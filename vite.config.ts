/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { mediaIndex } from './vite/media-index.ts';

export default defineConfig({
  plugins: [react(), tailwindcss(), mediaIndex()],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
