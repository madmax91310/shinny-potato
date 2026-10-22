"""Reconcile all original modules and the 81 remaining probes without conflating fixtures and network."""
import ast,csv,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1];P=ROOT/'reports/corrections-2026-10-22';original=P
modules=list(csv.DictReader(open(original/'inventaire-initial-modules.csv',encoding='utf-8-sig'),delimiter=';'));remaining={r['id']for r in csv.DictReader(open(original/'modules-a-verifier-initial.csv',encoding='utf-8-sig'),delimiter=';')if r['type']=='module'};coverage=json.load(open(P/'preuves/couverture-modules.json'))['files']
network={
'collect_economic_data.py':'insee-corrige.json', 'refresh_monthly_history.py':'historiques-recollectes.json',
'collect_ranking_sources.py':'cotations-alternatives-qualifiees.json', 'collect_amundi_etf.py':'nav-recollectes.json',
'collect_etf_pilot.py':'nav-recollectes.json','collect_qualified_exposures.py':'nav-recollectes.json',
'collect_exposure_expansion.py':'nav-recollectes.json','collect_non_bond_expansion.py':'nav-recollectes.json',
'refresh_additional_etf.py':'nav-recollectes.json','collect_vaneck_etf.py':'nav-recollectes.json',
'collect_vaneck_allocations.py':'nav-recollectes.json','collect_invesco_etf.py':'nav-recollectes.json',
'collect_ssga_etf.py':'nav-recollectes.json','collect_bnp_etf.py':'nav-recollectes.json','collect_document_etf.py':'nav-recollectes.json',
'collect_public_issuer.py':'nav-recollectes.json','collect_lg_api.py':'nav-recollectes.json',
'collect_dws_etf.py':'dws-recollecte.json','verify_dws_compositions.py':'dws-recollecte.json',
'collect_dca_complete_holdings.py':'positions-appliquees.json','collect_physical_holdings.py':'positions-appliquees.json',
'collect_wisdomtree_holdings.py':'positions-appliquees.json','collect_scpi.py':'scpi-recollecte.json',
'collect_practical_sheets.py':'practical-gold-recollecte.json','update-investor-13f.py':'collecte-13f.json',
'collect_broker_tariffs.py':'courtiers-recollecte.json','broker_document_sources.py':'courtiers-recollecte.json',
'broker_profiles.py':'courtiers-recollecte.json','broker_tariff_extensions.py':'courtiers-recollecte.json',
'collect_instrument_metadata.py':'pea-recollecte.json','qualify_ai_portfolios.py':'ai-35-preuves.json',
'collect_ai_portfolios.py':'ai-35-preuves.json','data_automation.py':'historiques-recollectes.json',
'collect_ai_security_classifications.py':'sec-classifications-reel.json','collect_vanguard_sleeves.py':'vanguard-underliers-reels.json','collect_ishares_german.py':'ishares-german-reel.json','probe_live_data_connections.py':'sonde-positions-directe.json','collect_corum.py':'scpi-recollecte.json','collect_extended_scpi.py':'scpi-recollecte.json','collect_atland_scpi.py':'scpi-recollecte.json',
'issuer_documents.py':'nav-recollectes.json','market_transport.py':'historiques-recollectes.json',
}
ci=json.load(open(P/'preuves/controles-ci.json'))
passed_commands=[r['command']for r in ci if r['exitCode']==0]
local_proofs={
 'check-pages-head.mjs':('preuves/tests-python.log','Exécuté par test_pages_head.py via check-pages-head.sh, avec historiques Git et serveur HTTP isolés.'),
 'smoke-data-routes.mjs':('preuves/navigateur-routes-final.log','Point d’entrée réellement exécuté sur toutes les routes du build local ; pas une collecte fournisseur.'),
 'review_ai_provider_types.py':('preuves/provider-taxonomy-isole.json','Onze candidats examinés par l’entrée réelle en répertoire isolé ; onze refus pour cache daté absent, aucun appel réseau et aucune admission.'),
}
limitations={
 'publish-editorial-radar.mjs':'Entrée externe non exécutée : elle enverrait des notifications. Moteurs Radar et contrats workflow testés séparément ; envoi réel non vérifié.',
 'probe_automation_lots.py':'Sonde de découverte ancienne non relancée intégralement : nombreuses URL déjà mutualisées dans les collectes de cette mission. Ses branches de découverte et son manifeste restent non vérifiés.',
 'review_ai_provider_types.py':'Entrée exécutée dans /tmp/corrections-provider-types, sans toucher les décisions de production. Voir provider-taxonomy-isole.json ; accès fournisseur seulement pour les appels effectivement listés.',
}
rows=[]
for r in modules:
 name=r['collecteur'];path=ROOT/name;source=path.read_text()if path.exists()else'';c=coverage.get(name,{})
 calls=[];has_main=False
 if path.suffix=='.py' and source:
  tree=ast.parse(source);calls=[n.func.id if isinstance(n.func,ast.Name)else n.func.attr if isinstance(n.func,ast.Attribute)else'' for n in ast.walk(tree)if isinstance(n,ast.Call)];has_main="if __name__"in source
 direct=sorted(set(calls)&{'urlopen','download','get_json','get_text','public_page','fetch_api','fetch_query','chart_response','read_answer'})
 role='collecteur réseau'if direct else'orchestrateur'if has_main or path.suffix=='.mjs'else'auxiliaire'
 tests=[str(p.relative_to(ROOT))for p in (ROOT/'scripts').glob('test*')if p.is_file()and p.suffix in ['.py','.mjs']and (path.stem in p.read_text()or path.name in p.read_text())]
 node_tests=[test for test in tests if test.endswith('.mjs')and any(test in command for command in passed_commands)]
 proof=network.get(path.name);summary=c.get('summary',{});hits=summary.get('covered_lines',0)
 status='exécution réelle sur les branches citées'if proof else'scénarios locaux exécutés ; réseau non recertifié'if hits else'non vérifié individuellement dans cette correction'
 if node_tests and not proof:status='scénarios Node exécutés ; réseau non recertifié'
 if role=='auxiliaire'and hits and not proof:status='auxiliaire exercé par les tests ; branches non couvertes conservées'
 local=local_proofs.get(path.name)
 if local and not proof:status='scénario local réellement exécuté ; pas une collecte fournisseur'
 rows.append({'module':name,'role_initial':r['role'],'role_actuel':role,'reliquat_initial_81':name in remaining,'appels_transport':','.join(direct),'statut':status,'preuve_reseau':f'preuves/{proof}'if proof else'', 'preuve_scenario':local[0]if local else'', 'detail_scenario':local[1]if local else'', 'lignes_executees_tests':hits,'lignes_executables':summary.get('num_statements',0),'branches_manquantes':summary.get('missing_branches',0),'tests_lies':' | '.join(tests),'tests_node_executees':' | '.join(node_tests),'reliquat':limitations.get(path.name)or('Les branches, sources et cas non cités restent non vérifiés en réseau. Une couverture de tests locale ne certifie ni accès source ni données actuelles.'if not proof else'Qualification limitée aux parts/champs exécutés ; autres branches et fournisseurs non recertifiés.')})
