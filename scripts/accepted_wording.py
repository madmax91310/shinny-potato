"""Accepted replacements for official wording that changed (scripts/accepted-source-wording.json)."""
import json
import pathlib
import re

ACCEPTED = json.loads(pathlib.Path(__file__).with_name('accepted-source-wording.json').read_text())


def literal_pattern(text):
    """An accepted passage is literal text; whitespace stays flexible like the documents."""
    return r'\s+'.join(re.escape(word) for word in text.split())


def accepted_clause_match(pattern, text):
    for entry in ACCEPTED.get('clauses', {}).get(pattern, []):
        match = re.search(literal_pattern(entry['text']), text, re.I)
        if match:
            return match
    return None


def accepted_title(product_id, title):
    return title in ACCEPTED.get('titles', {}).get(product_id, [])
