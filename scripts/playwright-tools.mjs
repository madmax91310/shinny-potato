#!/usr/bin/env node
import annualFx from '../src/data/annual-fx.json' with { type: 'json' };
import { computeBrut, computePoste, fmtEUR as fmtPowerEUR } from '../src/pages/purchasing-power/lib.js';
import { PRICE_OBSERVATION } from '../src/data/purchasing-power.js';
import { BROKERS as COMPARISON_BROKERS, DUELS as BROKER_DUELS, buildTweet as buildBrokerPost } from '../src/pages/broker-comparator/data.js';
import { buildReview, reviewCalendar } from '../src/pages/data-review/lib.js';
import { groupReviews } from '../src/pages/data-review/groups.js';
import { MARKET_HISTORY_REVIEW } from '../src/data/market-history-review.js';
import { choose } from './card-selection.mjs'
import { TOPICS as PRACTICAL_TOPICS } from '../src/data/practical-sheet-topics.js'
import { buildSheet as buildPracticalSheet, buildTweet as buildPracticalTweet } from '../src/pages/practical-sheets/lib.js'
import { FACTS as MARKET_FACTS } from '../src/pages/market-facts/data.js';
import { buildTweetText as buildMarketStory } from '../src/pages/market-facts/lib.js';
import { buildText } from '../src/pages/etf-sheets/lib.js';
import { getPresentationCopy } from '../src/pages/etf-sheets/editorial.js';
import { buildFactsheetTweet } from '../src/pages/factsheet-tweets/lib.js';
import { sortedRows, sectorLabel } from '../src/pages/factsheet-tweets/editorial.js';
import { TOOLS, HOME_TOOLS } from '../src/tools.js';
import { EDITORIAL_WEEK } from '../src/data/editorial-calendar.js';
import { ETFS } from '../src/data/etf-cards.js';
import { instrumentOption } from '../src/data/asset-selection.js';
import { ASSETS as PORTFOLIO_ASSETS } from '../src/data/portfolio-assets.js';
import { portfolioPostName as portfolioAssetLabel } from '../src/pages/portfolio-generator/postEditorial.js';
import { DILEMMES, SITUATIONS } from '../src/pages/tweet-midi/data/dilemmes.js';
import { FICHE_LEXIQUE_SUBJECTS, getFicheLexiqueText } from '../src/pages/tweet-midi/data/ficheLexique.js';
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
import { describeDataField } from '../src/pages/data-search/lib.js';
import { maintenanceLinks } from '../src/data/maintenance-links.js';
import { buildCustomDuel, buildDuel, buildTweet } from '../src/pages/portfolio-duels/lib.js';
import { getRecipes } from '../src/pages/portfolio-generator/recipes.js';
import { DUELS } from "../src/pages/portfolio-duels/data.js";
import { SHEETS } from "../src/data/index-factsheets.js";
import { ASSETS as HISTORY, LATEST_YM as LATEST_HISTORY_YM } from '../src/data/market-history.js';
// Last collected month of an asset as the tools write it ("septembre 2026"); it advances
// with every monthly refresh, so it is never pinned in the expectations.
// The year of the latest collected month is never complete in the annual tables.
const INCOMPLETE_YEAR = Number(LATEST_HISTORY_YM.slice(0, 4));
// Last calendar year an asset closes with a collected December point: the final line of
// its annual table. It advances per asset when January brings the December close.
const lastCompleteYear = id => Math.max(...HISTORY[id].points.filter(p => p.date.endsWith('-12') && Number(p.date.slice(0, 4)) < INCOMPLETE_YEAR).map(p => Number(p.date.slice(0, 4))));
// Latest year of a sheet's official annual returns (sheet.returns is newest first).
const latestSheetYear = sheet => String(Math.max(...(sheet.returns ?? []).map(([year]) => Number(year))));
const latestMonth = id => {
  const [year, month] = HISTORY[id].points.at(-1).date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};
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

async function testPracticalSheets(page) {
  for (const topic of PRACTICAL_TOPICS) {
    await page.goto(`${BASE}/fiches-pratiques?fiche=${topic.id}`, { waitUntil: 'networkidle' });
    const actual = await page.locator('#practical-tweet').inputValue();
    const expected = buildPracticalTweet(buildPracticalSheet(topic.id));
    if (actual !== expected) throw new Error(`Texte différent dans le navigateur : ${topic.id}`);
    if (await page.locator('.practical-image').count() !== 1) throw new Error(`Image absente : ${topic.id}`);
  }
  await page.goto(`${BASE}/fiches-pratiques?fiche=fees-euros`, { waitUntil: 'networkidle' });
  await page.getByLabel('Capital initial (€)', {exact:true}).fill('23456');
  const expected = buildPracticalTweet(buildPracticalSheet('fees-euros', {scenario:{capital:23456}}));
  await page.waitForFunction(text => document.querySelector('#practical-tweet').value === text, expected);
  await page.locator('#practical-tweet').fill('Mon brouillon');
  await page.getByRole('button', {name:'Rétablir le texte généré',exact:true}).click();
  await page.waitForFunction(text => document.querySelector('#practical-tweet').value === text, expected);
  record('Fiches pratiques', true, '44 textes, paramètres de simulation et rétablissement du brouillon');
}

