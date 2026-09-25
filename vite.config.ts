import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0'
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    },
    extensions: ['.tsx', '.ts', '.jsx', '.js']
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      external: [
        '@solana/web3.js',
        '@metaplex-foundation/js'
      ]
    }
  }
});
