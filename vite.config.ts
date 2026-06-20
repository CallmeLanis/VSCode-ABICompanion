import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use a relative base for production so the app works on GitHub Pages
const isProd = process.env.NODE_ENV === 'production';

// https://vitejs.dev/config/
export default defineConfig({
  base: isProd ? './' : '/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
