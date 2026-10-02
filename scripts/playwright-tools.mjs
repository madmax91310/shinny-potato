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
import { stat, readFile } from "node:fs/promises";
import { FAMILIES } from "../src/data/index-comparisons.js";
import { getIndexComparisonEditorial } from "../src/data/index-comparison-editorial.js";
import { fmtPct } from "../src/pages/index-comparator/lib.js";
import { buildDuel, buildTweet } from '../src/pages/portfolio-duels/lib.js';
import { DUELS } from "../src/pages/portfolio-duels/data.js";
import { formatIndexConstituents } from "../src/data/index-facts.js";
import { SHEETS } from "../src/data/index-factsheets.js";
import { ASSETS as HISTORY } from '../src/data/market-history.js';
import { fmtEUR as fmtHistoryPrice, fmtPct as fmtHistoryPct } from '../src/pages/investment-calculator/lib.js';
import { TWEETS } from '../src/pages/tweet-bank/data.js';
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
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: async text => { window.__investmentCopiedText = text; } },
  }));
  await page.locator("select.ic-control").first().selectOption("bitcoin");
  await page.getByRole('button', { name: /Copier le texte du post/ }).click();
  let conclusionsOk = /à condition d’avoir conservé le placement de janvier 2020 à/.test(await page.evaluate(() => window.__investmentCopiedText));
  conclusionsOk &&= !(await page.evaluate(() => window.__investmentCopiedText)).includes('Livret A');
  await page.waitForTimeout(150);
  const hero = await page.locator(".ic-hero-number").innerText();
  const heroOk = /\d/.test(hero);
  let septemberOk = (await page.evaluate(() => window.__investmentCopiedText)).includes('septembre 2026');
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

  await page.locator("select.ic-control").first().selectOption('cac40');
  await imageButton.click();
  const annualPreview = page.getByRole('dialog', { name: 'Aperçu de l’image du placement' });
  const annualImage = (await annualPreview.locator('img').getAttribute('src'))?.startsWith('data:image/png;base64,');
  const [annualDownload] = await Promise.all([
    page.waitForEvent('download'),
    annualPreview.getByRole('link', { name: '⬇️ Télécharger le PNG' }).click(),
  ]);
  await annualPreview.getByRole('button', { name: 'Fermer l’aperçu' }).click();

  await page.locator("select.ic-control").first().selectOption("ethereum");
  await page.locator('.ic-method-note').filter({ hasText: 'Série en USD' }).waitFor();
  const ethereumText = await page.locator("body").innerText();
  const ethereumDca = page.getByRole('button', { name: 'Mensuel (DCA)', exact: true });
  const ethereumCoverage = (await page.locator('.ic-method-note').innerText()).match(/Série en USD : (\d+) points présents dans le code sur (\d+) mois/);
  const ethereumMonthlyOk = ethereumCoverage && Number(ethereumCoverage[1]) > 12 && ethereumCoverage[1] === ethereumCoverage[2]
    && !ethereumText.includes('DCA non disponible pour Ethereum') && await ethereumDca.isEnabled();
  await ethereumDca.click();
  await page.locator('.ic-mode-pill').filter({ hasText: 'DCA mensuel' }).waitFor();
  const ethereumDcaOk = (await page.locator('.ic-mode-pill').textContent()).trim() === 'DCA mensuel';
  await page.getByRole('button', { name: /Copier le texte du post|✓ Copié/ }).click();
  const monthlyTweet = await page.evaluate(() => window.__investmentCopiedText);
  conclusionsOk &&= /versés au total/.test(monthlyTweet) && !/sans versement supplémentaire/.test(monthlyTweet);
  septemberOk &&= monthlyTweet.includes('septembre 2026');
  await page.locator('select.ic-control').first().selectOption('sp500');
  const spDca = page.getByRole('button', { name: 'Mensuel (DCA)', exact: true });
  const spDcaOk = await spDca.isEnabled();
  await spDca.click();
  await page.getByRole('button', { name: /Copier le texte du post|✓ Copié/ }).click();
  const spTweet = await page.evaluate(() => window.__investmentCopiedText);
  septemberOk &&= spTweet.includes('septembre 2026') && spTweet.includes('hors frais')
    && (await page.locator('.ic-current-level').innerText()).includes('points');
  await page.locator('select.ic-control').first().selectOption('stoxx600');
  const stoxxDca = page.getByRole('button', { name: 'Mensuel (DCA)', exact: true });
  septemberOk &&= await stoxxDca.isEnabled();
  await stoxxDca.click();
  await page.getByRole('button', { name: /Copier le texte du post|✓ Copié/ }).click();
  const stoxxTweet = await page.evaluate(() => window.__investmentCopiedText);
  septemberOk &&= stoxxTweet.includes('septembre 2026') && stoxxTweet.includes('versés au total')
    && (await page.locator('.ic-current-level').innerText()).includes('points')
    && (await page.locator('.ic-method-note').innerText()).includes('dividendes nets');
  await page.locator('select.ic-control').first().selectOption('msciWorld');
  const worldDca = page.getByRole('button', { name: 'Mensuel (DCA)', exact: true });
  septemberOk &&= await worldDca.isEnabled();
  await worldDca.click();
  await page.getByRole('button', { name: /Copier le texte du post|✓ Copié/ }).click();
  const worldTweet = await page.evaluate(() => window.__investmentCopiedText);
  septemberOk &&= worldTweet.includes('septembre 2026') && worldTweet.includes('versés au total')
    && (await page.locator('.ic-current-level').innerText()).includes('points')
    && (await page.locator('.ic-method-note').innerText()).includes('MSCI World Gross Return');
  for (const [id, name] of [['msciEmerging', 'MSCI Emerging Markets'], ['msciWorldSmallCap', 'MSCI World Small Cap']]) {
    await page.locator('select.ic-control').first().selectOption(id);
    const dca = page.getByRole('button', { name: 'Mensuel (DCA)', exact: true });
    septemberOk &&= await dca.isEnabled();
    await dca.click();
    await page.getByRole('button', { name: /Copier le texte du post|✓ Copié/ }).click();
    const post = await page.evaluate(() => window.__investmentCopiedText);
    septemberOk &&= post.includes(name) && post.includes('septembre 2026') && post.includes('Gross Return')
      && post.includes('versés au total') && !/NaN|undefined/.test(post)
      && (await page.locator('.ic-current-level').innerText()).includes('points')
      && (await page.locator('.ic-method-note').innerText()).includes(`${name} Gross Return`);
  }
  await page.locator('select.ic-control').first().selectOption('or');
  septemberOk &&= (await page.locator('.ic-current-level').innerText()).includes('août 2026');
  await page.getByRole('button', { name: /Copier le texte du post|✓ Copié/ }).click();
  septemberOk &&= (await page.evaluate(() => window.__investmentCopiedText)).includes('En août 2026');
  await page.locator("select.ic-control").first().selectOption("lvmh");
  await page.waitForTimeout(150);
  const text = await page.locator("body").innerText();
  const badgeOk = /non vérifiées avant/.test(text);
  const dcaBlockOk = /DCA non disponible pour LVMH/.test(text);

  let companiesOk = true;
  for (const id of ['costco', 'mcdonalds', 'airliquide', 'schneider', 'hermes', 'loreal', 'intel', 'paypal']) {
    await page.locator('select.ic-control').first().selectOption(id);
    await page.locator('.ic-method-note').filter({ hasText: 'Cours ajustés' }).waitFor();
    await page.getByRole('button', { name: /Copier le texte du post/ }).click();
    const post = await page.evaluate(() => window.__investmentCopiedText);
    companiesOk &&= post.includes('Cours ajustés') && post.includes('septembre 2026') && !/NaN|undefined/.test(post);
    if (id === 'airliquide') companiesOk &&= post.includes('Prime de fidélité exclue');
    companiesOk &&= !(await page.locator('body').innerText()).includes('DCA non disponible pour');
  }
  const imagesOk = monthlyImage && annualImage && monthlyDownload.suggestedFilename() === 'investissement-bitcoin-lump.png' && annualDownload.suggestedFilename() === 'investissement-cac40-lump.png';
  record("Calculateur d'investissement", companiesOk && septemberOk && spDcaOk && conclusionsOk && heroOk && badgeOk && dcaBlockOk && priceContextOk && imagesOk && ethereumMonthlyOk && ethereumDcaOk,
    `8 entreprises: ${companiesOk}, septembre/fins réelles: ${septemberOk}, S&P DCA: ${spDcaOk}, résultat Bitcoin rendu: ${heroOk}, contexte des prix: ${priceContextOk}, badge LVMH: ${badgeOk}, DCA bloqué: ${dcaBlockOk}, images mensuelle et annuelle: ${imagesOk}, Ethereum mensuel: ${ethereumMonthlyOk}, DCA: ${ethereumDcaOk}, couverture: ${JSON.stringify(ethereumCoverage)}`);
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
  const autoEditorialOk = /La logique de l’ensemble/.test(await page.locator(".pg-tweet-body").innerText());
  await page.getByRole("button", { name: /Composition manuelle/ }).click();
  await page.locator("#pg-manual-profile").selectOption("crypto_curieux");
  await page.locator("#pg-manual-search").fill("Fonds euros");
  await page.locator(".pg-manual-asset-option").first().click();
  await page.locator(".pg-manual-pct-input").fill("100");
  await page.getByRole("button", { name: "Générer le tweet", exact: true }).click();
  const manualTweet = await page.locator(".pg-tweet-body").innerText();
  const manualEditorialOk = /100%/.test(manualTweet) && /La logique de l’ensemble/.test(manualTweet) && !/Bitcoin|Ethereum/.test(manualTweet);
  record("Générateur de portefeuilles", sumOk && hasContent && categoriesOk && imageOk && autoEditorialOk && manualEditorialOk, `somme des lignes: ${sum.toFixed(1)}%, catégories: ${categorySum.toFixed(1)}%, image actualisée et téléchargée: ${imageOk}`);
}

