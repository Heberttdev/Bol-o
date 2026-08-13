import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { VitePWA } from 'vite-plugin-pwa'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Cacheia os assets do app (JS, CSS, HTML)
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Quando offline, serve o offline.html no lugar de qualquer rota
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [
          // Não intercepta requisições ao Firebase
          /^https:\/\/.*\.firebaseio\.com/,
          /^https:\/\/.*\.googleapis\.com/,
        ],
      },
      manifest: {
        name: 'Bolão Green',
        short_name: 'Bolão Green',
        description: 'Faça seus palpites e suba no ranking',
        theme_color: '#0F3D2E',
        background_color: '#0b0f14',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
  },
})