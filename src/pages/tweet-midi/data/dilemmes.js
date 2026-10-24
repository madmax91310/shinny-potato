// Static prompts stay separate from the unchanged scenario renderer.
import DATA from './dilemmes-data.json' with {type:'json'}
export const MONTANTS=DATA.MONTANTS
export const SITUATIONS=DATA.SITUATIONS

function render(template, montant, contexte) {
  const valeur = Number(montant.replace(/[^0-9]/g, ""));
  const mensualite = (valeur / 10).toLocaleString("fr-FR") + " €";
  return template.replaceAll("{montant}", montant).replaceAll("{mensualite}", mensualite).replaceAll("{contexte}", contexte ?? "");
}

// Scénarios hypothétiques, pas des prévisions ni des recommandations.
// Toute la matrice est matérialisée au chargement ; les filtres et identifiants restent stables.
export const DILEMMES = SITUATIONS.flatMap(situation =>
  (situation.contextes ?? [null]).flatMap((contexte, ci) =>
    (situation.montants ?? MONTANTS).map((rawMontant, mi) => {
      const montant = rawMontant.replace(/\s*€$/, " €");
      return {
        id: `${situation.id}-${ci}-${mi}`,
        situationId: situation.id,
        contexteTexte: render(situation.accroche, montant, contexte),
        choix: render(situation.choix, montant, contexte),
        optionA: render(situation.optionA, montant, contexte),
        optionB: render(situation.optionB, montant, contexte),
        tension: render(situation.tension, montant, contexte),
        question: render(situation.question, montant, contexte),
      };
    })
  )
);
