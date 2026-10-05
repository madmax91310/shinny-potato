// Format "Fiche lexique" — sujets et identifiants issus directement de TERMES et
// CATEGORY_ORDER depuis le registre sourcé commun. Les règles, frais et calculs
// détaillés alimentent aussi le tweet, avec des exemples propres à la publication.
import { TERMES, CATEGORY_ORDER } from "../../../data/financial-lexicon.js";
import { FICHE_LEXIQUE_EDITORIAL } from "./ficheLexiqueEditorial.js";

// Un "sujet" par terme du lexique, groupé par catégorie dans l'ordre déjà défini par l'outil
// d'origine — sert à peupler le sélecteur d'étape 2 pour ce format.
export const FICHE_LEXIQUE_SUBJECTS = CATEGORY_ORDER.map((categorie) => ({
  categorie,
  items: TERMES.filter((t) => t.categorie === categorie).map((t) => ({ id: t.id, label: t.titre })),
})).filter((g) => g.items.length > 0);

const byId = new Map(TERMES.map((t) => [t.id, t]));

export function getFicheLexiqueSections(termeId) {
  const terme = byId.get(termeId);
  if (!terme) return [];
  const texte = FICHE_LEXIQUE_EDITORIAL[termeId];
  if (!texte) throw new Error(`Rédaction Tweet Midi manquante pour le terme ${termeId}`);
  // Certaines notions, comme le PEA, gagnent à expliquer les règles dans un
  // ordre précis. Sinon, conserver les rubriques du registre selon le sujet.
  if (texte.sections) return texte.sections;
  const sections = [{ titre: "🔎 Le principe", contenu: texte.definition }];
  if (terme.variante === "A") {
    sections.push({ titre: terme.mecanismeTitre, contenu: terme.mecanismeContenu });
    sections.push(...(terme.sectionsOptionnelles ?? []));
    if (terme.fraisContenu) sections.push({ titre: terme.fraisTitre, contenu: terme.fraisContenu });
  } else {
    sections.push({ titre: terme.calculTitre, contenu: terme.calculContenu });
    if (terme.nuance) sections.push(terme.nuance);
  }
  sections.push({ titre: "🧮 Un exemple concret", contenu: texte.exemple });
  if (texte.application) sections.push({ titre: "💡 Ce que ça change", contenu: texte.application });
  sections.push({ titre: "⚠️ À retenir", contenu: texte.attention ?? terme.attention ?? texte.limite });
  return sections;
}

export function getFicheLexiqueText(termeId) {
  if (!byId.has(termeId)) return "";
  const texte = FICHE_LEXIQUE_EDITORIAL[termeId];
  const sections = getFicheLexiqueSections(termeId);
  const lines = [
    `${texte.emojiDefinition ?? "📖"} ${texte.ouverture} 👇`,
    ...sections.map(({ titre, contenu }) => `${titre}\n\n${contenu}`),
  ];
  if (texte.question) lines.push(`💬 ${texte.question}`);
  return lines.join("\n\n").replace(/(\d)([%€])/gu, "$1 $2");
}

export function isFicheLexiqueSubject(termeId) {
  return byId.has(termeId);
}
