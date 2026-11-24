import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        id: './',
        name: 'CG Catering · Cristian Garay',
        short_name: 'CG Catering',
        lang: 'es-PY',
        description: 'Cristian Garay Recepciones & Catering, Paraguay.',
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#171412',
        background_color: '#f8f5ef',
        icons: [
          { src: './icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: './icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,png,webp,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
})
