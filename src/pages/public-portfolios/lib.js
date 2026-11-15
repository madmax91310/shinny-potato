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
  currency: "EUR",
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
  currency: "EUR",
  total: "",
  source: "",
  method: "Non précisée",
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
export const nameOf = (p) =>
  p.name.trim() || p.pseudo.trim() || "Fiche sans nom";
export const validEpisode = (value) =>
  /^\d{1,6}$/.test(String(value)) && Number(value) >= 1;
export const weightPct = (value) =>
  `${Number(value).toLocaleString("fr-FR", { maximumSignificantDigits: 10 })} %`;
export const pct = (value) =>
  value === "" || value == null || !Number.isFinite(Number(value))
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
  if (p.na.trim()) {
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
  if (p.value === "" || !Number.isFinite(Number(p.value)))
    out.push(`${label} : rendement manquant`);
  if (!p.verified) out.push(`${label} : contrôle de la source requis`);
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
  if (!s.currency) out.push("Devise du relevé requise");
  out.push(...performanceIssues(s, "month"), ...performanceIssues(s, "ytd"));
  if (!s.month.na && !s.ytd.na && s.month.end !== s.ytd.end)
    out.push(
      "Les performances du mois et depuis janvier doivent avoir la même date de fin",
    );
  if (!s.positions.length) out.push("Allocation manquante");
  if (
    s.positions.some(
      (x) =>
        !x.name.trim() ||
        x.weight === "" ||
        !Number.isFinite(Number(x.weight)) ||
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
  if (
    !b.verified ||
    !b.source ||
    !b.method ||
    !b.reinvested ||
    b.value === "" ||
    !Number.isFinite(Number(b.value))
  )
    return "Benchmark non vérifié ou incomplet : aucune comparaison générée.";
  if (
    s.method !== "TWR" ||
    s.dividends !== "Réinvestis" ||
    s.fees === "Non précisé" ||
    b.currency !== s.currency ||
    b.start !== s.month.start ||
    b.end !== s.month.end ||
    s.month.na
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
  return `${s.month.na ? `Un portefeuille à découvrir en ${month}.` : `${Number(s.month.value) < 0 ? "📉" : Number(s.month.value) > 0 ? "📈" : "↔️"} ${pct(s.month.value)} en ${month} : voici sa répartition 👀`}\n\n🔎 LE PORTEFEUILLE DE LA SEMAINE #${n}\n\n${nameOf(p)} — portefeuille présenté comme réel par son auteur.${p.strategy.trim() ? ` ${p.strategy.trim()}` : ""}${p.objective.trim() ? ` Objectif communiqué : ${p.objective.trim()}` : ""}\n\n📊 SES PERFORMANCES DÉCLARÉES\n• ${month} : ${s.month.na ? `Non applicable (${s.month.na})` : pct(s.month.value)}\n• Depuis janvier : ${s.ytd.na ? `Non applicable (${s.ytd.na})` : pct(s.ytd.value)}${benchmarkIssue(s) ? "" : `\n• ${s.benchmark.name} en ${month} : ${pct(s.benchmark.value)} (du ${s.benchmark.start} au ${s.benchmark.end}, ${s.currency}, dividendes réinvestis)`}\n\n🍩 SES PRINCIPAUX PLACEMENTS\n${positions
    .slice(0, 6)
    .map((x) => `• ${x.name} : ${weightPct(x.weight)}`)
    .join(
      "\n",
    )}${positions.length > 6 ? "\nDétail complet dans les images." : ""}\n\n🧐 La première ligne représente ${weightPct(positions[0].weight)} du portefeuille.\n\n💬 Et toi, quel résultat pour ton portefeuille en ${month} ?\n\n📌 Source : ${p.platform} — ${p.url}`;
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
    image: { version: 1, episode: d.episode },
  });
}
