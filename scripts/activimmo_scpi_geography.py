"""Dated issuer legend, never country weights inferred from map coordinates."""
import datetime as dt
import hashlib
import io
import re
import subprocess
import tempfile
import urllib.parse
from pathlib import Path
from bs4 import BeautifulSoup
from PIL import Image, ImageChops, ImageOps

PRODUCT_URL = 'https://alderan.fr/scpi-activimmo/'
COUNTRIES = ('France', 'Espagne', 'Italie', 'Allemagne', 'Pays-Bas', 'Irlande', 'Portugal')


def legend_url(html, as_of):
    soup = BeautifulSoup(html, 'html.parser')
    titles = [' '.join(h.stripped_strings) for h in soup.select('h1')]
    if len(titles) != 1 or not re.search(r'\bActivimmo\b', titles[0], re.I):
        raise ValueError('Unqualified ActivImmo product identity')
    dates = re.findall(r'FOCUS SUR LE PATRIMOINE AU (\d{2}\.\d{2}\.\d{4})', soup.get_text(' ', strip=True), re.I)
    if len(dates) != 1 or dt.datetime.strptime(dates[0], '%d.%m.%Y').date().isoformat() != as_of:
        raise ValueError('ActivImmo page and bulletin financial dates disagree')
    sections = [s for s in soup.select('.q_elements_item_content')
                if re.fullmatch(r'Répartition géographique\s*\(en valeur vénale\)', ' '.join(s.stripped_strings), re.I)]
    if len(sections) != 1 or len(sections[0].select('img')) != 1:
        raise ValueError('Missing/ambiguous issuer geography legend')
    image = sections[0].select_one('img')
    date = dt.date.fromisoformat(as_of)
    period = f'T{(date.month - 1) // 3 + 1}_{date.year}'
    if date.month % 3 or image.get('alt') != f'Repartition_Geographique_{period}':
        raise ValueError('Unqualified geography image period')
    url = image.get('src', '')
    parts = urllib.parse.urlsplit(url)
    if (parts.scheme != 'https' or parts.netloc != 'alderan.fr' or parts.query or parts.fragment
            or not re.fullmatch(r'/wp-content/uploads/\d{4}/\d{2}/Repartition_Geographique_' + period + r'(?:-\d+)*\.webp', parts.path)):
        raise ValueError('Unqualified official geography image URL')
    return url


def parse_legend(text):
    rows = []
    for line in text.splitlines():
        if not line.strip():
            continue
        match = re.fullmatch(r'\s*([\w -]+?)\s*:\s*(\d+(?:[.,]\d+)?)\s*%\s*', line)
        if not match or match[1].strip() not in COUNTRIES:
            raise ValueError('Unknown geography legend label or printed weight')
        rows.append({'label': match[1].strip(), 'value': float(match[2].replace(',', '.'))})
    if len(rows) != len(COUNTRIES) or {r['label'] for r in rows} != set(COUNTRIES):
        raise ValueError('Incomplete/duplicate geography legend')
    if any(not 0 <= r['value'] <= 100 for r in rows) or abs(sum(r['value'] for r in rows) - 100) > .15:
        raise ValueError('Geography legend total invalid')
    return sorted(rows, key=lambda r: COUNTRIES.index(r['label']))


def read_legend(data):
    image = Image.open(io.BytesIO(data))
    if image.format != 'WEBP' or not 500 <= image.width <= 5000 or not 300 <= image.height <= 3000:
        raise ValueError('Unexpected issuer geography image format/dimensions')
    # Isolate the white printed legend on transparent/coloured bars. This is
    # glyph recognition only: neither map shapes nor donut areas are measured.
    r, g, b, alpha = image.convert('RGBA').split()
    white = ImageChops.darker(ImageChops.darker(r, g), ImageChops.darker(b, alpha))
    mask = ImageOps.invert(white.point(lambda value: 255 if value >= 235 else 0))
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / 'legend.png'
        mask.save(path)
        readings = [parse_legend(subprocess.check_output(
            ['tesseract', str(path), 'stdout', '-l', 'eng', '--psm', str(mode)],
            stderr=subprocess.DEVNULL, timeout=40).decode()) for mode in (6, 11)]
    if readings[0] != readings[1]:
        raise ValueError('Independent geography OCR layouts disagree')
    return readings[0]


def collect_geography(as_of, fetch):
    page = fetch(PRODUCT_URL)
    url = legend_url(page, as_of)
    image = fetch(url)
    countries = read_legend(image)
    return countries, {'asOf': as_of, 'sourceUrls': [PRODUCT_URL, url],
                       'basis': 'issuer-labelled-geography-market-value',
                       'method': 'printed-white-glyphs-tesseract-eng-psm6-and11-agree',
                       'pageSha256': hashlib.sha256(page).hexdigest(),
                       'imageSha256': hashlib.sha256(image).hexdigest()}
