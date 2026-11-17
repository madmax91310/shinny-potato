"""Read only explicitly shared public HTML; never call private APIs or infer returns."""
import argparse
import hashlib
import json
import math
import subprocess
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, build_opener, HTTPRedirectHandler

ROOT = Path(__file__).resolve().parents[1]
CATALOGUE = ROOT / 'src/pages/public-portfolios/catalogue.json'
MAX_BYTES = 4_000_000

class PublicAccessRestricted(Exception):
    pass

class NextData(HTMLParser):
    def __init__(self):
        super().__init__()
        self.inside = False
        self.parts = []
    def handle_starttag(self, tag, attrs):
        if tag == 'script' and dict(attrs).get('id') == '__NEXT_DATA__':
            self.inside = True
    def handle_endtag(self, tag):
        if tag == 'script':
            self.inside = False
    def handle_data(self, data):
        if self.inside:
            self.parts.append(data)

def number(value):
    return type(value) in (int, float) and math.isfinite(value)

def permitted_url(url):
    u = urlparse(url)
    parts = u.path.strip('/').split('/')
    return (u.scheme == 'https' and u.netloc == 'app.getquin.com' and
            not u.query and not u.fragment and len(parts) == 3 and
            parts[:2] == ['en', 'dashboard'] and parts[2].isalnum())

class PublicRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not permitted_url(newurl):
            raise ValueError('Redirection hors de la page publique autorisée')
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def read_public_html(url):
    if not permitted_url(url):
        raise ValueError('Seuls les liens de tableaux publics Getquin enregistrés sont admis')
    req = Request(url, headers={'User-Agent': 'PublicPortfolioReader/1.0 (public HTML only)',
                               'Accept': 'text/html', 'Accept-Language': 'en'})
    with build_opener(PublicRedirects()).open(req, timeout=30) as response:
        if response.status != 200 or 'text/html' not in response.headers.get('Content-Type', ''):
            raise ValueError('La source ne fournit pas une page HTML publique')
        data = response.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise ValueError('Page publique trop volumineuse')
        return data.decode('utf-8')

def parse_getquin(html, entry):
    parser = NextData()
    parser.feed(html)
    props = json.loads(''.join(parser.parts))['props']
    if props.get('pageProps', {}).get('serverSideNotFound'):
        raise ValueError('Page publique retirée')
    state = props['initialState']['dashboard']
    code = urlparse(entry['url']).path.rsplit('/', 1)[-1]
    dashboard = state['dashboards'][code]
    if dashboard.get('failed') or dashboard.get('loaded') is not True or dashboard.get('is_sample'):
        raise ValueError('Portefeuille indisponible ou de démonstration')
    profile = dashboard.get('profile') or {}
    if (props['pageProps'].get('username', '').casefold() != entry['pseudo'].casefold()
            or profile.get('is_celeb') or profile.get('is_politician')):
        raise ValueError('Identité du portefeuille non conforme à la fiche')
    # The SSR display already supplies position ratios. Never derive historic
    # returns from these positions, nor use uninitialised returns.* == 0 fields.
    positions = dashboard.get('positions_by_ratio')
    if not isinstance(positions, list) or not 1 <= len(positions) <= 500:
        raise ValueError('Allocation publique absente ou schéma modifié')
    rows = []
    for row in positions:
        ratio = row.get('breakdown', {}).get('ratio')
        name = row.get('name') or row.get('title')
        if not isinstance(name, str) or not name.strip() or len(name) > 500:
            raise ValueError('Nom de position invalide')
        if row.get('closed') or row.get('invalid') or not number(ratio) or not 0 <= ratio <= 1:
            raise ValueError('Poids ou position non qualifié')
        identifier = row.get('isin') or ''
        if not isinstance(identifier, str) or len(identifier) > 100:
            raise ValueError('Identifiant de position invalide')
        rows.append({'name': name, 'identifier': identifier, 'weight': ratio * 100})
    total = sum(row['weight'] for row in rows)
    if not 0 < total <= 100.5:
        raise ValueError('Somme des poids incohérente ; dernier relevé conservé')
    # Currency is explicitly specified by the query used to render this HTML.
    # The covered total may be normalised to 100; never expose it as an amount.
    queries = props.get('queryClientCache', {}).get('ROOT_QUERY', {})
    currencies = []
    for key in queries:
        if key.startswith(('getSharedAggregatedDashboard(', 'getDashboard(')):
            params = json.loads(key[key.index('(')+1:-1])
            if (params.get('code') or params.get('uuid')) == code:
                currencies.append(params.get('currency'))
    currency = currencies[0] if len(currencies) == 1 and isinstance(currencies[0], str) else ''
    if len(currency) != 3 or not currency.isalpha() or not currency.isascii():
        raise ValueError('Devise de présentation non identifiée')
    return {'source': entry['url'], 'currency': currency.upper(), 'effective': '',
            'positions': rows,
            'note': 'Poids publiés par Getquin (breakdown.ratio), sans renormalisation. '
                    'Date effective, rendement mensuel et rendement depuis janvier non fournis par cette page. '
                    'Montants masqués ou normalisés ignorés. Contrôle manuel requis.'}

