"""Allow revalidation only across explicitly independent financial outputs."""
import argparse
import copy
import datetime as dt
import json
import re
import subprocess

INDEPENDENT = {
    'src/data/automated-insurance.json',
    'src/data/automated-broker-tariffs.json',
    'src/data/automated-regulatory.json',
}
# Gold is read by monthly projection builders, not by their network collectors.
# Its new validated registry requires regeneration + financial checks; publication
# observations do collect from it and must still recollect after any change.
MARKET_PROJECTION_INPUTS = {'src/data/worldbank-gold-monthly.json'}
# These exact downstream readers are not market acquisition inputs (Radar
# incident 40178244234 after #945; investment image incident40483935988). Its prepare
# and validation hooks still rebuild projections and check the combined tree.
# Do not generalise this to collector code, configurations or other producers.
MARKET_READER_ONLY_CHANGES = {
    # Refusal41496015949 after#1160: budget prose/provenance and its exact
    # review fixtures are downstream of monthly acquisition and baselines.
    # Preserve the new prose; rebuild and financially validate the merged tree.
    # No budget data, calculation code or neighbouring configuration is allowed.
    'docs/budget-editorial-polish-2026-11-02.csv',
    'docs/budget-editorial-polish-2026-11-02.md',
    'scripts/fixtures/budget-editorial/before-2026-11-02.json',
    'scripts/test-budget-editorial-context.mjs',
    'src/pages/budget-profiles/publication-context.json',
    # Actual refusal41338564974 after#1120: this independent private CRUD service
    # only consumes the already published tweet catalog. Market acquisition and
    # baseline exports neither import it nor fetch its authenticated endpoints.
    # The three related#1124 client/CI files have the same audited one-way scope.
    # Exact files only; merged-tree preparation/financial checks remain mandatory.
    'services/tweet-bank-private/README.md',
    'services/tweet-bank-private/tests/api.mjs',
    'services/tweet-bank-private/worker/index.js',
    'services/tweet-bank-private/worker/page.js',
    'services/tweet-bank-private/tests/browser.mjs',
    'services/tweet-bank-private/scripts/preview.mjs',
    '.github/workflows/test-tweet-bank-private.yml',
    # Actual refusal40884415624 after #1043: these exact downstream proof
    # readers/fixtures and their regressions are not monthly acquisition inputs.
    # Keep regeneration and financial validation on the combined tree mandatory.
    'docs/data-operations-coordination.md',
    'scripts/fixtures/qualified-monthly-return-resolutions-20261029.json',
    'scripts/test-bdf-debt-charts.mjs',
    'scripts/lib/radar-queue.mjs',
    'scripts/test-radar-requalification-queue.mjs',
    'scripts/test-monthly-return-resolution.mjs',
    'scripts/test-review-inbox.mjs',
    'scripts/test_automation_monitoring.py',
    'src/pages/data-review/review-causes.js',
    'src/pages/data-review/review-inbox.js',
    'docs/editorial-radar-couverture-2026-10-25.md',
    'scripts/lib/radar-consumer.mjs',
    'scripts/lib/radar-publications.mjs',
    'scripts/test-radar-coverage.mjs',
    # #998 changed only the downstream investment PNG renderer and its isolated
    # read-only CI. The market acquisition chain never imports these modules.
    # Rebuild/financial validation of the combined tree remains mandatory.
    '.github/workflows/investment-image-check.yml',
    'scripts/test-export-copy.mjs',
    'scripts/test-investment-emerald.mjs',
    'src/pages/investment-calculator/editorialArt.js',
    'src/pages/investment-calculator/imageExport.js',
    # Actual refusal40532881822: these consumer regressions and practical
    # documentary receipts are not inputs of monthly/ranking acquisition.
    # Their latest tree must still pass projection + financial validation.
    'scripts/playwright-acwi-allocation-recovery.mjs',
    'scripts/test_metadata_listing_retention.py',
    'src/data/automated-practical-sheets.json',
    # Exact render-only resource introduced by concurrent PR1009.
    'public/asset-art/investment-obsidian/gold.webp',
    # Actual refusal40743703455: 13F presentation outputs and an isolated
    # non-financial UI stylesheet are not read by market acquisition/baselines.
    # No directory glob: every other investor file/CSS remains unqualified.
    # Rebase still rebuilds projections and reruns the full financial controls.
    'public/data/investors/ackman.json',
    'public/data/investors/review-metadata.json',
    'src/pages/hey-grok/App.css',
}
# The ETF acquisition chain and its baseline do not read these exact producer
# outputs (SCPI race40834040536; publication race40849049401).
# Coverage reports/build do: regenerate and validate those on the merged tree.
# Keep this narrower than INDEPENDENT; other outputs have not been qualified.
# Run41127528853 refused only the actor presentation output. Neither the ETF
# collectors nor their baseline read it; combined-tree financial validation and
# report regeneration remain mandatory. Actor code/config changes stay protected.
# Run41600148933 refused after the independent World Bank writer239f4c9.
# ETF acquisition/baselines do not read this exact monthly gold registry.
# Keep the newer gold source receipt and rebuild/revalidate all consumers;
# publication/anniversary acquisition still treats it as a protected input.
ETF_INDEPENDENT = {'src/data/worldbank-gold-monthly.json',
                   'src/data/automated-presentation-actors.json',
                   'src/data/automated-insurance.json', 'src/data/automated-scpi.json',
                   'src/data/anniversary-levels.json', 'src/data/purchasing-power-observations.json',
                   'src/data/automated-broker-tariffs.json', 'src/data/automated-regulatory.json'}
