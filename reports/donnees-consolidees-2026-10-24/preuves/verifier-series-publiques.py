"""Read-only check of the 21 already certified series served by Pages."""
import argparse,concurrent.futures,datetime,hashlib,json,pathlib,urllib.request
p=argparse.ArgumentParser();p.add_argument('--before',type=pathlib.Path,required=True);p.add_argument('--output',type=pathlib.Path,required=True);p.add_argument('--expected-code');a=p.parse_args()
base='https://madmax91310.github.io/shinny-potato/'
def get(path):
 with urllib.request.urlopen(base+path+'?consol='+str(datetime.datetime.now().timestamp()),timeout=40)as r:return json.load(r)
b=get('build-info.json')
if a.expected_code:assert b['sha']==a.expected_code,b
original=json.loads(a.before.read_text());names={hashlib.sha256(r['id'].encode()).hexdigest()[:2]+'.json'for r in original['rows']}
with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:data=dict(pool.map(lambda n:(n,get('data/ai-portfolios/series/'+n)),names))
rows=[]
for r in original['rows']:
 name=hashlib.sha256(r['id'].encode()).hexdigest()[:2]+'.json';s=data[name][r['id']]
 rows.append({'id':r['id'],'seriesFile':'series/'+name,'servedEvidenceId':s.get('listingEvidenceId'),'servedResponseSha256':s.get('responseSha256'),'servedRetrievedAt':s.get('retrievedAt'),'matchesCertifiedResident':all(s.get(k)==v for k,v in r['before'].items())})
end=get('build-info.json');assert end==b,'Publication changed during the read'
out={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'build':b,'rows':rows,'matches':sum(r['matchesCertifiedResident']for r in rows),'count':len(rows)};a.output.write_text(json.dumps(out,indent=2)+'\n');print({k:v for k,v in out.items()if k!='rows'})
if a.expected_code:assert out['matches']==out['count']==21
