"""Independently inspect actual UI downloads: PNG metadata, archives, values and CRC."""
import csv,io,json,sys,zipfile
from pathlib import Path
from PIL import Image
from decimal import Decimal
root=Path(__file__).resolve().parents[1]
folder=Path(sys.argv[1] if len(sys.argv)>1 else root/'test-artifacts/investor-visual-ui')
audit=json.loads((root/'reports/investor-series-2026-11-17/after.json').read_text())
report=[]
for profile in audit:
 slug=profile['slug']
 source=json.loads((root/f'public/data/investors/{slug}.json').read_text())['data']['snapshot']
 if profile['problem']:continue
 for width in [1440,390]:
  png=folder/f'{slug}-{width}.png'
  with Image.open(png) as im:
   im.load();assert im.size==(1080,1350)
   meta=json.loads(im.info['Description'])
   assert meta['total']==profile['total']
   assert bool(meta['portrait'])==(profile['portrait']=='ready'),(slug,'portrait not actually loaded')
   assert sum(r['value'] for r in meta['positions'])==profile['total']
   other=next((r for r in meta['positions'] if r.get('count')),None)
   assert (other['count'] if other else 0)==profile['grouped']
  series=folder/f'{slug}-series-{width}.zip'
  if profile['complementaryImages']:
   with zipfile.ZipFile(series) as z:
    assert z.testzip() is None
    assert len(z.namelist())==1+profile['complementaryImages']
    assert z.read('publication-1.png')==png.read_bytes()
    for i in range(2,len(z.namelist())+1):
     b=z.read(f'publication-{i}.png');assert b==(folder/f'{slug}-page-{i}-{width}.png').read_bytes()
     with Image.open(io.BytesIO(b)) as im:
      im.load();assert im.size==(1080,1350)
      m=json.loads(im.info['Description']);assert m['page']==i and m['total']==profile['total']
      assert all(abs(Decimal(str(r['weight']))-Decimal(r['value'])/Decimal(m['total']))<Decimal('1e-14') for r in m['positions'])
  details=folder/f'{slug}-details-{width}.zip'
  page_count=None
  if details.exists():
   with zipfile.ZipFile(details) as z:
    assert z.testzip() is None
    data=json.loads(z.read('positions.json'));assert data['snapshot']['holdings']==source['holdings']
    rows=list(csv.reader(io.StringIO(z.read('positions.csv').decode('utf-8-sig')),delimiter=';'))
    assert len(rows)==len(source['holdings'])+1
    pages=[n for n in z.namelist() if n.endswith('.png')];page_count=len(pages)
    for name in pages:
     with Image.open(io.BytesIO(z.read(name))) as im:im.load();assert im.size==(1080,1350)
  report.append({'slug':slug,'width':width,'portraitActuallyRendered':bool(meta['portrait']),'seriesPages':1+profile['complementaryImages'],'completeDetailPages':page_count,'crc':'ok'})
print(json.dumps(report,ensure_ascii=False,indent=2))
