import initialFeed from "../src/pages/public-portfolios/initial-feed.json" with { type: "json" };
import { FEED_URL, CATALOGUE_REVISION, sourceSnapshot, catalogue } from "../src/pages/public-portfolios/refresh.js";
import { choose } from "./card-selection.mjs";
import { expect } from "playwright/test";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import {
  blankProfile,
  blankSnapshot,
} from "../src/pages/public-portfolios/lib.js";
import { staticBrowser, staticBase } from "./static-browser.mjs";
const remote = !!process.env.BASE_URL;
const harness = remote ? null : await staticBrowser(1440);
const browser =
  harness?.browser ||
  (await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] }
      : {}),
  }));
const context =
  harness?.context || (await browser.newContext({ acceptDownloads: true }));
await context.grantPermissions(["clipboard-read", "clipboard-write"]);
let page = harness?.page || (await context.newPage());
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = process.env.BASE_URL || staticBase;
if (!remote)
  await page.route(FEED_URL + "**", (route) =>
    route.fulfill({ json: initialFeed }),
  );
await page.goto(base);
await page
  .locator('.workspace-tool-card[href$="/portefeuilles-publics"]')
  .click();
await page.getByRole("button", { name: "Ajouter un portefeuille" }).waitFor();
assert.equal(
  await page.locator(".pp article").count(),
  catalogue.length,
  "The reserve starts with researched public profiles including the public eToro reader",
);
// No refresh click: opening the tool must load the shared database automatically.
await expect(page.getByRole("status")).toContainText("nouveau(x) relevé(s)", {
  timeout: 25000,
});
await expect(
  page.getByRole("button", {
    name: "Actualiser tous les portefeuilles",
    exact: true,
  }),
).toBeEnabled();
const expectedCollected = catalogue.filter(profile=>profile.platform==='eToro').length;
await expect(page.getByText(`${expectedCollected} portefeuilles avec rendements du mois et depuis janvier collectés, à contrôler dans leur fiche.`,{exact:true})).toBeVisible();
await choose(page.getByRole('group',{name:'Plateforme',exact:true}),'eToro');
await expect(page.locator('.pp article')).toHaveCount(expectedCollected);
await choose(page.getByRole('group',{name:'Plateforme',exact:true}),'');
await expect(page.locator('.pp article')).toHaveCount(catalogue.length);
const initialLibrary = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("el-public-portfolios-v1")),
);
assert.equal(initialLibrary.catalogueRevision, CATALOGUE_REVISION);
assert(
  initialLibrary.profiles.every((profile) => profile.snapshots.length > 0),
);
assert(initialLibrary.feedLoadedAt);
assert(initialLibrary.profiles.every((profile) => !profile.acquisition.error));
if (!remote) await page.unroute(FEED_URL + "**");
const transportFeed = structuredClone(initialFeed);
const browserStamp = new Date(Date.now() + 1000)
  .toISOString()
  .replace(/\.\d{3}Z$/, "Z");
transportFeed.collectedAt = browserStamp;
transportFeed.entries.forEach((entry, index) => {
  entry.attemptedAt = browserStamp;
  if (entry.observation) {
    entry.lastSuccessAt = browserStamp;
    entry.observation.id = (index + 1).toString(16).padStart(64, "0");
    if (!entry.observation.performances) entry.observation.collectedAt = browserStamp;
    entry.observation.note =
      "TEST FICTIF du transport, uniquement dans ce navigateur éphémère.";
  }
});
await page.route(FEED_URL + "**", (route) =>
  route.fulfill({ json: transportFeed }),
);
const libraryBeforeRefresh = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("el-public-portfolios-v1")),
);
await page
  .getByRole("button", {
    name: "Actualiser tous les portefeuilles",
    exact: true,
  })
  .click();
