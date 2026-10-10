"""Official DILA parameters consumed by the lexicon. No credential required.

Each source is validated and applied atomically. A failed source preserves its last
validated values; the command fails after writing the successful observations.
Dates describe publication checks, not invented dates of legal effect.
"""
from concurrent.futures import ThreadPoolExecutor
import argparse
import datetime as dt
import hashlib
import json
import pathlib
import re
import urllib.request
import xml.etree.ElementTree as ET
from regulatory_extensions import SOURCES as EXTRA_SOURCES, extra_values

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / 'src/data/automated-regulatory.json'
DC = '{http://purl.org/dc/elements/1.1/}'
BASE = 'https://lecomarquage.service-public.gouv.fr/vdd/3.5/part/xml/'
SOURCES = {
 'livret': ('F2365', 'Livret A', {'livretCeiling': r"Le montant maximum d'épargne inscrit sur le livret A est de ([\d ]+) €"}),
 'ldds': ('F2368', 'Livret de développement durable et solidaire (LDDS)', {'lddsCeiling': r'Le plafond du LDDS est de ([\d ]+) €', 'lddsRate': r"Le taux d'intérêt annuel est de ([\d,]+) %"}),
 'pea': ('F2385', "Plan d'épargne en actions (PEA)", {
  'peaCeiling': r'Le plafond des versements sur le PEA bancaire est de ([\d ]+) €',
  'peaCombinedCeiling': r'Le PEA classique et le PEA-PME sont cumulables\. Mais la somme totale versée sur ces 2 plans par un même titulaire ne peut pas dépasser ([\d ]+) €'}),
 'cto': ('F21618', 'Impôt sur le revenu - Plus-values sur valeurs mobilières', {
  'ctoTotal': r'La plus-value réalisée est soumise au prélèvement forfaitaire unique au taux de ([\d,]+) %',
  'ctoIncome': r'\(([\d,]+) % d.impôt sur le revenu et',
  'ctoSocial': r'd.impôt sur le revenu et ([\d,]+) % de prélèvements sociaux'}),
 'av': ('F22414', "Impôt sur le revenu - Comment sont imposés les revenus d'un contrat d'assurance-vie ?", {
  'avLowerIncome': r'([\d,]+) % pour les intérêts correspondant aux primes n.excédant pas',
  'avHigherIncome': r'([\d,]+) % pour les intérêts correspondant aux primes excédant',
  'avSocial': r"Les gains tirés d'un contrat d'assurance-vie sont toujours soumis aux prélèvements sociaux \(CSG, CRDS\) au taux de ([\d,]+) %",
  'avSingleAllowance': r'([\d ]+) € pour un célibataire',
  'avCoupleAllowance': r'([\d ]+) € pour un couple\.',
  'avPremiumThreshold': r'Le montant de ([\d ]+) € est calculé pour l’ensemble de vos contrats d’assurance vie'}),
 'peaTax': ('F22449', "Impôt sur le revenu - Comment sont imposés les revenus d'un plan d'épargne en actions (PEA) ?", {
  'peaIncome': r"avant les 5 ans du plan d'épargne, le gain net réalisé depuis l'ouverture du plan est imposé au taux de ([\d,]+) %"}),
 'social': ('F2329', 'Prélèvements sociaux (CSG, CRDS...) sur les revenus du patrimoine et de placements', {}),
 'dividends': ('F2613', "Impôt sur le revenu - Revenus d'épargne et de placement", {
  'dividendIncome': r"Le prélèvement forfaitaire unique est constitué de l'impôt sur le revenu \(([\d,]+) %\) et des prélèvements sociaux",
  'dividendSocial': r'Le taux des prélèvements sociaux sur les revenus de placements passe à ([\d,]+) %'}),
}
SOURCES.update(EXTRA_SOURCES)

