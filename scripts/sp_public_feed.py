"""Validated handoff of exact official S&P responses to restricted CI runners.

The effective composition date and the actual retrieval time are independent.
An expired handoff is an error, never a successful refresh of cached data.
"""
import argparse
import base64
import datetime as dt
import json
import gzip
import pathlib
from data_automation import UTC, reject
from issuer_documents import download, proof

ROOT = pathlib.Path(__file__).resolve().parents[1]
FEED = ROOT / 'scripts/observations/sp-public-feed.json'


def official_response(config):
    return download(config['compositionDataUrl'], max_bytes=4_000_000, headers={
        'Accept': 'application/json', 'Referer': config['compositionPageUrl'],
        'User-Agent': 'Mozilla/5.0'})


def read_response(config, now, path=FEED):
    from collect_sp_composition import parse_public_data
    if path.stat().st_size > 12_000_000: reject('S&P handoff exceeds size limit')
    feed = json.loads(path.read_text())
    if feed.get('schemaVersion') != 1: reject('Unknown S&P handoff version')
    row = feed['observations'][config['id']]
    stamp = dt.datetime.fromisoformat(row['retrievedAt'])
    if stamp.tzinfo is None or not dt.timedelta(0) <= now - stamp <= dt.timedelta(hours=48):
        reject('S&P official handoff expired or future: retrieval must be within 48h')
    if row['sourceUrl'] != config['compositionDataUrl']: reject('Wrong S&P handoff source')
    body = base64.b64decode(row['bodyBase64'], validate=True)
    if len(body) > 4_000_000 or proof(body) != row['sha256']: reject('S&P handoff checksum/size mismatch')
    facts = parse_public_data(body, config, now)
    facts['source']['retrievedAt'] = stamp.isoformat()
    facts['source']['transport'] = 'official-response-handoff'
    return facts


def refresh(configs, now, path=FEED, fetch=official_response):
    from collect_sp_composition import parse_public_data
    # Both responses must validate before the atomic write. Failed retrievals
    # leave the old timestamps unchanged so expiry remains visible to CI.
    observations = {}
    for config in configs:
        if not config.get('compositionDataUrl'): continue
        body = fetch(config)
        facts = parse_public_data(body, config, now)
        body = gzip.compress(body, mtime=0)  # Lossless original response, compact handoff.
        observations[config['id']] = {'sourceUrl': config['compositionDataUrl'],
            'retrievedAt': now.isoformat(), 'sha256': proof(body),
            'bodyBase64': base64.b64encode(body).decode('ascii')}
        print(config['id'], facts['asOf'], facts['constituents'], len(facts['holdings']))
    if len(observations) != 2: reject('Expected both S&P Dividend Aristocrats responses')
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps({'schemaVersion': 1, 'observations': observations}, indent=2) + '\n')
    temporary.replace(path)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=pathlib.Path, default=FEED)
    args = parser.parse_args()
    configs = json.loads((ROOT / 'scripts/index-automation.json').read_text())['indices']
    refresh(configs, dt.datetime.now(UTC), args.output)
