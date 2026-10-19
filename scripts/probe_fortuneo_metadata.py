"""Read-only qualification of public Fortuneo aliases for missing PEA evidence."""
import datetime as dt
import hashlib
import json
import os
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from collect_instrument_metadata import parse_broker_pea
from issuer_documents import download
from metadata_transport import TRANSPORT
root=Path(os.environ['PROBE_OUTPUT']);root.mkdir(parents=True,exist_ok=True)
targets=json.loads(Path(os.environ['PROBE_TARGETS']).read_text())
rows=[]
for target in targets:
 row={**target,'attempts':[]}
 for url in target['urls']:
  try:
   body,effective=TRANSPORT.read(url,fetch=download,timeout=10,max_attempts=1,return_source=True)
   fields=parse_broker_pea(body,target['isin'])
   checked=dt.datetime.now(dt.timezone.utc).isoformat()
   digest=hashlib.sha256(body).hexdigest();name=target['isin']+'-'+digest+'.html'
   (root/name).write_bytes(body)
   row['attempts'].append({'requestedUrl':url,'sourceUrl':effective,'checkedAt':checked,'sha256':digest,'file':name,'fields':fields})
   if 'pea' in fields:
    row['observation']={'value':fields['pea'],'checkedAt':checked[:10],'sourceUrl':effective,'sha256':digest}
    row['disagreesWithPrevious']=isinstance(target.get('expectedPea'),bool) and target['expectedPea']!=fields['pea']
    break
  except Exception as error:row['attempts'].append({'requestedUrl':url,'error':str(error)})
 rows.append(row)
 (root/'manifest.json').write_text(json.dumps({'instruments':rows},ensure_ascii=False,indent=2))
print(json.dumps({'targets':len(targets),'observed':sum('observation' in r for r in rows),'disagreements':sum(r.get('disagreesWithPrevious',False) for r in rows)}))