# This saved INSEE source receipt is not read by actor, anniversary or monthly
# acquisition. The active inflation-monthly.js remains a protected input.
INFLATION_RECEIPT = 'scripts/source-snapshots/inflation-automated.json'
ALLOWED = {
    # Actual recording refusal41370892678: these ten exposure outputs are
    # not read by collect_presentation_actors or its source helpers. They are
    # downstream inputs of the combined build, which must be revalidated.
    # Exact paths only: actor data, source code, freshness policy and any
    # other projection remain protected and require fresh acquisition.
    'actors': {INFLATION_RECEIPT,
               'src/data/exposure-etf-expansion-records.json',
               'src/pages/dca-profiles/catalog.json',
               'src/pages/dca-profiles/exposures-extra-0.json',
               'src/pages/dca-profiles/exposures-extra-1.json',
               'src/pages/dca-profiles/exposures-extra-2.json',
               'src/pages/dca-profiles/exposures.json',
               'src/pages/dca-profiles/holdings-14.json',
               'src/pages/dca-profiles/holdings-28.json',
               'src/pages/dca-profiles/holdings-8.json',
               'src/pages/dca-profiles/holdings.json'},
    'etf': ETF_INDEPENDENT,
    'indices': INDEPENDENT | {'src/data/automated-scpi.json','src/data/worldbank-gold-monthly.json','src/data/purchasing-power-observations.json','src/data/anniversary-levels.json','src/data/anniversary-index-history.json','scripts/source-snapshots/anniversary-indices.json'},
    'market': {INFLATION_RECEIPT} | INDEPENDENT | MARKET_PROJECTION_INPUTS | MARKET_READER_ONLY_CHANGES | {'src/data/automated-scpi.json','src/data/exposure-etf-expansion-records.json','src/data/non-bond-monthly-records.json','src/data/non-bond-etf-records.json','src/data/non-bond-qualified-records.json','src/data/non-bond-levels.json','scripts/source-snapshots/non-bond-monthly-active.json','src/data/lifestrategy.json','src/data/automated-etf.json','src/data/automated-instrument-metadata.json','src/data/instrument-metadata-status.json','src/data/automated-presentation-actors.json','src/data/dca-complete-holdings.json','src/data/dca-holdings-status.json','src/data/purchasing-power-observations.json','src/data/anniversary-levels.json'},
    'insurance': {'src/data/worldbank-gold-monthly.json','src/data/automated-broker-tariffs.json','src/data/automated-regulatory.json','src/data/automated-scpi.json','src/data/purchasing-power-observations.json','src/data/anniversary-levels.json','src/data/anniversary-index-history.json','scripts/source-snapshots/anniversary-indices.json'},
    # Run41115036012: actor/publication observations do not feed SCPI acquisition.
    # Exact outputs only; combined-tree build, audits and non-mutation still required.
    'scpi': INDEPENDENT | {'src/data/automated-presentation-actors.json', 'src/data/worldbank-gold-monthly.json','src/data/anniversary-levels.json',
                         'src/data/anniversary-index-history.json',
                         'src/data/purchasing-power-observations.json',
                         'scripts/source-snapshots/anniversary-indices.json'},
    # Actual refusal40893319635: actor presentations are not an acquisition
    # input for INSEE observations or exact anniversary levels. Their latest
    # version must still survive the mandatory combined-tree build/audits.
    'publication': {INFLATION_RECEIPT} | INDEPENDENT | {'src/data/automated-scpi.json',
                                  'src/data/automated-presentation-actors.json',
                                  # Race41410676250: acquisition reads neither
                                  # these exact derived reports nor the other
                                  # producer's listing acquisition configuration.
                                  # Rebuild and financial checks remain mandatory.
                                  'docs/automation-gaps.json',
                                  'public/data/asset-field-coverage.json',
                                  'scripts/instrument-metadata-sources.json',
                                  # Only the explicitly consumed NAV calendars
                                  # may qualify this shared registry below.
                                  'src/data/automated-etf.json'},
}


