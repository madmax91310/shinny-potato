"""Collect official reference documents for practical sheets, independently per source.

Structured ETF, regulatory and insurance values remain in their existing collectors.
This collector checks editorial evidence and extracts exact support availability.
Document changes are collected, not silently interpreted as new legal rules.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
import datetime as dt
import hashlib
import json
import os
import pathlib
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

ROOT = pathlib.Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'scripts/practical-sheet-sources.json'
DEST = ROOT / 'src/data/automated-practical-sheets.json'

def parse(raw, config):
    if len(raw) < 500 or len(raw) > 10_000_000:
        raise ValueError('Document vide ou trop volumineux')
    if config.get('kind') == 'pdf-policy':
        from collect_scpi import pdf_text
        if not raw.startswith(b'%PDF'):
            raise ValueError('PDF officiel absent')
        full = ' '.join(pdf_text(raw, layout=False).split())
        if any(marker.casefold() not in full.casefold() for marker in config['markers']):
            raise ValueError('Identité du document PDF non confirmée')
        fragments = []
        for pattern in config['policyPatterns']:
            match = re.search(pattern, full)
            if not match:
                raise ValueError('Section pédagogique du PDF absente')
            fragments.append(match.group(0))
        text = ' '.join(fragments)
        title = config['title']
        months = {'janvier':1,'février':2,'mars':3,'avril':4,'mai':5,'juin':6,'juillet':7,'août':8,'septembre':9,'octobre':10,'novembre':11,'décembre':12}
        stamp = re.search(r'document est daté du (\d{1,2}) ([a-zéû]+) (20\d{2})', full)
        if not stamp or stamp[2] not in months:
            raise ValueError('Date du DIC absente')
        published = dt.date(int(stamp[3]),months[stamp[2]],int(stamp[1])).isoformat()
        if published > dt.datetime.now(dt.timezone.utc).date().isoformat():
            raise ValueError('Date du DIC future')
    elif config.get('kind') == 'discourse':
        document = json.loads(raw)
        post = document['post_stream']['posts'][0]
        if post.get('username') != config['author'] or not post.get('admin'):
            raise ValueError('Auteur officiel non confirmé')
        soup = BeautifulSoup(post['cooked'], 'html.parser')
        text = ' '.join(soup.get_text(' ', strip=True).split())
        title = document['title']
        published = post['updated_at'][:10]
    elif config.get('downloadUrl', '').endswith('.xml'):
        root = ET.fromstring(raw)
        body = root.find('Texte')
        if body is None:
            body = root
        text = ' '.join(' '.join(body.itertext()).split())
        title = root.findtext('{http://purl.org/dc/elements/1.1/}title') or config['label']
        published_raw = root.findtext('{http://purl.org/dc/elements/1.1/}date') or ''
        match = re.search(r'\d{4}-\d{2}-\d{2}', published_raw)
        published = match.group(0) if match else None
    else:
        soup = BeautifulSoup(raw, 'html.parser')
        for tag in soup.select('script,style,nav,footer,header,noscript'):
            tag.decompose()
        body = soup.select_one(config.get('selector', 'main')) or soup.select_one('main') or soup.body
        if body is None:
            raise ValueError('Contenu principal absent')
        text = ' '.join(body.get_text(' ', strip=True).split())
        heading = soup.select_one('h1')
        title = heading.get_text(' ', strip=True) if heading else config['label']
        published = None
        if config.get('editorialSelector'):
            editorial = BeautifulSoup(raw, 'html.parser')
            heading = editorial.select_one('h1')
            if heading: title = heading.get_text(' ',strip=True)
            fragments = [' '.join(node.get_text(' ',strip=True).split()) for node in editorial.select(config['editorialSelector'])]
            fragments = [text for text in fragments if any(marker.casefold() in text.casefold() for marker in config['editorialMarkers'])]
            if len(fragments) < 2:
                raise ValueError('Sections éditoriales attendues absentes')
            # Policy descriptions and warnings only, excluding daily NAV/AUM changes.
            text = title+' '+' '.join(dict.fromkeys(fragments))
    folded = (full if config.get('kind') == 'pdf-policy' else text).casefold()
    if len(text) < 150 or any(marker.casefold() not in folded for marker in config['markers']):
        raise ValueError('Identité du document non confirmée')
    if any(wall in folded for wall in ['access denied', 'verify you are human', 'just a moment...']):
        raise ValueError('Page de blocage au lieu de la source')
    result = {'title':title, 'publishedAt':published,
              'contentHash':hashlib.sha256(text.encode()).hexdigest()}
    if config.get('kind') == 'discourse':
        result['listedIsins'] = [isin for isin in config['supportIsins'] if re.search(r'\b'+isin+r'\b',text)]
        result['contractIds'] = config['contractIds']
        fee = re.search(r'passent de [0-9,]+ % à ([0-9,]+) %', text)
        if not fee or len(result['listedIsins']) != len(config['supportIsins']):
            raise ValueError('Supports ou tarif ETC non confirmés')
        result['transactionPct'] = float(fee.group(1).replace(',', '.'))
        if not 0 <= result['transactionPct'] <= 2:
            raise ValueError('Tarif ETC hors plage')
    elif config.get('supportIsins'):
        # Exact identifier in a published support table, never inferred from product name.
        rows = soup.select('table tr')
        table_text = ' '.join(row.get_text(' ', strip=True) for row in rows)
        if not rows or 'ISIN' not in table_text or len(re.findall(r'\b[A-Z]{2}[A-Z0-9]{9}\d\b', table_text)) < 10:
            raise ValueError('Liste des supports incomplète')
        result['listedIsins'] = [isin for isin in config['supportIsins'] if re.search(r'\b'+isin+r'\b',table_text)]
        result['scope'] = 'Liste publique des ETF des contrats Spirica chez Linxea ; absence de la liste ne prouve pas une inéligibilité générale.'
    return result

# SEC fair-access policy: automated requests must name the collector and give a contact
# address. Observed from a GitHub runner on 18/10/2026 (PR #775): with a
# @users.noreply.github.com address (or no address) every www.sec.gov page answers 403
# "Request Rate Threshold Exceeded" and data.sec.gov answers 403 "Undeclared Automated
# Tool", from the very first request; the same requests with a contact address on an
# ordinary mail domain answer 200. Public contact address chosen by the account owner
# (18/10/2026); the SEC_USER_AGENT environment variable can override it.
SEC_CONTACT_USER_AGENT = 'EpargnantLibre lepargnantlibre@gmail.com'

def sec_user_agent():
    agent = (os.environ.get('SEC_USER_AGENT') or SEC_CONTACT_USER_AGENT).strip()
    if not re.search(r'\S+@\S+\.\w+', agent) or 'noreply' in agent.casefold():
        raise ValueError('SEC_USER_AGENT absent ou sans adresse de contact joignable '
                         '(secret du dépôt, ex. « Nom du projet contact@domaine.fr ») : la SEC refuse la requête')
    return agent

def user_agent(url):
    host = urllib.parse.urlsplit(url).hostname or ''
    if host == 'sec.gov' or host.endswith('.sec.gov'):
        return sec_user_agent()
    return 'Mozilla/5.0 (public financial reference collection)'

def http_error_reason(error):
    """Keep the refusal page title (e.g. SEC "Request Rate Threshold Exceeded") in the error."""
    try:
        title = re.search(rb'<title>(.*?)</title>', error.read(20_000), re.S | re.I)
    except Exception:
        title = None
    reason = ' '.join(title.group(1).decode('utf-8', 'replace').split()) if title else ''
    return f'HTTP Error {error.code}: {error.reason}' + (f' ({reason})' if reason else '')

def collect(key, config, previous, today):
    try:
        url = config.get('downloadUrl', config['url'])
        request = urllib.request.Request(url, headers={'User-Agent':user_agent(url)})
        with urllib.request.urlopen(request, timeout=35) as response:
            raw = response.read(10_000_001)
        parsed = parse(raw, config)
        old_hash = previous.get('contentHash')
        changed = bool(old_hash and parsed['contentHash'] != old_hash)
        return key, {**parsed,'label':config['label'],'sourceUrl':config['url'],
                     'checkedAt':today,'lastAttemptAt':today,'status':'ok',
                     'changedAt':today if changed else previous.get('changedAt'),
                     'reviewRequired':changed or previous.get('reviewRequired',False)}, None
    except Exception as error:
        if isinstance(error, urllib.error.HTTPError):
            error = ValueError(http_error_reason(error))
        return key, {**previous, 'label':config['label'],'sourceUrl':config['url'],
                     'lastAttemptAt':today,'status':'error','error':str(error)[:250]}, str(error)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--output')
    args = parser.parse_args()
    configs = json.loads(CONFIG.read_text())
    previous = json.loads(DEST.read_text()) if DEST.exists() else {'sources':{}}
    today = dt.datetime.now(dt.timezone.utc).date().isoformat()
    with ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(lambda item:collect(item[0],item[1],previous['sources'].get(item[0],{}),today),configs.items()))
    snapshot = {'schemaVersion':1,'sources':{key:record for key,record,_ in results}}
    failed = [key for key,_,error in results if error]
    changed = [key for key,record,_ in results if record.get('reviewRequired')]
    if args.apply:
        temp = DEST.with_suffix('.tmp')
        temp.write_text(json.dumps(snapshot,ensure_ascii=False,indent=2)+'\n')
        temp.replace(DEST)
    report = {'failed':failed,'changed':changed,'sources':snapshot['sources']}
    if args.output:
        pathlib.Path(args.output).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    for key,_,error in results:
        if error:
            # The reason (HTTP status, identity check...) must be readable in the run log.
            print(f'{key}: {error}', file=sys.stderr)
    print(json.dumps({'collected':len(results)-len(failed),'failed':failed,'changed':changed},ensure_ascii=False))
    return 1 if failed or changed else 0

if __name__ == '__main__':
    raise SystemExit(main())
