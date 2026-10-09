#!/usr/bin/env node
import annualFx from '../src/data/annual-fx.json' with { type: 'json' };
import { computeBrut, computePoste, fmtEUR as fmtPowerEUR } from '../src/pages/purchasing-power/lib.js';
import { PRICE_OBSERVATION } from '../src/data/purchasing-power.js';
import { BROKERS as COMPARISON_BROKERS, DUELS as BROKER_DUELS, buildTweet as buildBrokerPost } from '../src/pages/broker-comparator/data.js';
import { buildReview } from '../src/pages/data-review/lib.js';
import { BROKER_EVIDENCE } from '../src/pages/broker-comparator/evidence.js';
import { BROKER_EDITORIAL } from '../src/pages/broker-comparator/editorial.js';
import { MARKET_HISTORY_REVIEW } from '../src/data/market-history-review.js';
import { choose } from './card-selection.mjs'
import { buildText } from '../src/pages/etf-sheets/lib.js';
import { getPresentationCopy } from '../src/pages/etf-sheets/editorial.js';
import { TOOLS, HOME_TOOLS } from '../src/tools.js';
import { ETFS } from '../src/data/etf-cards.js';
import { instrumentOption } from '../src/data/asset-selection.js';
import { ASSETS as PORTFOLIO_ASSETS } from '../src/data/portfolio-assets.js';
import { portfolioPostName as portfolioAssetLabel } from '../src/pages/portfolio-generator/postEditorial.js';
import { DILEMMES, SITUATIONS } from '../src/pages/tweet-midi/data/dilemmes.js';
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
import { stat, readFile, mkdir, writeFile } from "node:fs/promises";
import { DATA_CATALOG } from '../src/data/catalog.js';
import { buildCustomDuel, buildDuel, buildTweet } from '../src/pages/portfolio-duels/lib.js';
import { getRecipes } from '../src/pages/portfolio-generator/recipes.js';
import { DUELS } from "../src/pages/portfolio-duels/data.js";
import { SHEETS } from "../src/data/index-factsheets.js";
import { ASSETS as HISTORY } from '../src/data/market-history.js';
import { fmtEUR as fmtHistoryPrice, fmtPct as fmtHistoryPct } from '../src/pages/investment-calculator/lib.js';
import { TWEETS } from '../src/pages/tweet-bank/data.js';
import { EDITORIAL_CASES as CASES } from "../src/data/editorial-cases.js";

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

async function testWorkspaceNavigation(page) {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const checks = { allTools: await page.locator('.workspace-tool-card').count() === TOOLS.length };
  checks.publicationDays = (await page.locator('.workspace-publication-day').allTextContents()).sort().join('|') === TOOLS.filter(tool => tool.publicationDay).map(tool => tool.publicationDay).sort().join('|');
  checks.onlyTools = await page.locator('.workspace-search,.workspace-filters,.workspace-brand').count() === 0;
  checks.weeklyOrder = (await page.locator('.workspace-tool-card').evaluateAll(cards => cards.map(card => new URL(card.href).pathname.split('/').at(-1)))).join('|') === [...HOME_TOOLS.filter(tool => /^(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)/.test(tool.publicationDay ?? '')), ...HOME_TOOLS.filter(tool => tool.publicationDay === 'Publication ponctuelle'), ...HOME_TOOLS.filter(tool => !/^(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)/.test(tool.publicationDay ?? '') && tool.publicationDay !== 'Publication ponctuelle')].map(tool => tool.to.slice(1)).join('|');
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    checks[`overflow${width}`] = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  checks.allAccessibleOnPhone = await page.locator('.workspace-tool-card').evaluateAll(cards => cards.every(card => card.getBoundingClientRect().width > 0 && card.getBoundingClientRect().height >= 44));
  checks.noBrand = await page.locator('.workspace-brand').count() === 0;
  await page.locator('.workspace-tool-card[href$="/impact-frais"]').click();
  await page.getByRole('heading', { name: "Calculateur d'impact des frais", exact: true }).waitFor();
  await page.locator('.workspace-mobile-menu summary').click();
  await page.locator('.workspace-mobile-menu').getByRole('link', { name: 'Fiches ETF', exact: true }).click();
  await page.getByRole('group', { name: 'Choisir un ETF', exact: true }).waitFor();
  checks.menuCloses = await page.locator('.workspace-mobile-menu').getAttribute('open') === null;
  await page.reload({ waitUntil: 'networkidle' });
  checks.directLink = await page.getByRole('heading', { name: "Présentation d'ETF", exact: true }).isVisible();
  checks.mobileEtf = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  const etfPicker = page.locator('.asset-picker').first();
  await etfPicker.getByRole('searchbox').fill('S&P');
  await etfPicker.getByRole('button', { name: 'Monde', exact: true }).click();
  const worldOptions = ETFS.map(instrumentOption).filter(item => item.group === 'Monde');
  checks.categoryClearsSearch = await etfPicker.getByRole('searchbox').inputValue() === '';
  const worldId = await etfPicker.locator('[data-selector]').getAttribute('data-value');
  checks.categorySelectsMatchingEtf = worldOptions.some(item => String(item.id) === worldId);
  checks.categoryOptionsMatch = await etfPicker.locator('[data-option]').count() === worldOptions.length;
  checks.compactMobileFilters = await etfPicker.getByRole('button', { name: 'Monde', exact: true }).evaluate(button => button.getBoundingClientRect().width < button.closest('.asset-picker').getBoundingClientRect().width / 2);
  const anotherWorld = worldOptions.find(item => String(item.id) !== worldId);
  checks.worldCardsMatchFilter = await etfPicker.locator('[data-option]').count() === worldOptions.length;
  await choose(etfPicker.getByRole('group', { name: 'Choisir un ETF', exact: true }), anotherWorld.id);
  checks.presentButtonSelectsEtf = await etfPicker.locator('[data-selector]').getAttribute('data-value') === String(anotherWorld.id);
  checks.manualSelectionUpdatesPreview = (await page.locator('.es-card').textContent()).includes(ETFS.find(item => String(item.id) === String(anotherWorld.id)).name);
  const selectedEtf = await page.getByRole('group', { name: 'Choisir un ETF', exact: true }).getAttribute('data-value');
  await page.getByRole('button', { name: 'Aperçu', exact: true }).click();
  checks.focusedPreview = await page.locator('.es-card').isVisible() && !(await page.getByRole('group', { name: 'Choisir un ETF', exact: true }).isVisible());
  checks.presentedEtfSurvivesScreenSwitch = (await page.locator('.es-card').innerText()).includes(ETFS.find(item => String(item.id) === String(anotherWorld.id)).name);
  await page.getByRole('button', { name: 'Réglages', exact: true }).click();
  checks.selectionPreserved = await page.getByRole('group', { name: 'Choisir un ETF', exact: true }).getAttribute('data-value') === selectedEtf;
  // Each tool must expose a usable view on small phones without losing its mounted output.
  for (const tool of TOOLS) {
    await page.goto(`${BASE}${tool.to}`, { waitUntil: 'networkidle' });
    const switcher = page.locator('.workspace-view-switch');
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      checks[`noDropdown${tool.to}`] = await page.locator('select').count() === 0;
      checks[`settings${tool.to}${width}`] = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
      if (await switcher.count()) {
        await page.getByRole('button', { name: 'Aperçu', exact: true }).click();
        checks[`preview${tool.to}${width}`] = await page.locator('.tool-preview').isVisible()
          && !(await page.locator('.tool-settings').isVisible())
          && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
        await page.getByRole('button', { name: 'Réglages', exact: true }).click();
      }
    }
  }
  await page.goto(`${BASE}/fiches-etf`, { waitUntil: 'networkidle' });
  await page.setViewportSize({ width: 1280, height: 720 });
  checks.active = await page.locator('.workspace-sidebar').getByRole('link', { name: 'Fiches ETF', exact: true }).getAttribute('aria-current') === 'page';
  record('Accueil et navigation', Object.values(checks).every(Boolean), JSON.stringify(checks));
}

