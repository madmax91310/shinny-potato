import {
  buildText,
  hasText,
  issues,
  lastCompletedMonthEnd,
  nameOf,
  performanceIssues,
  pct,
  weightPct,
} from "./lib.js";

// Preview missing/unqualified returns as missing, never as zero or a claim.
export function previewPerformance(snapshot, key) {
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
          .slice(0, 6)
          .map(
            (row) =>
              `• ${row.name || "Placement à renseigner"} : ${weightPct(row.weight)}`,
          )
          .join("\n")
      : "Allocation à compléter."
  }\n\nL’accroche et la question finale seront générées après vérification des performances.\n\n📌 Source : ${profile.platform} — ${profile.url || "Lien à renseigner"}`;
}

// Copy the exact allocation/provenance; dates are suggestions to confirm.
export function performanceCompletion(snapshot) {
  const next = structuredClone(snapshot);
  next.id = crypto.randomUUID();
  const end = lastCompletedMonthEnd(next.consulted);
  if (end) {
    for (const key of ["month", "ytd"]) {
      if (!performanceIssues(next, key).length) continue;
      if (!next[key].start || !next[key].end) {
        next[key].start ||=
          (key === "month" ? end.slice(0, 7) : end.slice(0, 4)) +
          (key === "month" ? "-01" : "-01-01");
        next[key].end ||= end;
        next[key].verified = false;
      }
    }
  }
  return next;
}
