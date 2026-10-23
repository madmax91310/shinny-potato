"""Bounded audit-only acquisition of missing exact-share official daily NAV evidence."""
import concurrent.futures
import datetime as dt
import gzip
import hashlib
import json
from pathlib import Path
from data_automation import UTC,get_json
from issuer_documents import download
from issuer_nav_history import wisdomtree_identity,wisdomtree_nav
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'reports/reliquat-2026-10-23/preuves'
def main():
    originals=json.loads((ROOT/'reports/corrections-2026-10-22/preuves/nav-recollectes.json').read_text())
    shares=[r for r in originals if r['ok'] and 'wisdomtree.com' in r['record'].get('sourceUrl','')]
    def one(row):
        isin=row['isin'];url=row['record']['sourceUrl'].replace('/gb/products/','/ie/products/')
        now=dt.datetime.now(UTC)
        try:
            raw=download(url);identity=wisdomtree_identity(raw.decode(),isin)
            (OUT/(isin+'-wisdom-page.html.gz')).write_bytes(gzip.compress(raw))
            nav_url=f"https://www.wisdomtree.com/api/fund-history/{identity['wtClassID']}?view=navHistoryModal"
            body=get_json(nav_url);nav=wisdomtree_nav(body,now)
            raw_nav=json.dumps(body,separators=(',',':')).encode();file=isin+'-wisdom-daily.json.gz'
            (OUT/file).write_bytes(gzip.compress(raw_nav))
            result={'isin':isin,'ok':True,'checkedAt':now.isoformat(),'sourceUrl':url,'navUrl':nav_url,'currency':identity['fundCurrency'],'inception':identity.get('inceptionDt'),'income':identity.get('useOfIncome'),'first':min(nav),'last':max(nav),'observations':len(nav),'pageSha256':hashlib.sha256(raw).hexdigest(),'navSha256':hashlib.sha256(raw_nav).hexdigest(),'file':file}
        except Exception as e:result={'isin':isin,'sourceUrl':url,'ok':False,'checkedAt':now.isoformat(),'reason':str(e)}
        print(isin,result['ok'],result.get('reason',''),flush=True);return result
    with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:rows=list(pool.map(one,shares))
    (OUT/'wisdom-daily-collectes.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':main()