async function testCalculateur(page) {
  await page.goto(`${BASE}/calculateur-investissement`, { waitUntil: "networkidle" });
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: async text => { window.__investmentCopiedText = text; } },
  }));
  await choose(page.locator("[data-selector].ic-control").first(), "bitcoin");
  await page.getByRole('button', { name: /Copier le texte du post/ }).click();
  let conclusionsOk = /suppose d’avoir conservé le placement de janvier 2020 à/.test(await page.evaluate(() => window.__investmentCopiedText));
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

  await choose(page.locator("[data-selector].ic-control").first(), 'cac40');
  await imageButton.click();
  const annualPreview = page.getByRole('dialog', { name: 'Aperçu de l’image du placement' });
  const annualImage = (await annualPreview.locator('img').getAttribute('src'))?.startsWith('data:image/png;base64,');
  const [annualDownload] = await Promise.all([
    page.waitForEvent('download'),
    annualPreview.getByRole('link', { name: '⬇️ Télécharger le PNG' }).click(),
  ]);
  await annualPreview.getByRole('button', { name: 'Fermer l’aperçu' }).click();

  await choose(page.locator("[data-selector].ic-control").first(), "ethereum");
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
  conclusionsOk &&= /Gain rapporté aux sommes versées/.test(monthlyTweet)
    && /Le résultat porte sur l’ensemble des versements/.test(monthlyTweet)
    && !/sans versement supplémentaire/.test(monthlyTweet);
  septemberOk &&= monthlyTweet.includes('septembre 2026');
  await choose(page.locator('[data-selector].ic-control').first(), 'sp500');
  const spDca = page.getByRole('button', { name: 'Mensuel (DCA)', exact: true });
  const spDcaOk = await spDca.isEnabled();
  await spDca.click();
  await page.getByRole('button', { name: /Copier le texte du post|✓ Copié/ }).click();
  const spTweet = await page.evaluate(() => window.__investmentCopiedText);
  septemberOk &&= spTweet.includes('septembre 2026') && spTweet.includes('hors frais')
    && (await page.locator('.ic-current-level').innerText()).includes('points');
  await choose(page.locator('[data-selector].ic-control').first(), 'stoxx600');
  const stoxxDca = page.getByRole('button', { name: 'Mensuel (DCA)', exact: true });
  septemberOk &&= await stoxxDca.isEnabled();
  await stoxxDca.click();
  await page.getByRole('button', { name: /Copier le texte du post|✓ Copié/ }).click();
  const stoxxTweet = await page.evaluate(() => window.__investmentCopiedText);
  septemberOk &&= stoxxTweet.includes('septembre 2026') && stoxxTweet.includes('rapporté aux sommes versées')
    && (await page.locator('.ic-current-level').innerText()).includes('points')
    && (await page.locator('.ic-method-note').innerText()).includes('dividendes nets');
  await choose(page.locator('[data-selector].ic-control').first(), 'msciWorld');
  const worldDca = page.getByRole('button', { name: 'Mensuel (DCA)', exact: true });
  septemberOk &&= await worldDca.isEnabled();
  await worldDca.click();
  await page.getByRole('button', { name: /Copier le texte du post|✓ Copié/ }).click();
  const worldTweet = await page.evaluate(() => window.__investmentCopiedText);
  septemberOk &&= worldTweet.includes('septembre 2026') && worldTweet.includes('rapporté aux sommes versées')
    && (await page.locator('.ic-current-level').innerText()).includes('points')
    && (await page.locator('.ic-method-note').innerText()).includes('MSCI World Gross Return');
  for (const [id, name, variant] of [['msciEmerging', 'MSCI Emerging Markets', 'Gross Return'], ['msciWorldSmallCap', 'MSCI World Small Cap', 'Gross Return'], ['msciAcwiImi', 'MSCI ACWI IMI', 'Net Return'], ['msciAcwi', 'MSCI ACWI', 'Net Return'], ['msciWorldExUsa', 'MSCI World ex USA', 'Net Return']]) {
    await choose(page.locator('[data-selector].ic-control').first(), id);
    const dca = page.getByRole('button', { name: 'Mensuel (DCA)', exact: true });
    septemberOk &&= await dca.isEnabled();
    await dca.click();
    await page.getByRole('button', { name: /Copier le texte du post|✓ Copié/ }).click();
    const post = await page.evaluate(() => window.__investmentCopiedText);
    septemberOk &&= post.includes(name) && post.includes('septembre 2026') && post.includes(variant)
      && post.includes('rapporté aux sommes versées') && !/NaN|undefined/.test(post)
      && (await page.locator('.ic-current-level').innerText()).includes('points')
      && (await page.locator('.ic-method-note').innerText()).includes(`${name} ${variant}`);
  }
  await choose(page.locator('[data-selector].ic-control').first(), 'or');
  septemberOk &&= (await page.locator('.ic-current-level').innerText()).includes('septembre 2026');
  await page.getByRole('button', { name: /Copier le texte du post|✓ Copié/ }).click();
  septemberOk &&= (await page.evaluate(() => window.__investmentCopiedText)).includes('En septembre 2026');
  await choose(page.locator("[data-selector].ic-control").first(), "lvmh");
  await page.waitForTimeout(150);
  const text = await page.locator("body").innerText();
  const badgeOk = !/non vérifiées avant/.test(text);
  const dcaBlockOk = !/DCA non disponible pour LVMH/.test(text) && await page.getByRole('button', { name: 'Mensuel (DCA)', exact: true }).isEnabled();

  let companiesOk = true;
  for (const id of ['berkshire', 'asml', 'costco', 'mcdonalds', 'airliquide', 'schneider', 'hermes', 'loreal', 'intel', 'paypal', 'lvmh', 'nvidia', 'amazon', 'google', 'meta', 'nestle', 'sap', 'visa', 'netflix', 'cocacola', 'euroMoney', 'euroGovShort', 'euroGov13', 'globalBondEur', 'euroInflationBond', 'euroCorporateBond', 'euroHighYieldBond']) {
    await choose(page.locator('[data-selector].ic-control').first(), id);
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
  const image = page.locator('.pg-image-download');
  const firstImage = await image.getAttribute('href');
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
  const newImage = await image.getAttribute('href');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: '⬇️ Télécharger l’image PNG' }).click(),
  ]);
  const imageOk = firstImage?.startsWith('data:image/png;base64,') && newImage?.startsWith('data:image/png;base64,') && firstImage !== newImage && download.suggestedFilename() === 'repartition-portefeuille.png';
  const autoTweet = await page.locator(".pg-tweet-body").innerText();
  const dataLabelsOk = await page.locator('.pg-confidence-badge').count() === 0 && await page.getByText('Sources et méthode', {exact:true}).count() === 1;
  const { YEARS: portfolioYears, getAsset: portfolioAsset } = await import('../src/data/portfolio-assets.js');
  const { annualizedReturn, formatPerformance } = await import('../src/pages/portfolio-generator/performance.js');
  const autoPerformanceOk = portfolioYears.every(year => new RegExp(`${year} : [＋+−-]?[0-9]+,[0-9] %`).test(autoTweet))
    && /Performance annualisée \(2020 à 2025\) : [＋+−-]?[0-9]+,[0-9] % par an/.test(autoTweet);
  const autoEditorialOk = autoPerformanceOk && dataLabelsOk && /portefeuille illustratif|exemple illustratif/i.test(autoTweet) && !/La logique de l’ensemble|💡/.test(autoTweet);
  // Un profil/palier fixé doit faire tourner toutes les constructions disponibles.
  await page.getByRole('group', { name: "Choisir un profil d'investisseur" }).getByRole('button', { name: 'Le Généraliste', exact: true }).click();
  await page.getByRole('group', { name: 'Choisir un niveau de risque cible' }).getByRole('button', { name: 'Équilibré', exact: true }).click();
  const recipesSeen = new Set();
  let lastRecipe = null, recipesOk = true;
  const expectedRecipes = getRecipes('generaliste', 'equilibre').length;
  for (let i = 0; i < expectedRecipes * 2; i++) {
    await page.getByRole('button', { name: /Générer un nouveau portefeuille/i }).click();
    const label = await page.locator('.pg-recipe-label').innerText();
    recipesOk &&= label !== lastRecipe;
    recipesSeen.add(label); lastRecipe = label;
    recipesOk &&= !/undefined|NaN/.test(await page.locator('.pg-tweet-body').innerText());
    const weights = await page.locator('.pg-alloc-pct').allInnerTexts();
    recipesOk &&= weights.reduce((sum, text) => sum + parseFloat(text), 0) === 100;
  }
  recipesOk &&= recipesSeen.size === expectedRecipes;
  await page.setViewportSize({ width: 390, height: 844 });
  recipesOk &&= await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByRole("button", { name: /Composition manuelle/ }).click();
  await choose(page.locator("#pg-manual-profile"), "crypto_curieux");
  await page.locator("#pg-manual-search").fill("Fonds euros");
  await page.locator(".pg-manual-asset-option").filter({ hasText: "Fonds euros (assurance-vie)" }).click();
  await page.locator(".pg-manual-pct-input").fill("100");
  await page.getByRole("button", { name: "Générer le tweet", exact: true }).click();
  const manualTweet = await page.locator(".pg-tweet-body").innerText();
  let manualEditorialOk = /portefeuille illustratif/i.test(manualTweet) && /100 %/.test(manualTweet) && /toute l’épargne/i.test(manualTweet) && !/La logique de l’ensemble/.test(manualTweet) && !/Bitcoin|Ethereum/.test(manualTweet);
  const euroPerf = Object.fromEntries(portfolioYears.map((year, i) => [year, portfolioAsset('fonds_euros').r[i]]));
  manualEditorialOk &&= portfolioYears.every(year => manualTweet.includes(`${year} : ${formatPerformance(euroPerf[year])}`))
    && manualTweet.includes(`Performance annualisée (2020 à 2025) : ${formatPerformance(annualizedReturn(euroPerf))} par an`);
  const manualStages = { single: manualEditorialOk };
  await page.getByRole('button', { name: /Modifier la composition/ }).click();
  await page.locator('.pg-manual-pct-input').fill('50');
  await page.locator('#pg-manual-search').fill('Bitcoin');
  await page.locator('.pg-manual-asset-option').first().click();
  await page.locator('.pg-manual-pct-input').last().fill('50');
  await page.getByRole('button', { name: 'Générer le tweet', exact: true }).click();
  const cryptoTweet = await page.locator('.pg-tweet-body').innerText();
  manualEditorialOk &&= /portefeuille illustratif/i.test(cryptoTweet) && /50% .*Bitcoin/.test(cryptoTweet) && !/à la carte/i.test(cryptoTweet);
  manualStages.crypto = manualEditorialOk;
  await page.getByRole('button', { name: /Modifier la composition/ }).click();
  await page.locator('.pg-manual-remove').first().click();
  await page.locator('#pg-manual-search').fill('Amundi MSCI World UCITS ETF');
  await page.locator('.pg-manual-asset-option').first().click();
  await page.locator('.pg-manual-pct-input').last().fill('50');
  await page.getByRole('button', { name: 'Générer le tweet', exact: true }).click();
  const worldBitcoinTweet = await page.locator('.pg-tweet-body').innerText();
  manualEditorialOk &&= /portefeuille illustratif/i.test(worldBitcoinTweet) && /50% .*Bitcoin/.test(worldBitcoinTweet) && /50 %/.test(worldBitcoinTweet);
  manualStages.worldBitcoin = manualEditorialOk;
  await page.getByRole('button', { name: /Nouveau texte, même composition/ }).click();
  const rotatedTweet = await page.locator('.pg-tweet-body').innerText();
  manualEditorialOk &&= rotatedTweet !== worldBitcoinTweet && /portefeuille illustratif/i.test(rotatedTweet);
  await page.getByRole('button', { name: /Modifier la composition/ }).click();
  await page.locator('.pg-manual-pct-input').first().fill('10');
  await page.locator('.pg-manual-pct-input').last().fill('30');
  await page.locator('#pg-manual-search').fill('Fonds euros');
  await page.locator('.pg-manual-asset-option').filter({ hasText: 'Fonds euros (assurance-vie)' }).click();
  await page.locator('.pg-manual-pct-input').last().fill('60');
  await page.getByRole('button', { name: 'Générer le tweet', exact: true }).click();
  const personalTweet = await page.locator('.pg-tweet-body').innerText();
  manualEditorialOk &&= /portefeuille illustratif/i.test(personalTweet)
    && /60 % de fonds euros/.test(personalTweet)
    && /10% .*Bitcoin/.test(personalTweet)
    && /💬 Que penses-tu de ce portefeuille \?/.test(personalTweet)
    && personalTweet.indexOf('60% Fonds euros') < personalTweet.indexOf('30% Amundi MSCI World')
    && personalTweet.indexOf('30% Amundi MSCI World') < personalTweet.indexOf('10% CoinShares Physical Bitcoin')
    && /Bitcoin représente 10 %.*60 % de fonds euros/s.test(personalTweet);
  manualStages.personal = manualEditorialOk;
  // Les corrections éditoriales doivent aussi traverser l’interface manuelle.
  for (const [rows, expected] of [
    [[['qyld_ucits',37],['high_dividend_dist',39],['oblig_etat_us',24]], [/options.*hausse.*primes/s,/dividendes/,/obligations/]],
    [[['msci_acwi',50],['msci_em',30],['oblig_etat_eur_short',20]], [/émergents.*déjà présents/s,/obligations/]],
  ]) {
    await page.getByRole('button', { name: /Modifier la composition/ }).click();
    while (await page.locator('.pg-manual-remove').count()) await page.locator('.pg-manual-remove').first().click();
    for (const [id,pct] of rows) {
      const asset = PORTFOLIO_ASSETS.find(a=>a.id===id);
      await page.locator('#pg-manual-search').fill(asset.name);
      await page.locator(`.pg-manual-asset-option[data-asset-id="${id}"]`).click();
      await page.locator('.pg-manual-pct-input').last().fill(String(pct));
    }
    await page.getByRole('button', { name: 'Générer le tweet', exact: true }).click();
    const reviewedTweet = await page.locator('.pg-tweet-body').innerText();
    const logic = reviewedTweet;
    manualEditorialOk &&= expected.every(re=>re.test(logic))
      && !/assez pour compter dans le résultat|valeur refuge par excellence/.test(reviewedTweet)
      && /📌/.test(reviewedTweet);
  }
  // Rendements officiels : aucune étiquette de proxy créée par le mot « simulation ».
  for (const id of ['nasdaq100_ishares', 'argent']) {
    await page.getByRole('button', { name: /Modifier la composition/ }).click();
    while (await page.locator('.pg-manual-remove').count()) await page.locator('.pg-manual-remove').first().click();
    const asset = PORTFOLIO_ASSETS.find(a=>a.id===id);
    await page.locator('#pg-manual-search').fill(asset.name);
    await page.locator(`.pg-manual-asset-option[data-asset-id="${id}"]`).click();
    await page.locator('.pg-manual-pct-input').fill('100');
    await page.getByRole('button', { name: 'Générer le tweet', exact: true }).click();
    const labels = await page.locator('.pg-data-label').allInnerTexts();
    manualEditorialOk &&= labels.length === 1 && labels[0] === 'Données en USD';
    if (id === 'argent') {
      const expected = ((1 + asset.r[5] / 100) * annualFx.years[2024].value / annualFx.years[2025].value - 1) * 100;
      const displayed = parseFloat((await page.locator('.pg-bar-value').last().innerText()).replace(',', '.'));
      manualEditorialOk &&= Math.abs(displayed - expected) < .051;
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  manualEditorialOk &&= await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  await page.setViewportSize({ width: 1280, height: 720 });
  record("Générateur de portefeuilles", sumOk && hasContent && categoriesOk && imageOk && autoEditorialOk && manualEditorialOk && recipesOk, `somme des lignes: ${sum.toFixed(1)}%, catégories: ${categorySum.toFixed(1)}%, image actualisée et téléchargée: ${imageOk}, constructions disponibles et mobile: ${recipesOk}, accroches auto: ${autoEditorialOk}, intitulés manuels et rotation: ${manualEditorialOk}, étapes: ${JSON.stringify(manualStages)}`);
}

async function testPortfolioDuels(page) {
  await page.goto(`${BASE}/duels-portefeuilles`, { waitUntil: 'networkidle' });
  const select = page.locator('#pd-select');
  let valid = (await select.locator('[data-option]').count()) === DUELS.length;
  for (let index = 0; index < DUELS.length; index++) {
    await choose(select, String(index));
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
  await choose(page.getByRole('group', { name: 'Complément du portefeuille A', exact: true }), '');
  await page.getByRole('spinbutton', { name: 'Poids base du portefeuille A' }).fill('100');
  valid &&= (await page.locator('.pd-card').first().locator('p').count()) === 1;
  await choose(page.getByRole('group', { name: 'Thématique du portefeuille A', exact: true }), 'sect_cyber_lg');
  await page.getByRole('spinbutton', { name: 'Poids base du portefeuille A' }).fill('90');
  valid &&= /cybersécurité/i.test(await page.locator('#pd-tweet').inputValue());
  await choose(page.getByRole('group', { name: 'Complément du portefeuille A', exact: true }), 'stoxx600_bnp');
  await page.getByRole('spinbutton', { name: 'Poids base du portefeuille A' }).fill('80');
  const customExpected = buildCustomDuel({
    left: [{ id: 'msci_world_ishares', pct: 80 }, { id: 'stoxx600_bnp', pct: 10 }, { id: 'sect_cyber_lg', pct: 10 }],
    right: [{ id: 'msci_acwi_ishares', pct: 100 }],
  });
  valid &&= (await page.locator('.pd-table tbody tr').count()) === customExpected.years.length;
  valid &&= (await page.locator('#pd-tweet').inputValue()) === buildTweet(customExpected);
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
  const select = page.locator("[data-selector]").first();
  const defaultEtf = await select.getAttribute('data-value');
  const count = await select.locator("[data-option]").count();
  let badCount = 0;
  for (let i = 0; i < count; i++) {
    await choose(select, { index: i });
    await page.waitForTimeout(40);
    // textContent vérifie le contenu des rubriques sans la mise en capitales CSS des titres.
    const text = await page.locator(".es-card").textContent();
    if (/undefined|NaN/.test(text)) badCount++;
    const selectedId = await select.getAttribute('data-value');
    const card = getPresentationCopy(ETFS.find(item => item.id === selectedId));
    if (!text.includes(card.hook)) badCount++;
    const accounts = await page.locator('.es-facts li').filter({ hasText: 'CTO :' }).textContent();
    if (accounts.includes('PEA') !== (card.pea === true)) badCount++;
    if (card.listing && !text.includes(`Cotation : ${card.listing.exchange} · ${card.listing.currency}`)) badCount++;
    const sectionLabels = ['🔍 Ce que tu achètes', '✅ L’intérêt de cette exposition', '⚠️ Ce qu’il faut garder en tête'];
    const explanations = [card.whatIs, card.whyInteresting, card.whatToKnow, ...(card.closing ? [card.closing] : [])];
    if (!explanations.every(value => value && text.includes(value))
      || !sectionLabels.every(label => text.includes(label))) badCount++;
    await page.getByRole('button', { name: /📋 Copier le texte|✅ Copié !/ }).click();
    const copied = await page.evaluate(() => window.__etfCopiedText);
    const sectionPositions = sectionLabels.map(label => copied?.indexOf(label) ?? -1);
    if (copied !== buildText(card) || !copied?.startsWith(card.hook + "\n\n") || !copied.includes(card.name)
      || !copied.includes(card.isin) || !copied.includes(card.ter) || !copied.includes(card.hook)
      || (copied.includes('PEA') !== (card.pea === true))
      || !explanations.every(value => copied.includes(value))
      || !sectionPositions.every((position, index) => position >= 0 && (index === 0 || position > sectionPositions[index - 1]))
      || !copied.endsWith('💬 ' + card.question)
      || /undefined|NaN/.test(copied)) badCount++;
    if (card.lastVerified === '01/10/2026') {
      for (const buttonName of ['🖼️ Image récapitulative']) {
        await page.locator('.workspace-action-menu summary').click();
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
  await choose(select, 'sp500');
  await page.locator('.workspace-action-menu summary').click();
  if (await page.getByRole('button', { name: /graphique annuel/i }).count()) badCount++;
  await page.getByRole('button', { name: '🖼️ Image récapitulative' }).click();
  const preview = page.getByRole('dialog');
  const imageOk = (await preview.locator('img').getAttribute('src'))?.startsWith('data:image/png;base64,');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    preview.getByRole('button', { name: '⬇️ Télécharger' }).click(),
  ]);
  await preview.getByRole('button', { name: "Fermer l'aperçu" }).click();
  record("Fiches ETF", badCount === 0 && defaultEtf === 'sp500' && imageOk && download.suggestedFilename() === 'sp500-fiche-etf.png',
    `${count} fiches et textes copiés personnalisés, défaut ${defaultEtf}, ${badCount} erreur(s), aperçu et téléchargement PNG`);
}

async function testBrokerComparator(page) {
  await page.goto(`${BASE}/comparatif-courtiers`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('.bc-versus-canvas')?.width === 1600);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Télécharger l’image PNG' }).click(),
  ]);
  const image = await page.locator('.bc-versus-canvas').evaluate(canvas => canvas.toDataURL('image/png'));
  let valid = download.suggestedFilename() === 'duel-courtiers-tr-bourso.png' && image.length > 30000;
  for (const { a, b } of BROKER_DUELS) {
    const code = id => COMPARISON_BROKERS.find(broker => broker.id === id).code;
    await page.locator('.bc-duel-chip').filter({ hasText: `${code(a)} vs ${code(b)}` }).click();
    const expected = buildBrokerPost([a, b]);
    await page.waitForFunction(expected => document.querySelector('.bc-tweet-textarea')?.value === expected, expected);
    valid &&= (await page.locator('.bc-evidence-broker').count()) === 2;
  }
  await page.locator('.bc-duel-chip').filter({ hasText: 'XTB vs SX' }).click();
  const post = await page.locator('.bc-tweet-textarea').inputValue();
  const outgoing = BROKER_EDITORIAL.xtb.sortant === BROKER_EDITORIAL.saxo.sortant
    ? `Pour quitter l’un ou l’autre : ${BROKER_EDITORIAL.xtb.sortant}`
    : `Pour quitter XTB : ${BROKER_EDITORIAL.xtb.sortant}\n\nPour quitter Saxo : ${BROKER_EDITORIAL.saxo.sortant}`;
  valid &&= post.startsWith('⚫ XTB ou ⚪ Saxo pour ton PEA ?')
    && post.includes(`💱 Si une conversion est nécessaire\n\nXTB : ${BROKER_EVIDENCE.xtb.change.post}\n\nSaxo : ${BROKER_EVIDENCE.saxo.change.post}`)
    && post.includes('PEA Jeune : aucun des deux ❌')
    && post.includes(BROKER_EVIDENCE.xtb.ifu.summary) && post.includes(BROKER_EVIDENCE.saxo.ifu.summary)
    && post.includes(outgoing);
  await page.locator('.bc-evidence-broker').last().locator('summary').click();
  valid &&= (await page.locator('.bc-evidence').innerText()).includes('VIP')
    && (await page.locator('.bc-evidence').innerText()).includes('Conversion de devises');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: async text => { window.__brokerCopied = text; } },
  }));
  const edited = post.replace('pour ton PEA ?', 'pour mon PEA ?');
  await page.locator('.bc-tweet-textarea').fill(edited);
  await page.getByRole('button', { name: 'Copier le tweet', exact: true }).click();
  valid &&= await page.evaluate(expected => window.__brokerCopied === expected, edited);
  await page.locator('.bc-duel-chip').filter({ hasText: 'TR vs IBKR' }).click();
  valid &&= (await page.locator('.bc-tweet-textarea').inputValue()) === buildBrokerPost(['tr', 'ibkr']);
  await page.setViewportSize({ width: 390, height: 844 });
  valid &&= await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  await page.setViewportSize({ width: 1280, height: 720 });
  record('Comparatif courtiers', valid, '28 duels : texte court, réserves, sources, copie après modification et image PNG');
}

