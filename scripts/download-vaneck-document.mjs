// Public issuer documents occasionally require JavaScript to initialise regional cookies.
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { officialDocument, regionalGate, requestDocument } from './vaneck-document.mjs';
const url = officialDocument(process.argv[2]);
const executablePath = [process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find(existsSync);
const browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}),
  ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}) });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const userAgent = await page.evaluate(() => navigator.userAgent);
  const headers = { 'User-Agent': userAgent };
  async function initialise(gate) {
    await page.goto(gate.landing, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const continuation = page.getByRole('button', { name: 'Accept & Continue', exact: true });
    // The regional gate can render after DOMContentLoaded; isVisible() does not wait.
    const gateReady = await continuation.waitFor({ state: 'visible', timeout: 10000 }).then(() => true, () => false);
    if (gateReady) {
      const individual = page.getByRole('button', { name: 'Individual Investor', exact: true });
      if (await individual.isVisible()) await individual.click({ timeout: 5000 });
      // The regional URL already selected the country. Clicking its country
      // button opens a dropdown over Accept & Continue instead of selecting it.
      await continuation.click({ timeout: 5000, noWaitAfter: true });
      await page.waitForTimeout(500);
    }
  }
  // US runners can be redirected to the US homepage without a returnUrl.
  // Select an explicit UCITS region before requesting the same document.
  const region = url.pathname.startsWith('/ucits/') ? 'nl' : url.pathname.split('/')[1];
  const document = officialDocument(`https://www.vaneck.com/${region}/en/library/fact-sheets/${url.pathname.split('/').pop()}`);
  const landing = new URL(`https://www.vaneck.com/${region}/en/`);
  landing.searchParams.set('returnUrl', document.pathname);
  const initialGate = regionalGate(landing.href, url);
  await initialise(initialGate);
  let result = await requestDocument(context.request, initialGate.document, url, headers);
  if (result.gate) {
    await initialise(result.gate);
    result = await requestDocument(context.request, result.gate.document, url, headers);
  }
  if (!result.body) throw new Error('Official VanEck regional gate still active');
  process.stdout.write(result.body);
} finally {
  await browser.close();
}
