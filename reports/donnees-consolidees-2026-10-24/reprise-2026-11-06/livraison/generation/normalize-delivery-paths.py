import pathlib
R=pathlib.Path('/tmp/automation-20261106');replacements={str(R/'proofs')+'/':'preuves/',**{str(R/n)+'/':'captures/'+n+'/'for n in ['public-initial','public-final','public-after-first-three']}}
for p in (R/'livraison').iterdir():
 if p.suffix not in ['.csv','.md','.json']:continue
 s=p.read_text(encoding='utf-8-sig')
 for a,b in replacements.items():s=s.replace(a,b)
 p.write_text(s,encoding='utf-8-sig'if p.suffix=='.csv'else'utf-8')
print('Delivery proof paths normalized; financial values untouched')
