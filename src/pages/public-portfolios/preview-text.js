import {
  buildText,
  hasText,
  issues,
  lastCompletedMonthEnd,
  nameOf,
  performanceIssues,
  pct,
  editorialWeight,
  collectedPerformance,
} from "./lib.js";

// Preview missing/unqualified returns as missing, never as zero or a claim.
export function previewPerformance(snapshot, key) {
  const collected = collectedPerformance(snapshot,key);
  if (collected && performanceIssues(snapshot,key).length)
    return `${collected.approximate ? "≈ " : ""}${pct(collected.value)} (collecté, à confirmer)`;
  if (performanceIssues(snapshot, key).length)
    return "À renseigner et vérifier";
  return hasText(snapshot[key].na)
    ? `Non applicable (${snapshot[key].na})`
    : pct(snapshot[key].value);
}

export function buildPreviewText(profile, snapshot, episode = 1) {
  if (!issues(profile, snapshot).length)
    return buildText(profile, snapshot, episode);
  const end = lastCompletedMonthEnd(snapshot.consulted);
  const month = end
    ? new Date(end + "T12:00:00Z").toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Dernier mois civil terminé";
  const positions = [...snapshot.positions].sort(
    (a, b) => Number(b.weight) - Number(a.weight),
  );
  return `BROUILLON — À COMPLÉTER AVANT EXPORT\n\n🔎 LE PORTEFEUILLE DE LA SEMAINE #${episode}\n\n${nameOf(profile)}${hasText(profile.strategy) ? ` — ${profile.strategy.trim()}` : ""}${hasText(profile.objective) ? `\nObjectif communiqué : ${profile.objective.trim()}` : ""}\n\n📊 SES PERFORMANCES\n• ${month} : ${previewPerformance(snapshot, "month")}\n• Depuis janvier : ${previewPerformance(snapshot, "ytd")}\n\n🍩 SES PRINCIPAUX PLACEMENTS\n${
    positions.length
      ? positions
          .slice(0, 5)
          .map(
            (row) =>
              `• ${row.name || "Placement à renseigner"} : ${editorialWeight(row.weight)}`,
          )
          .join("\n")
      : "Allocation à compléter."
  }\n\n📌 Source : ${profile.platform} — ${profile.url || "Lien à renseigner"}`;
}
