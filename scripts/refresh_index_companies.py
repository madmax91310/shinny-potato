"""Additional exact-index compositions; existing parsers, gates and failure retention."""
import argparse
import datetime as dt
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from data_automation import UTC, write_json_atomic
from refresh_index_sources import collect_one, merge_records
from observation_status import holdings_status
ROOT = Path(__file__).resolve().parents[1]


def refresh(previous, configs, now, collect=collect_one):
    def one(config):
        result = collect(config, now)
        if config.get('physicalComposition'):
            try:
                from collect_korea_companies import collect as collect_physical
                result['companyFund'] = collect_physical(config['physicalComposition'], now)
            except Exception as error:
                result.setdefault('errors', []).append({'field': 'companyFund', 'reason': str(error)})
        return result
    with ThreadPoolExecutor(max_workers=4) as pool:
        observations = list(pool.map(one, configs))
    merged = merge_records(previous, observations)
    for observation in observations:
        record = merged.setdefault(observation['id'], {})
        errors = observation.get('errors', [])
        incoming = observation.get('companyFund')
        if incoming:
            old = previous.get(observation['id'], {}).get('companyFund')
            if old and incoming['asOf'] < old['asOf']:
                errors.append({'field': 'companyFund', 'reason': 'Physical portfolio date regression'})
            else:
                record['companyFund'] = incoming
                record.setdefault('companyFundHistory', {}).setdefault(incoming['asOf'], incoming)
        if observation.get('facts') and record.get('facts', {}).get('asOf') == observation['facts']['asOf']:
            record['facts']['source']['checkedAt'] = observation['facts']['source']['checkedAt']
        if incoming or previous.get(observation['id'], {}).get('companyFund'):
            native_errors = [e['reason'] for e in errors if e['field'] == 'companyFund']
            record['companyStatus'] = holdings_status(previous.get(observation['id'], {}).get('companyStatus', {}),
                previous.get(observation['id'], {}).get('companyFund', {}),
                incoming if incoming and not native_errors else None, '; '.join(native_errors) or None, now)
        record['status'] = holdings_status(previous.get(observation['id'], {}).get('status', {}),
            {**previous.get(observation['id'], {}).get('facts', {}), 'checkedAt': previous.get(observation['id'], {}).get('facts', {}).get('source', {}).get('checkedAt')}, observation.get('facts'),
            '; '.join(e['reason'] for e in errors) or None, now)
    return merged, observations


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--apply', action='store_true'); ap.add_argument('--output', type=Path, required=True)
    args = ap.parse_args(); now = dt.datetime.now(UTC)
    configs = json.loads((ROOT / 'scripts/index-company-sources.json').read_text())['additionalIndices']
    path = ROOT / 'src/data/index-company-observations.json'
    previous = json.loads(path.read_text()) if path.exists() else {}
    merged, observations = refresh(previous, configs, now)
    if args.apply: write_json_atomic(path, merged)
    errors = [{'id': o['id'], 'field': e['field'], 'error': e['reason']} for o in observations for e in o['errors']]
    write_json_atomic(args.output, {'checkedAt': now.isoformat(), 'indices': observations, 'errors': errors})
    print(f'Index company compositions: {sum("facts" in o for o in observations)}/{len(configs)}; failures: {len(errors)}')
    if errors: raise SystemExit(1)

if __name__ == '__main__': main()
