"""Reconciled international perimeter, diagnostic counts and exhaustive equity exports."""
import collections,csv,datetime as dt,io,json,pathlib,re,subprocess
from data_automation import UTC
from ai_equity_diagnostics import category
ROOT=pathlib.Path(__file__).resolve().parents[1]
FOLDER=ROOT/'data/ai-portfolios'
REGIONS=json.loads((ROOT/'src/pages/ai-portfolios/market-regions.json').read_text())
MIC_REGION={mic:region for region,mics in REGIONS.items() for mic in mics}

def write(path,data):
 path.parent.mkdir(parents=True,exist_ok=True);tmp=path.with_suffix(path.suffix+'.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n');tmp.replace(path)
def export_csv(path,rows,columns):
 stream=io.StringIO();w=csv.DictWriter(stream,fieldnames=columns,extrasaction='ignore',lineterminator='\n');w.writeheader();w.writerows({k:json.dumps(v,ensure_ascii=False) if isinstance(v,(dict,list)) else v for k,v in r.items()} for r in rows);path.write_text(stream.getvalue())
def totals(rows):
 equities=[r for r in rows if r.get('instrumentType')=='EQUITY' or r.get('shareType') in ['ordinary','depositary-receipt','REIT']]
 return {'companiesByOfficialLabel':len({r.get('companyId') for r in equities if r.get('companyId')}),'companiesWithVerifiedCIK':len({r.get('cik') for r in equities if r.get('cik')}),'companyEquivalenceUnresolvedAcrossVenues':sum(not r.get('isin') and not r.get('cik') for r in equities),'companiesUnresolved':sum(not r.get('companyId') for r in equities),'equityListingCandidates':len(equities),'instruments':len({r['instrumentId'] for r in rows}),'listings':len(rows),'tested':sum(bool(r.get('lastAttempt')) for r in rows),'qualifiedInstruments':len({r['instrumentId'] for r in rows if r['status']=='qualified'}),'qualifiedListings':sum(r['status']=='qualified' for r in rows),'selectableInstruments':len({r['instrumentId'] for r in rows if r['selectorPresent']}),'selectableListings':sum(r['selectorPresent'] for r in rows),**{s:sum(r['status']==s for r in rows) for s in ['temporary-failure','excluded','blocked','unprocessed']}}
def normalize_name(s):
 return re.sub(r'[^a-z0-9]','',re.sub(r'\b(plc|limited|ltd|inc|corporation|corp|group)\b','',s.lower()))