await expect(page.getByRole("status")).toContainText("nouveau(x) relevé(s)");
const libraryAfterRefresh = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("el-public-portfolios-v1")),
);
assert.equal(libraryAfterRefresh.profiles.length, catalogue.length);
for (const profile of libraryAfterRefresh.profiles) {
  const old = libraryBeforeRefresh.profiles.find(
    (row) => row.id === profile.id,
  );
  assert.equal(profile.snapshots.length, old.snapshots.length + 1);
  const expectedSnapshot=sourceSnapshot(transportFeed.entries.find(entry=>entry.catalogueId===profile.catalogueId).observation);
  assert.equal(profile.snapshots.at(-1).month.value, expectedSnapshot.month.value);
  assert.equal(profile.snapshots.at(-1).ytd.value, expectedSnapshot.ytd.value);
  assert.equal(profile.snapshots.at(-1).month.verified, false);
  assert.equal(profile.checked, old.checked);
}
await page
  .getByRole("button", {
    name: "Actualiser tous les portefeuilles",
    exact: true,
  })
  .click();
await expect(page.getByRole("status")).toContainText("0 nouveau(x)");
await page.unroute(FEED_URL + "**");
const failedFeed = structuredClone(transportFeed);
failedFeed.collectedAt = new Date(Date.now() + 2000)
  .toISOString()
  .replace(/\.\d{3}Z$/, "Z");
failedFeed.entries[0].attemptedAt = failedFeed.collectedAt;
failedFeed.entries[0].error =
  "TEST FICTIF : source indisponible ; dernier relevé conservé.";
await page.route(FEED_URL + "**", (route) =>
  route.fulfill({ json: failedFeed }),
);
await page
  .getByRole("button", {
    name: "Actualiser tous les portefeuilles",
    exact: true,
  })
  .click();
await expect(page.getByRole("status")).toContainText("1 source(s) en échec");
await expect(page.getByRole("alert")).toContainText(
  "TEST FICTIF : source indisponible",
);
await page
  .getByRole("button", {
    name: "Actualiser tous les portefeuilles",
    exact: true,
  })
  .click();
await expect(page.getByRole("status")).toContainText("1 source(s) en échec");
const libraryAfterFailure = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("el-public-portfolios-v1")),
);
assert.deepEqual(
  libraryAfterFailure.profiles[0].snapshots,
  libraryAfterRefresh.profiles[0].snapshots,
);
assert.equal(
  libraryAfterFailure.profiles[0].acquisition.lastSuccessAt,
  libraryAfterRefresh.profiles[0].acquisition.lastSuccessAt,
);
await page.unroute(FEED_URL + "**");
await page.route(FEED_URL + "**", (route) =>
  route.fulfill({ status: 503, body: "TEST failure" }),
);
await page
  .getByRole("button", {
    name: "Actualiser tous les portefeuilles",
    exact: true,
  })
  .click();
await expect(page.getByRole("status")).toContainText(
  "Derniers relevés conservés",
);
assert.deepEqual(
  await page.evaluate(() =>
    JSON.parse(localStorage.getItem("el-public-portfolios-v1")),
  ),
  libraryAfterFailure,
);
await page.unroute(FEED_URL + "**");
for (const width of [390, 320]) {
  await page.setViewportSize({ width, height: 844 });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "The real seeded reserve must fit mobile widths",
  );
}
await page.screenshot({ path: "/tmp/public-portfolio-reserve-mobile.png" });
await page.setViewportSize({ width: 1440, height: 1000 });
await page.screenshot({ path: "/tmp/public-portfolio-reserve-desktop.png" });
await page
  .locator(".pp article")
  .first()
  .getByRole("button", { name: "Préparer texte et images" })
  .click();
await expect(
  page.getByRole("button", { name: "Préparer / régénérer le tweet" }),
).toBeDisabled();
assert.match(
  await page
    .getByRole("link", { name: "Ouvrir la source", exact: true })
    .getAttribute("href"),
  /^https:\/\/app\.getquin\.com\/en\/dashboard\//,
);
// Exercise the actual preloaded profile, not a pre-qualified synthetic draft.
const sourcePreview = page.getByRole("region", {
  name: "Aperçu avant vérification",
});
await expect(page.getByLabel("Aperçu du texte à compléter")).toContainText(
  "BROUILLON",
);
await expect(sourcePreview.locator("canvas").first()).toBeVisible();
assert.equal(
  await page.getByRole("button", { name: /Télécharger image/ }).count(),
  0,
);
assert.equal(
  await page
    .getByRole("button", { name: "Copier le texte", exact: true })
    .count(),
  0,
);
await sourcePreview
  .locator("canvas")
  .first()
  .screenshot({ path: "/tmp/pp-incomplete-preview.png" });
