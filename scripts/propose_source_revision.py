"""Open one pull request per official source whose wording changed.

The monitoring files a changed broker clause or contract title as a 'review'
incident, with the original wording and the closest current passage. This script
turns each into a pull request that adds the new wording to
scripts/accepted-source-wording.json. Merging it is the human validation: the
collector then accepts the new wording and the incident closes on its next run.
Nothing is accepted without that merge.
"""
import base64
import hashlib
import json
import os
import re
import urllib.error
import urllib.request

PATH = 'scripts/accepted-source-wording.json'
CLAUSE = re.compile(r'Clause officielle absente ou modifiée : (?P<pattern>.+?) \| Passage actuel le plus proche : « (?P<text>.+?) »$', re.S)
TITLE = re.compile(r'Wrong contract identity \| attendu : « (?P<expected>.+?) » ; titre actuel : « (?P<title>.+?) »')


def proposal(incident):
    """(kind, key, value, summary) for a review incident whose evidence is complete."""
    cause = incident.get('cause', '')
    if (m := CLAUSE.search(cause)) and len(m['text'].split()) >= 5:
        return 'clauses', m['pattern'], m['text'], (f"Clause attendue : `{m['pattern']}`", f"Texte actuel : « {m['text']} »")
    if (m := TITLE.search(cause)) and m['title'] != 'absent' and incident.get('dataId'):
        return 'titles', incident['dataId'], m['title'], (f"Titre attendu : « {m['expected']} »", f"Titre actuel : « {m['title']} »")
    return None


def apply(accepted, kind, key, value, today):
    result = json.loads(json.dumps(accepted))
    bucket = result.setdefault(kind, {})
    if kind == 'clauses':
        if any(entry['text'] == value for entry in bucket.get(key, [])):
            return None
        bucket.setdefault(key, []).append({'text': value, 'proposedAt': today})
    else:
        if value in bucket.get(key, []):
            return None
        bucket.setdefault(key, []).append(value)
    return result


def run(state, api, today):
    active = state.get('monitoring', {}).get('active', {})
    master = api('/git/ref/heads/master')['object']['sha']
    current = api(f'/contents/{PATH}?ref=master')
    accepted = json.loads(base64.b64decode(current['content']))
    opened = []
    for incident in active.values():
        if incident.get('kind') != 'review' or not (found := proposal(incident)):
            continue
        kind, key, value, (before, after) = found
        updated = apply(accepted, kind, key, value, today)
        if updated is None:
            continue
        branch = 'source-revision/' + hashlib.sha256(f'{kind}:{key}:{value}'.encode()).hexdigest()[:12]
        try:
            api(f'/git/ref/heads/{branch}')
            continue  # already proposed; the open PR is the reminder
        except urllib.error.HTTPError as error:
            if error.code != 404:
                raise
        api('/git/refs', 'POST', {'ref': f'refs/heads/{branch}', 'sha': master})
        name = incident.get('name', key)
        api(f'/contents/{PATH}', 'PUT', {'message': f'Accept changed official wording: {name}', 'branch': branch, 'sha': current['sha'],
            'content': base64.b64encode((json.dumps(updated, ensure_ascii=False, indent=2) + '\n').encode()).decode()})
        body = '\n'.join([
            f"La source officielle de **{name}** a changé de formulation ; la dernière valeur validée reste publiée en attendant ta décision.",
            '', f'- {before}', f'- {after}', '',
            "**Fusionner** = le nouveau texte dit la même chose : le collecteur l'accepte et l'alerte se ferme à la prochaine collecte.",
            "**Fermer sans fusionner** = le sens a changé : la donnée doit être requalifiée (le collecteur continue de signaler le changement).",
            '', f"Incident : `{incident.get('id', key)}` · source : {incident.get('runUrl', '')}",
            '', '---', '_Proposé automatiquement par la surveillance des données._'])
        try:
            pr = api('/pulls', 'POST', {'title': f'Valider le nouveau texte officiel : {name}', 'head': branch, 'base': 'master', 'body': body})
            opened.append(pr.get('html_url', branch))
        except urllib.error.HTTPError as error:
            # Repositories may forbid Actions from opening pull requests: the branch stays as the proposal.
            print(f'::warning::Proposition prête sur la branche {branch}, PR non créée (HTTP {error.code}).')
            opened.append(branch)
    return opened


def main():
    import datetime as dt
    import pathlib
    token, repo = os.environ['GH_TOKEN'], os.environ['GITHUB_REPOSITORY']
    def api(path, method='GET', data=None):
        request = urllib.request.Request(f'https://api.github.com/repos/{repo}{path}', method=method,
            data=json.dumps(data).encode() if data is not None else None,
            headers={'Authorization': f'Bearer {token}', 'Accept': 'application/vnd.github+json', 'User-Agent': 'EpargnantLibre-Automation', 'Content-Type': 'application/json'})
        with urllib.request.urlopen(request, timeout=25) as response:
            return json.load(response)
    status = api('/contents/automation-status.json?ref=automation-status')
    state = json.loads(base64.b64decode(status['content'])) if status.get('content') else json.loads(base64.b64decode(api(f"/git/blobs/{status['sha']}")['content']))
    from automation_status_storage import decode_status
    opened = run(decode_status(state), api, dt.date.today().isoformat())
    print(f'Propositions de texte officiel : {len(opened)}', *opened, sep='\n')


if __name__ == '__main__':
    main()
