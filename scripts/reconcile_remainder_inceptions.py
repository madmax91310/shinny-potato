"""Reconcile all original launch-date rows against retained exact-instrument official evidence.

A published date is not proof of continuous historical identity. Conflicts are explicit.
"""
import csv,datetime as dt,gzip,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'reports/reliquat-2026-10-23';P=OUT/'preuves'
def main():
    rows=list(csv.DictReader((ROOT/'reports/corrections-2026-10-22/inceptions-53-parts.csv').open(encoding='utf-8-sig'),delimiter=';'))
    old={r['ISIN']:r['date_lancement_publiée']for r in rows};by={r['ISIN']:r for r in rows}
    for r in rows:r.update(nouvelle_preuve=None,date_classe=None,premiere_vl=None,statut_actualise='déjà documentée'if r['date_lancement_publiée']else'non vérifiée',scope_date=None,ambiguite=None)
    def set_date(isin,date,proof,scope):
        dt.date.fromisoformat(date)
        if old[isin]:return
        r=by[isin];r.update(date_lancement_publiée=date,nouvelle_preuve=proof,scope_date=scope,statut_actualise='date officielle documentée ; portée et continuité distinctes')
    for r in json.loads((P/'inceptions-documents.json').read_text()):
        isin=r['isin']
        if r['status']!='document-acquired':continue
        text=(P/(isin+'-inception.txt')).read_text();statements=r['dateStatements']
        if isin.startswith('FR'):
            for statement in statements:
                date=dt.datetime.strptime(re.search(r'\d{2}/\d{2}/\d{4}',statement)[0],'%d/%m/%Y').date().isoformat()
                field='premiere_vl'if'première VL'in statement else'date_classe';by[isin][field]=date
                if field=='date_classe':set_date(isin,date,r['file'],'Date de création de la classe, libellé émetteur exact')
        elif statements:
            date=dt.datetime.strptime(re.search(r'\d{1,2} [A-Za-z]+ 20\d{2}',statements[0])[0],'%d %B %Y').date().isoformat()
            set_date(isin,date,r['file'],'Inception Date du bloc Fund Details de la fiche de la part exacte ; date indice distincte')
    for r in json.loads((P/'wisdom-daily-collectes.json').read_text()):
        if r['ok']:set_date(r['isin'],r['inception'][:10],r['file']+' + '+r['sourceUrl'],'inceptionDt du modèle officiel de cette part')
    body=json.loads(gzip.decompress((P/'amundi-launch-response.json.gz').read_bytes()))
    for product in body['products']:
        facts=product['characteristics'];isin=product['productId']
        if facts['ISIN']!=isin:raise ValueError('Wrong Amundi exact share')
        if by[isin]['date_lancement_publiée'] and by[isin]['date_lancement_publiée']!=facts['LAUNCH_DATE']:
            by[isin]['ambiguite']='Fiche classe : '+by[isin]['date_lancement_publiée']+' ; API LAUNCH_DATE : '+facts['LAUNCH_DATE']+' ; LAUNCH_DATE_ORIGIN : '+str(facts.get('LAUNCH_DATE_ORIGIN'))+'. Ne pas trancher silencieusement ni refuser les périodes antérieures sur ce seul constat.'
        else:set_date(isin,facts['LAUNCH_DATE'],'amundi-launch-response.json.gz#'+isin,'LAUNCH_DATE officiel de ce produit/ISIN ; origine et première NAV séparées')
    for row in json.loads((P/'lg-inceptions-proof.json').read_text())['matches']:
        if row['shortName']!='USD Acc'or row['shareclassCurrency']!='USD':raise ValueError('Wrong L&G share')
        set_date(row['shareclassISIN'],row['launchDate'],'lg-inceptions-response.json.gz','launchDate de la ligne share_class identifiée par ISIN et devise')
    for row in json.loads((P/'launch-extra-proof.json').read_text()):
        if row['ok']:set_date(row['isin'],row['date'],row['file'],row['field']+' sur la fiche/page officielle identifiée par ISIN')
    for row in json.loads((P/'bnp-hsbc-launch-proof.json').read_text()):
        text=(P/row['textFile']).read_text();isin=row['isin']
        if isin not in text:raise ValueError('Wrong exact issuer PDF')
        if isin.startswith('FR'):
            date=dt.datetime.strptime(re.search(r'Launch Date\s+(\d{2}\.\d{2}\.\d{4})',text)[1],'%d.%m.%Y').date().isoformat()
        else:date=dt.datetime.strptime(re.search(r'Inception date\s+(\d{1,2} [A-Za-z]+ \d{4})',text,re.I)[1],'%d %B %Y').date().isoformat()
        set_date(isin,date,row['file'],'Launch/Inception date de la fiche émetteur de cet ISIN ; aucune date de cotation inférée')
    text=(P/'IE00B579F325-inception.txt').read_text();date=dt.datetime.strptime(re.search(r'Product launch date\s+(\d{1,2} [A-Za-z]+ \d{4})',text)[1],'%d %B %Y').date().isoformat()
    set_date('IE00B579F325',date,'IE00B579F325-inception.pdf.gz','Product launch date de l’ETC exact')
    abtc=json.loads(gzip.decompress((P/'21shares-product_details.json.gz').read_bytes()))['data']
    if abtc['details']['isin']!='CH0454664001':raise ValueError('Wrong ABTC')
    set_date('CH0454664001',abtc['inception_date'],'21shares-product_details.json.gz','inception_date du produit exact ; le Listing Date 24.02.2019 du PDF n’est pas la preuve de naissance retenue')
    for r in rows:
        if r['premiere_vl']and r['date_classe']and r['premiere_vl']!=r['date_classe']:
            r['ambiguite']=(r['ambiguite']or'')+' Première NAV '+r['premiere_vl']+' et classe '+r['date_classe']+' : continuité de la chaîne légale à qualifier.'
    assert len(rows)==53 and len(by)==53
    with (OUT/'inceptions-53-parts.csv').open('w',encoding='utf-8-sig',newline='')as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]),delimiter=';');w.writeheader();w.writerows(rows)
    print({'rows':len(rows),'publishedDateDocumented':sum(bool(r['date_lancement_publiée'])for r in rows),'remainingWithoutPublishedDate':sum(not bool(r['date_lancement_publiée'])for r in rows),'ambiguities':sum(bool(r['ambiguite'])for r in rows),'notACertificationOfAllPreLaunchHistory':True})
if __name__=='__main__':main()
