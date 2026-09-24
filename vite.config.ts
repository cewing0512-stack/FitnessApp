/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { mediaIndex } from './vite/media-index.ts';

/** Must match VIDEO_CACHE in src/player/offline.ts. */
const VIDEO_CACHE = 'demo-videos';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    mediaIndex(),
    VitePWA({
      // Ask before updating, so a new version never reloads mid-workout.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Dumbbell Library',
        short_name: 'Dumbbells',
        description: 'A personal library of 30-minute dumbbell workouts.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b0d10',
        theme_color: '#0b0d10',
        categories: ['health', 'fitness'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell + every thumbnail are available offline from the first visit.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/videos\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Demo clips: cached on first play, then served from cache (with
            // Range support, which Safari needs for <video>).
            urlPattern: ({ url }) => url.pathname.startsWith('/videos/') && /\.(mp4|webm)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: VIDEO_CACHE,
              rangeRequests: true,
              cacheableResponse: { statuses: [200] },
              expiration: { maxEntries: 150 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
