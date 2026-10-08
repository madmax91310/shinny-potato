"""Refresh dated INSEE price levels, IRL and SMIC; never use year-on-year rates as levels."""
import argparse
import copy
import datetime as dt
import hashlib
import json
import pathlib
import re
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from data_automation import UTC, get_text, number, reject, write_json_atomic

ROOT = pathlib.Path(__file__).resolve().parents[1]
PREFIX = 'Indice des prix à la consommation - Base 2025 - Ensemble des ménages - France - '
SOURCES = {
    'general': ('011814630', 'M', 'FE', PREFIX + 'Nomenclature Coicop : 00 - Ensemble'),
    'alimentation': ('011813717', 'M', 'FE', PREFIX + 'Alimentation'),
    'energie': ('011813864', 'M', 'FE', PREFIX + 'Énergie'),
    'irl': ('001515333', 'T', 'FM', 'Indice de référence des loyers (IRL)'),
    'smic': ('000879877', 'M', 'FE', 'Montant mensuel brut du Smic (Salaire minimum interprofessionnel de croissance) pour 35 heures de travail par semaine (151,67 heures par mois)'),
}

def source_url(key):
    return f'https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/{SOURCES[key][0]}?startPeriod=2010'

def parse_series(body, key, now):
    series = [s for s in ET.fromstring(body).iter() if s.tag.rsplit('}', 1)[-1] == 'Series']
    expected = SOURCES[key]
    if len(series) != 1 or any(series[0].get(field) != value for field, value in zip(
            ('IDBANK', 'FREQ', 'REF_AREA', 'TITLE_FR'), expected)):
        reject('Identité, fréquence, champ ou base INSEE modifiés')
    series = series[0]
    values, quality = {}, {}
    for obs in series:
        period = obs.get('TIME_PERIOD', '')
        if key == 'irl':
            if not re.fullmatch(r'20\d{2}-Q[1-4]', period): reject('Trimestre invalide')
            year, q = int(period[:4]), int(period[-1])
            end = dt.date(year + (q == 4), 1 if q == 4 else q * 3 + 1, 1)
            if end > now.date(): reject('IRL d’un trimestre inachevé')
        else:
            try: date = dt.datetime.strptime(period, '%Y-%m').date()
            except ValueError: reject('Mois invalide')
            if date.strftime('%Y-%m') != period or date > now.date().replace(day=1): reject('Observation future')
            if key != 'smic' and date == now.date().replace(day=1): reject('Mois de prix inachevé')
        if period in values or obs.get('OBS_STATUS') not in ('A', 'P') or obs.get('OBS_QUAL') not in ('DEF', 'P'):
            reject('Observation dupliquée, manquante ou qualité inconnue')
        value = number(float(obs.get('OBS_VALUE', 'nan')))
        if not 0 < value < (10_000 if key == 'smic' else 1000): reject('Niveau INSEE hors limites')
        values[period], quality[period] = value, obs.get('OBS_QUAL')
    if not values: reject('Série INSEE vide')
    # Reject missing intermediate periods, including incomplete annual averages.
    last = max(values)
    required = [f'{y}-Q{q}' for y in range(2010, int(last[:4]) + 1) for q in range(1, 5)] if key == 'irl' else [
        f'{y}-{m:02}' for y in range(2010, int(last[:4]) + 1) for m in range(1, 13)]
    if any(p not in values for p in required if p <= last): reject('Trou dans la série INSEE depuis 2010')
    last_date = dt.date(int(last[:4]), (int(last[-1]) - 1) * 3 + 1, 1) if key == 'irl' else dt.date.fromisoformat(last + '-01')
    if (now.date() - last_date).days > (200 if key == 'irl' else 75): reject('Publication INSEE trop ancienne')
    return {'seriesId': expected[0], 'sourceUrl': source_url(key), 'sourceUpdatedAt': series.get('LAST_UPDATE'),
            'title': expected[3], 'scope': expected[2], 'frequency': expected[1],
            'values': dict(sorted(values.items())), 'quality': dict(sorted(quality.items())),
            'sha256': hashlib.sha256(body.encode()).hexdigest()}

def refresh(current, now, fetch=None):
    fetch = fetch or (lambda key: get_text(source_url(key), ('application/xml', 'text/xml', 'application/vnd.sdmx.structurespecificdata+xml')))
    state = copy.deepcopy(current)
    collected, errors, successes = {}, [], []
    def one(key):
        try: return key, parse_series(fetch(key), key, now), None
        except Exception as error: return key, None, str(error)
    with ThreadPoolExecutor(max_workers=5) as pool:
        for key, result, error in pool.map(one, SOURCES):
            if error: errors.append({'id': 'purchasing-' + key, 'error': error})
            else: collected[key] = result
    # General/food/energy are published at one common month, and share the same base.
    groups = [('prices', ['general', 'alimentation', 'energie']), ('irl', ['irl']), ('smic', ['smic'])]
    for family, keys in groups:
        if any(k not in collected for k in keys): continue
        try:
            periods = set.intersection(*(set(collected[k]['values']) for k in keys))
            latest = max(periods)
            old = state.get(family, {})
            if latest < old.get('asOf', ''): reject('Régression de la période active')
            if family == 'prices':
                if len({max(collected[k]['values']) for k in keys}) != 1: reject('Publications prix désynchronisées')
                year = int(latest[:4])
                annual = {k: {str(y): round(sum(collected[k]['values'][f'{y}-{m:02}'] for m in range(1, 13)) / 12, 8)
                             for y in range(2010, year)} for k in keys}
                new = {'asOf': latest, 'baseYear': 2025, 'annualLevels': annual,
                       'latestLevels': {k: collected[k]['values'][latest] for k in keys},
                       'provisional': any(collected[k]['quality'][latest] == 'P' for k in keys), 'sources': collected.copy()}
                new['sources'] = {k: collected[k] for k in keys}
            else:
                k = keys[0]
                new = {'asOf': latest, 'values': collected[k]['values'], 'source': collected[k]}
            if new != old: state[family] = new
            successes.extend({'id': 'purchasing-' + k} for k in keys)
        except Exception as error:
            errors.extend({'id': 'purchasing-' + k, 'error': str(error)} for k in keys)
    state['schemaVersion'] = 1
    return state, {'checkedAt': now.isoformat(), 'successes': successes, 'errors': errors}

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--apply', action='store_true'); p.add_argument('--output', required=True, type=pathlib.Path)
    args = p.parse_args(); destination = ROOT / 'src/data/purchasing-power-observations.json'
    old = json.loads(destination.read_text()) if destination.exists() else {}
    state, report = refresh(old, dt.datetime.now(UTC))
    write_json_atomic(args.output, report)
    if args.apply and state != old: write_json_atomic(destination, state)
    print(json.dumps(report, ensure_ascii=False))
    return 1 if report['errors'] else 0

if __name__ == '__main__': raise SystemExit(main())
