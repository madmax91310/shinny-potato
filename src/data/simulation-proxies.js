// Contrôle du 03/10/2026. Historiques de simulation, jamais rendements attribués à la part récente.
export const SIMULATION_PROXIES = {
 IE0006WW1TQ4: { currency: 'USD', values: [7.59,12.62,-14.29,17.94,4.70,31.85],
 source: 'https://www.msci.com/documents/10199/255599/msci-world-ex-usa-index-net.pdf',
 scope: 'MSCI World ex USA Net Return USD, 2020–2025, hors frais ETF',
 note: 'Simulation sur l’indice MSCI World ex USA net USD, hors frais ETF, pour 2020–2025 ; la part a été lancée en 2024.' },
 FR0014017NX3: { currency: 'USD', referenceIsin: 'IE00B6R52259',
 source: 'https://www.ishares.com/uk/individual/en/literature/fact-sheet/ssac-ishares-msci-acwi-ucits-etf-fund-fact-sheet-en-gb.pdf',
 scope: 'Proxy iShares MSCI ACWI USD Acc, 2020–2025, autre part du même indice',
 note: 'Simulation 2020–2025 sur iShares MSCI ACWI USD Acc (IE00B6R52259), même indice, frais de cette autre part ; Amundi PEA Global a été lancé en 2026.' },
};
