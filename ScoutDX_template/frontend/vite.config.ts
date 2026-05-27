import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: process.env.CHOKIDAR_USEPOLLING === 'true',
    },
    hmr: {
      host: 'localhost',
      clientPort: 5173,
    },
  },
})
