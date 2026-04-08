import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  root: '.',
  /** リポジトリルートの .env / .env.local を確実に読む（カレントがずれても cwd を明示） */
  envDir: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    // @ts-expect-error - allow all hosts
    allowedHosts: true,
    cors: true,
    hmr: false,
  },
})
