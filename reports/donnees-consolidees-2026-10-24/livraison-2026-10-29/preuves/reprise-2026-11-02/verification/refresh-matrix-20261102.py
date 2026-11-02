"""Append the current public declaration without losing older tracking identities.
This join is documentary; only explicitly scoped native/public/browser proofs certify usages.
"""
import csv,gzip,io,json,pathlib,collections,hashlib,sys
csv.field_size_limit(8000000)
base,capture,out=map(pathlib.Path,sys.argv[1:]);out.mkdir(parents=True,exist_ok=True)
reader=csv.DictReader(io.StringIO(gzip.decompress((base/'matrice-donnees-usages.csv.gz').read_bytes()).decode('utf-8-sig')),delimiter=';');fields=list(reader.fieldnames);rows=list(reader);old=[r['id_suivi'] for r in rows];assert len(old)==len(set(old))
inv=json.loads(gzip.decompress((capture/'data-automation-inventory.json.gz').read_bytes()));build=json.loads((capture/'build-info.json').read_text());assets={a['id']:a for a in inv['assets']};allfields={(a['id'],f['key']):f for a in inv['assets'] for f in a['fields']}
extra=['presence_usage_2nov_courant','id_declare_2nov_courant','champ_declare_2nov_courant','etat_declare_2nov_courant','requise_2nov_courant','observation_2nov_courant','controle_2nov_courant','declenchements_2nov_courant','preuve_declaration_2nov_courant','limite_declaration_2nov_courant']
fields += [x for x in extra if x not in fields]
def key(route,asset,field,label,currency):return (route,asset,field.split(':')[0],label,(currency or '').strip() if label.startswith('Cotation ') else '')
source=[];counts=collections.Counter()
for tool in inv['consumerUsage']['tools']:
 for u in tool['rows']:
  f=allfields.get((u['id'],u['key']),{});label=f.get('label',u['key']);k=key(tool['path'],u['id'],u['key'],label,f.get('currency'));counts[k]+=1;source.append((tool,u,f,label,k))
slot_proofs=pathlib.Path('/dev/shm/automation-20261101/proofs')
oldslots=json.loads((slot_proofs/'listing-slots-master-2c8a19d.json').read_text())
newslots=json.loads((capture/'listing-slots-current.json').read_text())
old_listing_slots={r['key']:r for r in oldslots['rows']};new_listing_slots={r['key']:r for r in newslots['rows']}
def listing_identity(slot):
 v=slot['value'];return tuple(v.get(k)for k in ['ticker','mic','currency','symbol'])
