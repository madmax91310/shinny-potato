"""Russell 1000 printed sector weights; geometry only associates labels, never supplies weights."""
import csv
import datetime as dt
import io
import math
import pathlib
import re
import subprocess
import tempfile
from PIL import Image, ImageFilter
from data_automation import reject
from issuer_documents import download, pdf_text, proof, document_date, validated_rows
from collect_index_documents import ICB_INDUSTRIES, SECTOR_LABELS

NAMES = set(ICB_INDUSTRIES.values())
WEIGHTS_URL = 'https://research.ftserussell.com/analytics/factsheets/Home/DownloadConstituentsWeights/?indexdetails=US1000'

def quarterly_holdings(text, now):
    """Read the exact-index quarterly membership report, not an ETF basket."""
    dates = re.findall(r'^(\w+ \d{1,2}, 20\d{2}) Page \d+ of \d+\s*$', text, re.M)
    if not dates or len(set(dates)) != 1:
        reject('Russell quarterly membership date ambiguous')
    stamp = document_date(dates[0], now, max_age=180)
    date = dt.date.fromisoformat(stamp)
    if (date.month, date.day) not in ((3,31), (6,30), (9,30), (12,31)):
        reject('Russell membership report is not quarter-end')
    rows = []
    for page in text.split('\f'):
        if 'Weight(%)' not in page:
            continue
        headings = re.findall(r'^([^\n]+) Weight\(%\) Country\s*$', page, re.M)
        if not headings or any(h.strip() != 'Russell 1000®' for h in headings):
            reject('Wrong Russell quarterly index identity')
        if 'ESMA Compliance Quarterly Membership Weights' not in page:
            reject('Russell membership report heading missing')
        matches = re.findall(r'^([^\n]+)\n(\d+\.\d{3}) ([A-Za-z ]+)\s*$', page, re.M)
        weight_lines = re.findall(r'^\d+\.\d+[^\n]*$', page, re.M)
        if len(matches) != len(weight_lines):
            reject('Russell membership row truncated or changed')
        for name, weight, country in matches:
            if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9 .!&/()\'-]+', name.strip()) or not country.strip():
                reject('Russell membership name/country changed')
            rows.append({'name': name.strip(), 'weightPct': float(weight)})
    # Some smaller share classes have identical issuer labels in this report.
    # Never aggregate them; require unambiguous names for every returned top row.
    if any(not 0 <= r['weightPct'] <= 100 for r in rows) or not 900 <= len(rows) <= 1200 or abs(sum(r['weightPct'] for r in rows)-100) > .1:
        reject('Russell quarterly membership incomplete')
    top = sorted(rows, key=lambda r: (-r['weightPct'], r['name']))[:10]
    validated_rows(top, complete=False)
    return {'asOf': stamp, 'rows': [[r['name'], r['weightPct']] for r in top],
            'membershipCount': len(rows), 'basis': 'index',
            'method': 'Poids officiels trimestriels du Russell 1000 exact ; top dix des lignes, classes d’actions séparées. Photographie indépendante des secteurs mensuels.'}

def collect_quarterly_holdings(config, now, fetch=download):
    url = config.get('holdingsSourceUrl')
    if config['id'] != 'russell-1000' or url != WEIGHTS_URL:
        reject('Unexpected Russell membership source')
    body = fetch(url)
    result = quarterly_holdings(pdf_text(body, raw=True), now)
    result['source'] = {'url': url, 'checkedAt': now.date().isoformat(), 'sha256': proof(body),
                        'label': 'FTSE Russell · ESMA Quarterly Membership Weights · Russell 1000'}
    return result

def ocr(image, directory, name):
    path = pathlib.Path(directory) / (name + '.png'); image.save(path)
    result = subprocess.run(['tesseract', str(path), 'stdout', '--psm', '6' if name.startswith('legend') else '11', 'tsv'], capture_output=True, text=True, check=True, timeout=30)
    return list(csv.DictReader(io.StringIO(result.stdout), delimiter='\t'))

