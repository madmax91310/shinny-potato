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
    numeric_dates=set(re.findall(r'Données du portefeuille Iroko Zen au (\d{2}/\d{2}/20\d{2})',text))
    if numeric_dates:
        if dates or len(numeric_dates)!=1:raise ValueError('Ambiguous portfolio date conventions')
        stamp=dt.datetime.strptime(numeric_dates.pop(),'%d/%m/%Y').date()
        quarter=re.search(r'Au (premier|deuxième|troisième|quatrième) trimestre (20\d{2}),?\s+votre SCPI Iroko Zen',text)
        quarters={'premier':1,'deuxième':2,'troisième':3,'quatrième':4}
        if not quarter or quarters[quarter[1]]!=stamp.month//3 or int(quarter[2])!=stamp.year:raise ValueError('Wrong exact fund/quarter for dated portfolio')
        next_month=stamp.replace(day=28)+dt.timedelta(days=4)
        if stamp!=next_month.replace(day=1)-dt.timedelta(days=1)or stamp>today:raise ValueError('Invalid quarterly portfolio date')
        return parse_current_layout(pages,stamp,today)
    if len(dates)!=1:raise ValueError('Missing or ambiguous portfolio date')
    day,month,year=dates.pop();stamp=dt.date(int(year),MONTHS[month],int(day))
    next_month=stamp.replace(day=28)+dt.timedelta(days=4)
    if stamp!=next_month.replace(day=1)-dt.timedelta(days=1) or stamp>today:
        raise ValueError('Invalid quarterly portfolio date')
    quarter=re.search(r"Le\s+([1-4])e(?:r)?\s+trimestre d[’']Iroko Zen",text)
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


def parse_current_layout(pages,stamp,today):
    # T3 2026: labels span up to three lines. Bind each printed percentage to
    # the centre of its complete label in the correct column, never normalise.
    candidates=[p for p in pages if any(w['text']=='géographique'for w in p['words'])and any(w['text']=='typologique'for w in p['words'])]
    if len(candidates)!=1:raise ValueError('Missing/ambiguous current allocation page')
    p=candidates[0];words=p['words'];width=p['width'];heading=next(w for w in words if w['text']=='géographique')
    if not any(w['text']=='d’expertise'for w in words)or not any(w['text']=='droits'for w in words):raise ValueError('Missing current valuation basis')
    region=[w for w in words if heading['y']+50<w['y']<heading['y']+200];used=set()
    def value(label,country):
        tokens=label.split();anchors=[w for w in region if w['text']==tokens[0]and (w['x']<width*.5)==country]
        if len(anchors)!=1:raise ValueError('Missing/ambiguous current allocation label: '+label)
        anchor=anchors[0];matched=[anchor]
        for token in tokens[1:]:
            found=[w for w in region if w['text']==token and abs(w['x']-anchor['x'])<90 and anchor['y']<=w['y']<=anchor['y']+40]
            if len(found)!=1:raise ValueError('Ambiguous wrapped allocation label: '+label)
            matched+=found
        centre=(min(w['y']for w in matched)+max(w['y']for w in matched))/2
        percentages=[w for w in region if w['text']=='%'and 0<w['x']-max(t['right']for t in matched)<width*.20 and abs(w['y']-centre)<3]
        if len(percentages)!=1:raise ValueError('Ambiguous current allocation percentage: '+label)
        pct=percentages[0];key=(pct['x'],pct['y'])
        numbers=[w for w in region if re.fullmatch(r'\d+(?:,\d+)?',w['text'])and abs(w['y']-pct['y'])<.1 and 0<pct['x']-w['right']<5]
        if len(numbers)!=1 or key in used:raise ValueError('Unpaired current allocation value: '+label)
        used.add(key);return float(numbers[0]['text'].replace(',','.'))
    countries=[{'label':name,'value':value(name,True)}for name in ['France','Royaume-Uni','Espagne','Pays-Bas','Irlande','Allemagne','Belgique','Italie']]
    sectors=[{'label':name,'value':value(name,False)}for name in ['Commerces','Bureaux','Locaux d’activité','Santé, hôtellerie, autre','Entrepôts et Logistique']]
    if len(used)!=sum(w['text']=='%'for w in region):raise ValueError('Unknown current allocation row')
    for rows in [countries,sectors]:
        if len({r['label']for r in rows})!=len(rows)or any(not 0<=r['value']<=100 for r in rows)or abs(sum(r['value']for r in rows)-100)>.15:raise ValueError('Incomplete current allocation')
    return {'asOf':stamp.isoformat(),'checkedAt':today.isoformat(),'countries':countries,'sectors':sectors,'sourceUrls':[URL],'dateNote':'Date explicite des données du portefeuille ; distincte de la validité du bulletin. Valeur d’expertise hors droits ; entrepôts et logistique publiés comme catégorie commune.'}


def collect_snapshot(today):
    from collect_scpi import pdf_text
    from collect_corum import bbox_pages
    raw=download(URL,max_bytes=32_000_000,timeout=60)
    return {**parse_snapshot(pdf_text(raw),bbox_pages(raw),today),'sha256':hashlib.sha256(raw).hexdigest()}