async function testPortfolioDuels(page) {
  await page.goto(`${BASE}/duels-portefeuilles`, { waitUntil: 'networkidle' });
  const select = page.locator('#pd-select');
  let valid = (await select.locator('option').count()) === DUELS.length;
  for (let index = 0; index < DUELS.length; index++) {
    await select.selectOption(String(index));
    const text = await page.locator('#pd-tweet').inputValue();
    const expected = buildDuel(DUELS[index]);
    valid &&= text === buildTweet(expected) && /10\s000 €/.test(text) && !/\bNaN\b|\bundefined\b/.test(text);
    valid &&= (await page.locator('.pd-table tbody tr').count()) === expected.years.length;
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
  valid &&= /10\s000 €/.test(await page.locator('#pd-tweet').inputValue());
  await page.getByRole('spinbutton', { name: 'Poids base du portefeuille A' }).fill('65');
  valid &&= await page.getByRole('alert').isVisible();
  valid &&= (await page.locator('.pd-card').count()) === 0;
  await page.getByRole('spinbutton', { name: 'Poids base du portefeuille A' }).fill('80');
  valid &&= (await page.locator('.pd-card').count()) === 2;
  await page.getByRole('combobox', { name: 'Complément du portefeuille A', exact: true }).selectOption('');
  await page.getByRole('spinbutton', { name: 'Poids base du portefeuille A' }).fill('100');
  valid &&= (await page.locator('.pd-card').first().locator('p').count()) === 1;
  await page.getByRole('combobox', { name: 'Thématique du portefeuille A', exact: true }).selectOption('sect_cyber_lg');
  await page.getByRole('spinbutton', { name: 'Poids base du portefeuille A' }).fill('90');
  valid &&= /cybersécurité/i.test(await page.locator('#pd-tweet').inputValue());
  await page.getByRole('combobox', { name: 'Complément du portefeuille A', exact: true }).selectOption('stoxx600_bnp');
  await page.getByRole('spinbutton', { name: 'Poids base du portefeuille A' }).fill('80');
  valid &&= (await page.locator('.pd-table tbody tr').count()) === 3;
  valid &&= /début 2023/.test(await page.locator('#pd-tweet').inputValue());
  const [manualImage] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Télécharger l’image PNG/i }).click(),
  ]);
  valid &&= (await stat(await manualImage.path())).size > 10000;
  await page.setViewportSize({ width: 390, height: 844 });
  valid &&= await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  if (process.env.DUEL_SCREENSHOT) await page.screenshot({ path: process.env.DUEL_SCREENSHOT, fullPage: true });
  if (process.env.DUEL_IMAGE) await manualImage.saveAs(process.env.DUEL_IMAGE);
  await page.setViewportSize({ width: 1280, height: 720 });
  record('Duel de portefeuilles', valid, `${DUELS.length} duels, génération, composition, total 100 % et image PNG`);
}

