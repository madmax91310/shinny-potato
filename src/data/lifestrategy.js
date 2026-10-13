import records from './lifestrategy.json' with { type: 'json' }

// All observed figures come from the daily issuer collection, shared across tools.
export const LIFESTRATEGY_RECORDS = records
export const LIFESTRATEGY_SHEETS = Object.values(records).map(r => {
  const equity = Number(r.id.replace('lifestrategy', ''))
  const allocation = r.assetAllocation.rows.map(p => `${p.name} : ${p.weightPct.toLocaleString('fr-FR')} %`).join(' · ')
  return { id: r.id, isin: r.isin, name: r.name, category: 'Multi-actifs', scene: 'world',
    source: r.sourceUrl, checkedAt: r.checkedAt.slice(0, 10),
    hook: `Actions et obligations dans un seul ETF : que contient cette allocation ${equity}/${100-equity} ? 👇`,
    whatIs: `Tu détiens plusieurs ETF Vanguard, avec une cible d’environ ${equity} % d’actions et ${100-equity} % d’obligations. Les actions couvrent les pays développés et émergents. Les obligations regroupent des emprunts d’État et d’entreprises.\n\nAllocation publiée au ${r.assetAllocation.asOf.split('-').reverse().join('/')} : ${allocation}.`,
    whyInteresting: 'Tu confies le rééquilibrage entre actions et obligations à Vanguard. Les revenus restent investis dans cette part capitalisante. La poche obligataire cherche à limiter le risque de change face à l’euro.',
    whatToKnow: 'Les actions et les obligations peuvent baisser en même temps. Les taux et le risque de crédit comptent aussi. La couverture de change concerne la poche obligataire, pas tout le portefeuille. Les proportions visées peuvent légèrement varier.',
    verdict: 'Une allocation multi-actifs réunie dans une seule ligne, avec un niveau d’exposition aux actions à choisir.',
    question: 'Tu préférerais cette allocation dans un seul ETF ou gérer toi-même plusieurs lignes ?',
  }
})
export const LIFESTRATEGY_INSTRUMENTS = Object.fromEntries(Object.values(records).map(r => [r.isin, { name: r.name }]))
export const LIFESTRATEGY_LISTINGS = Object.fromEntries(Object.values(records).map(r => [r.isin, r.characteristics.listings]))
export const LIFESTRATEGY_FACTS = Object.fromEntries(Object.values(records).map(r => [r.isin, {
  benchmark: r.characteristics.index, incomePolicy: 'accumulating', distribution: 'Capitalisant',
  domicile: r.characteristics.domicile, replicationMethod: r.characteristics.replicationMethod,
  location: 'Irlande, gestion active multi-actifs via ETF indiciels', currencyHedge: 'Poche obligataire couverte en EUR',
  instrumentType: 'ETF', reviewedAt: r.checkedAt.slice(0,10).split('-').reverse().join('/'),
  positionsLabel: `${r.holdings.rows.length} fonds sous-jacents (${r.holdings.asOf.split('-').reverse().join('/')})`,
  characteristicsSource: { url: r.characteristics.sourceUrl, checkedAt: r.checkedAt.slice(0,10) },
}]))
export function multiAssetAllocationLines(isin) {
  const r = records[isin]
  if (!r) return []
  return [`⚖️ Allocation du fonds au ${r.assetAllocation.asOf.split('-').reverse().join('/')}`,
    ...r.assetAllocation.rows.map(p => `${p.name} : ${p.weightPct.toLocaleString('fr-FR')} %`)]
}

export const LIFESTRATEGY_LISTING_EVIDENCE = Object.fromEntries(Object.values(records).flatMap(r=>r.characteristics.listings.map(l=>[l.evidenceId,{isin:r.isin,sourceUrl:l.sourceUrl,checkedAt:l.checkedAt,identityEvidence:r.isin,excerpt:l.excerpt,documentSha256:r.documentSha256}])));