assert(!/\d,\d{3,}/.test(await page.getByLabel("Aperçu du texte à compléter").innerText()), "Editorial weights do not expose machine precision");
writeFileSync('/tmp/pp-real-editorial-preview.png', Buffer.from(await sourcePreview.locator('canvas').first().evaluate(canvas => canvas.toDataURL('image/png').split(',')[1]), 'base64'));
await page.setViewportSize({width:390,height:844});
assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "The editorial preview fits mobile");
await sourcePreview.screenshot({path:'/tmp/pp-editorial-preview-mobile.png'});
await page.setViewportSize({width:1440,height:1000});
await page.getByRole('button',{name:'Voir le profil eToro avec rendements collectés',exact:true}).click();
await expect(page.getByLabel('Aperçu du texte à compléter')).toContainText('collecté, à confirmer');
await expect(page.getByLabel('Aperçu du texte à compléter')).toContainText('≈');
await expect(page.getByRole('button',{name:'Préparer / régénérer le tweet',exact:true})).toBeDisabled();
assert.equal(await page.getByRole('button',{name:'Copier le texte',exact:true}).count(),0);
writeFileSync('/tmp/pp-etoro-editorial-preview.png',Buffer.from(await sourcePreview.locator('canvas').first().evaluate(canvas=>canvas.toDataURL('image/png').split(',')[1]),'base64'));
await page.getByRole('button',{name:'Compléter les performances',exact:true}).click();
const liveEtoro=initialLibrary.profiles.find(profile=>profile.catalogueId==='etoro-jaynemesis').snapshots.at(-1);
assert.equal(await page.getByRole('group',{name:'Dernier mois civil terminé',exact:true}).getByLabel('Rendement (%)',{exact:true}).inputValue(),String(liveEtoro.month.value));
assert.equal(await page.getByRole('group',{name:'Depuis janvier',exact:true}).getByLabel('Rendement (%)',{exact:true}).inputValue(),String(liveEtoro.ytd.value));
await expect(page.getByRole('button',{name:'Enregistrer et préparer le post',exact:true})).toBeDisabled();
// Synthetic returns stay in an explicitly fictitious, ephemeral browser profile.
const reserveBackup = await page.evaluate(() =>
  localStorage.getItem("el-public-portfolios-v1"),
);
const completionProfile = blankProfile();
Object.assign(completionProfile, {
  pseudo: "TEST FICTIF — parcours de complétion",
  url: "https://example.com/test-completion",
  nature: "Réel déclaré par son auteur",
});
const incompleteSnapshot = blankSnapshot();
Object.assign(incompleteSnapshot, {
  consulted: "2026-11-15",
  currency: "EUR",
  source: completionProfile.url,
  positions: [{ name: "Placement fictif", weight: 100 }],
});
completionProfile.snapshots = [incompleteSnapshot];
await page.evaluate(
  ({profile,revision}) => localStorage.setItem("el-public-portfolios-v1",JSON.stringify({version:1,catalogueRevision:revision,profiles:[profile]})),
  {profile:completionProfile,revision:CATALOGUE_REVISION},
);
await page.reload();
await page
  .getByRole("button", { name: "Préparer texte et images", exact: true })
  .click();
await page
  .getByRole("button", { name: "Compléter les performances", exact: true })
  .click();
