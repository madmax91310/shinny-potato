"""Store large status documents with Git's conditional, non-forced transport.

The Contents API rejected the ordinary monitor's 62 MB request. Preserve the
exact JSON and its reservation boundary instead of dropping incidents/proofs.
Small documents keep the existing Contents API contract.
"""
import base64
from contextlib import contextmanager
import os
from pathlib import Path
import subprocess
import tempfile
from threading import Lock

ROOT = Path(__file__).resolve().parents[1]
# Transport cutover only, not a financial, retention or freshness threshold.
SMALL_ENCODED_DOCUMENT = 1024 * 1024


@contextmanager
def read_segments(branch, path, expected, repo=ROOT):
    from automation_status_segments import MAX_FILE
    ref = 'refs/heads/' + branch
    subprocess.run(['git', 'fetch', '--quiet', '--no-tags', '--depth=1', 'origin', ref],
                   cwd=repo, check=True, timeout=120, capture_output=True)
    head = subprocess.check_output(['git', 'rev-parse', 'FETCH_HEAD'], cwd=repo, timeout=10).decode().strip()
    actual = subprocess.check_output(['git', 'rev-parse', f'{head}:{path}'], cwd=repo, timeout=10).decode().strip()
    if actual != expected:
        raise ValueError('Le manifeste du moniteur a changé pendant sa lecture')
    with subprocess.Popen(['git', 'cat-file', '--batch'], cwd=repo,
                          stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL) as process:
        lock = Lock()

        def load(file):
            with lock:
                process.stdin.write(f'{head}:{file}\n'.encode())
                process.stdin.flush()
                info = process.stdout.readline().split()
                if len(info) != 3 or info[1] != b'blob' or not 0 < int(info[2]) <= MAX_FILE:
                    raise ValueError('Segment Git du moniteur absent ou invalide')
                size = int(info[2])
                result = process.stdout.read(size)
                if len(result) != size or process.stdout.read(1) != b'\n':
                    raise ValueError('Segment Git du moniteur incomplet')
                return result

        try:
            yield load, head
        finally:
            process.stdin.close()


def write_status(api, path, payload, repo=None):
    segments = payload.get('segments')
    if segments is None and len(payload['content']) <= SMALL_ENCODED_DOCUMENT:
        return api(f'/contents/{path}', 'PUT', payload)
    repo = Path(repo) if repo is not None else ROOT
    branch = payload['branch']
    if not path or path.startswith('/') or any(p in ('', '.', '..') for p in path.split('/')):
        raise ValueError('Invalid monitor file path')
    body = base64.b64decode(payload['content'], validate=True)

    def git(*args, input=None, env=None, stage='command', raw=False):
        result = subprocess.run(['git', *args], cwd=repo, input=input,
                                capture_output=True, timeout=120, env=env)
        if result.returncode:
            # Remote URLs/authentication may occur in stderr. Do not expose them.
            raise RuntimeError(f'Monitor Git {stage} refused (exit {result.returncode}); no dispatch authorized')
        output = result.stdout.decode()
        return output if raw else output.strip()

    git('check-ref-format', 'refs/heads/' + branch, stage='branch validation')
    git('fetch', '--no-tags', '--depth=1', 'origin', 'refs/heads/' + branch, stage='fetch')
    head = git('rev-parse', 'FETCH_HEAD', stage='read head')
    # Inspect the exact fetched tree, not an unbound API response or worktree.
    entry = git('ls-tree', head, '--', path, stage='read expected blob')
    current = None
    if entry:
        meta, actual_path = entry.split('\t', 1)
        mode, kind, current = meta.split()
        if actual_path != path or mode != '100644' or kind != 'blob':
            raise ValueError('Unexpected monitor file identity/mode')
    if payload.get('expectedHead', head) != head:
        raise ValueError('Monitor status changed; preserve current branch and recompute')
    if current != payload.get('sha'):
        raise ValueError('Monitor status changed; preserve current branch and recompute')
    blob = git('hash-object', '-w', '--stdin', input=body, stage='write blob')
    # A private temporary index preserves the source checkout and its index.
    with tempfile.TemporaryDirectory(prefix='automation-status-index-') as folder:
        env = {**os.environ, 'GIT_INDEX_FILE': str(Path(folder) / 'index')}
        git('read-tree', head, env=env, stage='read tree')
        index = [f'100644 {blob}\t{path}\n']
        if segments:
            from automation_status_segments import segment_path
            for segment, raw in segments.items():
                digest = Path(segment).stem
                if segment != segment_path(digest):
                    raise ValueError('Chemin de segment invalide')
                segment_blob = git('hash-object', '-w', '--stdin', input=raw, stage='write segment')
                index.append(f'100644 {segment_blob}\t{segment}\n')
        git('update-index', '--index-info', input=''.join(index).encode(), env=env, stage='update private index')
        tree = git('write-tree', env=env, stage='write tree')
    commit = git('-c', 'user.name=github-actions[bot]', '-c',
                 'user.email=41898282+github-actions[bot]@users.noreply.github.com',
                 'commit-tree', tree, '-p', head,
                 input=(payload['message'] + '\n').encode(), stage='commit')
    # No force/lease override: a concurrent advance refuses this transaction.
    # An uncertain push is never retried or followed by an unreserved dispatch.
    target = ':refs/heads/' + branch
    pushed = git('push', '--porcelain', 'origin', commit + target, stage='push', raw=True)
    # A second writer can create the identical commit. Git then reports success
    # as "up to date"; it has not acquired this writer's reservation boundary.
    # Require an acknowledged fast-forward, never authorize a duplicate POST.
    if not any(line.startswith(' \t') and line.split('\t')[1].endswith(target)
               for line in pushed.splitlines() if '\t' in line):
        raise RuntimeError('Monitor reservation was not newly recorded; recompute before dispatch')
    return {'content': {'sha': blob}, 'commit': {'sha': commit}}
