import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// A plain static site. Events and photographs are bundled from src/content/,
// and tickets are sold on Paystack, so there is no API to proxy.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
})
