"""Article identity checks, separate from Trade Republic's financial parsers.

No migration is approved here: a different article ID or locale needs reviewed
evidence before it can replace a qualified source. Generic support is not proof.
"""
import re
from urllib.parse import urlparse, unquote
from bs4 import BeautifulSoup
from data_automation import ResponseFormatError

HOST = 'support.traderepublic.com'
TITLES = {
    '784': 'L’exécution des ordres est-elle soumise à des frais ?',
    '719': 'Combien coûte l’ouverture d’un compte-titres ?',
    '414': 'Quelle devise est utilisée pour verser les dividendes ?',
    '319': 'Comment fonctionne la conversion de devises ?',
    '825': 'Combien de temps cela prend-il pour transférer un compte-titres de Trade Republic vers une autre banque ?',
    'ec74b91a-a9a7-4e80-b520-dd389dfbc68f': 'Qu’est-ce qu’un Plan d’Épargne en Actions (PEA)?',
    '835f9deb-b864-4587-b428-7facfc55296c': 'Direct Price',
}


def article_id(url):
    try:
        p = urlparse(url)
        if (p.scheme != 'https' or p.hostname != HOST or p.username or p.password
                or p.port not in (None, 443) or p.query not in ('', 'web_view=true')):
            return None
        path = unquote(p.path)
        match = re.fullmatch(r'/fr-fr/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}|\d+)(?:-[^/]+)?', path, re.I)
        return match[1].lower() if match else None
    except ValueError:
        return None


def same_article(requested, target):
    identity = article_id(requested)
    return bool(identity and article_id(target) == identity)


def title_key(text):
    return re.sub(r'\s+', '', text.replace('’', "'").replace('‑', '-')).casefold()


def validate_article(requested, actual, raw):
    if not same_article(requested, actual):
        raise ResponseFormatError('Trade Republic article identity lost: ' + actual)
    soup = BeautifulSoup(raw, 'html.parser')
    for node in soup(['nav', 'header', 'footer', 'script', 'style', 'aside']):
        node.decompose()
    headings = soup.find_all('h1')
    identity = article_id(requested)
    if len(headings) != 1:
        raise ResponseFormatError('Trade Republic article heading absent or ambiguous: ' + actual)
    if identity in TITLES and title_key(headings[0].get_text(' ', strip=True)) != title_key(TITLES[identity]):
        raise ResponseFormatError('Trade Republic article heading changed: ' + actual)
    # Canonical metadata must not silently identify another article/region.
    for node in soup.find_all('link', rel='canonical'):
        if not same_article(requested, node.get('href', '')):
            raise ResponseFormatError('Trade Republic canonical article identity changed: ' + actual)
