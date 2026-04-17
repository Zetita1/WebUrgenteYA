import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'icon.jpg', 'robots.txt'],
      manifest: {
        name: 'UrgenteYa.cl',
        short_name: 'UrgenteYa',
        description: 'Encuentra maestros de confianza en Chile. Electricistas, gasfíteres y más.',
        theme_color: '#f97316',
        background_color: '#ffffff',
        display: 'browser',
        start_url: '/',
        lang: 'es',
        icons: [
          { src: '/icon.jpg', sizes: '192x192', type: 'image/jpeg' },
          { src: '/icon.jpg', sizes: '512x512', type: 'image/jpeg' },
          { src: '/icon.jpg', sizes: '512x512', type: 'image/jpeg', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Buscar maestros',
            url: '/tecnicos',
            description: 'Ver todos los maestros disponibles',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/urgenteya\.cl\/api\/technicians/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-technicians',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /\/uploads\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'technician-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,   // escucha en todas las interfaces (necesario para probar en celular)
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/sitemap.xml': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
});
