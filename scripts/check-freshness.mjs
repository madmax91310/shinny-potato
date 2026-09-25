#!/usr/bin/env node
// Rapport de fraîcheur des données — sur le même modèle que scripts/stress-test-portfolios.mjs
// (script réutilisable, committé plutôt que recréé ad hoc en session).
//
// Committé le 14/09/2026 (demande utilisateur), en complément du travail de badges de confiance/
// horodatage de fraîcheur mené plus tôt le même jour (Calculateur, Fiches ETF) : jusqu'ici, savoir
// "quelles entrées ont une date de sourcing documentée, laquelle, depuis quand" nécessitait de
// relire chaque data.js à la main. Ce script automatise le SCAN de ce qui est déjà documenté dans
// les commentaires — il ne vérifie RIEN par lui-même (aucun appel réseau, WebFetch reste bloqué
// dans ce sandbox de toute façon) et ne modifie AUCUNE donnée. Son but : prioriser où porter
// l'effort de revérification manuelle la prochaine fois.
//
// Usage :
//   node scripts/check-freshness.mjs             → rapport lisible en console, groupé par outil
//   node scripts/check-freshness.mjs --json       → même scan, sortie JSON (stdout) pour un script tiers
//
// MÉTHODE (heuristique, pas un parseur strict) : pour chaque fichier de données, repère les lignes
// "ancres" d'entrée (id/clé nommée — le motif exact varie par fichier, cf. TOOLS ci-dessous) puis,
// pour chaque entrée, prend le texte allant de cette ancre (en remontant par-dessus tout commentaire
// et accolade ouvrante immédiatement au-dessus, pour couvrir aussi bien le cas "commentaire APRÈS
// l'accolade" que "commentaire AVANT l'ancre id:") jusqu'à l'ancre suivante. Dans ce texte, toute
// date DD/MM/AAAA est candidate ; la plus RÉCENTE trouvée (hors dates précédées de "jusqu'" —
// traitées séparément comme échéance, pas comme vérification) devient la date de fraîcheur de
// l'entrée. Limite connue : un commentaire de section partagé par plusieurs entrées consécutives
// (ex. "── Jumeaux de marque ──") est capturé par la première entrée qui suit s'il ne contient pas
// de date lui-même — sans impact pratique observé sur le roster actuel, mais à garder en tête si un
// futur commentaire de section daté produit un faux résultat sur l'entrée juste en dessous.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { LEXICON_SOURCES } from './lexicon-sources.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const SEUIL_RECENT = 60; // jours
const SEUIL_A_SURVEILLER = 180; // jours
const SEUIL_ECHEANCE_PROCHE = 30; // jours avant une échéance connue

