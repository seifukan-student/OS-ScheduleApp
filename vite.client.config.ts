// Client-side React build - IIFE format for compatibility
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'app/client.tsx'),
      output: {
        format: 'iife',
        entryFileNames: 'app/client.js',
        chunkFileNames: 'app/chunks/[name]-[hash].js',
        assetFileNames: 'app/assets/[name]-[hash][extname]',
        name: 'OSCalendarApp',
        inlineDynamicImports: true,
      },
    },
  },
})
