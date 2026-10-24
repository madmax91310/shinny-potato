"""Sharded exact synthetic series. Catalogue metadata is never a price substitute."""
import hashlib,json,pathlib

def write_json_atomic(path,data):
    # Price buckets contain thousands of repeated point records. Compact encoding
    # keeps checkpoint cost bounded; indentation must not dominate qualification.
    path=pathlib.Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    temporary=path.with_suffix(path.suffix+'.tmp')
    temporary.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n')
    temporary.replace(path)

def bucket(key):return hashlib.sha256(key.encode()).hexdigest()[:2]+'.json'
def hydrate(market,folder,ids=None):
    groups={}
    for a in market.get('universe',[]):
        if a.get('seriesFile') and (ids is None or a['id'] in ids):groups.setdefault(pathlib.Path(a['seriesFile']).name,[]).append(a['id'])
    for name,keys in groups.items():
        path=folder/'series'/name
        if path.exists():
            data=json.loads(path.read_text())
            for key in keys:
                # The resident snapshot is the version bound to this catalogue's
                # certificate. A bucket is a fallback, not a newer observation.
                if key in data and key not in market.setdefault('series',{}):market['series'][key]=data[key]
    return market

def persist(market,folder,resident,dirty):
    groups={}
    # A legacy inline certificate may be newer than its persisted bucket even
    # when this run did not fetch that quote. Reconcile resident records too,
    # without touching nonresident histories or changing any proof/date.
    for key in set(dirty) | set(resident):
        if key in market['series']:groups.setdefault(bucket(key),{})[key]=market['series'][key]
    for name,values in groups.items():
        path=folder/'series'/name;previous=json.loads(path.read_text()) if path.exists() else {}
        changed={key:value for key,value in values.items() if previous.get(key)!=value}
        if changed:
            previous.update(changed);write_json_atomic(path,previous)
    for a in market.get('universe',[]):
        if a['id'] in market['series']:a['seriesFile']='series/'+bucket(a['id'])
    return {**market,'series':{key:value for key,value in market['series'].items() if key in resident}}
