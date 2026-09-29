// Contrôles PEA sur une part exacte (ISIN), distincts des revues historiques
// des Fiches ETF. null signifie que la recherche n'a pas permis de trancher.
// Ne jamais déduire l'éligibilité du domicile, de l'indice ou du nom commercial.
export const PEA_REVIEWS_BY_ISIN = Object.freeze({
  FR0011550193: { eligible: true, checkedAt: '2026-09-29', sourceUrl: 'https://docfinder.bnpparibas-am.com/api/files/3aad97bc-4fe9-4f3f-a1c5-6f5934e401ee/512' },
  LU1834988518: { eligible: true, checkedAt: '2026-09-29', sourceUrl: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1834988518/FRA/FRA/INSTITUTIONNEL/ETF/20250930' },
  FR0013412020: { eligible: true, checkedAt: '2026-09-29', sourceUrl: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412020/FRA/FRA/INSTITUTIONNEL/ETF/20260131' },
  FR001400S9V0: { eligible: true, checkedAt: '2026-09-29', sourceUrl: 'https://www.amundietf.fr/pdfDocuments/kid-priips/FR001400S9V0/FRA/FRA/20241209' },
  LU1834986900: { eligible: true, checkedAt: '2026-09-29', sourceUrl: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1834986900/FRA/FRA/INSTITUTIONNEL/ETF/20260331' },
  FR0013411980: { eligible: true, checkedAt: '2026-09-29', sourceUrl: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013411980/ENG/FRA/INSTITUTIONNEL/ETF' },
  LU1834983634: { eligible: true, checkedAt: '2026-09-29', sourceUrl: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1834983634/FRA/FRA/INSTITUTIONNEL/ETF' },
  LU1681047236: { eligible: true, checkedAt: '2026-09-29', sourceUrl: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681047236/ENG/FRA/INSTITUTIONNEL/ETF/20250930' },
  IE0002Y8CX98: { eligible: false, checkedAt: '2026-09-29', sourceUrl: 'https://www.wisdomtree.eu/en-ie/etfs/thematic/wdef---wisdomtree-europe-defence-ucits-etf---eur-acc' },
  LU3038520774: { eligible: false, checkedAt: '2026-09-29', sourceUrl: 'https://www.ca-sicavetfcp.fr/productsheet/view/idpart/382/idvm/LU3038520774/lg/fr/popup/1' },
  // La page BlackRock consultée n'établit pas l'éligibilité de cette part.
  // Des fiches secondaires se contredisent : conserver un statut inconnu.
  IE00B53L3W79: { eligible: null, checkedAt: '2026-09-29', sourceUrl: 'https://www.blackrock.com/fr/particuliers/products/253712/', note: 'PEA non établi ; fiches secondaires contradictoires' },
  // HSBC ne mentionne pas le PEA dans la fiche émetteur retrouvée ; des
  // fiches secondaires divergent également. Ne pas utiliser comme option PEA.
  IE00B4K6B022: { eligible: null, checkedAt: '2026-09-29', sourceUrl: 'https://www.assetmanagement.hsbc.co.uk/api/v1/download/document/ie00b4k6b022/gb/en/factsheet', note: 'PEA non établi ; fiches secondaires contradictoires' },
});