def read_chart(image, scale, directory):
    image = image.convert('RGB'); w,h = image.size
    if w < 1000 or h < 600 or not 1.6 < w/h < 1.9: reject('Russell sector chart dimensions changed')
    # Legend text occupies the right side; colored swatches remain outside the OCR crop.
    left = int(w*.61); legend = image.crop((left,0,w,h)); groups={}
    for word in ocr(legend.resize((legend.width*scale,h*scale)),directory,'legend'+str(scale)):
        if word['level'] != '5' or not word['text'].strip(): continue
        key=tuple(word[k] for k in ['block_num','par_num','line_num']);groups.setdefault(key,[]).append(word)
    palette={};pixels=image.load()
    for words in groups.values():
        label=' '.join(v['text'] for v in words).strip()
        if label not in NAMES: reject('Russell unknown legend label: '+label)
        y=(min(int(v['top']) for v in words)+max(int(v['top'])+int(v['height']) for v in words))/2/scale
        x=int(w*.58); y=round(y); color=pixels[x,y]
        if color in palette or color==(255,255,255): reject('Russell ambiguous legend colors')
        if any(pixels[x+dx,y+dy]!=color for dx in [-10,0,10] for dy in [-5,0,5]):reject('Russell legend swatch missing')
        palette[color]=label
    if set(palette.values())!=NAMES:reject('Russell sector legend incomplete')
    # Locate the circle from solid non-grey swatch colors, excluding text and leader lines.
    colored=[c for c in palette if len(set(c))>1];points=[]
    for y in range(h):
        row=[x for x in range(int(w*.53)) if pixels[x,y] in colored]
        if len(row)>10: points.extend((x,y) for x in row)
    if not points:reject('Russell sector disk absent')
    x0=min(x for x,y in points);x1=max(x for x,y in points);y0=min(y for x,y in points);y1=max(y for x,y in points)
    if abs((x1-x0)-(y1-y0))>8:reject('Russell disk shape changed')
    cx=(x0+x1)/2;cy=(y0+y1)/2;radius=(x1-x0+y1-y0)/4
    if not .2*w<cx<.35*w or not .35*h<cy<.65*h:reject('Russell chart layout changed')
    def angle(x,y):return math.atan2(cy-y,x-cx)%(2*math.pi)
    fills={c:[] for c in palette}
    for y in range(max(0,int(cy-radius)),min(h,int(cy+radius)+1)):
        for x in range(max(0,int(cx-radius)),min(w,int(cx+radius)+1)):
            c=pixels[x,y]
            if c in fills and math.hypot(x-cx,y-cy)<radius*.9:fills[c].append((x,y))
    sectors=[]
    for color,xy in fills.items():
        if len(xy)<20:reject('Russell sector fill absent')
        sectors.append((angle(sum(x for x,y in xy)/len(xy),sum(y for x,y in xy)/len(xy)),palette[color],color))
    sectors.sort()
    # Whiten the circle and the black leader lines. OCR retains the actual printed figures.
    mask=Image.new('L',image.size);m=mask.load()
    for y in range(h):
        for x in range(int(w*.53)):
            if max(pixels[x,y])<35 or math.hypot(x-cx,y-cy)<radius+7:m[x,y]=255
    clean=image.copy();clean.paste('white',(0,0),mask.filter(ImageFilter.MaxFilter(7)))
    clean=clean.crop((0,0,int(w*.53),h));labels=[]
    for word in ocr(clean.resize((clean.width*scale,h*scale)),directory,'weights'+str(scale)):
        if word['level']!='5' or not word['text'].strip():continue
        match=re.fullmatch(r'(\d{1,2}\.\d{2})%',word['text'].strip())
        if not match or float(word['conf'])<75:reject('Russell printed weight ambiguous')
        x=(int(word['left'])+int(word['width'])/2)/scale;y=(int(word['top'])+int(word['height'])/2)/scale
        labels.append((angle(x,y),float(match[1])))
    if len(labels)!=11:reject('Russell printed sector weights incomplete')
    labels.sort()
    distance=lambda a,b:abs((a-b+math.pi)%(2*math.pi)-math.pi)
    candidates=[]
    for offset in range(11):
        ordered=labels[offset:]+labels[:offset];cost=sum(distance(s[0],l[0]) for s,l in zip(sectors,ordered));candidates.append((cost,ordered))
    candidates.sort(key=lambda v:v[0]);cost,ordered=candidates[0]
    if candidates[1][0]-cost<.5 or any(distance(s[0],l[0])>math.pi/6 for s,l in zip(sectors,ordered)):reject('Russell color/label association ambiguous')
    # Independent geometry sanity check: angular spans at two radii must be close to printed labels.
    # Values returned below are ONLY OCR figures, never pixel area or angular spans.
    for fraction in [.6,.8]:
        arc={c:0 for c in palette};n=7200; samples=[]
        for k in range(n):
            a=2*math.pi*k/n;c=pixels[round(cx+radius*fraction*math.cos(a)),round(cy-radius*fraction*math.sin(a))]
            samples.append(c if c in arc else None)
        if sum(c is None for c in samples)>n*.12:reject('Russell sector boundaries unreadable')
        for k,c in enumerate(samples):
            if c is None:
                before=after=1
                while samples[(k-before)%n] is None:before+=1
                while samples[(k+after)%n] is None:after+=1
                c=samples[(k-before)%n] if before<=after else samples[(k+after)%n]
            arc[c]+=1
        for sector,label in zip(sectors,ordered):
            if abs(arc[sector[2]]/n*100-label[1])>.5:reject(f'Russell printed weight disagrees with sector geometry: {sector[1]} printed {label[1]}, arc {arc[sector[2]]/n*100:.3f}, radius {fraction}')
    rows=validated_rows([{'name':s[1],'weightPct':l[1]}for s,l in zip(sectors,ordered)])
    if abs(sum(r['weightPct']for r in rows)-100)>.1:reject('Russell printed sector total invalid')
    return sorted([[SECTOR_LABELS.get(r['name'],r['name']),r['weightPct']]for r in rows])

