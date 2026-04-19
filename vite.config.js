import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const chunkGroups = [
  ['react-vendor', ['/node_modules/react/', '/node_modules/react-dom/', '/node_modules/scheduler/']],
  ['router', ['/node_modules/react-router/', '/node_modules/react-router-dom/', '/node_modules/@remix-run/router/']],
  ['fullcalendar', ['/node_modules/@fullcalendar/']],
  ['pocketbase', ['/node_modules/pocketbase/']],
  ['forms', ['/node_modules/react-hook-form/']],
  ['speech', ['/node_modules/react-speech-recognition/']],
  ['icons', ['/node_modules/lucide-react/']],
  ['notifications', ['/node_modules/sonner/']],
]

function manualChunks(id) {
  const normalizedId = id.replace(/\\/g, '/')

  if (!normalizedId.includes('/node_modules/')) {
    return undefined
  }

  const matchedGroup = chunkGroups.find(([, patterns]) =>
    patterns.some((pattern) => normalizedId.includes(pattern))
  )

  return matchedGroup ? matchedGroup[0] : 'vendor'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
})
