"""Qualify the exact online Euronext tariff used by each supported broker.
Renewable official brochure URLs; no fund/foreign-market tariff substitutions.
"""
import argparse
import datetime as dt
import hashlib
import json
import pathlib
import re
import urllib.parse
from bs4 import BeautifulSoup
from issuer_documents import download, pdf_text
from collect_regulatory_data import unique
from broker_document_sources import DocumentResolver
ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT/'src/data/automated-broker-tariffs.json'
SOURCES = {'bourso': 'https://www.boursobank.com/content/brochure_tarifaire/boursorama_bt.pdf',
 'fortuneo':'https://www.fortuneo.fr/datas/files/tarifs_fortuneo.pdf'}
from broker_tariff_extensions import SOURCES as EXTENDED_SOURCES, SUPPLEMENT_SOURCES, parse as parse_extended, parse_supplement, base_supplements
SOURCES.update(EXTENDED_SOURCES)
MONTHS = {'janvier':1,'février':2,'mars':3,'avril':4,'mai':5,'juin':6,'juillet':7,'août':8,'septembre':9,'octobre':10,'novembre':11,'décembre':12}
def parse(name, content, today, previous=None):
 if name in EXTENDED_SOURCES: return parse_extended(name,content,today,previous)
 # Preserve column alignment. Only the labelled tariff table is eligible.
 if name == 'bourso':
  date = re.search(r'Tarifs applicables au (\d{1,2}) (\w+) (\d{4})',content)
  block = content.split('Courtage Actions Euronext (Paris, Amsterdam, Bruxelles) et Horaires Etendus')
  if len(block)!=2:raise ValueError('Tableau Actions Euronext absent ou ambigu')
  block = block[1].split('Courtage ETF - ETN - ETC')[0]
  if not all(label in block for label in ['DÉCOUVERTE','CLASSIC','TRADER','ULTIMATE']):raise ValueError('Colonnes du tableau modifiées')
  amount = unique(r'^\s*([\d,]+)€\s+[\d,]+€\s+[\d,]+€\s+[\d,]+€\s*$', '\n'.join(line for line in block.splitlines() if re.fullmatch(r'\s*[\d,]+€\s+[\d,]+€\s+[\d,]+€\s+[\d,]+€\s*',line)))
  lines=block.splitlines()
  threshold_lines=[line for line in lines if re.match(r'^\s*jusqu’à [\d ]+ €\s+',line)]
  if len(threshold_lines)!=1:raise ValueError('Seuil Découverte ambigu')
  threshold=unique(r'^\s*jusqu’à ([\d ]+) €\s+',threshold_lines[0])
  rate_lines=[line for line in lines if re.match(r'^\s*(?:par ordre\(1\)\s+)?puis [\d,]+% au-delà',line)]
  if len(rate_lines)!=1:raise ValueError('Taux Découverte ambigu')
  rate=unique(r'puis ([\d,]+)% au-delà',rate_lines[0].split('au-delà')[0]+'au-delà')
  values={'minimum':amount,'threshold':threshold,'rate':rate}
  scope='Découverte ; actions Euronext Paris, Amsterdam, Bruxelles ; ordre en ligne'
 else:
  date=re.search(r'CONDITIONS TARIFAIRES AU (\d{1,2}) (\w+) (\d{4})',content,re.I)
  block=content.split('TARIFS DE COURTAGE BOURSE')
  if len(block)!=2:raise ValueError('Tableau courtage absent ou ambigu')
  block=block[1].split('FRAIS DE SERVICE DE RÈGLEMENT DIFFÉRÉ')[0]
  if 'Les anciens tarifs sont toujours applicables aux clients détenteurs' not in content or not all(label in block for label in ['TARIF STARTER','TARIF PROGRESS','TARIF TRADER PRO','EURONEXT','EQUIDUCT','le 1er ordre inférieur ou égal','chaque mois']):raise ValueError('Conditions Starter modifiées')
  threshold=unique(r'à ([\d ]+) € chaque mois',block)
  rate=unique(r'sinon ([\d,]+) % par ordre',block)
  free=unique(r'^\s*([\d,]+)€\s+pour un ordre inférieur', block)
  values={'freeFee':free,'threshold':threshold,'rate':rate}
  scope='Starter ; Euronext Paris, Bruxelles, Amsterdam ou Equiduct ; premier ordre mensuel sous le seuil ; anciens tarifs possibles'
 if not date:raise ValueError('Date tarifaire absente')
 day,month,year=date.groups(); published=dt.date(int(year),MONTHS[month.lower()],int(day)).isoformat()
 if published>today or (previous and published<previous['asOf']):raise ValueError('Date tarifaire future ou antérieure')
 for key,value in values.items():
  if not 0<=value<=(100000 if key=='threshold' else 100):raise ValueError('Tarif invalide')
 return {'values':values,'asOf':published,'checkedAt':today,'sourceUrl':SOURCES[name], 'scope':scope,
  'page': next(i for i,p in enumerate(content.split('\f'),1) if ('Courtage Actions Euronext' if name == 'bourso' else 'TARIFS DE COURTAGE BOURSE') in p),
  'method':'Tableau de courtage de la brochure officielle ; forfait et marché exacts', 'sha256':hashlib.sha256(content.encode()).hexdigest()}