// ── Configuration par outil ────────────────────────────────────────────────
// entryRegex doit capturer le nom/id de l'entrée dans son 1er groupe (et optionnellement un nom
// plus lisible dans le 2e, sinon le 1er sert de nom d'affichage).
const TOOLS = [
  {
    key: "calculateur",
    label: "Calculateur d'investissement",
    file: "src/pages/investment-calculator/data.js",
    entryRegex: /^ {2}([a-zA-Z0-9]+):\s*\{/,
  },
  {
    key: "portefeuilles",
    label: "Générateur de portefeuilles",
    file: "src/pages/portfolio-generator/data.js",
    entryRegex: /id:\s*"([a-z0-9_]+)",\s*name:\s*"([^"]+)"/,
  },
  {
    key: "fiches-etf",
    label: "Fiches ETF",
    file: "src/pages/etf-sheets/data.js",
    entryRegex: /^\s*id:\s*"([a-z0-9-]+)"/,
  },
  {
    key: "courtiers",
    label: "Comparatif courtiers",
    file: "src/pages/broker-comparator/data.js",
    entryRegex: /id:\s*"([a-z0-9]+)",\s*nom:\s*"([^"]+)"/,
  },
  {
    key: "lexique",
    label: "Lexique financier",
    file: "src/pages/lexique-financier/data.js",
    entryRegex: /^\{?\s*id:\s*"([a-z0-9-]+)"/,
  },
  {
    key: "duel-indices",
    label: "Duel d'indices",
    file: "src/pages/index-comparator/data.js",
    entryRegex: /^\s*id:\s*'([a-z-]+)',\s*$/,
    lookAheadLabel: /label:\s*'([^']+)'/, // le label suit sur la ligne d'après pour ce fichier
  },
  {
    key: "tweets-etf",
    label: "Tweets ETF",
    file: "src/pages/etf-tweets/data/themes.js",
    entryRegex: /createTheme\(\{\s*$/,
    lookAheadId: /id:\s*'([a-z-]+)'/,
    // Une seule date de fraîcheur documentée pour tout le fichier (commentaire d'en-tête avant
    // DEFAULT_THEMES) plutôt qu'une par thème — cf. constant FALLBACK_TO_HEADER_DATE ci-dessous.
    sharedHeaderDate: true,
  },
];

// ── Extraction des dates ────────────────────────────────────────────────────
const DATE_RE = /(\d{2})\/(\d{2})\/(\d{4})/g;
const DEADLINE_CONTEXT_RE = /jusqu['’](?:au|en)?\s*(?:au\s*)?$/i;

function parseFrDate(dd, mm, yyyy) {
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  d.setHours(0, 0, 0, 0);
  return d.getDate() === Number(dd) && d.getMonth() === Number(mm) - 1 && d.getFullYear() === Number(yyyy) ? d : null;
}

function daysBetween(a, b) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

// Retourne { mostRecent: Date|null, deadlines: [{date, daysUntil, context}] } pour un bloc de texte.
function scanDatesInText(text) {
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
      const daysUntil = daysBetween(date, TODAY);
      deadlines.push({ date: full, daysUntil, context: text.slice(Math.max(0, m.index - 40), m.index + 10).replace(/\s+/g, " ").trim() });
      continue;
    }
    // Une date de "vérification" ne devrait pas être future de plus de 60 jours (sinon ce n'est
    // probablement pas une date de sourcing mais une autre mention — garde-fou, pas un filtre dur).
    if (daysBetween(date, TODAY) < -60) continue;
    if (!mostRecent || date > mostRecent) mostRecent = date;
  }
  return { mostRecent, deadlines };
}

function classify(days) {
  if (days < SEUIL_RECENT) return "recent";
  if (days < SEUIL_A_SURVEILLER) return "surveiller";
  return "revoir";
}

// ── Scan d'un fichier ────────────────────────────────────────────────────────
function scanTool(tool) {
  const filePath = path.join(ROOT, tool.file);
  const text = readFileSync(filePath, "utf8");
  const lines = text.split("\n");

  const anchors = [];
  if (tool.sharedHeaderDate) {
    // Tweets ETF : une seule date pour tout le fichier (commentaire d'en-tête), une entrée par thème.
    for (let i = 0; i < lines.length; i++) {
      if (tool.entryRegex.test(lines[i])) {
        // Le nom du thème est sur une des lignes suivantes (id: 'xxx').
        let name = null;
        for (let j = i; j < Math.min(i + 4, lines.length); j++) {
          const idm = lines[j].match(tool.lookAheadId);
          if (idm) { name = idm[1]; break; }
        }
        if (name) anchors.push({ line: i, name });
      }
    }
    const headerText = lines.slice(0, anchors.length ? anchors[0].line : lines.length).join("\n");
    const { mostRecent, deadlines } = scanDatesInText(headerText);
    const entries = anchors.map((a) => ({ name: a.name, mostRecent, deadlines: [] }));
    return { entries, fileDeadlines: deadlines };
  }

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(tool.entryRegex);
    if (!m) continue;
    let name = m[2] || m[1];
    if (tool.lookAheadLabel) {
      for (let j = i; j < Math.min(i + 3, lines.length); j++) {
        const lm = lines[j].match(tool.lookAheadLabel);
        if (lm) { name = lm[1]; break; }
      }
    }
    anchors.push({ line: i, name });
  }

  // Découper au début du commentaire de l'entrée suivante : sinon sa date et son URL
  // sont attribuées à tort à la fiche précédente.
  const starts = anchors.map((anchor) => {
    // Remonte au-dessus de l'ancre : accolade ouvrante seule sur sa ligne, puis commentaires
    // contigus au-dessus — pour couvrir "commentaire après l'accolade" ET "commentaire avant id:".
    let start = anchor.line;
    if (start > 0 && lines[start - 1].trim() === "{") start -= 1;
    while (start > 0 && /^\s*\/\//.test(lines[start - 1])) start -= 1;
    return start;
  });

  const entries = [];
  const allDeadlines = [];
  for (let idx = 0; idx < anchors.length; idx++) {
    const anchor = anchors[idx];
    const start = starts[idx];
    const nextLine = idx + 1 < anchors.length ? starts[idx + 1] : lines.length;

    const blockText = lines.slice(start, nextLine).join("\n");
    const { mostRecent, deadlines } = scanDatesInText(blockText);
    // Indice de traçabilité seulement : une URL dans un commentaire ne prouve ni
    // que tous les chiffres de l'entrée sont exacts, ni qu'ils ont été revus récemment.
    // Les phrases du contenu utilisateur ne comptent pas comme source documentaire.
    const commentLines = blockText.split("\n").filter((line) => /^\s*\/\//.test(line));
    const sourceUrls = [...new Set([
      ...commentLines.flatMap((line) => line.match(/https?:\/\/[^\s)]+/g) || []),
      ...(tool.key === 'lexique' && LEXICON_SOURCES[anchor.name] ? [LEXICON_SOURCES[anchor.name]] : []),
    ])];
    const sourceNamed = commentLines.some((line) => /\b(?:source|sourcing)\b/i.test(line));
    // Un contrôle daté de proxy documente une simulation, pas le rendement de la part affichée.
    const proxyReview = tool.key === 'portefeuilles' && /Contrôle individuel du proxy le \d{2}\/\d{2}\/\d{4}/.test(blockText);
    entries.push({ name: anchor.name, mostRecent, deadlines, sourceUrls, sourceNamed, proxyReview });
    deadlines.forEach((d) => allDeadlines.push({ ...d, entry: anchor.name }));
  }

  return { entries, fileDeadlines: allDeadlines };
}

