"""Reconcile immutable old cases with measured consumers and dated issuer evidence.

No alert threshold changes, invented prices or automatic causal classifications.
"""
import csv,datetime as dt,gzip,hashlib,json,sys
from pathlib import Path
from issuer_nav_history import ssga_nav,calendar_boundaries
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'reports/reliquat-79-2026-10-23';P=OUT/'preuves'
OLD=ROOT/'reports/reliquat-2026-10-23'
def write_csv(name,rows):
    keys=list(dict.fromkeys(k for r in rows for k in r))
    with (OUT/name).open('w',encoding='utf-8-sig',newline='')as f:
        w=csv.DictWriter(f,keys,delimiter=';');w.writeheader();w.writerows({k:json.dumps(v,ensure_ascii=False)if isinstance(v,(list,dict))else v for k,v in r.items()}for r in rows)
def read_csv(name):return list(csv.DictReader((OLD/name).open(encoding='utf-8-sig'),delimiter=';'))
def main():
    original=[r for r in read_csv('reconciliation-84-ecarts.csv')if r['status']=='anomalie encore inexpliquée'];assert len(original)==79
    before=json.loads((P/'consommateurs-avant.json').read_text());after=json.loads((P/'consommateurs-apres.json').read_text());bm={(r['isin'],r['year']):r for r in before};am={(r['isin'],r['year']):r for r in after}
    fx=json.loads((ROOT/'src/data/monthly-fx.json').read_text())['months'];now=dt.datetime.now(dt.timezone.utc)
    sources=json.loads((ROOT/'scripts/official-nav-remainder-sources.json').read_text());new_isins={s['isin']for s in sources}
    # The raw Yahoo responses were retained by the original audit, not recollected.
    raw_dir=Path(sys.argv[1])if len(sys.argv)>1 else P/'marches-originaux'
    copied=P/'marches-originaux';copied.mkdir(exist_ok=True)
    result=[];decomp=[];tools=[];blocks=[]
    for row in original:
        r=dict(row);isin=r['isin'];year=int(r['year']);b=bm[isin,year];a=am[isin,year]
        e=json.loads(r['officialDailyEvidence'])if r['officialDailyEvidence']else None;new_evidence=False
        if isin in ['IE00BSPLC413','IE00BSPLC298']:
            native='USD'if isin=='IE00BSPLC413'else'EUR';filename='zprv-nav.xlsx'if isin=='IE00BSPLC413'else'zprx-nav.xlsx';nav=ssga_nav((P/'recherche-voies'/filename).read_bytes(),isin,native,now)
            d0,d1=calendar_boundaries(nav,year);m0=max(d for d in nav if d<=r['marketStartDate']);m1=max(d for d in nav if d<=r['marketEndDate']);ret=(nav[d1]/nav[d0]-1)*100
            e=dict(calendarStart=d0,calendarEnd=d1,startPerformanceLevel=nav[d0],endPerformanceLevel=nav[d1],dailyDerivedReturn=ret,publishedAnnual=float(r['navReturn']),currency=native,marketStartOfficialDate=m0,marketStartOfficialNav=nav[m0],marketStartOfficialPerformanceLevel=nav[m0],marketEndOfficialDate=m1,marketEndOfficialNav=nav[m1],marketEndOfficialPerformanceLevel=nav[m1],returnAtMarketDates=(nav[m1]/nav[m0]-1)*100,calendarTimingEffectPp=(nav[d1]/nav[d0]-nav[m1]/nav[m0])*100)
            r['officialDailyEvidence']=json.dumps(e,ensure_ascii=False);r['newProof']='recherche-voies/'+filename;r['actualDailyCurrency']=native;new_evidence=True
        r.update(ancienne_serie_chargee_avant=b['oldQuoteActive'],ancienne_serie_chargee_apres=a['oldQuoteActive'],fenetre_admise_avant=b['active']['window']['qualified'],fenetre_admise_apres=a['active']['window']['qualified'],outils_avant=b['consumers'],outils_apres=a['consumers'],voie_active_apres=a['active'],preuve_quotidienne_avant=bool(row['officialDailyEvidence']),preuve_quotidienne_apres=bool(e),nouvelle_preuve_quotidienne=new_evidence,cause_ancienne_divergence='non expliquée',usage_securise=('voie NAV exacte distincte qualifiée'if not a['oldQuoteActive']else'ancienne cotation encore consommée ; cause à investiguer'),reparation_ancienne_cotation='non démontrée',nouvelle_voie_active=isin in new_isins,preuve_consommation='preuves/consommateurs-avant.json ; preuves/consommateurs-apres.json',preuve_nouvelle_voie='GitHub Actions 39952549373 ; preuves/github-nav11/nav.json'if isin in new_isins else'voie antérieure préservée'if not a['oldQuoteActive']else'')
        f=raw_dir/(r['id']+'.json');gz=raw_dir/(r['id']+'.json.gz')
        raw=f.read_bytes()if f.exists()else gzip.decompress(gz.read_bytes())
        archive=copied/(r['id']+'.json.gz')
        if not archive.exists():archive.write_bytes(gzip.compress(raw))
        capture=json.loads(raw)
        canonical_hash=hashlib.sha256(json.dumps(capture,sort_keys=True,allow_nan=False).encode()).hexdigest()
        if canonical_hash!=r['marketHash']:raise ValueError('Original market capture hash changed: '+r['id'])
        market=capture['1d']['chart']['result'][0];dates=[dt.datetime.fromtimestamp(t,dt.timezone.utc).date().isoformat()for t in market['timestamp']]
        vals={}
        for k,d in [('start',r['marketStartDate']),('end',r['marketEndDate'])]:
            i=dates.index(d);close=market['indicators']['quote'][0]['close'][i];adjusted=market['indicators']['adjclose'][0]['adjclose'][i];vals[k]=dict(date=d,close=close,adjusted=adjusted,factor=adjusted/close)
        events=market.get('events',{});events={kind:[dict(date=dt.datetime.fromtimestamp(v['date'],dt.timezone.utc).date().isoformat(),**{k:q for k,q in v.items()if k!='date'})for v in data.values()if f'{year}-01-01'<=dt.datetime.fromtimestamp(v['date'],dt.timezone.utc).date().isoformat()<=f'{year}-12-31']for kind,data in events.items()}
        raw_ratio=vals['end']['close']/vals['start']['close'];adj_ratio=vals['end']['adjusted']/vals['start']['adjusted'];r['pieces_originales_sha256']=hashlib.sha256(raw).hexdigest();r['bornes_cours_brut_et_ajuste']=vals;r['operations_declarees_par_fournisseur_non_preuve_officielle']=events
        quant=dict(isin=isin,annee=year,cotation=r['marketSymbol'],devise_annoncée_cotation=r['currency'],bornes_cours=vals,operations_fournisseur=events,rendement_brut_pct=(raw_ratio-1)*100,rendement_ajuste_pct=(adj_ratio-1)*100,facteur_ajustement_entre_bornes=vals['end']['factor']/vals['start']['factor'],contribution_ajustement_pp=(adj_ratio-raw_ratio)*100,preuve_marche=f'preuves/marches-originaux/{r["id"]}.json.gz',sha256_marche=r['pieces_originales_sha256'])
        if e:
            native=e['currency'];out=r['currency'];m0=f'{year-1}-12';m1=f'{year}-12';factor=fx[m1]['rates'][out]/fx[m1]['rates'][native]/(fx[m0]['rates'][out]/fx[m0]['rates'][native]);official_ratio=e['marketEndOfficialPerformanceLevel']/e['marketStartOfficialPerformanceLevel'];navratio=e['marketEndOfficialNav']/e['marketStartOfficialNav'];converted=(official_ratio*factor-1)*100;residual=(adj_ratio-1)*100-converted
            quant.update(devise_officielle_quotidienne=native,preuve_nav=r['newProof'],nav_brute_debut=e['marketStartOfficialNav'],nav_brute_fin=e['marketEndOfficialNav'],niveau_reinvesti_debut=e['marketStartOfficialPerformanceLevel'],niveau_reinvesti_fin=e['marketEndOfficialPerformanceLevel'],date_nav_debut=e['marketStartOfficialDate'],date_nav_fin=e['marketEndOfficialDate'],rendement_nav_brute_pct=(navratio-1)*100,rendement_officiel_reinvesti_pct=(official_ratio-1)*100,facteur_reinvestissement_relatif=official_ratio/navratio,facteur_change_mensuel_existant=factor,date_bce_debut=fx[m0]['asOf'],date_bce_fin=fx[m1]['asOf'],officiel_aux_dates_marche_converti_pct=converted,residu_cours_nav_pp=residual,effet_calendrier_natif_pp=e['calendarTimingEffectPp'],meme_jour_nav_marche_debut=e['marketStartOfficialDate']==r['marketStartDate'],meme_jour_nav_marche_fin=e['marketEndOfficialDate']==r['marketEndDate'])
            r['conclusion_quantitative']=f"{r['marketSymbol']} {year}: cours brut {(raw_ratio-1)*100:.8f} %, ajusté {(adj_ratio-1)*100:.8f} %, ajustement ×{quant['facteur_ajustement_entre_bornes']:.9f}; officiel {native} aux {e['marketStartOfficialDate']}/{e['marketEndOfficialDate']} {(official_ratio-1)*100:.8f} %, conversion {out} ×{factor:.9f}, résultat {converted:.8f} %, résidu {residual:.8f} pp. Effet des bornes calendaires natif {e['calendarTimingEffectPp']:.8f} pp. Ce résidu ne prouve ni prime/décote ni erreur de devise historique."
            r['missingPiece']=f"Confirmation officielle des clôtures et de la devise historique de {r['marketSymbol']} ({r['marketMic']}) aux {r['marketStartDate']}/{r['marketEndDate']}, et facteurs officiels des opérations de cette fenêtre ; résidu à expliquer {residual:.8f} pp après la convention BCE existante."
        else:
            issuer=('L&G'if isin in ['IE00BK5BCD43','IE00BK5BCH80']else'Bitwise'if isin=='DE000A27Z304'else'BNP'if isin=='FR0011550185'else'HSBC')
            r['recherche_nouvelle_strategie']=dict(fournisseur=issuer,piece='Découverte des exports/liens officiels et code de leur interface publique ; aucun niveau quotidien qualifié inventé.',preuve='preuves/recherche-voies/decouverte.json')
            r['missingPiece']=f"{issuer}: série quotidienne de la part exacte {isin} sur décembre {year-1} et décembre {year}, avec devise, distributions/ajustements et dates de valeur ; les documents annuels disponibles ne donnent pas ces deux bornes. Clôtures officielles {r['marketSymbol']} {r['marketStartDate']}/{r['marketEndDate']} également absentes."
        decomp.append(quant);result.append(r)
        for phase,item in [('avant',b),('apres',a)]:
            for tool,value in item['consumers'].items():
                tools.append(dict(phase=phase,isin=isin,annee=year,outil=tool,present=bool(value),details=value,ancienne_cotation_historique_chargee=item['oldQuoteActive'],convention_serie_commune=item['active']['basis'],fenetre_cas=item['originalWindow'],fenetre_qualifiee=item['active']['window']))
        blocks.append(dict(type='divergence financière',isin=isin,annee=year,usage=r['usage_securise'],cause=r['cause_ancienne_divergence'],piece_manquante=r['missingPiece'],preuve_quotidienne=bool(e)))
    write_csv('reconciliation-79-ecarts.csv',result);write_csv('decomposition-79-cas.csv',decomp);write_csv('consommateurs-79-cas.csv',tools);write_csv('series-suspectes-production.csv',[r for r in result if r['ancienne_serie_chargee_apres']]);write_csv('blocages-financiers.csv',blocks)
    statuses=read_csv('statut-19-actions.csv')
    for r in statuses:
        r['statut_avant_mission']=r['statut']
        if r['action']=='P0-01':r['correction_démontrée']+=' Onze parts existantes migrées explicitement vers une NAV capitalisante ; 17 cas supplémentaires sécurisés ; cours originaux archivés. Les identifiants manuels/Duels restent identiques.';r['preuves']+=' ; preuves/github-nav11/nav.json ; consommateurs-79-cas.csv'
        if r['action']=='P0-02':r['limitation']='79 causes encore ouvertes, distinctes de 21 usages disposant déjà ou désormais de NAV qualifiées ; 72/79 avec preuve quotidienne contre 68/79. Aucune explication économique déduite du seul résidu.'
        if r['action']=='P1-06':r['correction_démontrée']+=' Complément #889 réconcilié : portée Total AUM of fund, devise GBP de l’encours distincte de celle de la part et de la performance ; cible de collecte corrigée. Incident expliqué, aucune réouverture de la panne.';r['limitation']='Archive volumineuse non récupérée : limite documentaire ; journaux, réponses officielles et collecte GitHub disponibles. Ce manque documentaire ne constitue pas un défaut actif.'
        if r['action']=='P2-05':r['statut']='déjà résolue';r['limitation']='Date émetteur non annoncée : limite documentaire, pas une panne. Délai interne de surveillance conservé séparément, aucun bulletin fictif ni date de publication inventés.'
        if r['action']=='P3-02':r['correction_démontrée']+=' Politique series.dailyNav centralisée et réellement lue pour les 14 voies actives (trois antérieures + onze nouvelles) ; donnée quotidienne et historique mensuel distincts.'
    write_csv('statut-19-actions.csv',statuses)
    bilan=dict(base='1892bdeec74b4ecc655f0e3a181bc02d4dcb4e6e',cas=79,parts=len({r['isin']for r in result}),causes_expliquees_ajoutees=0,causes_encore_ouvertes=79,preuve_quotidienne_avant=68,preuve_quotidienne_apres=sum(bool(r['preuve_quotidienne_apres'])for r in result),sans_preuve_quotidienne_apres=sum(not r['preuve_quotidienne_apres']for r in result),ancienne_cotation_chargee_avant=sum(r['oldQuoteActive']for r in before),ancienne_cotation_chargee_apres=sum(r['oldQuoteActive']for r in after),nouveaux_usages_securises_cas=sum(b['oldQuoteActive']and not a['oldQuoteActive']for b,a in zip(before,after)),cas_sur_voie_nav_apres=sum(not r['oldQuoteActive']for r in after),parts_nouvelle_voie=len(new_isins),statuts_19={s:sum(r['statut']==s for r in statuses)for s in {r['statut']for r in statuses}},note='Une voie NAV distincte n’explique pas une ancienne cotation. Chargée ne signifie pas erronée : les 58 cotations restantes demandent investigation, sans blocage automatique de leurs fenêtres.')
    (OUT/'bilan.json').write_text(json.dumps(bilan,ensure_ascii=False,indent=2)+'\n');print(json.dumps(bilan,ensure_ascii=False))
if __name__=='__main__':main()
