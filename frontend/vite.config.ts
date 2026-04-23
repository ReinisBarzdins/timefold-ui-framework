import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: "/timestruct/ui",
  server: {
    proxy: {
      "/timestruct": {
        target: "http://localhost:8080",
        changeOrigin: true
      }
    }
  },
})
