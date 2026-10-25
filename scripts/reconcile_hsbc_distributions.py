"""Reproduce one dated investigation from preserved raw evidence; never patch a price series."""
import copy,datetime as dt,gzip,hashlib,json,math,pathlib,re,subprocess,tempfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
REPORT=ROOT/'reports/donnees-consolidees-2026-10-24'
def pdf_text(path):
 with tempfile.TemporaryDirectory()as tmp:
  pdf=pathlib.Path(tmp)/'source.pdf';pdf.write_bytes(gzip.decompress(path.read_bytes()))
  return subprocess.check_output(['pdftotext','-layout',str(pdf),'-'],text=True)
def candidate_without_factor(rows, boundary, amount):
 """Research candidate only: removing a factor requires an independently proved ex-date.

 No runtime consumer calls this function. Already-normalized input is a numerical no-op;
 changed units or an unexpected factor fail closed instead of applying the repair twice.
 """
 result=copy.deepcopy(rows)
 before=max(d for d in rows if d<boundary)
 q0,a0=rows[before]['close'],rows[before]['adjusted']
 q1,a1=rows[boundary]['close'],rows[boundary]['adjusted']
 if not all(math.isfinite(v)and v>0 for v in [q0,a0,q1,a1,amount])or amount>=q0:
  raise ValueError('Invalid candidate adjustment units')
 observed=(a1/q1)/(a0/q0);expected=1/(1-amount/q0)
 if math.isclose(observed,1,rel_tol=1e-6,abs_tol=1e-8):return result
 if not math.isclose(observed,expected,rel_tol=1e-6,abs_tol=1e-8):
  raise ValueError('Candidate factor not independently identified in this capture')
 for day,row in result.items():
  if day<boundary:row['adjusted']*=observed
  row['factor']=row['adjusted']/row['close']
 return result

def investigate():
 folder=REPORT/'preuves/autonomie-commune';documents=[]
 for year,amount,date in [(2023,'0.2214','01/02/2024'),(2024,'1.2623','08/08/2024')]:
  path=folder/f'hsbc-distributions-{year}.bin.gz';text=pdf_text(path)
  rows=[r for r in text.splitlines()if 'IE00B4K6B022'in r and amount in r and date in r]
  if len(rows)!=1:raise ValueError('Exact share distribution row missing or ambiguous')
  if not re.search(r'IE00B4K6B022\s+H0011-0002\s+31/12/'+str(year)+r'\s+EUR\b',text):raise ValueError('Exact share reporting currency not qualified')
  documents.append({'reportingYear':year,'isin':'IE00B4K6B022','currency':'EUR','distributionDate':date,'dateKind':'distribution date in tax report; ex-date not explicitly labelled','amount':float(amount),'evidence':str(path.relative_to(REPORT)),'uncompressedSha256':hashlib.sha256(gzip.decompress(path.read_bytes())).hexdigest()})
 original=ROOT/'reports/reliquat-79-2026-10-23/preuves/marches-originaux/etfIE00B4K6B022.json.gz'
 data=json.loads(gzip.decompress(original.read_bytes()))['1d']['chart']['result'][0]
 rows={dt.datetime.fromtimestamp(t,dt.timezone.utc).strftime('%Y-%m-%d'):{'close':close,'adjusted':adj,'factor':adj/close if close and adj else None}for t,close,adj in zip(data['timestamp'],data['indicators']['quote'][0]['close'],data['indicators']['adjclose'][0]['adjclose'])}
 start,end=rows['2023-12-29'],rows['2024-12-31'];before,after=rows['2024-07-31'],rows['2024-08-01']
 old=end['adjusted']/start['adjusted'];observed=after['factor']/before['factor'];predicted=1/(1-1.2623/before['close']);counterfactual=old/observed
 candidates={}
 for boundary in ['2024-08-01','2024-08-08']:
  candidate=candidate_without_factor(rows,boundary,1.2623)
  repeated=candidate_without_factor(candidate,boundary,1.2623)
  value=(candidate['2024-12-31']['adjusted']/candidate['2023-12-29']['adjusted']-1)*100
  candidates[boundary]={'returnPct':value,'residualVsRoundedNavPp':value-11.6,'idempotent':candidate==repeated,'appliedInProduction':False,'qualified':False}
 events=[{'date':dt.datetime.fromtimestamp(v['date'],dt.timezone.utc).strftime('%Y-%m-%d'),'amount':v['amount']}for v in data.get('events',{}).get('dividends',{}).values()if 2024==dt.datetime.fromtimestamp(v['date'],dt.timezone.utc).year]
 return {'case':'financial:IE00B4K6B022/2024','evidenceLevel':'Documents officiels réellement téléchargés localement ; calcul sur la réponse originale préservée. Pas nouvelle collecte GitHub ni série de remplacement.','documents':documents,'originalMarketEvidence':str(original.relative_to(ROOT)),'providerEvents2024':events,'officialDistributionTotalEUR':sum(r['amount']for r in documents),'providerDistributionTotalEUR':sum(r['amount']for r in events),'beforeExtraAdjustment':before,'afterExtraAdjustment':after,'observedExtraAdjustmentFactor':observed,'factorPredictedByUnlisted12623Dividend':predicted,'factorDifference':observed-predicted,'oldReturnPct':(old-1)*100,'counterfactualWithoutExtraAdjustmentPct':(counterfactual-1)*100,'extraAdjustmentEffectPp':(old-counterfactual)*100,'officialCalendarNavPct':11.6,'remainingResidualPp':(counterfactual-1)*100-11.6,'candidateRemovals':candidates,'officialDateInterpretation':'The tax table labels a distribution date; notes define payment date, but the table does not explicitly label an ex-date. Public Euronext notices name both August 1 and August 8. Cancellation/replacement of the earlier notice is unproven.', 'causeClosed':False,'seriesRepaired':False,'runtimeQualificationChanged':False,'finding':'Deux sauts ajustés reproduisent chacun 1,2623 EUR, aux 01/08 et 08/08. Le rapport fiscal indique une distribution au 08/08 sans libeller explicitement le détachement. Les résumés publics Euronext mentionnent les deux dates ; l’annulation/remplacement du premier avis reste à prouver. Retrait hypothétique du saut du 08/08 : 11,599027 %, résidu -0,000973 point face au NAV arrondi 11,6 %. Le retrait du 01/08 publié précédemment laisse +0,121920 point. Ces deux hypothèses sont idempotentes sur la capture mais aucune ne prouve encore la date exacte à corriger.','missing':'Preuve officielle du détachement 2024 et qualification de la série Price du portail émetteur ; qualifier les clôtures de valorisation et dernières transactions (51,04 EUR Euronext contre 51,41 EUR Yahoo au 31/12), les bornes NAV quotidiennes et la convention de réinvestissement ; le résidu ne démontre pas une erreur NAV.'}
if __name__=='__main__':
 result=investigate();path=REPORT/'preuves/autonomie-commune/hsbc-ajustement-2024.json';path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:result[k]for k in ['case','observedExtraAdjustmentFactor','factorPredictedByUnlisted12623Dividend','extraAdjustmentEffectPp','remainingResidualPp','causeClosed']},ensure_ascii=False))
