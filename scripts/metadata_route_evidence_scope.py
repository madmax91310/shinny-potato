"""Pre-network CI selection for isolated field routes and issuer adapters.

Compare both generators against the SAME current financial inputs. Current
receipt dates never become frozen expected test values. Any broader change
retains the existing full metadata qualification, without weakening checks.
"""
import argparse,json,os,subprocess,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ALLOWED={'scripts/build-automation-targets.mjs','scripts/instrument-metadata-supplemental-sources.json','scripts/instrument-metadata-sources.json','scripts/lib/metadata-field-routing.mjs','scripts/metadata_route_evidence_scope.py','scripts/test_metadata_route_evidence_scope.py','scripts/test_metadata_hedging_routes.py','scripts/test-automated-characteristics.mjs','scripts/test_producer_report_contract.py','.github/workflows/update-instrument-metadata.yml','docs/data-operations-coordination.md'}

def select(before,after,changed_paths):
    broad=any(p not in ALLOWED and not p.startswith('scripts/fixtures/metadata-hedging-20261102/')for p in changed_paths)
    old={r['isin']:r for r in before['instruments']};new={r['isin']:r for r in after['instruments']}
    if broad or old.keys()!=new.keys():return {'mode':'full','ids':[],'reason':'Broader source/runtime/catalogue change; existing full qualification retained'}
    ids=[]
    for isin in old:
        if old[isin]==new[isin]:continue
        a,b=old[isin],new[isin]
        if ({k:v for k,v in a.items()if k not in ('fields','urls')}!={k:v for k,v in b.items()if k not in ('fields','urls')}
            or a.get('fields')!=['listings'] or b.get('fields')!=['listings','currencyHedge']
            or b.get('urls')!=a.get('urls',[])+['https://www.justetf.com/fr/etf-profile.html?isin='+isin]):
            return {'mode':'full','ids':[],'reason':'Change is not the exact previously listing-only hedging route'}
        ids.append(isin)
    if not ids:return {'mode':'full','ids':[],'reason':'No narrow changed route established'}
    return {'mode':'targeted-field-routes','ids':sorted(ids),'fields':['listings','currencyHedge'],'reason':'Every other generated instrument and complete-holdings target is identical; scope fixed before network'}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--base',required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
    paths=subprocess.check_output(['git','diff','--name-only',args.base+'...HEAD'],cwd=ROOT,text=True).splitlines()
    targets=[ROOT/'scripts/instrument-metadata-sources.json',ROOT/'scripts/generated-holdings-sources.json'];saved={p:p.read_bytes()for p in targets}
    after=json.loads(saved[targets[0]])
    handle=tempfile.NamedTemporaryFile(dir=ROOT/'scripts',prefix='.metadata-route-baseline-',suffix='.mjs',delete=False);temporary=Path(handle.name)
    try:
        handle.write(subprocess.check_output(['git','show',args.base+':scripts/build-automation-targets.mjs'],cwd=ROOT));handle.close()
        subprocess.run(['node',str(temporary)],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
        before=json.loads(targets[0].read_bytes())
        result=select(before,after,paths)
        if result['mode']=='full' and (ROOT/'scripts/metadata_listing_evidence_scope.py').exists():
            from metadata_listing_evidence_scope import select as listing_scope
            try:
                narrow=listing_scope(before,after,paths,
                    subprocess.check_output(['git','show',args.base+':scripts/collect_instrument_metadata.py'],cwd=ROOT,text=True),
                    (ROOT/'scripts/collect_instrument_metadata.py').read_text(),
                    (ROOT/'scripts/twentyone_shares_listing.py').read_text(),
                    registry_before=json.loads(subprocess.check_output(['git','show',args.base+':scripts/listing-source-hosts.json'],cwd=ROOT,text=True)),
                    registry_after=json.loads((ROOT/'scripts/listing-source-hosts.json').read_text()),
                    consumer_before=subprocess.check_output(['git','show',args.base+':src/data/qualified-listings.js'],cwd=ROOT,text=True),
                    consumer_after=(ROOT/'src/data/qualified-listings.js').read_text())
            except (OSError,subprocess.CalledProcessError):
                narrow=None  # Missing proof cannot grant a narrower source scope.
            if narrow:result=narrow
        if targets[1].read_bytes()!=saved[targets[1]]:result={'mode':'full','ids':[],'reason':'Complete-holdings generation changed; full qualification retained'}
    finally:
        handle.close();temporary.unlink(missing_ok=True)
        for p,body in saved.items():p.write_bytes(body)
    result.update(base=args.base,declaredBeforeNetwork=True)
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(result,indent=2)+'\n')
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'],'a')as output:output.write('mode='+result['mode']+'\nids='+','.join(result['ids'])+'\n')
    print(json.dumps(result))
if __name__=='__main__':main()
