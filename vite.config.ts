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
        },
        extensions: ['.tsx', '.ts', '.jsx', '.js']
      },
      build: {
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html')
          },
          external: [
            '@google/genai',
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
          ],
          output: {
            format: 'es',
            preserveModules: false,
            globals: {
              'react': 'React',
              'react-dom': 'ReactDOM'
            }
          }
        }
      }
    };
});
