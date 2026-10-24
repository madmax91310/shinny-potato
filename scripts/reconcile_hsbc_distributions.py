"""Reproduce one dated investigation from preserved raw evidence; never patch a price series."""
import datetime as dt,gzip,hashlib,json,pathlib,re,subprocess,tempfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
REPORT=ROOT/'reports/donnees-consolidees-2026-10-24'
def pdf_text(path):
 with tempfile.TemporaryDirectory()as tmp:
  pdf=pathlib.Path(tmp)/'source.pdf';pdf.write_bytes(gzip.decompress(path.read_bytes()))
  return subprocess.check_output(['pdftotext','-layout',str(pdf),'-'],text=True)
def investigate():
 folder=REPORT/'preuves/autonomie-commune';documents=[]
 for year,amount,date in [(2023,'0.2214','01/02/2024'),(2024,'1.2623','08/08/2024')]:
  path=folder/f'hsbc-distributions-{year}.bin.gz';text=pdf_text(path)
  rows=[r for r in text.splitlines()if 'IE00B4K6B022'in r and amount in r and date in r]
  if len(rows)!=1:raise ValueError('Exact share distribution row missing or ambiguous')
  if not re.search(r'IE00B4K6B022\s+H0011-0002\s+31/12/'+str(year)+r'\s+EUR\b',text):raise ValueError('Exact share reporting currency not qualified')
  documents.append({'reportingYear':year,'isin':'IE00B4K6B022','currency':'EUR','distributionDate':date,'amount':float(amount),'evidence':str(path.relative_to(REPORT)),'uncompressedSha256':hashlib.sha256(gzip.decompress(path.read_bytes())).hexdigest()})
 original=ROOT/'reports/reliquat-79-2026-10-23/preuves/marches-originaux/etfIE00B4K6B022.json.gz'
 data=json.loads(gzip.decompress(original.read_bytes()))['1d']['chart']['result'][0]
 rows={dt.datetime.fromtimestamp(t,dt.timezone.utc).strftime('%Y-%m-%d'):{'close':close,'adjusted':adj,'factor':adj/close if close and adj else None}for t,close,adj in zip(data['timestamp'],data['indicators']['quote'][0]['close'],data['indicators']['adjclose'][0]['adjclose'])}
 start,end=rows['2023-12-29'],rows['2024-12-31'];before,after=rows['2024-07-31'],rows['2024-08-01']
 old=end['adjusted']/start['adjusted'];observed=after['factor']/before['factor'];predicted=1/(1-1.2623/before['close']);counterfactual=old/observed
 events=[{'date':dt.datetime.fromtimestamp(v['date'],dt.timezone.utc).strftime('%Y-%m-%d'),'amount':v['amount']}for v in data.get('events',{}).get('dividends',{}).values()if 2024==dt.datetime.fromtimestamp(v['date'],dt.timezone.utc).year]
 return {'case':'financial:IE00B4K6B022/2024','evidenceLevel':'Documents officiels réellement téléchargés localement ; calcul sur la réponse originale préservée. Pas nouvelle collecte GitHub ni série de remplacement.','documents':documents,'originalMarketEvidence':str(original.relative_to(ROOT)),'providerEvents2024':events,'officialDistributionTotalEUR':sum(r['amount']for r in documents),'providerDistributionTotalEUR':sum(r['amount']for r in events),'beforeExtraAdjustment':before,'afterExtraAdjustment':after,'observedExtraAdjustmentFactor':observed,'factorPredictedByUnlisted12623Dividend':predicted,'factorDifference':observed-predicted,'oldReturnPct':(old-1)*100,'counterfactualWithoutExtraAdjustmentPct':(counterfactual-1)*100,'extraAdjustmentEffectPp':(old-counterfactual)*100,'officialCalendarNavPct':11.6,'remainingResidualPp':(counterfactual-1)*100-11.6,'causeClosed':False,'seriesRepaired':False,'runtimeQualificationChanged':False,'finding':'Le saut du facteur ajusté au 01/08 correspond quantitativement à un second montant 1,2623 EUR ; le calendrier officiel de la part publie ce montant au 08/08. Cette composante de la divergence est documentée. Le rendement corrigé contrefactuel ne constitue pas une série qualifiée.','missing':'Qualifier les clôtures de valorisation et dernières transactions (51,04 EUR Euronext contre 51,41 EUR Yahoo au 31/12), les bornes NAV quotidiennes et la convention de réinvestissement ; le résidu ne démontre pas une erreur NAV.'}
if __name__=='__main__':
 result=investigate();path=REPORT/'preuves/autonomie-commune/hsbc-ajustement-2024.json';path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:result[k]for k in ['case','observedExtraAdjustmentFactor','factorPredictedByUnlisted12623Dividend','extraAdjustmentEffectPp','remainingResidualPp','causeClosed']},ensure_ascii=False))
