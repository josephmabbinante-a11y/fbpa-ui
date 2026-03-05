import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://mongodb-production-744f.up.railway.app/',
        changeOrigin: true,
        secure: false,
      }
    }
  }
  ,
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Example: Split vendor code by package
            const dirs = id.split('node_modules/')[1].split('/');
            return dirs[0];
          }
        }
      }
    }
  }
})
