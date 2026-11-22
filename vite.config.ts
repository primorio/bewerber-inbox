import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { inboxApi } from './server/plugin.ts'

export default defineConfig(({ mode }) => {
  // Optional: zusätzliche Hostnamen für den Zugriff über einen Proxy, kommagetrennt in .env.local,
  // z. B. DEV_ALLOWED_HOSTS=.dev.example.com (führender Punkt = Domain samt Subdomains).
  const env = loadEnv(mode, process.cwd(), 'DEV_')
  const allowedHosts = (env.DEV_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)

  return {
    plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), tailwindcss(), inboxApi()],
    server: { port: 4747, open: false, allowedHosts },
    preview: { port: 4747, allowedHosts },
  }
})