def fetch_content(url):
 raw=download(url)
 # WordPress download pages expose a rotating, public link to the real PDF.
 if 'groupe.boursedirect.fr/download/' in url and not raw.startswith(b'%PDF'):
  soup=BeautifulSoup(raw.decode('utf-8'),'html.parser')
  links={urllib.parse.urljoin(url,a['href']) for a in soup.find_all('a',href=True)
   if 'wpdmdl=' in a['href'] and '2026_BD_CP_Plan-Investissement.pdf' in a['href']}
  if len(links)!=1:raise ValueError('Lien du communiqué Bourse Direct absent ou ambigu')
  target=links.pop()
  if urllib.parse.urlparse(target).netloc!='groupe.boursedirect.fr':raise ValueError('Hôte du communiqué non officiel')
  raw=download(target)
  if not raw.startswith(b'%PDF'):raise ValueError('Communiqué Bourse Direct non PDF')
 # Isolate the English column of the bilingual France contract. This avoids
 # interleaving French clauses when Poppler's line wrapping differs by platform.
 # The normal 2 MB extraction limit still applies.
 if raw.startswith(b'%PDF'):
  return pdf_text(raw,crop=(0,300)) if url==SUPPLEMENT_SOURCES['tr_pea_transfer'][2] else pdf_text(raw)
 return raw.decode('utf-8')
def collect(baseline,today,fetcher=fetch_content):
 failures={};validated=[];documents={}
 previous_sources={SOURCES[name]:o['sourceUrl'] for name,o in baseline['brokers'].items() if name in SOURCES and o.get('sourceUrl')}
 from broker_profiles import SOURCES as PROFILE_SOURCES
 for broker in baseline['brokers'].values():
  for profile in broker.get('profile',{}).values():
   for ref in profile.get('refs',[]):
    if ref.get('document') in PROFILE_SOURCES and ref.get('sourceUrl'):
     previous_sources[PROFILE_SOURCES[ref['document']]['url'].split('?')[0]]=ref['sourceUrl']
 resolver=DocumentResolver(fetcher,today,previous_sources)
 def fetch_once(url):
  if url not in documents:
   try:documents[url]=resolver(url)
   except Exception as exc:documents[url]=exc
  if isinstance(documents[url],Exception):raise documents[url]
  return documents[url]
 for name,url in SOURCES.items():
  try:
   content=fetch_once(url);observation=parse(name,content,today,baseline['brokers'].get(name))
   observation['sourceUrl']=content.source_url
   observation['discoveryUrl']=content.discovery_url
   for field in observation.get('fields',{}).values():
    field['sourceUrl']=content.source_url
    field['discoveryUrl']=content.discovery_url
   previous_fields=baseline['brokers'].get(name,{}).get('fields',{})
   observation['fields']={**previous_fields,**observation.get('fields',{})}
   observation['profile']=baseline['brokers'].get(name,{}).get('profile',{})
   if name in ('bourso','fortuneo'):
    try:observation['fields'].update(base_supplements(name,content,observation))
    except Exception as exc:failures[name+':extras']=str(exc)
   baseline['brokers'][name]=observation;validated.append(name)
  except Exception as exc:
   selected=getattr(documents.get(url),'source_url',url)
   failures[name]=f'{selected}: {exc}'
 for key,(broker,field,url) in SUPPLEMENT_SOURCES.items():
  try:
   content=fetch_once(url)
   _,_,observation=parse_supplement(key,content,today)
   observation['sourceUrl']=content.source_url
   observation['discoveryUrl']=content.discovery_url
   if broker not in baseline['brokers']:raise ValueError('Barème principal non qualifié')
   previous=baseline['brokers'][broker].get('fields',{}).get(field,{})
   if observation.get('publicationMonth') and previous.get('publicationMonth') and observation['publicationMonth']<previous['publicationMonth']:
    raise ValueError('Régression du mois de publication du contrat')
   baseline['brokers'][broker].setdefault('fields',{})[field]=observation
  except Exception as exc:failures[key]=str(exc)
 from broker_profiles import collect_profiles
 profile_failures,profile_count=collect_profiles(baseline,today,fetch_once)
 failures.update(profile_failures)
 baseline['profileCollection']={'checkedAt':today,'validated':profile_count,'failures':profile_failures}
 baseline['sourceResolution']={'checkedAt':today,'documents':resolver.report}
 return baseline,failures,validated
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--apply',action='store_true');parser.add_argument('--output',type=pathlib.Path,required=True);args=parser.parse_args()
 baseline=json.loads(DEST.read_text()) if DEST.exists() else {'schemaVersion':1,'brokers':{}}
 today=dt.datetime.now(dt.timezone.utc).date().isoformat()
 baseline,failures,validated=collect(baseline,today)
 args.output.write_text(json.dumps({'observations':baseline,'failures':failures},ensure_ascii=False,indent=2)+'\n')
 if args.apply:
  tmp=DEST.with_suffix('.tmp');tmp.write_text(json.dumps(baseline,ensure_ascii=False,indent=2)+'\n');tmp.replace(DEST)
 print(json.dumps({'validated':len(validated),'brokers':validated,'retained':len(baseline['brokers'])-len(validated),'failures':failures},ensure_ascii=False));return bool(failures)
if __name__=='__main__':raise SystemExit(main())
