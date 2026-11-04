import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const certificateDirectory = path.resolve(process.cwd(), '.certs')
  const certificateKey = path.join(certificateDirectory, 'cav-key.pem')
  const certificateFile = path.join(certificateDirectory, 'cav.pem')
  const https = fs.existsSync(certificateKey) && fs.existsSync(certificateFile)

  return {
    plugins: [
      vue(),
      vueDevTools(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Control de Acceso Vehicular',
          short_name: 'CAV',
          description: 'Sistema de control de acceso vehicular',
          theme_color: '#16324f',
          background_color: '#f4f7f9',
          display: 'standalone',
          start_url: '/',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: true,
      https: https
        ? {
            key: fs.readFileSync(certificateKey),
            cert: fs.readFileSync(certificateFile),
          }
        : undefined,
      proxy: {
        '/api': {
          target: env.VITE_DEV_API_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
  }
})
