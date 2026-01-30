import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/chat': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/submit-questionnaire': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/submit-game-session': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/update-contact-info': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/generate-weekly-report': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/create-diary-password': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/verify-diary-password': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/diary-entries': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  },
});