// ── Rapport ──────────────────────────────────────────────────────────────────
function buildReport() {
  const perTool = [];
  for (const tool of TOOLS) {
    const { entries, fileDeadlines } = scanTool(tool);
    const withDate = entries.filter((e) => e.mostRecent);
    const withoutDate = entries.filter((e) => !e.mostRecent);

    const buckets = { recent: [], surveiller: [], revoir: [] };
    withDate.forEach((e) => {
      const days = daysBetween(TODAY, e.mostRecent);
      buckets[classify(days)].push({ name: e.name, date: e.mostRecent, days });
    });
    Object.values(buckets).forEach((b) => b.sort((a, b2) => b2.days - a.days));

    perTool.push({
      key: tool.key,
      label: tool.label,
      file: tool.file,
      total: entries.length,
      proxyReviews: entries.filter((e) => e.proxyReview && e.mostRecent).map((e) => e.name),
      buckets,
      nonTracable: withoutDate.map((e) => e.name),
      undatedInventory: withoutDate.map((e) => ({
        name: e.name,
        reviewedAt: null,
        status: e.sourceUrls.length ? "source_url_documented_without_date"
          : e.sourceNamed ? "source_named_without_url_or_date" : "source_and_date_missing",
        sourceNamed: e.sourceNamed,
        sourceUrls: e.sourceUrls,
      })),
      deadlines: fileDeadlines,
    });
  }
  return perTool;
}