const civilMonth = page.getByRole("group", {
  name: "Dernier mois civil terminé",
  exact: true,
});
const yearToDate = page.getByRole("group", {
  name: "Depuis janvier",
  exact: true,
});
assert.equal(
  await civilMonth.getByLabel("Du", { exact: true }).inputValue(),
  "2026-10-01",
);
assert.equal(
  await civilMonth.getByLabel("Au", { exact: true }).inputValue(),
  "2026-10-31",
);
assert.equal(
  await yearToDate.getByLabel("Du", { exact: true }).inputValue(),
  "2026-01-01",
);
const saveAndPrepare = page.getByRole("button", {
  name: "Enregistrer et préparer le post",
  exact: true,
});
await expect(saveAndPrepare).toBeDisabled();
await civilMonth.getByLabel("Rendement (%)", { exact: true }).fill("-2.45");
await civilMonth
  .getByLabel("Libellé original", { exact: true })
  .fill("TEST FICTIF : October return");
await yearToDate.getByLabel("Rendement (%)", { exact: true }).fill("0");
await yearToDate
  .getByLabel("Libellé original", { exact: true })
  .fill("TEST FICTIF : YTD cumulative return");
await expect(saveAndPrepare).toBeDisabled();
await choose(page.getByRole('group',{name:'Méthode',exact:true}), 'TWR');
await choose(page.getByRole('group',{name:'Dividendes',exact:true}), 'Réinvestis');
await choose(page.getByRole('group',{name:'Frais',exact:true}), 'Inclus');
await civilMonth.getByRole("checkbox").check();
await yearToDate.getByRole("checkbox").check();
await expect(saveAndPrepare).toBeEnabled();
await yearToDate
  .getByLabel("Libellé original", { exact: true })
  .fill("Annual return since Jan 2026");
await yearToDate.getByRole("checkbox").check();
await expect(saveAndPrepare).toBeDisabled();
await yearToDate
  .getByLabel("Libellé original", { exact: true })
  .fill("TEST FICTIF : YTD cumulative return");
await yearToDate.getByRole("checkbox").check();
await page.setViewportSize({ width: 390, height: 844 });
assert(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  "Completion form fits mobile",
);
await civilMonth.scrollIntoViewIfNeeded();
await page.screenshot({ path: "/tmp/pp-completion-mobile.png" });
await saveAndPrepare.click();
await expect(page.getByLabel("Texte final éditable")).toHaveValue(/-2,45 %/);
await expect(page.getByLabel("Texte final éditable")).toContainText(
  "Depuis janvier : 0 %",
);
assert.equal(
  await page.getByRole("region", { name: "Aperçu avant vérification" }).count(),
  0,
);
await page
  .getByRole("button", { name: "Copier le texte", exact: true })
  .click();
assert.match(
  await page.evaluate(() => navigator.clipboard.readText()),
  /-2,45 %/,
);
const completedDownload = page.waitForEvent("download");
await page
  .getByRole("button", { name: "Télécharger image 1", exact: true })
  .click();
await (await completedDownload).saveAs("/tmp/pp-completion-export.png");
await page
  .getByRole("button", { name: "Marquer comme publié", exact: true })
  .click();
const completed = await page.evaluate(
  () => JSON.parse(localStorage.getItem("el-public-portfolios-v1")).profiles[0],
);
assert.equal(completed.snapshots.length, 2);
assert.equal(completed.snapshots[0].month.value, "");
assert.equal(completed.publications[0].snapshot.month.value, "-2.45");
assert.equal(completed.publications[0].snapshot.ytd.value, "0");
assert.equal(completed.publications[0].image.version, 3);
await page.reload();
await page
  .getByRole("button", { name: "Ouvrir / modifier", exact: true })
  .click();
