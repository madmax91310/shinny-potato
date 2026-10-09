import copy
import datetime as dt
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch
from PIL import Image,ImageDraw
from corum_vector_ocr import read_page,period,country_rows,recognize,signature,agree
ROOT=pathlib.Path(__file__).parent/'fixtures/corum'
TODAY=dt.date(2026,10,9)
class VectorReaderTests(unittest.TestCase):
 def test_real_printed_values_at_two_resolutions(self):
  templates=json.loads((ROOT/'vector-labels.json').read_text());oracle=json.loads((ROOT.parent.parent/'corum-quarterly-qualified.json').read_text())
  for product in ('origin','xl'):
   readings=[]
   for dpi in (250,300):
    with tempfile.TemporaryDirectory() as d:
     values=read_page(Image.open(ROOT/f'vector/{product}-{dpi}.png'),templates[str(dpi)],d,dpi)
    readings.append(values)
   self.assertEqual(readings[0],readings[1]);self.assertEqual(readings[0]['countries'],oracle['corum-'+product]['countries']);self.assertEqual(readings[0]['sectors'],oracle['corum-'+product]['sectors']);self.assertEqual(readings[0]['portfolio'],oracle['corum-'+product]['portfolio'])
 def test_labels_are_recognized_instead_of_assuming_row_order(self):
  image=Image.open(ROOT/'vector/origin-250.png').convert('RGB');rows=country_rows(image);a,b=rows[0],rows[1];w=image.width
  # Swap printed country labels only. Values remain on their original lines.
  x=round(w*.058)
  image.paste('white',(x,a[1][0],round(w*.145),a[1][1]));image.paste('white',(x,b[1][0],round(w*.145),b[1][1]))
  image.paste(b[0],(x,a[1][0]));image.paste(a[0],(x,b[1][0]))
  templates=json.loads((ROOT/'vector-labels.json').read_text())['250']
  with tempfile.TemporaryDirectory() as d:values=read_page(image,templates,d,250)
  self.assertEqual(values['countries'][0],{'label':'Italie','value':27});self.assertEqual(values['countries'][1],{'label':'Pays-Bas','value':16})
 def test_missing_unknown_or_duplicate_label_fails(self):
  templates=json.loads((ROOT/'vector-labels.json').read_text())['250'];original=Image.open(ROOT/'vector/origin-250.png').convert('RGB');rows=country_rows(original);w=original.width
  for mode in ('missing','unknown','duplicate'):
   image=original.copy();top,bottom=rows[0][1];bounds=(round(w*.058),top,round(w*.145),bottom);image.paste('white',bounds)
   if mode=='unknown':ImageDraw.Draw(image).text((bounds[0]+3,top),'UNKNOWN',fill='black')
   if mode=='duplicate':image.paste(rows[1][0],bounds[:2])
   with tempfile.TemporaryDirectory() as d:
    with self.assertRaises(ValueError):read_page(image,templates,d,250)
 def test_disagreement_is_not_averaged(self):
  a=('2026-06-30',{'countries':[{'label':'Pays-Bas','value':27}]})
  b=copy.deepcopy(a);b[1]['countries'][0]['value']=28
  with self.assertRaises(ValueError):agree([a,b])
  with self.assertRaises(ValueError):agree([a])
  self.assertEqual(agree([a,copy.deepcopy(a)]),a)
 def test_new_period_is_not_limited_to_the_qualified_pdf_hash(self):
  url='https://www.corum.fr/sites/default/files/2026-10/CORUM Origin-2026-T3.pdf'
  self.assertEqual(period('3ème TRIMESTRE 2026 / DONNÉES AU 30 SEPTEMBRE 2026',url,TODAY),'2026-09-30')
  for text,link,day in [('2ème TRIMESTRE 2026 / DONNÉES AU 30 SEPTEMBRE 2026',url,TODAY),('DONNÉES AU 30 JUIN 2026',url,TODAY),('DONNÉES AU 30 SEPTEMBRE 2026',url,dt.date(2026,9,1)),('DONNÉES AU 30 SEPTEMBRE 2026',url.replace('T3','T4'),TODAY)]:
   with self.assertRaises(ValueError):period(text,link,day)
if __name__=='__main__':unittest.main()
