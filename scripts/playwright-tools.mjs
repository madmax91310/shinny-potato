#!/usr/bin/env node
import { ETFS } from '../src/data/etf-cards.js';
// Tests Playwright par outil — navigateur réel (Chromium), un "write→look once" formalisé en
// script réutilisable plutôt que refait à la main à chaque changement. Committé le 14/09/2026
// (audit "outils", documenté comme "à committer" dans scripts/README.md).
//
// Usage : npm run build && node scripts/playwright-tools.mjs   (ou npm run test:tools, qui
// enchaîne le build automatiquement)
//
// Lance son propre `vite preview` sur le port 4310 (au-delà des ports habituels de session
// manuelle, 4173-4177, pour ne jamais entrer en conflit avec un serveur déjà lancé à la main),
// exerce une interaction réelle par outil (pas seulement "la page charge sans erreur"), puis
// arrête le serveur — y compris si un test échoue (cf. finally).
//
// Playwright est une dépendance du projet. Installer Chromium avec
// `npx playwright install chromium` avant le premier lancement local ; la CI installe
// également ses dépendances système. Un chemin explicite reste possible via
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH si le navigateur est fourni par l'hôte.
//
// Sort avec le code 1 si un test échoue (utilisable comme porte de CI).

import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import { DUELS } from "../src/pages/portfolio-duels/data.js";
import { formatIndexConstituents } from "../src/data/index-facts.js";
import { SHEETS } from "../src/data/index-factsheets.js";
import { CASES } from "../src/pages/concrete-cases/data.js";

const PORT = 4310;
const BASE = `http://localhost:${PORT}/shinny-potato`;

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch {}
      if (Date.now() - start > timeoutMs) return reject(new Error(`Serveur non prêt après ${timeoutMs}ms`));
      setTimeout(tick, 300);
    };
    tick();
  });
}

const results = [];
function record(tool, ok, detail) {
  results.push({ tool, ok, detail });
  console.log(`  [${ok ? "OK" : "ÉCHEC"}] ${tool}${detail ? " — " + detail : ""}`);
}

async function testCalculateur(page) {
  await page.goto(`${BASE}/calculateur-investissement`, { waitUntil: "networkidle" });
  await page.locator("select.ic-control").first().selectOption("bitcoin");
  await page.waitForTimeout(150);
  const hero = await page.locator(".ic-hero-number").innerText();
  const heroOk = /\d/.test(hero);
  const priceContextOk = /Série en USD : \d+ points présents dans le code sur \d+ mois/.test(await page.locator('.ic-method-note').innerText());

  const imageButton = page.getByRole('button', { name: '📊 Télécharger une image' });
  await imageButton.click();
  const monthlyPreview = page.getByRole('dialog', { name: 'Aperçu de l’image du placement' });
  const monthlyImage = (await monthlyPreview.locator('img').getAttribute('src'))?.startsWith('data:image/png;base64,');
  const [monthlyDownload] = await Promise.all([
    page.waitForEvent('download'),
    monthlyPreview.getByRole('link', { name: '⬇️ Télécharger le PNG' }).click(),
  ]);
  await monthlyPreview.getByRole('button', { name: 'Fermer l’aperçu' }).click();

  await page.locator("select.ic-control").first().selectOption('ethereum');
  await imageButton.click();
  const annualPreview = page.getByRole('dialog', { name: 'Aperçu de l’image du placement' });
  const annualImage = (await annualPreview.locator('img').getAttribute('src'))?.startsWith('data:image/png;base64,');
  const [annualDownload] = await Promise.all([
    page.waitForEvent('download'),
    annualPreview.getByRole('link', { name: '⬇️ Télécharger le PNG' }).click(),
  ]);
  await annualPreview.getByRole('button', { name: 'Fermer l’aperçu' }).click();

  await page.locator("select.ic-control").first().selectOption("lvmh");
  await page.waitForTimeout(150);
  const text = await page.locator("body").innerText();
  const badgeOk = /non vérifiées avant/.test(text);
  const dcaBlockOk = /DCA non disponible pour LVMH/.test(text);

  const imagesOk = monthlyImage && annualImage && monthlyDownload.suggestedFilename() === 'investissement-bitcoin-lump.png' && annualDownload.suggestedFilename() === 'investissement-ethereum-lump.png';
  record("Calculateur d'investissement", heroOk && badgeOk && dcaBlockOk && priceContextOk && imagesOk,
    `résultat Bitcoin rendu: ${heroOk}, contexte des prix: ${priceContextOk}, badge LVMH: ${badgeOk}, DCA bloqué: ${dcaBlockOk}, images mensuelle et annuelle: ${imagesOk}`);
}