# DILA's current wording keeps the same fields but describes the fraction of
# gains, rather than repeating the former premium-threshold bullet points.
AV_CURRENT_PATTERNS = {
 'avLowerIncome': r'le taux de ([\d,]+) % applicable après 8 ans dépend du montant global des primes',
 'avHigherIncome': r'La fraction des gains qui ne bénéficie pas du taux de [\d,]+ % est imposée à ([\d,]+) %',
 'avPremiumThreshold': r'apprécié au regard du seuil de ([\d ]+) €',
 'avSocial': r"Les gains tirés d'un contrat d'assurance-vie sont toujours soumis aux prélèvements sociaux \(CSG, CRDS\)\. En principe, le taux appliqué est de ([\d,]+) %",
}

def text(node):
 return ' '.join(''.join(node.itertext()).split())

def number(value):
 return float(value.replace(' ', '').replace(',', '.'))

def unique(pattern, content):
 values = set(number(x) for x in re.findall(pattern, content, re.M))
 if len(values) != 1:
  raise ValueError(f'Champ absent ou ambigu : {pattern}')
 return values.pop()

def parse(name, raw, today, previous=None):
 identity, title, patterns = SOURCES[name]
 root = ET.fromstring(raw)
 if root.tag != 'Publication' or root.get('ID') != identity or root.get('spUrl') != f'https://www.service-public.gouv.fr/particuliers/vosdroits/{identity}':
  raise ValueError('Identité de publication incompatible')
 if text(root.find(DC+'title')) != title:
  raise ValueError('Titre de publication incompatible')
 date = re.fullmatch(r'modified (\d{4}-\d{2}-\d{2})', root.findtext(DC+'date') or '')
 if not date: raise ValueError('Date de publication absente')
 published = date[1]
 if dt.date.fromisoformat(published) > dt.date.fromisoformat(today): raise ValueError('Publication future')
 if previous and published < previous['publishedAt']: raise ValueError('Publication antérieure')
 # Paragraph scope avoids selecting numbers from navigation or related-page labels.
 paragraphs = '\n'.join(text(p) for p in root.iter('Paragraphe'))
 values = {key: unique(AV_CURRENT_PATTERNS[key] if name == 'av' and key in AV_CURRENT_PATTERNS
                       and not re.findall(pattern, paragraphs, re.M) else pattern, paragraphs)
           for key, pattern in patterns.items()}
 values.update(extra_values(name, root, today, text, unique))
 if name == 'av':
  parents = {child: parent for parent in root.iter() for child in parent}
  cases = []
  for case in root.iter('Cas'):
   title_node = case.find('Titre')
   if title_node is None or text(title_node) != 'Contrat de moins de 8 ans': continue
   ancestor = case
   while ancestor in parents:
    ancestor = parents[ancestor]
    heading = ancestor.find('Titre')
    if heading is not None and text(heading) == 'Primes versées depuis le 27 septembre 2017':
     cases.append(text(case)); break
  values['avBeforeEightIncome'] = unique(r'Taux forfaitaire de ([\d,]+) %', '\n'.join(cases))
 if name == 'peaTax':
  if not any(x.get('LienPublication') == 'F2329' for x in root.iter('LienInterne')):
   raise ValueError('Référence des prélèvements sociaux absente')
 if name == 'social':
  if not re.search(r'Gain réalisé ou rente viagère versée en cas de retrait ou de clôture d.un PEA', paragraphs):
   raise ValueError('Périmètre PEA absent')
  totals = []
  parents = {child: parent for parent in root.iter() for child in parent}
  candidates = []
  for table in root.iter('Tableau'):
   if table.find('TitreRiche') is None or text(table.find('TitreRiche')) != 'Taux des contributions sociales applicables': continue
   parent = parents.get(table)
   if parent is None or parent.tag != 'Cas' or text(parent.find('Titre')) != 'Cas général': continue
   ancestor = parent; year = None; placement = False
   while ancestor in parents:
    ancestor = parents[ancestor]
    title_node = ancestor.find('Titre')
    label = text(title_node) if title_node is not None else ''
    if ancestor.tag == 'SousChapitre' and label == 'Revenus de placements': placement = True
    match = re.fullmatch(r'Revenus de (\d{4})', label)
    if match: year = int(match[1])
   if not placement or year is None or year > int(today[:4]): continue
   candidates.append((year, table))
  if not candidates: raise ValueError('Tableau du régime général des placements absent')
  latest_year = max(year for year, _ in candidates)
  for year, table in candidates:
   if year != latest_year: continue
   rows = [r for r in table.findall('Rangée') if r.get('type') == 'normal']
   parsed = {text(r.findall('Cellule')[0]): unique(r'([\d,]+) %', text(r.findall('Cellule')[1])) for r in rows}
   if set(parsed) != {'Contribution sociale généralisée (CSG)', 'Contribution au remboursement de la dette sociale (CRDS)', 'Prélèvement de solidarité', 'TOTAL'}:
    raise ValueError('Structure des contributions modifiée')
   if abs(sum(v for k,v in parsed.items() if k != 'TOTAL')-parsed['TOTAL']) > .001: raise ValueError('Somme sociale incohérente')
   totals.append(parsed['TOTAL'])
  if not totals or len(set(totals)) != 1: raise ValueError('Taux social ambigu')
  values['peaSocial'] = totals[0]
 if name == 'cto' and abs(values['ctoIncome']+values['ctoSocial']-values['ctoTotal']) > .001:
  raise ValueError('Somme PFU incohérente')
 for key,value in values.items():
  limit = 1_000_000 if any(x in key for x in ('Ceiling','Threshold','Maximum','Minimum')) or key in ('avSingleAllowance','avCoupleAllowance') else 100
  if key.endswith('Year'): limit = int(today[:4])
  if not 0 < value <= limit:
   raise ValueError(f'Valeur invalide : {key}')
 return {'values': values, 'publishedAt': published, 'checkedAt': today,
  'sourceUrl': root.get('spUrl'), 'downloadUrl': BASE+identity+'.xml',
  'title': title, 'sha256': hashlib.sha256(raw).hexdigest(),
  'scope': 'Résident fiscal français ; régime général, hors exceptions historiques',
  'method': 'Champ ou tableau identifié dans la publication XML DILA ; date de publication distincte de la date d’effet juridique'}

