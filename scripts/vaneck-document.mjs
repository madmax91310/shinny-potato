// Only the requested factsheet may be followed across official regional gates.
export function officialDocument(value, filename) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'www.vaneck.com' || url.port || url.username || url.password
      || !/^\/(?:ucits|[a-z]{2}\/en|fr\/fr)\/library\/fact-sheets\/[a-z0-9]+-fact-sheet\.pdf$/.test(url.pathname)
      || (url.search && url.search !== '?cken=true') || url.hash || (filename && url.pathname.split('/').pop() !== filename)) {
    throw new Error(`Unsupported official VanEck document URL: ${url.href}`);
  }
  return url;
}
export function regionalGate(value, requested) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.host !== 'www.vaneck.com' || url.username || url.password
      || !/^\/(?:[a-z]{2}\/en|fr\/fr)\/$/.test(url.pathname)) throw new Error('Unexpected issuer redirect');
  let target = url.searchParams.get('returnUrl');
  if (!target) throw new Error('Missing VanEck returnUrl');
  // URLSearchParams removes one encoding layer; the issuer sometimes adds another.
  for (let i = 0; i < 3 && !/^(https:\/\/|\/)/.test(target); i++) target = decodeURIComponent(target);
  const document = officialDocument(new URL(target, url).href, requested.pathname.split('/').pop());
  if (!document.pathname.startsWith(url.pathname)) throw new Error('Mismatched VanEck region');
  // The gate's script prefixes the region to absolute return URLs. A root-relative
  // target avoids /nl/en/https%3A... without guessing a replacement document.
  url.search = '';
  url.searchParams.set('returnUrl', document.pathname + document.search);
  return { landing: url.href, document: document.href };
}
export async function requestDocument(request, value, requested, headers) {
  let url = value;
  const seen = new Set();
  for (let hop = 0; hop < 8; hop++) {
    if (seen.has(url)) throw new Error('VanEck redirect loop');
    seen.add(url);
    let response;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await request.get(url, { timeout: 15000, headers, maxRedirects: 0 });
        if (![429, 502, 503, 504].includes(response.status()) || attempt === 1) break;
        await response.dispose?.();
      } catch (error) { if (attempt === 1) throw error; }
    }
    if ([301, 302, 303, 307, 308].includes(response.status())) {
      const location = response.headers().location;
      if (!location) throw new Error('Missing VanEck redirect location');
      const next = new URL(location, url);
      if (/\/library\/fact-sheets\//.test(next.pathname)) url = officialDocument(next.href, requested.pathname.split('/').pop()).href;
      else {
        const gate = regionalGate(next.href, requested);
        await response.dispose?.();
        return { gate };
      }
      await response.dispose?.();
      continue;
    }
    const body = await response.body();
    if (!response.ok() || body.length > 8_000_000 || !body.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
      throw new Error(`Official VanEck document unavailable: ${response.status()} ${url}`);
    }
    return { body };
  }
  throw new Error('Too many VanEck redirects');
}

// The public French gate uses the same retail choice with localized labels.
// Do not select a professional audience or open the country dropdown.
export async function initialiseRegionalGate(page, gate, timeout = 10000) {
  await page.goto(gate.landing, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const continuation = page.getByRole('button', { name: /^(Accept & Continue|Accepter et continuer)$/i });
  const ready = await continuation.waitFor({ state: 'visible', timeout }).then(() => true, () => false);
  if (!ready) return false;
  // Bind the exact public retail identity and label, never country/professional controls.
  const individual = page.locator('#retail:is(button, [role="menuitem"])')
    .filter({ hasText: /^\s*(Individual Investor|Retail Investor|Investisseur individuel)\s*$/i });
  await individual.waitFor({ state: 'visible', timeout: Math.min(timeout, 5000) });
  await individual.click({ timeout: 5000 });
  // A PDF download can retain the old gate; a committed navigation can still
  // wait for slow page resources. requestDocument must still validate the PDF.
  const completed = Promise.any([
    continuation.waitFor({ state: 'hidden', timeout }),
    page.waitForEvent('framenavigated', { predicate: frame => frame === page.mainFrame(), timeout }),
    page.waitForEvent('download', { timeout }),
  ]).then(() => ({ ok: true }), error => ({ ok: false, error }));
  await continuation.click({ timeout: 5000, noWaitAfter: true });
  const result = await completed;
  if (!result.ok) throw new Error('Official VanEck retail confirmation not observed', { cause: result.error });
  return true;
}
