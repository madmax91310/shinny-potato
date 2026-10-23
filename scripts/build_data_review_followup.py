"""Reconcile every initial review dimension, preserving duplicates across different contracts."""
import re,io,collections,csv,datetime as dt,gzip,json,pathlib,subprocess,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'reports/data-review-2026-10-23';P=OUT/'preuves'

def read(path):return json.loads(path.read_text())
def zipped(name):return json.loads(gzip.decompress((P/name).read_bytes()))
def rowkey(r):return ':'.join(str(r.get(k,'')) for k in ['type','id','field'])
def main():
    baseline_path=OUT/'reprise/suivi-avant-apres.csv.initial.gz'
    baseline=list(csv.DictReader(io.StringIO(gzip.decompress(baseline_path.read_bytes()).decode('utf-8-sig')),delimiter=';')) if baseline_path.exists() else []
    snapshots='--from-snapshots' in sys.argv
    review_after=zipped('review-final.json.gz') if snapshots else json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {buildReview} from './src/pages/data-review/lib.js';console.log(JSON.stringify(buildReview('2026-10-23')));"],cwd=ROOT))
    initial=zipped('inventory-initial.json.gz');now=zipped('inventory-final.json.gz') if snapshots else read(ROOT/'public/data/data-automation-inventory.json')
    review_before=zipped('review-initial.json.gz')
    before_coverage=zipped('asset-field-coverage-initial.json.gz');after_coverage=zipped('asset-field-coverage-final.json.gz') if snapshots else read(ROOT/'public/data/asset-field-coverage.json')
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
        add('comparaison financière',r['id'],r['initialStatus'],r['status'],r['reason']+' '+(r.get('currentConsumer')or{}).get('secured',''),'preuves/financial-final-observation.json.gz ; reconciliation-financiere.csv ; reprise/admissions-financieres.json',r['isin'],str(r['year']),'Calculateur | Performance depuis | Classements | Duels', ' | '.join(r['sourceUrls']),r.get('missingPiece')or'Cause déjà documentée ; conserver les preuves originales.',category='cause non expliquée'if r['open']else'correction prouvée, résidu non attribué'if r.get('residualOpen')else'cause déjà qualifiée')
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
    final_monitor=read(P/'automation-status-latest.json') if (P/'automation-status-latest.json').exists() else zipped('automation-status-final.json.gz')
    previous_monitor=final_monitor
    resumed=OUT/'reprise/automation-status-reprise.json'
    if resumed.exists():final_monitor=read(resumed)
    stability=read(P/'dws-stability-preview.json') if (P/'dws-stability-preview.json').exists() else {}
    stable_keys={r['key'] for r in stability.get('resolved',[])}
    monitor_union={**previous_monitor['monitoring']['active'],**final_monitor['monitoring']['active']}
    resolved_now={r['id']:r for r in final_monitor['monitoring']['resolved']}
    for key,b in monitor_union.items():
        after='corrigé dans la PR, intégration attendue'if any(x in key for x in fixed)else'blocage conservé'
        proof='preuves/automation-status-final.json.gz ; network-executions.json'
        if 'anniversary-nasdaq100' in key and (P/'publication-observation.json.gz').exists():
            result=zipped('publication-final-observation.json.gz') if (P/'publication-final-observation.json.gz').exists() else zipped('publication-observation.json.gz')
            if not result.get('errors') and result.get('successes'):after='corrigé et vérifié depuis GitHub, intégration attendue'
            elif not result.get('errors') and result.get('waiting'):after='attente normale de publication vérifiée depuis GitHub ; dernière clôture conservée sans revalidation'
        if key.startswith('radar:') and any('etf.dws.com' in u for u in b.get('sourceUrls',[])) and (P/'dws-observation.json.gz').exists():
            result=zipped('dws-final-observation.json.gz') if (P/'dws-final-observation.json.gz').exists() else zipped('dws-observation.json.gz')
            if not result.get('errors') and len(result.get('verified',[]))==result.get('candidateCount',0)>0:
                after='photographie courante recoupée depuis GitHub ; conflit historique et contrôle de stabilité conservés'
                proof+=' ; preuves/dws-country-revisions.json.gz ; preuves/radar-current-conflicts.json ; preuves/dws-final-observation.json.gz'
                if any(k in b.get('cause','') for k in stable_keys):
                    after='réconciliation stable préparée en lecture seule ; publication ordinaire attendue'
                elif stability:
                    after='valeurs recoupées ; nouveau document, quatre heures de stabilité encore requises'
                proof+=' ; preuves/dws-stability-preview.json ; preuves/dws-later-document-changes.json'
        if key not in final_monitor['monitoring']['active']:
            resolved=resolved_now.get(key)
            after='résolu par le producteur ordinaire, preuve datée' if resolved else 'absent du moniteur courant ; résolution non prouvée'
            proof='reprise/automation-status-reprise.json'
            if resolved:proof+=' ; resolvedAt='+str(resolved.get('resolvedAt'))
        add('incident actif au contrôle final',key,'actif dans le moniteur de production',after,b.get('cause',''),proof,b.get('dataId',b.get('name','')),b.get('field',''),action='Le producteur et son moniteur de production restent inchangés avant intégration ; voir la preuve isolée et le reliquat documenté.')
    if (P/'holdings-ishares-promoted.json').exists():
        proof=read(P/'holdings-ishares-promoted.json')
        add('incident révélé par la CI',proof['id'],'composant holdings absent dans une réponse du fournisseur',f"collecte GitHub validée ; photographie {proof['beforeAsOf']} → {proof['asOf']}",
            'Une réponse incomplète conserve les dernières données valides. Reprise bornée uniquement après identité exacte confirmée ; aucune erreur financière ou identité incorrecte n’est réessayée comme une panne transitoire. Ancien JSON incident absent : cause fournisseur non attribuée rétroactivement.',
            'preuves/holdings-ishares-observation.json.gz ; preuves/holdings-ishares-promoted.json ; network-executions.json',proof['id'],'completeHoldings','/le-dca-de',action='Collecteur et reprise validés ; conserver les futures erreurs individuelles si les deux tentatives restent incomplètes.')
    if (P/'sector-fallback/qualification.json').exists():
        proof=read(P/'sector-fallback/qualification.json')
        add('incident révélé par la CI',proof['isin']+':sectors-primary','répartition sectorielle primaire invalide : douze zéros',
            'secteurs du 22/10 qualifiés depuis les positions intégrales ; panne primaire conservée',
            '504/504 positions et compteur officiel à même date ; somme 99.99996 %, avec liquidités et dérivés signés. Contrôle de couverture et arrondis à cinq décimales ; aucune renormalisation.',
            'preuves/sector-fallback/qualification.json ; network-executions.json',proof['isin'],'sectors','/comparatif-etf | /le-dca-de',action='Conserver le signal de la table primaire invalide, même lorsque la voie intégrale qualifiée rend la donnée utilisable.')
    add('validation CI','projections-dca','catalogue de test antérieur au snapshot compilé','projections DCA exactes du build transférées aux jobs navigateur',
        'Le contrôle strict des dates HSBC a révélé une projection source non transférée, sans erreur du site compilé. Nouveau transport validated-dca-projections ; aucune assertion de date assouplie.',
        'preuves/ci-browser-projection-mismatch.log.gz ; .github/workflows/deploy-pages.yml',field='artefacts de validation',action='Vérifier le nouveau run de CI de la tête finale de la PR.')
    if (P/'ai-final23-execution.json.gz').exists():
        add('contrôle de séance ultérieure','IE00B4L5Y983-ETFP:2026-10-23','séance du 23/10 terminée à Milan','attente normale de l’arrêté J−1 UTC',
            'Le contrat IA collecte jusqu’à la veille UTC, avec marge de clôture de deux heures. Le contrôle GitHub après clôture réutilise les prix du 22/10 sans nouvelle requête ni renouvellement du dernier contrôle. Aucune observation du 23 inventée ; la séance sera requise au prochain arrêté.',
            'preuves/ai-final23-orchestration.json ; network-executions.json','IE00B4L5Y983-ETFP','daily','/portefeuilles-ia',action='Collecte ordinaire ou rattrapage lors de l’arrêté suivant ; ne pas élargir la convention financière à une valorisation intrajournalière.')
    if (P/'ai-png-verification.json').exists():
        add('validation CI','ai-png-intermittent','délai de téléchargement PNG dépassé','deux rejeux GitHub complets réussis ; cause initiale non attribuée',
            'Délai et assertions conservés ; traces navigateur et capture ajoutées en cas de récidive. Parcours propriétaire isolé, aucun changement du portefeuille réel.',
            'preuves/ai-png-verification.json','IA','export PNG','/portefeuilles-ia',action='Conserver et diagnostiquer toute récidive ; un rejeu réussi ne démontre pas la cause initiale.')
    if (P/'vaneck-dk-qualification.json').exists():
        add('incident révélé par la CI','IE00BDFBTQ78:factsheet-route','routes document UCITS/NL/UK redirigées vers accueil US','route officielle DK qualifiée depuis GitHub',
            'Identité GDIG, devise USD, sept années et capitalisation recoupées ; NAV et conversion BCE inchangées. Route supplémentaire limitée à gdig-fact-sheet.pdf, autres documents inchangés.',
            'preuves/vaneck-dk-qualification.json ; preuves/vaneck-dk-evidence.zip','IE00BDFBTQ78','official-nav','Calculateur | Performance depuis | Classements | Duels',source='https://www.vaneck.com/dk/en/library/fact-sheets/gdig-fact-sheet.pdf')
    if (P/'msci-transport-recheck.json').exists():
        for ident in ['msciWorld','msciEmerging']:
            add('incident révélé par la CI','anniversary-'+ident+':transport','délai de lecture MSCI dépassé','relecture officielle GitHub réussie ; registre identique',
                'Reprises bornées existantes conservées. Variante GRTR USD et date du 22/10 validées ; ni valeur ni horodatage canonique renouvelés artificiellement.',
                'preuves/msci-transport-recheck.json ; preuves/msci-transport-evidence.zip',ident,'latestLevel','Calculateur | Performance depuis | Classements | Duels',action='Panne transitoire recoupée, disponibilité future non garantie.')
    if (P/'module-role-review.json').exists():
        for r in read(P/'module-role-review.json'):
            add('rôle de module actuel',r['path'],r['beforeRole'],r['afterRole'],r['reason'],
                'preuves/module-role-review.json ; preuves/module-role-controls.json',r['path'],'rôle du registre',action='Qualification limitée au rôle ; dates financières, états consommateurs et restrictions strictement conservés.')
    vaneck_report=ROOT/'reports/vaneck-nav-remainder-2026-10-23'
    if vaneck_report.exists():
        add('incident révélé par la CI','IE00BQQP9F84:2017-calendar','candidat NAV GDX non admis','désaccord 2017 conservé ; ancienne voie qualifiée préservée',
            'NAV quotidienne officielle 11.6563573883 %, calendrier 11.6 %, précision publiée 0.1 point : tolérance 0.05 dépassée. Aucun seuil modifié ni année supprimée.',
            'reports/vaneck-nav-remainder-2026-10-23/LIVRAISON.md ; reports/vaneck-nav-remainder-2026-10-23/github/nav.json','IE00BQQP9F84','annual-2017','Calculateur | Performance depuis | Classements | Duels',action='Explication officielle des bornes/conventions 2017 nécessaire avant admission de cette voie candidate.')
        add('validation CI','gdig-independent-pdf-probe','sonde PDF basculant sur API après intégration master','branche documentaire explicitement imposée à la sonde indépendante',
            'Le producteur normal conserve la nouvelle API qualifiée de #899. La sonde d’archive retire seulement navCalendarSource de sa copie de configuration pour vérifier réellement le PDF ; assertion de provenance inchangée.',
            '.github/workflows/verify-data-review.yml ; network-executions.json','IE00BDFBTQ78','qualification PDF',action='Résultat GitHub de la sonde indépendante consigné séparément de celui de la voie API active.')
    # Keep all 201 legacy follow-up lines and all 115 module qualification records.
    with (ROOT/'reports/reliquat-2026-10-23/restant-a-verifier.csv').open(encoding='utf-8-sig')as f:legacy=list(csv.DictReader(f,delimiter=';'))
    legacy_source=vaneck_report/'etat-79/restant-a-verifier.csv' if vaneck_report.exists() else ROOT/'reports/reliquat-79-2026-10-23/restant-a-verifier.csv'
    with legacy_source.open(encoding='utf-8-sig')as f:updated_legacy={(r['type'],r['id']):r for r in csv.DictReader(f,delimiter=';')}
    for i,b in enumerate(legacy):
        n=updated_legacy.get((b['type'],b['id']),b)
        add('reliquat historique initial',str(i)+':'+b['id'],b['statut'],n['statut'],n['motif']+' '+n.get('suivi_mission_79',''),str(legacy_source.relative_to(ROOT))+' ; '+n['preuve'],b['id'],b['type'],action=n['action'])
    with (ROOT/'reports/reliquat-2026-10-23/modules-verification.csv').open(encoding='utf-8-sig')as f:modules=list(csv.DictReader(f,delimiter=';'))
    for b in modules:
        add('module qualifié',b['module'],b['statut'],'scénarios rejoués ; branches externes non certifiées globalement',b['reliquat'],'preuves/tests-python-initial.log.gz ; preuves/tests-corum.log.gz ; network-executions.json',b['module'],b['role_actuel'],action='Vérification réseau limitée aux sources et branches explicitement présentes dans les artefacts GitHub. Les anciennes mesures de couverture ne sont pas une recertification actuelle.')
    with (OUT/'statut-19-actions.csv').open(encoding='utf-8-sig')as f:actions=list(csv.DictReader(f,delimiter=';'))
    for i,b in enumerate(actions):
        ident=next(iter(b.values()));add('action historique',ident,b['statut_avant'],b['statut_apres'],b['complement_cette_intervention'],'LIVRAISON.md ; network-executions.json',ident,action='Voir les cas individuels et leurs causes restantes.')
    activity=read(ROOT/'src/data/automated-presentation-actors.json').get('tudigo',{}).get('activity',{})
    if activity.get('status')=='ceased':
        for r in rows:
            if r['dimension']=='usage requis initial' and r['id']=='actor:tudigo':
                r.update(apres='archived',classe='archive',motif='Anciennes conditions conservées à leur date ; avis officiel de cessation qualifié séparément.',preuve='preuves/tudigo-activity.json ; scripts/fixtures/presentation-actors/tudigo-cessation-20261023.html',action_reliquat='Aucune nouvelle souscription présentée ; suivi des investissements existants selon l’avis, transfert et récupération non établis.')
        add('incident révélé par la CI','actor:tudigo:activity','ancienne page tarifaire remplacée ; collecte refusée','cessation qualifiée depuis GitHub ; anciennes conditions archivées',
            'Deux routes officielles servent le même avis. Jugement du 12/10 distinct du contrôle du 23/10 ; aucune nouvelle offre, aucun transfert effectif ni remboursement déduit.',
            'preuves/tudigo-activity.json ; scripts/fixtures/presentation-actors/tudigo-cessation-20261023.html','actor:tudigo','activity','Présentations',activity.get('sourceUrl',''),action='Conserver la cessation si la source échoue ; une réouverture exige une qualification explicite.')
    if (OUT/'reprise/story-data-parity.json').exists():
        add('validation reprise','tweet-bank-route-budget','échec du budget après intégration de #904','build réussi, budget inchangé',
            'Contenus éditoriaux statiques séparés en JSON. Égalité profonde des trois récits, textes, sources et dates ; règles éditoriales et contrôle des empreintes inchangés. Les échecs de plusieurs workflows proviennent du même budget.',
            'reprise/story-data-parity.json ; reprise/build-master-904-json.log.gz ; reprise/browser-stories-master-904.log.gz',field='build et données éditoriales',action='Préserver les récits concurrents et leurs règles de validation.')
        add('validation reprise','performance-unavailable-link','support sans fenêtre annuelle pouvant retomber sur un autre actif','indisponibilité explicite, aucun export substitué',
            'Les routes Performance et Calculateur vérifient le support exact avant de monter le moteur. Aucun actif de remplacement ni écrasement des préférences pour un identifiant inconnu. Les calendriers VL distincts et les mois récents compatibles restent admis selon leur contrat.',
            'reprise/browser-links-qualified.log.gz',field='contrat de lien consommateur',tools='/performance-depuis | /calculateur-investissement',action='Conserver le refus si aucune observation compatible n’est publiée.')
        add('validation reprise','qualified-history-selection','sélections préparées et preuve IA proposaient la totalité d’un historique contenant des fenêtres refusées','périodes continues qualifiées proposées ; demandes incompatibles refusées',
            'Les dates par défaut et les suggestions utilisent une vraie intersection continue qualifiée. Une modification manuelle reste contrôlée. Le rapport IA distingue observations brutes et plages utilisables ; les calculs sont recoupés avec les observations exactes et le change.',
            'reprise/ai-reuse-qualified.log.gz ; reprise/browser-ai-reuse-qualified.log.gz ; reprise/browser-rankings-qualified.log.gz ; docs/ai-tools-matrix.json',field='sélections et contrats consommateurs',tools='Calculateur | Classements | Portefeuilles IA',action='Conserver les restrictions financières et les données sources ; ne jamais franchir un trou de qualification.')
        add('validation reprise','anniversary-valid-horizon','recette anniversaire supposant un horizon continu jusqu’au maximum','chaque horizon choisi appartient aux options réellement qualifiées',
            'Les horizons et comparaisons sont pris dans les ensembles admissibles exacts. Les protections de dates et de conventions restent inchangées ; 709 exports réels ont été contrôlés localement.',
            'reprise/anniversary-art-qualified.log.gz',field='validation des exports',tools='Anniversaire',action='Ne pas confondre ancienneté maximale et admissibilité de tous les horizons intermédiaires.')
        add('validation reprise','ai-confirmation-lifecycle','recette du producteur IA échouée lors du remplacement du lien de confirmation','ancien lien masqué immédiatement ; mesure sur le lien attaché et stylé',
            'Le producteur 40032904711 échoue en lisant un style vide lors du remplacement du lien. La préparation masque désormais le lien précédent avant la génération asynchrone du nouveau. La recette lit le nœud courant dans une tâche navigateur atomique et conserve le seuil de contraste 4,5. Aucun livre réel modifié.',
            'reprise/gha-ai-confirmation-failure.log.gz ; reprise/owner-confirmation-3.log.gz ; reprise/owner-confirmation-4.log.gz',field='interface et validation du producteur ordinaire',tools='Portefeuilles IA',action='Vérification GitHub du nouveau commit requise ; ne pas annoncer le producteur réussi avant son rejeu complet.')
        add('validation reprise','ai-retained-png-download','producteur 40035153798 : aucun téléchargement après le clic dans un onglet conservé','exports existants conservés ; clics de recette cadencés et fichier exact vérifié',
            'Le téléchargement après la rafale échoue aussi avec un lien natif : les traces GitHub montrent onze clics reçus, sans erreur JavaScript ni requête de module manquante. La tentative native ne résout donc pas ce cas ; le moteur d’export de #901 est conservé. Les activations de recette sont espacées de 200 ms pour respecter la protection anti-rafale de Chromium. Tous les PNG restent testés, anciens modules coupés, avec comparaison octet par octet à l’aperçu modifié et sans augmenter le délai d’attente.',
            'reprise/gha-ai-retained-png-failure.log.gz ; reprise/gha-ai-native-png-failure.log.gz ; reprise/png-paced-verified.log.gz',field='image et export après déploiement',tools='Portefeuilles IA',action='Nouvelle validation GitHub du producteur et du build ; ne pas assimiler le succès local à sa résolution en production.')
    source_path=OUT/'reprise/source-results.json'
    if source_path.exists():
        latest=read(source_path)
        attempts={}
        for error in latest['scopes']['holdings-retry']['observation']['errors']:
            attempts[error['id'].split(':')[-1]]=(error['error'],latest['scopes']['holdings-retry']['execution']['startedAt'])
        for isin,observation in latest['scopes']['discovery']['observation']['observations'].items():
            if observation.get('error'):attempts[isin]=(observation['error'],observation.get('lastAttemptAt') or latest['scopes']['discovery']['execution']['startedAt'])
        for r in rows:
            if r['champ'] not in ['completeHoldings','Composition complète','Positions intégrales']:continue
            for isin,(error,attempted_at) in attempts.items():
                if isin not in r['id'] and isin not in r['cle']:continue
                r['motif']+=' Dernier rejeu GitHub : '+error
                r['preuve']+=' ; reprise/source-results.json'
                urls=list(dict.fromkeys(re.findall(r'https://[^"\\\s]+',error)))
                if urls:r['routes_essayees']=' | '.join(u+' => refus de transport dans GitHub' for u in urls)
                r['dernier_controle_acces']=attempted_at
    # Never delete an initial follow-up line when current catalogue dimensions change.
    current_keys={(r['dimension'],r['cle']) for r in rows}
    for old in baseline:
        if (old['dimension'],old['cle']) not in current_keys:rows.append(old)
    for r in rows:
        for k,v in r.items():
            if isinstance(v,(list,dict)):r[k]=json.dumps(v,ensure_ascii=False)
    keys=collections.Counter((r['dimension'],r['cle'])for r in rows)
    duplicates={str(k):v for k,v in keys.items()if v>1}
    assert not duplicates,duplicates
    with (OUT/'suivi-avant-apres.csv').open('w',encoding='utf-8-sig',newline='')as f:
        writer=csv.DictWriter(f,fieldnames=list(rows[0]),delimiter=';');writer.writeheader();writer.writerows(rows)
    counters={'dimensions':dict(collections.Counter(r['dimension']for r in rows)),'before':initial['summary'],'after':now['summary'],'reviewBefore':dict(collections.Counter(r['category']for r in review_before['items'])),'reviewAfter':dict(collections.Counter(r['category']for r in review_after['items'])),'financial':financial['summary'],'monitorActiveInitial':len(monitor['monitoring']['active']),'monitorActiveFinal':len(final_monitor['monitoring']['active']),'productionMonitorManuallyChanged':False,'missingInitialCoverageRows':sum(k not in new_cov for k in old_cov),'newCoverageRows':sum(k not in old_cov for k in new_cov)}
    assert counters['missingInitialCoverageRows']==0
    counters['reprise']={'initialRowsPreserved':len(baseline),'missingInitialRows':sum((r['dimension'],r['cle']) not in keys for r in baseline),'currentActiveSignals':len(final_monitor['monitoring']['active']),'resolvedSincePreviousControl':sum(k in resolved_now for k in previous_monitor['monitoring']['active'] if k not in final_monitor['monitoring']['active'])}
    assert counters['reprise']['missingInitialRows']==0
    counters['dwsReadOnlyReconciliation']={'prepared':stability.get('resolvedCount',0),'productionWritten':False,'proof':'preuves/dws-stability-preview.json'}
    (OUT/'bilan.json').write_text(json.dumps(counters,ensure_ascii=False,indent=2)+'\n')
    for name,value in [('review-final',review_after),('inventory-final',now),('asset-field-coverage-final',after_coverage)]:
        (P/(name+'.json.gz')).write_bytes(gzip.compress(json.dumps(value,ensure_ascii=False).encode(),mtime=0))
    print(json.dumps({k:counters[k]for k in ['dimensions','reviewBefore','reviewAfter','financial','monitorActiveInitial','missingInitialCoverageRows']},ensure_ascii=False))
if __name__=='__main__':main()
