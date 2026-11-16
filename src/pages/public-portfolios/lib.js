import {
  localToday,
  validPublicationDate as validDate,
} from "../../lib/publication-date.js";
export const id = () => crypto.randomUUID();
export const today = localToday;
export const blankProfile = () => ({
  id: id(),
  url: "",
  platform: "Getquin",
  pseudo: "",
  name: "",
  strategy: "",
  objective: "",
  currency: "",
  started: "",
  amount: "",
  notes: "",
  evidence: "",
  nature: "Nature non confirmée",
  status: "À examiner",
  checked: "",
  snapshots: [],
  publications: [],
  draft: null,
});
export const blankSnapshot = () => ({
  id: id(),
  consulted: today(),
  effective: "",
  currency: "",
  total: "",
  source: "",
  method: "Non précisée",
  methodNote: "",
  dividends: "Non précisé",
  fees: "Non précisé",
  positions: [],
  month: {
    value: "",
    start: "",
    end: "",
    original: "",
    kind: "Cumulée",
    verified: false,
    na: "",
  },
  ytd: {
    value: "",
    start: "",
    end: "",
    original: "",
    kind: "Cumulée",
    verified: false,
    na: "",
  },
  year: {
    value: "",
    start: "",
    end: "",
    original: "",
    kind: "Cumulée",
    verified: false,
    na: "",
  },
  benchmark: {
    name: "MSCI World",
    currency: "EUR",
    source: "",
    method: "",
    start: "",
    end: "",
    value: "",
    reinvested: false,
    verified: false,
  },
});
export function canonicalUrl(value) {
  try {
    const u = new URL(value);
    if (!["https:", "http:"].includes(u.protocol)) return "";
    if (!u.hash.startsWith("#/") && !u.hash.startsWith("#!")) u.hash = "";
    for (const key of [...u.searchParams.keys()])
      if (/^utm_|^(fbclid|gclid)$/i.test(key)) u.searchParams.delete(key);
    u.searchParams.sort();
    return u.origin + u.pathname.replace(/\/+$/, "") + u.search + u.hash;
  } catch {
    return "";
  }
}
// A shared dashboard keeps its identity across language, tracking and anchor variants.
export function sourceKey(url) {
  const value = canonicalUrl(url);
  const match = value.match(/^https:\/\/app\.getquin\.com\/(?:[a-z]{2}\/)?dashboard\/([a-zA-Z0-9]+)(?:[?#].*)?$/);
  return match ? `getquin:${match[1]}` : value;
}
export const hasText = (value) =>
  typeof value === "string" && value.trim() !== "";
export const nameOf = (p) =>
  p.name.trim() || p.pseudo.trim() || "Fiche sans nom";
const hasNumericValue = (value) =>
  (typeof value === "number" ||
    (typeof value === "string" && value.trim() !== "")) &&
  Number.isFinite(Number(value));
export const validEpisode = (value) =>
  /^\d{1,6}$/.test(String(value)) && Number(value) >= 1;
export const weightPct = (value) =>
  hasNumericValue(value)
    ? `${Number(value).toLocaleString("fr-FR", { maximumSignificantDigits: 10 })} %`
    : "Non renseigné";
export const pct = (value) =>
  !hasNumericValue(value)
    ? "Non renseignée"
    : `${Number(value) > 0 ? "+" : ""}${weightPct(value)}`;
export const latestPublicationDate = (p) =>
  p.publications.reduce((date, h) => (h.date > date ? h.date : date), "");
export const latestVerificationDate = (p, s) =>
  validDate(s.consulted) && s.consulted <= today() && canonicalUrl(s.source)
    ? [p.checked, s.consulted].sort().at(-1)
    : p.checked;
export function lastCompletedMonthEnd(consulted) {
  return validDate(consulted)
    ? new Date(
        Date.UTC(
          Number(consulted.slice(0, 4)),
          Number(consulted.slice(5, 7)) - 1,
          0,
        ),
      )
        .toISOString()
        .slice(0, 10)
    : "";
}
export function performanceIssues(s, key) {
  const p = s[key],
    label = key === "month" ? "Mois" : "Depuis janvier",
    out = [];
  if (hasText(p.na)) {
    if (!p.verified)
      out.push(`${label} : motif de non-applicabilité à vérifier`);
    const expected = lastCompletedMonthEnd(s.consulted);
    if (
      key === "month" &&
      ((p.start && p.start !== expected.slice(0, 7) + "-01") ||
        (p.end && p.end !== expected))
    )
      out.push("Mois non applicable : préciser le dernier mois civil terminé");
    return out;
  }
  if (!hasNumericValue(p.value)) out.push(`${label} : rendement manquant`);
  if (!p.verified) out.push(`${label} : contrôle de la source requis`);
  if (!canonicalUrl(s.source)) out.push(`${label} : lien justificatif requis`);
  if (!["TWR", "TRI/IRR", "Autre"].includes(s.method) || (s.method === "Autre" && !hasText(s.methodNote)))
    out.push(`${label} : méthode de calcul à documenter sur la source`);
  if (!["Réinvestis", "Exclus", "Autre"].includes(s.dividends) || !["Inclus", "Exclus", "Autre"].includes(s.fees)
      || ((s.dividends === "Autre" || s.fees === "Autre") && !hasText(s.methodNote)))
    out.push(`${label} : traitement des dividendes et frais à documenter`);
  if (
    p.kind !== "Cumulée" ||
    /annual|growth rate|taux de croissance|rolling|30 (days|jours)|glissant/i.test(
      p.original,
    )
  )
    out.push(
      `${label} : libellé annualisé ou période ambiguë, ne pas reprendre ce chiffre`,
    );
  if (!p.original.trim()) out.push(`${label} : libellé original requis`);
  if (!validDate(p.start) || !validDate(p.end) || p.start > p.end)
    out.push(`${label} : dates exactes requises`);
  else {
    const end = new Date(p.end + "T12:00:00Z"),
      last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0))
        .toISOString()
        .slice(0, 10);
    if (
      key === "month" &&
      (p.start !== p.end.slice(0, 7) + "-01" ||
        p.end !== last ||
        p.end !== lastCompletedMonthEnd(s.consulted))
    )
      out.push(
        "Mois : choisir le dernier mois civil terminé à la consultation",
      );
    if (key === "ytd" && p.start !== p.end.slice(0, 4) + "-01-01")
      out.push(
        "Depuis janvier : début au 1er janvier requis, sinon expliquer la non-applicabilité",
      );
  }
  return out;
}
export function issues(p, s) {
  const out = [];
  if (p.nature !== "Réel déclaré par son auteur")
    out.push(
      "Confirmer que le portefeuille est présenté comme réel par son auteur",
    );
  if (!p.pseudo.trim() && !p.name.trim())
    out.push("Nom public ou pseudo requis");
  if (!canonicalUrl(p.url)) out.push("URL publique valide requise");
  if (!s) return [...out, "Enregistrer un relevé daté"];
  if (
    !validDate(s.consulted) ||
    s.consulted > today() ||
    !canonicalUrl(s.source)
  )
    out.push("Date de consultation et lien justificatif du relevé requis");
  if (nameOf(p).length > 160 || s.positions.some((x) => x.name.length > 200))
    out.push(
      "Nom trop long pour une image lisible (profil : 160, placement : 200 caractères maximum)",
    );
  if (s.effective && (!validDate(s.effective) || s.effective > s.consulted))
    out.push("Date effective invalide ou postérieure à la consultation");
  if (!hasText(s.currency)) out.push("Devise du relevé requise");
  out.push(...performanceIssues(s, "month"), ...performanceIssues(s, "ytd"));
  if (!hasText(s.month.na) && !hasText(s.ytd.na) && s.month.end !== s.ytd.end)
    out.push(
      "Les performances du mois et depuis janvier doivent avoir la même date de fin",
    );
  if (!s.positions.length) out.push("Allocation manquante");
  if (
    s.positions.some(
      (x) =>
        !x.name.trim() ||
        !hasNumericValue(x.weight) ||
        Number(x.weight) < 0 ||
        Number(x.weight) > 100,
    )
  )
    out.push("Noms et poids entre 0 et 100 requis pour chaque position");
  const sum = s.positions.reduce((n, x) => n + Number(x.weight || 0), 0);
  if (Math.abs(sum - 100) > 0.1)
    out.push(
      `Allocation : ${sum.toLocaleString("fr-FR")} % ; compléter ou corriger sans renormaliser`,
    );
  return out;
}
export function benchmarkIssue(s) {
  const b = s.benchmark;
  const currency = hasText(s.currency) ? s.currency.trim().toUpperCase() : "";
  const benchmarkCurrency = hasText(b.currency)
    ? b.currency.trim().toUpperCase()
    : "";
  if (
    !b.verified ||
    !hasText(b.name) ||
    !hasText(b.source) ||
    !hasText(b.method) ||
    !b.reinvested ||
    !hasNumericValue(b.value)
  )
    return "Benchmark non vérifié ou incomplet : aucune comparaison générée.";
  if (
    s.method !== "TWR" ||
    s.dividends !== "Réinvestis" ||
    s.fees === "Non précisé" ||
    !/^[A-Z]{3}$/.test(currency) ||
    currency === "XXX" ||
    benchmarkCurrency !== currency ||
    b.start !== s.month.start ||
    b.end !== s.month.end ||
    hasText(s.month.na)
  )
    return "Méthode, devise, dividendes ou dates incompatibles : aucune comparaison générée.";
  return "";
}
export function buildText(p, s, n) {
  if (issues(p, s).length)
    throw new Error("Compléter les contrôles avant préparation");
  const monthEnd = s.month.end || lastCompletedMonthEnd(s.consulted),
    month = monthEnd
      ? new Date(monthEnd + "T12:00:00Z").toLocaleDateString("fr-FR", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        })
      : "la période",
    positions = [...s.positions].sort(
      (a, b) => Number(b.weight) - Number(a.weight),
    );
  return `${hasText(s.month.na) ? `Un portefeuille à découvrir en ${month}.` : `${Number(s.month.value) < 0 ? "📉" : Number(s.month.value) > 0 ? "📈" : "↔️"} ${pct(s.month.value)} en ${month} : voici sa répartition 👀`}\n\n🔎 LE PORTEFEUILLE DE LA SEMAINE #${n}\n\n${nameOf(p)} — portefeuille présenté comme réel par son auteur.${p.strategy.trim() ? ` ${p.strategy.trim()}` : ""}${p.objective.trim() ? ` Objectif communiqué : ${p.objective.trim()}` : ""}\n\n📊 SES PERFORMANCES DÉCLARÉES (${s.currency.trim()})\n• ${month} : ${hasText(s.month.na) ? `Non applicable (${s.month.na})` : pct(s.month.value)}\n• Depuis janvier : ${hasText(s.ytd.na) ? `Non applicable (${s.ytd.na})` : pct(s.ytd.value)}${benchmarkIssue(s) ? "" : `\n• ${s.benchmark.name} en ${month} : ${pct(s.benchmark.value)} (du ${s.benchmark.start} au ${s.benchmark.end}, ${s.currency}, dividendes réinvestis)`}\n\n🍩 SES PRINCIPAUX PLACEMENTS\n${positions
    .slice(0, 6)
    .map((x) => `• ${x.name} : ${weightPct(x.weight)}`)
    .join(
      "\n",
    )}${positions.length > 6 ? "\nDétail complet dans les images." : ""}\n${s.effective ? `Répartition au ${s.effective}.` : `Répartition consultée le ${s.consulted} ; date effective non fournie.`}\n\n🧐 La première ligne représente ${weightPct(positions[0].weight)} du portefeuille.\n\n💬 Et toi, quel résultat pour ton portefeuille en ${month} ?\n\n📌 Source : ${p.platform} — ${p.url}`;
}
export function publication(p, s, d, date, url) {
  if (
    !validDate(date) ||
    date > today() ||
    issues(p, s).length ||
    d.snapshotId !== s.id ||
    !d.text.trim() ||
    /undefined|\{[^}]+\}/.test(d.text) ||
    !validEpisode(d.episode) ||
    (url && !canonicalUrl(url))
  )
    throw new Error("Relevé, texte, numéro d’épisode ou URL du post invalide");
  return structuredClone({
    id: id(),
    date,
    url,
    episode: d.episode,
    text: d.text,
    profile: { ...p, publications: [], draft: null },
    snapshot: s,
    image: { version: 2, episode: d.episode },
  });
}
