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
await page.goto(base + "portefeuilles-publics");
await page.getByRole("button", { name: "Ajouter un portefeuille" }).waitFor();
await page.getByRole("button", { name: "Ajouter un portefeuille" }).click();
await page.getByLabel("URL du portefeuille", { exact: true }).fill("https://");
await page.getByRole("button", { name: "Sauvegarder", exact: true }).click();
await page.close();
page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(base + "portefeuilles-publics");
await page.getByRole("button", { name: "Ouvrir / modifier" }).click();
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
Object.assign(s, { consulted: "2026-11-15", source: p.url });
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
      JSON.stringify({ version: 1, profiles: [p] }),
    ),
  p,
);
await page.reload();
await page.getByRole("button", { name: "Ouvrir / modifier" }).click();
await page.getByLabel("Relevé à préparer").selectOption(s.id);
await page
  .getByRole("button", { name: "Préparer / régénérer le tweet" })
  .click();
await page.getByRole("button", { name: "Sauvegarder le brouillon" }).click();
await page.reload();
await page.getByRole("button", { name: "Ouvrir / modifier" }).click();
assert.equal(await page.getByLabel("Relevé à préparer").inputValue(), s.id);
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
for (const route of ["le-dca-de", "le-budget-de", "banque-tweets"]) {
  await page.goto(base + "" + route);
  await page.locator("h1").first().waitFor({ timeout: 60000 });
}
assert.deepEqual(errors, []);
await browser.close();
console.log(
  "Navigateur : sauvegarde/rechargement, modification, copie, PNG, historique, mobile et routes DCA/Budget/tweets validés.",
);
