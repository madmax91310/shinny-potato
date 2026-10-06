// Public issuer documents occasionally require JavaScript to initialise regional cookies.
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
const url = new URL(process.argv[2]);
if (url.protocol !== 'https:' || url.hostname !== 'www.vaneck.com'
    || !/^\/(?:ucits|[a-z]{2}\/en)\/library\/fact-sheets\/[a-z0-9]+-fact-sheet\.pdf$/.test(url.pathname)) {
  throw new Error('Unsupported official VanEck document URL');
}
const executablePath = ['/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
const browser = await chromium.launch(executablePath ? { executablePath } : {});
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const userAgent = await page.evaluate(() => navigator.userAgent);
  let response = await context.request.get(url.href, { timeout: 15000, headers: { 'User-Agent': userAgent } });
  let body = await response.body();
  if (!body.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
    const landing = new URL(response.url());
    if (landing.hostname !== url.hostname || landing.protocol !== 'https:') throw new Error('Unexpected issuer redirect');
    await page.goto(landing.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    const continuation = page.getByRole('button', { name: 'Accept & Continue', exact: true });
    if (await continuation.isVisible()) {
      const individual = page.getByRole('button', { name: 'Individual Investor', exact: true });
      if (await individual.isVisible()) await individual.click({ timeout: 5000 });
      const france = page.getByRole('button', { name: 'France', exact: true });
      if (await france.isVisible()) await france.click({ timeout: 5000 });
      await continuation.click({ timeout: 5000, noWaitAfter: true });
      await page.waitForTimeout(500);
    }
    response = await context.request.get(url.href, { timeout: 15000, headers: { 'User-Agent': userAgent } });
    body = await response.body();
  }
  if (!response.ok() || body.length > 8_000_000 || !body.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
    const state = await page.evaluate(() => ({
      text: document.body.innerText.slice(0, 1000),
      buttons: [...document.querySelectorAll('button, input[type="button"], input[type="submit"]')].map(b => b.innerText || b.value).filter(Boolean).slice(0, 35),
      fields: [...document.querySelectorAll('input, select')].map(e => ({name:e.name, type:e.type, id:e.id})).filter(e => e.id || e.name).slice(0, 20),
    }));
    throw new Error(`Public region state: ${JSON.stringify(state)}; Official VanEck document still unavailable after browser initialisation: ${response.status()} ${response.url()}`);
  }
  process.stdout.write(body);
} finally {
  await browser.close();
}
