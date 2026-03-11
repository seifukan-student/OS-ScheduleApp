// Client-side React build
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: { client: resolve(__dirname, 'app/client.tsx') },
      output: {
        entryFileNames: 'app/[name].js',
        chunkFileNames: 'app/chunks/[name]-[hash].js',
        assetFileNames: 'app/assets/[name]-[hash][extname]',
      },
    },
  },
})