function printConsoleReport(report) {
  console.log("Rapport de fraîcheur des données — " + TODAY.toLocaleDateString("fr-FR") + "\n");
  console.log(`Seuils : 🟢 récent < ${SEUIL_RECENT}j · 🟡 à surveiller ${SEUIL_RECENT}-${SEUIL_A_SURVEILLER}j · 🔴 à revérifier > ${SEUIL_A_SURVEILLER}j\n`);

  let totalEntries = 0;
  let totalRecent = 0;
  let totalSurveiller = 0;
  let totalRevoir = 0;
  let totalNonTracable = 0;
  const allDeadlinesSoon = [];

  for (const t of report) {
    totalEntries += t.total;
    totalRecent += t.buckets.recent.length;
    totalSurveiller += t.buckets.surveiller.length;
    totalRevoir += t.buckets.revoir.length;
    totalNonTracable += t.nonTracable.length;

    console.log(`━━ ${t.label} (${t.file}) — ${t.total} entrée(s) ━━`);
    console.log(`  🟢 récent : ${t.buckets.recent.length}   🟡 à surveiller : ${t.buckets.surveiller.length}   🔴 à revérifier : ${t.buckets.revoir.length}   ⬜ sans date : ${t.nonTracable.length}`);
    if (t.proxyReviews.length) console.log(`  Proxies contrôlés (pas les performances du produit) : ${t.proxyReviews.join(', ')}`);

    if (t.buckets.revoir.length) {
      console.log("  🔴 À revérifier en priorité :");
      t.buckets.revoir.forEach((e) => console.log(`     - ${e.name} — ${e.date.toLocaleDateString("fr-FR")} (${e.days}j)`));
    }
    if (t.buckets.surveiller.length) {
      console.log("  🟡 À surveiller :");
      t.buckets.surveiller.forEach((e) => console.log(`     - ${e.name} — ${e.date.toLocaleDateString("fr-FR")} (${e.days}j)`));
    }
    if (t.nonTracable.length) {
      console.log(`  ⬜ Sans date de contrôle propre à l'entrée : ${t.nonTracable.join(", ")}`);
    }

    t.deadlines.forEach((d) => {
      const soon = d.daysUntil >= 0 && d.daysUntil <= SEUIL_ECHEANCE_PROCHE;
      if (soon) allDeadlinesSoon.push({ tool: t.label, ...d });
      const marker = d.daysUntil < 0 ? "⚫ ÉCHUE" : soon ? "🔶 PROCHE" : "📅";
      console.log(`  ${marker} Échéance détectée (${d.entry ?? "fichier"}) : ${d.date} (${d.daysUntil >= 0 ? "dans " + d.daysUntil + "j" : Math.abs(d.daysUntil) + "j passée"}) — "${d.context}"`);
    });

    console.log("");
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`TOTAL : ${totalEntries} entrées — 🟢 ${totalRecent}  🟡 ${totalSurveiller}  🔴 ${totalRevoir}  ⬜ ${totalNonTracable} sans date individuelle`);
  if (allDeadlinesSoon.length) {
    console.log(`\n⚠️  ${allDeadlinesSoon.length} échéance(s) à moins de ${SEUIL_ECHEANCE_PROCHE} jours :`);
    allDeadlinesSoon.forEach((d) => console.log(`   - [${d.tool}] ${d.entry ?? "fichier"} : ${d.date} (dans ${d.daysUntil}j)`));
  }
  console.log("\nCe rapport ne vérifie rien par lui-même — il priorise où porter l'effort de revérification");
  console.log("manuelle (méthode WebSearch double-passe habituelle, cf. CLAUDE.md).");
}

const args = process.argv.slice(2);
const report = buildReport();

if (args.includes("--missing-json")) {
  // Inventaire complet des entrées sans date, uniquement pour la revue interne.
  console.log(JSON.stringify(report.flatMap((tool) =>
    tool.undatedInventory.map((entry) => ({ tool: tool.key, file: tool.file, ...entry }))
  ), null, 2));
} else if (args.includes("--json")) {
  console.log(JSON.stringify(report, (k, v) => (v instanceof Date ? v.toISOString() : v), 2));
} else if (args.includes("--priorities")) {
  console.log(`Revue éditoriale et données — ${TODAY.toLocaleDateString('fr-FR')}`);
  for (const tool of report) {
    const expired = tool.deadlines.filter(d => d.daysUntil < 0);
    const outdated = tool.buckets.revoir;
    if (!expired.length && !outdated.length && !tool.nonTracable.length) continue;
    console.log(`${tool.label} : ${expired.length} échéance(s) échue(s), ${outdated.length} entrée(s) à revérifier, ${tool.nonTracable.length} sans date de vérification.`);
    expired.forEach(d => console.log(`  Échéance : ${d.entry ?? 'fichier'} (${d.date})`));
    outdated.slice(0, 10).forEach(e => console.log(`  Ancienne source : ${e.name} (${e.date.toLocaleDateString('fr-FR')})`));
    if (tool.nonTracable.length) {
      const missingSource = tool.undatedInventory.filter(e => e.status === 'source_and_date_missing');
      const namedSource = tool.undatedInventory.filter(e => e.status === 'source_named_without_url_or_date');
      const linkedSource = tool.undatedInventory.filter(e => e.status === 'source_url_documented_without_date');
      console.log(`  Inventaire interne : ${missingSource.length} sans source ni date, ${namedSource.length} avec source nommée sans URL ni date, ${linkedSource.length} avec URL sans date.`);
      if (missingSource.length) console.log(`  À documenter en premier : ${missingSource.slice(0, 10).map(e => e.name).join(', ')}${missingSource.length > 10 ? '…' : ''}`);
    }
  }
  console.log('Une date de commentaire ne prouve pas la justesse d’une donnée : vérifier les documents de l’émetteur avant de mettre à jour.');
} else {
  printConsoleReport(report);
}