# These registries also supply the official calendars used by the independent
# WisdomTree NAV qualifier. AUM-only publications remain independent; changing
# a used calendar, convention or identity requires fresh acquisition.
MARKET_CALENDAR_REGISTRIES = {
    'src/data/automated-etf.json', 'src/data/non-bond-etf-records.json',
    'src/data/exposure-etf-expansion-records.json',
}
MARKET_ECONOMIC_REGISTRY = 'src/data/automated-economic.json'
PUBLICATION_INDEX_REGISTRY = 'src/data/automated-indices.json'

def git_json(ref, path):
    return json.loads(subprocess.check_output(['git', 'show', f'{ref}:{path}'], text=True))


def calendar_inputs_unchanged(base, upstream, path, *, exact_share_inputs=False):
    config = git_json(base, 'scripts/monthly-automation.json')
    series = config['series']
    if not isinstance(series, list):
        raise ValueError('Invalid calendar acquisition configuration')
    consumers = [s for s in series if s.get('parser') == 'official-nav'
                 and s.get('calendarRegistry') == path]
    if not consumers:
        return True  # Legacy collectors do not acquire from this registry.
    before, after = git_json(base, path), git_json(upstream, path)
    def signature(registry, isin):
        row = registry[isin]
        performance = row['performance']
        if not isinstance(performance.get('years'), dict) or not performance['years']:
            raise ValueError('Missing calendar acquisition values')
        # Proof/control timestamps and hashes are not financial inputs. Keep
        # the original receipt dated as acquired; never borrow a newer check.
        receipts = ('checkedAt', 'sha256') if exact_share_inputs else ('checkedAt', 'asOf', 'sha256')
        calendar = {k: v for k, v in performance.items() if k not in receipts}
        if exact_share_inputs:
            # Anniversary acquisition also retains every known/unknown share
            # attribute. Only these audited non-price capabilities are separate.
            return {k: v for k, v in row.items()
                    if k not in ('aum', 'countries', 'countriesRisk', 'sectors',
                                 'holdings', 'performance')} | {'performance': calendar}
        return {key: row.get(key) for key in ('productId', 'currency')} | {'performance': calendar}
    if exact_share_inputs:
        for source in consumers:
            left, right = [r[source['isin']]['performance'] for r in (before, after)]
            if set(left) != set(right):
                return False
            for key in ('checkedAt', 'sha256'):
                if left.get(key) == right.get(key):
                    continue
                values = [left.get(key), right.get(key)]
                if key == 'sha256':
                    if any(not isinstance(v, str) or not re.fullmatch(r'[a-f0-9]{64}', v) for v in values):
                        return False
                else:
                    if any(not isinstance(v, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', v) for v in values):
                        return False
                    first, last = map(dt.date.fromisoformat, values)
                    if not first <= last <= dt.datetime.now(dt.timezone.utc).date():
                        return False
    return all(json.dumps(signature(before, s['isin']), sort_keys=True, allow_nan=False)
               == json.dumps(signature(after, s['isin']), sort_keys=True, allow_nan=False)
               for s in consumers)


def index_price_inputs_unchanged(base, upstream):
    """Keep price identity/calendars; compositions are a separate capability.

    Actual41410676250 renewed facts/returns source hashes and control times.
    Price dates, identity, units, conventions, returns and unknown fields remain
    in the signature. Composition observations are not read by the anniversary
    collectors. Never borrow any newer receipts for the acquired observations.
    """
    before, after = [copy.deepcopy(git_json(ref, PUBLICATION_INDEX_REGISTRY))
                     for ref in (base, upstream)]
    if not isinstance(before, dict) or not isinstance(after, dict) or set(before) != set(after):
        return False
    for key in before:
        if not isinstance(before[key], dict) or not isinstance(after[key], dict):
            return False
        for field in ('facts', 'returns'):
            old, new = before[key].get(field), after[key].get(field)
            if not isinstance(old, dict) or not isinstance(new, dict):
                continue  # Any structural difference stays in the full signature.
            if field == 'facts':
                # Exact capabilities only; index identity, source, provenance,
                # taxonomy and unknown additions remain protected.
                for independent in ('countries', 'sectors', 'holdings',
                                    'constituents', 'topWeight', 'asOf'):
                    old.pop(independent, None)
                    new.pop(independent, None)
            left, right = old.get('source'), new.get('source')
            if not isinstance(left, dict) or not isinstance(right, dict) or set(left) != set(right):
                continue
            for receipt in ('checkedAt', 'retrievedAt', 'sha256'):
                if receipt not in left:
                    continue
                a, b = left[receipt], right[receipt]
                if a != b:
                    if receipt == 'sha256':
                        if any(not isinstance(v, str) or not re.fullmatch(r'[a-f0-9]{64}', v) for v in (a, b)):
                            return False
                    elif receipt == 'checkedAt':
                        if any(not isinstance(v, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', v) for v in (a, b)):
                            return False
                        if not dt.date.fromisoformat(a) <= dt.date.fromisoformat(b) <= dt.datetime.now(dt.timezone.utc).date():
                            return False
                    else:
                        if any(not isinstance(v, str) or 'T' not in v for v in (a, b)):
                            return False
                        start, end = [dt.datetime.fromisoformat(v) for v in (a, b)]
                        if start.tzinfo is None or end.tzinfo is None or not start <= end <= dt.datetime.now(dt.timezone.utc):
                            return False
                del left[receipt]
                del right[receipt]
    return json.dumps(before, sort_keys=True, allow_nan=False) == json.dumps(after, sort_keys=True, allow_nan=False)


def economic_values_unchanged(base, upstream):
    """Permit receipt renewals, never a new rate, period, definition or source.

    The monthly baseline imports economic observations, including savings rates.
    Its real race41373897853 changed only existing checkedAt/sha256 fields.
    Preserve the newer receipts through rebase and require financial revalidation;
    do not copy their check dates into the observations acquired by this writer.
    """
    before = git_json(base, MARKET_ECONOMIC_REGISTRY)
    after = git_json(upstream, MARKET_ECONOMIC_REGISTRY)
    groups = {'households', 'savings', 'benchmarks'}
    if any(not isinstance(r, dict) or set(r) != groups | {'schemaVersion'}
           or type(r['schemaVersion']) is not int or r['schemaVersion'] != 1
           for r in (before, after)):
        return False
    signatures = [{}, {}]
    for group in groups:
        a, b = before[group], after[group]
        if not isinstance(a, dict) or not isinstance(b, dict) or set(a) != set(b):
            return False
        for signature in signatures:
            signature[group] = {}
        for key in a:
            old, new = a[key], b[key]
            if not isinstance(old, dict) or not isinstance(new, dict) or set(old) != set(new):
                return False
            if old.get('checkedAt') != new.get('checkedAt'):
                dates = [old.get('checkedAt'), new.get('checkedAt')]
                if any(not isinstance(d, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', d) for d in dates):
                    return False
                try:
                    first, last = map(dt.date.fromisoformat, dates)
                except ValueError:
                    return False
                if not first <= last <= dt.datetime.now(dt.timezone.utc).date():
                    return False
            if old.get('sha256') != new.get('sha256'):
                if any(not isinstance(d, str) or not re.fullmatch(r'[a-fA-F0-9]{64}', d)
                       for d in (old.get('sha256'), new.get('sha256'))):
                    return False
            for signature, record in zip(signatures, (old, new)):
                signature[group][key] = {k: v for k, v in record.items()
                                         if k not in {'checkedAt', 'sha256'}}
    # Canonical JSON preserves numeric/boolean types and rejects non-finite data.
    return (json.dumps(signatures[0], sort_keys=True, allow_nan=False)
            == json.dumps(signatures[1], sort_keys=True, allow_nan=False))


def check(kind, base, upstream):
    paths = subprocess.check_output(
        ['git', 'diff', '--name-only', '--no-renames', '-z', base, upstream],
        text=True).split('\0')
    blocked = []
    for path in filter(None, paths):
        if kind == 'publication' and path == PUBLICATION_INDEX_REGISTRY:
            try:
                if not index_price_inputs_unchanged(base, upstream):
                    blocked.append(path)
            except (KeyError, TypeError, ValueError, subprocess.CalledProcessError):
                blocked.append(path)
        elif kind == 'market' and path == MARKET_ECONOMIC_REGISTRY:
            try:
                if not economic_values_unchanged(base, upstream):
                    blocked.append(path)
            except (KeyError, TypeError, ValueError, subprocess.CalledProcessError):
                blocked.append(path)
        elif path not in ALLOWED[kind]:
            blocked.append(path)
        elif kind in ('market', 'publication') and path in MARKET_CALENDAR_REGISTRIES:
            try:
                if not calendar_inputs_unchanged(base, upstream, path,
                                                 exact_share_inputs=kind == 'publication'):
                    blocked.append(path)
            except (KeyError, TypeError, ValueError, subprocess.CalledProcessError):
                blocked.append(path)  # Unknown acquisition dependencies fail closed.
    blocked.sort()
    if blocked:
        raise ValueError('Collection inputs may have changed; recollect from master: ' + ', '.join(blocked))
    return sorted(p for p in paths if p)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--kind', choices=sorted(ALLOWED), required=True)
    p.add_argument('--base', required=True)
    p.add_argument('--upstream', default='HEAD^')
    a = p.parse_args()
    print('Qualified upstream changes; financial revalidation still required:', check(a.kind, a.base, a.upstream))

