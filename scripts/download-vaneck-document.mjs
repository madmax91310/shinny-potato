// Public issuer documents occasionally require JavaScript to initialise regional cookies.
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { officialDocument, regionalGate, requestDocument, initialiseRegionalGate } from './vaneck-document.mjs';
const url = officialDocument(process.argv[2]);
const executablePath = [process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find(existsSync);
const browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}),
  ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}) });
let page;
try {
  const context = await browser.newContext();
  page = await context.newPage();
  const userAgent = await page.evaluate(() => navigator.userAgent);
  const headers = { 'User-Agent': userAgent };
  // US runners can be redirected to the US homepage without a returnUrl.
  // Select an explicit UCITS region before requesting the same document.
  const locale = url.pathname.startsWith('/ucits/') ? 'nl/en' : url.pathname.split('/').slice(1, 3).join('/');
  const document = officialDocument(`https://www.vaneck.com/${locale}/library/fact-sheets/${url.pathname.split('/').pop()}`);
  const landing = new URL(`https://www.vaneck.com/${locale}/`);
  landing.searchParams.set('returnUrl', document.pathname);
  const initialGate = regionalGate(landing.href, url);
  await initialiseRegionalGate(page, initialGate);
  let result = await requestDocument(context.request, initialGate.document, url, headers);
  if (result.gate) {
    await initialiseRegionalGate(page, result.gate);
    result = await requestDocument(context.request, result.gate.document, url, headers);
  }
  if (!result.body) throw new Error('Official VanEck regional gate still active');
  process.stdout.write(result.body);
} catch (error) {
  const controls = await page?.locator('#retail, #pi, [data-agree]').evaluateAll(nodes => nodes.map(node => ({id:node.id,role:node.getAttribute('role'),label:node.textContent.trim(),visible:node.getClientRects().length>0}))).catch(() => []);
  process.stderr.write('Public VanEck gate controls: '+JSON.stringify(controls)+'\n');
  throw error;
} finally {
  await browser.close();
}
