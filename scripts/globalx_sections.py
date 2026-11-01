"""Scope Global X facts independently of React's streamed transport order."""
from data_automation import ResponseFormatError


def fact_sections(text, page_type):
    # Imported only for this issuer; unrelated collectors remain stdlib-only.
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(text, 'html.parser')
    headings = [h for h in soup.find_all('h2')
                if h.get_text(' ', strip=True) in ('Key Information', 'Trading Details')]
    if not headings:
        return None  # Older, non-streamed documents use the existing bounded reader.
    sections = []
    for title, required in [('Key Information', ('Total Expense Ratio', 'Fund AUM')),
                            ('Trading Details', ('Primary ISIN', 'Management Style'))]:
        candidates = set()
        for heading in headings:
            if heading.get_text(' ', strip=True) != title:
                continue
            for parent in heading.parents:
                # Never cross into another semantic section or related product.
                if len(parent.find_all('h2')) != 1:
                    break
                tokens = page_type(str(parent)).tokens
                if all(label in tokens for label in required):
                    candidates.add(tuple(tokens))
                    break
        if len(candidates) != 1:
            raise ResponseFormatError('Incomplete or ambiguous Global X section: ' + title)
        sections.append(list(next(iter(candidates))))
    return tuple(sections)


def objective_benchmark(page, ticker):
    """Read this product's visible objective, never related funds or RSC text.

    Missing wording omits the field so the merge retains its last valid proof.
    Conflicting visible objectives fail rather than selecting one arbitrarily.
    """
    import re
    prefix = (r'^The Global X .+? UCITS ETF \(' + re.escape(ticker)
              + r' LN\) seeks to provide investment results that correspond generally '
              r'to the price and yield performance, before fees and expenses, of the ')
    values = {match.group(1) for token in page.tokens
              if (match := re.fullmatch(prefix + r'([^\n]{3,200} Index)\.', token))}
    if len(values) > 1:
        raise ValueError('Conflicting Global X objective benchmarks')
    return next(iter(values), None)
