"""Dated Iroko Zen valuations from the issuer's quarterly bulletin."""
import datetime as dt
import hashlib
import re
from issuer_documents import download
URL='https://iroko-documents.s3.eu-west-3.amazonaws.com/Iroko_Zen_bulletin_trimestriel.pdf'
MONTHS={'mars':3,'juin':6,'septembre':9,'décembre':12}


def parse_snapshot(text,pages,today):
    if 'Bulletin trimestriel' not in text or 'Iroko Zen' not in text:
        raise ValueError('Wrong quarterly publication')
    dates=set(re.findall(r'Données Iroko au (\d{1,2}) (mars|juin|septembre|décembre) (20\d{2})',text))
    if len(dates)!=1:raise ValueError('Missing or ambiguous portfolio date')
    day,month,year=dates.pop();stamp=dt.date(int(year),MONTHS[month],int(day))
    next_month=stamp.replace(day=28)+dt.timedelta(days=4)
    if stamp!=next_month.replace(day=1)-dt.timedelta(days=1) or stamp>today:
        raise ValueError('Invalid quarterly portfolio date')
    quarter=re.search(r"Le\s+([1-4])e\s+trimestre d[’']Iroko Zen",text)
    if not quarter or int(quarter[1])!=stamp.month//3:raise ValueError('Wrong fund or quarterly period')
    candidates=[p for p in pages if any(w['text']=='géographique' for w in p['words']) and any(w['text']=='typologie' for w in p['words'])]
    if len(candidates)!=1:raise ValueError('Missing/ambiguous allocation page')
    p=candidates[0];words=p['words'];width=p['width']
    heading=next(w for w in words if w['text']=='géographique')
    region=[w for w in words if heading['y']+50<w['y']<heading['y']+200]
    if not any(w['text']=='d’expertise' for w in words) or not any(w['text']=='droits' for w in words):
        raise ValueError('Missing valuation basis')
    # Match printed labels to percentages on the same baseline in each column.
    # PDF glyphs may be separated vertically; only literal observed fragments are repaired.
    country_names=['France','Royaume-Uni','Espagne','Pays-Bas','Irlande','Allemagne','Belgique','Italie']
    sector_names={'Commerces':'Commerces','Bureau':'Bureaux','Bureaux':'Bureaux','ocau':'Locaux d’activité','Locaux':'Locaux d’activité',
                  'anté,':'Santé, hôtellerie, autre','Santé,':'Santé, hôtellerie, autre','Entrep':'Entrepôts','Entrepôts':'Entrepôts','ogistique':'Logistique','Logistique':'Logistique'}
    countries=[];sectors=[];used=set()
    for label in region:
        raw=label['text'].split(' 🇬')[0].split(' 🇪')[0].split(' 🇱')[0].split(' 🇩')[0].split(' 🇮')[0]
        name=raw if raw in country_names else sector_names.get(raw)
        if not name:continue
        left=label['x']<width*.5
        if (left and raw not in country_names) or (not left and raw not in sector_names):raise ValueError('Wrong allocation column')
        percentages=[w for w in region if w['text']=='%' and 0<w['x']-label['right']<width*.20 and abs(w['y']-label['y'])<2]
        if not percentages:raise ValueError('Unpaired allocation label: '+name)
        pct=min(percentages,key=lambda w:w['x'])
        values=[w for w in region if re.fullmatch(r'\d+(?:,\d+)?',w['text']) and abs(w['y']-pct['y'])<.1 and 0<pct['x']-w['right']<5]
        if len(values)!=1 or (pct['x'],pct['y']) in used:raise ValueError('Ambiguous allocation percentage')
        used.add((pct['x'],pct['y']))
        (countries if left else sectors).append({'label':name,'value':float(values[0]['text'].replace(',','.'))})
    if len(used)!=sum(w['text']=='%' for w in region):raise ValueError('Unrecognised allocation row')
    for rows in [countries,sectors]:
        if not rows or len({r['label'] for r in rows})!=len(rows) or any(not 0<=r['value']<=100 for r in rows) or abs(sum(r['value'] for r in rows)-100)>.15:
            raise ValueError('Incomplete or invalid quarterly allocation')
    return {'asOf':stamp.isoformat(),'checkedAt':today.isoformat(),'countries':countries,'sectors':sectors,
            'sourceUrls':[URL],'dateNote':'Bulletin trimestriel : date du patrimoine conservée, distincte de la période de validité du document. Répartition en valeur d’expertise hors droits.'}


def collect_snapshot(today):
    from collect_scpi import pdf_text
    from collect_corum import bbox_pages
    raw=download(URL,max_bytes=32_000_000,timeout=60)
    return {**parse_snapshot(pdf_text(raw),bbox_pages(raw),today),'sha256':hashlib.sha256(raw).hexdigest()}
