import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import compression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      compression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024,
        deleteOriginFile: false
      }),
      compression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
        deleteOriginFile: false
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || (mode === 'production' ? '' : 'http://localhost:3001'),
          changeOrigin: true,
          secure: false
        },
        '/img': {
          target: env.VITE_BACKEND_URL || (mode === 'production' ? '' : 'http://localhost:3001'),
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      minify: 'terser',
      reportCompressedSize: true,
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
          passes: mode === 'production' ? 2 : 1
        }
      },
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            const norm = id.replace(/\\/g, '/');
            if (norm.includes('node_modules/react/') || norm.includes('node_modules/scheduler/')) {
              return 'runtime-react';
            }
            if (norm.includes('react-dom') || norm.includes('react-router-dom') || norm.includes('react-helmet-async')) {
              return 'vendor-core';
            }
            if (norm.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (norm.includes('@tanstack')) {
              return 'vendor-query';
            }
            if (norm.includes('zustand')) {
              return 'vendor-query';
            }
            if (norm.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (norm.includes('sonner') || norm.includes('dompurify')) {
              return 'vendor-ui-utils';
            }
            if (norm.includes('quill') || norm.includes('react-quill')) {
              return 'vendor-editor';
            }
            if (norm.includes('xlsx') || norm.includes('sheetjs')) {
              return 'vendor-xlsx';
            }
            if (norm.includes('node_modules/')) {
              return null;
            }
            if (norm.includes('src/components/') && !norm.includes('src/components/admin/')) {
              return 'components-common';
            }
            if (norm.includes('src/hooks/useDebounce') || norm.includes('src/hooks/usePagination')) {
              return 'hooks-utils';
            }
            if (norm.includes('src/lib/utils.ts') || norm.includes('src/lib/seo.ts') || norm.includes('src/lib/api.ts')) {
              return 'lib-utils';
            }
            return undefined;
          }
        }
      },
      chunkSizeWarningLimit: 600,
      commonjsOptions: {
        include: /node_modules/
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'lucide-react', '@supabase/supabase-js', '@tanstack/react-query', 'sonner', 'react-helmet-async']
    }
  }
})
