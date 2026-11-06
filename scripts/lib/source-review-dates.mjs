// Individual review dates and explicit publication deadlines stay distinct.
const DATE_RE = /(\d{2})\/(\d{2})\/(\d{4})/g;
const DEADLINE_CONTEXT_RE = /jusqu['’](?:au|en)?\s*(?:au\s*)?$/i;

function parseFrDate(dd, mm, yyyy) {
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  d.setHours(0, 0, 0, 0);
  return d.getDate() === Number(dd) && d.getMonth() === Number(mm) - 1 && d.getFullYear() === Number(yyyy) ? d : null;
}

function daysBetween(a, b) { return Math.round((a.getTime() - b.getTime()) / 86400000); }

// Retourne { mostRecent: Date|null, deadlines: [{date, daysUntil, context}] } pour un bloc de texte.
export function scanReviewDates(text, today) {
  let mostRecent = null;
  const deadlines = [];
  let m;
  DATE_RE.lastIndex = 0;
  while ((m = DATE_RE.exec(text))) {
    const [full, dd, mm, yyyy] = m;
    const before = text.slice(Math.max(0, m.index - 12), m.index);
    const lineBefore = text.slice(text.lastIndexOf('\n', m.index - 1) + 1, m.index);
    // Les chronologies dans les commentaires (anciens frais « jusqu'au ») ne sont
    // pas des promotions encore actives : ne signaler que les échéances du contenu.
    const isDeadline = !/^\s*\/\//.test(lineBefore) && DEADLINE_CONTEXT_RE.test(before);
    const date = parseFrDate(dd, mm, yyyy);
    if (!date) continue;
    if (isDeadline) {
      const daysUntil = daysBetween(date, today);
      deadlines.push({ date: full, daysUntil, context: text.slice(Math.max(0, m.index - 40), m.index + 10).replace(/\s+/g, " ").trim() });
      continue;
    }
    // Une date de "vérification" ne devrait pas être future de plus de 60 jours (sinon ce n'est
    // probablement pas une date de sourcing mais une autre mention — garde-fou, pas un filtre dur).
    if (daysBetween(date, today) > 60) continue;
    if (!mostRecent || date > mostRecent) mostRecent = date;
  }
  return { mostRecent, deadlines };
}

