import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    base: './',
    server: {
      host: true, // Listen on all local network addresses (0.0.0.0)
      port: 5173,
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: mode === 'development' ? [
        { find: 'firebase/firestore', replacement: path.resolve(import.meta.dirname, 'src/lib/mockFirestore.js') }
      ] : []
    }
  }
})
