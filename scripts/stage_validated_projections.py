"""Stage only explicitly owned, recomputed projections in a private publication tree."""
import fnmatch,json,os,pathlib,subprocess

def stage(patterns,declared):
    if not isinstance(declared,list)or not declared or any(not isinstance(p,str)or p.startswith('/')or'..'in pathlib.PurePosixPath(p).parts for p in declared):raise ValueError('Invalid derived projection paths')
    for path in declared:
        if not any(path==p or path.startswith(p.rstrip('/')+'/')or fnmatch.fnmatchcase(path,p)for p in patterns):raise ValueError('Projection outside producer ownership: '+path)
    changed=subprocess.check_output(['git','diff','--name-only','-z','HEAD'],text=True).split('\0')
    forbidden=[p for p in changed if p and p not in declared]
    if forbidden:raise ValueError('Preparation modified non-projection files: '+', '.join(forbidden))
    if any(p for p in changed):
        subprocess.run(['git','add','--',*declared],check=True)
        subprocess.run(['git','commit','--amend','--no-edit'],check=True)
        return True
    return False
if __name__=='__main__':
    import sys
    stage(sys.argv[1:],json.loads(os.environ['VALIDATED_DATA_DERIVED_PATHS']))
