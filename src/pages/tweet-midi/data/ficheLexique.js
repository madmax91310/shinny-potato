// Format "Fiche lexique" — ne duplique aucune donnée : lit directement TERMES et
// CATEGORY_ORDER depuis l'outil Lexique financier existant, et réutilise sa fonction
// generateCopyText telle quelle (même texte que ce que produirait cet outil).
import { TERMES, CATEGORY_ORDER } from "../../lexique-financier/data.js";
import { generateCopyText } from "../../lexique-financier/lib.js";

// Un "sujet" par terme du lexique, groupé par catégorie dans l'ordre déjà défini par l'outil
// d'origine — sert à peupler le sélecteur d'étape 2 pour ce format.
export const FICHE_LEXIQUE_SUBJECTS = CATEGORY_ORDER.map((categorie) => ({
  categorie,
  items: TERMES.filter((t) => t.categorie === categorie).map((t) => ({ id: t.id, label: t.titre })),
})).filter((g) => g.items.length > 0);

const byId = new Map(TERMES.map((t) => [t.id, t]));

export function getFicheLexiqueText(termeId) {
  const terme = byId.get(termeId);
  return terme ? generateCopyText(terme) : "";
}

export function isFicheLexiqueSubject(termeId) {
  return byId.has(termeId);
}
