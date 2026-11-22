import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Port 1420 =  Tauri . clearScreen=false see logs
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 1420, strictPort: true },
});
