import assert from 'node:assert/strict'
import { latestCommonYears } from '../../src/data/annual-window.js'
import { monthlyCalendarReturns } from '../monthly-return-projection.mjs'

// A manual market-history consumer does not consume an ETF presentation.
// Bind it to the existing admitted registry and its exact qualified price record.
export function assertQualifiedManualSupport(asset, { candidates, projections, histories, calendarYears }) {
 const candidate=candidates.find(a=>a.id===asset.id&&a.isin===asset.isin)
 assert(candidate?.automatedManual&&candidate.manualOnly&&asset.automatedManual&&asset.manualOnly,`Admission manuelle qualifiée manquante : ${asset.id}`)
 const projected=projections[asset.isin]
 assert(projected?.isin===asset.isin&&projected.basis==='market-price'&&['EUR','USD'].includes(projected.currency),`Série de marché exacte manquante : ${asset.id}`)
 assert.equal(asset.returnCurrency,projected.currency,`Devise incohérente : ${asset.id}`)
 const raw=Object.values(histories).find(r=>r.isin===asset.isin&&r.currency===projected.currency&&r.listingEvidenceId===projected.listingEvidenceId&&r.responseSha256===projected.responseSha256)
 assert(raw?.consumerScope==='catalog'&&raw.field==='adjclose'&&raw.listingEvidenceId&&/^[a-f0-9]{64}$/.test(raw.responseSha256??''),`Preuve de cotation exacte manquante : ${asset.id}`)
 assert(raw.sourceUrls?.[0]?.startsWith('https://')&&raw.checkedAt,`Source non qualifiée : ${asset.id}`)
 assert.equal(projected.source,raw.sourceUrls[0]);assert.deepEqual(projected.sourceUrls,raw.sourceUrls)
 assert.equal(projected.checkedAt,raw.checkedAt)
 const years=monthlyCalendarReturns(raw)
 assert(latestCommonYears([years],{minimum:3}).length>=3,`Historique manuel insuffisant : ${asset.id}`)
 assert.deepEqual(projected.years,years);assert.deepEqual(asset.calendarReturns,years)
 assert.deepEqual(asset.calendarReturns,candidate.calendarReturns)
 assert.deepEqual(asset.r,calendarYears.map(year=>years[year]??null));assert.deepEqual(projected.values,asset.r)
 return {kind:'qualified-manual-market-history',isin:asset.isin,currency:projected.currency,source:projected.source,checkedAt:projected.checkedAt,listingEvidenceId:raw.listingEvidenceId,responseSha256:raw.responseSha256}
}