async function testPortfolioGenerator(page) {
  await page.goto(`${BASE}/generateur-portefeuilles`, { waitUntil: "networkidle" });
  const image = page.locator('.pg-image-preview img');
  const firstImage = await image.getAttribute('src');
  await page.getByRole("button", { name: /Générer un nouveau portefeuille/i }).click();
  await page.waitForTimeout(200);
  const pcts = await page.locator(".pg-alloc-pct").allInnerTexts();
  const sum = pcts.reduce((s, t) => s + parseFloat(t), 0);
  const sumOk = Math.abs(sum - 100) < 0.5;
  const categoryPcts = await page.locator('.pg-category-summary strong').allInnerTexts();
  const categorySum = categoryPcts.reduce((s, t) => s + parseFloat(t), 0);
  const categoriesOk = categoryPcts.length > 0 && Math.abs(categorySum - 100) < 0.5;
  const cta = await page.locator("body").innerText();
  const hasContent = cta.length > 500;
  const newImage = await image.getAttribute('src');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: '⬇️ Télécharger l’image PNG' }).click(),
  ]);
  const imageOk = firstImage?.startsWith('data:image/png;base64,') && newImage?.startsWith('data:image/png;base64,') && firstImage !== newImage && download.suggestedFilename() === 'repartition-portefeuille.png';
  record("Générateur de portefeuilles", sumOk && hasContent && categoriesOk && imageOk, `somme des lignes: ${sum.toFixed(1)}%, catégories: ${categorySum.toFixed(1)}%, image actualisée et téléchargée: ${imageOk}`);
}

async function testPortfolioDuels(page) {
  await page.goto(`${BASE}/duels-portefeuilles`, { waitUntil: 'networkidle' });
  const select = page.locator('#pd-select');
  let valid = (await select.locator('option').count()) === DUELS.length;
  for (let index = 0; index < DUELS.length; index++) {
    await select.selectOption(String(index));
    const text = await page.locator('#pd-tweet').inputValue();
    valid &&= /2020 : [+-]/.test(text) && /2025 : [+-]/.test(text) && /10 000 \$/.test(text) && !/\bNaN\b|\bundefined\b/.test(text);
    valid &&= (await page.locator('.pd-table tbody tr').count()) === 6;
  }
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Télécharger l’image PNG/i }).click(),
  ]);
  valid &&= download.suggestedFilename().endsWith('.png');
  await page.getByRole('button', { name: 'Générer un duel' }).click();
  valid &&= (await page.locator('.pd-card').count()) === 2;
  valid &&= /202[0-5] :/.test(await page.locator('#pd-tweet').inputValue());
  await page.getByRole('button', { name: '🎲 Générer un autre duel' }).click();
  valid &&= (await page.locator('.pd-card').count()) === 2;
  await page.getByRole('button', { name: 'Composer A et B' }).click();
  valid &&= (await page.locator('.pd-editor-side').count()) === 2;
  valid &&= /10 000 €/.test(await page.locator('#pd-tweet').inputValue());
  await page.getByRole('spinbutton', { name: 'Poids de l’actif 1 du portefeuille A' }).fill('65');
  valid &&= await page.getByRole('alert').isVisible();
  valid &&= (await page.locator('.pd-card').count()) === 0;
  await page.getByRole('spinbutton', { name: 'Poids de l’actif 1 du portefeuille A' }).fill('70');
  valid &&= (await page.locator('.pd-card').count()) === 2;
  record('Duel de portefeuilles', valid, `${DUELS.length} duels, génération, composition, total 100 % et image PNG`);
}

