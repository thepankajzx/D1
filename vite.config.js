import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isAndroid = mode === 'android' || process.env.VITE_APP_TARGET === 'android';

  const aliases = [];

  if (process.env.VITE_MOCK_FIRESTORE === 'true') {
    aliases.push({ 
      find: 'firebase/firestore', 
      replacement: path.resolve(import.meta.dirname, 'src/lib/mockFirestore.js') 
    });
  }

  if (isAndroid) {
    // 1. Swap full B2B routes with clean Android redirect stubs (zero clinical/B2B imports)
    aliases.push({
      find: './routes/platformB2bRoutes',
      replacement: path.resolve(import.meta.dirname, 'src/routes/platformB2bRoutes.android.jsx')
    });
    aliases.push({
      find: '@/routes/platformB2bRoutes',
      replacement: path.resolve(import.meta.dirname, 'src/routes/platformB2bRoutes.android.jsx')
    });

    // 2. Swap web pricing/checkout subscription page with Google Play-compliant 'D1 OS Pro — Coming Soon'
    aliases.push({
      find: './pages/Subscription',
      replacement: path.resolve(import.meta.dirname, 'src/pages/Subscription.android.jsx')
    });
    aliases.push({
      find: '../pages/Subscription',
      replacement: path.resolve(import.meta.dirname, 'src/pages/Subscription.android.jsx')
    });

    // 3. Swap web B2B enterprise admin section in Profile with zero-bundle stub
    aliases.push({
      find: '../components/B2bEnterpriseSection',
      replacement: path.resolve(import.meta.dirname, 'src/components/B2bEnterpriseSection.android.jsx')
    });
    aliases.push({
      find: './components/B2bEnterpriseSection',
      replacement: path.resolve(import.meta.dirname, 'src/components/B2bEnterpriseSection.android.jsx')
    });
    aliases.push({
      find: './B2bEnterpriseSection',
      replacement: path.resolve(import.meta.dirname, 'src/components/B2bEnterpriseSection.android.jsx')
    });
  }

  return {
    base: './',
    esbuild: {
      drop: (mode === 'production' || mode === 'web' || mode === 'android') ? ['console', 'debugger'] : []
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
      alias: aliases
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
