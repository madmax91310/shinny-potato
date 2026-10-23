"""Preserve all 90 original cases; quantify new official evidence without changing alert thresholds."""
import csv,datetime as dt,gzip,json,math,re
from pathlib import Path
from issuer_nav_history import blackrock_nav,dws_nav,wisdomtree_nav,vaneck_nav,calendar_boundaries
ROOT=Path(__file__).resolve().parents[1];OLD=ROOT/'reports/corrections-2026-10-22';OUT=ROOT/'reports/reliquat-2026-10-23';P=OUT/'preuves'
def csv_write(path,rows):
    fields=list(dict.fromkeys(k for r in rows for k in r))
    with path.open('w',encoding='utf-8-sig',newline='')as f:
        w=csv.DictWriter(f,fieldnames=fields,delimiter=';');w.writeheader()
        for r in rows:w.writerow({k:json.dumps(v,ensure_ascii=False)if isinstance(v,(dict,list))else v for k,v in r.items()})
def main():
    now=dt.datetime.now(dt.timezone.utc)
    cases=json.loads((OLD/'reconciliation-90-ecarts.json').read_text())['cases']
    original_keys={(r['isin'],int(r['year']))for r in cases if r['status']=='anomalie encore inexpliquée'}
    fx=json.loads((ROOT/'src/data/monthly-fx.json').read_text())['months'];evidence={};sources={};failures={}
    for f in P.glob('*-blackrock.json.gz'):
        isin=f.name.split('-')[0];body=json.loads(gzip.decompress(f.read_bytes()))
        currency=body['componentsByNameMap']['performance']['containersByNameMap']['chart']['dataPointsByNameMap']['currencySymbol']['value']
        parsed=blackrock_nav(body,isin,currency,now);evidence[isin]={'nav':parsed['nav'],'return':parsed['totalReturn'],'currency':currency,'basis':'official income-reinvested performanceData','inception':parsed['inception']};sources[isin]=f.name
    for row in json.loads((P/'wisdom-daily-collectes.json').read_text()):
        isin=row['isin']
        if not row['ok']:failures[isin]=row;continue
        nav=wisdomtree_nav(json.loads(gzip.decompress((P/row['file']).read_bytes())),now)
        evidence[isin]={'nav':nav,'return':nav,'currency':row['currency'],'basis':'official exact-share daily NAV; income qualification separate','inception':row['inception']};sources[isin]=row['file']
    for isin,currency in [('IE00BLNMYC90','USD'),('LU1875395870','EUR'),('LU2196470426','JPY')]:
        nav=dws_nav((P/(isin+'-dws.xlsx')).read_bytes(),isin,currency,now)
        evidence[isin]={'nav':nav,'return':nav,'currency':currency,'basis':'official exact-share daily NAV'};sources[isin]=isin+'-dws.xlsx'
    isin='IE00BDFBTQ78';nav=vaneck_nav((P/'mining-official-nav.download').read_bytes(),'VanEck S&P Global Mining UCITS ETF - GDIG',now)
    evidence[isin]={'nav':nav,'return':nav,'currency':'USD','basis':'official accumulated exact-share NAV'};sources[isin]='mining-official-nav.download'
    results=[]
    for old in cases:
        row=dict(old);isin=old['isin'];year=int(old['year']);key=isin,year
        if key not in original_keys:results.append(row);continue
        obs=evidence.get(isin);start,end=old['marketStartDate'],old['marketEndDate']
        row.update(originalStatus=old['status'],causeGroup='not-yet-demonstrated',newProof=sources.get(isin),officialDailyEvidence=None,missingPiece=None)
        if not obs:
            from urllib.parse import urlsplit
            row['causeGroup']=' / '.join([urlsplit(old['navSource']).hostname or 'official source',old['marketMic'],old['currency']+'→'+old['navCurrency'],'adjusted exchange price vs issuer calendar','market dates '+start+'/'+end])
        if obs:
            row['actualDailyCurrency']=obs['currency'];row['officialDailyBasis']=obs['basis']
            try:
                a,z=calendar_boundaries(obs['return'],year);annual=(obs['return'][z]/obs['return'][a]-1)*100
                proof={'calendarStart':a,'calendarEnd':z,'startPerformanceLevel':obs['return'][a],'endPerformanceLevel':obs['return'][z],'dailyDerivedReturn':annual,'publishedAnnual':old.get('recollectedNavReturn'),'currency':obs['currency']}
                for name,date in [('marketStart',start),('marketEnd',end)]:
                    candidates=[d for d in obs['nav']if d<=date];day=max(candidates)
                    if (dt.date.fromisoformat(date)-dt.date.fromisoformat(day)).days>7:raise ValueError('No contemporaneous daily NAV for '+date)
                    proof[name+'OfficialDate']=day;proof[name+'OfficialNav']=obs['nav'][day];proof[name+'OfficialPerformanceLevel']=obs['return'].get(day)
                row['officialDailyEvidence']=proof
                row['initialNavExactValuationDates']=old.get('navExactValuationDates')
                row['navExactValuationDates']=a+' / '+z+' ; voir niveaux et devise dans officialDailyEvidence'
                values=(old['marketStartValue'],old['marketEndValue']);dates=(start,end)
                if isin=='IE00BLNMYC90' and 2016<=year<=2020:
                    ratios=[v/obs['nav'][d]for v,d in zip(values,dates)]
                    if not all(abs(r-1)<1e-6 for r in ratios):raise ValueError('DWS USD contamination assertion no longer matches original raw prices')
                    raw_return=(values[1]/values[0]-1)*100
                    factor=(fx[f'{year}-12']['rates'][old['currency']]/fx[f'{year}-12']['rates']['USD'])/(fx[f'{year-1}-12']['rates'][old['currency']]/fx[f'{year-1}-12']['rates']['USD'])
                    corrected=(1+annual/100)*factor*100-100
                    contamination=(1+raw_return/100)*(factor-1)*100
                    timing=raw_return-annual
                    row.update(status='erreur corrigée',causeGroup='DWS / Yahoo XDEW.MI / USD NAV stored as EUR / exact daily match',
                        demonstratedCause=f"{start}: {values[0]:.10f} correspond à la NAV USD {obs['nav'][start]:.10f}; {end}: {values[1]:.10f} correspond à {obs['nav'][end]:.10f} USD (ratios {ratios[0]:.10f}/{ratios[1]:.10f}), malgré l’étiquette EUR. Rendement natif {raw_return:.8f} %, NAV aux bornes civiles {annual:.8f} %, différence de bornes {timing:.8f} point(s). L’effet de conversion sur cette série déjà en USD est {contamination:.8f} points. La table DWS indique bien Total return (USD) : supprimer le change serait faux ; la source de niveaux a été remplacée explicitement par la NAV exacte et convertie en EUR.",
                        correction='Historique officiel de NAV de cette part, libellé VL, conversion BCE conservée, anciennes cotations et anomalies archivées. Aucun mélange des deux séries.',missingPiece=None,
                        correctedOfficialNavReturnInOutputCurrency=corrected)
                else:
                    # Quantify timing separately from residual pricing/adjustments, never call the identity an economic explanation.
                    x,y=proof.get('marketStartOfficialPerformanceLevel'),proof.get('marketEndOfficialPerformanceLevel')
                    if x and y:
                        at_market=(y/x-1)*100
                        row['officialDailyEvidence'].update(returnAtMarketDates=at_market,calendarTimingEffectPp=at_market-annual)
                    row['demonstratedCause']=f"Cause complète non démontrée pour {isin}/{year}, {old['marketSymbol']} en {old['currency']}. Série officielle {obs['basis']} en {obs['currency']}: {a} ({obs['return'][a]:.9f}) → {z} ({obs['return'][z]:.9f}) = {annual:.8f} %. NAV aux dates de marché reçues : {proof['marketStartOfficialDate']} ({proof['marketStartOfficialNav']:.9f}) et {proof['marketEndOfficialDate']} ({proof['marketEndOfficialNav']:.9f}). Le reliquat de prix/ajustement ne devient pas une prime/décote certifiée par simple différence."
                    row['missingPiece']=f"Clôtures officielles de {old['marketSymbol']} / {old['marketMic']} en {old['currency']} aux {start} et {end}, devise historique de cette cotation et horaires de valorisation ; " + ('flux et facteurs officiels d’ajustement des distributions/splits sur cette année.'if old.get('marketConvention') else 'méthode officielle de cotation.')
                    if isin=='IE00BLNMYC90':row['causeGroup']='DWS / proven USD start contamination / later EUR quote / residual not fully attributed'
                    if isin=='IE00B5W4TY14':row['causeGroup']='BlackRock / CSKR.MI / suspected currency transition; official London price currency not established'
                    row['correction']='Aucune correction chiffrée du cas initial sans preuve complète. '+('Une voie NAV distinctement qualifiée est raccordée ; cela ne prouve pas la cause de l’ancienne cotation.'if isin=='IE00BDFBTQ78'else'Alerte initiale conservée.')
                row['researchPerformed']=f"Lecture de la réponse brute {sources[isin]}, identité/currency du flux, extraction des NAV et niveaux de performance journaliers, bornes officielles de décembre et bornes {start}/{end}; rapprochement avec les cours d’origine et le change BCE conservés."
            except (ValueError,KeyError)as e:
                row['missingPiece']=str(e);row['researchPerformed']='Réponse brute '+sources[isin]+' inspectée ; borne quotidienne nécessaire non qualifiée.'
        else:
            row['researchPerformed']=f"Collecte du 22 octobre et réponse officielle annuelle conservées pour {isin}, {old['navSource']}; identité, convention déclarée, devise {old['navCurrency']} et bornes reçues {start}/{end} relues. Aucune voie NAV quotidienne qualifiée par exécution dans ce lot pour ce fournisseur."
            row['missingPiece']=f"NAV/rendement total quotidiens officiels de {isin}, {old['navCurrency']}, autour de décembre {year-1}/{year}, et clôtures officielles {old['marketSymbol']} en {old['currency']} aux {start}/{end}; identité historique et distributions/splits à recouper."
            row['demonstratedCause']=f"Écart {old['recollectedDifferencePp']:.8f} points pour {isin}/{year}: marché {old['recollectedMarketReturn']:.8f} %, officiel publié {old['recollectedNavReturn']} % ({old['navCurrency']}), converti {old['recollectedNavConverted']} %. Pas de cause attribuée sans les observations quotidiennes/ajustements spécifiques."
        results.append(row)
    remainder=[r for r in results if (r['isin'],int(r['year']))in original_keys]
    assert len(results)==90 and len(remainder)==84 and len({(r['isin'],r['year'])for r in results})==90
    (OUT/'reconciliation-90-ecarts.json').write_text(json.dumps({'cases':results},ensure_ascii=False,indent=2)+'\n')
    csv_write(OUT/'reconciliation-90-ecarts.csv',results);csv_write(OUT/'reconciliation-84-ecarts.csv',remainder)
    stats={'originalCases':90,'originalUnexplained':84,'newlyExplainedAndCorrected':sum(r['status']=='erreur corrigée'for r in remainder),'stillUnexplained':sum(r['status']=='anomalie encore inexpliquée'for r in remainder),'casesWithNewDailyEvidence':sum(bool(r.get('officialDailyEvidence'))for r in remainder),'exactSharesWithDailyEvidence':len(evidence),'nonComparable175OriginalFileUnchanged':True}
    (OUT/'bilan-84-ecarts.json').write_text(json.dumps(stats,indent=2)+'\n');print(stats)
if __name__=='__main__':main()