async function testEtfSheets(page) {
  await page.goto(`${BASE}/fiches-etf`, { waitUntil: "networkidle" });
  const select = page.locator("select").first();
  const defaultEtf = await select.inputValue();
  const count = await select.locator("option").count();
  let badCount = 0;
  for (let i = 0; i < count; i++) {
    await select.selectOption({ index: i });
    await page.waitForTimeout(40);
    const text = await page.locator("body").innerText();
    if (/undefined|NaN/.test(text)) badCount++;
    const selectedId = await select.inputValue();
    const card = ETFS.find(item => item.id === selectedId);
    if (card.listing && !text.includes(`Cotation : ${card.listing.exchange} · ${card.listing.currency}`)) badCount++;
  }
  await select.selectOption('sp500');
  await page.getByRole('button', { name: '📊 Télécharger le graphique annuel' }).click();
  const preview = page.getByRole('dialog', { name: 'Aperçu : Performances annuelles de l’ETF' });
  const imageOk = (await preview.locator('img').getAttribute('src'))?.startsWith('data:image/png;base64,');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    preview.getByRole('button', { name: '⬇️ Télécharger' }).click(),
  ]);
  await preview.getByRole('button', { name: "Fermer l'aperçu" }).click();
  record("Fiches ETF", badCount === 0 && defaultEtf === 'sp500' && imageOk && download.suggestedFilename() === 'sp500-performances-annuelles.png',
    `${count} fiches cyclées, défaut ${defaultEtf}, ${badCount} avec un champ "undefined"/"NaN", aperçu et téléchargement PNG`);
}

async function testBrokerComparator(page) {
  await page.goto(`${BASE}/comparatif-courtiers`, { waitUntil: "networkidle" });
  await page.waitForTimeout(150);
  // Le texte généré vit dans la value d'un <textarea> (bc-tweet-textarea) — jamais capturé par
  // innerText(), qui n'expose pas le contenu des champs de formulaire.
  const tweet = await page.locator(".bc-tweet-textarea").inputValue();
  const ok = tweet.includes("Si tu transfères ton PEA") && tweet.includes("BoursoMarkets")
    && tweet.includes("Quand tu passes un ordre") && tweet.includes("Direct Price")
    && !tweet.includes("Liquidités rémunérées")
    && !/à vérifier|à confirmer|non établi/i.test(tweet) && !/Livret|liquidités non rémunérées|vérifié le/i.test(tweet)
    && (await page.locator('.bc-evidence-broker').count()) === 2
    && (await page.locator('.bc-row-label').filter({ hasText: 'Liquidités rémunérées' }).count()) === 0;
  await page.locator('.bc-duel-chip').filter({ hasText: 'FO vs SX' }).click();
  await page.waitForFunction(() => document.querySelector('.bc-tweet-textarea')?.value.includes('Saxo Bank'));
  const fortuneoSaxo = await page.locator('.bc-tweet-textarea').inputValue();
  await page.locator('.bc-evidence-broker').first().locator('summary').click();
  const sourceOk = !fortuneoSaxo.includes('Liquidités rémunérées')
    && !fortuneoSaxo.includes('Si tu investis automatiquement')
    && !/à vérifier|à confirmer|non établi/i.test(fortuneoSaxo)
    && fortuneoSaxo.includes('PEA Jeune ❌')
    && (await page.locator('.bc-evidence-broker').count()) === 2
    && (await page.locator('.bc-evidence').innerText()).includes('les conditions générales Fortuneo du 01/09/2025 excluent explicitement les intérêts')
    && (await page.locator('.bc-evidence').innerText()).includes('source externe');
  record("Comparatif courtiers", ok && sourceOk, "duels réservés aux preuves directes et provenance externe visible au registre");
}

