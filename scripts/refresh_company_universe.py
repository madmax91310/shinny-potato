"""Renew SEC candidates independently; never promote a name without usable data.

Run before the legacy issuer adapters. Workers return observations; only the
parent writes the shared file. Source failures retain original observation dates.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import datetime as dt
import json
from pathlib import Path
import time
import urllib.parse
from refresh_company_analysis import fetch_json, parse_accounts, parse_history, parse_quote, REVENUE, fact_rows
from company_decision import sec_decision, validate_decision
from company_target_evidence import collect_forecast, collect_cash_references
from company_valuation import qualify_share_basis
from data_automation import write_json_atomic

ROOT = Path(__file__).resolve().parents[1]


def select_revenue_concept(body, today):
    """Use one continuous revenue concept; never merge different scopes.

    Prefer the most recent fiscal endpoint, then the established tag priority.
    Restatement conflicts inside that concept still fail closed.
    """
    choices = []
    for index, tag in enumerate(REVENUE):
        rows = fact_rows(body, [tag], 'USD', '10-K', 330, 400, today)
        if rows:
            choices.append((max(r['end'] for r in rows), -index, tag))
    if not choices:
        raise ValueError('No annual revenue concept')
    chosen = max(choices)[2]
    gaap = {k: v for k, v in body['facts']['us-gaap'].items() if k not in REVENUE or k == chosen}
    return {**body, 'facts': {**body['facts'], 'us-gaap': gaap}}


def collect(profile, old, now):
    item = dict(old)
    status = {}
    source = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{profile['cik']}.json"
    # Per-company cache avoids refetching the same price window for multiples.
    cache = {}
    def fetch(url):
        if url not in cache:
            cache[url] = fetch_json(url)
            time.sleep(.15)
        return cache[url]
    try:
        secondary = None
        try:
            if profile.get('requireStandardFallback'):
                raise ValueError('Admission requires the runner-accessible reconciled fallback')
            body = select_revenue_concept(fetch(source), now.date())
            accounts = parse_accounts(body, profile, now.date())
            history = parse_history(body, profile, now.date())
            # A successful SEC parse may still omit annual cash-flow concepts.
            # Try the independently reconciled fallback rather than treating
            # a partial parse as a complete renewable dossier.
            required = ('operatingCashFlow', 'capitalExpenditure', 'freeCashFlow', 'averageDilutedShares')
            primary_components = sec_decision(body, profile, {**accounts, 'history': {'years': history}}, now.date())['years']
            if len(primary_components) < 4 or any(any(not isinstance(row.get(key), (int, float)) for key in required) for row in primary_components):
                raise ValueError('SEC annual components incomplete; reconciled fallback required')
        except Exception as primary_error:
            from company_standard_financials import collect as collect_standard
            secondary = collect_standard(profile, now.date())
            accounts = {k: secondary[k] for k in ('annual', 'quarter')}
            history = secondary['history']
            source = secondary['sourceUrl']
            status['primarySource'] = str(primary_error)[:150]
        if history[-1]['end'] != accounts['annual']['end']:
            raise ValueError('Annual history mismatch')
        retained_quarter = bool(secondary and not accounts.get('quarter') and old.get('quarter')
                                and old['quarter']['end'] > accounts['annual']['end'])
        if retained_quarter:
            accounts['quarter'] = {**old['quarter'], 'observedAt': old['quarter'].get('observedAt', old.get('accountsObservedAt'))}
            status['quarter'] = 'retained with original observation date; annual-only fallback'
        latest = (accounts.get('quarter') or accounts['annual'])['end']
        previous = (old.get('quarter') or old.get('annual') or {}).get('end', '')
        if latest < previous or accounts['annual']['end'] < old.get('annual', {}).get('end', ''):
            raise ValueError('Accounts regressed')
        for key in ('annual', 'quarter'):
            if accounts.get(key) and not (key == 'quarter' and retained_quarter):
                accounts[key]['sourceUrl'] = source
                accounts[key]['observedAt'] = now.date().isoformat()
        accounts['annual']['durationMonths'] = 12
        if accounts.get('quarter'):
            accounts['quarter']['durationMonths'] = 3
        for key in ('balance', 'shares'):
            if key in accounts:
                accounts[key].update(sourceUrl=source, observedAt=now.date().isoformat())
        item.update(accounts, accountsSourceUrl=source, accountsObservedAt=now.date().isoformat(),
                    history={'years': history, 'observedAt': now.date().isoformat(), 'definition': 'Comptes annuels standardisés / Stock Analysis / S&P Global' if secondary else 'Comptes consolidés GAAP / SEC'})
        decision = secondary['decision'] if secondary else sec_decision(body, profile, item, now.date())
        decision['accountsEndAtCollection'] = latest
        item['decision'] = validate_decision(decision, item, now.date())
        item['accountsSourceKind'] = 'standardised-secondary' if secondary else 'sec'
        if secondary:item['accountsProvenance'] = secondary['provenance']
        status['accounts'] = 'updated'
    except Exception as error:
        status['accounts'] = str(error)[:250]
    try:
        url = 'https://query2.finance.yahoo.com/v8/finance/chart/' + urllib.parse.quote(profile['symbol']) + '?range=2y&interval=1d&events=splits'
        quote = parse_quote(fetch(url), profile, now)
        if quote['asOf'] < old.get('quote', {}).get('asOf', ''):
            raise ValueError('Quote regressed')
        item['quote'] = {**quote, 'sourceUrl': url}
        status['quote'] = 'updated'
    except Exception as error:
        status['quote'] = str(error)[:250]
    try:
        item['targetForecast'] = collect_forecast(profile, now.date())
        status['forecast'] = 'updated'
    except Exception as error:
        status['forecast'] = str(error)[:250]
    try:
        item['valuationShareBasis'] = qualify_share_basis(item, profile, fetch, now.date())
        status['cashBasis'] = 'updated'
    except Exception as error:
        # A failed full-window split check must not preserve model eligibility.
        item.pop('valuationShareBasis', None)
        status['cashBasis'] = str(error)[:250]
    if status.get('cashBasis') == 'updated':
        try:
            item['targetCashReference'] = collect_cash_references(item, profile, fetch, now.date())
            status['cashReference'] = 'updated'
        except Exception as error:
            # A valid share basis still supports the published FCF per share
            # when historical positive multiples cannot support a cash model.
            item.pop('targetCashReference', None)
            status['cashReference'] = str(error)[:250]
    item['valuationCollection'] = {'observedAt':now.date().isoformat(), **{k:v for k,v in status.items() if k in ('cashBasis','cashReference','forecast')}}
    return item, status


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--only', nargs='*')
    parser.add_argument('--output', default='/tmp/company-universe-observation.json')
    args = parser.parse_args()
    profiles = json.loads((ROOT/'src/data/company-profiles.json').read_text())
    path = ROOT/'src/data/company-analysis.json'
    data = json.loads(path.read_text())
    now = dt.datetime.now(dt.timezone.utc)
    if args.only and set(args.only) - {p['id'] for p in profiles if p.get('collectionAdapter') == 'sec-companyfacts'}:
        parser.error('Unknown or unsupported company selection')
    targets = [p for p in profiles if p.get('collectionAdapter') == 'sec-companyfacts' and (not args.only or p['id'] in args.only)]
    report = {'checkedAt': now.isoformat(), 'companies': {}}
    with ThreadPoolExecutor(max_workers=4) as pool:
        jobs = {pool.submit(collect, p, data['companies'].get(p['id'], {}), now): p for p in targets}
        for job in as_completed(jobs):
            p = jobs[job]
            try:
                item, status = job.result()
                if item:
                    data['companies'][p['id']] = item
            except Exception as error:
                status = {'error': str(error)[:250]}
            report['companies'][p['id']] = status
            print(p['id'], json.dumps(status), flush=True)
            # Checkpoint after each completed company, including on interruption.
            if args.apply:
                write_json_atomic(path, data)
            write_json_atomic(Path(args.output), report)
    if args.apply:
        write_json_atomic(path, data)
    write_json_atomic(Path(args.output), report)
    failures = [p['id'] for p in targets if not p.get('candidateOnly') and any(report['companies'][p['id']].get(k) != 'updated' for k in ('accounts', 'quote', 'forecast'))]
    if failures:
        raise SystemExit('Active universe source failures: ' + ', '.join(failures))


if __name__ == '__main__':
    main()
