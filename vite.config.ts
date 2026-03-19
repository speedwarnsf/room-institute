import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // Root base path for standalone deployment at zenspace-two.vercel.app
      base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [tailwindcss(), react()],
      // SECURITY: Do NOT expose GEMINI_API_KEY to client bundle.
      // The key lives server-side only (api/gemini.ts via process.env).
      define: {},
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Increase chunk warning limit since Gemini SDK is large
        chunkSizeWarningLimit: 650,
        rollupOptions: {
          output: {
            // Manual chunking for better caching
            manualChunks: {
              // Separate vendor chunks
              'vendor-react': ['react', 'react-dom'],
              // @google/genai no longer bundled client-side
              'vendor-icons': ['lucide-react'],
              'vendor-motion': ['framer-motion'],
              'vendor-markdown': ['react-markdown'],
              'vendor-supabase': ['@supabase/supabase-js'],
            }
          }
        }
      }
    };
});