async function testTweetMidi(page) {
  await page.goto(`${BASE}/tweet-midi`, { waitUntil: "networkidle" });
  const formats = ["Vrai ou Faux", "Dilemme", "Fiche lexique", "Comparatif ETF", "Il y a X ans", "Performance depuis", "Pouvoir d'achat"];
  let failed = [];
  for (const label of formats) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.waitForTimeout(150);
    const text = await page.locator("body").innerText();
    if (text.length < 500) failed.push(label);
  }
  record("Tweet Midi", failed.length === 0, failed.length ? `formats sans contenu suffisant: ${failed.join(", ")}` : `${formats.length} formats cyclés`);
}

async function testConcreteCases(page) {
  await page.goto(`${BASE}/cas-concrets`, { waitUntil: "networkidle" });
  const choices = page.locator(".cc-choice");
  const count = await choices.count();
  let allRendered = count === CASES.length;
  for (let i = 0; i < count; i++) {
    await choices.nth(i).click();
    const body = await page.locator('.cc-text').innerText();
    allRendered &&= body.replace(/\s+/g, ' ').trim() === CASES[i].text.replace(/\s+/g, ' ').trim()
      && (await page.locator('.cc-sources a').count()) === CASES[i].sources.length;
  }
  await choices.nth(1).click();
  const title = await choices.nth(1).locator("strong").innerText();
  const selected = await choices.nth(1).getAttribute("aria-current");
  const preview = await page.locator(".cc-preview").innerText();
  const switched = selected === "true" && preview.includes(title);

  // Force les deux mécanismes de copie à échouer pour vérifier le dernier recours visible.
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new Error("denied")) } });
    document.execCommand = () => false;
  });
  await page.getByRole("button", { name: /Copier le texte/i }).click();
  const manual = page.getByRole("textbox", { name: /Texte du cas concret à copier manuellement/i });
  const visible = await manual.isVisible();
  const sameText = (await manual.inputValue()) === (await page.locator(".cc-text").innerText());
  const selection = await manual.evaluate((el) => el.selectionStart === 0 && el.selectionEnd === el.value.length);
  record("Cas concrets", allRendered && switched && visible && sameText && selection,
    `${count} cas et sources: ${allRendered}, sélection: ${switched}, repli de copie: ${visible && sameText && selection}`);
}

async function testIndexComparator(page) {
  await page.goto(`${BASE}/comparateur-indices`, { waitUntil: "networkidle" });
  const select = page.locator("select").first();
  const count = await select.locator("option").count();
  let ok = 0;
  for (let i = 0; i < count; i++) {
    await select.selectOption({ index: i });
    await page.waitForTimeout(100);
    const text = await page.locator(".xc-preview-text").innerText();
    if (/L'EXPOSITION/.test(text) && /DIVERSIFICATION/.test(text) && /PERFORMANCE/.test(text) && /LE VERDICT/.test(text) && !/à revérifier|vérifié le|non vérifi[ée]|à vérifier/i.test(text)) ok++;
  }
  await select.selectOption('monde');
  const worldText = await page.locator('.xc-preview-text').innerText();
  const sharedCountsOk = ['acwi', 'ftse-all-world', 'world'].every((id) =>
    worldText.replaceAll('\u202f', ' ').includes(formatIndexConstituents(id, '2026-08-31')));
  // La famille Europe comporte désormais trois parts sur EURO STOXX 50 ;
  // exercer aussi l'export PNG, dont la hauteur dépend du nombre de lignes.
  await select.selectOption({ index: 0 });
  const [europeImage] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Télécharger l’image PNG' }).click(),
  ]);
  const imageFile = await stat(await europeImage.path());
  const imageOk = imageFile.size > 10000;
  const distinctionOk = /ceux des ETF et parts nommés, pas les rendements bruts des indices/.test(await page.locator('.xc-control-col').innerText());
  record("Comparateur d'indices", ok === count && distinctionOk && imageOk && sharedCountsOk, `${ok}/${count} familles avec les 4 blocs clés, photographies partagées: ${sharedCountsOk}, distinction indice/ETF: ${distinctionOk}, image Europe: ${imageOk}`);
}

