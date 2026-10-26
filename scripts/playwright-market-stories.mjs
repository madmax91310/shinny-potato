import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import stories from '../src/pages/market-facts/stories.json' with { type: 'json' };
import { FACTS } from '../src/pages/market-facts/data.js';
import { buildTweetText } from '../src/pages/market-facts/lib.js';
const narratives = FACTS.filter(fact => fact.kind !== 'measured-reference');

const base = 'http://127.0.0.1:4312/shinny-potato';
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4312', '--strictPort'], { stdio: 'pipe', detached: true });
let browser;
try {
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch(`${base}/`)).ok) break; } catch { /* démarrage */ }
    if (attempt >= 600) throw new Error('Le serveur de preview ne démarre pas');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {});
  await mkdir('test-artifacts', { recursive: true });
  for (const width of [1440, 390, 360]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/faits-marquants-marches`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Histoires de marchés', exact: true }).waitFor();
    const search = page.getByRole('searchbox', { name: 'Rechercher : Choisir un fait', exact: true });
    await search.fill('SVB');
    assert.equal(await page.locator('[data-option]').count(), 1);
    await page.locator('[data-option]').click();
    assert.equal(await page.locator('.mf-card').getAttribute('data-story-id'), 'story:svb-retraits-2023');
    await search.fill('aucun-récit-avec-ce-nom');
    await page.getByRole('status', { name: '' }).filter({ hasText: 'Aucun résultat' }).waitFor();
    await page.getByRole('button', { name: 'Effacer la recherche' }).click();
    for (const story of FACTS) {
      await page.locator(`[data-option][data-value="${story.id}"]`).click();
      if (width < 900) await page.getByRole('button', { name: 'Aperçu', exact: true }).click();
      await page.locator('.mf-fact-text').waitFor({ state: 'visible' });
      assert.equal(await page.locator('.mf-fact-text').innerText(), buildTweetText(story));
      const details = page.locator('.mf-details');
      if (!(await details.evaluate(node => node.open))) await details.locator('summary').click();
      const links = details.locator('a');
      assert.equal(await links.count(), story.sources.length, story.id);
      for (let index = 0; index < story.sources.length; index++) {
        assert.equal(await links.nth(index).getAttribute('href'), story.sources[index].url);
        assert.equal(await links.nth(index).getAttribute('target'), '_blank');
        assert((await details.innerText()).includes(story.sources[index].facts[0]));
      }
      assert((await details.innerText()).includes(story.reserves[0]));
      await page.getByRole('button', { name: /Copier le texte|Copié/ }).click();
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), buildTweetText(story), `${width}px ${story.id}`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px débordement ${story.id}`);
      if (width < 900) await page.getByRole('button', { name: 'Réglages', exact: true }).click();
    }
    // Un repère reste accessible manuellement, mais ne remplace jamais une histoire tirée au sort.
    await page.reload({ waitUntil: 'networkidle' });
    const seen = new Set([await page.locator('.mf-card').getAttribute('data-story-id')]);
    for (let index = 1; index < narratives.length; index++) {
      await page.getByRole('button', { name: '🔄 Histoire aléatoire', exact: true }).click();
      const id = await page.locator('.mf-card').getAttribute('data-story-id');
      assert(narratives.some(fact => fact.id === id), `Le tirage doit proposer un récit relu : ${id}`);
      assert(!seen.has(id), `Répétition avant épuisement : ${id}`);
      seen.add(id);
    }
    const previous = await page.locator('.mf-card').getAttribute('data-story-id');
    await page.getByRole('button', { name: '🔄 Histoire aléatoire', exact: true }).click();
    assert.notEqual(await page.locator('.mf-card').getAttribute('data-story-id'), previous);
    await page.locator('[data-option][data-value="story:cisco-stocks-2001"]').click();
    if (width < 900) await page.getByRole('button', { name: 'Aperçu', exact: true }).click();
    await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
    await page.screenshot({ path: `test-artifacts/market-stories-${width}.png`, fullPage: true });
    await page.locator('.mf-details summary').click();
    await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
    await page.screenshot({ path: `test-artifacts/market-stories-sources-${width}.png`, fullPage: true });
    // L'action ouvre réellement un onglet distinct, sans ajouter le lien au presse-papiers.
    const popupPromise = page.waitForEvent('popup');
    await page.locator('.mf-sources a').first().click();
    const popup = await popupPromise;
    await popup.waitForURL(stories[0].sources[0].url, { waitUntil: 'commit' });
    await popup.close();
    assert.deepEqual(errors, []);
    console.log(`${width}px : ${FACTS.length} lectures/copies exactes, preuves, recherche, ouverture source, aucun débordement ; cycle de ${seen.size} récits sans répétition.`);
    await context.close();
  }
} finally {
  await browser?.close();
  try { process.kill(-server.pid, 'SIGTERM'); } catch { /* serveur déjà terminé */ }
}
