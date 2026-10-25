"""One exhaustive data/use view of the consolidated follow-up, never a supplier certificate."""
import argparse,calendar,collections,csv,datetime as dt,hashlib,json,math,pathlib,re,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[1]
REPORT=ROOT/'reports/donnees-consolidees-2026-10-24'
NON_LIVE={'reference','editorial','archive','simulation'}
def day(value):
 try:
  s=str(value)
  if re.fullmatch(r'\d{4}',s):return dt.date(int(s),12,31)
  if re.fullmatch(r'\d{4}-Q[1-4]',s):return dt.date(int(s[:4]),int(s[-1])*3,calendar.monthrange(int(s[:4]),int(s[-1])*3)[1])
  if re.fullmatch(r'\d{4}-\d{2}',s):return dt.date(int(s[:4]),int(s[5:]),calendar.monthrange(int(s[:4]),int(s[5:]))[1])
  return dt.date.fromisoformat(s[:10])
 except (TypeError,ValueError):return None

def producer_contracts_at_runs(monitor):
 contracts={};cache={}
 for workflow,state in monitor.get('workflows',{}).items():
  sha=state.get('headSha')
  if not isinstance(sha,str)or not re.fullmatch('[a-f0-9]{40}',sha):continue
  if sha not in cache:
   try:cache[sha]=json.loads(subprocess.check_output(['git','show',sha+':scripts/validated-data-producers.json'],cwd=ROOT,stderr=subprocess.DEVNULL,text=True))
   except(subprocess.CalledProcessError,ValueError):cache[sha]={}
  contracts[workflow]=cache[sha].get(workflow,[])
 return contracts

def field_value_present(record,field,kind):
 if not isinstance(record,dict):return False
 def finite(v):return isinstance(v,(int,float))and not isinstance(v,bool)and math.isfinite(v)
 def value(v):
  if finite(v)or isinstance(v,bool):return True
  if isinstance(v,str):return bool(v.strip())
  if isinstance(v,list):
   if len(v)>=2 and isinstance(v[0],str)and not isinstance(v[1],(dict,list)):return finite(v[1])
   return bool(v)and any(value(x)for x in v if not isinstance(x,str))
  if isinstance(v,dict):return any(value(v[k])for k in ['value','amount','rows','points','years','return','weightPct','weight','shares','marketValue']if k in v)
  return False
 if kind=='history':return isinstance(record.get('points'),list)and len(record['points'])>=2 and all(isinstance(p,list)and len(p)>=2 and finite(p[1])for p in record['points'])
 facts=record.get('facts')or{};characteristics=record.get('characteristics')or{}
 if field=='count':return finite(facts.get('constituents'))
 if field=='fees':return isinstance(record.get('fees'),dict)and any(finite(v)for v in record['fees'].values())
 if field=='euro':return value([f.get('years')for f in record.get('euroFunds',[])])
 if field=='holdings'and isinstance(record.get('data'),dict):return value((record['data'].get('snapshot')or{}).get('holdings'))
 candidates=[record.get(field),facts.get(field),characteristics.get(field)]
 if field=='ter':candidates.append(characteristics.get('terPct'))
 return any(value(v)for v in candidates)

def diagnostic_category(required, kind, field, raw, reasons, failures):
 """Separate demonstrated operational failures from a missing proof join."""
 if not required or kind in NON_LIVE:return 'non applicable'
 if failures:return 'défaut réel de donnée ou de collecte'
 if raw.get('requiresConnection') or field.get('state') in {'unconnected','not-connected','manual','manual-live'}:
  return 'raccordement manquant'
 if not reasons:return 'opérationnel démontré'
 # Unknown identity/convention is a financial qualification block, not a network outage.
 return 'preuve documentaire ou qualification incomplète'

def scoped_failures(state, identities, field):
 result=[]
 for key, proof in (state.get('dataFailures') or {}).items():
  if not isinstance(proof,dict):continue
  explicit=proof.get('field')
  matched=any(key in {i+':'+field,i+'|'+field,i+':'+field+':qualification'} for i in identities)
  # Instrument-wide report failures stay instrument-wide unless a field is explicit.
  matched=matched or (explicit==field and any(key.endswith('-'+i)for i in identities))
  if matched:result.append({'id':key,'cause':proof.get('cause'),'runUrl':proof.get('runUrl'),'field':explicit})
 return result

