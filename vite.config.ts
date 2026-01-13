import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          external: [
            '@google/genai',
            'react',
            'react-dom',
            'react-dom/client',
            'react/jsx-runtime',
            'lucide-react',
            'recharts',
            'react-markdown',
            'date-fns',
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/analytics',
            '@solana/web3.js',
            '@metaplex-foundation/js'
          ]
        }
      }
    };
});
