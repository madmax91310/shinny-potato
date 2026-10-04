// Le fait et son périmètre d'abord, puis sa portée et une question liée au sujet.
// Les sources restent consultables dans les précisions de la fiche.

export function buildTweetText(fact) {
  const lines = [
    fact.hook,
    "",
    fact.context,
    "",
    ...(fact.twist ? [fact.twist, ""] : []),
    ...(fact.methodNote ? ["", `📌 ${fact.methodNote}`] : []),
    ...(fact.question ? ["", fact.question] : []),
  ];
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