def matrix(inventory,monitor,manifest,today,root=ROOT,producer_contracts=None):
 producer_contracts=producer_contracts_at_runs(monitor)if producer_contracts is None else producer_contracts
 registries={r['path']:r for r in inventory['registries']};policy=json.loads((root/'src/data/freshness-policy.json').read_text())['fields']
 rawfields={(f['id'],f['fieldIndex']):f for f in inventory['fields']}
 assets={a['id']:a for a in [*inventory['assets'],*inventory['consumerUsage'].get('externalAssets',[])]}
 wanted=set(assets)|{a.split(':')[-1]for a in assets}|{f['sourceIdentity']for a in assets.values()for f in a['fields']if f.get('sourceIdentity')}
 sources={};records={};hashes={}
 for path,digest in manifest.get('files',{}).items():
  p=root/path
  if path.startswith('public/data/')and not path.startswith('public/data/investors/'):continue  # Inventories and supervision cannot certify their own claims.
  if not path.endswith('.json')or not p.is_file():continue
  b=p.read_bytes();hashes[path]=hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==digest
  if not hashes[path]:continue
  try:document=json.loads(b)
  except (ValueError,UnicodeDecodeError):continue
  sources[path]=document
  def index(node):
   if isinstance(node,dict):
    for k,v in node.items():
     if k in wanted and isinstance(v,dict):records.setdefault(k,[]).append((path,v))
    for k in ['id','isin','slug','seriesId']:
     if isinstance(node.get(k),str)and node[k]in wanted:records.setdefault(node[k],[]).append((path,node))
    for v in node.values():
     if isinstance(v,(dict,list)):index(v)
   elif isinstance(node,list):
    for v in node:
     if isinstance(v,(dict,list)):index(v)
  index(document)
  for id in assets:
   short=id.split(':')[-1]
   if short==p.stem or(short!=''and p.stem.endswith('-'+short)):records.setdefault(id,[]).append((path,document))
 rows=[]
 for tool in inventory['consumerUsage']['tools']:
  for usage in tool['rows']:
   asset=assets[usage['id']];f=next(f for f in asset['fields']if f['key']==usage['key']);raw=rawfields.get((asset['id'],int(f['key'].split(':')[1])),{})if f['key'].startswith('catalog:')else{}
   registry=f.get('registry')or raw.get('registry');r=registries.get(registry,{})
   field=(f.get('coverageReference')or{}).get('field')or f['key'].split(':',1)[-1];kind=f.get('kind');required=usage['required']
   if kind=='coverage':kind='history'if field in ['monthly','performance','returns']else'live'
   policykey=('etf.ter'if field=='ter'or'Frais annuels'in f['label']else'etf.performance'if field=='performance'else'series.monthly'if kind=='history'else'index.facts'if asset['type']=='index'else'etf.default'if asset['type']=='instrument'else'product.annual'if asset['type']in ['insurance','scpi']and'annuel'in f['label'].lower()else'product.default'if asset['type']in ['insurance','scpi','actor']else'investor.13f'if asset['type']=='investor'else None)
   if field in ['domicile','replicationMethod']:policykey='etf.staticCharacteristic'
   if field in ['pea','distribution','currencyHedge','listings']:policykey='etf.characteristic'
   policykey=f.get('freshnessPolicyKey')or policykey
   if asset['type']=='index'and field=='returns':policykey='index.returns'
   contract=f.get('freshnessContract')or policy.get(policykey,{})
   urls=f.get('sourceUrls',[]);checked=f.get('checkedAt');asof=f.get('asOf')or raw.get('asOf');date=day(checked)
   candidates=records.get(f.get('sourceIdentity'),[])or records.get(asset['id'],[])or records.get(asset['id'].split(':')[-1],[])
   # A whole multi-asset file cannot stand in for an unidentified instrument.
   match=None;matching=[]
   for path,record in candidates:
    text=json.dumps(record,ensure_ascii=False)
    if urls and any(u in text for u in urls)and checked and str(checked)[:10]in text:matching.append((path,record))
   def owners(path):return [w for w,paths in producer_contracts.items()if any(path==p or path.startswith(p.rstrip('/')+'/')for p in paths)]
   def scoped_control(state):
    ids={asset['id'],asset['id'].split(':')[-1],f.get('sourceIdentity')};ids.discard(None)
    keys={i+separator+k for i in ids for separator in [':','|']for k in [field,f['key']]}
    if asset['type']=='index':
     if field in ['countries','sectors','top10','count','companies']:keys.update('index-'+i+'-composition'for i in ids)
     if field in ['returns','performance']:keys.update('index-'+i+'-returns'for i in ids)
    checks=state.get('sourceChecks')
    if not isinstance(checks,dict):return False
    for key,proof in checks.items():
     if not isinstance(proof,dict):continue
     if key not in keys or key.startswith('qualification:'):continue
     evidence=proof.get('evidence')or{}
     if not isinstance(evidence,dict):continue
     if 'qualification'in str(evidence.get('file','')).lower()or proof.get('sourceAttempted')is False:continue
     if date and day(proof.get('checkedAt'))==date:return True
    return False
   def source_proof(path):return [(w,m)for w in owners(path)if (m:=monitor.get('workflows',{}).get(w,{}))and scoped_control(m)and all(m.get(k)=='success'for k in ['collectionStatus','validationStatus','recordingStatus'])and(m.get('publicationReceipt')or{}).get('files',{}).get(path)==manifest.get('files',{}).get(path)and m.get('lastCollectionSuccessAt')and date and day(m['lastCollectionSuccessAt'])==date]
   match=next((r for r in matching if field_value_present(r[1],field,kind)and source_proof(r[0])),matching[0]if matching else None)
   if match and not asof:
    rec=match[1];asof=rec.get('periodEnd')or rec.get('asOf')or(rec.get('snapshot')or{}).get('asOf')
    if not asof and isinstance(rec.get('points'),list)and rec['points']:asof=rec['points'][-1][0]
   workflows=[w['path'].split('/')[-1]for w in f.get('workflows',[])]or[path.split('/')[-1]for path in r.get('upstreamWorkflows',[])]
   writers=registries.get(match[0],{}).get('writers',[])if match else[]
   source_workflows=(owners(match[0])if match else[])or[w.split('/')[-1]for w in writers]or workflows
   observed=[(w,monitor.get('workflows',{}).get(w,{}))for w in source_workflows]
   sourceproof=source_proof(match[0])if match else[]
   unit=f.get('unit')or f.get('currency')or('%'if any(s in f['label']for s in ['(%)','Pays','Secteurs','Positions'])else None)
   categorical={'pea','distribution','currencyHedge','replicationMethod','domicile','benchmark','listings'}
   if not unit and field in categorical:unit='sans unité : caractéristique/identifiant'
   if not unit:unit={'Éligibilité au PEA':'sans unité : statut','Indice suivi':'sans unité : identité','Nombre de positions hors liquidités et dérivés':'nombre','Nombre de titres':'nombre','Volatilité annualisée sur 3 ans':'% annualisé','Cours / actif net comptable selon l’émetteur':'ratio','PER du portefeuille selon l’émetteur':'ratio','Rendement des distributions sur 12 mois':'%','Taux d’occupation financier':'%','Duration effective':'années','Maturité moyenne pondérée':'années','Rendement actuariel moyen (YTM/YTW)':'%','Locataires':'nombre','Immeubles':'nombre','Actifs immobiliers':'nombre'}.get(f['label'])
   reason=[]
   if not unit:reason.append('Unité ou caractère catégoriel du champ à qualifier dans ce contrat')
   if f['state']not in ['connected','scheduled-evidence']:reason.append(f.get('reason')or f.get('nextAction')or f['state'])
   if raw.get('requiresConnection'):reason.append(raw.get('missingReason')or'Chiffre vivant non raccordé au collecteur')
   if match and not field_value_present(match[1],field,kind):reason.append('Valeur du champ effectivement présente dans le registre publié non démontrée')
   if not match:reason.append('Registre source publié correspondant à cette identité, cette URL et cette date non démontré')
   if match and not owners(match[0]):reason.append('Producteur propriétaire du registre non démontré dans les versions exécutées')
   if not sourceproof:reason.append('Contrôle source ciblé sur ce champ non démontré ; une réussite globale ou une reprise annuaires ne certifie pas les autres champs')
   if not contract:reason.append('Contrat de fraîcheur par usage à qualifier')
   elif not date or date>today or(today-date).days>contract.get('checkDays',7):reason.append('Contrôle source absent, futur ou trop ancien selon le contrat')
   observeddate=day(asof+'-01'if f.get('freshnessPolicyKey')=='purchasing.smic'and re.fullmatch(r'\d{4}-\d{2}',str(asof))else asof)
   if kind=='history'and not observeddate:reason.append('Dernière période réelle de la série non démontrée')
   if observeddate and contract.get('dataDays')and(today-observeddate).days>contract['dataDays']:reason.append('Observation plus ancienne que la politique existante ; aucune tolérance augmentée')
   if observeddate and observeddate>today:reason.append('Période future à qualifier')
   nonlive=not required or kind in NON_LIVE
   state='non applicable'if nonlive else'B'if reason else'A'
   proofs=[f"public/data/data-automation-inventory.json#{asset['id']}/{f['key']}"]
   if match:proofs.append('public/data/publication-manifest.json#'+match[0])
   proofs.extend(m.get('runUrl','')for w,m in sourceproof if m.get('runUrl'))
   row={'id_suivi':'usage:'+tool['path']+'|'+asset['id']+'|'+f['key'],'outil':tool['name'],'route':tool['path'],'actif_identifiant':asset['id'],'nom':asset['name'],'donnee':f['label'],'cle_champ':f['key'],'nature':kind,'requise':required,'statut_consommateur_declare':f['state'],'mode_declare_du_registre':r.get('mode','non identifié'),'unite':unit or'non qualifiée (voir blocage)','devise':f.get('currency'),'methode':f.get('method'),'perimetre':f.get('scope'),'registre':registry,'registre_source_demontre':match[0]if match else None,'sources':' | '.join(urls),'collecteurs':' | '.join(dict.fromkeys([*source_workflows,*workflows])),'declenchements':' | '.join(c for w in f.get('workflows',[])for c in w.get('crons',[])),'derniere_donnee':asof,'dernier_controle_reussi':checked,'niveau_preuve_controle':'source et reçu du producteur propriétaire joints'if sourceproof else'date déclarée du registre ; contrôle source non redémontré pour ce contrat','derniere_tentative_champ':f.get('lastAttemptAt')or f.get('attemptedAt')or'non démontrée séparément du contrôle réussi','tentatives_producteur_observees':json.dumps([{'workflow':w,'createdAt':m.get('createdAt'),'runUrl':m.get('runUrl'),'portee':'producteur entier ; pas preuve d’une tentative de ce champ'}for w,m in observed],ensure_ascii=False,separators=(',',':')),'correction_proposee':(f.get('nextAction')or raw.get('nextAction')or'Qualifier la pièce précise du blocage et joindre sa preuve source, son reçu publié et son consommateur')if state=='B'else'non applicable','derniere_execution_source':max((m.get('lastCollectionSuccessAt','')for w,m in sourceproof),default=''),'politique':policykey,'controle_max_jours':contract.get('checkDays'),'observation_max_jours':contract.get('dataDays'),'validation':'Contrats communs du champ et qualification des fenêtres ; pas certification indépendante de toutes les valeurs','producteur_source_demontre':' | '.join(w for w,m in sourceproof),'valeur_champ_presente':bool(match and field_value_present(match[1],field,kind)),'enregistrement':'blob publié vérifié'if match else'non démontré','publication_mecanisme':('publication du producteur vérifiée'if all(m.get('publicationStatus')=='success'for w,m in sourceproof)else'valeurs adoptées par une publication ultérieure ; échec de tentative conservé')if sourceproof else'non démontré','publication_code':manifest.get('codeSha')or manifest.get('codeCommit')or manifest.get('sha'),'publication_donnees':manifest.get('dataSha')or manifest.get('commit')or manifest.get('sha'),'conditions_acces_reutilisation':json.dumps(raw.get('sourceConditions')or f.get('sourceConditions')or{'registre':'src/data/data-source-conditions.json','qualification':'non vérifiée pour ce contrat ; accès HTTP ≠ licence'},ensure_ascii=False,separators=(',',':')),'consommateur':f.get('consumerCode')or' | '.join(r.get('runtimeConsumers',[])),'etat':state,'blocage':' ; '.join(dict.fromkeys(reason))if not nonlive else'Archive, référence, hypothèse ou capacité non requise pour cet usage','preuve':' | '.join(proofs)}
   identities={asset['id'],asset['id'].split(':')[-1],f.get('sourceIdentity')};identities.discard(None)
   failures=[failure for workflow,state in observed for failure in scoped_failures(state,identities,field)]
   row['nature_ecart']=diagnostic_category(required,kind,f,raw,reason,failures)
   row['defauts_demontres']=json.dumps(failures,ensure_ascii=False,separators=(',',':'))
   row['portee_diagnostic']='Une lacune de preuve ne démontre pas une panne ; les défaillances non ciblées restent au niveau de leur collecte.'
   rows.append(row)
 assert len(rows)==inventory['consumerUsage']['summary']['usages']
 return rows

