import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    base: './',
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : []
    },
    server: {
      host: true, // Listen on all local network addresses (0.0.0.0)
      port: 5173,
      watch: {
        ignored: ['**/android/**', '**/dist/**']
      }
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: process.env.VITE_MOCK_FIRESTORE === 'true' ? [
        { find: 'firebase/firestore', replacement: path.resolve(import.meta.dirname, 'src/lib/mockFirestore.js') }
      ] : []
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
          chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
          assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`
        }
      }
    }
  }
})
