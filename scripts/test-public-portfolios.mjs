import {HOME_TOOLS,TOOL_GROUPS} from "../src/tools.js";
import assert from "node:assert/strict";
import {
  blankProfile,
  validEpisode,
  weightPct,
  nameOf,
  latestPublicationDate,
  latestVerificationDate,
  lastCompletedMonthEnd,
  blankSnapshot,
  issues,
  buildText,
  publication,
  pct,
  canonicalUrl,
  benchmarkIssue,
} from "../src/pages/public-portfolios/lib.js";
import { load, save } from "../src/pages/public-portfolios/storage.js";
const bytes = new Map();
globalThis.localStorage = {
  getItem: (k) => bytes.get(k) ?? null,
  setItem: (k, v) => bytes.set(k, v),
};
let db = load();
const p = blankProfile();
assert(save({ ...db, profiles: [p] }));
assert.equal(load().profiles[0].url, "");
p.pseudo = "TEST FICTIF";
p.url = "https://example.com/test";
p.nature = "Réel déclaré par son auteur";
const s = blankSnapshot();
s.consulted = "2026-11-15";
s.currency = "EUR";
s.source = p.url;
s.positions = [{ name: "Placement fictif", weight: 100 }];
Object.assign(s.month, {
  value: -2.45,
  start: "2026-10-01",
  end: "2026-10-31",
  original: "October return",
  verified: true,
});
Object.assign(s.ytd, {
  value: 0,
  start: "2026-01-01",
  end: "2026-10-31",
  original: "YTD cumulative",
  verified: true,
});
assert.deepEqual(issues(p, s), []);
assert.equal(pct(0), "0 %");
assert.equal(pct(""), "Non renseignée");
assert.match(buildText(p, s, 2), /-2,45/);
for (const original of [
  "Annual return since Jan 2026",
  "30 days return",
  "rolling return",
]) {
  const bad = structuredClone(s);
  bad.ytd.original = original;
  assert(issues(p, bad).length);
}
const rolling = structuredClone(s);
rolling.month.start = "2026-10-02";
assert(issues(p, rolling).length);
const missing = structuredClone(s);
missing.month.value = "";
assert(issues(p, missing).length);
const incomplete = structuredClone(s);
incomplete.positions[0].weight = 80;
assert(issues(p, incomplete).some((x) => x.includes("80")));
const virtual = { ...p, nature: "Démonstration / virtuel" };
assert(issues(virtual, s).length);
const published = publication(
  p,
  s,
  { episode: 2, text: buildText(p, s, 2), snapshotId: s.id },
  "2026-11-15",
  "",
);
s.month.value = 40;
assert.equal(published.snapshot.month.value, -2.45);
assert.equal(published.profile.publications.length, 0);
p.snapshots = [s, structuredClone(s)];
p.publications = [published];
db = { version: 1, profiles: [p] };
assert(save(db));
assert.equal(load().profiles[0].snapshots.length, 2);
assert.equal(load().profiles[0].publications[0].snapshot.month.value, -2.45);
bytes.set("el-public-portfolios-v1", "changed elsewhere");
assert.equal(save(db), false);
assert.equal(canonicalUrl("javascript:alert(1)"), "");
assert(benchmarkIssue(s));
console.log(
  "Portefeuilles publics : stockage, conflits, périodes ambiguës, zéros, pertes, allocation et historique vérifiés.",
);
const validBenchmark = structuredClone(s);
validBenchmark.method = "TWR";
validBenchmark.dividends = "Réinvestis";
validBenchmark.fees = "Inclus";
Object.assign(validBenchmark.benchmark, {
  verified: true,
  source: "https://example.com/index-method",
  method: "Total return",
  reinvested: true,
  value: 1,
  currency: "EUR",
  start: s.month.start,
  end: s.month.end,
});
assert.equal(benchmarkIssue(validBenchmark), "");
assert.match(buildText(p, validBenchmark, 1), /MSCI World en octobre 2026/);
assert.match(buildText(p, validBenchmark, 1), /du 2026-10-01 au 2026-10-31/);
validBenchmark.benchmark.currency = "USD";
assert(benchmarkIssue(validBenchmark));
bytes.set(
  "el-public-portfolios-v1",
  JSON.stringify({ version: 1, profiles: [{}] }),
);
assert(load().error);
assert.equal(save(db), false);
assert.equal(
  JSON.parse(bytes.get("el-public-portfolios-v1")).profiles.length,
  1,
);