async function testWorkspaceNavigation(page) {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const entries = EDITORIAL_WEEK.flatMap(({ day, morning, evening }) =>
    [['Matin · après le récap', morning], ['Soir', evening]].flatMap(([label, slots]) =>
      slots.map(slot => ({ path: slot.path, label: slot.note || `${day} ${label.toLowerCase()}` }))));
  const otherTools = HOME_TOOLS.filter(tool => !entries.some(entry => entry.path === tool.to));
  const expectedPaths = [...entries.map(entry => entry.path), ...otherTools.filter(tool => tool.publicationDay === 'Publication ponctuelle').map(tool => tool.to), ...otherTools.filter(tool => tool.publicationDay !== 'Publication ponctuelle').map(tool => tool.to)];
  const expectedLabels = [...entries.map(entry => entry.label), ...otherTools.filter(tool => tool.publicationDay).map(tool => tool.publicationDay)];
  const checks = { allTools: await page.locator('.workspace-tool-card').count() === expectedPaths.length };
  checks.publicationDays = (await page.locator('.workspace-publication-day').allTextContents()).sort().join('|') === expectedLabels.sort().join('|');
  checks.onlyTools = await page.locator('.workspace-search,.workspace-filters,.workspace-brand').count() === 0;
  checks.weeklyOrder = (await page.locator('.workspace-tool-card').evaluateAll(cards => cards.map(card => new URL(card.href).pathname.split('/').at(-1)))).join('|') === expectedPaths.map(path => path.slice(1)).join('|');
  checks.rankingsMorningOnly = await page.locator('[data-period="morning"] a[href$="/classements-performances"]').count() === 3 && await page.locator('[data-period="evening"] a[href$="/classements-performances"]').count() === 0;
  checks.investmentTwice = await page.locator('[data-period="morning"] a[href$="/calculateur-investissement"]').count() === 2;
  checks.brokersWednesday = await page.locator('[data-day="2"] [data-period="evening"] a[href$="/comparatif-courtiers"]').count() === 1;
  checks.sundayOptional = (await page.locator('[data-day="6"] a[href$="/classements-performances"]').textContent()).includes('Facultatif');
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    checks[`overflow${width}`] = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  checks.allAccessibleOnPhone = await page.locator('.workspace-tool-card').evaluateAll(cards => cards.every(card => card.getBoundingClientRect().width > 0 && card.getBoundingClientRect().height >= 44));
  checks.noBrand = await page.locator('.workspace-brand').count() === 0;
  checks.quickLinks = await page.locator('.home-quick-links a').count() === 4;
  const today = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', timeZone: 'Europe/Paris' }).format(new Date());
  checks.today = (await page.locator('.home-day--today .home-day-band h2').textContent()).toLowerCase() === today;
  const search = page.getByRole('searchbox', { name: 'Rechercher un outil', exact: true });
  await search.fill('generateur');
  checks.searchAccents = await page.locator('#home-search-results .workspace-tool-card[href$="/generateur-portefeuilles"]').count() === 1 && await page.locator('.workspace-tool-card').count() === 1;
  await search.fill('recouvrement');
  checks.searchDca = await page.locator('#home-search-results .workspace-tool-card[href$="/le-dca-de"]').count() === 1;
  await search.fill('zzzzzz');
  checks.emptySearch = await page.locator('.workspace-tool-card').count() === 0 && (await page.getByRole('status').textContent()).includes('0 outil');
  await page.getByRole('button', { name: 'Effacer', exact: true }).click();
  checks.resetSearch = await page.locator('.workspace-tool-card').count() === expectedPaths.length;
  await mkdir('test-artifacts/weekly-home', { recursive: true });
  await page.screenshot({ path: 'test-artifacts/weekly-home/mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: 'test-artifacts/weekly-home/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
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
  await etfPicker.getByRole('button', { name: 'Parcourir', exact: true }).click();
  await etfPicker.getByRole('button', { name: 'Monde', exact: true }).click();
  const worldOptions = ETFS.map(instrumentOption).filter(item => item.group === 'Monde');
  await page.waitForFunction(ids=>ids.includes(document.querySelector('.asset-picker [data-selector]')?.dataset.value),worldOptions.map(item=>String(item.id)));
  checks.categoryClearsSearch = await etfPicker.getByRole('searchbox').count() === 0;
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
    if (tool.to === '/analyse-entreprise') {
      checks.companyValuationVisible = await page.getByTestId('company-valuation').isVisible();
      await page.getByText('Comptes détaillés et publication existante', {exact:true}).click();
    }
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
  await choose(page.getByRole('group', {name:'Choisir un actif',exact:true}), "bitcoin");
  await page.getByRole('button', { name: /Copier le texte du post/ }).click();
  let conclusionsOk = /Tu aurais gardé ce placement jusqu’au bout/.test(await page.evaluate(() => window.__investmentCopiedText));
  conclusionsOk &&= !(await page.evaluate(() => window.__investmentCopiedText)).includes('Livret A');
  await page.waitForTimeout(150);
  const hero = await page.locator(".ic-hero-number").innerText();
  const heroOk = /\d/.test(hero);
  let septemberOk = (await page.evaluate(() => window.__investmentCopiedText)).includes(latestMonth('bitcoin'));
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

  await choose(page.getByRole('group', {name:'Choisir un actif',exact:true}), 'cac40');
  await imageButton.click();
  const annualPreview = page.getByRole('dialog', { name: 'Aperçu de l’image du placement' });
  const annualImage = (await annualPreview.locator('img').getAttribute('src'))?.startsWith('data:image/png;base64,');
  const [annualDownload] = await Promise.all([
    page.waitForEvent('download'),
    annualPreview.getByRole('link', { name: '⬇️ Télécharger le PNG' }).click(),
  ]);
  await annualPreview.getByRole('button', { name: 'Fermer l’aperçu' }).click();

  await choose(page.getByRole('group', {name:'Choisir un actif',exact:true}), "ethereum");
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
  conclusionsOk &&= /Gain sur les sommes versées/.test(monthlyTweet)
    && !/Le résultat porte sur l’ensemble des versements/.test(monthlyTweet)
    && !/sans versement supplémentaire/.test(monthlyTweet);
  septemberOk &&= monthlyTweet.includes(latestMonth('ethereum'));
  await choose(page.getByRole('group', {name:'Choisir un actif',exact:true}), 'sp500');
  const spDca = page.getByRole('button', { name: 'Mensuel (DCA)', exact: true });
  const spDcaOk = await spDca.isEnabled();
  await spDca.click();
  await page.getByRole('button', { name: /Copier le texte du post|✓ Copié/ }).click();
  const spTweet = await page.evaluate(() => window.__investmentCopiedText);
  septemberOk &&= spTweet.includes(latestMonth('sp500')) && !spTweet.includes('Indice théorique dividendes réinvestis, hors frais ; ce n’est pas la performance d’un ETF précis.')
    && (await page.locator('.ic-current-level').innerText()).includes('points');
  await choose(page.getByRole('group', {name:'Choisir un actif',exact:true}), 'stoxx600');
  const stoxxDca = page.getByRole('button', { name: 'Mensuel (DCA)', exact: true });
  septemberOk &&= await stoxxDca.isEnabled();
  await stoxxDca.click();
  await page.getByRole('button', { name: /Copier le texte du post|✓ Copié/ }).click();
  const stoxxTweet = await page.evaluate(() => window.__investmentCopiedText);
  septemberOk &&= stoxxTweet.includes(latestMonth('stoxx600')) && stoxxTweet.includes('sur les sommes versées')
    && (await page.locator('.ic-current-level').innerText()).includes('points')
    && (await page.locator('.ic-method-note').innerText()).includes('dividendes nets');
  await choose(page.getByRole('group', {name:'Choisir un actif',exact:true}), 'msciWorld');
  const worldDca = page.getByRole('button', { name: 'Mensuel (DCA)', exact: true });
  septemberOk &&= await worldDca.isEnabled();
  await worldDca.click();
  await page.getByRole('button', { name: /Copier le texte du post|✓ Copié/ }).click();
  const worldTweet = await page.evaluate(() => window.__investmentCopiedText);
  septemberOk &&= worldTweet.includes(latestMonth('msciWorld')) && worldTweet.includes('sur les sommes versées')
    && (await page.locator('.ic-current-level').innerText()).includes('points')
    && (await page.locator('.ic-method-note').innerText()).includes('MSCI World Gross Return');
  for (const [id, name, variant] of [['msciEmerging', 'MSCI Emerging Markets', 'Gross Return'], ['msciWorldSmallCap', 'MSCI World Small Cap', 'Gross Return'], ['msciAcwiImi', 'MSCI ACWI IMI', 'Net Return'], ['msciAcwi', 'MSCI ACWI', 'Net Return'], ['msciWorldExUsa', 'MSCI World ex USA', 'Net Return']]) {
    await choose(page.getByRole('group', {name:'Choisir un actif',exact:true}), id);
    const dca = page.getByRole('button', { name: 'Mensuel (DCA)', exact: true });
    septemberOk &&= await dca.isEnabled();
    await dca.click();
    await page.getByRole('button', { name: /Copier le texte du post|✓ Copié/ }).click();
    const post = await page.evaluate(() => window.__investmentCopiedText);
    septemberOk &&= post.includes(name) && post.includes(latestMonth(id)) && post.includes(variant)
      && post.includes('sur les sommes versées') && !/NaN|undefined/.test(post)
      && (await page.locator('.ic-current-level').innerText()).includes('points')
      && (await page.locator('.ic-method-note').innerText()).includes(`${name} ${variant}`);
  }
  for (const id of ['etfWorldTech','etfAiBigData','etfWorldExUs','etfEmExChina']) {
    await choose(page.getByRole('group', {name:'Choisir un actif',exact:true}), id);
    // A recent listing must reject the previous 2020 start rather than invent observations.
    await choose(page.getByRole('group',{name:'Année de départ',exact:true}), '2020');
    septemberOk &&= (await page.getByRole('button',{name:/Copier le texte du post|✓ Copié/}).count()) === 0;
    await choose(page.getByRole('group',{name:'Année de départ',exact:true}), '2025');
    await choose(page.getByRole('group',{name:'Mois de départ',exact:true}), '1');
    const dca=page.getByRole('button',{name:'Mensuel (DCA)',exact:true});
    septemberOk &&= await dca.isEnabled();
    await dca.click();
    await page.getByRole('button',{name:/Copier le texte du post|✓ Copié/}).click();
    const post=await page.evaluate(()=>window.__investmentCopiedText);
    septemberOk &&= post.includes(latestMonth(id)) && !/NaN|undefined/.test(post);
  }
  await choose(page.getByRole('group',{name:'Année de départ',exact:true}), '2020');
  await choose(page.getByRole('group', {name:'Choisir un actif',exact:true}), 'or');
  septemberOk &&= (await page.locator('.ic-current-level').innerText()).includes(latestMonth('or'));
  await page.getByRole('button', { name: /Copier le texte du post|✓ Copié/ }).click();
  septemberOk &&= (await page.evaluate(() => window.__investmentCopiedText)).includes(`En ${latestMonth('or')}`);
  await choose(page.getByRole('group', {name:'Choisir un actif',exact:true}), "lvmh");
  await page.waitForTimeout(150);
  const text = await page.locator("body").innerText();
  const badgeOk = !/non vérifiées avant/.test(text);
  const dcaBlockOk = !/DCA non disponible pour LVMH/.test(text) && await page.getByRole('button', { name: 'Mensuel (DCA)', exact: true }).isEnabled();

  let companiesOk = true;
  for (const id of ['mastercard','adobe','home-depot','etfEuropeBanks','etfEuropeInsurance','berkshire', 'asml', 'costco', 'mcdonalds', 'airliquide', 'schneider', 'hermes', 'loreal', 'intel', 'paypal', 'lvmh', 'nvidia', 'amazon', 'google', 'meta', 'nestle', 'sap', 'visa', 'netflix', 'cocacola', 'euroMoney', 'euroGovShort', 'euroGov13', 'globalBondEur', 'euroInflationBond', 'euroCorporateBond', 'euroHighYieldBond']) {
    await choose(page.getByRole('group', {name:'Choisir un actif',exact:true}), id);
    await page.locator('.ic-method-note').filter({ hasText: 'Cours ajustés' }).waitFor();
    await page.getByRole('button', { name: /Copier le texte du post/ }).click();
    const post = await page.evaluate(() => window.__investmentCopiedText);
    companiesOk &&= !post.includes('Cours ajustés') && post.includes('Capital final :') && post.includes(latestMonth(id)) && !/NaN|undefined/.test(post);
    if (id === 'airliquide') companiesOk &&= (await page.locator('.ic-method-note').innerText()).includes('Prime de fidélité exclue');
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
  // Sources are conditional: a random allocation may contain no confidence notes.
  const autoNames = await page.locator('.pg-alloc-name-text').allInnerTexts();
  const autoAssets = autoNames.map(name => PORTFOLIO_ASSETS.find(asset => name.trim() === `${asset.emoji} ${asset.name}`));
  const expectedSourceNotes = autoAssets.filter(asset => asset?.confidenceNote);
  const sourcePanel = page.locator('details').filter({ has: page.locator('summary', { hasText: /^Sources et méthode$/ }) });
  const dataLabelsOk = autoAssets.every(Boolean)
    && await page.locator('.pg-confidence-badge').count() === 0
    && await sourcePanel.count() === Number(expectedSourceNotes.length > 0)
    && await sourcePanel.locator('li').count() === expectedSourceNotes.length;
  const { YEARS: portfolioYears, getAsset: portfolioAsset } = await import('../src/data/portfolio-assets.js');
  const { annualizedReturn, formatPerformance } = await import('../src/pages/portfolio-generator/performance.js');
  const autoPerformanceOk = portfolioYears.every(year => new RegExp(`${year} : [＋+−-]?[0-9]+,[0-9] %`).test(autoTweet))
    && /Performance annualisée \(2020 à 2025\) : [＋+−-]?[0-9]+,[0-9] % par an/.test(autoTweet);
  const performanceHookOk = text => {
    const result = text.match(/Performance annualisée \([^)]*\) : ([＋+−-]?[0-9]+,[0-9] %) par an/);
    return Boolean(result && text.startsWith(`📈 ${result[1]} par an sur la période `)
      && text.includes('Voici sa répartition et le détail des performances simulées 👇'));
  };
  // Utilities legitimately uses 💡 on its weighted asset line. Only reject
  // the removed editorial heading, not the icon of a randomly selected ETF.
  const autoEditorialOk = autoPerformanceOk && dataLabelsOk && performanceHookOk(autoTweet) && !/La logique de l’ensemble|^💡(?! \d+% )/m.test(autoTweet);
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
  await page.getByText('Conserver des lignes au prochain tirage', {exact:true}).click();
  const lockBox = page.locator('.pg-locks input').first();
  const lockedLabel = await lockBox.locator('..').innerText();
  await lockBox.check();
  await page.getByRole('button', { name: /Générer un nouveau portefeuille/i }).click();
  const retained = page.locator('.pg-locks label').filter({hasText:lockedLabel});
  recipesOk &&= await retained.count() === 1 && await retained.locator('input').isChecked();
  await page.getByText('Concentration et recoupements', {exact:true}).click();
  recipesOk &&= await page.getByText(/Ces plafonds de construction s’ajoutent au filtre historique/).isVisible();
  await page.getByText('Variété de cette session', {exact:true}).click();
  recipesOk &&= await page.getByText(/composition\(s\) proche\(s\)/).count() > 0;
  recipesOk &&= await page.getByText(/constructions utilisées sur/).count() > 0;
  recipesOk &&= await page.getByText(/supports utilisés sur/).count() > 0;
  await page.getByRole('group', { name:'Choisir un niveau de risque cible' }).getByRole('button', {name:'Dynamique',exact:true}).click();
  recipesOk &&= await page.locator('.pg-locks input:checked').count() === 0;
  await page.setViewportSize({ width: 390, height: 844 });
  recipesOk &&= await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByRole("button", { name: /Composition manuelle/ }).click();
  await choose(page.locator("#pg-manual-profile"), "crypto_curieux");
  await page.locator(".pg-manual-search").fill("Fonds euros");
  await page.locator(".pg-manual-available [data-option]").filter({ hasText: "Fonds euros (assurance-vie)" }).click();
  await page.locator(".pg-manual-pct-input").fill("100");
  await page.getByRole("button", { name: "Générer le tweet", exact: true }).click();
  const manualTweet = await page.locator(".pg-tweet-body").innerText();
  let manualEditorialOk = performanceHookOk(manualTweet) && /100% Fonds euros/.test(manualTweet) && /toute l’allocation/i.test(manualTweet) && !/La logique de l’ensemble/.test(manualTweet) && !/Bitcoin|Ethereum/.test(manualTweet);
  const euroPerf = Object.fromEntries(portfolioYears.map((year, i) => [year, portfolioAsset('fonds_euros').r[i]]));
  manualEditorialOk &&= portfolioYears.every(year => manualTweet.includes(`${year} : ${formatPerformance(euroPerf[year])}`))
    && manualTweet.includes(`Performance annualisée (2020 à 2025) : ${formatPerformance(annualizedReturn(euroPerf))} par an`);
  const manualStages = { single: manualEditorialOk };
  await page.getByRole('button', { name: /Modifier la composition/ }).click();
  await page.locator('.pg-manual-pct-input').fill('50');
  await page.locator('.pg-manual-search').fill('Bitcoin');
  await page.locator('.pg-manual-available [data-option]').first().click();
  await page.locator('.pg-manual-pct-input').last().fill('50');
  await page.getByRole('button', { name: 'Générer le tweet', exact: true }).click();
  const cryptoTweet = await page.locator('.pg-tweet-body').innerText();
  manualEditorialOk &&= performanceHookOk(cryptoTweet) && /50% .*Bitcoin/.test(cryptoTweet) && !/à la carte/i.test(cryptoTweet);
  manualStages.crypto = manualEditorialOk;
  await page.getByRole('button', { name: /Modifier la composition/ }).click();
  await page.locator('.pg-manual-remove').first().click();
  await page.locator('.pg-manual-search').fill('Amundi MSCI World UCITS ETF');
  await page.locator('.pg-manual-available [data-option]').first().click();
  await page.locator('.pg-manual-pct-input').last().fill('50');
  await page.getByRole('button', { name: 'Générer le tweet', exact: true }).click();
  const worldBitcoinTweet = await page.locator('.pg-tweet-body').innerText();
  manualEditorialOk &&= performanceHookOk(worldBitcoinTweet) && /50% .*Bitcoin/.test(worldBitcoinTweet) && /50 %/.test(worldBitcoinTweet);
  manualStages.worldBitcoin = manualEditorialOk;
  await page.getByRole('button', { name: /Nouveau texte, même composition/ }).click();
  const rotatedTweet = await page.locator('.pg-tweet-body').innerText();
  manualEditorialOk &&= rotatedTweet !== worldBitcoinTweet && performanceHookOk(rotatedTweet);
  await page.getByRole('button', { name: /Modifier la composition/ }).click();
  await page.locator('.pg-manual-pct-input').first().fill('10');
  await page.locator('.pg-manual-pct-input').last().fill('30');
  await page.locator('.pg-manual-search').fill('Fonds euros');
  await page.locator('.pg-manual-available [data-option]').filter({ hasText: 'Fonds euros (assurance-vie)' }).click();
  await page.locator('.pg-manual-pct-input').last().fill('60');
  await page.getByRole('button', { name: 'Générer le tweet', exact: true }).click();
  const personalTweet = await page.locator('.pg-tweet-body').innerText();
  manualEditorialOk &&= performanceHookOk(personalTweet)
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
      await page.locator('.pg-manual-search').fill(asset.name);
      await page.locator(`.pg-manual-available [data-option][data-asset-id="${id}"]`).click();
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
    await page.locator('.pg-manual-search').fill(asset.name);
    await page.locator(`.pg-manual-available [data-option][data-asset-id="${id}"]`).click();
    await page.locator('.pg-manual-pct-input').fill('100');
    await page.getByRole('button', { name: 'Générer le tweet', exact: true }).click();
    const labels = await page.locator('.pg-data-label').allInnerTexts();
    manualEditorialOk &&= labels.length === 1 && labels[0] === 'Données en USD';
    if (id === 'argent') {
      await page.getByText('Détail des performances annuelles', { exact: true }).click();
      const expected = ((1 + asset.r[5] / 100) * annualFx.years[2024].value / annualFx.years[2025].value - 1) * 100;
      const displayed = parseFloat((await page.locator('.pg-bar-value').last().innerText()).replace(',', '.'));
      manualEditorialOk &&= Math.abs(displayed - expected) < .051;
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  manualEditorialOk &&= await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  await page.setViewportSize({ width: 1280, height: 720 });
  record("Générateur de portefeuilles", sumOk && hasContent && categoriesOk && imageOk && autoEditorialOk && manualEditorialOk && recipesOk, `somme des lignes: ${sum.toFixed(1)}%, catégories: ${categorySum.toFixed(1)}%, image actualisée et téléchargée: ${imageOk}, constructions disponibles et mobile: ${recipesOk}, accroches auto: ${autoEditorialOk} (performances: ${autoPerformanceOk}, sources: ${dataLabelsOk}, accroche: ${performanceHookOk(autoTweet)}), intitulés manuels et rotation: ${manualEditorialOk}, étapes: ${JSON.stringify(manualStages)}`);
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
  await page.locator('.pd-editor-side').nth(1).waitFor();
  valid &&= (await page.locator('.pd-editor-side').count()) === 2;
  valid &&= /10\s000 €/.test(await page.locator('#pd-tweet').inputValue());
  await page.getByRole('spinbutton', { name: 'Poids actif 1 du portefeuille A' }).fill('65');
  valid &&= await page.getByRole('alert').isVisible();
  valid &&= (await page.locator('.pd-card').count()) === 0;
  await page.getByRole('spinbutton', { name: 'Poids actif 1 du portefeuille A' }).fill('80');
  valid &&= (await page.locator('.pd-card').count()) === 2;
  await page.getByRole('button', { name: 'Retirer actif 2 du portefeuille A', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Poids actif 1 du portefeuille A' }).fill('100');
  valid &&= (await page.locator('.pd-card').count()) === 2;
  await page.getByRole('button', { name: 'Ajouter un actif à A', exact: true }).click();
  await choose(page.getByRole('group', { name: 'Actif 2 du portefeuille A', exact: true }), 'sect_cyber_lg');
  await page.getByRole('spinbutton', { name: 'Poids actif 2 du portefeuille A' }).fill('10');
  await page.getByRole('spinbutton', { name: 'Poids actif 1 du portefeuille A' }).fill('90');
  valid &&= /cybersécurité/i.test(await page.locator('#pd-tweet').inputValue());
  await page.getByRole('button', { name: 'Ajouter un actif à A', exact: true }).click();
  await choose(page.getByRole('group', { name: 'Actif 3 du portefeuille A', exact: true }), 'stoxx600_bnp');
  await page.getByRole('spinbutton', { name: 'Poids actif 3 du portefeuille A' }).fill('10');
  await page.getByRole('spinbutton', { name: 'Poids actif 1 du portefeuille A' }).fill('80');
  const customExpected = buildCustomDuel({
    left: [{ id: 'msci_world_ishares', pct: 80 }, { id: 'stoxx600_bnp', pct: 10 }, { id: 'sect_cyber_lg', pct: 10 }],
    right: [{ id: 'msci_acwi_ishares', pct: 80 }, { id: 'smallcap_monde', pct: 20 }],
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
  // This scenario checks a first visit; continuity has its own browser test.
  await page.evaluate(() => localStorage.removeItem('epargnant-publication:v1:etf-sheet'));
  await page.reload({ waitUntil: 'networkidle' });
  // Capture la sortie du bouton sans dépendre du presse-papiers du navigateur CI.
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async text => { window.__etfCopiedText = text; } },
  }));
  const select = page.locator("[data-selector]").first();
  const defaultEtf = await select.getAttribute('data-value');
  while(await page.getByRole('button',{name:/^Afficher davantage/}).count()) await page.getByRole('button',{name:/^Afficher davantage/}).click();
  const count = await select.locator("[data-option]").count();
  let badCount = count === ETFS.length ? 0 : 1;
  for (let i = 0; i < count; i++) {
    await choose(select, { index: i });
    await page.locator('.es-card').waitFor({state:'visible'});
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
      || (copied.includes('🏦 PEA : ✅') !== (card.pea === true))
      || !explanations.every(value => copied.includes(value))
      || !sectionPositions.every((position, index) => position >= 0 && (index === 0 || position > sectionPositions[index - 1]))
      || !copied.endsWith('💬 ' + card.question)
      || /undefined|NaN/.test(copied)) badCount++;
    if (card.lastVerified === '15/10/2026' || card.lastVerified === '01/10/2026' || card.id.startsWith('lifestrategy')) {
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
  valid &&= post === buildBrokerPost(['xtb', 'saxo'])
    && post.includes('💰 FRAIS DE COURTAGE PEA')
    && post.includes('🎯 VERDICT')
    && post.includes('VIP')
    && post.includes('PEPS hors PEA')
    && !/à confirmer|non confirmé|sources officielles/.test(post);
  await page.locator('.bc-evidence-broker').last().locator('summary').click();
  valid &&= (await page.locator('.bc-evidence').innerText()).includes('VIP')
    && (await page.locator('.bc-evidence').innerText()).includes('Conversion de devises');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: async text => { window.__brokerCopied = text; } },
  }));
  const edited = post.replace('Tu choisirais lequel', 'Tu préfères lequel');
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

async function testLexicon(page) {
  await page.goto(`${BASE}/fiche-lexique`, { waitUntil: 'networkidle' });
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: async text => { window.__lexiconCopied = text; } },
  }));
  const subjects = FICHE_LEXIQUE_SUBJECTS.flatMap(group => group.items);
  const failed = [];
  for (const subject of subjects) {
    await choose(page.locator('#subject-select'), subject.id);
    await page.getByRole('button', { name: '🔄 Générer', exact: true }).click();
    const expected = getFicheLexiqueText(subject.id);
    const post = await page.locator('pre').innerText();
    await page.getByRole('button', { name: /Copier le texte|Copié ✓/ }).click();
    const copied = await page.evaluate(() => window.__lexiconCopied);
    if (post !== expected || copied !== expected || /undefined|NaN/.test(post)) failed.push(subject.id);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  await page.setViewportSize({ width: 1280, height: 720 });
  record('Fiche lexique', failed.length === 0 && mobile, `${subjects.length} situations, génération et copie exactes, mobile ; échecs : ${failed.join(', ') || 'aucun'}`);
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
  for (const id of ['berkshire', 'asml', 'etfWorldTech','etfAiBigData','etfWorldExUs','etfEmExChina']) {
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
  // The final year advances every January with the collected December close.
  const lastSp500Year = Number(LATEST_HISTORY_YM.slice(0, 4)) - 1;
  const minimal = performance.startsWith(`📈 Performance du S&P 500 de début 2016 à fin ${lastSp500Year} 👇\nTotal Return · USD · dividendes bruts réinvestis\n\n`)
    && performance.split('\n').at(-1).startsWith('Sur toute la période : ')
    && !/💬|Livret A|Cours en dollars/u.test(performance)
    && (await page.getByRole('checkbox').count()) === 0;
  if (!minimal) failed.push('Performance depuis : format minimal');
  for (const id of ['etfWorldTech','etfAiBigData','etfWorldExUs','etfEmExChina']) {
    await choose(page.locator('#subject-select'), id);
    const lastYear = lastCompleteYear(id);
    await choose(page.locator('#secondary-select'), String(lastYear));
    await page.getByRole('button',{name:'🔄 Générer',exact:true}).click();
    const post=await page.locator('pre').innerText();
    if(!post.includes(`${lastYear} :`) || post.includes(`${lastYear - 1} :`) || post.includes(`${INCOMPLETE_YEAR} :`) || /NaN|undefined/.test(post)) failed.push(`${id}: années complètes de la part`);
  }
  await choose(page.locator('#subject-select'), 'stoxx600');
  await page.getByRole('button', { name: '🔄 Générer', exact: true }).click();
  const stoxxPerformance = await page.locator('pre').innerText();
  const stoxxYear = lastCompleteYear('stoxx600');
  const stoxxAnnual = (HISTORY.stoxx600.points.find(p => p.date === `${stoxxYear}-12`).price
    / HISTORY.stoxx600.points.find(p => p.date === `${stoxxYear - 1}-12`).price - 1) * 100;
  if (!stoxxPerformance.includes(`${stoxxYear} : ${fmtHistoryPct(stoxxAnnual)}`)
      || stoxxPerformance.includes(`${INCOMPLETE_YEAR} :`)) failed.push('Performance depuis : historique officiel STOXX');
  await page.getByRole("button", { name: "Comparatif (2 actifs)", exact: true }).click();
  await choose(page.locator('#subject-select-a'), 'sp500');
  await choose(page.locator('#subject-select-b'), 'bitcoin');
  await page.getByRole("button", { name: "🔄 Générer", exact: true }).click();
  const comparison = await page.locator('pre').innerText();
  if ((comparison.match(/^📈 Performance /gmu) ?? []).length !== 2
      || (comparison.match(/^Sur toute la période : /gmu) ?? []).length !== 2
      || comparison.includes('💬')) failed.push('Performance depuis : comparatif');
  await page.getByRole('button', { name: 'Performance depuis', exact: true }).click();
  for (const id of ['berkshire', 'asml', 'costco', 'mcdonalds', 'airliquide', 'schneider', 'hermes', 'loreal', 'intel', 'paypal', 'lvmh', 'nvidia', 'amazon', 'google', 'meta', 'nestle', 'sap', 'visa', 'netflix', 'cocacola', 'euroMoney', 'euroGovShort', 'euroGov13', 'globalBondEur', 'euroInflationBond', 'euroCorporateBond', 'euroHighYieldBond']) {
    await choose(page.locator('#subject-select'), id);
    await choose(page.locator('#secondary-select'), '2020');
    await page.getByRole('button', { name: '🔄 Générer', exact: true }).click();
    const post = await page.locator('pre').innerText();
    if (!post.includes(`${lastCompleteYear(id)} :`) || post.includes(`${INCOMPLETE_YEAR} :`) || /NaN|undefined/.test(post)) failed.push(`Nouvelle entreprise ${id}`);
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
  let editorialOk = /^💸 21\s442\s€ de moins après 20 ans/.test(initial)
    && /148\s612\s€/.test(initial) && /127\s170\s€/.test(initial)
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
  if (count !== MARKET_FACTS.length || count === 0) badCount++;
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
    const id = await select.locator('[data-option]').nth(i).getAttribute('data-value');
    const expected = buildMarketStory(MARKET_FACTS.find(fact => fact.id === id));
    if (/undefined|NaN/.test(text) || !/Source :/.test(evidence)
      || /Source\s*:|https?:\/\//i.test(tweet) || copied !== tweet
      || tweet !== expected || /^💬/m.test(tweet)) badCount++;
  }
  // Un cycle aléatoire complet ne doit proposer ni fiche retirée ni répétition.
  const seen = new Set([await select.getAttribute('data-value')]);
  // La lecture exhaustive ci-dessus a épuisé la session : le premier tirage ouvre un nouveau cycle.
  for (let i = 0; i < count - 1; i++) {
    await page.getByRole('button', { name: '🔄 Fait aléatoire' }).click();
    const id = await select.getAttribute('data-value');
    if (seen.has(id) || !MARKET_FACTS.some(fact => fact.id === id)) badCount++;
    seen.add(id);
  }
  record("Faits marquants des marchés", badCount === 0, `${count} récits : sélection, cycle aléatoire, textes, copie et sources ; ${badCount} échec(s)`);
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
  const more=select.getByRole('button',{name:/^Afficher davantage/});
  while(await more.count())await more.click();
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
      annualReturns: tweet.includes(latestSheetYear(SHEETS[index])),
      sectors: SHEETS[index].sectors.length === 0 || (tweet.includes('🧩 Les principaux secteurs') && sortedRows(SHEETS[index].sectors).slice(0, 3).every(([name, value]) => tweet.includes(`${sectorLabel(name)} : ${value.toLocaleString('fr-FR', { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: value % 1 === 0 ? 0 : 2 })} %`))),
      validText: !/undefined|NaN/.test(tweet),
      sources: (await page.locator('.fs-sources a').count()) >= 1,
      exactStory: tweet === buildFactsheetTweet(SHEETS[index]),
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
  ok &&= (await draft.inputValue()).includes(latestSheetYear(SHEETS.at(-1)));
  await page.locator('.workspace-action-menu summary').click();
  await page.getByRole('button', { name: /Prévisualiser l’image PNG/ }).click();
  const preview = page.getByRole('dialog', { name: 'Aperçu de la fiche PNG' });
  await preview.waitFor({ state: 'visible' });
  ok &&= await preview.isVisible();
  const dimensions = await preview.locator('img').evaluate(async (img) => {
    await img.decode();
    return [img.naturalWidth, img.naturalHeight];
  });
  // Since #780 the factsheet grows with its content: 1600 wide, at least 1600 high, portrait up to 1.6 (same rule as test-index-ribbon).
  const factsheetSize = (width, height) => width === 1600 && height >= 1600 && height / width <= 1.6;
  ok &&= factsheetSize(dimensions[0], dimensions[1]);
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
    const size = await current.locator('img').evaluate(async (img) => {
      await img.decode();
      return [img.naturalWidth, img.naturalHeight];
    });
    ok &&= factsheetSize(size[0], size[1]);
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
  await page.locator('.ds-etf-development > summary').click();
  await page.locator('.ds-etf-development section > h3').nth(3).waitFor({ state:'visible' });
  checks.etfLots = await page.locator('.ds-etf-development section > h3').count() === 5;
  const shortHistory = page.locator('.ds-etf-development section > details').filter({hasText:'IE0003R87OG3'});
  await shortHistory.locator('summary').click();
  checks.etfShortHistory = (await shortHistory.innerText()).includes('Six années communes : indisponibles');
  await page.locator('.ds-etf-development > summary').click();
  const search = page.getByRole('searchbox', { name: 'ISIN, ticker, nom ou identifiant', exact: true });
  await search.fill('DCAM');
  // Le changement de paramètres est une navigation React ; attendre la fiche correspondante.
  await page.locator('.ds-detail').filter({ hasText: 'FR001400U5Q4' }).waitFor();
  const instrumentRecord=DATA_CATALOG.find(record=>record.id==='FR001400U5Q4');
  const peaField=instrumentRecord.fields.find(field=>field.label==='Éligibilité PEA');
  const expectedMaintenance=maintenanceLinks(instrumentRecord,peaField);
  const maintenance=page.locator('.ds-field').filter({ has: page.getByRole('heading', { name: 'Éligibilité PEA', exact: true }) }).locator('.maintenance-links a');
  checks.maintenance=expectedMaintenance.length>0 && JSON.stringify(await maintenance.evaluateAll(links=>links.map(link=>link.href)))===JSON.stringify(expectedMaintenance.map(link=>link.url));
  const instrumentText = await page.locator('.ds-detail').innerText();
  const identityCheckedAt = instrumentRecord.fields.find(field => field.label === 'Identité')?.metadata.checkedAt;
  checks.instrument = Boolean(identityCheckedAt) && instrumentText.includes('FR001400U5Q4') && instrumentText.includes('Euronext Paris') && instrumentText.includes(identityCheckedAt);
  const aum = page.locator('.ds-field').filter({ has: page.getByRole('heading', { name: 'Encours', exact: true }) });
  const expectedAum = DATA_CATALOG.find(record => record.id === 'FR001400U5Q4').fields.find(field => field.label === 'Encours');
  checks.dates = (await aum.locator('dd').first().innerText()) === (expectedAum.metadata.asOf ?? 'Date de valeur non publiée par la source')
    && (await aum.innerText()).includes(expectedAum.metadata.checkedAt);

  const officialAum = page.locator('.ds-field').filter({ has: page.getByRole('heading', { name: 'Encours daté publié par l’émetteur', exact: true }) });
  // The monthly issuer refresh replaces this amount and date: expect the catalogue's current values.
  const expectedOfficialAum = instrumentRecord.fields.find(field => field.label === 'Encours daté publié par l’émetteur');
  checks.officialAum = Boolean(expectedOfficialAum?.value?.asOf) && (await officialAum.locator('dd').first().innerText()) === expectedOfficialAum.value.asOf
    && (await officialAum.innerText()).includes(describeDataField(expectedOfficialAum));
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
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: async text => { window.__householdCopied = text; } },
  }));
  const { HOUSEHOLD_STATISTICS, buildHouseholdTweet } = await import('../src/data/household-statistics.js');
  const waitImage = async (id, design) => {
    await page.waitForFunction(({id, design}) => document.querySelector(`.hh-scope a[download="france-100-menages-${id}-${design}.png"]`)?.href.startsWith('data:image/png'), {id, design});
  };
  let ok = await page.getByLabel('Design', { exact: true }).getAttribute('data-value') === 'illustrated';
  for (const record of HOUSEHOLD_STATISTICS) {
    const { id, referencePeriod, source } = record;
    await choose(page.getByLabel('Sujet', { exact: true }), id);
    await page.waitForURL(`**sujet=${id}`);
    await waitImage(id, 'illustrated');
    ok &&= await page.getByRole('link', { name: 'Télécharger le PNG' }).evaluate(async link => { const img = new Image(); img.src = link.href; await img.decode(); return img.naturalWidth === 2400 && img.naturalHeight === 1350; });
    const text = await page.getByLabel('Texte modifiable').inputValue();
    ok &&= text === buildHouseholdTweet(record);
    await page.getByRole('button', { name: 'Copier le tweet', exact: true }).click();
    ok &&= await page.evaluate(() => window.__householdCopied) === text;
    const sourceURL = (await import('../src/data/household-statistics.js')).HOUSEHOLD_SOURCES[source].url;
    ok &&= !/https?:\/\/|Source\s*:/i.test(text)
      && (await page.locator('.hh-source a[target="_blank"]').getAttribute('href')) === sourceURL
      && (await page.locator('.hh-source').innerText()).includes(referencePeriod);
  }
  for (const { id: design } of (await import('../src/pages/france-100-menages/image.js')).HOUSEHOLD_DESIGNS) {
    const styles = page.locator('.settings-details').filter({ has: page.getByLabel('Design', { exact: true }) });
    if (!(await styles.getAttribute('open') !== null)) await styles.locator('summary').click();
    await choose(page.getByLabel('Design', { exact: true }), design);
    await waitImage(await page.getByLabel('Sujet', { exact: true }).getAttribute('data-value'), design);
    ok &&= await page.getByRole('link', { name: 'Télécharger le PNG' }).evaluate(async (link, design) => { const img = new Image(); img.src = link.href; await img.decode(); return design === 'illustrated' ? img.naturalWidth === 2400 && img.naturalHeight === 1350 : design === 'sculptural' ? img.naturalWidth === 2400 && img.naturalHeight === 1620 : img.naturalWidth === 1080 && img.naturalHeight === 1440; }, design);
  }
  for (const design of ['ivory', 'blue', 'plum']) {
    const styles = page.locator('.settings-details').filter({ has: page.getByLabel('Design', { exact: true }) });
    if (!(await styles.getAttribute('open') !== null)) await styles.locator('summary').click();
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
  await page.getByRole('button', { name: 'Copier le tweet', exact: true }).click();
  ok &&= await page.evaluate(() => window.__householdCopied) === 'Mon texte personnalisé';
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
  const { INVESTORS, dateFR } = await import('../src/pages/investor-portfolio/data.js');
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
    snapshotsOk &&= actual.includes(dateFR(payload.data.snapshot.periodEnd)) && !/NaN|undefined/.test(actual);
    snapshotsOk &&= actual.includes('Les options du relevé sont exclues') === payload.data.snapshot.holdings.some(row => row.putCall);
    const credit = await page.locator('.ip-credit').innerText();
    snapshotsOk &&= credit.includes(payload.data.identity.dataProvider);
  }
  // Données de test contrôlées pour isoler les champs éditoriaux du réseau tiers.
  await page.route('**/data/investors/*.json', async route => {
    const slug = new URL(route.request().url()).pathname.split('/').at(-1).replace('.json', '');
    const displayName = INVESTORS.find(([id]) => id === slug)?.[1];
    await route.fulfill({ headers: { 'access-control-allow-origin': '*' }, json: { as_of: '2026-10-01', data: { identity: { slug, displayName, entityName: 'Déclarant de test', archetype: 'hedge_fund' }, snapshot: { periodEnd: '2026-06-30', filedAt: '2026-08-14', quarterChanges: { priorPeriodLabel: 'Q1 2026', exits: [{ issuerName: 'Sortie de test', ticker: 'EXIT' }] }, holdings: [{ issuerName: 'Entreprise de test', ticker: 'TEST', weight: .6, isNew: true }, { issuerName: 'Hausse de test', ticker: 'UP', weight: .2, sharesChangePct: 18 }, { issuerName: 'Baisse de test', ticker: 'DOWN', weight: .1, sharesChangePct: -12 }, { issuerName: 'Autre position', ticker: 'OTHER', weight: .1 }] } } } });
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
    ok &&= tweet.startsWith('📊 ') && tweet.includes('🔍 Ce qui distingue ce portefeuille') && !/\bje\b|mon attention|me frappe|m’intéresse/i.test(tweet)
      && ['💼 Ses principales positions', '🔍 Ce qui distingue ce portefeuille', '💬 '].every(label => tweet.includes(label))
      && !tweet.includes('📄 Positions issues')
      && !/place-t-il|undefined|NaN|\\\\n/.test(tweet);
    if (!['li-lu', 'gates-trust', 'klarman'].includes(slug)) {
      ok &&= ['🔄 Quelques mouvements depuis le T1 2026', '🆕 Nouvelle ligne', 'nombre d’actions +18 %', 'nombre d’actions −12 %', '🚪 Ligne sortie'].every(label => tweet.includes(label));
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
  const incomplete = JSON.parse(await readFile(new URL('../public/data/investors/tepper.json', import.meta.url), 'utf8'));
  incomplete.data.snapshot.holdings = [{ issuerName: 'Relevé partiel', ticker: 'PART', weight: .1 }];
  await page.route('**/data/investors/tepper.json', route => route.fulfill({ json: incomplete }));
  await page.goto(`${BASE}/portefeuilles-investisseurs`, { waitUntil: 'networkidle' });
  await page.getByRole('alert').filter({ hasText: 'Le relevé 13F est incomplet.' }).waitFor();
  ok &&= await page.getByLabel('Tweet modifiable', { exact: true }).count() === 0;
  await page.unroute('**/data/investors/tepper.json');
  record('Portefeuille d’investisseur', ok, `${INVESTORS.length} présentations et tweets synchronisés, modification, réinitialisation, changement de profil, mobile et rejet des relevés incomplets`);
}

async function testDataReuse(page) {
  await page.goto(`${BASE}/impact-frais`, { waitUntil: 'networkidle' });
  await page.getByText('Utiliser les frais d’un ETF', { exact: true }).click();
  await choose(page.getByLabel('ETF du scénario 1', { exact: true }), 'FR001400U5Q4');
  await choose(page.getByLabel('ETF du scénario 2', { exact: true }), 'IE00BP3QZ601');
  const checks = {};
  checks.preview = (await page.locator('.fi-preview-text').innerText()).includes('FR001400U5Q4')
    && (await page.locator('.fi-preview-text').innerText()).includes('sans comparer leurs performances réelles');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__reuseCopied = text; } } }));
  await page.getByRole('button', { name: 'Copier le texte', exact: true }).click();
  checks.clipboard = (await page.evaluate(() => window.__reuseCopied)).includes('IE00BP3QZ601');
  await page.setViewportSize({ width: 390, height: 844 });
  checks.mobile = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${BASE}/duels-portefeuilles`, { waitUntil: 'networkidle' });
  // Reuse the saved three-line allocation and replace its complement with XEON.
  await page.getByRole('button', { name: 'Composer A et B', exact: true }).click();
  await choose(page.getByRole('group', { name: 'Actif 3 du portefeuille A', exact: true }), 'monetaire_xeon');
  checks.manualReuse = (await page.locator('#pd-tweet').inputValue()).includes('XEON');
  await page.getByRole('button', { name: 'Duels préparés', exact: true }).click();
  const blockchainDuel = DUELS.findIndex(duel => duel.id === 'semiconducteurs_monde-contre-blockchain_ishares');
  if (blockchainDuel < 0) throw new Error('Missing prepared blockchain allocation');
  await choose(page.locator('#pd-select'), String(blockchainDuel));
  checks.commonYears = (await page.locator('.pd-table tbody th').allTextContents()).join(',') === '2023,2024,2025';
  await page.goto(`${BASE}/faits-marquants-marches`, { waitUntil: 'networkidle' });
  await choose(page.getByLabel('Choisir un fait'), 'monthly-drawdown-paypal');
  checks.monthlyStory = (await page.locator('.mf-fact-text').innerText()) === buildMarketStory(MARKET_FACTS.find(fact=>fact.id==='monthly-drawdown-paypal'));
  await page.locator('.mf-details summary').click();
  checks.monthlyMethod = (await page.locator('.mf-details').innerText()).includes(MARKET_FACTS.find(fact => fact.id === 'monthly-drawdown-paypal').note);
  checks.excludedFact = (await page.getByLabel('Choisir un fait').locator('[data-option][data-value="monthly-dca-costco"]').count()) === 0;
  await choose(page.getByLabel('Choisir un fait'), 'monthly-drawdown-nvidia');
  checks.secondMonthlyStory = (await page.locator('.mf-fact-text').innerText()) === buildMarketStory(MARKET_FACTS.find(fact => fact.id === 'monthly-drawdown-nvidia'));
  await page.goto(`${BASE}/bibliotheque-donnees?id=IE00B4JNQZ49&q=IE00B4JNQZ49`, { waitUntil: 'networkidle' });
  checks.catalogConsumers = (await page.locator('.ds-detail').innerText()).includes('Duels de portefeuilles');
  await page.goto(`${BASE}/banque-tweets`, { waitUntil: 'networkidle' });
  await page.getByRole('button', {name:'Pédagogie',exact:true}).click();
  checks.editorialCase = (await page.locator('.tb-tweet-text').allTextContents()).includes(CASES.find(item => item.id === 'world-europe-chiffre').text);
  record('Réutilisation des données', Object.values(checks).every(Boolean), JSON.stringify(checks) + ' · ' + 'ETF et copie frais, mobile, nouvelles périodes des duels, faits mensuels, banque et cas chiffré');
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
  await picker.getByRole('button', { name: 'Parcourir', exact: true }).click();
  await picker.getByRole('button', { name: 'Émergents', exact: true }).click();
  await page.waitForFunction(ids=>ids.includes(document.querySelector('.asset-picker [data-selector]')?.dataset.value),ETFS.map(instrumentOption).filter(item=>item.group==='Émergents').map(item=>String(item.id)));
  const emergingId = await picker.locator('[data-selector]').getAttribute('data-value');
  ok &&= ETFS.map(instrumentOption).some(item => item.id === emergingId && item.group === 'Émergents');
  await picker.getByRole('button', { name: 'Rechercher', exact: true }).click();
  await picker.getByRole('searchbox').fill('introuvable-xyz');
  ok &&= (await picker.locator('.asset-picker-results').innerText()).includes('Aucun résultat');
  await picker.getByRole('button', { name: 'Tout afficher', exact: true }).click();
  await choose(picker.locator('[data-selector]'), worldCard.id);
  const choices = picker.locator('[data-selector]');
  const keyboardId=await choices.locator('[data-option]').nth(1).getAttribute('data-value');
  await choices.locator('[data-option]').nth(1).focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(id=>document.querySelector('.asset-picker [data-selector]')?.dataset.value===id,keyboardId);
  ok &&= await choices.locator('[data-option]').nth(1).getAttribute('aria-pressed') === 'true';
  await picker.getByRole('button', { name: 'Éligibles PEA', exact: true }).click();
  const peaValues = await choices.locator('[data-option]').evaluateAll(nodes => nodes.map(node => node.dataset.value));
  ok &&= peaValues.length > 0 && peaValues.every(id => ETFS.map(instrumentOption).find(item => item.id === id)?.badges.includes('PEA'));
  await picker.getByRole('button', { name: 'Tout afficher', exact: true }).click();
  await choose(choices, worldCard.id);
  await page.getByText('Comparer les supports du même indice', { exact: true }).click();
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
    await page.locator('.pg-replacement > summary').click();
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

  if (process.argv.includes('--data-reuse')) {
    await testPortfolioDuels(page);
    await testDataReuse(page);
  } else if (process.argv.includes('--navigation')) {
    await testWorkspaceNavigation(page);
  } else if (process.argv.includes('--practical-sheets')) {
    await testPracticalSheets(page);
  } else if (process.argv.includes('--investors')) {
    await testInvestorIntroductions(page);
  } else if (process.argv.includes('--market-facts')) {
    await testMarketFacts(page);
  } else if (process.argv.includes('--etfs')) {
    await testEtfSheets(page);
  } else if (process.argv.includes('--data-search')) {
    await testDataSearch(page);
  } else if (process.argv.includes('--lexicon')) {
    await testLexicon(page);
  } else if (process.argv.includes('--index-stories')) {
    await testFactsheetTweets(page);
  } else if (process.argv.includes('--households')) {
    await testHouseholds(page);
  } else if (process.argv.includes('--portfolios')) {
    await testPortfolioGenerator(page);
  } else if (process.argv.includes('--duels')) {
    await testPortfolioDuels(page);
  } else if (process.argv.includes('--broker')) {
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
  await testLexicon(page);
  await testFeeImpact(page);
  await testDataReuse(page);
  await testMarketFacts(page);
  await testTweetBank(page);
  await testFactsheetTweets(page);
  await testDataSearch(page);
  await testHouseholds(page);
  await testInvestorIntroductions(page);
  await testPracticalSheets(page);
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
  // Offer deadlines come from the broker registry: derive the expected cards, never a fixed count.
  const deadlineGroups = groupReviews(buildReview().items.filter(item => item.until));
  await choose(page.getByLabel('Afficher', { exact: true }), 'deadlines');
  // Grouped cards (as rendered): a large review catalogue can delay the filtered DOM on a shared CI runner.
  await page.waitForFunction(count => new URLSearchParams(location.search).get('view') === 'deadlines' && document.querySelectorAll('.data-review > .dr-list > .dr-item').length === count, deadlineGroups.length, { timeout: 60000 }).catch(async error => {
    console.error('Deadline filter mismatch', { expected: deadlineGroups.map(group => group.name), actual: await page.locator('.data-review > .dr-list > .dr-item h2').allTextContents(), url: page.url() });
    throw error;
  });
  reviewChecks.deadlines = deadlineGroups.length > 0 && (await page.locator('.data-review > .dr-list > .dr-item').count()) === deadlineGroups.length;
  reviewChecks.sources = (await page.locator('.data-review > .dr-list').getByRole('link', { name: 'Source ↗', exact: true }).count()) === deadlineGroups.filter(group => group.urls.length === 1).length;
  await page.goto(`${BASE}/donnees-a-revoir?view=calendar&q=FR001400U5Q4`, { waitUntil: 'networkidle' });
  const reviewRows = reviewCalendar(buildReview()).filter(item => [item.name, item.field, ...item.tools, ...item.aliases ?? []].join(' ').includes('FR001400U5Q4'));
  const expectedMaintenance = reviewRows.flatMap(item => item.maintenanceRecord ? maintenanceLinks(item.maintenanceRecord, item.maintenanceField).map(link => link.url) : []);
  const actualMaintenance = await page.locator('.data-review > .dr-list .maintenance-links a').evaluateAll(nodes => nodes.map(node => node.href));
  reviewChecks.maintenance = expectedMaintenance.length > 0 && JSON.stringify(actualMaintenance.sort()) === JSON.stringify(expectedMaintenance.sort());
  const expectedEvidence = reviewRows.flatMap(item => item.urls);
  const actualEvidence = await page.locator('.data-review > .dr-list .dr-links a[target="_blank"]').evaluateAll(nodes => nodes.map(node => node.href));
  reviewChecks.historicalEvidence = expectedEvidence.length > 0 && JSON.stringify(actualEvidence.sort()) === JSON.stringify(expectedEvidence.sort());
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