async function testEtfSheets(page) {
  await page.goto(`${BASE}/fiches-etf`, { waitUntil: "networkidle" });
  // Capture la sortie du bouton sans dépendre du presse-papiers du navigateur CI.
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async text => { window.__etfCopiedText = text; } },
  }));
  const select = page.locator("select").first();
  const defaultEtf = await select.inputValue();
  const count = await select.locator("option").count();
  let badCount = 0;
  for (let i = 0; i < count; i++) {
    await select.selectOption({ index: i });
    await page.waitForTimeout(40);
    // textContent vérifie le contenu des rubriques sans la mise en capitales CSS des titres.
    const text = await page.locator(".es-card").textContent();
    if (/undefined|NaN/.test(text)) badCount++;
    const selectedId = await select.inputValue();
    const card = ETFS.find(item => item.id === selectedId);
    if (!text.includes(card.hook)) badCount++;
    const accounts = await page.locator('.es-facts li').filter({ hasText: 'CTO :' }).textContent();
    if (accounts.includes('PEA') !== (card.pea === true)) badCount++;
    if (card.listing && !text.includes(`Cotation : ${card.listing.exchange} · ${card.listing.currency}`)) badCount++;
    const sectionLabels = ["🔍 C'est quoi ?", "✅ Pourquoi c'est intéressant ?", "⚠️ Ce qu'il faut savoir", '🏆 Verdict'];
    const explanations = [card.whatIs, card.whyInteresting, card.whatToKnow, card.verdict];
    if (!explanations.every(value => value && text.includes(value))
      || !sectionLabels.every(label => text.includes(label))) badCount++;
    await page.getByRole('button', { name: /📋 Copier le texte|✅ Copié !/ }).click();
    const copied = await page.evaluate(() => window.__etfCopiedText);
    const sectionPositions = sectionLabels.map(label => copied?.indexOf(label) ?? -1);
    if (!copied?.startsWith("📋 Présentation d'ETF\n") || !copied.includes(card.name)
      || !copied.includes(card.isin) || !copied.includes(card.ter) || !copied.includes(card.hook)
      || (copied.includes('PEA') !== (card.pea === true))
      || !explanations.every(value => copied.includes(value))
      || !sectionPositions.every((position, index) => position >= 0 && (index === 0 || position > sectionPositions[index - 1]))
      || !copied.includes('💬 ' + card.question + ' 👇')
      || !copied.endsWith('⚠️ Pas un conseil en investissement')
      || /undefined|NaN/.test(copied)) badCount++;
    if (card.lastVerified === '01/10/2026') {
      for (const buttonName of ['🖼️ Image récapitulative', '📊 Télécharger le graphique annuel']) {
        await page.getByRole('button', { name: buttonName }).click();
        const dialog = page.getByRole('dialog');
        const valid = await dialog.locator('img').evaluate(async img => { await img.decode(); return img.naturalWidth > 0 && img.src.startsWith('data:image/png;base64,'); });
        if (!valid) badCount++;
        const [file] = await Promise.all([page.waitForEvent('download'), dialog.getByRole('button', { name: '⬇️ Télécharger' }).click()]);
        if (!file.suggestedFilename().endsWith('.png')) badCount++;
        await dialog.getByRole('button', { name: "Fermer l'aperçu" }).click();
      }
    }
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
    `${count} fiches et textes copiés personnalisés, défaut ${defaultEtf}, ${badCount} erreur(s), aperçu et téléchargement PNG`);
}

