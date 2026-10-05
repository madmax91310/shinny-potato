"""Update monthly INSEE IPC rates using the current base-2025 series, not price levels."""
import argparse
import datetime as dt
import json
import os
import pathlib
import xml.etree.ElementTree as ET

from data_automation import UTC, get_text, number, reject, write_json_atomic

SERIES = '011814631'
URL = f'https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/{SERIES}?startPeriod=2026-01'


def parse_rates(body, now):
    root = ET.fromstring(body)
    series = [x for x in root.iter() if x.tag.rsplit('}', 1)[-1] == 'Series']
    if len(series) != 1:
        reject('Expected exactly one INSEE series')
    series = series[0]
    title = 'Indice des prix à la consommation - Base 2025 - Variation mensuelle - Ensemble des ménages - France - Nomenclature Coicop : 00 - Ensemble'
    if series.get('IDBANK') != SERIES or series.get('FREQ') != 'M' or series.get('REF_AREA') != 'FE' or series.get('TITLE_FR') != title:
        reject('INSEE series identity, population or method changed')
    rates, quality = {}, {}
    for obs in series:
        month = obs.get('TIME_PERIOD', '')
        date = dt.datetime.strptime(month, '%Y-%m').date()
        if date.strftime('%Y-%m') != month or date >= now.date().replace(day=1) or month in rates:
            reject('Duplicate, invalid or incomplete month')
        result = float(obs.get('OBS_VALUE', 'nan'))
        # Deflation is valid. Avoid number(positive=False), which prohibits negative values.
        number(abs(result), positive=False)
        if abs(result) > 10 or obs.get('OBS_STATUS') not in ('A', 'P'):
            reject('Invalid or unavailable inflation rate')
        status = obs.get('OBS_QUAL')
        if status not in ('DEF', 'P'):
            reject('Unknown INSEE observation quality')
        rates[month], quality[month] = result, status
    if not rates or min(rates) != '2026-01':
        reject('Current-year history missing')
    months = sorted(rates)
    for left, right in zip(months, months[1:]):
        year, month = map(int, left.split('-'))
        expected = f'{year + (month == 12):04}-{month % 12 + 1:02}'
        if right != expected:
            reject('Gap in INSEE history')
    last = dt.datetime.strptime(months[-1], '%Y-%m').date()
    if (now.date() - last).days > 75:
        reject('Stale INSEE publication')
    return {'seriesId': SERIES, 'sourceUrl': URL, 'sourceUpdatedAt': series.get('LAST_UPDATE'),
            'scope': 'France, all households, all items, not seasonally adjusted',
            'method': 'published monthly change (%), base 2025',
            'rates': dict(sorted(rates.items())), 'quality': dict(sorted(quality.items()))}


def merge_rates(baseline, report):
    rates = report['rates']
    if max(rates) < max(baseline):
        reject('Provider would regress the active last month')
    return {**baseline, **rates}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline', required=True, type=pathlib.Path)
    parser.add_argument('--output', required=True, type=pathlib.Path)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    now = dt.datetime.now(UTC)
    body = get_text(URL, ('application/xml', 'text/xml', 'application/vnd.sdmx.structurespecificdata+xml'))
    report = parse_rates(body, now)
    report['rawResponse'] = body
    baseline = json.loads(args.baseline.read_text())
    merged = merge_rates(baseline, report)
    report['changes'] = [{'month': month, 'previous': baseline.get(month), 'value': value}
                         for month, value in report['rates'].items() if baseline.get(month) != value]
    report['checkedAt'] = now.isoformat()
    write_json_atomic(args.output, report)
    if args.apply:
        # All parsing and validation have succeeded before either active artifact is touched.
        root = pathlib.Path(__file__).resolve().parents[1]
        destination = root / 'src/data/inflation-monthly.js'
        content = '// INSEE IPC : variations mensuelles publiées (%), France entière, non CVS.\n'
        content += '// Avant 2026 : capture historique conservée ; depuis 2026 : série BDM 011814631, base 2025.\n'
        content += '// Qualité DEF/PROV, source et révisions : scripts/source-snapshots/inflation-automated.json.\n'
        content += 'export const INFLATION_MONTHLY = ' + json.dumps(dict(sorted(merged.items())), indent=2) + '\n'
        if report['changes']:
            temporary = destination.with_suffix('.js.tmp')
            temporary.write_text(content)
            os.replace(temporary, destination)
        snapshot = root / 'scripts/source-snapshots/inflation-automated.json'
        previous = json.loads(snapshot.read_text()) if snapshot.exists() else None
        # A successful unchanged collection does not cause commits or deployments.
        fields = ('seriesId', 'sourceUpdatedAt', 'rates', 'quality')
        if previous is None or any(previous.get(key) != report[key] for key in fields):
            write_json_atomic(snapshot, report)
    print(f"INSEE {SERIES}: latest {max(report['rates'])}; {len(report['changes'])} changes; provisional months: {[m for m, q in report['quality'].items() if q == 'P']}")
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as handle:
            handle.write(f"## Inflation INSEE\n\nSérie {SERIES}, dernière observation {max(report['rates'])}, {len(report['changes'])} valeur(s) modifiée(s).\n\n")
            handle.write('Qualité de la dernière observation : ' + report['quality'][max(report['rates'])] + ' (P = provisoire, DEF = définitif).\n')
            for row in report['changes']:
                handle.write(f"\n* {row['month']} : {row['previous']} → {row['value']} %\n")


if __name__ == '__main__':
    main()
