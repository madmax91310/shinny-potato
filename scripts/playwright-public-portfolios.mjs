import initialFeed from "../src/pages/public-portfolios/initial-feed.json" with { type: "json" };
import { FEED_URL, CATALOGUE_REVISION } from "../src/pages/public-portfolios/refresh.js";
import { choose } from "./card-selection.mjs";
import { expect } from "playwright/test";
import { chromium } from "playwright";
import assert from "node:assert/strict";
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
if (!remote) await page.route(FEED_URL + '**', route => route.fulfill({ json: initialFeed }));
await page.goto(base);
await page.locator('.workspace-tool-card[href$="/portefeuilles-publics"]').click();
await page.getByRole("button", { name: "Ajouter un portefeuille" }).waitFor();
assert.equal(await page.locator('.pp article').count(), 30, 'The reserve starts with thirty researched public profiles');
// No refresh click: opening the tool must load the shared database automatically.
await expect(page.getByRole('status')).toContainText('nouveau(x) relevé(s)', { timeout: 25000 });
await expect(page.getByRole('button', { name: 'Actualiser tous les portefeuilles', exact: true })).toBeEnabled();
const initialLibrary = await page.evaluate(() => JSON.parse(localStorage.getItem('el-public-portfolios-v1')));
assert.equal(initialLibrary.catalogueRevision, CATALOGUE_REVISION);
assert(initialLibrary.profiles.every(profile => profile.snapshots.length > 0));
assert(initialLibrary.feedLoadedAt);
assert(initialLibrary.profiles.every(profile => !profile.acquisition.error));
if (!remote) await page.unroute(FEED_URL + '**');
const transportFeed = structuredClone(initialFeed);
const browserStamp = new Date(Date.now() + 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
transportFeed.collectedAt = browserStamp;
transportFeed.entries.forEach((entry, index) => {
  entry.attemptedAt = browserStamp;
  if (entry.observation) {
    entry.lastSuccessAt = browserStamp;
    entry.observation.id = (index + 1).toString(16).padStart(64, '0');
    entry.observation.collectedAt = browserStamp;
    entry.observation.note = 'TEST FICTIF du transport, uniquement dans ce navigateur éphémère.';
  }
});
await page.route(FEED_URL + '**', route => route.fulfill({ json: transportFeed }));
const libraryBeforeRefresh = await page.evaluate(() => JSON.parse(localStorage.getItem('el-public-portfolios-v1')));
await page.getByRole('button', { name: 'Actualiser tous les portefeuilles', exact: true }).click();
await expect(page.getByRole('status')).toContainText('nouveau(x) relevé(s)');
const libraryAfterRefresh = await page.evaluate(() => JSON.parse(localStorage.getItem('el-public-portfolios-v1')));
assert.equal(libraryAfterRefresh.profiles.length, 30);
for (const profile of libraryAfterRefresh.profiles) {
  const old = libraryBeforeRefresh.profiles.find(row => row.id === profile.id);
  assert.equal(profile.snapshots.length, old.snapshots.length + 1);
  assert.equal(profile.snapshots.at(-1).month.value, '');
  assert.equal(profile.snapshots.at(-1).month.verified, false);
  assert.equal(profile.checked, old.checked);
}
await page.getByRole('button', { name: 'Actualiser tous les portefeuilles', exact: true }).click();
await expect(page.getByRole('status')).toContainText('0 nouveau(x)');
await page.unroute(FEED_URL + '**');
const failedFeed = structuredClone(transportFeed);
failedFeed.collectedAt = new Date(Date.now() + 2000).toISOString().replace(/\.\d{3}Z$/, 'Z');
failedFeed.entries[0].attemptedAt = failedFeed.collectedAt;
failedFeed.entries[0].error = 'TEST FICTIF : source indisponible ; dernier relevé conservé.';
await page.route(FEED_URL + '**', route => route.fulfill({ json: failedFeed }));
await page.getByRole('button', { name: 'Actualiser tous les portefeuilles', exact: true }).click();
await expect(page.getByRole('status')).toContainText('1 source(s) en échec');
await expect(page.getByRole('alert')).toContainText('TEST FICTIF : source indisponible');
await page.getByRole('button', { name: 'Actualiser tous les portefeuilles', exact: true }).click();
await expect(page.getByRole('status')).toContainText('1 source(s) en échec');
const libraryAfterFailure = await page.evaluate(() => JSON.parse(localStorage.getItem('el-public-portfolios-v1')));
assert.deepEqual(libraryAfterFailure.profiles[0].snapshots, libraryAfterRefresh.profiles[0].snapshots);
assert.equal(libraryAfterFailure.profiles[0].acquisition.lastSuccessAt, libraryAfterRefresh.profiles[0].acquisition.lastSuccessAt);
await page.unroute(FEED_URL + '**');
await page.route(FEED_URL + '**', route => route.fulfill({ status: 503, body: 'TEST failure' }));
await page.getByRole('button', { name: 'Actualiser tous les portefeuilles', exact: true }).click();
await expect(page.getByRole('status')).toContainText('Derniers relevés conservés');
assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('el-public-portfolios-v1'))), libraryAfterFailure);
await page.unroute(FEED_URL + '**');
for (const width of [390, 320]) {
  await page.setViewportSize({ width, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'The real seeded reserve must fit mobile widths');
}
await page.screenshot({ path: '/tmp/public-portfolio-reserve-mobile.png' });
await page.setViewportSize({ width: 1440, height: 1000 });
await page.screenshot({ path: '/tmp/public-portfolio-reserve-desktop.png' });
await page.locator('.pp article').first().getByRole('button', { name: 'Ouvrir / modifier' }).click();
await expect(page.getByRole('button', { name: 'Préparer / régénérer le tweet' })).toBeDisabled();
assert.match(await page.getByRole('link', { name: 'Ouvrir la source', exact: true }).getAttribute('href'), /^https:\/\/app\.getquin\.com\/en\/dashboard\//);
await page.reload();
await page.getByRole("button", { name: "Ajouter un portefeuille" }).click();
await expect(
  page.getByRole("button", { name: "Sauvegarder", exact: true }),
).toBeInViewport();
await page.getByLabel("URL du portefeuille", { exact: true }).fill("https://");
await page.getByRole('button', { name: 'Actualiser tous les portefeuilles', exact: true }).click();
await expect(page.getByRole('status')).toContainText('Sauvegarde la fiche');
assert.equal(await page.getByLabel('URL du portefeuille', { exact: true }).inputValue(), 'https://');
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
await page.locator("article").filter({ hasText: "Fiche sans nom" }).getByRole("button", { name: "Ouvrir / modifier" }).click();
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
Object.assign(s, { consulted: "2026-11-15", source: p.url, currency: "EUR" });
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
  (p) =>
    localStorage.setItem(
      "el-public-portfolios-v1",
      JSON.stringify({ version: 1, catalogueRevision: 2, profiles: [p] }),
    ),
  p,
);
await page.reload();
await page.getByRole("button", { name: "Ouvrir / modifier" }).click();
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
for (const route of ["le-dca-de", "le-budget-de", "banque-tweets"]) {
  await page.goto(base + "" + route);
  await page.locator("h1").first().waitFor({ timeout: 60000 });
}
assert.deepEqual(errors, []);
await browser.close();
console.log(
  "Navigateur : sauvegarde/rechargement, modification, copie, PNG, historique, mobile et routes DCA/Budget/tweets validés.",
);
