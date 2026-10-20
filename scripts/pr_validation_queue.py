"""Cancel only superseded validation runs on this task's own feature branch."""
import json,os,urllib.error,urllib.request
BRANCH='feat/automation-lots-1-5'
def superseded(rows,repository,sha):
 return [r['id'] for r in rows if r.get('head_branch')==BRANCH and r.get('head_sha')!=sha
         and r.get('event') in ('push','pull_request') and r.get('status') in ('queued','pending','waiting','requested','in_progress')
         and r.get('head_repository',{}).get('full_name')==repository]
def main():
 repo=os.environ['GITHUB_REPOSITORY'];sha=os.environ['VALIDATION_HEAD_SHA'];token=os.environ['GH_TOKEN']
 def api(path,method='GET'):
  req=urllib.request.Request('https://api.github.com/repos/'+repo+path,method=method,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','User-Agent':'EpargnantLibre-validation-queue'})
  with urllib.request.urlopen(req,timeout=30)as response:
   raw=response.read();return json.loads(raw)if raw else None
 ids=[]
 for page in range(1,6):
  rows=api('/actions/runs?branch='+BRANCH+'&per_page=100&page='+str(page))['workflow_runs'];ids+=superseded(rows,repo,sha)
  if len(rows)<100:break
 for run_id in ids:
  try:api('/actions/runs/'+str(run_id)+'/cancel','POST');print('Superseded feature validation cancelled:',run_id)
  except urllib.error.HTTPError as error:
   if error.code not in (409,422):raise
if __name__=='__main__':main()
