import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { dataBytesReport, withDataMarks } from './scripts/data-bytes-plugin.mjs'
const base = '/shinny-potato/'

// https://vite.dev/config/
export default defineConfig(async ({ isPreview }) => {
  // Preview serves a validated dist; deriving financial inputs belongs to dev/build.
  if (isPreview) return { base }
  const [{projectSelectedData},{projectLightRegistries},{projectToolData},{projectFeeCatalog},split] = await Promise.all([
    import('./scripts/project-selected-data.mjs'), import('./scripts/project-light-registries.mjs'),
    import('./scripts/project-tool-data.mjs'), import('./scripts/project-fee-catalog.mjs'),
    import('./scripts/split-etf-records.mjs'),
  ])
  const issuerParts=split.splitEtfRecords()
  const metadataParts=split.splitInstrumentMetadataRecords()
  const characteristicParts=split.splitCharacteristicMetadataRecords()
  const toolData=projectToolData()
  return {
  base,
  // The managed preview forwards the dev server through this exact local host.
  server: { allowedHosts: ['terminal.local'] },
  build: {
    manifest: true,
    rolldownOptions: { output: { codeSplitting: { groups: [
      ...['market','bounds','returns'].map(name=>({name:'selected-annual-'+name,test:new RegExp('virtual:selected-annual-'+name+'$'),priority:140})),
      { name: 'etf-card-metadata', test: /src\/data\/etf-cards\.js$/, priority: 130 },
      { name: 'etf-publication-data', test: /src\/data\/etf-publication-data\.js$/, priority: 130 },
      // Historical data grows independently of ranking UI and calculation code.
      { name: 'ranking-long-histories', test: /src\/data\/ranking-histories\.json$/, priority: 135 },
      { name: 'ranking-calculations', test: /performance-rankings\/(?:engine|series)\.js$/, priority: 135 },
      ...['exposures','exposures-extra-0','exposures-extra-1','exposures-extra-2','holdings','catalog'].map(name=>({name:'dca-'+name,test:new RegExp('dca-profiles/'+name+'\\.json$'),priority:135})),
      ...issuerParts.groups,
      ...metadataParts.groups,
      ...characteristicParts.groups,
      ...toolData.groups,
      { name: 'light-helpers', test: /(?:search-text|asset-labels|investment-presets|format-currency|publication-length)\.js$/, priority: 110 },
      { name: 'non-bond-monthly', test: /non-bond-monthly-records\.json$/, priority: 100 },
      { name: 'company-history-expansion', test: /non-bond-company-histories\.json$/ },
      { name: 'market-monthly-records', test: /automated-monthly\.json$/ },
      // Shared by anniversaries and calculator; keep the new data below the route budget.
      { name: 'etf-issuer-records', test: /automated-etf\.json$/ },
      { name: 'official-index-history', test: /anniversary-index-history\.json$/ },
    ] } } },
  },
  // Data projections are marked so route budgets measure code, not monthly data growth.
  plugins: [...[projectSelectedData(), projectLightRegistries(), toolData.plugin, projectFeeCatalog()].map(withDataMarks), react(), tailwindcss(),
    ...[issuerParts.plugin, metadataParts.plugin, characteristicParts.plugin].map(withDataMarks), dataBytesReport()],
  }
})
