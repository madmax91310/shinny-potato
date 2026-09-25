// Quatre duels pilotes : une ligne de 70 % identique et une seule décision sur les 30 % restants.
// Les parts et leurs rendements proviennent du Générateur, les devises sont contrôlées dans lib.js.
export const DUELS = [
  {
    id: 'energie-ou-tech',
    title: 'Énergie ou technologie ?',
    hook: 'Tu gardes 70 % de marché mondial. Sur les 30 % restants, tu choisis l’énergie ou la tech ?',
    common: 'msci_acwi_ishares',
    left: 'sect_energy_spdr',
    right: 'sect_tech_world_ishares',
    labels: ['Énergie', 'Technologie'],
    question: 'Tu aurais choisi le portefeuille A ou B ? 👇',
  },
  {
    id: 'dividendes-ou-momentum',
    title: 'Dividendes ou momentum ?',
    hook: 'Même socle mondial. Tu préfères des actions à dividendes ou celles qui ont le vent en poupe ?',
    common: 'msci_acwi_ishares',
    left: 'dividend_aristocrats_us_spdr',
    right: 'world_momentum_ishares',
    labels: ['Dividendes US', 'Momentum mondial'],
    question: 'La pire année change-t-elle ton choix entre A et B ? 👇',
  },
  {
    id: 'em-actions-ou-obligations',
    title: 'Émergents : actions ou obligations ?',
    hook: 'Tu veux 30 % de marchés émergents. Actions ou dette d’État en monnaies locales ?',
    common: 'msci_acwi_ishares',
    left: 'msci_em',
    right: 'oblig_em_local_ishares_acc',
    labels: ['Actions émergentes', 'Dette émergente'],
    question: 'Sur cette poche émergente, tu prends A ou B ? 👇',
  },
  {
    id: 'qualite-ou-faible-volatilite',
    title: 'Qualité ou faible volatilité ?',
    hook: 'Deux façons de sélectionner des actions mondiales. Tu privilégies la qualité ou la stabilité passée ?',
    common: 'ftse_allworld_vanguard',
    left: 'world_quality_ishares',
    right: 'world_minvol_ishares',
    labels: ['Qualité', 'Faible volatilité'],
    question: 'Tu préfères la valeur finale ou une pire année moins sévère ? 👇',
  },
]
