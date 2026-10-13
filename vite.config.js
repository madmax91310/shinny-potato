import { projectFeeCatalog } from './scripts/project-fee-catalog.mjs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {splitEtfRecords} from './scripts/split-etf-records.mjs'
const issuerParts=splitEtfRecords()

// https://vite.dev/config/
export default defineConfig({
  base: '/shinny-potato/',
  build: {
    manifest: true,
    rolldownOptions: { output: { codeSplitting: { groups: [
      ...issuerParts.groups,
      { name: 'light-helpers', test: /(?:search-text|format-currency|publication-length)\.js$/, priority: 110 },
      { name: 'non-bond-monthly', test: /non-bond-monthly-records\.json$/, priority: 100 },
      { name: 'company-history-expansion', test: /non-bond-company-histories\.json$/ },
      { name: 'market-monthly-records', test: /automated-monthly\.json$/ },
      // Shared by anniversaries and calculator; keep the new data below the route budget.
      { name: 'etf-issuer-records', test: /automated-etf\.json$/ },
      { name: 'official-index-history', test: /anniversary-index-history\.json$/ },
    ] } } },
  },
  plugins: [projectFeeCatalog(), react(), tailwindcss(), issuerParts.plugin],
})
