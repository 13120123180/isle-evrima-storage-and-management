import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 10004,
    proxy: {
      '/server_api': {
        target: `http://127.0.0.1:10002`,
        changeOrigin: true
      }
    }
  }
})