def observation_id(payload):
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()

def collect_entry(entry, previous, now, fetch=read_public_html, deadline=None, restricted_platforms=None):
    result = {'catalogueId': entry['id'], 'source': entry['url'], 'attemptedAt': now,
              'capability': 'partial', 'lastSuccessAt': previous.get('lastSuccessAt', ''),
              'observation': previous.get('observation'), 'error': ''}
    try:
        if restricted_platforms is not None and entry.get('platform') in restricted_platforms:
            raise PublicAccessRestricted()
        remaining = 180 if deadline is None else deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError('Public consultation budget exhausted')
        if entry.get('platform') == 'eToro':
            expected = 'https://www.etoro.com/people/' + entry['pseudo'] + '/stats'
            if entry['url'] != expected:
                raise ValueError('Lien eToro public inattendu')
            try:
                payload = json.loads(subprocess.check_output(
                    ['node', str(ROOT / 'scripts/read-etoro-public.mjs'), entry['pseudo'], now[:10]],
                    cwd=ROOT, timeout=min(180, remaining), text=True, stderr=subprocess.DEVNULL))
            except subprocess.CalledProcessError as error:
                if error.returncode != 77:
                    raise
                if restricted_platforms is not None:
                    restricted_platforms.add('eToro')
                raise PublicAccessRestricted() from None
        else:
            payload = parse_getquin(fetch(entry['url']), entry)
        digest = observation_id(payload)
        old = previous.get('observation')
        result['observation'] = old if old and old.get('id') == digest else {
            **payload, 'id': digest, 'collectedAt': now}
        result['lastSuccessAt'] = now
    except PublicAccessRestricted:
        result['error'] = 'Consultation eToro interrompue : vérification d’accès requise. Dernier relevé conservé ; saisie manuelle disponible.'
    except (TimeoutError, subprocess.TimeoutExpired):
        result['error'] = 'Limite de durée de consultation atteinte. Dernier relevé conservé ; ouvrir la source.'
    except Exception:
        # Never persist credentials, response bodies or exception strings from
        # transport layers; a failed attempt retains the last successful data.
        result['error'] = 'Lecture publique échouée ou schéma modifié. Dernier relevé conservé ; ouvrir la source.'
    return result

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--previous', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    catalogue = json.loads(CATALOGUE.read_text())
    previous = json.loads(args.previous.read_text()) if args.previous and args.previous.exists() else {'entries': []}
    # A newly introduced source may already have a valid initial observation.
    # Preserve it too if its first scheduled read fails during feed migration.
    initial = json.loads((ROOT / 'src/pages/public-portfolios/initial-feed.json').read_text())
    known = {row['catalogueId']: row for row in initial['entries']}
    known.update({row['catalogueId']: row for row in previous['entries']})
    now = datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
    # Leave time to validate and publish the complete failure/success envelope.
    # An unavailable platform must not prevent preserving every last valid row.
    deadline = time.monotonic() + 1050
    restricted_platforms = set()
    entries = [collect_entry(entry, known.get(entry['id'], {}), now, deadline=deadline, restricted_platforms=restricted_platforms) for entry in catalogue]
    result = {'version': 1, 'collectedAt': now, 'entries': entries}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    good = sum(not x['error'] for x in entries)
    print(f'Pages publiques lues : {good}/{len(entries)}. Les échecs conservent leur dernier relevé.')

if __name__ == '__main__':
    main()
