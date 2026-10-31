"""Read-only provider qualification; never records or publishes application data."""
import argparse, datetime as dt, gzip, hashlib, json, pathlib
from h10_fx import XML_SOURCE, SERIES, parse
from issuer_documents import download


def main():
    args=argparse.ArgumentParser(description=__doc__)
    args.add_argument('--output',required=True)
    options=args.parse_args();output=pathlib.Path(options.output)
    output.parent.mkdir(parents=True,exist_ok=True)
    now=dt.datetime.now(dt.timezone.utc)
    report={'checkedAt':now.isoformat(),'kind':'read-only-source-qualification',
            'expectedIdentities':[SERIES],'expectedFields':['CURRENCY','FREQ','FX','SERIES_NAME','UNIT','UNIT_MULT','TIME_PERIOD','OBS_VALUE','OBS_STATUS'],
            'sourceUrl':XML_SOURCE,'status':'failed','publishesData':False,'ecbConsulted':False,
            'limit':'Current provider response and frozen historical equivalence; not ordinary collection, registration, publication or scheduled proof.'}
    try:
        body=download(XML_SOURCE,max_bytes=4_000_000,timeout=30,max_attempts=1)
        report.update(responseSha256=hashlib.sha256(body).hexdigest(),bytes=len(body))
        output.with_suffix('.zip').write_bytes(body)
        current=parse(body,now)
        oldpath=pathlib.Path(__file__).resolve().parents[1]/'reports/data-review-2026-10-23/preuves/h10-daily-rates.csv.gz'
        old=parse(gzip.decompress(oldpath.read_bytes()),now)
        common=set(current)&set(old)
        differences=[{'date':d.isoformat(),'xml':current[d],'frozenCsv':old[d]}for d in sorted(common)if current[d]!=old[d]]
        report.update(observations=len(current),firstObservation=min(current).isoformat(),lastObservation=max(current).isoformat(),commonFrozenObservations=len(common),differences=differences)
        if len(common)<6000 or differences:raise ValueError('Official XML and frozen qualified H.10 history not reconciled')
        report['status']='validated'
    except Exception as error:
        report['reason']=str(error)
    finally:
        output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(report['status'],SERIES,report.get('observations'),report.get('reason',''))
    if report['status']!='validated':raise SystemExit(1)


if __name__=='__main__':main()
