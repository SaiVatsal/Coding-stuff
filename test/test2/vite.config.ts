import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@/': 'src/',
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        }
      }
    },
    target: 'esnext'
  },

  server: {
    host: true,
    port: 5173,
    strictPort: false
  },

  optimizeDeps: {
    exclude: []
  }
})