async function testTweetMidi(page) {
  await page.goto(`${BASE}/tweet-midi`, { waitUntil: "networkidle" });
  const formats = ["Dilemme", "Fiche lexique", "Comparatif ETF", "Il y a X ans", "Performance depuis", "Pouvoir d'achat"];
  let failed = [];
  for (const label of formats) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.waitForTimeout(150);
    const text = await page.locator("body").innerText();
    if (text.length < 500) failed.push(label);
  }
  await page.getByRole('button', { name: 'Dilemme', exact: true }).click();
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: async text => { window.__dilemmeCopied = text; } },
  }));
  for (const situation of SITUATIONS) {
    await choose(page.locator('#subject-select'), situation.id);
    await page.getByRole('button', { name: '🔄 Générer', exact: true }).click();
    const post = await page.locator('pre').innerText();
    const variant = DILEMMES.find(d => d.situationId === situation.id && post.startsWith(d.contexteTexte) && post.includes(d.tension));
    const expected = variant && [variant.contexteTexte, `${variant.choix} 👇`,
      `🅰️ ${variant.optionA}`, `🅱️ ${variant.optionB}`, variant.tension, `💬 ${variant.question}`].join('\n\n');
    await page.getByRole('button', { name: /Copier le texte|Copié ✓/ }).click();
    if (post !== expected || (await page.evaluate(() => window.__dilemmeCopied)) !== expected
        || !post.split('\n').at(-1).startsWith('💬 A ou B')) failed.push(`Dilemme : ${situation.id}`);
  }
  await page.getByRole("button", { name: "Il y a X ans", exact: true }).click();
  await choose(page.locator("#subject-select"), "bitcoin");
  await choose(page.locator("#secondary-select"), "1");
  await page.getByRole("button", { name: "🔄 Générer", exact: true }).click();
  await page.locator("#niveau-actuel").fill(String(HISTORY.bitcoin.points.at(-1).price));
  const past = new Date();
  const pastYm = `${past.getFullYear() - 1}-${String(past.getMonth() + 1).padStart(2, "0")}`;
  const historical = HISTORY.bitcoin.points.find(p => p.date === pastYm);
  const anniversary = await page.locator("pre").innerText();
  if (historical && !anniversary.includes(fmtHistoryPrice(historical.price, "USD"))) failed.push("Il y a X ans : clôture historique Bitcoin");
  for (const id of ['berkshire', 'asml']) {
    await choose(page.locator('#subject-select'), id);
    await choose(page.locator('#secondary-select'), '1');
    await page.getByRole('button', { name: '🔄 Générer', exact: true }).click();
    await page.locator('#niveau-actuel').fill(String(HISTORY[id].anniversaryPoints.at(-1).price));
    const raw = HISTORY[id].anniversaryPoints.find(p => p.date === pastYm);
    const post = await page.locator('pre').innerText();
    if (!post.includes(fmtHistoryPrice(raw.price, HISTORY[id].currency)) || /NaN|undefined/.test(post)) failed.push(`${id} : prix brut anniversaire`);
  }
  await page.getByRole("button", { name: "Performance depuis", exact: true }).click();
  await choose(page.locator('#subject-select'), 'sp500');
  await choose(page.locator('#secondary-select'), '2016');
  await page.getByRole("button", { name: "🔄 Générer", exact: true }).click();
  const performance = await page.locator('pre').innerText();
  const minimal = /^📈 Performance du S&P 500 depuis 2016 👇\nTotal Return · USD · dividendes bruts réinvestis\n\n/u.test(performance)
    && performance.split('\n').at(-1).startsWith('Cumulé sur la période : ')
    && !/💬|Livret A|Cours en dollars/u.test(performance)
    && (await page.getByRole('checkbox').count()) === 0;
  if (!minimal) failed.push('Performance depuis : format minimal');
  await choose(page.locator('#subject-select'), 'stoxx600');
  await page.getByRole('button', { name: '🔄 Générer', exact: true }).click();
  const stoxxPerformance = await page.locator('pre').innerText();
  const stoxxAnnual = (HISTORY.stoxx600.points.find(p => p.date === '2025-12').price
    / HISTORY.stoxx600.points.find(p => p.date === '2024-12').price - 1) * 100;
  if (!stoxxPerformance.includes(`2025 : ${fmtHistoryPct(stoxxAnnual)}`)
      || stoxxPerformance.includes('2026 :')) failed.push('Performance depuis : historique officiel STOXX');
  await page.getByRole("button", { name: "Comparatif (2 actifs)", exact: true }).click();
  await choose(page.locator('#subject-select-a'), 'sp500');
  await choose(page.locator('#subject-select-b'), 'bitcoin');
  await page.getByRole("button", { name: "🔄 Générer", exact: true }).click();
  const comparison = await page.locator('pre').innerText();
  if ((comparison.match(/^📈 Performance /gmu) ?? []).length !== 2
      || (comparison.match(/^Cumulé sur la période : /gmu) ?? []).length !== 2
      || comparison.includes('💬')) failed.push('Performance depuis : comparatif');
  await page.getByRole('button', { name: 'Performance depuis', exact: true }).click();
  for (const id of ['berkshire', 'asml', 'costco', 'mcdonalds', 'airliquide', 'schneider', 'hermes', 'loreal', 'intel', 'paypal', 'lvmh', 'nvidia', 'amazon', 'google', 'meta', 'nestle', 'sap', 'visa', 'netflix', 'cocacola', 'euroMoney', 'euroGovShort', 'euroGov13', 'globalBondEur', 'euroInflationBond', 'euroCorporateBond', 'euroHighYieldBond']) {
    await choose(page.locator('#subject-select'), id);
    await choose(page.locator('#secondary-select'), '2020');
    await page.getByRole('button', { name: '🔄 Générer', exact: true }).click();
    const post = await page.locator('pre').innerText();
    if (!post.includes('2025 :') || post.includes('2026 :') || /NaN|undefined/.test(post)) failed.push(`Nouvelle entreprise ${id}`);
  }
  await page.getByRole('button', { name: "Pouvoir d'achat", exact: true }).click();
  await choose(page.locator('[data-selector]'), '2025');
  await page.getByRole('button', { name: '1000 €', exact: true }).click();
  for (const [poste, expected] of [[null, fmtPowerEUR(computeBrut(1000, 2025).newAmount)], ['Alimentation', fmtPowerEUR(computePoste(1000, 2025, 'alimentation').newAmount)], ['Énergie', fmtPowerEUR(computePoste(1000, 2025, 'carburant').newAmount)]]) {
    if (poste) {
      await page.getByRole('button', { name: 'Par poste', exact: true }).click();
      await page.getByRole('button', { name: new RegExp(poste) }).click();
    } else await page.getByRole('button', { name: "Revenu nécessaire", exact: true }).click();
    await page.getByRole('button', { name: '🔄 Générer', exact: true }).click();
    const post = await page.locator('pre').innerText();
    if (!post.includes(expected) || !post.includes(PRICE_OBSERVATION.label) || post.includes('provisoire') !== PRICE_OBSERVATION.provisional || /12 mois glissants|NaN|undefined/.test(post)) failed.push(`Pouvoir d’achat ${poste ?? 'général'} : observation datée`);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Télécharger.*image|Télécharger.*PNG/i }).click(),
    ]);
    if (!(await download.path())) failed.push(`Pouvoir d’achat ${poste ?? 'général'} : PNG`);
  }
  record("Tweet Midi", failed.length === 0, failed.length ? `formats sans contenu suffisant: ${failed.join(", ")}` : `${formats.length} formats cyclés`);
}