async function testFeeImpact(page) {
  await page.goto(`${BASE}/impact-frais`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Aléatoire/i }).click();
  await page.waitForTimeout(150);
  const text = await page.locator("body").innerText();
  const canvas = page.locator(".fi-image");
  const drawing = await canvas.evaluate((node) => ({ width: node.width, height: node.height, png: node.toDataURL("image/png").startsWith("data:image/png;base64,") }));
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Télécharger l’image PNG" }).click(),
  ]);
  const file = await stat(await download.path());
  const ok = /Avec [\d,]+\s*%\s+de frais/.test(text)
    && drawing.width === 1600 && drawing.height === 1200 && drawing.png
    && download.suggestedFilename() === "epargnant-libre-impact-des-frais.png" && file.size > 10000;
  record("Impact des frais", ok, "comparaison générée et image PNG téléchargeable");
}

async function testMarketFacts(page) {
  await page.goto(`${BASE}/faits-marquants-marches`, { waitUntil: "networkidle" });
  const select = page.locator("select").first();
  const count = await select.locator("option").count();
  let badCount = 0;
  // La source est repliée dans un <details> ("Voir le fait complet et ses précisions") depuis la
  // réécriture du 23/09/2026 — innerText() ne voit pas le contenu d'un <details> fermé (masqué au
  // rendu), donc il faut l'ouvrir avant de vérifier, sous peine de faux échec sur les 21 faits.
  // Ouvert UNE SEULE fois ici : FactCard n'a pas de `key`, React réutilise le même nœud <details>
  // à chaque changement de fait (seul son contenu change), donc son état `open` survit au cycle —
  // le rouvrir à chaque itération le referme un coup sur deux (bug constaté à l'écriture de ce
  // correctif : 21 faits cyclés donnaient ~10 "échecs" en alternance, pas 0 ni 21).
  await page.locator(".mf-details summary").click();
  await page.waitForTimeout(20);
  for (let i = 0; i < count; i++) {
    await select.selectOption({ index: i });
    await page.waitForTimeout(40);
    const text = await page.locator("body").innerText();
    if (/undefined|NaN/.test(text) || !/Source :/.test(text)) badCount++;
  }
  record("Faits marquants des marchés", badCount === 0, `${count} faits cyclés, ${badCount} sans source/avec un champ manquant`);
}

async function testTweetBank(page) {
  await page.goto(`${BASE}/banque-tweets`, { waitUntil: "networkidle" });
  const totalBefore = await page.locator(".tb-summary-num").first().innerText();
  await page.locator(".tb-tweet-actions button", { hasText: "Marquer publié aujourd" }).first().click();
  await page.waitForTimeout(150);
  const cooldownCount = (await page.locator(".tb-summary-num").allInnerTexts())[1];
  const badge = await page.locator(".tb-pub-badge.cooldown").first().count();
  const ok = totalBefore === "42" && cooldownCount === "1" && badge === 1;
  record("Banque de tweets", ok, `total: ${totalBefore}, en repos après marquage: ${cooldownCount}, badge cooldown affiché: ${badge === 1}`);
}