assert len(rows)==115 and sum(r['reliquat_initial_81']for r in rows)==81
with open(P/'modules-verification.csv','w',encoding='utf-8-sig',newline='')as f:
 w=csv.DictWriter(f,fieldnames=rows[0].keys(),delimiter=';');w.writeheader();w.writerows(rows)
summary={'inventaire_modules':len(rows),'reliquat_initial':81,'reliquat_initial_avec_exec_reelle_citee':sum(r['reliquat_initial_81']and bool(r['preuve_reseau'])for r in rows),'reliquat_initial_avec_tests_python':sum(r['reliquat_initial_81']and r['lignes_executees_tests']>0 for r in rows),'reliquat_initial_avec_scenarios_locaux':sum(r['reliquat_initial_81']and bool(r['lignes_executees_tests']or r['tests_node_executees']or r['preuve_scenario'])for r in rows),'sans_nouvelle_preuve_reseau':sum(r['reliquat_initial_81']and not r['preuve_reseau']for r in rows),'sans_exec_locale_ou_reseau_citee':sum(r['reliquat_initial_81']and not r['preuve_reseau']and not r['lignes_executees_tests']and not r['tests_node_executees']and not r['preuve_scenario']for r in rows)}
(P/'bilan-modules.json').write_text(json.dumps(summary,indent=2)+'\n');print(summary)
