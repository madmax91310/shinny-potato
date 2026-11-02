"""Record precise newer publication evidence without rewriting the failed run or UI snapshot."""
import csv,gzip,io,pathlib,json,sys
csv.field_size_limit(8000000);root=pathlib.Path(sys.argv[1]);proof='preuves/reprise-2026-11-02/etf-41395321887-verified-publication.json';target='publication:deploy-pages.yml';extra=['resolution_publication_2nov','preuve_resolution_publication_2nov','distinction_trace_active_2nov'];counts={}
for name in ['suivi-consolide.csv.gz','restant-a-verifier.csv.gz','perimetre-initial-complet.csv.gz','causes-consolidees.csv.gz','preuves/reprise-2026-11-02/reconciliation-diagnostics-2nov.csv.gz']:
 p=root/name;raw=gzip.decompress(p.read_bytes());reader=csv.DictReader(io.StringIO(raw.decode('utf-8-sig')),delimiter=';');fields=list(reader.fieldnames);rows=list(reader);fields +=[x for x in extra if x not in fields];count=0
 for r in rows:
  keys=[r.get(k,'')for k in ['id','diagnostic_id','diagnostic_id_2nov','diagnostic_id_1nov']]
  try:keys+=json.loads(r.get('identites_exactes','[]'))
  except ValueError:pass
  if target not in keys:continue
  r.update(resolution_publication_2nov='Publication du code et des quatre fichiers producteurs prouvée sur414bd67, contrôle natif06:58:35UTC ; le run41395321703 reste historiquement refusé pour nouvel identifiant non encore validé.',preuve_resolution_publication_2nov=proof,distinction_trace_active_2nov='La photographie exportée conserve cette alerte dans la boîte active ; la preuve plus récente démontre le besoin publié, sans transformer l’ancien run en succès ni clôturer les autres erreurs fournisseur.');count+=1
 s=io.StringIO(newline='');w=csv.DictWriter(s,fields,delimiter=';',lineterminator='\n');w.writeheader();w.writerows(rows);p.write_bytes(gzip.compress(s.getvalue().encode('utf-8-sig'),mtime=0));counts[name]=count
print(json.dumps({'identity':target,'rowsWithScopedNewEvidence':counts,'oldFailedRunPreserved':True}))
