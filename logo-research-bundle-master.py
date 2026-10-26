import subprocess,json,hashlib
from pathlib import Path
root=Path('logo-research-results');root.mkdir(exist_ok=True)
subprocess.run(['git','fetch','origin','master','--depth=100'],check=True)
subprocess.run(['git','bundle','create','/tmp/logo-master-update.bundle','refs/remotes/origin/master','^93affb1d012ec8fede186784c4887dd7e486bc41'],check=True)
data=Path('/tmp/logo-master-update.bundle').read_bytes();parts=[]
for i in range(0,len(data),500000):
 p=root/f'master-update.part-{i//500000:03}';chunk=data[i:i+500000];p.write_bytes(chunk);parts.append({'file':p.name,'sha256':hashlib.sha256(chunk).hexdigest(),'bytes':len(chunk)})
(root/'master-update.json').write_text(json.dumps({'head':subprocess.check_output(['git','rev-parse','refs/remotes/origin/master'],text=True).strip(),'base':'93affb1d012ec8fede186784c4887dd7e486bc41','parts':parts,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)},indent=2)+'\n')
