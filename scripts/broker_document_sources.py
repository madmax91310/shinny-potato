"""Find current brochures on official catalogues, preserving exact provenance.

Only download errors permit an alternate document. A changed clause in a newly
downloaded document must fail its parser instead of falling back to an old PDF.
"""
import re
import datetime as dt
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
from data_automation import ResponseFormatError

XTB_TARIFF = 'https://www.xtb.com/fr/fichiers/table-des-frais-et-commissions_052026.pdf'
XTB_CATALOGUE = 'https://www.xtb.com/fr/informations-legales'


def xtb_tariff_url(url):
    """Only the French tariff route and its official rotating CDN document."""
    try:
        parsed = urlparse(url)
        if (parsed.scheme != 'https' or parsed.username or parsed.password
                or parsed.port not in (None, 443) or parsed.query or parsed.fragment):
            return False
        if parsed.hostname in ('www.xtb.com', 'xtb.com'):
            pattern = r'/fr/fichiers/table-des-frais-et-commissions_\d{6}\.pdf'
        elif parsed.hostname == 'xas-new-cdn.xtb.com':
            pattern = (r'/file/\d{4}/\d{2}/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}'
                       r'/table-des-frais-et-commissions-\d{6}\.pdf')
        else:
            return False
        return bool(re.fullmatch(pattern, parsed.path, re.I))
    except ValueError:
        return False

# Labels are the links inspected on the official catalogues, not guessed years.
CATALOGUES = {
 'https://www.credit-agricole.fr/content/dam/assetsca/cr882/npc/documents/fip-et-cgl/76040.1773337045911.CGL_CTO_PDF.pdf': {
  'page':'https://www.credit-agricole.fr/ca-paris/particulier/informations/relation-banque-client/gestion-epargne.html',
  'label':r'^Convention de Compte Titres Ordinaire$', 'hosts':('www.credit-agricole.fr',),
  'path':r'/content/dam/assetsca/cr882/npc/documents/fip-et-cgl/[^/]*CGL_CTO_PDF\.pdf$'},
 'https://www.fortuneo.fr/datas/files/tarifs_fortuneo.pdf': {
  'page': 'https://www.fortuneo.fr/tarifs', 'label': r'^Conditions tarifaires en vigueur$',
  'hosts': ('www.fortuneo.fr',), 'path': r'/[^?]*tarifs_fortuneo[^/]*\.pdf$'},
 'https://www.boursedirect.fr/pdf/tarifs_bd.pdf': {
  'page': 'https://www.boursedirect.fr/fr/formulaires-en-ligne', 'label': r'^Tarification 0,99\s*€$',
  'hosts': ('www.boursedirect.fr', 'www.boursedirect.com'), 'path': r'/pdf/tarifs[^/]*\.pdf$'},
 'https://www.boursedirect.fr/pdf/CGBDMARS24.pdf': {
  'page': 'https://www.boursedirect.fr/fr/formulaires-en-ligne', 'label': r'^Conditions Générales courantes$',
  'hosts': ('www.boursedirect.fr', 'www.boursedirect.com'), 'path': r'/pdf/CG[^/]*\.pdf$'},
 'https://www.home.saxo/-/media/documents/regional/fr-fr/manuals/brochure-tarifaire-generale-2026.pdf': {
  'page': 'https://www.home.saxo/fr-fr/rates-and-conditions/pricing-overview',
  'label': r'^Brochure tarifaire$', 'hosts': ('www.home.saxo',),
  'path': r'/-/media/documents/regional/fr-fr/manuals/brochure-tarifaire-generale[^/]*\.pdf$'},
 XTB_TARIFF: {
  'page': XTB_CATALOGUE, 'label': r'^TABLE DES FRAIS ET COMMISSIONS$',
  'hosts': ('www.xtb.com', 'xtb.com', 'xas-new-cdn.xtb.com'),
  'path': r'/[^?]*\.pdf$', 'accessibleLabel': True, 'urlValidator': xtb_tariff_url},
 'https://ca-paris.credit-agricole.fr/Reglementaire/Tarifs/2026/CADIF_tarif2026_PART/conditions_tarifaires_particuliers_caidf_04_2026.pdf': {
  'page': 'https://www.credit-agricole.fr/ca-paris/particulier/informations/tarif.html',
  'label': r'^télécharger en pdf$', 'hosts': ('ca-paris.credit-agricole.fr',),
  'path': r'/Reglementaire/Tarifs/\d{4}/CADIF_tarif\d{4}_PART/conditions_tarifaires_particuliers_caidf_\d{2}_\d{4}\.pdf$',
  'datedRegionalBrochures': True},
}
ALTERNATIVES = {
 'https://www.boursedirect.fr/pdf/tarifs_bd.pdf': ('https://www.boursedirect.com/pdf/tarifs_bd.pdf',),
 'https://www.boursedirect.fr/pdf/CGBDMARS24.pdf': ('https://www.boursedirect.com/pdf/CGBDMARS24.pdf',),
 'https://www.fortuneo.fr/datas/files/tarifs_fortuneo.pdf': ('https://www.fortuneo.fr/files/tarifs_fortuneo.pdf',),
}