async function testBrokerComparator(page) {
  await page.goto(`${BASE}/comparatif-courtiers`, { waitUntil: "networkidle" });
  await page.waitForTimeout(150);
  await page.waitForFunction(() => {
    const canvas = document.querySelector('.bc-versus-canvas');
    return canvas?.width === 1600 && canvas?.height === 900;
  });
  const versusBefore = await page.locator('.bc-versus-canvas').evaluate((canvas) => canvas.toDataURL('image/png'));
  const [duelDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Télécharger l’image PNG' }).click(),
  ]);
  const versusOk = versusBefore.startsWith('data:image/png;base64,') && versusBefore.length > 30000
    && duelDownload.suggestedFilename() === 'duel-courtiers-tr-bourso.png';
  // Le texte généré vit dans la value d'un <textarea> (bc-tweet-textarea) — jamais capturé par
  // innerText(), qui n'expose pas le contenu des champs de formulaire.
  const tweet = await page.locator(".bc-tweet-textarea").inputValue();
  const ok = tweet.includes("🔄 Transfert du PEA") && tweet.includes("BoursoMarkets")
    && tweet.includes("💰 Frais de courtage PEA") && tweet.includes("Direct Price")
    && tweet.includes("💵 Liquidités rémunérées") && tweet.includes("Non : PEA/PEA-PME selon contrat")
    && !/undefined|\bNaN\b|conversion|💱|à vérifier|aucune offre spécifique|preuve corroborée/i.test(tweet)
    && (await page.locator('.bc-evidence-broker').count()) === 2
    && (await page.locator('.bc-row-label').filter({ hasText: 'Liquidités rémunérées' }).count()) === 0;
  await page.locator('.bc-duel-chip').filter({ hasText: 'FO vs SX' }).click();
  await page.waitForFunction(() => document.querySelector('.bc-tweet-textarea')?.value.includes('Saxo Bank'));
  await page.waitForFunction((previous) => {
    const canvas = document.querySelector('.bc-versus-canvas');
    return canvas?.width === 1600 && canvas.toDataURL('image/png') !== previous;
  }, versusBefore);
  const fortuneoSaxo = await page.locator('.bc-tweet-textarea').inputValue();
  let previousVersus = await page.locator('.bc-versus-canvas').evaluate((canvas) => canvas.toDataURL('image/png'));
  for (const duo of ['IBKR vs XTB', 'CA vs BD']) {
    await page.locator('.bc-duel-chip').filter({ hasText: duo }).click();
    await page.waitForFunction((previous) => document.querySelector('.bc-versus-canvas')?.toDataURL('image/png') !== previous, previousVersus);
    previousVersus = await page.locator('.bc-versus-canvas').evaluate((canvas) => canvas.toDataURL('image/png'));
  }
  await page.locator('.bc-duel-chip').filter({ hasText: 'FO vs SX' }).click();
  await page.locator('.bc-evidence-broker').first().locator('summary').click();
  const sourceOk = fortuneoSaxo.includes('💵 Liquidités rémunérées')
    && fortuneoSaxo.includes('📅 Achats automatiques sur PEA')
    && fortuneoSaxo.includes('Non : PEA/PEA-PME selon contrat')
    && fortuneoSaxo.includes('PEA Jeune : Fortuneo ❌ · Saxo Bank ❌')
    && fortuneoSaxo.includes('Plus de 150 ETF Amundi')
    && (await page.locator('.bc-evidence-broker').count()) === 2
    && (await page.locator('.bc-evidence').innerText()).includes('les conditions générales Fortuneo du 01/09/2025, art. 12 p. 35, excluent explicitement les intérêts')
    && (await page.locator('.bc-evidence').innerText()).includes('source externe');
  await page.locator('.bc-duel-chip').filter({ hasText: 'TR vs IBKR' }).click();
  const noOffers = await page.locator('.bc-tweet-textarea').inputValue();
  const complete = !/🎁|conversion|💱|à vérifier|aucune offre spécifique|preuve corroborée|portée PEA non établie/i.test(noOffers)
    && noOffers.includes('Transfert entrant et sortant possible') && noOffers.includes('IFU disponible pour le PEA');
  record("Comparatif courtiers", ok && sourceOk && versusOk && complete, "rubriques complètes, logos officiels et image PNG du duel");
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
  await page.getByRole("button", { name: "Il y a X ans", exact: true }).click();
  await page.locator("#subject-select").selectOption("bitcoin");
  await page.locator("#secondary-select").selectOption("1");
  await page.getByRole("button", { name: "🔄 Générer", exact: true }).click();
  await page.locator("#niveau-actuel").fill(String(HISTORY.bitcoin.points.at(-1).price));
  const past = new Date();
  const pastYm = `${past.getFullYear() - 1}-${String(past.getMonth() + 1).padStart(2, "0")}`;
  const historical = HISTORY.bitcoin.points.find(p => p.date === pastYm);
  const anniversary = await page.locator("pre").innerText();
  if (historical && !anniversary.includes(fmtHistoryPrice(historical.price, "USD"))) failed.push("Il y a X ans : clôture historique Bitcoin");
  await page.getByRole("button", { name: "Performance depuis", exact: true }).click();
  await page.locator('#subject-select').selectOption('sp500');
  await page.locator('#secondary-select').selectOption('2016');
  await page.getByRole("button", { name: "🔄 Générer", exact: true }).click();
  const performance = await page.locator('pre').innerText();
  const minimal = /^📈 Performance du S&P 500 depuis 2016 👇\n\n/u.test(performance)
    && performance.split('\n').at(-1).startsWith('Cumulé sur la période : ')
    && !/💬|Livret A|Cours en dollars/u.test(performance)
    && (await page.getByRole('checkbox').count()) === 0;
  if (!minimal) failed.push('Performance depuis : format minimal');
  await page.locator('#subject-select').selectOption('stoxx600');
  await page.getByRole('button', { name: '🔄 Générer', exact: true }).click();
  const stoxxPerformance = await page.locator('pre').innerText();
  const stoxxAnnual = (HISTORY.stoxx600.points.find(p => p.date === '2025-12').price
    / HISTORY.stoxx600.points.find(p => p.date === '2024-12').price - 1) * 100;
  if (!stoxxPerformance.includes(`2025 : ${fmtHistoryPct(stoxxAnnual)}`)
      || stoxxPerformance.includes('2026 :')) failed.push('Performance depuis : historique officiel STOXX');
  await page.getByRole("button", { name: "Comparatif (2 actifs)", exact: true }).click();
  await page.locator('#subject-select-a').selectOption('sp500');
  await page.locator('#subject-select-b').selectOption('bitcoin');
  await page.getByRole("button", { name: "🔄 Générer", exact: true }).click();
  const comparison = await page.locator('pre').innerText();
  if ((comparison.match(/^📈 Performance /gmu) ?? []).length !== 2
      || (comparison.match(/^Cumulé sur la période : /gmu) ?? []).length !== 2
      || comparison.includes('💬')) failed.push('Performance depuis : comparatif');
  await page.getByRole('button', { name: 'Performance depuis', exact: true }).click();
  for (const id of ['costco', 'mcdonalds', 'airliquide', 'schneider', 'hermes', 'loreal', 'intel', 'paypal']) {
    await page.locator('#subject-select').selectOption(id);
    await page.locator('#secondary-select').selectOption('2020');
    await page.getByRole('button', { name: '🔄 Générer', exact: true }).click();
    const post = await page.locator('pre').innerText();
    if (!post.includes('2025 :') || post.includes('2026 :') || /NaN|undefined/.test(post)) failed.push(`Nouvelle entreprise ${id}`);
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
  await page.goto(`${BASE}/comparateur-indices`, { waitUntil: 'networkidle' });
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: async text => { window.__indexCopiedText = text; } },
  }));
  await page.evaluate(() => {
    const original = CanvasRenderingContext2D.prototype.fillText;
    window.__indexImageText = [];
    CanvasRenderingContext2D.prototype.fillText = function(text, ...args) {
      window.__indexImageText.push(String(text));
      return original.call(this, text, ...args);
    };
  });
  const select = page.locator('select').first();
  const count = await select.locator('option').count();
  let ok = 0, images = 0;
  for (const family of FAMILIES) {
    console.log(`    Comparateur : ${family.id}`);
    await select.selectOption(family.id);
    const text = await page.locator('.xc-preview-text').innerText();
    const editorial = getIndexComparisonEditorial(family);
    const refs = family.etfGroups.flatMap(group => group.funds);
    const dataOk = refs.every(fund => text.includes(fund.isin) && text.includes(fund.ter))
      && family.perfFunds.every(fund => fund.perfNote ? text.includes(fund.perfNote) :
        [2023, 2024, 2025].every(year => text.includes(`${year} : ${fmtPct(fund[`y${year}`]) ?? 'Non disponible'}`)));
    await page.getByRole('button', { name: /📋 Copier le texte|✅ Copié !/ }).click();
    const copied = await page.evaluate(() => window.__indexCopiedText);
    if (dataOk && copied === text && text.startsWith(editorial.hook)
      && text.endsWith(editorial.question) && editorial.exposures.every(p => text.includes(p))
      && !/L'EXPOSITION|LE VERDICT|DIVERSIFICATION|undefined|NaN|à compléter/.test(text)) ok++;
    // Espacer la série de PNG pour éviter le blocage des téléchargements en rafale.
    await page.waitForTimeout(250);
    await page.evaluate(() => { window.__indexImageText = []; });
    const [download] = await Promise.all([Promise.race([page.waitForEvent('download'),
      page.getByRole('button', { name: 'Réessayer le téléchargement PNG' }).waitFor().then(() => { throw new Error(`Export PNG impossible : ${family.id}`); })]),
      page.getByRole('button', { name: 'Télécharger l’image PNG' }).click()]);
    const png = await readFile(await download.path());
    const drawn = await page.evaluate(() => window.__indexImageText.join('\n'));
    const indicesOnly = refs.every(fund => !drawn.includes(fund.isin) && !drawn.includes(fund.name))
      && !/ETF CITÉS|ETP CITÉS|ETC CITÉS|Éligible au PEA|éligible au PEA|PEA :|\/ an/.test(drawn);
    const composition = family.indices.every(index => {
      const facts = index.indexFacts;
      if (facts?.metadata?.sourceStatus !== 'documented') return true;
      return (!facts.constituents || (drawn.includes(facts.constituents.toLocaleString('fr-FR')) && drawn.includes('valeurs dans l’indice')))
        && [...(facts.countries ?? []).slice(0, 3), ...(facts.sectors ?? []).slice(0, 3)].every(([, value]) => drawn.includes(`${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`));
    });
    if (indicesOnly && composition && download.suggestedFilename() === `comparateur-indices-${family.id}.png`
      && png.readUInt32BE(16) === 1440 && png.readUInt32BE(20) > 400
      && png.readUInt32BE(20) < 2100 && png.length > 10000) images++;
  }
  await select.selectOption('monde');
  const worldText = await page.locator('.xc-preview-text').innerText();
  const sharedCountsOk = ['acwi', 'ftse-all-world', 'world'].every(id =>
    worldText.replaceAll('\u202f', ' ').includes(formatIndexConstituents(id, '2026-08-31')));
  await select.selectOption('europe');
  await page.getByRole('checkbox', { name: 'Inclure le YTD' }).first().check();
  let ytdOk = !(await page.locator('.xc-preview-text').innerText()).includes('YTD saisi');
  await page.getByPlaceholder('YTD %').fill('0');
  ytdOk &&= (await page.locator('.xc-preview-text').innerText()).includes('YTD saisi : +0,00 %');
  await select.selectOption('monde');
  ytdOk &&= !(await page.locator('.xc-preview-text').innerText()).includes('YTD saisi');
  const distinctionOk = /ceux des ETF et parts nommés, pas les rendements bruts des indices/.test(await page.locator('.xc-control-col').innerText());
  record("Comparateur d'indices", ok === count && count === FAMILIES.length && images === count && distinctionOk && sharedCountsOk && ytdOk,
    `${ok}/${count} tweets personnalisés copiés, ${images} images comparatives, repères partagés et YTD vide/zéro/réinitialisé`);
}

