"""Refresh the existing consolidated view, preserving immutable original forensics."""
import pathlib,sys,json,datetime as dt,subprocess,csv
root=pathlib.Path(__file__).resolve().parents[4];sys.path.insert(0,str(root/'scripts'))
import build_consolidated_data_followup as f
out=root/'reports/donnees-consolidees-2026-10-24';load=lambda p:json.loads(gzip.decompress(pathlib.Path(str(p)+'.gz').read_bytes()) if not pathlib.Path(p).exists() else pathlib.Path(p).read_bytes())
import gzip
proof=out/'preuves/reprise-20261025'
legacy=f.read_csv(root/'reports/data-review-2026-10-23/suivi-avant-apres.csv');monitor=load(proof/'monitor.json');inventory=json.loads(gzip.decompress((proof/'inventory.json.gz').read_bytes()));review=load(proof/'review-publie.json');financial=load(proof/'financial.json')
cases=f.consolidate(legacy,inventory,financial,f.read_csv(out/'sources/reconciliation-79-ecarts.csv'),f.read_csv(out/'sources/statut-19-actions.csv'),f.read_csv(out/'sources/modules-verification.csv'),monitor,review,load(out/'corrections.json'),True,reconciliations=load(out/'rapprochements-livres.json'),previous=f.read_csv(out/'suivi-consolide.csv'))
windows=load(out/'preuves/reprise-20261025/fenetres-79-publiees.json');by={r['isin']+'/'+str(r['year']):r for r in windows['rows']}
publication=load(proof/'publication.json')
active=json.loads(subprocess.check_output(['git','show',(publication.get('dataSha')or publication['sha'])+':src/data/automated-etf-monthly.json'],cwd=root))
assert subprocess.run(['git','merge-base','--is-ancestor','4a022722185dc609df14f88de2f64210c1d40af4',publication['sha']],cwd=root).returncode==0,'The second lot is not yet served'
new={'FR0011871110','FR0011871128','FR0013416716','IE00B1XNHC34','IE00B2QWCY14','IE00B4556L06','IE00BJ5JP097','IE00BJ5JP436'}
assert sum(r['qualification']['qualified']for r in windows['rows'])>=37,'The qualified windows have not reached the published snapshot'
for c in cases:
 if not c['id_suivi'].startswith('financial:'):continue
 key=c['id_suivi'].removeprefix('financial:')
 if key not in by:continue
 w=by[key];record=active.get(w['id'],{})
 investigation=c['details'].get('investigation') or {};c['details']['investigation']=investigation
 update={'fenetre_admise_25oct':w['qualification']['qualified'],'fenetre_25oct':w['start']+' → '+w['end'],'motif_fenetre_25oct':w['qualification'].get('reason','Voie compatible qualifiée pour cette fenêtre'), 'publication_25oct':publication,'ancienne_divergence_resolue_25oct':False,'preuve_fenetre_25oct':'preuves/reprise-20261025/fenetres-79-publiees.json#'+key}
 if w['isin']in new:
  update.update(ancienne_serie_chargee_apres=False,fenetre_admise_apres=w['qualification']['qualified'],voie_active_apres={'id':w['id'],'isin':w['isin'],'basis':record.get('valuationBasis'),'currency':record.get('currency'),'sourceUrls':record.get('sourceUrls'),'periodStart':record.get('periodStart'),'periodEnd':record.get('periodEnd')},usage_securise='Voie officielle réinvestie qualifiée, distincte de la cotation originale. Calculs mensuels, Performance depuis, comparaison et classement annuel compatibles sur la fenêtre ; Il y a X ans emploie séparément les NAV hors distributions pour les parts distribuantes.',reparation_ancienne_cotation=False,nouvelle_voie_active=True,code_public_verifie=publication['sha'],donnees_publiques_verifiees=publication.get('dataSha'),preuve_nouvelle_voie='preuves/'+('amundi-reprise-20261025/gold'if w['isin']=='FR0013416716'else'amundi-reprise-20261025'if w['isin'].startswith('FR')else'ishares-reprise-20261025')+'/nav.json',preuve_consommation='preuves/reprise-20261025/consommateurs-publics.json')
  c['statut_donnees']='cause originale ouverte ; voie NAV indépendante qualifiée et publiée'
  c['niveau_preuve']='Voie distincte qualifiée et publiée ; cause de la cotation originale encore ouverte'
  c['preuves']=list(dict.fromkeys([*c['preuves'],update['preuve_fenetre_25oct'],update['preuve_nouvelle_voie'],update['preuve_consommation']]))
 investigation.update(update);c['details']['qualification_usage_25oct']=update
 if key=='IE00B4K6B022/2024':
  missing='Établir quel avis Euronext remplace ou annule l’autre (effets 01/08 et 08/08/2024), le détachement officiel exact et la convention du composant HSBC Price. Les deux corrections candidates idempotentes restent contrefactuelles, avec résidus distincts.'
  c['piece_manquante']=missing;investigation['piece_manquante_25oct']=missing;investigation['recherche_25oct']=['preuves/autonomie-commune/hsbc-ajustement-2024.json','preuves/autonomie-commune/hsbc-notices-qualification-20261025.json','preuves/autonomie-commune/hsbc-portail-qualification-20261025.json']
  c['preuves']=list(dict.fromkeys([*c['preuves'],*investigation['recherche_25oct']]))
rows=f.read_csv(out/'matrice-donnees-usages.csv');f.apply_use_contracts(cases,rows);byid={c['id_suivi']:c for c in cases}
for r in rows:
 c=byid[r['id_suivi']];c['details']['autonomie']['nature_ecart']=r.get('nature_ecart');c['details']['autonomie']['limite_interpretation']='Contrat de preuve, pas nombre de pannes ; fenêtres financières qualifiées séparément.'
metadata={'generatedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'sourceCommit':publication['sha'],'publication':publication,'inventoryGeneratedAt':inventory['generatedAt'],'monitorCheckedAt':monitor['monitoring']['checkedAt'],'productionValidated':True,'financialWindows':{'total':len(by),'qualified':sum(r['qualification']['qualified']for r in by.values()),'refused':sum(not r['qualification']['qualified']for r in by.values()),'oldFinancialCausesStillOpen':79}}
f.write_reports(cases,legacy,out,metadata)
print(metadata)
