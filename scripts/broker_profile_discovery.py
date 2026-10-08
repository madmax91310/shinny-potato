"""One-hop discovery of public, broker-specific evidence for unresolved scopes."""
import concurrent.futures
import hashlib
import re
from urllib.parse import urljoin, urlparse, urlunparse, unquote
from bs4 import BeautifulSoup
from broker_document_sources import SourceDocument
from broker_profile_qualification import TARGETS

HUBS = {
    ('tr','pme'): ['trPeaHelp'],
    ('tr','garde'): ['trPeaHelp'],
    ('tr','change'): ['trContract', 'trFees'],
    ('ibkr','pme'): ['ibkrAccounts'],
    ('ibkr','jeune'): ['ibkrAccounts'],
    ('ibkr','dca'): ['ibkrAccounts'],
    ('fortuneo','dca'): ['fortuneoBourseFaq'],
    ('fortuneo','cash'): ['fortuneoBourseFaq'],
    ('bourso','cash'): ['boursoCto'],
    ('caidf','cash'): ['caIdfPea'],
    ('caidf','change'): ['caIdfPea', 'caIdfPeaPme'],
    ('bd','cash'): ['bdTariffPage', 'bdContract'],
}
POLICIES = {
    'tr': {'support.traderepublic.com': r'/fr-fr/[^/]+',
           'assets.traderepublic.com': r'/assets/files/[^/]+\.pdf'},
    'ibkr': {'www.interactivebrokers.ie': r'/fr/(?:accounts|trading)/[^/]+',
             'www.ibkrguides.com': r'/clientportal/[^/]+\.htm'},
    'fortuneo': {'www.fortuneo.fr': r'/(?:faq|bourse|files|datas/files)/[^?#]+'},
    'bourso': {'www.boursobank.com': r'/(?:bourse|aide-en-ligne/bourse)/[^?#]+',
               'www.boursorama.com': r'/content/pdf/conditions-generales/[^/]+\.pdf'},
    'caidf': {'www.credit-agricole.fr': r'/(?:ca-paris/particulier/(?:epargne/bourse|informations)/[^?#]+|content/dam/assetsca/cr882/[^?#]+)',
              'ca-paris.credit-agricole.fr': r'/Reglementaire/(?:Tarifs/\d{4}/CADIF_tarif\d{4}_PART/[^/]+\.pdf|[^?#]*particulier[^?#]*\.pdf)'},
    'bd': {'www.boursedirect.fr': r'/(?:fr/(?:bourse|formulaires-en-ligne)[^?#]*|pdf/[^/]+\.pdf)',
           'www.boursedirect.com': r'/(?:fr/(?:bourse|formulaires-en-ligne)[^?#]*|pdf/[^/]+\.pdf)'},
}
KEYWORDS = {
    'pme': r'PEA[- ]PME|PEA|conditions g[eé]n[eé]rales|contrat|account types',
    'jeune': r'PEA|rattach|jeune|conditions g[eé]n[eé]rales|contrat|account types',
    'dca': r'programm|automati|recurring|ordres|conditions g[eé]n[eé]rales|contrat',
    'cash': r'esp[eè]ce|liquidit|r[eé]mun[eé]r|int[eé]r[eê]t|compte[- ]titres|CTO|conditions g[eé]n[eé]rales|contrat',
    'garde': r'garde|custody|tarif|frais|pricing|conditions|contrat',
    'change': r'change|conversion|devis|currency|tarif|frais|pricing|conditions|contrat',
}
EXCLUDED = r'connexion|login|logout|carte|visa|livret|assurance|professionnel|business|blog|formation|comparatif|\bDIT\b|addend'
MAX_CANDIDATES = 8


def allowed(broker, url):
    try:
        p = urlparse(url)
        pattern = POLICIES[broker].get(p.hostname)
        port = p.port
    except ValueError:
        return False
    path = unquote(p.path)
    if any(part in ('.','..') for part in path.split('/')):return False
    return bool(pattern and p.scheme == 'https' and not p.username and not p.password
                and port in (None, 443) and not p.query
                and re.fullmatch(pattern, path, re.I))


def links(broker, field, html, hub):
    found = set()
    soup = BeautifulSoup(html, 'html.parser')
    for node in soup(['nav', 'header', 'footer', 'script', 'style']):
        node.decompose()
    for a in soup.find_all('a', href=True):
        label = a.get_text(' ', strip=True)
        try:
            url = urlunparse(urlparse(urljoin(hub, a['href']))._replace(fragment=''))
        except ValueError:
            continue
        if (url != hub and allowed(broker, url) and re.search(KEYWORDS[field], label, re.I)
                and not re.search(EXCLUDED, label + ' ' + url, re.I)):
            found.add(url)
    return sorted(found)


def discover(fetcher, sources, documents, primary_cache):
    """Return field-specific documents, source metadata and auditable failures.

    Discovery never changes the global registry. Previously confirmed sources
    must still be reachable through the current official document inventory.
    """
    hubs = {sources[key]['url'] for target in TARGETS for key in HUBS[target]}
    cache = dict(primary_cache)
    def fetch(url):
        try:
            raw = fetcher(url)
            if len(raw) > 4_000_000:
                raise ValueError('Document de découverte trop volumineux')
            return url, raw
        except Exception as error:
            return url, error
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        cache.update(pool.map(fetch, sorted(hubs - cache.keys())))
    extra = {}; catalog = dict(sources); report = {}; failures = {}
    for broker, field in sorted(TARGETS):
        field_id = f'{broker}:profile:{field}'
        candidates = {}; consulted = []
        errors = []
        for key in dict.fromkeys(HUBS[(broker,field)] + documents[broker][field]):
            url = sources[key]['url']
            raw = cache.get(url)
            if isinstance(raw, Exception):
                errors.append(url + ': ' + str(raw)); continue
            if raw is None:
                continue
            actual = getattr(raw, 'source_url', url)
            consulted.append({'sourceUrl': actual, 'sha256': hashlib.sha256(raw.encode()).hexdigest()})
            # Supplemental hubs are themselves eligible field-specific sources.
            if key not in documents[broker][field]:
                extra.setdefault((broker, field), {})[key] = raw
            if '<html' in raw.lower() or '<body' in raw.lower():
                for target in links(broker, field, raw, actual):
                    if target not in {sources[k]['url'] for k in documents[broker][field]}:
                        candidates.setdefault(target, actual)
        if len(candidates) > MAX_CANDIDATES:
            errors.append(f'Inventaire trop large : {len(candidates)} candidats, limite {MAX_CANDIDATES}')
        selected = sorted(candidates)[:MAX_CANDIDATES]
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            cache.update(pool.map(fetch, [url for url in selected if url not in cache]))
        for url in selected:
            raw = cache[url]
            if isinstance(raw, Exception):
                errors.append(url + ': ' + str(raw)); continue
            # URL-derived identity is stable across runs; provenance uses actual URL.
            key = 'discovered' + hashlib.sha256(url.encode()).hexdigest()[:16]
            catalog[key] = {'url': url, 'title': f'{broker} · {field} · lien officiel'}
            extra.setdefault((broker, field), {})[key] = SourceDocument(raw, getattr(raw, 'source_url', url), candidates[url])
        report[field_id] = {'hubs': consulted, 'candidates': selected, 'errors': errors}
        if errors:
            failures[field_id + ':discovery'] = '; '.join(dict.fromkeys(errors))
    return extra, catalog, report, failures
