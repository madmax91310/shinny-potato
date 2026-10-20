from concurrent.futures import ThreadPoolExecutor
import datetime as dt,json,pathlib,hashlib,re,subprocess,tempfile
from collect_scpi import fetch,pdf_text
from collect_corum import PRODUCTS,bbox_pages
from collect_extended_scpi import document_links,latest
from corum_vector_ocr import crop,ocr
from PIL import Image
OUT=pathlib.Path('test-artifacts/corum-layout');OUT.mkdir(parents=True,exist_ok=True)
def one(item):
 id_,(name,slug)=item;row={'id':id_}
 try:
  base='https://www.corum.fr/nos-scpi/'+slug
  html=fetch(base+'/documents').decode();url=latest(document_links(html,base),re.escape(name)+r'.*?(?P<year>\d{4})-T(?P<quarter>[1-4])[^/]*\.pdf',dt.date.today())
  raw=fetch(url);(OUT/(id_+'.pdf')).write_bytes(raw);row.update(url=url,sha256=hashlib.sha256(raw).hexdigest(),bytes=len(raw))
  (OUT/(id_+'.txt')).write_text(pdf_text(raw));(OUT/(id_+'-bbox.json')).write_text(json.dumps(bbox_pages(raw),ensure_ascii=False))
  with tempfile.TemporaryDirectory() as d:
   p=pathlib.Path(d)/'r.pdf';p.write_bytes(raw);row['periods']=[]
   for dpi in [250,300]:
    out=pathlib.Path(d)/str(dpi);subprocess.run(['pdftocairo','-f','1','-l','1','-r',str(dpi),'-png','-singlefile',str(p),str(out)],check=True,timeout=80,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    image=Image.open(str(out)+'.png');header=crop(image,(.25,.01,.98,.055));header.save(OUT/(id_+'-header-'+str(dpi)+'.png'));row['periods'].append({'dpi':dpi,'text':ocr(header,d,str(dpi))})
   subprocess.run(['pdftocairo','-f','4','-l','4','-r','100','-png','-singlefile',str(p),str(OUT/(id_+'-page4'))],check=True,timeout=80,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 except Exception as e:row['error']=str(e)
 return row
rows=list(ThreadPoolExecutor(max_workers=3).map(one,PRODUCTS.items()));(OUT/'manifest.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print(json.dumps(rows,ensure_ascii=False))
