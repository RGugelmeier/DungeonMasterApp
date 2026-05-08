import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'compositions/ui': path.resolve(__dirname, 'src/components/ui'),
    },
  },
  server: {
    proxy: {
      '/auth': 'http://localhost:5000',
      '/users': 'http://localhost:5000',
      '/notes': 'http://localhost:5000',
      '/ai': 'http://localhost:5000',
      '/characters': 'http://localhost:5000',
    }
  }
})
