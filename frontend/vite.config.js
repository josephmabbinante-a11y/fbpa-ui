import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    base: '/',
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:4001',
          changeOrigin: true,
        }
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              const dirs = id.split('node_modules/')[1].split('/')
              return dirs[0]
            }
          }
        }
      }
    }
  }
})
