import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/test.github.io/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    // Ensure assets are handled correctly
    assetsInlineLimit: 4096,
  },
  server: {
    port: 3005,
    strictPort: true,
    host: true,
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
