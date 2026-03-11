// Cloudflare Worker build
import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  plugins: command === 'serve'
    ? [react(), devServer({ adapter, entry: 'src/index.tsx', exclude: [/^\/app\//, /^\/@.+/, /^\/node_modules\/.*/] })]
    : [build({ entry: 'src/index.tsx' })],
}))
