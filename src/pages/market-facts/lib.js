// Une ouverture, un fait, ce qu'il raconte, puis une question liée au sujet.
// La source reste dans le texte copié, à la fin pour ne pas couper le récit.

export function buildTweetText(fact) {
  const lines = [
    fact.hook,
    "",
    fact.context,
    "",
    ...(fact.twist ? [fact.twist, ""] : []),
    fact.question,
    "",
    `Source : ${fact.source}`,
  ];
  return lines.join("\n");
}