assert.equal(
  canonicalUrl("https://example.com/profile/?utm_source=x"),
  canonicalUrl("https://example.com/profile"),
);
assert.notEqual(
  canonicalUrl("https://example.com/?portfolio=a"),
  canonicalUrl("https://example.com/?portfolio=b"),
);

assert.throws(
  () =>
    publication(
      p,
      s,
      { episode: 2, text: "Texte final", snapshotId: "another-snapshot" },
      "2026-11-15",
      "",
    ),
  /Relevé/,
);

assert(!validEpisode(""));
assert(!validEpisode(0));
assert(!validEpisode("1e3"));
assert(validEpisode(25));
assert.equal(pct(-0.00001), "-0,00001 %");
assert.equal(weightPct(0.00001), "0,00001 %");
assert.equal(pct("invalide"), "Non renseignée");
assert.equal(nameOf({ ...p, name: "   " }), "TEST FICTIF");
assert.equal(
  latestPublicationDate({
    publications: [{ date: "2026-11-10" }, { date: "2026-10-10" }],
  }),
  "2026-11-10",
);
assert.equal(
  latestVerificationDate(
    { ...p, checked: "2026-11-10" },
    { consulted: "2026-10-10", source: p.url },
  ),
  "2026-11-10",
);
assert.equal(
  latestVerificationDate(
    { ...p, checked: "2026-11-10" },
    { consulted: "2026-11-15", source: "" },
  ),
  "2026-11-10",
);
assert.equal(lastCompletedMonthEnd("2026-01-15"), "2025-12-31");
assert.equal(lastCompletedMonthEnd("2024-03-15"), "2024-02-29");
const outdated = structuredClone(s);
outdated.month.start = "2026-09-01";
outdated.month.end = "2026-09-30";
assert(issues(p, outdated).some((x) => x.includes("dernier mois")));
const zero = structuredClone(s);
zero.month.value = 0;
assert(buildText(p, zero, 1).startsWith("↔️"));
const noMonth = structuredClone(s);
Object.assign(noMonth.month, {
  value: "",
  start: "",
  end: "",
  na: "Créé en cours de mois",
  verified: true,
});
assert.match(
  buildText({ ...p, name: " ", objective: " " }, noMonth, 1),
  /octobre 2026/,
);
assert(
  !buildText({ ...p, objective: " " }, noMonth, 1).includes(
    "Objectif communiqué",
  ),
);

for (const value of [null, undefined, " ", false, NaN]) {
  const missing = structuredClone(s);
  missing.month.value = value;
  assert(issues(p, missing).some((x) => x.includes("rendement manquant")));
  assert.equal(pct(value), "Non renseignée");
  const allocation = structuredClone(s);
  allocation.positions[0].weight = value;
  assert(issues(p, allocation).some((x) => x.includes("Noms et poids")));
  const benchmark = structuredClone(validBenchmark);
  benchmark.benchmark.currency = "EUR";
  benchmark.benchmark.value = value;
  assert(benchmarkIssue(benchmark));
}

for (const field of ["name", "source", "method"]) {
  const incomplete = structuredClone(validBenchmark);
  incomplete.benchmark.currency = "EUR";
  incomplete.benchmark[field] = " ";
  assert(benchmarkIssue(incomplete));
}
const unknownCurrency = structuredClone(validBenchmark);
unknownCurrency.currency = "Non précisée";
unknownCurrency.benchmark.currency = "Non précisée";
assert(benchmarkIssue(unknownCurrency));
const whitespaceNa = structuredClone(s);
whitespaceNa.month.na = " ";
whitespaceNa.ytd.na = " ";
assert.deepEqual(issues(p, whitespaceNa), []);
assert(!buildText(p, whitespaceNa, 1).includes("Non applicable"));
assert.equal(blankProfile().currency, "");
assert.equal(blankSnapshot().currency, "");

assert.equal(HOME_TOOLS.filter(tool=>tool.to==="/portefeuilles-publics").length,1);assert.equal(TOOL_GROUPS.flatMap(group=>group.tools).filter(tool=>tool.to==="/portefeuilles-publics").length,1);
