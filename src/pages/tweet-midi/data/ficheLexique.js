// Format "Fiche lexique" — sujets et identifiants issus directement de TERMES et
// CATEGORY_ORDER depuis le registre sourcé commun. La rédaction courte reste propre
// à Tweet Midi ; le lexique complet conserve ses fiches détaillées.
import { TERMES, CATEGORY_ORDER } from "../../../data/financial-lexicon.js";
import { FICHE_LEXIQUE_EDITORIAL } from "./ficheLexiqueEditorial.js";

// Un "sujet" par terme du lexique, groupé par catégorie dans l'ordre déjà défini par l'outil
// d'origine — sert à peupler le sélecteur d'étape 2 pour ce format.
export const FICHE_LEXIQUE_SUBJECTS = CATEGORY_ORDER.map((categorie) => ({
  categorie,
  items: TERMES.filter((t) => t.categorie === categorie).map((t) => ({ id: t.id, label: t.titre })),
})).filter((g) => g.items.length > 0);

const byId = new Map(TERMES.map((t) => [t.id, t]));

export function getFicheLexiqueText(termeId) {
  const terme = byId.get(termeId);
  if (!terme) return "";
  const texte = FICHE_LEXIQUE_EDITORIAL[termeId];
  if (!texte) throw new Error(`Rédaction Tweet Midi manquante pour le terme ${termeId}`);
  const lines = [
    `📖 Le lexique : ${texte.titre ?? terme.titre}`,
    texte.ouverture,
    `${texte.emojiDefinition ?? "💡"} ${texte.definition}`,
    `🔍 ${texte.point}`,
    `⚠️ ${texte.limite}`,
  ];
  if (texte.question) lines.push(`💬 ${texte.question}`);
  return lines.join("\n\n");
}

export function isFicheLexiqueSubject(termeId) {
  return byId.has(termeId);
}
