import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import type { Plugin } from 'vite';

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const strictCsp = (): Plugin => ({
  name: 'polaris-strict-csp',
  apply: 'build',
  transformIndexHtml(html) {
    return html.replace(
      '</head>',
      `  <meta http-equiv="Content-Security-Policy" content="${CSP}" />\n  </head>`,
    );
  },
});

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['bg.png', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'Polaris',
        short_name: 'Polaris',
        description: 'Same sky. New thoughts. A private, offline-first journal.',
        theme_color: '#0d0b14',
        background_color: '#0d0b14',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
    strictCsp(),
  ],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@tiptap') || id.includes('prosemirror')) return 'editor';
          if (id.includes('react') || id.includes('scheduler')) return 'react';
          if (id.includes('workbox')) return 'pwa';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
