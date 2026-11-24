import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

const sceneEntry = 'AtmosphericSanctuaryTwin3D';
const sceneShaders = 'three-shaders';
const sceneGeometry = 'three-geometry';
const sceneChunks = [sceneEntry, sceneShaders, sceneGeometry];
const sceneChunkPattern = new RegExp(`/assets/(?:${sceneChunks.join('|')})-[^/]+\\.js$`);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Aura — Urban Air Quality & Winter Smog Companion',
        short_name: 'Aura',
        description: 'Use current air-quality forecasts and practical household guidance to plan for urban pollution.',
        theme_color: '#18261F',
        background_color: '#FAF7F2',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        globIgnores: [`**/{${sceneChunks.join(',')}}-*.js`],
        navigateFallbackDenylist: [/^\/(?:api|assets)(?:[/?]|$)/u, /^[^?]*\./u],
        runtimeCaching: [
          {
            urlPattern: sceneChunkPattern,
            handler: 'CacheFirst',
            options: {
              cacheName: 'aura-illustration',
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          },
          {
            urlPattern: /^https:\/\/geocoding-api\.open-meteo\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'open-meteo-geocoding',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: sceneShaders,
              test: /[\\/]three[\\/]src[\\/]renderers[\\/]shaders[\\/]ShaderChunk\.js$/
            },
            {
              name: sceneGeometry,
              test: /[\\/]three[\\/]src[\\/](?:math|geometries)[\\/]/
            }
          ]
        }
      }
    }
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      allowExternal: true,
      include: [
        'src/services/airData.js',
        'src/services/advisor.js',
        resolve(projectRoot, 'shared/advice.mjs'),
        resolve(projectRoot, 'shared/adviceTemplates.mjs'),
        resolve(projectRoot, 'shared/aqi.mjs'),
        resolve(projectRoot, 'shared/groundMonitor.mjs'),
        resolve(projectRoot, 'server/groundStations.js')
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 55,
        statements: 70
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: false
      }
    }
  }
});
