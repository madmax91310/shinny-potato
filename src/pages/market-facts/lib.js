// Un récit : accroche, déroulement, fin. Pas de question ou de morale imposée.
// Les sources restent consultables dans les précisions de la fiche.

export function buildTweetText(fact) {
  const lines = [
    fact.hook,
    "",
    fact.context,
    "",
    ...(fact.twist ? [fact.twist, ""] : []),
    ...(fact.methodNote ? ["", fact.methodNote] : []),
    ...(fact.question ? ["", fact.question] : []),
  ];
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
