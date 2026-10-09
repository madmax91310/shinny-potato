// Diagnostic only: visit the public index page and read its public JSON in that session.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const configs = JSON.parse(readFileSync('scripts/index-automation.json')).indices.filter(c => c.compositionDataUrl);
const browser = await chromium.launch();
try {
  for (const config of configs) {
    const page = await browser.newPage();
    const response = await page.goto(config.compositionPageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log(config.id, 'page HTTP', response.status());
    const result = await page.evaluate(async url => {
      const r = await fetch(url, { credentials: 'same-origin' });
      const body = await r.text();
      return { status: r.status, body };
    }, config.compositionDataUrl);
    console.log(config.id, 'data HTTP', result.status);
    if (result.status !== 200) throw new Error(`Official S&P public session returned HTTP ${result.status}`);
    const { writeFileSync } = await import('node:fs');
    writeFileSync(`/tmp/${config.id}.json`, result.body);
    await page.close();
  }
} finally { await browser.close(); }
