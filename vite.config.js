import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/shinny-potato/',
  build: {
    manifest: true,
    rolldownOptions: { output: { codeSplitting: { groups: [
      // Shared by anniversaries and calculator; keep the new data below the route budget.
      { name: 'etf-issuer-records', test: /automated-etf\.json$/ },
      { name: 'official-index-history', test: /anniversary-index-history\.json$/ },
    ] } } },
  },
  plugins: [react(), tailwindcss()],
})
