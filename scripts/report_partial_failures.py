"""Make a partial collection failure visible in the run itself.

A collector that keeps the last validated values for part of its scope still
succeeds as a step. This reads its observation reports with the same rules as the
automation status, writes ``failed=true`` to GITHUB_OUTPUT when any source is in
error, and lists the causes in the step summary. The workflow's ``report-failures``
job then fails the run without blocking the validated publication.

Usage: python scripts/report_partial_failures.py REPORT.json [REPORT.json...]
"""
import json
import os
import pathlib
import sys

from publish_automation_status import normalize_report


def partial_failures(paths):
    errors = []
    for path in map(pathlib.Path, paths):
        if not path.exists():
            errors.append(f'{path.name} : rapport de collecte attendu absent ; aucune réussite source démontrée')
            continue
        try:
            report = json.loads(path.read_text())
            if not isinstance(report,dict):raise ValueError('racine non structurée')
            report['_collector'] = path.stem
            normalized=normalize_report(report)
            if not any(key in normalized for key in ['successes','errors','inactive']):raise ValueError('format de résultat inconnu')
            errors.extend(f"{row.get('id')} : {row.get('error')}" for row in normalized.get('errors', []))
        except (ValueError,TypeError,KeyError)as error:
            errors.append(f'{path.name} : contrat de résultat invalide : {error}')
    return errors


def main(paths):
    errors = partial_failures(paths)
    line = f"failed={'true' if errors else 'false'}"
    output = os.environ.get('GITHUB_OUTPUT')
    if output:
        with open(output, 'a', encoding='utf-8') as handle:
            handle.write(line + '\n')
    print(line)
    if errors:
        text = '\n'.join(['## Échecs partiels de collecte', '', 'Les dernières valeurs validées sont conservées pour ces sources.', '', *(f'- {row}' for row in errors[:50])])
        print(text)
        summary = os.environ.get('GITHUB_STEP_SUMMARY')
        if summary:
            with open(summary, 'a', encoding='utf-8') as handle:
                handle.write(text + '\n')
    else:
        print('Aucun échec partiel.')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
