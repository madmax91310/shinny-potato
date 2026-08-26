// Format "Comparatif ETF" — ne duplique aucune donnée : lit directement DEFAULT_THEMES depuis
// le Générateur de tweets ETF existant, et réutilise sa fonction buildTweetText telle quelle
// (même texte que ce que produirait cet outil pour la thématique choisie).
import { DEFAULT_THEMES } from "../../etf-tweets/data/themes.js";
import { buildTweetText as buildEtfComparatifText } from "../../etf-tweets/lib/tweetFormat.js";

// Un "sujet" par thématique ETF — sert à peupler le sélecteur d'étape 2 pour ce format. Pas de
// regroupement par catégorie ici : les 16 thématiques ETF n'ont pas de catégorie dans l'outil
// d'origine, contrairement au lexique.
export const COMPARATIF_ETF_SUBJECTS = DEFAULT_THEMES.map((t) => ({ id: t.id, label: `${t.emoji} ${t.nom}` }));

const byId = new Map(DEFAULT_THEMES.map((t) => [t.id, t]));

export function getComparatifEtfText(themeId) {
  const theme = byId.get(themeId);
  return theme ? buildEtfComparatifText(theme) : "";
}

export function isComparatifEtfSubject(themeId) {
  return byId.has(themeId);
}
