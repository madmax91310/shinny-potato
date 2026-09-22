// Génération du texte du tweet "le saviez-vous" — fonction pure, testable sans React.

export function buildTweetText(fact) {
  const lines = [
    "📚 Le saviez-vous ?",
    "",
    fact.fact,
    "",
    `📊 ${fact.indices.join(" · ")}`,
    `🔎 Source : ${fact.source}`,
  ];
  if (fact.note) lines.push(`ℹ️ ${fact.note}`);
  lines.push("");
  lines.push("⚠️ Contenu historique à titre pédagogique, pas un conseil en investissement.");
  return lines.join("\n");
}