async function testFeeImpact(page) {
  await page.goto(`${BASE}/impact-frais`, { waitUntil: "networkidle" });
  const preview = page.locator('.fi-preview-text');
  const initial = await preview.innerText();
  let editorialOk = /^💸 22\s115\s€ de moins après 20 ans/.test(initial)
    && /153\s402\s€/.test(initial) && /131\s287\s€/.test(initial)
    && /Dans les deux cas, tu as versé 72\s000\s€/.test(initial)
    && initial.includes('ils comprennent aussi ces gains manqués')
    && initial.includes('Tu connais le montant des frais annuels de tes placements ?')
    && initial.includes('Hypothèse de rendement constant')
    && !/Brouillon|à compléter|Quand je vois ça|Tu connais celui/.test(initial);
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
  editorialOk &&= (await preview.innerText()).includes('capitaux simulés sont identiques') && !(await preview.innerText()).includes('gains manqués');
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
    && drawing.width === 1600 && drawing.height === 1600 && drawing.png
    && download.suggestedFilename() === "epargnant-libre-impact-des-frais.png" && file.size > 10000;
  record("Impact des frais", ok, "texte validé, chiffres, copie, frais inversés/égaux, personnalisation, génération et PNG");
}

async function testMarketFacts(page) {
  await page.goto(`${BASE}/faits-marquants-marches`, { waitUntil: "networkidle" });
  const select = page.locator("[data-selector]").first();
  const count = await select.locator("[data-option]").count();
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
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: async text => { window.__marketFactsCopied = text; } },
  }));
  for (let i = 0; i < count; i++) {
    await choose(select, { index: i });
    await page.waitForTimeout(40);
    const text = await page.locator("body").innerText();
    const tweet = await page.locator('.mf-fact-text').innerText();
    const evidence = await page.locator('.mf-details').innerText();
    await page.getByRole('button', { name: /Copier le texte|Copié/ }).click();
    const copied = await page.evaluate(() => window.__marketFactsCopied);
    if (/undefined|NaN/.test(text) || !/Source :/.test(evidence)
      || /Source\s*:|https?:\/\//i.test(tweet) || copied !== tweet
      || !/\d/.test(tweet.split('\n')[0]) || !tweet.split('\n').at(-1).startsWith('💬')) badCount++;
  }
  record("Faits marquants des marchés", badCount === 0, `${count} faits : accroches chiffrées, copie sans source, sources consultables et question finale ; ${badCount} échec(s)`);
}

