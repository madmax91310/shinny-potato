const PATHS = {
  '/comparateur-indices': 'M4 19V9m8 10V4m8 15v-7M2 21h20',
  '/comparatif-courtiers': 'M12 3v18M4 7h16M6 7l-4 8h8L6 7m12 0-4 8h8l-4-8M8 21h8',
  '/calculateur-investissement': 'M3 17l6-6 4 3 8-10m-6 0h6v6M3 21h18',
  '/impact-frais': 'M5 3h14v18H5zM8 7h8M8 11h1m6 0h1M8 15h1m6 0h1',
  '/generateur-portefeuilles': 'M3 8h18v12H3zM8 8V4h8v4M3 12h18m-9 0v3',
  '/duels-portefeuilles': 'M4 4l16 16M15 20l5-5M20 4L4 20M4 15l5 5M4 4v5m0-5h5m11 0v5m0-5h-5',
  '/portefeuilles-investisseurs': 'M8 7a4 4 0 1 0 8 0 4 4 0 1 0-8 0M4 21v-3a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v3',
  '/fiche-lexique': 'M4 4h7v16H4zM11 4h9v16h-9M7 8h1m6 0h3m-3 4h3',
  '/comparatif-etf': 'M4 19V9m8 10V4m8 15v-7M2 21h20',
  '/il-y-a-x-ans': 'M3 5h18v16H3zM7 3v4m10-4v4M3 10h18m-13 5h8',
  '/performance-depuis': 'M3 17l6-6 4 3 8-10m-6 0h6v6M3 21h18',
  '/pouvoir-achat': 'M18 6a7 7 0 1 0 0 12M3 10h12M3 14h10',
  '/dilemme': 'M12 21V11M5 4l7 7 7-7M5 4v5m0-5h5m9 0v5m0-5h-5',
  '/vrai-faux': 'M3 12l5 5 7-10m1 8 5 5m0-5-5 5',
  '/tweet-midi': 'M3 4h18v13H9l-6 4V4m4 5h10M7 13h7',
  '/fiches-etf': 'M5 3h10l4 4v14H5zM15 3v5h4M8 12h8m-8 4h6',
  '/tweets-factsheets': 'M4 3h12v5M4 3v18h12v-4M8 7h4m-4 4h3m3 2a4 4 0 1 0 8 0 4 4 0 1 0-8 0m7 3 3 4',
  '/faits-marquants-marches': 'M4 19V5m0 14h17M7 15l4-6 4 3 6-8',
  '/cas-concrets': 'M4 5h16v14H4zM8 9h8m-8 5h5',
  '/france-100-menages': 'M4 7a2 2 0 1 0 4 0 2 2 0 1 0-4 0m12 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M2 18v-3a4 4 0 0 1 8 0v3m4 0v-3a4 4 0 0 1 8 0v3',
  '/banque-tweets': 'M3 4h18v5H3zM5 9v12h14V9m-10 4h6',
  '/bibliotheque-donnees': 'M3 3h12v18H3zM7 7h4m-4 4h3m6 2a4 4 0 1 0 8 0 4 4 0 1 0-8 0m7 3 3 4',
  '/donnees-a-revoir': 'M3 5h18v16H3zM7 3v4m10-4v4M3 10h18m-13 5 3 3 5-5',
}
export default function ToolIcon({ to }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={PATHS[to] ?? 'M4 4h16v16H4z'} /></svg>
}
