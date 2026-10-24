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
from publish_automation_status import artifact_reports, attempt_artifacts, download_status_artifact, update_status, technical_proof, REGISTRY
from automation_monitoring import timestamp


if __name__ == '__main__':
    entries = json.loads(Path(sys.argv[1]).read_text())
    rows = []
    for entry in entries:
        directory = Path(entry['directory'])
        run = json.loads((directory / 'run.json').read_text())
        jobs = json.loads((directory / 'jobs.json').read_text())['jobs']
        available = json.loads((directory / 'artifacts.json').read_text())['artifacts']
        artifacts = attempt_artifacts(available, run) if run['status']=='completed' else [a for a in available
            if timestamp(run['run_started_at']) <= timestamp(a['created_at']) <= dt.datetime.now(dt.timezone.utc)]
        selected = next(a for a in artifacts if a['id'] == entry['artifact'])
        def download(repo, artifacts, name, target):
            def local_bytes(*args, **kwargs):
                return subprocess.CompletedProcess(args[0], 0, (directory / 'artifact.zip').read_bytes())
            return download_status_artifact(repo, [selected], name, target, runner=local_bytes)
        with tempfile.TemporaryDirectory() as target:
            reports = artifact_reports('madmax91310/shinny-potato', entry['workflow'], jobs, [selected], target, download)
        state = update_status({}, run, jobs, reports)
        observed = state.get('workflows',{}).get(entry['workflow'])
        if observed is None:
            # A completed source phase is not an invented completed workflow.
            config=REGISTRY[entry['workflow']]
            steps=[s for j in jobs if j['name']==config['collectionJob'] for s in j.get('steps',[])]
            def phase(names):
                conclusions=[s.get('conclusion')for s in steps if s['name']in names]
                return 'failure'if any(v in ('failure','timed_out')for v in conclusions)else'success'if conclusions and all(v=='success'for v in conclusions)else'pending'
            errors=[e for r in reports for e in r.get('errors',[])]
            observed={'collectionStatus':phase(config['collectionSteps']),'validationStatus':phase(config['validationSteps']),
                'recordingStatus':phase(['Commit validated observations']),'publicationStatus':'pending',
                'dataFailures':{e['id']:e for e in errors if not technical_proof(e['id'])},
                'proofFailures':{e['id']:e for e in errors if technical_proof(e['id'])},
                'reportQualifications':{r['_reportEvidence']['file']:r['_scopeWarning']for r in reports if r.get('_scopeWarning')},
                'reportEvidenceHistory':[r['_reportEvidence']for r in reports if r.get('_reportEvidence')]}
        rows.append({'workflow': entry['workflow'], 'runId': run['id'], 'attempt': run.get('run_attempt', 1),
                     'runUrl': run['html_url'], 'runStatus':run['status'], 'runConclusion': run['conclusion'], 'completedAt': run['updated_at']if run['status']=='completed'else None,
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