async function testTweetBank(page) {
  await page.goto(`${BASE}/banque-tweets`, { waitUntil: "networkidle" });
  const totalBefore = await page.locator(".tb-summary-num").first().innerText();
  await page.locator(".tb-tweet-actions button:not(:disabled)", { hasText: "Marquer publié aujourd" }).first().click();
  await page.waitForTimeout(150);
  const cooldownCount = (await page.locator(".tb-summary-num").allInnerTexts())[1];
  const badge = await page.locator(".tb-pub-badge.cooldown").first().count();
  let ok = Number(totalBefore) === TWEETS.length && cooldownCount === "1" && badge === 1;
  const datedCard = page.locator('[data-tweet-id="43"]');
  const copyButton = datedCard.getByRole('button', {name:'📋 Copier', exact:true});
  ok &&= await copyButton.isDisabled();
  const referenceDate = await page.evaluate(() => new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/Paris', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date()));
  await datedCard.locator('.tb-tweet-text').fill('Mon bilan actualisé : 79 000 € de patrimoine.');
  await datedCard.locator('.tb-review input[type="date"]').fill(referenceDate);
  await datedCard.locator('.tb-review input[type="checkbox"]').check();
  ok &&= await copyButton.isEnabled();
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable:true, value:{writeText:async text => {window.__bankCopied=text;}} }));
  await copyButton.click();
  ok &&= (await page.evaluate(()=>window.__bankCopied)) === `Mon bilan actualisé : 79 000 € de patrimoine.\n\n📅 Bilan personnel arrêté au ${referenceDate}.`;
  await page.reload({waitUntil:'networkidle'});
  const savedCard = page.locator('[data-tweet-id="43"]');
  ok &&= (await savedCard.locator('.tb-tweet-text').inputValue()) === 'Mon bilan actualisé : 79 000 € de patrimoine.';
  ok &&= await savedCard.getByRole('button', {name:'📋 Copier',exact:true}).isEnabled();
  await savedCard.locator('.tb-tweet-text').fill('Mon bilan modifié après vérification.');
  ok &&= await savedCard.getByRole('button', {name:'📋 Copier',exact:true}).isDisabled();
  await savedCard.getByRole('button', {name:'Revenir au texte archivé'}).click();
  await page.getByRole('button', {name:'Pédagogie',exact:true}).click();
  const cards = page.locator('.tb-tweet');
  ok &&= (await cards.count()) === CASES.length;
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable:true, value:{writeText:async text => {window.__pedagogyCopied=text;}},
  }));
  for (let i=0; i<CASES.length; i++) {
    const card=cards.nth(i);
    const actual=await card.locator('.tb-tweet-text').inputValue();
    const item=CASES.find(item=>item.text===actual);
    ok &&= Boolean(item) && (await card.locator('.tb-sources a').count()) === item.sources.length;
    await card.locator('.tb-tweet-actions button').first().click();
    ok &&= (await page.evaluate(()=>window.__pedagogyCopied)) === actual;
  }
  await page.setViewportSize({width:390,height:844});
  ok &&= await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth);
  await page.setViewportSize({width:1280,height:720});
  record("Banque de tweets", ok, `total: ${totalBefore}, cooldown et ${CASES.length} textes pédagogiques avec sources, copie fidèle et mobile`);
}

