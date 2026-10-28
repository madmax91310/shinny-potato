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
