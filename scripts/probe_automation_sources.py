"""Read-only source qualification; downloaded documents remain diagnostic evidence."""
import concurrent.futures, hashlib, json, pathlib, re, subprocess, sys
from urllib.parse import urlencode, urljoin, urlsplit
from bs4 import BeautifulSoup
from issuer_documents import download, pdf_text

OUT=pathlib.Path('test-artifacts/automation-source-probe');OUT.mkdir(parents=True,exist_ok=True)
TARGETS=set('IE0002Y8CX98 IE000W8WMSL2 IE00BDVPNG13 IE00BJGWQN72 IE00BKLF1R75 IE00BZ56SW52 IE00BYPLS672 IE00BF0M2Z96 IE00BK5BCD43 IE00BK5BCH80 IE000NDWFGA5 IE0003UVYC20 IE000QDFFK00 IE00B4K6B022 IE00BD4TXV59'.split())
records=[]
def fetch(item):
    label,url=item
    try:
        body,final=download(url,max_bytes=6_000_000,timeout=18,max_attempts=1,return_source=True)
        path=OUT/(label+'.raw');path.write_bytes(body)
        row={'label':label,'url':url,'finalUrl':final,'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest()}
        if body.startswith(b'%PDF-'):
            text=pdf_text(body);(OUT/(label+'.txt')).write_text(text);row['textBytes']=len(text)
        else:
            text=body.decode('utf-8',errors='replace')
            if '<html' in text[:500].lower() or '<!doctype' in text[:200].lower():
                soup=BeautifulSoup(text,'html.parser');row['title']=soup.title.get_text(' ',strip=True) if soup.title else None
                row['links']=[{'text':a.get_text(' ',strip=True)[:150],'url':urljoin(final,a['href'])} for a in soup.select('a[href]') if re.search(r'hold|portfol|constituen|composition|download|\.csv|\.xlsx',a.get_text(' ',strip=True)+' '+a['href'],re.I)][:60]
        return row
    except Exception as error:return {'label':label,'url':url,'error':str(error)}

urls=[
 ('dws-usd-kid','https://download.dws.com/download?elib-assetguid=890b3c75b14d4c22be88765b92b21794'),
 ('dws-eur-kid','https://download.dws.com/download/asset/b306aceb1791490aa957609f005cbd9d'),
 ('lg-list','https://fundcentres.landg.com/srp/api/fund-centre/47?audience=79&language=1'),
 ('lg-docs','https://fundcentres.landg.com/srp/api/documents/?audience=79&language=1&share_classes=893'),
 ('lg-literature','https://fundcentres.landg.com/srp/api/literature-structure/4/?audience=79&language=1&share_classes=893'),
 ('wt-cloud-pdf','https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/UCITS/EU/EN-GB/IE00BJGWQN72/'),
 ('wt-cloud-eu','https://www.wisdomtree.eu/en-gb/etfs/thematic/wcld---wisdomtree-cloud-computing-ucits-etf---usd-acc'),
 ('wt-cloud-ch','https://www.wisdomtree.eu/fr-ch/etfs/thematic/wcld---wisdomtree-cloud-computing-ucits-etf---usd-acc'),
 ('wt-cloud-com','https://www.wisdomtree.com/gb/products/equities/wisdomtree-cloud-computing-ucits-etf---usd-acc'),
 ('jpm-page','https://am.jpmorgan.com/de/en/asset-management/institutional/products/jpm-global-equity-premium-income-active-ucits-etf-usd-dist-ie0003uvyc20'),
 ('hsbc-page','https://www.assetmanagement.hsbc.co.uk/en/intermediary/investment-expertise/etfs/etf-products/ie00b4k6b022'),
 ('globalx-urnu','https://globalxetfs.eu/funds/urnu/'),
]
for name in ['holdings','fundholdings','portfolio']:
    urls.append(('hsbc-'+name,'https://www.assetmanagement.hsbc.co.uk/api/v1/download/document/ie00b4k6b022/gb/en/'+name))
records.extend(concurrent.futures.ThreadPoolExecutor(max_workers=6).map(fetch,urls))
try:
    lg=json.loads((OUT/'lg-list.raw').read_text())
    more=[]
    for fund in lg['funds']:
        for share in fund['share_classes']:
            identity=next((v for v in share['data'] if isinstance(v,str) and v in TARGETS),None)
            if identity:
                path=share['data'][0];fid=fund['id'];sid=share['id']
                more.extend([(f'lg-{identity}',urljoin('https://fundcentres.landg.com',path)),(f'lg-docs-{identity}','https://fundcentres.landg.com/srp/api/documents/?'+urlencode({'audience':79,'language':1,'share_classes':sid})),(f'lg-fcs-{identity}','https://fundcentres.landg.com/srp/api/fcs/funds/'+str(fid))])
    records.extend(concurrent.futures.ThreadPoolExecutor(max_workers=6).map(fetch,more))
except Exception as e:records.append({'label':'lg-discovery','error':str(e)})
(OUT/'manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
for row in records:print(json.dumps({k:v for k,v in row.items() if k!='links'},ensure_ascii=False))
try:
    state=json.loads(subprocess.check_output(['git','show','origin/automation-status:automation-status.json'],text=True))
    keep=['update-instrument-metadata.yml','update-qualified-exposures.yml']
    compact={'recovery':{k:state.get('recovery',{}).get(k) for k in keep},'workflows':{k:state.get('workflows',{}).get(k) for k in keep}}
    (OUT/'recovery.json').write_text(json.dumps(compact,ensure_ascii=False,indent=2))
except Exception as e:print('Recovery diagnostics:',str(e))