async function testFactsheetTweets(page) {
  await page.goto(`${BASE}/tweets-factsheets`, { waitUntil: 'networkidle' });
  const select = page.locator('#factsheet-subject');
  const draft = page.locator('#factsheet-draft');
  const count = await select.locator('[data-option]').count();
  let ok = count === SHEETS.length;
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: async text => { window.__factsheetCopied = text; } },
  }));
  for (let index = 0; index < count; index++) {
    await choose(select, SHEETS[index].id);
    const tweet = await draft.inputValue();
    const checks = {
      constituents: tweet.includes((SHEETS[index].constituents ?? SHEETS[index].indexFacts.targetConstituents).toLocaleString('fr-FR')),
      annualReturns: tweet.includes('2025'),
      sectors: /Les (principaux )?secteurs|La pondération/.test(tweet),
      validText: !/undefined|NaN/.test(tweet),
      sources: (await page.locator('.fs-sources a').count()) >= 1,
      sections: ['🌍 La répartition', '📈 Les performances', '📌 Ce que ça signifie'].every(label => tweet.includes(label)),
      noOldDateInTweet: !tweet.includes('31 août 2026'),
      currentSnapshot: (await page.locator('.fs-meta').innerText()).includes(SHEETS[index].snapshot),
    };
    if (Object.values(checks).some(value => !value)) console.log(`    Fiche ${SHEETS[index].id}: ${JSON.stringify(checks)}`);
    ok &&= Object.values(checks).every(Boolean);
    await page.getByRole('button', { name: /📋 Copier le texte|✅ Copié/ }).click();
    ok &&= (await page.evaluate(() => window.__factsheetCopied)) === tweet;
  }
  await draft.fill('Texte corrigé avant publication');
  await page.locator('.workspace-action-menu summary').click();
  await page.getByRole('button', { name: /Rétablir le modèle/ }).click();
  ok &&= (await draft.inputValue()).includes('2025');
  await page.locator('.workspace-action-menu summary').click();
  await page.getByRole('button', { name: /Prévisualiser l’image PNG/ }).click();
  const preview = page.getByRole('dialog', { name: 'Aperçu de la fiche PNG' });
  await preview.waitFor({ state: 'visible' });
  ok &&= await preview.isVisible();
  const dimensions = await preview.locator('img').evaluate(async (img) => {
    await img.decode();
    return [img.naturalWidth, img.naturalHeight];
  });
  ok &&= dimensions[0] === 2400 && dimensions[1] === 1620;
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    preview.getByRole('link', { name: /Télécharger le PNG/ }).click(),
  ]);
  ok &&= download.suggestedFilename().endsWith('.png');
  await page.getByRole('button', { name: 'Fermer l’aperçu' }).click();
  for (const id of ['sp500-equal-weight', 'russell-2000', 'em-standard', 'topix', 'nikkei225', 'acwi', 'em-esg', 'stoxx600']) {
    await choose(select, id);
    await page.locator('.workspace-action-menu summary').click();
  await page.getByRole('button', { name: /Prévisualiser l’image PNG/ }).click();
    const current = page.getByRole('dialog', { name: 'Aperçu de la fiche PNG' });
    ok &&= await current.locator('img').evaluate(async (img) => {
      await img.decode();
      return img.naturalWidth === 2400 && img.naturalHeight === 1620;
    });
    if (['sp500-equal-weight', 'russell-2000'].includes(id)) {
      await mkdir('test-artifacts', { recursive: true });
      const data = await current.locator('img').getAttribute('src');
      await writeFile(`test-artifacts/${id}.png`, Buffer.from(data.split(',')[1], 'base64'));
    }
    await page.getByRole('button', { name: 'Fermer l’aperçu' }).click();
  }
  await choose(select, 'sp500-equal-weight');
  await page.setViewportSize({ width: 390, height: 844 });
  ok &&= await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  await page.screenshot({ path: 'test-artifacts/coulisses-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 720 });
  record('Dans les coulisses des indices', ok, `${count} fiches, modification et réinitialisation vérifiées`);
}

async function testDataSearch(page) {
  await page.goto(`${BASE}/bibliotheque-donnees`, { waitUntil: 'networkidle' });
  const checks = {};
  const search = page.getByRole('searchbox', { name: 'ISIN, ticker, nom ou identifiant', exact: true });
  await search.fill('DCAM');
  // Le changement de paramètres est une navigation React ; attendre la fiche correspondante.
  await page.locator('.ds-detail').filter({ hasText: 'FR001400U5Q4' }).waitFor();
  const maintenanceSearch = page.locator('.ds-field').filter({ has: page.getByRole('heading', { name: 'Éligibilité PEA', exact: true }) }).locator('.maintenance-links a').filter({ hasText: 'Rechercher la nouvelle publication' });
  checks.maintenance = new URL(await maintenanceSearch.getAttribute('href')).searchParams.get('q') === 'site:www.amundietf.fr FR001400U5Q4 fiche mensuelle';
  const instrumentText = await page.locator('.ds-detail').innerText();
  checks.instrument = instrumentText.includes('FR001400U5Q4') && instrumentText.includes('Euronext Paris') && instrumentText.includes('2026-09-30');
  const aum = page.locator('.ds-field').filter({ has: page.getByRole('heading', { name: 'Encours', exact: true }) });
  const expectedAum = DATA_CATALOG.find(record => record.id === 'FR001400U5Q4').fields.find(field => field.label === 'Encours');
  checks.dates = (await aum.locator('dd').first().innerText()) === (expectedAum.metadata.asOf ?? 'Date de valeur non publiée par la source')
    && (await aum.innerText()).includes(expectedAum.metadata.checkedAt);

  const officialAum = page.locator('.ds-field').filter({ has: page.getByRole('heading', { name: 'Encours daté publié par l’émetteur', exact: true }) });
  checks.officialAum = (await officialAum.locator('dd').first().innerText()) === '2026-08-31'
    && (await officialAum.innerText()).includes('1 407,36 millions EUR');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exporter la fiche JSON' }).click()]);
  const exported = JSON.parse(await (await import('node:fs/promises')).readFile(await download.path(), 'utf8'));
  const exportedAum = exported.fields.find(field => field.label === 'Encours');
  checks.export = exported.id === 'FR001400U5Q4' && exported.schemaVersion === 1
    && JSON.stringify(exportedAum) === JSON.stringify(expectedAum);
  await page.goto(`${BASE}/bibliotheque-donnees?q=msci-world-enhanced-value&type=index&id=msci-world-enhanced-value`, { waitUntil: 'networkidle' });
  const fields = page.locator('.ds-field');
  checks.historyCount = await fields.count() === DATA_CATALOG.find(record => record.id === 'msci-world-enhanced-value').fields.length;
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
  const soxxReview = MARKET_HISTORY_REVIEW['history:soxx'];
  checks.certifiedSeries = !soxxText.includes('Archive non vérifiable') && soxxText.includes(soxxReview.checkedAt) && soxxText.includes(soxxReview.method)
    && soxxText.includes(`${soxxReview.periodStart} à ${soxxReview.periodEnd}`);
  await choose(page.getByLabel('Type de donnée'), 'all');
  await search.fill('zzzintrouvablezzz');
  await page.locator('.ds-detail').filter({ hasText: 'Aucune donnée' }).waitFor();
  checks.empty = (await page.getByRole('status').innerText()).includes('0 résultat');
  await page.setViewportSize({ width: 390, height: 844 });
  await search.fill('MSCI USA');
  await page.locator('.ds-detail').filter({ hasText: 'MSCI USA' }).waitFor();
  checks.filterSurvivesTyping = new URLSearchParams(page.url().split('?')[1]).get('type') === 'all';
  if (process.env.DATA_SEARCH_SCREENSHOT) await page.screenshot({ path: process.env.DATA_SEARCH_SCREENSHOT, fullPage: true });
  checks.mobile = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  await page.setViewportSize({ width: 1280, height: 720 });
  record('Bibliothèque de données', Object.values(checks).every(Boolean), JSON.stringify(checks));
}

async function testHouseholds(page) {
  await page.goto(`${BASE}/france-100-menages`, { waitUntil: 'networkidle' });
  const waitImage = async (id, design) => {
    await page.waitForFunction(({id, design}) => document.querySelector(`.hh-scope a[download="france-100-menages-${id}-${design}.png"]`)?.href.startsWith('data:image/png'), {id, design});
  };
  let ok = await page.getByLabel('Design', { exact: true }).getAttribute('data-value') === 'illustrated';
  for (const { id, referencePeriod, source } of (await import('../src/data/household-statistics.js')).HOUSEHOLD_STATISTICS) {
    await choose(page.getByLabel('Sujet', { exact: true }), id);
    await page.waitForURL(`**sujet=${id}`);
    await waitImage(id, 'illustrated');
    ok &&= await page.getByRole('link', { name: 'Télécharger le PNG' }).evaluate(async link => { const img = new Image(); img.src = link.href; await img.decode(); return img.naturalWidth === 2400 && img.naturalHeight === 1350; });
    const text = await page.getByLabel('Texte modifiable').inputValue();
    const sourceURL = (await import('../src/data/household-statistics.js')).HOUSEHOLD_SOURCES[source].url;
    ok &&= !/https?:\/\/|Source\s*:/i.test(text)
      && (await page.locator('.hh-source a[target="_blank"]').getAttribute('href')) === sourceURL
      && (await page.locator('.hh-source').innerText()).includes(referencePeriod);
  }
  for (const { id: design } of (await import('../src/pages/france-100-menages/image.js')).HOUSEHOLD_DESIGNS) {
    await choose(page.getByLabel('Design', { exact: true }), design);
    await waitImage(await page.getByLabel('Sujet', { exact: true }).getAttribute('data-value'), design);
    ok &&= await page.getByRole('link', { name: 'Télécharger le PNG' }).evaluate(async (link, design) => { const img = new Image(); img.src = link.href; await img.decode(); return design === 'illustrated' ? img.naturalWidth === 2400 && img.naturalHeight === 1350 : design === 'sculptural' ? img.naturalWidth === 2400 && img.naturalHeight === 1620 : img.naturalWidth === 1080 && img.naturalHeight === 1440; }, design);
  }
  for (const design of ['ivory', 'blue', 'plum']) {
    await choose(page.getByLabel('Design', { exact: true }), design);
    for (const id of ['wealth-top10', 'wealth-share', 'unexpected-expense', 'salary-median', 'donation']) {
      await choose(page.getByLabel('Sujet', { exact: true }), id);
      await waitImage(id, design);
      ok &&= await page.getByRole('link', { name: 'Télécharger le PNG' }).evaluate(async link => { const img = new Image(); img.src = link.href; await img.decode(); return img.naturalWidth === 1080 && img.naturalHeight === 1440; });
    }
    const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Télécharger le PNG' }).click()]);
    ok &&= file.suggestedFilename().endsWith(`-${design}.png`) && (await stat(await file.path())).size > 10000;
  }
  await choose(page.getByLabel('Sujet', { exact: true }), 'donation');
  await waitImage('donation', 'plum');
  const editor = page.getByLabel('Texte modifiable');
  await editor.fill('Mon texte personnalisé');
  await page.getByRole('button', { name: 'Réinitialiser le texte' }).click();
  ok &&= (await editor.inputValue()).includes('donation déclarée');
  ok &&= await page.getByLabel('Inclure le lien de la source').count() === 0;
  ok &&= !(await editor.inputValue()).includes('https://');
  const [png] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Télécharger le PNG' }).click()]);
  ok &&= (await stat(await png.path())).size > 10000;
  const [json] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exporter le JSON' }).click()]);
  const data = JSON.parse(await (await import('node:fs/promises')).readFile(await json.path(), 'utf8'));
  ok &&= data.id === 'donation' && data.value === 20 && data.source.url.startsWith('https://www.insee.fr/');
  await page.reload({ waitUntil: 'networkidle' });
  ok &&= await page.getByLabel('Sujet', { exact: true }).getAttribute('data-value') === 'donation';
  ok &&= await page.getByLabel('Design', { exact: true }).getAttribute('data-value') === 'plum';
  await page.setViewportSize({ width: 390, height: 844 });
  ok &&= await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  if (process.env.HOUSEHOLD_SCREENSHOT) await page.screenshot({ path: process.env.HOUSEHOLD_SCREENSHOT, fullPage: true });
  await page.setViewportSize({ width: 1280, height: 720 });
  record('La France en 100 ménages', ok, '29 sujets, neuf designs, tweets, édition, lien source, PNG, JSON, rechargement et mobile');
}

async function testInvestorIntroductions(page) {
  const { INVESTORS } = await import('../src/pages/investor-portfolio/data.js');
  const { investorIntroduction } = await import('../src/data/investor-profiles.js');
  // Exercise every shipped filing before using editorial fixtures. The actual
  // local payloads include large paginated portfolios and disclosed options.
  await page.goto(`${BASE}/portefeuilles-investisseurs`, { waitUntil: 'networkidle' });
  let snapshotsOk = true;
  for (const [slug] of INVESTORS) {
    const payload = JSON.parse(await readFile(new URL(`../public/data/investors/${slug}.json`, import.meta.url), 'utf8'));
    await choose(page.getByLabel('Choisir un investisseur'), slug);
    await page.waitForFunction(intro => document.querySelector('#ip-draft')?.value.includes(intro), investorIntroduction(slug));
    const actual = await page.getByLabel('Tweet modifiable', { exact: true }).inputValue();
    snapshotsOk &&= actual.includes('30 juin 2026') && !/NaN|undefined/.test(actual);
    snapshotsOk &&= actual.includes('Les options du relevé sont exclues') === payload.data.snapshot.holdings.some(row => row.putCall);
    const credit = await page.locator('.ip-credit').innerText();
    snapshotsOk &&= credit.includes(payload.data.identity.dataProvider);
  }
  // Données de test contrôlées pour isoler les champs éditoriaux du réseau tiers.
  await page.route('**/data/investors/*.json', async route => {
    const slug = new URL(route.request().url()).pathname.split('/').at(-1).replace('.json', '');
    const displayName = INVESTORS.find(([id]) => id === slug)?.[1];
    await route.fulfill({ headers: { 'access-control-allow-origin': '*' }, json: { as_of: '2026-10-01', data: { identity: { slug, displayName, entityName: 'Déclarant de test', archetype: 'hedge_fund' }, snapshot: { periodEnd: '2026-06-30', filedAt: '2026-08-14', quarterChanges: { priorPeriodLabel: 'Q1 2026', exits: [{ issuerName: 'Sortie de test', ticker: 'EXIT' }] }, holdings: [{ issuerName: 'Entreprise de test', ticker: 'TEST', weight: .6, isNew: true }, { issuerName: 'Hausse de test', ticker: 'UP', weight: .2, sharesChangePct: 18 }, { issuerName: 'Baisse de test', ticker: 'DOWN', weight: .1, sharesChangePct: -12 }] } } } });
  });
  await page.goto(`${BASE}/portefeuilles-investisseurs`, { waitUntil: 'networkidle' });
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: async text => { window.__investorCopiedText = text; } },
  }));
  let ok = snapshotsOk;
  for (const [slug] of INVESTORS) {
    await choose(page.getByLabel('Choisir un investisseur'), slug);
    await page.waitForFunction(intro => document.querySelector('#ip-intro')?.value === intro && document.querySelector('#ip-draft')?.value.includes(intro), investorIntroduction(slug));
    ok &&= (await page.locator('.ip-bio').innerText()) === investorIntroduction(slug);
    const tweet = await page.getByLabel('Tweet modifiable', { exact: true }).inputValue();
    ok &&= tweet.startsWith('📊 ') && tweet.split('\n')[0].includes('%')
      && ['💼 Ses principales positions', '🔍 Ce qui distingue ce portefeuille', '💬 '].every(label => tweet.includes(label))
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
  ok &&= (await page.getByLabel('Tweet modifiable', { exact: true }).inputValue()).includes(investorIntroduction(INVESTORS.at(-1)[0]));
  await choose(page.getByLabel('Choisir un investisseur'), 'cathie-wood');
  await page.waitForFunction(() => document.querySelector('#ip-intro')?.value.startsWith('Cathie Wood'));
  ok &&= !(await page.getByLabel('Tweet modifiable', { exact: true }).inputValue()).includes(investorIntroduction(INVESTORS.at(-1)[0]));
  await page.setViewportSize({ width: 390, height: 844 });
  ok &&= await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.unroute('**/data/investors/*.json');
  record('Portefeuille d’investisseur', ok, `${INVESTORS.length} présentations et tweets synchronisés, modification, réinitialisation, changement de profil et mobile`);
}

