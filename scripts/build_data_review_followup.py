"""Reconcile every initial review dimension, preserving duplicates across different contracts."""
import collections,csv,datetime as dt,gzip,json,pathlib,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'reports/data-review-2026-10-23';P=OUT/'preuves'

def read(path):return json.loads(path.read_text())
def zipped(name):return json.loads(gzip.decompress((P/name).read_bytes()))
def rowkey(r):return ':'.join(str(r.get(k,'')) for k in ['type','id','field'])
def main():
    review_after=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {buildReview} from './src/pages/data-review/lib.js';console.log(JSON.stringify(buildReview('2026-10-23')));"],cwd=ROOT))
    initial=zipped('inventory-initial.json.gz');now=read(ROOT/'public/data/data-automation-inventory.json')
    review_before=zipped('review-initial.json.gz')
    before_coverage=zipped('asset-field-coverage-initial.json.gz');after_coverage=read(ROOT/'public/data/asset-field-coverage.json')
    monitor=zipped('automation-status-initial.json.gz')
    accesses=read(ROOT/'public/data/pending-source-checks.json');source_checks=accesses['observations']
    current_connections={rowkey(r):r for r in now['connections']};initial_connections={rowkey(r):r for r in initial['connections']}
    promoted=read(P/'promotion-decisions.json');fresh_holdings={r['id'] for r in promoted if r['decision'].startswith('validated')}
    rows=[]
    def add(dimension,key,before,after,reason='',proof='',id='',field='',tools='',source='',action='',category=None):
        categories={'not-applicable':'non applicable documenté','outside-equity-scope':'hors périmètre actions, autres usages distincts','waiting-first-year':'attente normale de première année','waiting-publication':'publication suivante attendue','soon':'contrôle programmé','scheduled':'échéance future','current':'observation qualifiée conservée','connected':'raccordé','reference':'référence','archived':'archive','source-conflict':'conflit actif','collection-error':'erreur active','not-published':'publication ou périmètre manquant','connector-needed':'collecteur ou raccordement manquant','tracked-index-needed':'composition économique manquante','unqualified':'qualification manquante','manual':'preuve automatique manquante','undated':'preuve historique non datée','reserve':'réserve de qualification','blocked':'usage bloqué','unconfirmed':'usage à confirmer'}
        access=source_checks.get(id+':'+field,{})
        checked=access.get('sourceChecks',[])
        attempts=' | '.join(x['sourceUrl']+' => '+x['status'] for x in checked)
        rows.append({'dimension':dimension,'cle':key,'id':id,'champ':field,'avant':before,'apres':after,'classe':category or categories.get(after,after),'motif':reason,'preuve':proof,'sources':source,'routes_essayees':attempts,'dernier_controle_acces':access.get('lastAccessAttemptAt',''),'action_reliquat':action,'outils':tools})
    # All coverage rows, including genuinely inapplicable and waiting fields.
    old_cov={rowkey(r):r for r in before_coverage['rows']};new_cov={rowkey(r):r for r in after_coverage['rows']}
    for key,b in old_cov.items():
        n=new_cov.get(key);old=initial_connections.get(key,b);new=current_connections.get(key,n or b)
        proof='preuves/asset-field-coverage-final.json.gz'
        if b['id'] in fresh_holdings and b['field']=='completeHoldings':proof+=' ; preuves/holdings-observation.json.gz'
        add('couverture',key,old.get('actionState',b['state']),new.get('actionState',n['state'] if n else 'absent du nouvel inventaire'),new.get('reason')or b.get('reason',''),proof,b['id'],b['field'],' | '.join(new.get('tools',[])),new.get('sourceUrl')or'',new.get('nextAction',''))
    # Each initial actionable connection keeps its own source-access diagnosis.
    for b in initial['backlog']:
        key=rowkey(b);n=current_connections.get(key,b)
        add('raccordement initial',key,b['actionState'],n['actionState'],n.get('reason',''),'preuves/inventory-final.json.gz ; preuves/pending-observation.json.gz',b['id'],b['field'],' | '.join(n.get('tools',[])),n.get('sourceUrl')or'',n.get('nextAction',''))
    # Review entries that become current are still kept in the schedule.
    current_review={r['id']:r for r in review_after['schedule']+review_after['items']}
    for b in review_before['items']:
        n=current_review.get(b['id'])
        if n:after=n['category'];reason=n['reason']
        elif b['id']=='practical-source:gold':after='revue corrigée dans la PR';reason='DIC exact relu ; approbation liée au hash ; onze sources validées dans GitHub. Le moniteur de production attend intégration et collecte normale.'
        else:after='élément absent à qualifier';reason='Aucune clôture déduite de sa disparition.'
        add('revue initiale',b['id'],b['category'],after,reason,'preuves/review-final.json.gz'+(' ; revue-or.md'if'gold'in b['id']else''),b['name'],b['field'],' | '.join(b.get('tools',[])),' | '.join(b.get('urls',[])),''if after in ['soon','scheduled','current']else reason)
    # Every original financial alert is preserved, even if it was already solved.
    financial=read(ROOT/'public/data/financial-reconciliation.json')
    for r in financial['rows']:
        check=r.get('latestCheck')or{}
        add('comparaison financière',r['id'],r['status'],r['status'],r['reason'],'preuves/financial-final-observation.json.gz ; reconciliation-financiere.csv',r['isin'],str(r['year']),'Calculateur | Performance depuis | Classements | Duels', ' | '.join(r['sourceUrls']),r.get('missingPiece')or'Cause déjà documentée ; conserver les preuves originales.',category='cause non expliquée'if r['open']else'cause déjà qualifiée')
    # Required consumer contracts that were blocked/unconfirmed cannot disappear behind a healthy upstream file.
    current_usage={(t['path'],r['id'],r['key']):r for t in now['consumerUsage']['tools']for r in t['rows']}
    assets={r['id']:r for r in now['assets']}
    for tool in initial['consumerUsage']['tools']:
        for b in tool['rows']:
            if not b['required']or b['state']in ['connected','reference','not-required']:continue
            key=(tool['path'],b['id'],b['key']);n=current_usage.get(key,b)
            f=next((f for f in assets.get(b['id'],{}).get('fields',[])if f['key']==b['key']),{})
            add('usage requis initial','|'.join(key),b['state'],n['state'],f.get('reason')or f.get('statusReason')or f.get('action')or'Qualification propre au champ et à cet outil conservée ; aucun nouveau droit d’usage déduit de la collecte.', 'preuves/inventory-final.json.gz',b['id'],b['key'],tool['path'],' | '.join(f.get('sourceUrls',[])),f.get('nextAction')or'Conserver la restriction du consommateur tant que la preuve du champ ou le raccordement manque.')
    # Monitor production status is not edited by the repair branch.
    fixed=['history:fx:TWD','practical:gold','IE00B4L5Y983-ETFP']
    for key,b in monitor['monitoring']['active'].items():
        repaired=any(x in key for x in fixed)
        after='corrigé dans la PR, intégration attendue'if repaired else 'blocage conservé'
        reason=b.get('cause','')
        if 'IE00B3T9LM79'in reason or key.startswith('radar:'):reason+=' Classeur actuel validé ; ancienne capture sans empreinte, attribution complète impossible. Conservation du conflit, pas d’arrondi permissif.'
        add('incident actif initial',key,'actif en production',after,reason,b.get('runUrl','')+' ; preuves/automation-status-initial.json.gz',b.get('dataId',b.get('name','')),b.get('field',''),' | '.join(b.get('tools',[])),' | '.join(b.get('sourceUrls',[])),''if repaired else reason)
    for state in ['resolved','retired']:
        for i,b in enumerate(monitor['monitoring'][state]):
            add('incident historique '+state,str(i)+':'+b.get('id',''),state,state,b.get('cause',''),'preuves/automation-status-initial.json.gz',b.get('dataId',b.get('name','')),b.get('field',''),source=b.get('runUrl',''),category='historique résolu'if state=='resolved'else'historique retiré, pas résolution financière déduite')
    for workflow,w in monitor['workflows'].items():
        for key,b in w.get('dataFailures',{}).items():
            add('échec individuel initial',workflow+':'+key,'en échec','corrigé dans la PR, intégration attendue'if any(x in key for x in fixed)else'blocage conservé',b.get('cause',''),b.get('runUrl',''),key,b.get('field',''),action='Une étape ou une publication verte ne clôture pas cet échec individuel.')
    # Keep all 201 legacy follow-up lines and all 115 module qualification records.
    with (ROOT/'reports/reliquat-2026-10-23/restant-a-verifier.csv').open(encoding='utf-8-sig')as f:legacy=list(csv.DictReader(f,delimiter=';'))
    with (ROOT/'reports/reliquat-79-2026-10-23/restant-a-verifier.csv').open(encoding='utf-8-sig')as f:updated_legacy={(r['type'],r['id']):r for r in csv.DictReader(f,delimiter=';')}
    for i,b in enumerate(legacy):
        n=updated_legacy.get((b['type'],b['id']),b)
        add('reliquat historique initial',str(i)+':'+b['id'],b['statut'],n['statut'],n['motif']+' '+n.get('suivi_mission_79',''),'reports/reliquat-79-2026-10-23/restant-a-verifier.csv ; '+n['preuve'],b['id'],b['type'],action=n['action'])
    with (ROOT/'reports/reliquat-2026-10-23/modules-verification.csv').open(encoding='utf-8-sig')as f:modules=list(csv.DictReader(f,delimiter=';'))
    for b in modules:
        add('module qualifié',b['module'],b['statut'],'scénarios rejoués ; branches externes non certifiées globalement',b['reliquat'],'preuves/tests-python-initial.log.gz ; preuves/tests-corum.log.gz ; network-executions.json',b['module'],b['role_actuel'],action='Vérification réseau limitée aux sources et branches explicitement présentes dans les artefacts GitHub. Les anciennes mesures de couverture ne sont pas une recertification actuelle.')
    with (OUT/'statut-19-actions.csv').open(encoding='utf-8-sig')as f:actions=list(csv.DictReader(f,delimiter=';'))
    for i,b in enumerate(actions):
        ident=next(iter(b.values()));add('action historique',ident,b['statut_avant'],b['statut_apres'],b['complement_cette_intervention'],'LIVRAISON.md ; network-executions.json',ident,action='Voir les cas individuels et leurs causes restantes.')
    for r in rows:
        for k,v in r.items():
            if isinstance(v,(list,dict)):r[k]=json.dumps(v,ensure_ascii=False)
    keys=collections.Counter((r['dimension'],r['cle'])for r in rows)
    duplicates={str(k):v for k,v in keys.items()if v>1}
    assert not duplicates,duplicates
    with (OUT/'suivi-avant-apres.csv').open('w',encoding='utf-8-sig',newline='')as f:
        writer=csv.DictWriter(f,fieldnames=list(rows[0]),delimiter=';');writer.writeheader();writer.writerows(rows)
    counters={'dimensions':dict(collections.Counter(r['dimension']for r in rows)),'before':initial['summary'],'after':now['summary'],'reviewBefore':dict(collections.Counter(r['category']for r in review_before['items'])),'reviewAfter':dict(collections.Counter(r['category']for r in review_after['items'])),'financial':financial['summary'],'monitorActiveInitial':len(monitor['monitoring']['active']),'productionMonitorManuallyChanged':False,'missingInitialCoverageRows':sum(k not in new_cov for k in old_cov),'newCoverageRows':sum(k not in old_cov for k in new_cov)}
    assert counters['missingInitialCoverageRows']==0
    (OUT/'bilan.json').write_text(json.dumps(counters,ensure_ascii=False,indent=2)+'\n')
    for name,value in [('review-final',review_after),('inventory-final',now),('asset-field-coverage-final',after_coverage)]:
        (P/(name+'.json.gz')).write_bytes(gzip.compress(json.dumps(value,ensure_ascii=False).encode(),mtime=0))
    print(json.dumps({k:counters[k]for k in ['dimensions','reviewBefore','reviewAfter','financial','monitorActiveInitial','missingInitialCoverageRows']},ensure_ascii=False))
if __name__=='__main__':main()
