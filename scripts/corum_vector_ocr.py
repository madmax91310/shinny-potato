"""Read printed CORUM values; qualify labels by glyphs, never by bar area or row order.

The approved layout uses a narrow country column and seven sector cells. Unknown
labels/fonts/layouts or disagreement between two raster resolutions fail closed.
"""
import base64
import zlib
import calendar
import datetime as dt
import hashlib
import io
import json
import pathlib
import re
import subprocess
import tempfile
import unicodedata
import urllib.parse
from PIL import Image, ImageChops, ImageStat

ROOT=pathlib.Path(__file__).parent
TEMPLATES=ROOT/'fixtures/corum/vector-labels.json'
DPI=(250,300)

def crop(image, box):
 w,h=image.size
 return image.crop(tuple(round(v*(w if i%2==0 else h)) for i,v in enumerate(box)))

def mask(image, warm=False):
 im=image.convert('RGB');pixels=im.load()
 for y in range(im.height):
  for x in range(im.width):
   r,g,b=pixels[x,y]
   if (warm and not(r>g*1.18 and r>b*1.18)) or (not warm and g>r+15 and b>r+15):pixels[x,y]=(255,255,255)
 return im.convert('L')

def trim(image):
 box=ImageChops.invert(image).point(lambda v:255 if v>35 else 0).getbbox()
 if not box:raise ValueError('Empty vector label')
 return image.crop(box)

def signature(image):
 im=trim(mask(image));w,h=im.size
 # Retain aspect ratio separately so different words cannot match by distortion.
 normalized=im.resize((128,32))
 return {'ratio':round(w/h,4),'pixels':base64.b64encode(zlib.compress(bytes(normalized.get_flattened_data()),9)).decode()}

def recognize(image, templates):
 candidate=signature(image);scores=[]
 for row in templates:
  if abs(candidate['ratio']/row['ratio']-1)>.06:continue
  diff=sum(abs(a-b) for a,b in zip(zlib.decompress(base64.b64decode(candidate['pixels'])),zlib.decompress(base64.b64decode(row['pixels']))))/(255*4096)
  scores.append((diff,row['label']))
 scores=sorted((min(v for v,label in scores if label==name),name) for name in {label for _,label in scores})
 if not scores or scores[0][0]>.025 or (len(scores)>1 and scores[1][0]-scores[0][0]<.035):raise ValueError('Unknown or ambiguous vector label')
 return scores[0][1]

def country_rows(image):
 box=(.058,.46,.145,.72);column=mask(crop(image,box));spans=[];start=None
 for y in range(column.height):
  ink=sum(v<220 for v in column.crop((0,y,column.width,y+1)).get_flattened_data())>=3
  if ink and start is None:start=y
  if not ink and start is not None:
   if y-start>=3:spans.append((start,y))
   start=None
 if start is not None:spans.append((start,column.height))
 if not 5<=len(spans)<=21:raise ValueError('Unknown country layout')
 return [(column.crop((0,a,column.width,b)),(round(image.height*.46)+a,round(image.height*.46)+b)) for a,b in spans]

SECTOR_EDGES=(.05,.145,.278,.412,.545,.675,.807,.945)
def sector_cells(image):
 return [(crop(image,(a,.369,b,.389)),crop(image,(a,.348,b,.368))) for a,b in zip(SECTOR_EDGES,SECTOR_EDGES[1:])]

def ocr(image,directory,key,numeric=False):
 # Add a clean margin; isolated number OCR must not include the nearby map.
 im=image.convert('RGB');border=Image.new('RGB',(im.width+40,im.height+40),'white');border.paste(im,(20,20));path=pathlib.Path(directory)/(key+'.png');border.save(path)
 args=['tesseract',str(path),'stdout','-l','fra','--psm','7']
 if numeric:args+=['-c','tessedit_char_whitelist=0123456789%,.']
 return subprocess.check_output(args,stderr=subprocess.DEVNULL,timeout=40).decode().strip()

def numeric_cluster(image):
 im=mask(image,warm=True);box=ImageChops.invert(im).point(lambda v:255 if v>25 else 0).getbbox()
 if not box:raise ValueError('Missing printed numeric value')
 # Country values precede any warm-coloured map shapes; find the first cluster.
 xs=[]
 for x in range(im.width):
  if sum(v<220 for v in im.crop((x,0,x+1,im.height)).get_flattened_data())>=2:xs.append(x)
 if not xs:raise ValueError('Empty printed numeric glyphs')
 groups=[];start=last=xs[0]
 for x in xs[1:]:
  if x-last>im.height*1.1:groups.append((start,last+1));start=x
  last=x
 groups.append((start,last+1));a,b=groups[0]
 im=trim(im.crop((a,0,b,im.height)))
 return im

def printed_number(image,directory,key,percent=True,templates=None):
 im=numeric_cluster(image)
 known=None
 if templates:
  try:known=recognize(im,templates)
  except ValueError:pass
 text=known or ocr(im,directory,key,True)
 pattern=r'(\d+(?:[,.]\d+)?)\s*%' if percent else r'(\d+)'
 match=re.fullmatch(pattern,text)
 if not match:raise ValueError('Ambiguous printed number '+key+': '+text)
 value=float(match[1].replace(',','.'))
 if percent and not 0<value<=100:raise ValueError('Weight outside range')
 return int(value) if value.is_integer() else value