await page.getByRole("button", { name: /Épisode #1/ }).click();
await expect(
  page.getByRole("heading", { name: "Publication conservée #1" }),
).toBeVisible();
await page.evaluate(
  (raw) => localStorage.setItem("el-public-portfolios-v1", raw),
  reserveBackup,
);
await page.setViewportSize({ width: 1440, height: 1000 });
await page.reload();
await page.getByRole("button", { name: "Ajouter un portefeuille" }).click();
await expect(
  page.getByRole("button", { name: "Sauvegarder", exact: true }),
).toBeInViewport();
await page.getByLabel("URL du portefeuille", { exact: true }).fill("https://");
await page
  .getByRole("button", {
    name: "Actualiser tous les portefeuilles",
    exact: true,
  })
  .click();
await expect(page.getByRole("status")).toContainText("Sauvegarde la fiche");
assert.equal(
  await page.getByLabel("URL du portefeuille", { exact: true }).inputValue(),
  "https://",
);
assert.equal(
  await page
    .getByRole("group", { name: "Statut éditorial", exact: true })
    .locator('[data-option][data-value="Publié"]')
    .count(),
  0,
);
await page.getByRole("button", { name: "Sauvegarder", exact: true }).click();
await page.close();
page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(base + "portefeuilles-publics");
await page
  .locator("article")
  .filter({ hasText: "Fiche sans nom" })
  .getByRole("button", { name: "Ouvrir / modifier" })
  .click();
assert.equal(
  await page.getByLabel("URL du portefeuille", { exact: true }).inputValue(),
  "https://",
);
await page.getByLabel("Pseudo", { exact: true }).fill("TEST FICTIF navigateur");
await page.getByRole("button", { name: "Sauvegarder", exact: true }).click();
await page.reload();
await page.getByRole("heading", { name: "TEST FICTIF navigateur" }).waitFor();
const p = blankProfile();
Object.assign(p, {
  pseudo: "TEST FICTIF navigateur",
  url: "https://example.com/test",
  nature: "Réel déclaré par son auteur",
});
const s = blankSnapshot();
Object.assign(s, { consulted: "2026-11-15", source: p.url, currency: "EUR", method: "TWR", dividends: "Réinvestis", fees: "Inclus" });
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
  original: "YTD return",
  verified: true,
});
s.positions = Array.from({ length: 10 }, (_, i) => ({
  name: `Placement fictif ${i + 1} avec un nom suffisamment long pour tester sa lisibilité et le passage sur plusieurs lignes`,
  weight: 10,
}));
const newer = structuredClone(s);
newer.id = crypto.randomUUID();
newer.month.value = 9;
p.snapshots = [s, newer];
await page.evaluate(
  ({profile,revision}) => localStorage.setItem("el-public-portfolios-v1",JSON.stringify({version:1,catalogueRevision:revision,profiles:[profile]})),
  {profile:p,revision:CATALOGUE_REVISION},
);
await page.reload();
await page
  .getByRole("button", { name: "Préparer texte et images", exact: true })
  .click();
