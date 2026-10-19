"""Evidence of the exact validated files recorded by a collector and built into Pages."""
import argparse
import hashlib
import fnmatch
import json
import pathlib
import re
import shlex
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
MANIFEST = 'public/data/publication-manifest.json'


def publication_paths(root=ROOT):
    """The same explicit paths collectors publish, plus historical manifest roots."""
    paths = {'src/data', 'scripts/source-snapshots', 'public/data'}
    for workflow in (root / '.github/workflows').glob('*.yml'):
        for match in re.finditer(r'commit-validated-data\.sh\s+([^\n]+)', workflow.read_text()):
            tokens = shlex.split(match[1])
            paths.update(token for token in tokens[1:] if not token.startswith(('$', '-')))
    return sorted(paths)


def matches(path, patterns):
    return any(fnmatch.fnmatchcase(path, pattern) if '*' in pattern else
               path == pattern or path.startswith(pattern.rstrip('/') + '/') for pattern in patterns)


def is_publication_data(path):
    return (path.startswith(('src/data/', 'scripts/source-snapshots/', 'public/data/'))
            or path.startswith('src/pages/') and path.endswith('.json')) and path != MANIFEST


def git(*args):
    return subprocess.check_output(['git', *args])


def tracked(commit, paths):
    rows = git('ls-tree', '-r', '-z', commit).split(b'\0')
    return {path.decode(): meta.decode().split()[2] for row in rows if row
            for meta, path in [row.split(b'\t', 1)]
            if meta.split()[1] == b'blob' and is_publication_data(path.decode()) and matches(path.decode(), paths)}


def manifest():
    files = {}
    for name in tracked('HEAD', publication_paths()):
        path = pathlib.Path(name)
        if path.is_file():
            body = path.read_bytes()
            files[name] = hashlib.sha1(b'blob ' + str(len(body)).encode() + b'\0' + body).hexdigest()
    return {'schemaVersion': 1, 'files': files}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('mode', choices=['manifest', 'receipt'])
    p.add_argument('--commit')
    p.add_argument('--all', action='store_true', help='Include every configured publication data path')
    p.add_argument('--output', required=True, type=pathlib.Path)
    args, paths = p.parse_known_args()
    if paths[:1] == ['--']:
        paths = paths[1:]
    if args.all:
        paths = publication_paths()
    if args.mode == 'receipt':
        if not args.commit or not paths:
            p.error('Receipt requires the recorded commit and validated paths')
        result = {'schemaVersion': 1, 'commit': args.commit, 'files': tracked(args.commit, paths)}
    else:
        result = manifest()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, sort_keys=True) + '\n')


if __name__ == '__main__':
    main()

