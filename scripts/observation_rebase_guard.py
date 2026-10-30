"""Allow revalidation only across explicitly independent financial outputs."""
import argparse
import json
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
ETF_INDEPENDENT = {'src/data/automated-presentation-actors.json',
                   'src/data/automated-insurance.json', 'src/data/automated-scpi.json',
                   'src/data/anniversary-levels.json', 'src/data/purchasing-power-observations.json',
                   'src/data/automated-broker-tariffs.json', 'src/data/automated-regulatory.json'}
# This saved INSEE source receipt is not read by actor, anniversary or monthly
# acquisition. The active inflation-monthly.js remains a protected input.
INFLATION_RECEIPT = 'scripts/source-snapshots/inflation-automated.json'
ALLOWED = {
    'actors': {INFLATION_RECEIPT},
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
                                  'src/data/automated-presentation-actors.json'},
}


# These registries also supply the official calendars used by the independent
# WisdomTree NAV qualifier. AUM-only publications remain independent; changing
# a used calendar, convention or identity requires fresh acquisition.
MARKET_CALENDAR_REGISTRIES = {
    'src/data/automated-etf.json', 'src/data/non-bond-etf-records.json',
    'src/data/exposure-etf-expansion-records.json',
}

def git_json(ref, path):
    return json.loads(subprocess.check_output(['git', 'show', f'{ref}:{path}'], text=True))


def calendar_inputs_unchanged(base, upstream, path):
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
        return {key: row.get(key) for key in ('productId', 'currency')} | {
            'performance': {k: v for k, v in performance.items()
                            if k not in ('checkedAt', 'asOf', 'sha256')}
        }
    return all(signature(before, s['isin']) == signature(after, s['isin'])
               for s in consumers)


def check(kind, base, upstream):
    paths = subprocess.check_output(
        ['git', 'diff', '--name-only', '--no-renames', '-z', base, upstream],
        text=True).split('\0')
    blocked = []
    for path in filter(None, paths):
        if path not in ALLOWED[kind]:
            blocked.append(path)
        elif kind == 'market' and path in MARKET_CALENDAR_REGISTRIES:
            try:
                if not calendar_inputs_unchanged(base, upstream, path):
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
    print('Independent upstream outputs; financial revalidation still required:', check(a.kind, a.base, a.upstream))

