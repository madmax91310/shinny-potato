"""Qualify the exact online Euronext tariff used by each supported broker.
Renewable official brochure URLs; no fund/foreign-market tariff substitutions.
"""
import argparse
import datetime as dt
import hashlib
import json
import pathlib
import re
from issuer_documents import download, pdf_text
from collect_regulatory_data import unique
ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT/'src/data/automated-broker-tariffs.json'
SOURCES = {'bourso': 'https://www.boursobank.com/content/brochure_tarifaire/boursorama_bt.pdf',
 'fortuneo':'https://www.fortuneo.fr/datas/files/tarifs_fortuneo.pdf'}
MONTHS = {'janvier':1,'février':2,'mars':3,'avril':4,'mai':5,'juin':6,'juillet':7,'août':8,'septembre':9,'octobre':10,'novembre':11,'décembre':12}
def parse(name, content, today, previous=None):
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
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--apply',action='store_true');parser.add_argument('--output',type=pathlib.Path,required=True);args=parser.parse_args()
 baseline=json.loads(DEST.read_text()) if DEST.exists() else {'schemaVersion':1,'brokers':{}}
 failures={};today=dt.datetime.now(dt.timezone.utc).date().isoformat()
 for name,url in SOURCES.items():
  try:
   raw=download(url);content=pdf_text(raw);baseline['brokers'][name]=parse(name,content,today,baseline['brokers'].get(name))
  except Exception as exc:failures[name]=str(exc)
 args.output.write_text(json.dumps({'observations':baseline,'failures':failures},ensure_ascii=False,indent=2)+'\n')
 if args.apply:
  tmp=DEST.with_suffix('.tmp');tmp.write_text(json.dumps(baseline,ensure_ascii=False,indent=2)+'\n');tmp.replace(DEST)
 print(json.dumps({'validated':len(baseline['brokers']),'failures':failures},ensure_ascii=False));return bool(failures)
if __name__=='__main__':raise SystemExit(main())