async function testDataReuse(page) {
  await page.goto(`${BASE}/impact-frais`, { waitUntil: 'networkidle' });
  await choose(page.getByLabel('ETF du scénario 1', { exact: true }), 'FR001400U5Q4');
  await choose(page.getByLabel('ETF du scénario 2', { exact: true }), 'IE00BP3QZ601');
  let ok = (await page.locator('.fi-preview-text').innerText()).includes('FR001400U5Q4')
    && (await page.locator('.fi-preview-text').innerText()).includes('sans comparer leurs performances réelles');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__reuseCopied = text; } } }));
  await page.getByRole('button', { name: 'Copier le texte', exact: true }).click();
  ok &&= (await page.evaluate(() => window.__reuseCopied)).includes('IE00BP3QZ601');
  await page.setViewportSize({ width: 390, height: 844 });
  ok &&= await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${BASE}/duels-portefeuilles`, { waitUntil: 'networkidle' });
  const prepared = await page.locator('#pd-select [data-option]').allTextContents();
  await choose(page.locator('#pd-select'), String(prepared.findIndex(text => text.includes('XEON'))));
  ok &&= (await page.locator('#pd-tweet').inputValue()).includes('XEON');
  await choose(page.locator('#pd-select'), String(prepared.findIndex(text => text.includes('semi-conducteurs ou blockchain'))));
  ok &&= (await page.locator('.pd-table tbody th').allTextContents()).join(',') === '2023,2024,2025';
  await page.goto(`${BASE}/faits-marquants-marches`, { waitUntil: 'networkidle' });
  await choose(page.getByLabel('Choisir un fait'), 'monthly-drawdown-paypal');
  ok &&= (await page.locator('.mf-fact-text').innerText()).includes('clôtures mensuelles ajustées');
  await choose(page.getByLabel('Choisir un fait'), 'monthly-dca-costco');
  ok &&= (await page.locator('.mf-fact-text').innerText()).includes('L’argent en attente n’est pas rémunéré');
  await page.goto(`${BASE}/bibliotheque-donnees?id=IE00B4JNQZ49&q=IE00B4JNQZ49`, { waitUntil: 'networkidle' });
  ok &&= (await page.locator('.ds-detail').innerText()).includes('Duels de portefeuilles');
  await page.goto(`${BASE}/banque-tweets`, { waitUntil: 'networkidle' });
  await page.getByRole('button', {name:'Pédagogie',exact:true}).click();
  ok &&= (await page.locator('.tb-tweet-text').allTextContents()).includes(CASES.find(item => item.id === 'world-europe-chiffre').text);
  record('Réutilisation des données', ok, 'ETF et copie frais, mobile, nouvelles périodes des duels, faits mensuels, banque et cas chiffré');
}

async function testAssetSelection(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/fiches-etf`, { waitUntil: 'networkidle' });
  const worldCard = ETFS.find(etf => etf.isin === 'FR001400U5Q4');
  const picker = page.locator('.asset-picker').first();
  await picker.getByRole('searchbox').fill('FR001400U5Q4');
  await choose(picker.locator('[data-selector]'), worldCard.id);
  let ok = (await picker.locator('.asset-picker-results').innerText()).includes('1 résultat');
  await picker.getByRole('button', { name: 'Tout afficher', exact: true }).click();
  await picker.getByRole('button', { name: 'Émergents', exact: true }).click();
  const emergingId = await picker.locator('[data-selector]').getAttribute('data-value');
  ok &&= ETFS.map(instrumentOption).some(item => item.id === emergingId && item.group === 'Émergents');
  await picker.getByRole('searchbox').fill('introuvable-xyz');
  ok &&= (await picker.locator('.asset-picker-results').innerText()).includes('Aucun résultat');
  await picker.getByRole('button', { name: 'Tout afficher', exact: true }).click();
  await choose(picker.locator('[data-selector]'), worldCard.id);
  const choices = picker.locator('[data-selector]');
  await choices.locator('[data-option]').nth(1).focus();
  await page.keyboard.press('Enter');
  ok &&= await choices.locator('[data-option]').nth(1).getAttribute('aria-pressed') === 'true';
  await picker.getByRole('button', { name: 'Éligibles PEA', exact: true }).click();
  const peaValues = await choices.locator('[data-option]').evaluateAll(nodes => nodes.map(node => node.dataset.value));
  ok &&= peaValues.length > 0 && peaValues.every(id => ETFS.map(instrumentOption).find(item => item.id === id)?.badges.includes('PEA'));
  await picker.getByRole('button', { name: 'Tout afficher', exact: true }).click();
  await choose(choices, worldCard.id);
  await page.locator('.support-alternative input[type=checkbox]').first().check();
  await page.getByRole('button', { name: 'Comparer ces supports', exact: true }).click();
  ok &&= await page.locator('.support-comparison table').isVisible();
  for (const width of [320,390,768]) {
    await page.setViewportSize({ width, height: 900 });
    ok &&= await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  }
  await page.setViewportSize({width:1280,height:900});
  await page.screenshot({path:'test-artifacts/asset-selection.png',fullPage:true});
  await page.goto(`${BASE}/generateur-portefeuilles`, { waitUntil: 'networkidle' });
  let selected=false;
  for(let i=0;i<20&&!selected;i++) {
    await page.locator('.pg-replacement summary').click();
    const lines=await page.locator('#pg-replacement-line [data-option]').evaluateAll(nodes=>nodes.map(n=>n.dataset.value));
    for(const line of lines) {
      await choose(page.locator('#pg-replacement-line'), line);
      if(await page.getByRole('group',{name:'Support de remplacement',exact:true}).count()) {selected=true;break}
    }
    if(!selected) await page.getByRole('button',{name:/Générer un nouveau portefeuille/}).click();
  }
  if(!selected) throw new Error('No replaceable generated portfolio');
  const candidates=page.getByRole('group',{name:'Support de remplacement',exact:true});
  const replacement=await candidates.locator('[data-option]').evaluateAll(nodes=>nodes.find(n=>n.dataset.value)?.dataset.value);
  await choose(candidates, replacement);
  const originalId = await page.locator('#pg-replacement-line').getAttribute('data-value');
  const previousIds = await page.locator('#pg-replacement-line [data-option]').evaluateAll(nodes => nodes.map(node => node.dataset.value));
  const expectedIds = previousIds.map(id => id === originalId ? replacement : id);
  await page.getByRole('button',{name:'Appliquer le remplacement',exact:true}).click();
  await page.waitForFunction(expected => {
    const ids = [...document.querySelectorAll('#pg-replacement-line [data-option]')].map(node => node.dataset.value);
    return ids.join('|') === expected.join('|');
  }, expectedIds);
  ok &&= (await page.getByRole('status').innerText()).includes('Support remplacé');
  // Same-issuer share classes can legitimately share their compact tweet label.
  // Check the actual support identity and its published label, not a text inequality.
  ok &&= (await page.locator('.pg-tweet-body').innerText()).includes(portfolioAssetLabel(PORTFOLIO_ASSETS.find(asset => asset.id === replacement)));
  await page.setViewportSize({width:390,height:844});
  ok &&= await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
  await page.screenshot({path:'test-artifacts/asset-replacement-mobile.png',fullPage:true});
  await page.setViewportSize({width:1280,height:720});
  record('Sélection et remplacement des actifs',ok,'recherche ISIN, catégories, aucun résultat, comparaison, remplacement, mobile');
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

  if (process.argv.includes('--broker')) {
    await testBrokerComparator(page);
  } else {
  if (!process.argv.includes('--review')) {
  await testAssetSelection(page);
  await testWorkspaceNavigation(page);
  await testCalculateur(page);
  await testPortfolioGenerator(page);
  await testPortfolioDuels(page);
  await testEtfSheets(page);
  await testBrokerComparator(page);
  await testTweetMidi(page);
  await testFeeImpact(page);
  await testDataReuse(page);
  await testMarketFacts(page);
  await testTweetBank(page);
  await testFactsheetTweets(page);
  await testDataSearch(page);
  await testHouseholds(page);
  await testInvestorIntroductions(page);
  }
  // Exercise review filters with an active failure card as well as the review rows.
  await page.route('**/automation-status/automation-status.json', route => route.fulfill({json: {schemaVersion: 1, workflows: {economic: {name: 'Données économiques', status: 'failure', completedAt: '2026-10-07T10:00:00Z', runUrl: 'https://github.com/madmax91310/shinny-potato/actions/runs/1'}}}}));
  // Automation failure cards also use .dr-item; only count the filtered review list.
  await page.goto(`${BASE}/donnees-a-revoir?view=reserve&q=IBKR`, { waitUntil: 'networkidle' });
  await page.getByRole('region', { name: 'Échecs des mises à jour automatiques' }).getByRole('heading', {name: 'Données économiques', exact: true}).waitFor();
  const ibkrCount = buildReview().items.filter(item => item.category === 'reserve' && item.id.startsWith('broker:ibkr:')).length;
  const reviewChecks = { alert: (await page.getByRole('region', { name: 'Échecs des mises à jour automatiques', exact: true }).locator('.dr-item').count()) === 1, ibkr: (await page.locator('.data-review > .dr-list > .dr-item').count()) === ibkrCount };
  await page.getByRole('searchbox', { name: 'Rechercher une donnée ou un outil' }).fill('Interactive Brokers');
  await page.waitForFunction(count => new URLSearchParams(location.search).get('q') === 'Interactive Brokers' && document.querySelectorAll('.data-review > .dr-list > .dr-item').length === count, ibkrCount);
  reviewChecks.search = (await page.locator('.data-review > .dr-list > .dr-item').count()) === ibkrCount;
  await page.reload({ waitUntil: 'networkidle' });
  reviewChecks.reload = (await page.locator('.data-review > .dr-list > .dr-item').count()) === ibkrCount;
  await page.getByRole('searchbox', { name: 'Rechercher une donnée ou un outil', exact: true }).fill('');
  const reserveCount = buildReview().items.filter(item => item.category === 'reserve').length;
  await page.waitForFunction(count => new URLSearchParams(location.search).get('q') === '' && document.querySelectorAll('.data-review > .dr-list > .dr-item').length === count, reserveCount);
  reviewChecks.peaCustody = (await page.locator('.data-review > .dr-list > .dr-item').filter({hasText: 'Trade Republic'}).filter({hasText: 'garde'}).count()) === 1;
  await choose(page.getByLabel('Afficher', { exact: true }), 'deadlines');
  await page.waitForFunction(() => new URLSearchParams(location.search).get('view') === 'deadlines' && document.querySelectorAll('.data-review > .dr-list > .dr-item').length === 3);
  reviewChecks.deadlines = (await page.locator('.data-review > .dr-list > .dr-item').count()) === 3;
  reviewChecks.sources = (await page.locator('.data-review > .dr-list').getByRole('link', { name: 'Source ↗', exact: true }).count()) === 3;
  await page.goto(`${BASE}/donnees-a-revoir?view=calendar&q=FR001400U5Q4`, { waitUntil: 'networkidle' });
  reviewChecks.maintenance = (await page.locator('.dr-item .maintenance-links a').filter({ hasText: 'Rechercher la nouvelle publication' }).count()) > 0;
  reviewChecks.historicalEvidence = (await page.locator('.dr-links a[href*="20260331"]').count()) > 0;
  await page.setViewportSize({ width: 390, height: 844 });
  reviewChecks.mobile = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  await page.setViewportSize({ width: 1280, height: 720 });
  record('Données à revoir', Object.values(reviewChecks).every(Boolean), JSON.stringify(reviewChecks));

  }
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

