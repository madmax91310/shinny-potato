"""Read-only diagnosis for one existing fund, never an observation producer."""
import datetime as dt
import gzip
import hashlib
import json
from pathlib import Path
import urllib.error
from data_automation import get_text
from collect_dws_etf import collect_one

ISIN='LU0328475792'
LOCALES=('en-gb','en-lu')
OUT=Path('dws-country-response-proof');OUT.mkdir(exist_ok=True)
now=dt.datetime.now(dt.timezone.utc)
proof={'checkedAt':now.isoformat(),'scope':{'instruments':[ISIN],'locales':list(LOCALES),'purpose':'Read-only diagnosis, not production acquisition or publication'},'results':[]}
for locale in LOCALES:
    events=[]
    share={'isin':ISIN,'currency':'EUR','provider':'DWS','name':'Xtrackers STOXX Europe 600 UCITS ETF 1C','sourceUrl':f'https://etf.dws.com/api/pdp/{locale}/etf/{ISIN}/pdpMetaTagsTealium'}
    def fetch(url,*args,**kwargs):
        try:
            text=get_text(url,*args,**kwargs)
            raw=text.encode();sha=hashlib.sha256(raw).hexdigest()
            (OUT/(sha+'.json.gz')).write_bytes(gzip.compress(raw))
            events.append({'url':url,'status':'received-json','bytes':len(raw),'sha256':sha})
            return text
        except Exception as error:
            events.append({'url':url,'status':'failed','errorType':type(error).__name__,'httpStatus':getattr(error,'code',None),'error':str(error)})
            raise
    try:
        record=collect_one(share,now,fetch=fetch)
        fields={k:{'asOf':record[k].get('asOf'),'sourceUrl':record[k].get('sourceUrl'),'sha256':record[k].get('sha256'),'rows':len(record[k].get('rows',[])),'weightSum':sum(r['weightPct']for r in record[k].get('rows',[]))}for k in ('countries','sectors','holdings')if k in record}
        result={'locale':locale,'isin':ISIN,'replication':record.get('replication'),'fields':fields,'unavailable':record.get('unavailable',[]),'allExposureFieldsPresent':all(k in fields for k in ('countries','sectors','holdings')),'events':events}
    except Exception as error:
        result={'locale':locale,'isin':ISIN,'errorType':type(error).__name__,'error':str(error),'events':events,'allExposureFieldsPresent':False}
    proof['results'].append(result)
    print(json.dumps(result,ensure_ascii=False),flush=True)
(OUT/'result.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2))
