"""PR gate: tolerate only identical pre-existing source failures; reject new ones.

The collector still exits nonzero and the production failure report remains red.
This gate separates a known source qualification gap from a regression introduced
by a PR, without suppressing the source diagnostic or manufacturing evidence.
"""
import argparse,json
from pathlib import Path

def validate(report,previous,configured):
    updated=report.get('updated',[]);errors=report.get('errors',[])
    failed=[e['id'].removeprefix('dca-holdings:') for e in errors]
    if len(set(updated))!=len(updated) or len(set(failed))!=len(failed) or set(updated)&set(failed):
        raise ValueError('Duplicate or contradictory collection outcome')
    if set(updated)|set(failed)!=set(configured):raise ValueError('Incomplete collection outcomes')
    for row,isin in zip(errors,failed):
        prior=previous.get(isin,{})
        if prior.get('status')!='failed' or prior.get('error')!=row.get('error'):
            raise ValueError(f'New source failure: {isin}: {row.get("error")}')
    return {'updated':len(updated),'knownFailures':len(errors)}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('report',type=Path);p.add_argument('previous',type=Path);a=p.parse_args()
    read=lambda path:json.loads(Path(path).read_text())
    configured={**read('scripts/dca-complete-holdings-sources.json'),**read('scripts/generated-holdings-sources.json')}
    print(json.dumps(validate(read(a.report),read(a.previous),configured)))
