"""Allow revalidation only across explicitly independent financial outputs."""
import argparse
import subprocess

INDEPENDENT = {
    'src/data/automated-insurance.json',
    'src/data/automated-broker-tariffs.json',
    'src/data/automated-regulatory.json',
}
ALLOWED = {
    'scpi': INDEPENDENT | {'src/data/anniversary-levels.json',
                         'src/data/anniversary-index-history.json',
                         'src/data/purchasing-power-observations.json',
                         'scripts/source-snapshots/anniversary-indices.json'},
    'publication': INDEPENDENT | {'src/data/automated-scpi.json'},
}


def check(kind, base, upstream):
    paths = subprocess.check_output(
        ['git', 'diff', '--name-only', '--no-renames', '-z', base, upstream],
        text=True).split('\0')
    blocked = sorted(p for p in paths if p and p not in ALLOWED[kind])
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