async function testFeeImpact(page) {
  await page.goto(`${BASE}/impact-frais`, { waitUntil: "networkidle" });
  const preview = page.locator('.fi-preview-text');
  const initial = await preview.innerText();
  let editorialOk = initial.startsWith('Tu connais les frais annuels de tes placements ?')
    && /153\s402\s€/.test(initial) && /131\s287\s€/.test(initial)
    && /22\s115\s€ d’écart/.test(initial) && /72\s000\s€ versés/.test(initial)
    && initial.includes('les gains que l’argent prélevé') && !/Brouillon|à compléter/.test(initial);
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: async text => { window.__feeCopiedText = text; } },
  }));
  await page.getByRole('button', { name: 'Copier le texte', exact: true }).click();
  editorialOk &&= await page.evaluate(expected => window.__feeCopiedText === expected, initial);
  // Les couleurs suivent le niveau des frais, même si les scénarios sont inversés.
  await page.getByRole('button', { name: '1,5 %', exact: true }).first().click();
  await page.getByRole('button', { name: '0,20 %', exact: true }).last().click();
  editorialOk &&= /🔴 Avec 1,5 %/.test(await preview.innerText()) && /🟢 Avec 0,20 %/.test(await preview.innerText());
  await page.getByRole('button', { name: '0,20 %', exact: true }).first().click();
  editorialOk &&= (await preview.innerText()).includes('Aucun écart') && !(await preview.innerText()).includes('les frais supplémentaires');
  await page.locator('#fi-punchline').fill('Ma conclusion personnalisée');
  editorialOk &&= (await preview.innerText()).includes('Ma conclusion personnalisée');
  await page.getByRole('button', { name: '500 €', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#fi-punchline').value === '');
  editorialOk &&= !(await preview.innerText()).includes('Ma conclusion personnalisée');
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
  const ok = editorialOk && /Avec [\d,]+\s*%\s+de frais/.test(text)
    && drawing.width === 1600 && drawing.height === 1200 && drawing.png
    && download.suggestedFilename() === "epargnant-libre-impact-des-frais.png" && file.size > 10000;
  record("Impact des frais", ok, "texte validé, chiffres, copie, frais inversés/égaux, personnalisation, génération et PNG");
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
  const ok = Number(totalBefore) === TWEETS.length && cooldownCount === "1" && badge === 1;
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
  checks.certifiedSeries = !soxxText.includes('Archive non vérifiable') && soxxText.includes('2026-10-02') && soxxText.includes('close mensuel')
    && soxxText.includes('2016-01 à 2026-09');
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

async function testHouseholds(page) {
  await page.goto(`${BASE}/france-100-menages`, { waitUntil: 'networkidle' });
  let ok = await page.getByLabel('Design', { exact: true }).inputValue() === 'ivory';
  for (const { id, referencePeriod } of (await import('../src/data/household-statistics.js')).HOUSEHOLD_STATISTICS) {
    await page.getByLabel('Sujet', { exact: true }).selectOption(id);
    await page.waitForURL(`**sujet=${id}`);
    ok &&= await page.locator('.hh-preview').evaluate(async img => { await img.decode(); return img.naturalWidth === 1080 && img.naturalHeight === 1440; });
    const text = await page.getByLabel('Texte modifiable').inputValue();
    ok &&= text.includes('https://www.insee.fr/') && text.includes(referencePeriod.toLowerCase());
  }
  for (const { id: design } of (await import('../src/pages/france-100-menages/image.js')).HOUSEHOLD_DESIGNS) {
    await page.getByLabel('Design', { exact: true }).selectOption(design);
    ok &&= await page.locator('.hh-preview').evaluate(async img => { await img.decode(); return img.naturalWidth === 1080 && img.naturalHeight === 1440; });
  }
  for (const design of ['ivory', 'blue', 'plum']) {
    await page.getByLabel('Design', { exact: true }).selectOption(design);
    for (const id of ['wealth-top10', 'wealth-share', 'unexpected-expense', 'salary-median', 'donation']) {
      await page.getByLabel('Sujet', { exact: true }).selectOption(id);
      ok &&= await page.locator('.hh-preview').evaluate(async img => { await img.decode(); return img.naturalWidth === 1080 && img.naturalHeight === 1440; });
    }
    const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Télécharger le PNG' }).click()]);
    ok &&= file.suggestedFilename().endsWith(`-${design}.png`) && (await stat(await file.path())).size > 10000;
  }
  await page.getByLabel('Sujet', { exact: true }).selectOption('donation');
  const editor = page.getByLabel('Texte modifiable');
  await editor.fill('Mon texte personnalisé');
  await page.getByRole('button', { name: 'Réinitialiser le texte' }).click();
  ok &&= (await editor.inputValue()).includes('donation déclarée');
  await page.getByLabel('Inclure le lien de la source').uncheck();
  ok &&= !(await editor.inputValue()).includes('https://');
  const [png] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Télécharger le PNG' }).click()]);
  ok &&= (await stat(await png.path())).size > 10000;
  const [json] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exporter le JSON' }).click()]);
  const data = JSON.parse(await (await import('node:fs/promises')).readFile(await json.path(), 'utf8'));
  ok &&= data.id === 'donation' && data.value === 20 && data.source.url.startsWith('https://www.insee.fr/');
  await page.reload({ waitUntil: 'networkidle' });
  ok &&= await page.getByLabel('Sujet', { exact: true }).inputValue() === 'donation';
  ok &&= await page.getByLabel('Design', { exact: true }).inputValue() === 'plum';
  await page.setViewportSize({ width: 390, height: 844 });
  ok &&= await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  if (process.env.HOUSEHOLD_SCREENSHOT) await page.screenshot({ path: process.env.HOUSEHOLD_SCREENSHOT, fullPage: true });
  await page.setViewportSize({ width: 1280, height: 720 });
  record('La France en 100 ménages', ok, '17 sujets, sept designs, tweets, édition, lien source, PNG, JSON, rechargement et mobile');
}

async function testInvestorIntroductions(page) {
  const { INVESTORS } = await import('../src/pages/investor-portfolio/data.js');
  const { investorIntroduction } = await import('../src/data/investor-profiles.js');
  // Données de test contrôlées pour isoler les champs éditoriaux du réseau tiers.
  await page.route('**/data/trackers/*.json', async route => {
    const slug = new URL(route.request().url()).pathname.split('/').at(-1).replace('.json', '');
    const displayName = INVESTORS.find(([id]) => id === slug)?.[1];
    await route.fulfill({ headers: { 'access-control-allow-origin': '*' }, json: { as_of: '2026-10-01', data: { identity: { slug, displayName, entityName: 'Déclarant de test', archetype: 'hedge_fund' }, snapshot: { periodEnd: '2026-06-30', filedAt: '2026-08-14', quarterChanges: { priorPeriodLabel: 'Q1 2026', exits: [{ issuerName: 'Sortie de test', ticker: 'EXIT' }] }, holdings: [{ issuerName: 'Entreprise de test', ticker: 'TEST', weight: .6, isNew: true }, { issuerName: 'Hausse de test', ticker: 'UP', weight: .2, sharesChangePct: 18 }, { issuerName: 'Baisse de test', ticker: 'DOWN', weight: .1, sharesChangePct: -12 }] } } } });
  });
  await page.goto(`${BASE}/portefeuilles-investisseurs`, { waitUntil: 'networkidle' });
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: async text => { window.__investorCopiedText = text; } },
  }));
  let ok = true;
  for (const [slug] of INVESTORS) {
    await page.getByLabel('Choisir un investisseur').selectOption(slug);
    await page.waitForFunction(intro => document.querySelector('#ip-intro')?.value === intro && document.querySelector('#ip-draft')?.value.includes(intro), investorIntroduction(slug));
    ok &&= (await page.locator('.ip-bio').innerText()) === investorIntroduction(slug);
    const tweet = await page.getByLabel('Tweet modifiable', { exact: true }).inputValue();
    ok &&= tweet.startsWith('📊 ') && tweet.split('\n')[0].includes('%')
      && ['💼 Ses principales positions', '🔍 Ce qui distingue ce portefeuille', '📅 Photographie', '💬 '].every(label => tweet.includes(label))
      && !/place-t-il|undefined|NaN|\\\\n/.test(tweet);
    if (!['li-lu', 'gates-trust', 'klarman'].includes(slug)) {
      ok &&= ['🔄 Quelques mouvements depuis T1 2026', '🆕 Nouvelle ligne', 'nombre d’actions +18 %', 'nombre d’actions −12 %', '🚪 Ligne sortie'].every(label => tweet.includes(label));
    }
    await page.getByRole('button', { name: /Copier le tweet|Copié/ }).click();
    ok &&= (await page.evaluate(() => window.__investorCopiedText)) === tweet;
  }
  await page.getByLabel('Présentation de l’investisseur (modifiable)', { exact: true }).fill('Ma présentation personnalisée.');
  ok &&= (await page.getByLabel('Tweet modifiable', { exact: true }).inputValue()).includes('Ma présentation personnalisée.');
  ok &&= (await page.locator('.ip-bio').innerText()) === 'Ma présentation personnalisée.';
  await page.getByRole('button', { name: 'Rétablir la présentation' }).click();
  ok &&= (await page.getByLabel('Tweet modifiable', { exact: true }).inputValue()).includes(investorIntroduction('klarman'));
  await page.getByLabel('Choisir un investisseur').selectOption('cathie-wood');
  await page.waitForFunction(() => document.querySelector('#ip-intro')?.value.startsWith('Cathie Wood'));
  ok &&= !(await page.getByLabel('Tweet modifiable', { exact: true }).inputValue()).includes('Seth Klarman');
  await page.setViewportSize({ width: 390, height: 844 });
  ok &&= await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.unroute('**/data/trackers/*.json');
  record('Portefeuille d’investisseur', ok, '11 présentations et tweets synchronisés, modification, réinitialisation, changement de profil et mobile');
}

