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
  let response = await context.request.get(url.href, { timeout: 15000 });
  let body = await response.body();
  if (!body.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
    const landing = new URL(response.url());
    if (landing.hostname !== url.hostname || landing.protocol !== 'https:') throw new Error('Unexpected issuer redirect');
    const page = await context.newPage();
    await page.goto(landing.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    response = await context.request.get(url.href, { timeout: 15000 });
    body = await response.body();
  }
  if (!response.ok() || body.length > 8_000_000 || !body.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
    throw new Error(`Official VanEck document still unavailable after browser initialisation: ${response.status()} ${response.url()}`);
  }
  process.stdout.write(body);
} finally {
  await browser.close();
}