def printed_sectors(body):
    with tempfile.TemporaryDirectory() as directory:
        pdf=pathlib.Path(directory)/'source.pdf';pdf.write_bytes(body)
        subprocess.run(['pdfimages','-f','2','-l','2','-png',str(pdf),str(pathlib.Path(directory)/'chart')],capture_output=True,check=True,timeout=30)
        images=[p for p in pathlib.Path(directory).glob('chart-*.png') if 1.6<Image.open(p).width/Image.open(p).height<1.9]
        if len(images)!=1:reject('Russell printed sector chart missing/ambiguous')
        with Image.open(images[0])as image:
            a=read_chart(image,2,directory);b=read_chart(image,3,directory)
        if a!=b:reject('Russell sector OCR readings disagree')
        return a

def collect(config,now,fetch=download):
    body=fetch(config['sourceUrl']);text=pdf_text(body)
    if config['id']!='russell-1000' or not re.search(r'^Russell 1000 Index\s*$',text,re.M) or 'Russell 1000 Equal Weight' in text:reject('Wrong Russell exact composition identity')
    dates=re.findall(r'\(As of (\d{1,2}/\d{1,2}/20\d{2})\)',text)
    if not dates or len(set(dates))!=1:reject('Russell composition date ambiguous')
    stamp=document_date(dt.datetime.strptime(dates[0],'%m/%d/%Y').date().isoformat(),now)
    counts=re.findall(r'Number of Holdings\s+([\d,]+)\s+([\d,]+)',text)
    if len(counts)!=1:reject('Russell index/comparison count ambiguous')
    count=int(counts[0][0].replace(',',''))
    if not 500<count<1500 or 'largest US companies' not in text:reject('Russell universe/count changed')
    return {'index':config['name'],'asOf':stamp,'constituents':count,'sectorMethod':'ICB industries · printed Russell 1000 chart',
            'countries':[['🇺🇸 États-Unis',100]],'sectors':printed_sectors(body),'holdings':[],
            'source':{'url':config['sourceUrl'],'checkedAt':now.date().isoformat(),'sha256':proof(body),'label':'Fiche officielle FTSE Russell'},
            'provenance':'Indice Russell 1000 exact. Comptage natif ; secteurs imprimés lus à deux résolutions, associés aux couleurs de légende et contrôlés géométriquement. Les poids ne sont jamais déduits des surfaces. États-Unis : univers des sociétés américaines de l’indice, pas domicile juridique individuel. Poids du top dix absents de la publication ; aucune substitution ETF.'}