class SourceDocument(str):
    def __new__(cls, text, source_url, discovery_url=None):
        obj = super().__new__(cls, text)
        obj.source_url = source_url
        obj.discovery_url = discovery_url
        return obj

def official_link(html, config, today=None):
    today = today or dt.datetime.now(dt.timezone.utc).date().isoformat()
    links = set()
    for a in BeautifulSoup(html, 'html.parser').find_all('a', href=True):
        label = re.sub(r'\s+', ' ', a.get_text(' ', strip=True)).strip()
        if config.get('accessibleLabel'):
            accessible = re.sub(r'\s+', ' ', a.get('aria-label', '')).strip()
            if label and accessible and label.casefold() != accessible.casefold():
                if any(re.fullmatch(config['label'], value, re.I) for value in (label, accessible)):
                    raise ValueError('Libellés du catalogue contradictoires')
            if not label:
                label = accessible
        if not re.fullmatch(config['label'], label, re.I):
            continue
        target = urljoin(config['page'], a['href'])
        parsed = urlparse(target)
        if config.get('datedRegionalBrochures') and not re.fullmatch(config['path'], parsed.path, re.I):
            # DIT, addenda and other customer segments are separate documents.
            continue
        if (parsed.scheme != 'https' or parsed.hostname not in config['hosts']
                or parsed.username or parsed.password
                or (config.get('urlValidator') and not config['urlValidator'](target))
                or not re.fullmatch(config['path'], parsed.path, re.I)):
            raise ValueError('Lien du catalogue hors périmètre officiel : ' + target)
        links.add(target)
    if config.get('datedRegionalBrochures'):
        dated = []
        for target in links:
            month, year = re.search(r'_(\d{2})_(\d{4})\.pdf$', urlparse(target).path).groups()
            date = dt.date(int(year), int(month), 1).isoformat()
            if date <= today:
                dated.append((date, target))
        if dated:
            latest = max(date for date, _ in dated)
            links = {target for date, target in dated if date == latest}
        else:
            links = set()
    if len(links) != 1:
        raise ValueError('Brochure courante absente ou ambiguë dans le catalogue officiel')
    return links.pop()

class DocumentResolver:
    def __init__(self, fetcher, today=None, previous_sources=None):
        self.fetcher = fetcher
        self.today = today
        self.previous_sources = previous_sources or {}
        self.cache = {}
        self.report = {}

    def fetch(self, url):
        if url not in self.cache:
            try:
                self.cache[url] = self.fetcher(url)
            except Exception as error:
                self.cache[url] = error
        result = self.cache[url]
        if isinstance(result, Exception):
            raise result
        return result

    def __call__(self, url):
        # Revision parameters are cache-busters for the same Saxo brochure.
        canonical = url.split('?')[0] if 'www.home.saxo/-/media/' in url else url
        config = CATALOGUES.get(canonical)
        errors = []
        if config:
            try:
                html = self.fetch(config['page'])
            except Exception as error:
                errors.append(str(error))
            else:
                # Ambiguous/changed catalogues are not a network outage: do not
                # silently certify the frozen fallback instead of the new PDF.
                target = official_link(html, config, self.today)
                try:
                    text = self.fetch(target)
                    if config.get('urlValidator') and not config['urlValidator'](getattr(text, 'source_url', target)):
                        raise ValueError('Source finale hors périmètre officiel')
                    self.report[canonical] = {'sourceUrl': getattr(text,'source_url',target), 'discoveryUrl': config['page'], 'mode': 'catalogue'}
                    return SourceDocument(text, getattr(text,'source_url',target), config['page'])
                except Exception as error:
                    # A current brochure was found but cannot be downloaded.
                    # Keep last qualified data; an older URL could hide changes.
                    raise ValueError('Brochure courante inaccessible : ' + target + ': ' + str(error)) from error
        previous = self.previous_sources.get(canonical)
        if previous and config:
            parsed = urlparse(previous)
            if (parsed.scheme != 'https' or parsed.hostname not in config['hosts']
                    or parsed.username or parsed.password
                    or (config.get('urlValidator') and not config['urlValidator'](previous))
                    or not re.fullmatch(config['path'], parsed.path, re.I)):
                raise ValueError('Dernière source qualifiée hors périmètre officiel')
        for candidate in dict.fromkeys((*([previous] if previous else []), url, *ALTERNATIVES.get(canonical, ()))):
            try:
                text = self.fetch(candidate)
            except Exception as error:
                if config and config.get('urlValidator') and isinstance(error, ResponseFormatError):
                    # Invalid provenance/content is not a transient outage.
                    raise
                errors.append(candidate + ': ' + str(error))
                continue
            if config and config.get('urlValidator') and not config['urlValidator'](getattr(text, 'source_url', candidate)):
                raise ValueError('Source finale hors périmètre officiel')
            self.report[canonical] = {'sourceUrl': getattr(text,'source_url',candidate), 'mode': 'fallback' if errors or candidate != url else 'direct', 'catalogueErrors': errors}
            return SourceDocument(text, getattr(text,'source_url',candidate))
        raise ValueError('; '.join(errors))