def main():
 p=argparse.ArgumentParser();p.add_argument('--inventory',type=pathlib.Path,default=ROOT/'public/data/data-automation-inventory.json');p.add_argument('--monitor',type=pathlib.Path,required=True);p.add_argument('--manifest',type=pathlib.Path,required=True);p.add_argument('--publication',type=pathlib.Path);p.add_argument('--source-root',type=pathlib.Path,default=ROOT);p.add_argument('--output',type=pathlib.Path,default=REPORT);a=p.parse_args();load=lambda p:json.loads(p.read_text());manifest=load(a.manifest);manifest.update(load(a.publication)if a.publication else{});rows=matrix(load(a.inventory),load(a.monitor),manifest,dt.datetime.now(dt.timezone.utc).date(),root=a.source_root);a.output.mkdir(parents=True,exist_ok=True)
 definitions={};compact=[]
 shared=['methode','perimetre','registre','registre_source_demontre','sources','collecteurs','declenchements','validation','conditions_acces_reutilisation','consommateur','tentatives_producteur_observees']
 for row in rows:
  definition={k:row[k]for k in shared};definition['consommateur']=definition['consommateur']if len(definition['consommateur'])<250 else'Graphe complet : public/data/data-automation-inventory.json#registries/'+str(row['registre'])
  key=hashlib.sha256(json.dumps(definition,sort_keys=True,ensure_ascii=False).encode()).hexdigest()[:20];definitions.setdefault(key,{'chaine':key,**definition})
  compact.append({k:v for k,v in row.items()if k not in shared}|{'chaine':key})
 scopes=collections.defaultdict(list)
 for workflow,state in load(a.monitor).get('workflows',{}).items():
  for identifier,proof in (state.get('sourceChecks')or{}).items():
   if not isinstance(proof,dict):continue
   evidence=proof.get('evidence')or{}
   key=(workflow,proof.get('runUrl'),evidence.get('sha256'),evidence.get('file'))
   scopes[key].append({'identifiant_controle':identifier,'checkedAt':proof.get('checkedAt'),'scopeRef':evidence.get('scopeRef')})
 controls=[{'workflow':key[0],'execution':key[1],'rapport_sha256':key[2],'rapport':key[3],'identifiants_controles_exacts':json.dumps(value,ensure_ascii=False,separators=(',',':')),'limite':'Périmètre observé du journal. Un identifiant global d’instrument ne certifie pas tous ses champs ; aucun champ supplémentaire déduit.'}for key,value in scopes.items()]
 for name,values in [('matrice-donnees-usages.csv',compact),('chaines-donnees.csv',list(definitions.values())),('collectes-controles.csv',controls)]:
  if not values:continue
  with(a.output/name).open('w',encoding='utf-8-sig',newline='')as f:
   w=csv.DictWriter(f,fieldnames=list(values[0]),delimiter=';');w.writeheader();w.writerows(values)

 summary={'generatedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'denominateur':'Contrats logiques de champ ou série × outil, issus des consommateurs actuels ; pas nombre de points de marché ni certification de toutes les valeurs','usages':len(rows),'outils':len({r['route']for r in rows}),'profils_identifiants_uniques':len({r['actif_identifiant']for r in rows}),'parts_isin_uniques':len({m[0]for r in rows if(m:=re.search(r'[A-Z]{2}[A-Z0-9]{9}\d',r['actif_identifiant']))}),'statuts':{state:sum(r['etat']==state for r in rows)for state in ['A','B','non applicable']},'types':dict(collections.Counter(r['nature']for r in rows)),'diagnostics':dict(collections.Counter(r['nature_ecart']for r in rows)),'limites':'B reste non résolu ; les références/hypothèses/archives ne sont pas des pannes. Les fenêtres historiques contestées restent dans les 79 cas, indépendamment de cette vue.'}
 (a.output/'matrice-bilan.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n');print(json.dumps(summary,ensure_ascii=False))
if __name__=='__main__':main()
