"""Describe official research pages; never promote them to financial data.

These are availability clues for the existing pending-source monitor, not a
second holdings collector. Even a dated weighted table requires the admitted
exact-index/share/identity contract before it can enter portfolio calculations.
"""
import json
import re
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]


def source_contracts(url):
    shares = json.loads((ROOT/'scripts/native-index-source-candidates.json').read_text())['shares']
    return [{'subjectIsin':isin,'benchmark':share['benchmark'],'requirements':share['requirements']}
            for isin,share in shares.items() if url in share['sourceUrls']]


def describe_native_source(url, raw, now):
    contracts = source_contracts(url)
    if not contracts:
        return None
    result = {'checkedAt':now.isoformat(),'financialDataQualified':False,
              'qualification':'research-content-only','contracts':contracts}
    if raw.startswith(b'%PDF-'):
        from issuer_documents import pdf_text
        text = pdf_text(raw)
        result.update(contentType='pdf',tableDataRowCount=None,
                      documentDates=list(dict.fromkeys(re.findall(r'\b\d{2}/\d{2}/\d{4}\b',text)))[:12],
                      blocker='Document natif à qualifier : fraîcheur, benchmark exact, preuve de couverture et identifiants. Un PDF accessible ne constitue pas une composition admise.')
        return result
    soup = BeautifulSoup(raw,'html.parser')
    # Script bundles and example JSON must not masquerade as published rows.
    for tag in soup(['script','style','noscript']):
        tag.decompose()
    headers, data_rows, weighted_rows, identified_rows = [], 0, 0, 0
    for table in soup.select('table'):
        head = [cell.get_text(' ',strip=True) for cell in table.select('th')]
        if head:headers.append(head[:20])
        for row in table.select('tr'):
            cells = [cell.get_text(' ',strip=True) for cell in row.select('td')]
            if len(cells)<2 or any('no records' in c.lower() or 'no data' in c.lower() for c in cells):continue
            data_rows += 1
            weighted_rows += int(any(re.fullmatch(r'-?\d+(?:[.,]\d+)?\s*%',c) for c in cells))
            identified_rows += int(any(re.fullmatch(r'[A-Z]{2}[A-Z0-9]{9}\d',c) for c in cells))
    text = soup.get_text(' ',strip=True)
    documents = []
    for link in soup.select('a[href]'):
        target = urljoin(url,link['href'])
        if urlsplit(target).scheme=='https' and re.search(r'\.(?:csv|xlsx?|pdf)(?:$|[?#])',target,re.I) and target not in documents:
            documents.append(target)
    result.update(contentType='html',tableColumns=headers[:12],tableDataRowCount=data_rows,
                  percentBearingTableRowCount=weighted_rows,isinBearingTableRowCount=identified_rows,
                  accessRestrictionMentioned=bool(re.search(r'log\s*in for full access|member.only|licensed clients|reserved.*members',text,re.I)),
                  documentCandidates=documents[:12],
                  blocker='Page de recherche non admise : vérifier un fichier intégral daté, pondéré et identifié du benchmark exact. Les tableaux et liens détectés ne prouvent ni couverture ni droits d’utilisation.')
    return result