await expect(page.getByLabel("Texte final éditable")).toHaveValue(/SEMAINE #1/);
await expect(
  page.getByRole("button", { name: "Télécharger image 1", exact: true }),
).toBeVisible();
await choose(
  page.getByRole("group", { name: "Relevé à préparer", exact: true }),
  s.id,
);
await page
  .getByRole("button", { name: "Préparer / régénérer le tweet" })
  .click();
await page.getByRole("button", { name: "Sauvegarder le brouillon" }).click();
await page.reload();
await page.getByRole("button", { name: "Ouvrir / modifier" }).click();
assert.equal(
  await page
    .getByRole("group", { name: "Relevé à préparer", exact: true })
    .getAttribute("data-value"),
  s.id,
);
await page.getByLabel("Numéro d’épisode", { exact: true }).fill("");
assert(
  await page.getByRole("button", { name: "Copier le texte" }).isDisabled(),
);
await page.getByLabel("Numéro d’épisode", { exact: true }).fill("1");
assert.match(await page.locator("textarea").inputValue(), /SEMAINE #1/);
await page.getByRole("button", { name: "Copier le texte" }).click();
assert.match(
  await page.evaluate(() => navigator.clipboard.readText()),
  /-2,45/,
);
const download = page.waitForEvent("download");
await page
  .getByRole("button", { name: "Télécharger image 1", exact: true })
  .click();
const d = await download;
await d.saveAs("/tmp/public-portfolio-export.png");
const archiveDownload = page.waitForEvent("download");
await page
  .getByRole("button", {
    name: "Télécharger toutes les images (ZIP)",
    exact: true,
  })
  .click();
await (await archiveDownload).saveAs("/tmp/public-portfolio-images.zip");
const downloadedPixels = await page.locator('canvas').first().evaluate(canvas => canvas.toDataURL('image/png').split(',')[1]);
assert.equal(readFileSync('/tmp/public-portfolio-export.png').toString('base64'), downloadedPixels, 'Downloaded PNG matches the preview pixels');
execFileSync('python3', ['-c', `import zipfile,struct
with zipfile.ZipFile('/tmp/public-portfolio-images.zip') as archive:
 assert archive.testzip() is None
 assert archive.namelist() and len(archive.namelist()) == len(set(archive.namelist()))
 for name in archive.namelist():
  data=archive.read(name)
  assert data[:8] == b'\\x89PNG\\r\\n\\x1a\\n'
  assert struct.unpack('>II',data[16:24]) == (1080,1350)
 assert archive.read(archive.namelist()[0]) == open('/tmp/public-portfolio-export.png','rb').read()
print('PNG/ZIP: preview parity, dimensions and CRC verified')`], {stdio:'inherit'});
assert.deepEqual(
  await page
    .locator("canvas")
    .first()
    .evaluate((c) => [c.width, c.height]),
  [1080, 1350],
);
await page
  .locator("canvas")
  .first()
  .screenshot({ path: "/tmp/public-portfolio-desktop.png" });
await page.getByRole("button", { name: "Marquer comme publié" }).click();
await page.reload();
await page.getByRole("button", { name: "Ouvrir / modifier" }).click();
await page
  .getByRole("button", { name: "Ajouter un relevé", exact: true })
  .click();
await page.getByRole("button", { name: "Enregistrer ce relevé" }).click();
await page
  .getByRole("button", { name: "Signaler un échec de consultation" })
  .click();
const stored = await page.evaluate(
  () => JSON.parse(localStorage.getItem("el-public-portfolios-v1")).profiles[0],
);
assert.equal(stored.snapshots.length, 3);
assert.equal(stored.publications[0].snapshot.month.value, -2.45);
assert(stored.lastFailure);
await page.getByRole("button", { name: /Épisode #1/ }).click();
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: "/tmp/public-portfolio-mobile.png",
  fullPage: true,
});
assert(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await page.getByRole("button", { name: "Ajouter un portefeuille" }).click();
await expect(
  page.getByRole("button", { name: "Sauvegarder", exact: true }),
).toBeInViewport();
// Regression through real UI/storage: a legacy A -> B -> A must show the latest A.
const sourceEntry = initialFeed.entries[0];
const legacySnapshot = sourceSnapshot(sourceEntry.observation);
legacySnapshot.id = `collected:${sourceEntry.observation.id}`;
delete legacySnapshot.acquisition.observationId;
const recurrenceProfile = { ...blankProfile(), pseudo: 'TEST FICTIF récurrence',
  url: sourceEntry.source, catalogueId: sourceEntry.catalogueId, snapshots: [legacySnapshot],
  acquisition: { attemptedAt: sourceEntry.attemptedAt } };
await page.evaluate(({profile,revision}) => localStorage.setItem('el-public-portfolios-v1', JSON.stringify({version:1,catalogueRevision:revision,profiles:[profile]})), {profile:recurrenceProfile,revision:CATALOGUE_REVISION});
const occurrenceFeed = (observation, offset) => {
  const result = structuredClone(initialFeed);
  const stamp = new Date(Date.now() + offset).toISOString().replace(/\.\d{3}Z$/, 'Z');
  result.collectedAt = stamp;
  Object.assign(result.entries[0], { attemptedAt:stamp, lastSuccessAt:stamp, observation:{...observation,collectedAt:stamp} });
  return result;
};
const middleObservation = structuredClone(sourceEntry.observation);
middleObservation.id = 'b'.repeat(64);
middleObservation.positions[0].weight += 0.001;
middleObservation.positions[1].weight -= 0.001;
let currentOccurrence = occurrenceFeed(middleObservation, 5000);
await page.route(FEED_URL + '**', route => route.fulfill({json:currentOccurrence}));
await page.reload();
await expect(page.getByRole('status')).toContainText('1 nouveau(x)');
currentOccurrence = occurrenceFeed(sourceEntry.observation, 10000);
await page.getByRole('button', {name:'Actualiser tous les portefeuilles',exact:true}).click();
await expect(page.getByRole('status')).toContainText('1 nouveau(x)');
const recurrenceDb = await page.evaluate(() => JSON.parse(localStorage.getItem('el-public-portfolios-v1')));
assert.equal(recurrenceDb.profiles[0].snapshots.length, 3);
assert.deepEqual(recurrenceDb.profiles[0].snapshots.at(-1).positions, sourceEntry.observation.positions);
await page.getByRole('button', {name:'Actualiser tous les portefeuilles',exact:true}).click();
await expect(page.getByRole('status')).toContainText('0 nouveau(x)');
await page.getByRole('button', {name:'Ajouter un portefeuille',exact:true}).click();
await page.getByLabel('URL du portefeuille',{exact:true}).fill(sourceEntry.source.replace('/en/','/de/') + '?utm_source=test');
await page.getByLabel('Pseudo',{exact:true}).fill('TEST FICTIF doublon linguistique');
await page.getByRole('button',{name:'Sauvegarder',exact:true}).click();
await expect(page.getByRole('status')).toContainText('Ce lien est déjà enregistré');
assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('el-public-portfolios-v1')).profiles.length),1);
await page.unroute(FEED_URL + '**');
// Render the same 30-position fixture through the frozen v1 reference and current renderer.
const oldRenderer = readFileSync('scripts/fixtures/public-portfolio-images-v1.txt', 'utf8');
const currentRenderer = readFileSync('src/pages/public-portfolios/images.js', 'utf8');
const pixelResult = await page.evaluate(({oldRenderer,currentRenderer,p,s}) => {
  const hasText = value => typeof value === 'string' && value.trim() !== '';
  const weightPct = value => `${Number(value).toLocaleString('fr-FR',{maximumSignificantDigits:10})} %`;
  const pct = value => `${Number(value)>0?'+':''}${weightPct(value)}`;
  const create = source => new Function('nameOf','hasText','pct','benchmarkIssue','weightPct','lastCompletedMonthEnd', source.replace(/import\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["'];/, '').replace('export function renderImages','function renderImages') + ';return renderImages;')(
    profile => profile.name.trim() || profile.pseudo.trim(), hasText,pct,()=>'not comparable',weightPct,()=> '2026-10-31');
  s.positions = Array.from({length:30},(_,i)=>({name:'TEST FICTIF placement '+i+(i===1?' avec un libellé suffisamment long pour contrôler le retour à la ligne':''),weight:i===29?0.000011:(100-0.000011)/29}));
  const a=create(oldRenderer)(p,s,1), b=create(currentRenderer)(p,s,1,{version:1}), c=create(currentRenderer)(p,s,1,{version:2});
  return {pages:a.length,legacyIdentical:a.every((canvas,i)=>canvas.toDataURL()===b[i].toDataURL()),newDatesVisible:c[0].toDataURL()!==b[0].toDataURL()};
}, {oldRenderer,currentRenderer,p,s});
assert(pixelResult.legacyIdentical, 'Historical v1 PNG pixels remain identical');
assert(pixelResult.newDatesVisible, 'The current renderer distinguishes allocation dates');
mkdirSync('test-artifacts/public-portfolios',{recursive:true});
for(const file of ['public-portfolio-export.png','public-portfolio-images.zip','public-portfolio-desktop.png','public-portfolio-mobile.png','public-portfolio-reserve-mobile.png','public-portfolio-reserve-desktop.png'])
  copyFileSync('/tmp/'+file,'test-artifacts/public-portfolios/'+file);
writeFileSync('test-artifacts/public-portfolios/pixel-regression.json',JSON.stringify(pixelResult,null,2)+'\n');
for (const route of ["le-dca-de", "le-budget-de", "banque-tweets"]) {
  await page.goto(base + "" + route);
  await page.locator("h1").first().waitFor({ timeout: 60000 });
}
assert.deepEqual(errors, []);
await browser.close();
console.log(
  "Navigateur : sauvegarde/rechargement, modification, copie, PNG, historique, mobile et routes DCA/Budget/tweets validés.",
);
