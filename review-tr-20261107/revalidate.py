"""Read-only TR probe through the production collector; never writes observations."""
import copy
import datetime as dt
import hashlib
import json
import pathlib
import sys
import threading
from unittest.mock import patch
from urllib.parse import urlparse

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import collect_broker_tariffs as collector

EXPECTED = {'tr', 'tr_direct', 'tr_garde_cto', 'tr_transfer_cto',
            'tr:profile:dca', 'tr:profile:pme', 'tr:profile:change', 'tr:profile:garde'}
today = dt.datetime.now(dt.timezone.utc).date().isoformat()
baseline = json.loads((ROOT / 'src/data/automated-broker-tariffs.json').read_text())
before = copy.deepcopy(baseline['brokers']['tr'])
receipts = []
lock = threading.Lock()
original_download = collector.download


def download(url, **kwargs):
    started = dt.datetime.now(dt.timezone.utc).isoformat()
    try:
        result = original_download(url, **kwargs)
        raw, actual = result if isinstance(result, tuple) else (result, url)
        row = {'url': url, 'checkedAt': started, 'actualUrl': actual,
               'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest(),
               'download': 'success'}
    except Exception as error:
        row = {'url': url, 'checkedAt': started, 'error': str(error)}
        raise
    finally:
        with lock:
            receipts.append(row)
    return result


def only_tr(url):
    if urlparse(url).hostname not in ('support.traderepublic.com', 'assets.traderepublic.com'):
        raise ValueError('Outside targeted TR probe; not a production failure')
    return collector.fetch_content(url)


with patch.object(collector, 'download', side_effect=download):
    result, failures, valid = collector.collect(copy.deepcopy(baseline), today, only_tr)
tr_failures = {key: value for key, value in failures.items()
               if key == 'tr' or key.startswith(('tr_', 'tr:'))}
after = result['brokers']['tr']
report = {'checkedAt': today, 'mode': 'targeted read-only; no --apply',
          'expectedEntries': sorted(EXPECTED),
          'trFailures': tr_failures, 'tariffValidated': 'tr' in valid,
          'receipts': receipts, 'before': before, 'after': after}
destination = pathlib.Path(__file__).with_name('revalidation-20261112.json')
destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'trFailures': tr_failures, 'tariffValidated': 'tr' in valid,
                  'downloads': len(receipts), 'report': str(destination)}, ensure_ascii=False))
sys.exit(bool(tr_failures) or 'tr' not in valid)