async function testDataReuse(page) {
  await page.goto(`${BASE}/impact-frais`, { waitUntil: 'networkidle' });
  await page.getByLabel('ETF du scénario 1', { exact: true }).selectOption('FR001400U5Q4');
  await page.getByLabel('ETF du scénario 2', { exact: true }).selectOption('IE00BP3QZ601');
  let ok = (await page.locator('.fi-preview-text').innerText()).includes('FR001400U5Q4')
    && (await page.locator('.fi-preview-text').innerText()).includes('sans comparer leurs performances réelles');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__reuseCopied = text; } } }));
  await page.getByRole('button', { name: 'Copier le texte', exact: true }).click();
  ok &&= (await page.evaluate(() => window.__reuseCopied)).includes('IE00BP3QZ601');
  await page.setViewportSize({ width: 390, height: 844 });
  ok &&= await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${BASE}/duels-portefeuilles`, { waitUntil: 'networkidle' });
  const prepared = await page.locator('#pd-select option').allTextContents();
  await page.locator('#pd-select').selectOption(String(prepared.findIndex(text => text.includes('XEON'))));
  ok &&= (await page.locator('#pd-tweet').inputValue()).includes('XEON');
  await page.locator('#pd-select').selectOption(String(prepared.findIndex(text => text.includes('semi-conducteurs ou blockchain'))));
  ok &&= (await page.locator('.pd-table tbody th').allTextContents()).join(',') === '2023,2024,2025';
  await page.goto(`${BASE}/faits-marquants-marches`, { waitUntil: 'networkidle' });
  await page.getByLabel('Choisir un fait').selectOption('monthly-drawdown-paypal');
  ok &&= (await page.locator('.mf-fact-text').innerText()).includes('clôtures mensuelles ajustées');
  await page.getByLabel('Choisir un fait').selectOption('monthly-dca-costco');
  ok &&= (await page.locator('.mf-fact-text').innerText()).includes('L’argent en attente n’est pas rémunéré');
  await page.goto(`${BASE}/bibliotheque-donnees?id=IE00B4JNQZ49&q=IE00B4JNQZ49`, { waitUntil: 'networkidle' });
  ok &&= (await page.locator('.ds-detail').innerText()).includes('Duels de portefeuilles');
  await page.goto(`${BASE}/cas-concrets`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /World \+ Europe : ce que change une ligne/ }).click();
  ok &&= (await page.locator('.cc-text').innerText()) === CASES.find(item => item.id === 'world-europe-chiffre').text;
  record('Réutilisation des données', ok, 'ETF et copie frais, mobile, nouvelles périodes des duels, faits mensuels, banque et cas chiffré');
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
  await testDataReuse(page);
  await testMarketFacts(page);
  await testTweetBank(page);
  await testFactsheetTweets(page);
  await testDataSearch(page);
  await testHouseholds(page);
  await testInvestorIntroductions(page);
  await page.goto(`${BASE}/donnees-a-revoir?view=reserve&q=IBKR`, { waitUntil: 'networkidle' });
  const reviewChecks = { ibkr: (await page.locator('.dr-item').count()) === 3 };
  await page.getByRole('searchbox', { name: 'Rechercher une donnée ou un outil' }).fill('Interactive Brokers');
  await page.waitForFunction(() => new URLSearchParams(location.search).get('q') === 'Interactive Brokers' && document.querySelectorAll('.dr-item').length === 3);
  reviewChecks.search = (await page.locator('.dr-item').count()) === 3;
  await page.reload({ waitUntil: 'networkidle' });
  reviewChecks.reload = (await page.locator('.dr-item').count()) === 3;
  await page.getByRole('searchbox').fill('');
  await page.waitForFunction(() => new URLSearchParams(location.search).get('q') === '' && document.querySelectorAll('.dr-item').length === 9);
  await page.getByLabel('Afficher', { exact: true }).selectOption('deadlines');
  await page.waitForFunction(() => new URLSearchParams(location.search).get('view') === 'deadlines' && document.querySelectorAll('.dr-item').length === 3);
  reviewChecks.deadlines = (await page.locator('.dr-item').count()) === 3;
  reviewChecks.sources = (await page.getByRole('link', { name: 'Source ↗', exact: true }).count()) === 3;
  await page.setViewportSize({ width: 390, height: 844 });
  reviewChecks.mobile = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  await page.setViewportSize({ width: 1280, height: 720 });
  record('Données à revoir', Object.values(reviewChecks).every(Boolean), JSON.stringify(reviewChecks));

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
