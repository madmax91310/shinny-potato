"""Public Finviz estimates. Preserve missing estimates; verify published ratios.

The published price can be intraday. Consumers recalculate both ratios from
raw estimates and their independently collected completed-session close.
"""
import math
from bs4 import BeautifulSoup
from company_publications import get

METHOD_URL = 'https://finviz.com/help/screener'


def parse(raw, profile, today):
    soup = BeautifulSoup(raw, 'html.parser')
    ticker = soup.select_one('h1[data-ticker]')
    if not ticker or ticker.get('data-ticker') != profile['symbol'] or profile['currency'] != 'USD':
        raise ValueError('Wrong forecast identity or unsupported currency')
    fields = {}
    for table in soup.select('table.snapshot-table2'):
        for tr in table.find_all('tr'):
            cells = tr.find_all('td', recursive=False)
            for i in range(0, len(cells)-1, 2):
                label = cells[i].select_one('.snapshot-td-label')
                value = cells[i+1].select_one('.snapshot-td-content')
                if label and value:
                    key = (label.get_text(' ', strip=True), cells[i].get('data-boxover-html', ''))
                    if key in fields:
                        raise ValueError('Duplicate forecast field')
                    fields[key] = value.get_text(' ', strip=True)
    def number(label, definition=None):
        values = [v for (key, tip), v in fields.items() if key == label and (definition is None or tip == definition)]
        if len(values) != 1:
            raise ValueError('Missing or ambiguous forecast field: ' + label)
        if values[0] == '-':
            return None
        result = float(values[0].replace(',', '').removesuffix('%'))
        if not math.isfinite(result):
            raise ValueError('Nonfinite estimate')
        return result
    price = number('Price')
    eps = number('EPS next Y', 'EPS estimate for next year')
    forward = number('Forward P/E', 'Forward Price-to-Earnings (next fiscal year)')
    peg = number('PEG', 'Price-to-Earnings-to-Growth')
    growth = number('EPS next 5Y', 'Long term annual growth estimate (5 years)')
    if price is None or price <= 0:
        raise ValueError('Missing provider price')
    # Allow displayed rounding: price .01, EPS .01, growth .01, ratios .01.
    if eps is not None and eps > 0 and forward is not None:
        if abs(price / eps - forward) > max(.03, forward * .006):
            raise ValueError('Forward ratio does not match estimated EPS')
    elif forward is not None and forward > 0:
        raise ValueError('Forward ratio without positive estimated earnings')
    if peg is not None and peg > 0:
        if forward is None or forward <= 0 or growth is None or growth <= 0 or abs(forward / growth - peg) > max(.03, peg * .006):
            raise ValueError('PEG does not match documented forward/5Y method')
    return {'forwardEPS': eps, 'growthEPS5Y': growth,
            'reportedForwardPE': forward, 'reportedPEG': peg, 'providerPrice': price,
            'observedAt': today.isoformat(), 'sourceName': 'Finviz',
            'sourceUrl': 'https://finviz.com/quote.ashx?t=' + profile['symbol'],
            'methodUrl': METHOD_URL,
            'forwardHorizon': 'Prochain exercice fiscal selon Finviz',
            'pegHorizon': 'Croissance annuelle estimée du BPA sur cinq ans',
            'earningsBasis': 'Base comptable des estimations non précisée par le fournisseur'}


def collect(profile, today):
    return parse(get('https://finviz.com/quote.ashx?t=' + profile['symbol']), profile, today)
