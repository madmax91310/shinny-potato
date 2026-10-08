import pathlib
import unittest
from collect_regulatory_data import parse

FIX=pathlib.Path(__file__).parent/'fixtures/regulatory'
class ExtendedRegulatoryTests(unittest.TestCase):
 def raw(self,name):return (FIX/f'{name}.xml').read_bytes()
 def test_scope_and_current_year(self):
  per=parse('per',self.raw('per'),'2026-10-08')['values']
  self.assertEqual(per['perMinimum'],4710)
  self.assertEqual(per['perMaximum'],37680)
  self.assertEqual(per['perTotal'],31.4)
  self.assertEqual(per['perSocial'],18.6)
  lmnp=parse('lmnp',self.raw('lmnp'),'2026-10-08')['values']
  self.assertEqual(lmnp,{'lmnpRevenueYear':2026,'lmnpCeiling':83600,'lmnpAllowance':50})
  self.assertEqual(parse('lmnp',self.raw('lmnp'),'2027-01-01')['values']['lmnpRevenueYear'],2026)
 def test_period_change_not_check_date(self):
  raw=self.raw('lmnp').decode().replace('\xa0',' ').encode().replace(b'Revenus 2026',b'Revenus 2027').replace(b'83 600',b'85 000')
  self.assertEqual(parse('lmnp',raw,'2026-10-08')['values']['lmnpCeiling'],77700)
  next_year=parse('lmnp',raw,'2027-01-01')['values']
  self.assertEqual(next_year['lmnpRevenueYear'],2027)
  self.assertEqual(next_year['lmnpCeiling'],85000)
 def test_wrong_product_and_missing_current_per_rejected(self):
  raw=self.raw('per').replace(b'PER individuel',b'PER collectif')
  with self.assertRaises(ValueError):parse('per',raw,'2026-10-08')
  raw=self.raw('per').replace('À partir de 2026'.encode(),'À partir de 2027'.encode())
  with self.assertRaises(ValueError):parse('per',raw,'2026-10-08')
 def test_changed_amounts_and_pfu_sum(self):
  raw=self.raw('pee').decode().replace('\xa0',' ').encode().replace(b'3 844,8',b'4 000,5').replace(b'3 fois',b'4 fois')
  self.assertEqual(parse('pee',raw,'2026-10-08')['values'],{'peeCeiling':4000.5,'peeMultiplier':4})
  raw=self.raw('property').decode().replace('\xa0',' ').encode().replace(b'<Valeur>19 %',b'<Valeur>20 %')
  self.assertEqual(parse('property',raw,'2026-10-08')['values']['propertyIncome'],20)
  raw=self.raw('per').decode().replace('\xa0',' ').encode().replace(b'<Valeur>31,4 %',b'<Valeur>32,4 %')
  with self.assertRaises(ValueError):parse('per',raw,'2026-10-08')

if __name__=='__main__':unittest.main()
