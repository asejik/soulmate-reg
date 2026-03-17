// client/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // No server config, no CSP headers, no middleware.
  // CSP in dev is causing more problems than it solves.
  // Production CSP is handled entirely by vercel.json.
})