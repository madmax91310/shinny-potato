"""Dated index exposure from Amundi synthetic-fund factsheets, not the substitute basket."""
import datetime as dt
import re
from data_automation import UTC, reject
from issuer_documents import download, pdf_text, document_date, proof, validated_rows


def rows(block):
    result=[]
    for line in block.splitlines():
        m=re.match(r'\s*([^\d%\n]+?)\s{2,}([\d,]+(?:\.\d+)?)\s*%\s*$',line)
        if m and m[1].strip() not in ('Total','Sous-total'):
            result.append({'name':m[1].strip(),'weightPct':float(m[2].replace(',','.'))})
    return result


def parse_document(body,share,now):
    text=pdf_text(body);left=pdf_text(body,(0,300));right=pdf_text(body,(300,300))
    if share['isin']not in text or 'Synthétique'not in text:
        reject('Amundi exact synthetic-share identity/method missing')
    dates=re.findall(r'\b\d{2}/\d{2}/\d{4}\b',text)
    # Header date, independently checked against the URL requested by the collector.
    stamp=document_date(dates[0],now)
    countries=rows(left.split("Répartition géographique de l'indice (source : Amundi)",1)[1].split('\f',1)[0])
    holdings=rows(right.split("Principales lignes de l'indice (source : Amundi)",1)[1].split("Secteurs de l'indice",1)[0])
    sectors=rows(right.split("Secteurs de l'indice (source : Amundi)",1)[1].split('\f',1)[0])
    validated_rows(countries);validated_rows(sectors);validated_rows(holdings,complete=False)
    if not 3<=len(holdings)<=10:reject('Amundi principal index holdings incomplete')
    return {**share,'productId':share['isin'],'exposureOnly':True,
      **{key:{'asOf':stamp,'basis':'index','rows':value,'sha256':proof(body),
              'sourceUrl':share['sourceUrl']}for key,value in [('countries',countries),('sectors',sectors),('holdings',holdings)]}}


def collect_one(share,now=None,fetch=download):
    now=now or dt.datetime.now(UTC);end=now.date().replace(day=1)-dt.timedelta(days=1)
    errors=[]
    for _ in range(2):
        url=f"https://www.amundietf.fr/pdfDocuments/monthly-factsheet/{share['isin']}/FRA/FRA/INSTITUTIONNEL/ETF/{end:%Y%m%d}"
        try:
            result=parse_document(fetch(url),{**share,'sourceUrl':url},now)
            if result['holdings']['asOf']!=end.isoformat():reject('Amundi requested/published month mismatch')
            return result
        except Exception as error:
            errors.append(f'{end}: {error}');end=end.replace(day=1)-dt.timedelta(days=1)
    reject(' ; '.join(errors))