listing_resolved=[]
by=collections.defaultdict(list)
for r in rows:by[key(r['route'],r['actif_identifiant'],r['cle_champ'],r['donnee'],r.get('devise'))].append(r)
used=set(old);bound=[];added=[];ambiguous=[]
for r in rows:r['presence_usage_2nov_courant']='False'
for tool,u,f,label,k in source:
 native='usage:'+tool['path']+'|'+u['id']+'|'+u['key'];candidates=by[k];preferred=[r for r in candidates if r.get('presence_declaration_master_1130')=='True'];candidates=preferred or candidates
 direct_listing=False
 if len(candidates)>1 and u['id']==oldslots['isin'] and u['key']in new_listing_slots:
  assert new_listing_slots[u['key']]['label']==label and new_listing_slots[u['key']]['value']['currency']==f.get('currency')
  target=listing_identity(new_listing_slots[u['key']]);selected=[r for r in candidates if r.get('cle_champ_master_1130')in old_listing_slots and listing_identity(old_listing_slots[r['cle_champ_master_1130']])==target]
  if len(selected)==1:
   candidates=selected;direct_listing=True;listing_resolved.append({'declaredId':native,'oldTrackingId':selected[0]['id_suivi'],'exactTickerMicCurrencySymbol':target})
 if len(candidates)==1 and(counts[k]==1 or direct_listing):r=candidates[0]
 else:
  if candidates:ambiguous.append({'id':native,'field':label,'previousIds':[r['id_suivi'] for r in candidates]})
  uid=native
  if uid in used:uid+='|2nov:'+hashlib.sha256((label+'|'+str(f.get('currency'))).encode()).hexdigest()[:12]
  assert uid not in used;used.add(uid);r={x:'' for x in fields};a=assets.get(u['id'],{});required=bool(u['required']);na=not required or f.get('state') in ('not-applicable','outside-equity-scope')
  r.update(id_suivi=uid,outil=tool['name'],route=tool['path'],actif_identifiant=u['id'],nom=a.get('name',u['id']),donnee=label,cle_champ=u['key'],nature=f.get('kind','non déterminée'),requise=str(required),devise=f.get('currency') or '',derniere_donnee=f.get('asOf') or f.get('periodEnd') or '',dernier_controle_reussi=f.get('checkedAt') or '',etat='non applicable' if na else 'B — déclaration actuelle ; preuve de chaîne/usages à rapprocher',blocage='Champ non requis ou référence ; aucune panne déduite.' if na else 'Une déclaration de couverture ne certifie pas individuellement une donnée ou un calcul.',preuve='preuves/reprise-2026-11-02/public-final/data-automation-inventory.json.gz#'+u['id']+'/'+u['key'],publication_code=build['sha'],publication_donnees=build.get('dataSha',build['sha']))
  rows.append(r);added.append(uid)
 r.update(presence_usage_2nov_courant='True',id_declare_2nov_courant=native,champ_declare_2nov_courant=u['key'],etat_declare_2nov_courant=u['state'],requise_2nov_courant=str(bool(u['required'])),observation_2nov_courant=f.get('asOf') or f.get('periodEnd') or '',controle_2nov_courant=f.get('checkedAt') or '',declenchements_2nov_courant=json.dumps(f.get('workflows',[]),ensure_ascii=False,separators=(',',':')),preuve_declaration_2nov_courant='preuves/reprise-2026-11-02/public-final/data-automation-inventory.json.gz',limite_declaration_2nov_courant='Rapprochement du champ financier exact et de sa devise si cotation ; dates déclarées conservées, aucune réussite source ou certification de calcul déduite de la seule déclaration.')
 bound.append({'declaredId':native,'trackingId':r['id_suivi'],'field':label})
for r in rows:
 if r['presence_usage_2nov_courant']=='False':r['limite_declaration_2nov_courant']='Identité antérieure conservée, non rapprochée à cette déclaration ; aucune résolution ni panne déduite.'
assert old==[r['id_suivi'] for r in rows[:len(old)]];assert len(rows)==len({r['id_suivi'] for r in rows});assert len(bound)==len({r['declaredId'] for r in bound})
buf=io.StringIO(newline='');w=csv.DictWriter(buf,fields,delimiter=';',lineterminator='\n');w.writeheader();w.writerows(rows);(out/'matrice-donnees-usages.csv.gz').write_bytes(gzip.compress(buf.getvalue().encode('utf-8-sig'),mtime=0))
summary={'build':build,'oldIdentitiesPreserved':len(old),'currentDeclaredContracts':len(bound),'matrixAfter':len(rows),'newTrackingIdentities':len(added),'unmatchedOlderIdentities':sum(r['presence_usage_2nov_courant']=='False' for r in rows),'ambiguousNotReused':len(ambiguous),'previouslyAmbiguousListingsResolvedByExactQuoteIdentity':len(listing_resolved),'currentDeclarationSummary':inv['summary']['consumerUsage'],'limit':'Declarations are not individual outage or success proofs; bounded native/public/browser evidence remains separate.'};(out/'matrix-current-reconciliation.json').write_text(json.dumps({'summary':summary,'ambiguous':ambiguous,'listingIdentityProofs':listing_resolved,'added':added},ensure_ascii=False,indent=2)+'\n');(out/'matrix-current-bindings.json.gz').write_bytes(gzip.compress(json.dumps(bound,ensure_ascii=False,separators=(',',':')).encode(),mtime=0));print(json.dumps(summary,ensure_ascii=False))