async function testFactsheetTweets(page) {
  await page.goto(`${BASE}/tweets-factsheets`, { waitUntil: 'networkidle' });
  const select = page.locator('#factsheet-subject');
  const draft = page.locator('#factsheet-draft');
  const count = await select.locator('option').count();
  let ok = count === SHEETS.length;
  for (let index = 0; index < count; index++) {
    await select.selectOption({ index });
    const tweet = await draft.inputValue();
    ok &&= tweet.includes(SHEETS[index].constituents.toLocaleString('fr-FR'));
    ok &&= tweet.includes('2025') && /Les (principaux )?secteurs/.test(tweet);
    ok &&= !/undefined|NaN/.test(tweet) && (await page.locator('.fs-sources a').count()) >= 1;
  }
  await draft.fill('Texte corrigé avant publication');
  await page.getByRole('button', { name: /Rétablir le modèle/ }).click();
  ok &&= (await draft.inputValue()).includes('2025');
  await page.getByRole('button', { name: /Prévisualiser l’image PNG/ }).click();
  const preview = page.getByRole('dialog', { name: 'Aperçu de la fiche PNG' });
  ok &&= await preview.isVisible();
  const dimensions = await preview.locator('img').evaluate(async (img) => {
    await img.decode();
    return [img.naturalWidth, img.naturalHeight];
  });
  ok &&= dimensions[0] === 2160 && dimensions[1] === 2880;
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    preview.getByRole('link', { name: /Télécharger le PNG/ }).click(),
  ]);
  ok &&= download.suggestedFilename().endsWith('.png');
  await page.getByRole('button', { name: 'Fermer l’aperçu' }).click();
  for (const id of ['em-standard', 'topix', 'nikkei225', 'acwi', 'em-esg', 'stoxx600']) {
    await select.selectOption(id);
    await page.getByRole('button', { name: /Prévisualiser l’image PNG/ }).click();
    const current = page.getByRole('dialog', { name: 'Aperçu de la fiche PNG' });
    ok &&= await current.locator('img').evaluate(async (img) => {
      await img.decode();
      return img.naturalWidth === 2160 && img.naturalHeight === 2880;
    });
    await page.getByRole('button', { name: 'Fermer l’aperçu' }).click();
  }
  record('Dans les coulisses des indices', ok, `${count} fiches, modification et réinitialisation vérifiées`);
}

