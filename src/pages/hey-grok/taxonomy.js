export const THEMES = [
  { id: 'retraite', label: 'Retraite' }, { id: 'travail', label: 'Salaire et travail' },
  { id: 'patrimoine', label: 'Patrimoine' }, { id: 'immobilier', label: 'Immobilier' },
  { id: 'epargne', label: 'Épargne' }, { id: 'investissement', label: 'Investissement' },
  { id: 'depenses', label: 'Dépenses' }, { id: 'famille', label: 'Couple et famille' },
  { id: 'marques', label: 'Marques et avenir' },
]
export const SUBJECT_THEME = { bourse: 'investissement', immobilier: 'immobilier', banques: 'epargne', travail: 'travail', budget: 'depenses', marques: 'marques', societe: 'famille', technologie: 'marques' }
export const THEME_OVERRIDES = {
  'immobilier-13': 'patrimoine', 'societe-01': 'patrimoine', 'societe-04': 'patrimoine',
  'societe-16': 'patrimoine', 'societe-20': 'patrimoine', 'banques-09': 'travail',
  'banques-11': 'depenses', 'banques-18': 'patrimoine', 'banques-25': 'patrimoine',
  'technologie-01': 'travail', 'technologie-02': 'travail', 'technologie-03': 'travail',
  'technologie-04': 'travail', 'technologie-06': 'travail', 'technologie-12': 'travail',
  'technologie-16': 'travail', 'technologie-18': 'travail', 'technologie-20': 'travail',
}
// Les archives restent accessibles, avec leurs IDs et textes ; aucun état local n'est effacé.
export const ARCHIVE_REASONS = {
  'bourse-14': 'Question générale sur les graphiques, moins concrète que les nouveaux cas.',
  'bourse-19': 'Fermeture des marchés cinq ans : contrainte trop éloignée de la vie courante.',
  'banques-03': 'Nombre de comptes : seuil arbitraire sans enjeu personnel assez clair.',
  'banques-15': 'Méthode d’épargne trop scolaire, remplacée dans la sélection par des situations chiffrées.',
  'banques-20': 'Habitudes de sabotage formulées trop largement.',
  'travail-09': 'Qualité idéale du manager : choix abstrait.',
  'travail-18': 'Seuil horaire entre amis et collègues artificiel.',
  'societe-16': 'Signes de réussite sans facture : formulation trop générale.',
  'technologie-08': 'Choix d’un droit sur les objets trop abstrait.',
  'technologie-20': 'Entretien entre deux IA : scénario trop éloigné de la situation du lecteur.',
  'marques-17': 'Nom de famille après vente : sujet trop étroit pour la sélection courante.',
}
export const TEMPLATES = [
  { id: 'libre', label: 'Saisie libre', fields: [] },
  { id: 'retraite', label: 'Arrêter de travailler', fields: [{ key: 'montant', label: 'Montant', value: '300 000 €' }, { key: 'age', label: 'Âge', value: '35 ans' }] },
  { id: 'objectif', label: 'Atteindre un objectif', fields: [{ key: 'objectif', label: 'Objectif', value: '500 000 €' }, { key: 'duree', label: 'Durée', value: '25 ans' }] },
  { id: 'revenu', label: 'Un projet avec ce revenu', fields: [{ key: 'revenu', label: 'Revenu mensuel', value: '2 500 €' }, { key: 'projet', label: 'Projet', value: 'acheter un logement' }] },
  { id: 'duel', label: 'Comparer deux choix', fields: [{ key: 'optionA', label: 'Premier choix', value: 'rembourser son crédit plus vite' }, { key: 'optionB', label: 'Second choix', value: 'investir la différence' }] },
]
