// Public issuer documents occasionally require JavaScript to initialise regional cookies.
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { officialDocument, requestDocument } from './vaneck-document.mjs';
const url = officialDocument(process.argv[2]);
const executablePath = [process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find(existsSync);
const browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}),
  ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}) });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const userAgent = await page.evaluate(() => navigator.userAgent);
  const headers = { 'User-Agent': userAgent };
  let result = await requestDocument(context.request, url.href, url, headers);
  if (result.gate) {
    const gate = result.gate;
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
    result = await requestDocument(context.request, gate.document, url, headers);
  }
  if (!result.body) throw new Error('Official VanEck regional gate still active');
  process.stdout.write(result.body);
} finally {
  await browser.close();
}