def collect(baseline, fetch, today):
 result = json.loads(json.dumps(baseline)); failures = {}
 for name, (identity, _, _) in SOURCES.items():
  try: result['sources'][name] = parse(name, fetch(BASE+identity+'.xml'), today, result['sources'].get(name))
  except Exception as exc: failures[name] = str(exc)
 return result, failures

def main():
 parser = argparse.ArgumentParser(); parser.add_argument('--apply', action='store_true'); parser.add_argument('--output', type=pathlib.Path, required=True)
 args = parser.parse_args(); today = dt.datetime.now(dt.timezone.utc).date().isoformat()
 baseline = json.loads(DEST.read_text()) if DEST.exists() else {'schemaVersion': 1, 'sources': {}}
 def fetch(url):
  with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent':'Patrimoine-Compagnie official-data collector'}), timeout=60) as response:
   return response.read(2_000_001)
 def fetch_safe(url):
  try: return fetch(url)
  except Exception as exc: return exc
 urls = [BASE+identity+'.xml' for identity,_,_ in SOURCES.values()]
 with ThreadPoolExecutor(max_workers=8) as pool: responses = dict(zip(urls, pool.map(fetch_safe, urls)))
 def cached(url):
  response = responses[url]
  if isinstance(response, Exception): raise response
  if len(response) > 2_000_000: raise ValueError('Publication trop volumineuse')
  return response
 result, failures = collect(baseline, cached, today)
 args.output.write_text(json.dumps({'observations':result, 'failures':failures}, ensure_ascii=False, indent=2)+'\n')
 if args.apply:
  temporary = DEST.with_suffix('.tmp'); temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n'); temporary.replace(DEST)
 print(json.dumps({'validatedSources':len(result['sources']), 'failures':failures}, ensure_ascii=False))
 return bool(failures)

if __name__ == '__main__': raise SystemExit(main())
