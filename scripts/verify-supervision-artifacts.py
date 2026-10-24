"""Replay downloaded ordinary Actions artifacts through the production monitor, read-only.

Input is an evidence index with workflow/run/artifact/directory and locally downloaded
run.json, jobs.json, artifacts.json and artifact.zip for each entry. No source request,
dispatch, status publication, or data modification is performed.
"""
import datetime as dt
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from publish_automation_status import artifact_reports, attempt_artifacts, download_status_artifact, update_status


if __name__ == '__main__':
    entries = json.loads(Path(sys.argv[1]).read_text())
    rows = []
    for entry in entries:
        directory = Path(entry['directory'])
        run = json.loads((directory / 'run.json').read_text())
        jobs = json.loads((directory / 'jobs.json').read_text())['jobs']
        artifacts = attempt_artifacts(json.loads((directory / 'artifacts.json').read_text())['artifacts'], run)
        selected = next(a for a in artifacts if a['id'] == entry['artifact'])
        def download(repo, artifacts, name, target):
            def local_bytes(*args, **kwargs):
                return subprocess.CompletedProcess(args[0], 0, (directory / 'artifact.zip').read_bytes())
            return download_status_artifact(repo, [selected], name, target, runner=local_bytes)
        with tempfile.TemporaryDirectory() as target:
            reports = artifact_reports('madmax91310/shinny-potato', entry['workflow'], jobs, [selected], target, download)
        state = update_status({}, run, jobs, reports)
        observed = state['workflows'][entry['workflow']]
        rows.append({'workflow': entry['workflow'], 'runId': run['id'], 'attempt': run.get('run_attempt', 1),
                     'runUrl': run['html_url'], 'runConclusion': run['conclusion'], 'completedAt': run['updated_at'],
                     'artifactId': selected['id'], 'artifactCreatedAt': selected['created_at'],
                     'collectionStatus': observed['collectionStatus'], 'validationStatus': observed['validationStatus'],
                     'recordingStatus': observed['recordingStatus'], 'publicationStatus': observed['publicationStatus'],
                     'sourceFailures': len(observed['dataFailures']), 'proofFailures': observed['proofFailures'],
                     'qualifications': observed['reportQualifications'], 'reportEvidence': observed['reportEvidenceHistory']})
    output = Path('reports/data-review-product-2026-10-24/ordinary-artifact-replay.json')
    output.write_text(json.dumps({'checkedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
                                 'productionWrites': False, 'rows': rows}, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'producers': len(rows), 'reports': sum(len(r['reportEvidence']) for r in rows),
                      'proofFailures': sum(len(r['proofFailures']) for r in rows),
                      'sourceFailures': sum(r['sourceFailures'] for r in rows)}))
    raise SystemExit(any(r['proofFailures'] for r in rows))
