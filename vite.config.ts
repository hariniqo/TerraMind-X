import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In Base44 preview mode, allow the sandbox host domain so the preview proxy can reach the dev server.
const isPreview = process.env.BASE44_PREVIEW_MODE === '1'
const sandboxHostDomain = process.env.BASE44_SANDBOX_HOST_DOMAIN
const publicHostSuffix = process.env.BASE44_PUBLIC_HOST_SUFFIX

const previewAllowedHosts: string[] = []
if (isPreview) {
  if (sandboxHostDomain) previewAllowedHosts.push(`.${sandboxHostDomain}`)
  if (publicHostSuffix) previewAllowedHosts.push(`.${publicHostSuffix}`)
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: isPreview && previewAllowedHosts.length > 0
      ? previewAllowedHosts
      : true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})

