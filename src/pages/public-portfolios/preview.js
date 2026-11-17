import { performanceIssues, lastCompletedMonthEnd } from "./lib.js";
export { buildPreviewText, previewPerformance } from "./preview-text.js";

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
