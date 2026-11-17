"""Resolve reviewed person/file associations; never select a search-result photo."""
import hashlib
import html
import json
import os
from pathlib import Path
import re
import urllib.error
import urllib.parse
import urllib.request


def reusable(license):
    return license.startswith(('CC BY ', 'CC BY-SA ')) or license in ('Domaine public', 'CC0')


def plain(value):
    return ' '.join(html.unescape(re.sub('<[^>]+>', '', value)).split())


def remote_json(url):
    cache = Path(os.environ.get('INVESTOR_HTTP_CACHE', '.cache/investor-http')) / 'media'
    cache.mkdir(parents=True, exist_ok=True)
    path = cache / (hashlib.sha256(url.encode()).hexdigest()+'.json')
    saved = json.loads(path.read_text()) if path.exists() else {}
    headers = {'User-Agent': 'EpargnantLibre/1.0 verified investor media', 'Accept': 'application/json'}
    if saved.get('etag'):
        headers['If-None-Match'] = saved['etag']
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=25) as response:
            data = json.load(response)
            path.write_text(json.dumps({'etag': response.headers.get('ETag'), 'data': data}))
            return data
    except urllib.error.HTTPError as error:
        if error.code == 304 and saved:
            return saved['data']
        raise


def resolve(source, slug, output):
    reviewed = source['commonsPortrait']
    qid, title = reviewed['wikidataId'], reviewed['title']
    if not re.fullmatch(r'Q[1-9][0-9]*', qid) or not reviewed.get('identitySource') or not source.get('person'):
        raise ValueError('Association personne/photo non vérifiée')
    entity_url = 'https://www.wikidata.org/wiki/Special:EntityData/'+qid+'.json'
    entity = remote_json(entity_url)['entities'][qid]
    associated = [r['mainsnak'].get('datavalue', {}).get('value') for r in entity.get('claims', {}).get('P18', [])]
    if title not in associated:
        raise ValueError('Association Wikimedia modifiée : nouvelle vérification nécessaire')
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({
        'action': 'query', 'titles': 'File:'+title, 'prop': 'imageinfo',
        'iiprop': 'url|size|sha1|extmetadata', 'format': 'json'})
    pages = list(remote_json(url)['query']['pages'].values())
    if len(pages) != 1 or not pages[0].get('imageinfo'):
        raise ValueError('Photo Commons indisponible')
    info = pages[0]['imageinfo'][0]
    meta = info.get('extmetadata', {})
    value = lambda key: plain(str(meta.get(key, {}).get('value', '')))
    license = value('LicenseShortName')
    if license == 'Public domain':
        license = 'Domaine public'
    if not reusable(license) or not value('Artist'):
        raise ValueError('Licence ou auteur non vérifiable')
    if urllib.parse.urlparse(info['url']).hostname != 'upload.wikimedia.org' or not 0 < info.get('size', 0) <= 12_000_000:
        raise ValueError('Origine ou taille de photo refusée')
    # Content-addressed originals are shared between generations. The download
    # is repeated only when Commons' image digest changes.
    target = output / ('original-'+slug+'-'+info['sha1'][:16]+'.image')
    if not target.exists():
        request = urllib.request.Request(info['url'], headers={'User-Agent': 'EpargnantLibre/1.0 verified investor media'})
        with urllib.request.urlopen(request, timeout=30) as response:
            if urllib.parse.urlparse(response.url).hostname != 'upload.wikimedia.org':
                raise ValueError('Redirection de photo refusée')
            content = response.read(12_000_001)
        if len(content) != info['size'] or hashlib.sha1(content).hexdigest() != info['sha1']:
            raise ValueError('Empreinte de photo incorrecte')
        target.write_bytes(content)
    if reviewed.get('crop') and reviewed.get('cropForSha1') != info['sha1']:
        raise ValueError('Photo recadrée modifiée : nouvelle vérification nécessaire')
    return target, {'crop': reviewed.get('crop'), 'person': source['person'], 'title': title, 'source': info['descriptionurl'],
        'url': info['url'], 'author': value('Artist'), 'license': license,
        'licenseUrl': value('LicenseUrl'), 'wikidataId': qid,
        'identitySource': reviewed['identitySource'], 'associationSource': entity_url,
        'sourceSha1': info['sha1'], 'identityVerified': True}
