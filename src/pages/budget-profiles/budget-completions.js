// The historical rows and statements remain in the source snapshots.
export const budgetCompletions = {
  'finary-locataire-25-2025-11-08': {
    note: 'Ventilation éditoriale des 600 € de vie courante. Les 900 € de logement et charges et les 660 € du prêt étudiant sont conservés. L’énergie et l’assurance du logement sont supposées couvertes dans la part logement, sans ligne en plus. Santé limitée au reste à charge.',
    replace: 'Courses, restaurants, abonnements et dépenses courantes regroupés',
    rows: [
      { label: 'Courses et hygiène', amount: 300, category: 'food' },
      { label: 'Internet et mobile', amount: 35, category: 'bills' },
      { label: 'Transports', amount: 45, category: 'transport' },
      { label: 'Soins à sa charge', amount: 40, category: 'health' },
      { label: 'Restaurants et sorties', amount: 60, category: 'leisure' },
      { label: 'Vêtements', amount: 35, category: 'other' },
      { label: 'Provision vacances et cadeaux', amount: 55, category: 'leisure', annualProvision: { amount: 660 } },
      { label: 'Provision équipement et imprévus', amount: 30, category: 'other', annualProvision: { amount: 360 } },
    ],
    highlight: { label: 'Livrets', amount: 8000 },
  },
  'reddit-couple-nord-2026-07-09': {
    note: 'Ventilation éditoriale de l’enveloppe fixe de 1 367 €. Les 150 € de provision restent affectés aux trajets familiaux. Les transports du quotidien et les crédits conservent leur place dans les charges fixes.',
    replace: 'Charges fixes regroupées',
    rows: [
      { label: 'Loyer et charges locatives', amount: 820, category: 'housing' },
      { label: 'Énergie et eau', amount: 120, category: 'bills' },
      { label: 'Assurances habitation et auto', amount: 80, category: 'bills' },
      { label: 'Internet et mobiles', amount: 47, category: 'bills' },
      { label: 'Transports du quotidien', amount: 120, category: 'transport' },
      { label: 'Crédits du foyer', amount: 180, category: 'credit' },
    ],
  },
  'prepared-lot2-12-2026-10-30': {
    note: 'Ventilation éditoriale des 200 € de charges et abonnements. L’eau est traitée dans les charges locatives et aucun transport ni montant de mutuelle séparé n’est affirmé. Les voyages étaient déjà provisionnés.',
    replace: 'Charges et abonnements',
    rows: [
      { label: 'Charges locatives et eau', amount: 55, category: 'housing' },
      { label: 'Énergie', amount: 50, category: 'bills' },
      { label: 'Assurance habitation', amount: 15, category: 'bills' },
      { label: 'Internet et mobile', amount: 45, category: 'bills' },
      { label: 'Abonnements loisirs', amount: 35, category: 'leisure' },
    ],
  },
}
