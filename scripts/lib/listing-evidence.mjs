// Contrôle hors réseau : les preuves conservées viennent d'une revue des sources,
// Trois profils justETF sont recoupés avec les documents primaires ;
// pas d'une inférence sur le domicile ou la devise du fonds.
const SOURCE_HOSTS = new Set(['www.ishares.com', 'www.invesco.com', 'www.amundietf.fr', 'www.amundietf.com',
  'www.vaneck.com', 'www.ssga.com', 'www.vanguard.co.uk', 'coinshares.com',
  'globalxetfs.eu', 'dataspanapi.wisdomtree.com', 'bitwiseinvestments.eu', 'cdn.21shares.com', 'www.justetf.com', 'etf.dws.com', 'www.borsaitaliana.it', 'live.euronext.com']);
const MARKETS = {
  XPAR: ['Euronext Paris', /Euronext Paris|EURONEXT PARIS|EN Paris|Venue: Paris|MIC\s*\|\s*XPAR/],
  XAMS: ['Euronext Amsterdam', /Euronext Amsterdam|EURONEXT AMSTERDAM|EN Amsterdam|NYSE Euronext - Amsterdam|NYSE Euronext EUR/],
  XLON: ['London Stock Exchange', /London Stock\s+Exchange|LONDON STOCK EXCHANGE|LSE/],
  XETR: ['Xetra', /Xetra|XETRA|DEUTSCHE BÖRSE|Deutsche Börse|Deutsche Boerse/],
  ETFP: ['Borsa Italiana', /Borsa Italiana|BORSA ITALIANA|Euronext Milan/],
  XSWX: ['SIX Swiss Exchange', /SIX Swiss Ex|SIX SWISS EXCHANGE|Six Swiss Exchange/],
  XMEX: ['Bolsa Mexicana De Valores', /Bolsa Mexicana De Valores/],
  XSGO: ['Santiago Stock Exchange', /Santiago Stock Exchange/],
  CEUX: ['Cboe Europe', /Cboe Europe/],
  XBRN: ['Berne Stock Exchange', /Berne Stock Exchange/],
};
const validUrl = value => {
  try { const u = new URL(value); return u.protocol === 'https:' && SOURCE_HOSTS.has(u.hostname); }
  catch { return false; }
};
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

export function validateListingEvidence({ published, listings, evidence, today = new Date().toISOString().slice(0, 10) }) {
  const errors = [];
  const fail = (isin, message) => errors.push(`${isin} : ${message}`);
  for (const [isin, tickers] of Object.entries(published)) {
    for (const ticker of tickers) {
      if (!(listings[isin] ?? []).some(row => row.ticker === ticker)) fail(isin, `ticker publié sans preuve de cotation : ${ticker}`);
    }
  }
  const usedEvidence = new Set();
  for (const [isin, rows] of Object.entries(listings)) {
    if (!published[isin]?.length || !rows.length) fail(isin, 'cotations sans ticker publié');
    const seen = new Set();
    for (const row of rows) {
      const key = `${row.mic}/${row.ticker}/${row.currency}`;
      if (seen.has(key)) fail(isin, `cotation dupliquée : ${key}`);
      seen.add(key);
      if (!published[isin]?.includes(row.ticker)) fail(isin, `cotation non synchronisée : ${row.ticker}`);
      const proof = evidence[row.evidenceId];
      if (!proof) { fail(isin, `preuve absente : ${key}`); continue; }
      usedEvidence.add(row.evidenceId);
      if (row.sourceUrl?.startsWith('https://www.justetf.com/') &&
          (proof.sourceType !== 'specialist-listing-profile' || !validUrl(proof.identitySourceUrl) ||
           new URL(proof.identitySourceUrl).hostname === 'www.justetf.com' ||
           !proof.identitySourceUrl.includes(isin))) fail(isin, `profil de cotation sans recoupement primaire : ${key}`);
      if (proof.isin !== isin || !proof.identityEvidence?.includes(isin)) fail(isin, `preuve d'une autre part : ${key}`);
      if (!validUrl(row.sourceUrl) || proof.sourceUrl !== row.sourceUrl ||
          proof.currencySourceUrl && !validUrl(proof.currencySourceUrl)) fail(isin, `source non officielle ou divergente : ${key}`);
      if (!validDate(row.checkedAt) || row.checkedAt !== proof.checkedAt || row.checkedAt > today ||
          Date.parse(today) - Date.parse(row.checkedAt) > 180 * 86400000) fail(isin, `date de contrôle invalide ou périmée : ${key}`);
      if (proof.asOf && (!validDate(proof.asOf) || proof.asOf > proof.checkedAt)) fail(isin, `date documentaire invalide : ${key}`);
      const market = MARKETS[row.mic];
      if (!market || market[0] !== row.exchange || !market[1].test(proof.excerpt ?? '')) fail(isin, `place sans preuve : ${key}`);
      const hasToken = (text, token) => typeof text === 'string' && text.split(/[^A-Za-z0-9]+/).includes(token);
      if (!hasToken(proof.excerpt, row.ticker)) fail(isin, `ticker absent de la preuve : ${key}`);
      if (!/^[A-Z]{3}$/.test(row.currency) || !hasToken(proof.currencyExcerpt ?? proof.excerpt, row.currency) ||
          proof.currencyExcerpt && !proof.currencySourceUrl) fail(isin, `devise sans preuve : ${key}`);
    }
  }
  for (const id of Object.keys(evidence)) if (!usedEvidence.has(id)) errors.push(`Preuve orpheline : ${id}`);
  return errors;
}
