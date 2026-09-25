// Quatre duels pilotes : une ligne de 70 % identique et une seule décision sur les 30 % restants.
// Les parts et leurs rendements proviennent du Générateur, les devises sont contrôlées dans lib.js.
export const DUELS = [
  {
    id: 'energie-ou-tech',
    title: 'Énergie ou technologie ?',
    hook: 'Énergie ou technologie : laquelle aurait mieux servi ton portefeuille ?',
    common: 'msci_acwi_ishares',
    left: 'sect_energy_spdr',
    right: 'sect_tech_world_ishares',
    labels: ['Énergie', 'Technologie'],
    question: 'En connaissant aussi la chute de la tech en 2022, tu prends A ou B ? 👇',
  },
  {
    id: 'dividendes-ou-momentum',
    title: 'Dividendes ou momentum ?',
    hook: 'Actions à dividendes ou momentum : tu aurais misé sur quoi ?',
    common: 'msci_acwi_ishares',
    left: 'dividend_aristocrats_us_spdr',
    right: 'world_momentum_ishares',
    labels: ['Dividendes US', 'Momentum mondial'],
    question: 'Le résultat final ou la pire année : qu’est-ce qui pèse le plus dans ton choix ? 👇',
  },
  {
    id: 'em-actions-ou-obligations',
    title: 'Émergents : actions ou obligations ?',
    hook: 'Marchés émergents : tu préfères les actions ou les obligations ?',
    common: 'msci_acwi_ishares',
    left: 'msci_em',
    right: 'oblig_em_local_ishares_acc',
    labels: ['Actions émergentes', 'Dette émergente'],
    question: 'Pour cette part du portefeuille, tu aurais choisi A ou B ? 👇',
  },
  {
    id: 'qualite-ou-faible-volatilite',
    title: 'Qualité ou faible volatilité ?',
    hook: 'Actions de qualité ou faible volatilité : quel choix aurait payé ?',
    common: 'ftse_allworld_vanguard',
    left: 'world_quality_ishares',
    right: 'world_minvol_ishares',
    labels: ['Qualité', 'Faible volatilité'],
    question: 'Tu privilégies le capital final ou la pire année ? 👇',
  },
]
