import pathlib,json,sys,concurrent.futures
from issuer_documents import download
P=pathlib.Path('reports/corrections-2026-10-22/preuves')
urls={
'bd-catalogue':'https://www.boursedirect.fr/fr/formulaires-en-ligne',
'bd-tarifs':'https://www.boursedirect.fr/fr/tarifs',
'bd-pdf':'https://www.boursedirect.fr/pdf/tarifs_bd.pdf',
'amundi-gold':'https://www.amundietf.fr/fr/particuliers/produits/commodities/amundi-physical-gold-etc-c/fr0013416716',
'ibkr-law':'https://bofip.impots.gouv.fr/bofip/1556-PGP.html',
}
def one(item):
 k,url=item
 try:
  body=download(url,max_bytes=12000000);(P/(k+('.pdf'if body.startswith(b'%PDF')else'.html'))).write_bytes(body);return {'id':k,'url':url,'ok':True,'bytes':len(body)}
 except Exception as e:return {'id':k,'url':url,'ok':False,'error':str(e)}
rows=list(concurrent.futures.ThreadPoolExecutor(max_workers=3).map(one,urls.items()));(P/'voies-officielles.json').write_text(json.dumps(rows,indent=2));print(rows)
