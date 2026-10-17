import { projectSelectedData } from './scripts/project-selected-data.mjs'
import { projectLightRegistries } from './scripts/project-light-registries.mjs'
import { projectToolData } from './scripts/project-tool-data.mjs'
import { projectFeeCatalog } from './scripts/project-fee-catalog.mjs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {splitEtfRecords} from './scripts/split-etf-records.mjs'
import {splitCompanyRecords} from './scripts/split-company-records.mjs'
const issuerParts=splitEtfRecords()
const companyParts=splitCompanyRecords()
const toolData = projectToolData()

// https://vite.dev/config/
export default defineConfig({
  base: '/shinny-potato/',
  build: {
    manifest: true,
    rolldownOptions: { output: { codeSplitting: { groups: [
      { name: 'etf-card-metadata', test: /src\/data\/etf-cards\.js$/, priority: 130 },
      { name: 'etf-publication-data', test: /src\/data\/etf-publication-data\.js$/, priority: 130 },
      { name: 'ranking-calculations', test: /performance-rankings\/(?:engine|series)\.js$/, priority: 135 },
      ...['exposures','exposures-extra-0','exposures-extra-1','exposures-extra-2','holdings','catalog'].map(name=>({name:'dca-'+name,test:new RegExp('dca-profiles/'+name+'\\.json$'),priority:135})),
      ...issuerParts.groups,
      ...companyParts.groups,
      ...toolData.groups,
      { name: 'company-observations', test: /company-analysis\.json$/, priority: 100 },
      { name: 'light-helpers', test: /(?:search-text|asset-labels|investment-presets|format-currency|publication-length)\.js$/, priority: 110 },
      { name: 'non-bond-monthly', test: /non-bond-monthly-records\.json$/, priority: 100 },
      { name: 'company-history-expansion', test: /non-bond-company-histories\.json$/ },
      { name: 'market-monthly-records', test: /automated-monthly\.json$/ },
      // Shared by anniversaries and calculator; keep the new data below the route budget.
      { name: 'etf-issuer-records', test: /automated-etf\.json$/ },
      { name: 'official-index-history', test: /anniversary-index-history\.json$/ },
    ] } } },
  },
  plugins: [projectSelectedData(), projectLightRegistries(), toolData.plugin, projectFeeCatalog(), react(), tailwindcss(), issuerParts.plugin, companyParts.plugin],
})
