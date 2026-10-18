"""Evidence of the exact validated files recorded by a collector and built into Pages."""
import argparse
import hashlib
import json
import pathlib
import subprocess


def git(*args):
    return subprocess.check_output(['git', *args])


def tracked(commit, paths):
    rows = git('ls-tree', '-r', '-z', commit, '--', *paths).split(b'\0')
    return {path.decode(): meta.decode().split()[2] for row in rows if row
            for meta, path in [row.split(b'\t', 1)]
            if path.startswith((b'src/data/', b'scripts/source-snapshots/'))}


def manifest():
    files = {}
    for name in tracked('HEAD', ['src/data', 'scripts/source-snapshots']):
        path = pathlib.Path(name)
        if path.is_file():
            body = path.read_bytes()
            files[name] = hashlib.sha1(b'blob ' + str(len(body)).encode() + b'\0' + body).hexdigest()
    return {'schemaVersion': 1, 'files': files}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('mode', choices=['manifest', 'receipt'])
    p.add_argument('--commit')
    p.add_argument('--output', required=True, type=pathlib.Path)
    args, paths = p.parse_known_args()
    if paths[:1] == ['--']:
        paths = paths[1:]
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