def period(text,url,today):
 folded=unicodedata.normalize('NFKD',text.upper());folded=''.join(c for c in folded if not unicodedata.combining(c))
 printed=re.search(r'DONNEES AU (\d+) (MARS|JUIN|SEPTEMBRE|DECEMBRE) (20\d{2})',folded)
 linked=re.search(r'(20\d{2})-T([1-4])',urllib.parse.unquote(url))
 quarter=re.search(r'([1-4])[^\d]{0,12}TRIMESTRE (20\d{2})',folded)
 if not printed or not linked or not quarter:raise ValueError('Missing printed and linked bulletin period: '+text)
 month={'MARS':3,'JUIN':6,'SEPTEMBRE':9,'DECEMBRE':12}[printed[2]]
 date=dt.date(int(printed[3]),month,int(printed[1]));year,q=map(int,linked.groups())
 if int(quarter[1])!=q or int(quarter[2])!=year or date!=dt.date(year,q*3,calendar.monthrange(year,q*3)[1]) or date>today:raise ValueError('Printed period differs from URL or is future')
 return date.isoformat()

FIELD_BOXES={'buildings':(.067,.219,.203,.238),'tenants':(.219,.219,.405,.238),'occupancy':(.075,.772,.235,.796)}
def read_page(image,templates,directory,dpi):
 for key,box in FIELD_BOXES.items():
  if recognize(crop(image,box),templates['fieldLabels'])!=key:raise ValueError('Unknown portfolio field layout')
 countries=[]
 for i,(label,(top,bottom)) in enumerate(country_rows(image)):
  name=recognize(label,templates['countries'])
  value=printed_number(image.crop((round(image.width*.155),top-5,round(image.width*.94),bottom+7)),directory,f'country-{dpi}-{i}',templates=templates.get('numbers'))
  countries.append({'label':name,'value':value})
 sectors=[]
 for i,(label,value_image) in enumerate(sector_cells(image)):
  name=recognize(label,templates['sectors']);value=printed_number(value_image,directory,f'sector-{dpi}-{i}',templates=templates.get('numbers'))
  sectors.append({'label':name,'value':value})
 for rows in (countries,sectors):
  if len({r['label'] for r in rows})!=len(rows) or abs(sum(r['value'] for r in rows)-100)>.15:raise ValueError('Incomplete or duplicated allocation')
 buildings=ocr(crop(image,(.065,.17,.20,.203)),directory,f'buildings-{dpi}',True)
 tenants=ocr(crop(image,(.215,.17,.405,.203)),directory,f'tenants-{dpi}',True)
 if not re.fullmatch(r'\d+',buildings) or not re.fullmatch(r'\d+',tenants):raise ValueError('Unclear property counters')
 occupancy=printed_number(crop(image,(.06,.799,.24,.842)),directory,f'occupancy-{dpi}',templates=templates.get('numbers'))
 return {'countries':countries,'sectors':sectors,'portfolio':{'buildings':int(buildings),'tenants':int(tenants),'occupancy':occupancy}}

def agree(readings):
 if len(readings)!=2 or readings[0]!=readings[1]:raise ValueError('Independent vector readings disagree')
 return readings[0]

def white_letters(image):
 im=image.convert('RGB');px=im.load()
 for y in range(im.height):
  for x in range(im.width):px[x,y]=(0,0,0) if min(px[x,y])>240 else (255,255,255)
 return im

def extract(data,id_,url,today):
 if id_ not in ('corum-origin','corum-xl') or not data.startswith(b'%PDF'):raise ValueError('Unknown CORUM vector document')
 if not re.search(r'CORUM[ _]+(?:Origin|XL)',urllib.parse.unquote(url),re.I):raise ValueError('Wrong CORUM URL identity')
 expected='origin' if id_=='corum-origin' else 'xl'
 if expected not in urllib.parse.unquote(url).lower():raise ValueError('Mismatched CORUM product URL')
 templates=json.loads(TEMPLATES.read_text());results=[]
 with tempfile.TemporaryDirectory() as directory:
  pdf=pathlib.Path(directory)/'report.pdf';pdf.write_bytes(data)
  for dpi in DPI:
   for page in (1,4):
    out=pathlib.Path(directory)/f'p{page}-{dpi}'
    subprocess.run(['pdftocairo','-f',str(page),'-l',str(page),'-r',str(dpi),'-png','-singlefile',str(pdf),str(out)],check=True,timeout=80,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
   first=Image.open(pathlib.Path(directory)/f'p1-{dpi}.png').convert('RGB')
   stamp=ocr(crop(first,(.40,.02,.96,.043)),directory,f'period-{dpi}')
   date=period(stamp,url,today)
   identity=ocr(white_letters(crop(first,(.05,.93,.32,.963))),directory,f'identity-{dpi}')
   if expected not in identity.lower():raise ValueError('Printed product identity unreadable or wrong: '+identity)
   page=Image.open(pathlib.Path(directory)/f'p4-{dpi}.png').convert('RGB')
   results.append((date,read_page(page,templates[str(dpi)],directory,dpi)))
 date,values=agree(results)
 snapshot={'asOf':date,'countries':values['countries'],'sectors':values['sectors'],'sourceUrls':[url],'dateNote':'Bulletin trimestriel officiel : libellés reconnus par gabarits visuels qualifiés, chiffres imprimés lus à deux résolutions concordantes ; aucune estimation des surfaces des graphiques.'}
 portfolio={k:{'value':v,'asOf':date,'sourceUrl':url,'label':{'buildings':'Immeubles','tenants':'Locataires','occupancy':'Taux d’occupation financier'}[k],**({'basis':'Inclut les locaux sous franchise de loyer ; distinct du taux physique.'} if k=='occupancy' else {})} for k,v in values['portfolio'].items()}
 return snapshot,portfolio
