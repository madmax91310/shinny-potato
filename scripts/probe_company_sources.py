"""Read-only runner evidence for official SEC transports and issuer balances."""
import datetime as dt
import json
import sys
import urllib.request
from pathlib import Path
from company_publications import UA
from company_balance import collect_balance, SUPPORTED


def probe(url, zipped=False):
    try:
        request = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': '*/*'})
        with urllib.request.urlopen(request, timeout=30) as response:
            # Access probe only: do not download the multi-GB archive or claim
            # qualified coverage from a successful header/signature.
            raw = response.read(256)
            valid = raw.startswith(b'PK') if zipped else raw.lstrip().startswith(b'{')
            return {'url': url, 'httpStatus': response.status, 'signatureValid': valid,
                    'status': 'accessible-unqualified' if valid else 'unexpected-content'}
    except Exception as e:
        return {'url': url, 'status': 'unavailable', 'httpStatus': getattr(e, 'code', None), 'error': str(e)[:300]}


def main():
    root = Path(__file__).resolve().parents[1]
    today = dt.datetime.now(dt.timezone.utc)
    endpoints = [("https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json", False),
                 ("https://data.sec.gov/api/xbrl/companyconcept/CIK0000320193/us-gaap/StockholdersEquity.json", False),
                 ("https://www.sec.gov/Archives/edgar/daily-index/xbrl/companyfacts.zip", True),
                 ("https://www.sec.gov/files/dera/data/financial-statement-data-sets/2026q3.zip", True)]
    report = {'checkedAt': today.isoformat(), 'environment': 'github-actions' if __import__('os').environ.get('GITHUB_ACTIONS') else 'development',
              'sec': [probe(url, zipped) for url, zipped in endpoints], 'issuers': {}}
    companies = json.loads((root/'src/data/company-analysis.json').read_text())['companies']
    for profile in json.loads((root/'src/data/company-profiles.json').read_text()):
        if profile['id'] not in SUPPORTED: continue
        try:
            block = collect_balance(profile, companies[profile['id']], today.date())
            report['issuers'][profile['id']] = {'status': 'qualified', 'block': block}
        except Exception as e:
            report['issuers'][profile['id']] = {'status': 'unavailable', 'error': str(e)[:300]}
    path = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/company-source-probe.json')
    path.write_text(json.dumps(report, indent=2, ensure_ascii=False)+'\n')
    for name, value in report['issuers'].items(): print(name, value['status'], value.get('error', ''))
    for value in report['sec']: print(value['url'], value['status'], value.get('httpStatus'))
    # A missing newly qualified adapter blocks PR approval, but SEC refusals
    # are expected observations, not failures of the issuer strategy.
    return int(any(v['status'] != 'qualified' for v in report['issuers'].values()))

if __name__ == '__main__': sys.exit(main())
