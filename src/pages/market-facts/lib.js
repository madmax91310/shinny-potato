// Génération du texte du tweet "le saviez-vous" — fonction pure, testable sans React.

export function buildTweetText(fact) {
  const lines = [
    fact.hook,
    "",
    fact.context,
    "",
    ...(fact.twist ? [fact.twist, ""] : []),
    `📌 ${fact.source}`,
    "",
    fact.question,
  ];
  return lines.join("\n");
}