def main():
 sources=json.loads((FOLDER/'equity-scope/sources.json').read_text());qualification=json.loads((FOLDER/'qualification.json').read_text());baseline_path=FOLDER/'equity-scope/baseline.json'
 if not baseline_path.exists():
  old=json.loads(subprocess.check_output(['git','show','1eb2b8f3603a44cf32e6162fdcaf5443a8f172a0:data/ai-portfolios/qualification.json'],cwd=ROOT));write(baseline_path,{'commit':'1eb2b8f3603a44cf32e6162fdcaf5443a8f172a0','rows':[{'id':r['id'],'instrumentId':r['instrumentId'],'status':r['status'],'instrumentType':r.get('instrumentType'),'reason':r['reason'],'mic':r.get('mic')} for r in old['candidates']]})
 baseline=json.loads(baseline_path.read_text())['rows'];baseline_by={r['id']:r for r in baseline};known={r['id'] for r in baseline};known_instruments={r['instrumentId'] for r in baseline};initial={r['instrumentId'] for r in baseline if r['status']=='qualified' and r.get('instrumentType')=='EQUITY'}
 rows=[]
 for r in qualification['candidates']:
  if not r.get('directorySources') and r.get('instrumentType')!='EQUITY':continue
  region=MIC_REGION.get(r.get('mic'),'Autres marchés')
  rows.append({**r,'marketRegion':region,'withinStockScope':region in REGIONS,'company':r.get('company') or r['name'],'shareType':r.get('shareType') or 'legacy-equity','errorCategory':category(r),'selectorPresent':r['status']=='qualified' and r.get('instrumentType')=='EQUITY' and (r.get('shareType') or 'legacy-equity') in ['ordinary','depositary-receipt','REIT','legacy-equity'] and not r.get('leveraged',False) and not r.get('selectionBlock') and region in REGIONS,'minimumUseDate':r.get('coverageFrom'),'knownBefore':r['instrumentId'] in known_instruments,'baselineStatus':baseline_by.get(r['id'],{}).get('status'),'newListing':r['id'] not in known})
 now=dt.datetime.now(UTC).isoformat();selected=[r for r in rows if r['selectorPresent'] and r.get('shareType') in ['ordinary','depositary-receipt','REIT','legacy-equity']]
 simple=[];grouped=collections.defaultdict(list)
 for r in selected:grouped[r['instrumentId']].append(r)
 for key in sorted(grouped):
  choices=sorted(grouped[key],key=lambda r:(r.get('currency')!='EUR',r.get('mic') not in ['XNAS','XNYS','XASE','XTKS','XASX','XTAI'],r['id']))
  simple.append({**choices[0],'alternativeListingIds':[r['id'] for r in choices[1:]]})
 report={'version':1,'generatedAt':now,'baselineQualifiedEquities':len(initial),'currentQualifiedEquities':len({r['instrumentId'] for r in selected}),'additionalQualifiedEquities':len({r['instrumentId'] for r in selected}-initial),'lostBaselineQualifiedEquities':sorted(initial-{r['instrumentId'] for r in selected}),'totals':totals(rows),'markets':{},'sources':[],'diagnostics':dict(collections.Counter(r['errorCategory'] for r in rows)),'initialFailuresByCause':dict(collections.Counter(category(r) for r in baseline if r['status']=='temporary-failure')),'companyCountingLimit':'Company counts group exact official issuer labels, not globally resolved LEIs; classes and listings remain separate. Market countries are not inferred as company domicile.'}
 current_by={r['id']:r for r in qualification['candidates']}
 report['stockScope']=list(REGIONS)
 report['activeStockScope']=totals([r for r in rows if r['withinStockScope'] and r['shareType'] in ['ordinary','depositary-receipt','REIT','legacy-equity']])
 report['regions']={region:totals([r for r in rows if r['marketRegion']==region]) for region in [*REGIONS,'Autres marchés']}
 report['baselineOutsideCurrentScope']=sorted({r['instrumentId'] for r in rows if r['instrumentId'] in initial and not r['withinStockScope']})
 report['baselineReview']={s:{'before':sum(r['status']==s for r in baseline),'after':dict(collections.Counter(current_by.get(r['id'],{}).get('status','missing-from-inventory') for r in baseline if r['status']==s))} for s in ['qualified','temporary-failure','excluded','blocked']}
 report['securityTypes']={t:totals([r for r in rows if r['shareType']==t]) for t in sorted({r['shareType'] for r in rows})}
 for mic in sorted({r.get('mic') or 'unknown' for r in rows}):
  group=[r for r in rows if (r.get('mic') or 'unknown')==mic];report['markets'][mic]={**totals(group),'knownInstrumentsBefore':len({r['instrumentId'] for r in group if r['knownBefore']}),'newInstruments':len({r['instrumentId'] for r in group if not r['knownBefore']}),'knownBefore':sum(r['knownBefore'] for r in group),'knownListingsBefore':sum(not r['newListing'] for r in group),'newListings':sum(r['newListing'] for r in group)}
 for s in sources['sources']:
  group=[r for r in rows if s['id'] in r.get('directorySources',[]) or s.get('scope')=='security-classification' and r.get('identityClassSourceUrl')==s['url']];report['sources'].append({**s,'coverage':totals(group),'knownInstrumentsBefore':len({r['instrumentId'] for r in group if r['knownBefore']}),'newInstruments':len({r['instrumentId'] for r in group if not r['knownBefore']}),'knownBefore':sum(r['knownBefore'] for r in group),'knownListingsBefore':sum(not r['newListing'] for r in group),'newListings':sum(r['newListing'] for r in group)})
 refs=json.loads((FOLDER/'equity-scope/references.json').read_text())['memberships'];report['indexChecks']=[]
 by_name=collections.defaultdict(list);by_ticker=collections.defaultdict(list)
 for r in rows:
  by_name[normalize_name(r.get('company') or r['name'])].append(r)
  if r.get('mic') in ['XNAS','XNYS','XASE']:by_ticker[r.get('ticker')].append(r)
 for source in [s for s in sources['sources'] if s['scope']=='reference-index']:
  members=[r for r in refs if r['sourceId']==source['id']];matched=[]
  for member in members:
   listings=by_ticker.get(member.get('ticker'),[]) if member.get('ticker') else []
   if not member.get('ticker'):
    listings=by_name.get(normalize_name(member['company']),[])
   qualified=any(r['selectorPresent'] for r in listings)
   matched.append({**member,'listingIds':[r['id'] for r in listings],'qualified':qualified,'status':'qualified' if qualified else 'blocked','reason':'Cotation qualifiée dans le périmètre actif.' if qualified else 'Identités retrouvées mais aucune cotation admissible qualifiée ; consulter leurs motifs.' if listings else 'Nom présent dans la composition complète ; classe, ticker et cotation actuels non documentés. Ce contrôle ne crée aucun instrument supposé.'})
  report['indexChecks'].append({'sourceId':source['id'],'status':source['status'],'expected':source.get('totalRows'),'found':sum(bool(r['listingIds']) for r in matched),'qualified':sum(r['qualified'] for r in matched),'members':matched})
 columns=['company','companyId','cik','legalCompanyName','companyIdentitySource','name','instrumentId','id','isin','shareClass','shareType','family','instrumentType','convention','ticker','symbol','mic','operatingMic','segmentMic','micConvention','marketRegion','withinStockScope','country','listingCountry','currency','sourceCurrency','observedSourceCurrency','priceScale','timezone','calendar','sourceId','directorySources','sourceUrl','sourceAsOf','checkedAt','identityClassSourceUrl','identityClassSourceAsOf','identityReviewedAt','issuerClassificationProof','dailySourceUrl','coverageFrom','coverageThrough','lastSuccess','lastAttempt','status','errorCategory','reason','selectionBlock','selectorPresent','minimumUseDate','earliestQualificationDate','providerFirstTradeDate','knownBefore','baselineStatus']
 write(FOLDER/'equity-catalogue.json',{'version':1,'generatedAt':now,'rows':[{k:r.get(k) for k in columns} for r in rows]});export_csv(FOLDER/'equity-catalogue.csv',rows,columns)
 write(FOLDER/'selectable-equities.json',{'version':1,'generatedAt':now,'instrumentCount':len({r['instrumentId'] for r in selected}),'instruments':[{**{k:r.get(k) for k in columns},'alternativeListingIds':r['alternativeListingIds']} for r in simple],'qualifiedListingCount':len(selected)});export_csv(FOLDER/'selectable-equities.csv',simple,columns)
 extra=[r for r in qualification['candidates'] if r['status']=='qualified' and not r.get('selectionBlock') and not r.get('leveraged') and (r.get('instrumentType') in ['ETC','ETN','ETP','CRYPTOCURRENCY'] or r.get('instrumentType')=='ETF' and r.get('ucits'))]
 assets=selected+extra
 write(FOLDER/'selectable-assets.json',{'version':1,'generatedAt':now,'stockScope':list(REGIONS),'instrumentCount':len({r['instrumentId'] for r in assets}),'listingCount':len(assets),'listings':[{k:r.get(k) for k in columns} for r in assets]});export_csv(FOLDER/'selectable-assets.csv',assets,columns)
 report['otherQualifiedFamilies']={t:{'instruments':len({r['instrumentId'] for r in extra if r['instrumentType']==t}),'listings':sum(r['instrumentType']==t for r in extra)} for t in ['ETF','ETC','ETN','ETP','CRYPTOCURRENCY']}
 access_path=FOLDER/'equity-scope/access-diagnostics.json'
 report['accessDiagnostics']=json.loads(access_path.read_text())['attempts'] if access_path.exists() else []
 lines=['# Actions internationales — Portefeuilles IA','',f'Généré : {now}',f"Actions qualifiées : {report['currentQualifiedEquities']} ; référence avant chantier : {len(initial)} ; nouveaux instruments qualifiés : {report['additionalQualifiedEquities']}.",'',report['companyCountingLimit'],'','Le dénominateur est chaque fichier officiel daté réellement obtenu. Les pages d’accueil, principaux poids et fiches synthétiques ne sont pas des compositions complètes. Une source bloquée conserve un dénominateur inconnu, jamais zéro. Londres est une photographie historique 2020 : ses nouvelles identités restent bloquées en attendant une preuve actuelle.','', '| Marché | Cotations | Instruments | Connus | Nouveaux | Testés | Qualifiés | Sélectionnables | Temporaires | Exclus | Bloqués | Non traités |','|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|']
 for mic,c in report['markets'].items():lines.append('| '+mic+' | '+' | '.join(str(c[k]) for k in ['listings','instruments','knownBefore','newListings','tested','qualifiedListings','selectableListings','temporary-failure','excluded','blocked','unprocessed'])+' |')
 active=report['activeStockScope']
 regional=['','## Périmètre actif : Europe · Asie · USA','','Les zones désignent les places de cotation, pas l’exposition économique ni le domicile supposé des sociétés. Les autres marchés inventoriés restent auditables ; ils ne sont pas ajoutés aux actions autorisées des nouvelles compétitions. Les compétitions existantes conservent leurs règles.',f"Périmètre actions : {active['instruments']} instruments/classes distincts, {active['listings']} cotations candidates ; {active['tested']} testées, {active['selectableInstruments']} instruments sélectionnables, {active['temporary-failure']} échecs temporaires, {active['excluded']} exclusions, {active['blocked']} blocages, {active['unprocessed']} non traitées.",'Les comptes par zone peuvent se chevaucher pour une même classe cotée sur plusieurs marchés ; le total global déduplique ces cotations.','','| Zone | Cotations actions candidates | Cotations testées, tous types | Actions sélectionnables (classes distinctes) | Cotations sélectionnables |','|---|---:|---:|---:|---:|']
 for region in REGIONS:
  c=report['regions'][region];regional.append(f"| {region} | {c['equityListingCandidates']} | {c['tested']} | {c['selectableInstruments']} | {c['selectableListings']} |")
 lines[5:5]=regional+['']
 lines+=['','## ETF, crypto et matières premières','', 'Les ETF UCITS restent disponibles. Les cryptos au comptant et les ETC/ETN/ETP qualifiés sont admis séparément dans les nouvelles compétitions ; un ETC n’est pas présenté comme un ETF UCITS. Les matières premières sont suivies par leur produit coté exact, sans inventer une détention physique. Les règles des compétitions déjà lancées restent archivées.','']+[f"- {t} : {c['instruments']} instruments, {c['listings']} cotations." for t,c in report['otherQualifiedFamilies'].items()]
 lines+=['','## Sources et dénominateurs','']
 for s in report['sources']:lines.append(f"- [{s['label']}]({s['url']}) — {s['status']} ; date source {s.get('sourceAsOf') or 'non publiée'} ; lignes du fichier {s.get('totalRows') if s.get('totalRows') is not None else 'inconnu'} ; {s.get('reason') or 'fichier intégral parcouru'}.")
 lines+=['','## Vérifications des accès bloqués','']+[f"- {r['url']} — HTTP {r.get('httpStatus','non reçu')}, vérifié {r['at']}, {r.get('error') or r.get('interpretation')} ; empreinte {r.get('sha256','absente')}." for r in report['accessDiagnostics']]
 lines+=['','## Causes des échecs','']+[f'- {k} : {v}' for k,v in report['diagnostics'].items()]
 lines+=['','## Réexamen du registre initial','']+[f"- {s} : {v['before']} avant ; après : {json.dumps(v['after'],ensure_ascii=False)}." for s,v in report['baselineReview'].items()]
 report['benchmarkDiagnostics']=[{k:r.get(k) for k in ['id','isin','ticker','mic','currency','status','reason','lastAttempt','lastSuccess','coverageThrough','dailySourceUrl']} for r in qualification['candidates'] if r.get('isin') in ['IE00B4L5Y983','IE00B53SZB19']]
 write(FOLDER/'equity-coverage.json',report)
 lines+=['','## Références World et Nasdaq-100','']+[f"- {r['id']} : {r['status']} — {r['reason']} (couverture {r.get('coverageThrough') or 'absente'}, tentative {r.get('lastAttempt') or 'aucune'})." for r in report['benchmarkDiagnostics']]
 lines+=['','## Reprise','', '`python scripts/discover_ai_equities.py --refresh` actualise les listes. `python scripts/qualify_ai_portfolios.py --mode remaining` traite tous les candidats sans tentative ; `--mode retry` reprend les échecs. `--time-budget 2400` permet une sortie avec sauvegarde sans plafonner le périmètre ; les candidats restants gardent leur statut non traité. La requalification n’actualise aucune décision et ne remplace aucune cotation déjà utilisée.','', 'Les clôtures ajustées Yahoo et les changes BCE restent nécessaires à la sélection. Les jours non cotés et délais sont contrôlés ; aucune séance manquante n’est interpolée. Les points nuls du 21 octobre pour World / Nasdaq ont été reproduits lors du diagnostic sur une fenêtre courte indépendante et les deux hôtes ; des réponses ultérieures peuvent compléter la publication. Les statuts ci-dessus donnent le résultat réel de la dernière validation. Une NAV émetteur ou un indice ne remplace pas leur cotation exacte.']
 (FOLDER/'equity-coverage.md').write_text('\n'.join(lines)+'\n')
 assert sum(v['listings'] for v in report['markets'].values())==len(rows)
 assert len({r['id'] for r in rows})==len(rows)
 assert all(r['id'] in current_by for r in baseline),'An initial candidate disappeared from the inventory'
 assert sum(report['totals'][s] for s in ['qualifiedListings','temporary-failure','excluded','blocked','unprocessed'])==len(rows)
 print(json.dumps({k:report[k] for k in ['baselineQualifiedEquities','currentQualifiedEquities','additionalQualifiedEquities','totals']},ensure_ascii=False))
if __name__=='__main__':main()
