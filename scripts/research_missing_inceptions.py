"""Audit-only exact-share document acquisition. No launch dates are inferred or applied."""
import concurrent.futures,csv,datetime as dt,gzip,hashlib,json,re
from pathlib import Path
from issuer_documents import download,pdf_text
from data_automation import UTC
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'reports/reliquat-2026-10-23/preuves'
def main():
    cases=list(csv.DictReader((ROOT/'reports/corrections-2026-10-22/inceptions-53-parts.csv').open(encoding='utf-8-sig'),delimiter=';'))
    missing=[r['ISIN']for r in cases if not r['date_lancement_publiée']]
    shares={r['isin']:r['record']for r in json.loads((ROOT/'reports/corrections-2026-10-22/preuves/nav-recollectes.json').read_text())if r['ok']}
    def one(isin):
        source=shares[isin]['sourceUrl']
        if 'amundietf' in source:source=f'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/{isin}/FRA/FRA/RETAIL/'+('AMUNDI'if isin=='FR0013416716'else'ETF')
        if not ('pdf' in source or 'vaneck' in source):return {'isin':isin,'status':'not-a-document-route','sourceUrl':source}
        now=dt.datetime.now(UTC)
        try:
            raw=download(source);text=pdf_text(raw)
            if isin not in text:raise ValueError('Wrong exact-share document')
            path=OUT/(isin+'-inception.pdf.gz');path.write_bytes(gzip.compress(raw));(OUT/(isin+'-inception.txt')).write_text(text)
            # Keep all distinct fund/class/index/first-NAV labels for human review.
            patterns=[r'Date de création de (?:la classe|l.ETC)\s+\d{2}/\d{2}/\d{4}',r'Date de la première VL\s+\d{2}/\d{2}/\d{4}',r'Inception Date\s+\d{1,2} [A-Za-z]+ 20\d{2}',r'(?:Fund|Share Class|Share class) (?:Launch|launch|Inception|inception) Date\s+[^\n]+']
            found=[m.group()for pattern in patterns for m in re.finditer(pattern,text)]
            return {'isin':isin,'status':'document-acquired'if found else'date-not-extracted','sourceUrl':source,'checkedAt':now.isoformat(),'sha256':hashlib.sha256(raw).hexdigest(),'file':path.name,'dateStatements':found}
        except Exception as e:return {'isin':isin,'status':'failed','sourceUrl':source,'checkedAt':now.isoformat(),'reason':str(e)}
    with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:
        results=[]
        for result in pool.map(one,missing):results.append(result);print(result['isin'],result['status'],result.get('dateStatements',result.get('reason','')),flush=True)
    (OUT/'inceptions-documents.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':main()