async function testDataSearch(page) {
  await page.goto(`${BASE}/bibliotheque-donnees`, { waitUntil: 'networkidle' });
  const checks = {};
  const search = page.getByRole('searchbox');
  await search.fill('DCAM');
  // Le changement de paramètres est une navigation React ; attendre la fiche correspondante.
  await page.locator('.ds-detail').filter({ hasText: 'FR001400U5Q4' }).waitFor();
  const instrumentText = await page.locator('.ds-detail').innerText();
  checks.instrument = instrumentText.includes('FR001400U5Q4') && instrumentText.includes('Euronext Paris') && instrumentText.includes('2026-09-30');
  const aum = page.locator('.ds-field').filter({ has: page.getByRole('heading', { name: 'Encours', exact: true }) });
  checks.dates = (await aum.locator('dd').first().innerText()) === 'Date de valeur non publiée par la source';
  const officialAum = page.locator('.ds-field').filter({ has: page.getByRole('heading', { name: 'Encours daté publié par l’émetteur', exact: true }) });
  checks.officialAum = (await officialAum.locator('dd').first().innerText()) === '2026-08-31'
    && (await officialAum.innerText()).includes('1 407,36 millions EUR');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exporter la fiche JSON' }).click()]);
  const exported = JSON.parse(await (await import('node:fs/promises')).readFile(await download.path(), 'utf8'));
  checks.export = exported.id === 'FR001400U5Q4' && exported.schemaVersion === 1;
  await page.goto(`${BASE}/bibliotheque-donnees?q=msci-world-enhanced-value&type=index&id=msci-world-enhanced-value`, { waitUntil: 'networkidle' });
  const fields = page.locator('.ds-field');
  checks.historyCount = await fields.count() === 3;
  for (let i = 0; i < await fields.count(); i++) await fields.nth(i).locator('summary').click();
  const history = await page.locator('.ds-detail').innerText();
  checks.history = history.includes('401') && history.includes('400') && history.includes('2026-07-31') && history.includes('2026-08-31');
  checks.archive = history.includes('Archive non vérifiable') && history.includes('2026-07-31 (date héritée non recertifiée)')
    && history.includes('Aucune publication historique recertifiée');
  const [archiveDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exporter la fiche JSON' }).click()]);
  const archiveRecord = JSON.parse(await (await import('node:fs/promises')).readFile(await archiveDownload.path(), 'utf8'));
  checks.archiveExport = archiveRecord.fields.filter(f => f.metadata.sourceStatus === 'archive-unverifiable').length === 2
    && archiveRecord.fields.every(f => f.metadata.sourceStatus !== 'archive-unverifiable'
      || (f.metadata.sourceReason && f.metadata.checkedAt === null && f.metadata.reviewedAt === '2026-09-30'));
  await page.goto(`${BASE}/bibliotheque-donnees?type=series&id=history:soxx`, { waitUntil: 'networkidle' });
  const soxxText = await page.locator('.ds-detail').innerText();
  checks.archiveSeries = soxxText.includes('Archive non vérifiable') && soxxText.includes('Deux points étaient partiellement masqués')
    && soxxText.includes('2016-01 à 2026-08');
  await page.getByLabel('Type de donnée').selectOption('all');
  await page.getByRole('searchbox').fill('zzzintrouvablezzz');
  await page.locator('.ds-detail').filter({ hasText: 'Aucune donnée' }).waitFor();
  checks.empty = (await page.getByRole('status').innerText()).includes('0 résultat');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('searchbox').fill('MSCI USA');
  await page.locator('.ds-detail').filter({ hasText: 'MSCI USA' }).waitFor();
  if (process.env.DATA_SEARCH_SCREENSHOT) await page.screenshot({ path: process.env.DATA_SEARCH_SCREENSHOT, fullPage: true });
  checks.mobile = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  await page.setViewportSize({ width: 1280, height: 720 });
  record('Bibliothèque de données', Object.values(checks).every(Boolean), JSON.stringify(checks));
}

let server;
try {
  console.log(`Démarrage de vite preview sur le port ${PORT}...`);
  // detached: true (POSIX) pour pouvoir tuer tout le groupe de processus à la fin — `npx vite
  // preview` lance un processus enfant (vite lui-même) que server.kill() seul ne termine PAS,
  // laissant un serveur orphelin sur le port derrière lui (bug constaté à l'écriture de ce
  // script : deux exécutions successives ont laissé 5 processus node/sh orphelins).
  server = spawn("npx", ["vite", "preview", "--port", String(PORT)], { stdio: "pipe", detached: true });
  await waitForServer(`${BASE}/`);
  console.log("Serveur prêt.\n");

  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {});
  const page = await browser.newPage();

  await testCalculateur(page);
  await testPortfolioGenerator(page);
  await testPortfolioDuels(page);
  await testEtfSheets(page);
  await testBrokerComparator(page);
  await testTweetMidi(page);
  await testConcreteCases(page);
  await testIndexComparator(page);
  await testFeeImpact(page);
  await testMarketFacts(page);
  await testTweetBank(page);
  await testFactsheetTweets(page);
  await testDataSearch(page);

  await browser.close();
} finally {
  if (server) {
    try {
      process.kill(-server.pid, "SIGTERM"); // tue le groupe entier (npx + vite), pas juste npx
    } catch {
      server.kill(); // fallback (ex. plateforme sans groupes de processus)
    }
  }
}

const failures = results.filter((r) => !r.ok);
console.log(`\n${results.length - failures.length}/${results.length} outils OK.`);
if (failures.length) {
  console.log("ÉCHEC — voir le détail ci-dessus avant de déployer.");
  process.exitCode = 1;
} else {
  console.log("OK — tous les outils passent leur test fonctionnel en navigateur réel.");
}
// Sortie explicite : un handle résiduel (ex. connexion Playwright) peut empêcher Node de
// terminer seul — sans ça, le process reste accroché malgré un travail déjà terminé.
process.exit(process.exitCode ?? 0);
