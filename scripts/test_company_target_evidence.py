import unittest
import datetime as dt
from pathlib import Path
from company_target_evidence import parse_forecast
class TargetEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.raw=Path(__file__).with_name('source-snapshots').joinpath('company-adjusted-forecast.html').read_bytes()
        self.profile={'symbol':'AAPL','currency':'USD'}
        self.today=dt.date(2026,10,14)
    def test_visible_dated_adjusted_inputs(self):
        f=parse_forecast(self.raw,self.profile,self.today)
        self.assertEqual(f['points'][-1],{'end':'2027-09-30','eps':9.59,'kind':'estimate'})
        self.assertEqual(len(f['historicalMultiples']),5)
        self.assertEqual(f['basis'],'adjusted-non-gaap')
    def test_keeps_observed_losses_and_zero_eps_for_future_evaluation(self):
        from bs4 import BeautifulSoup
        for value in ('-1.25', '0'):
            soup=BeautifulSoup(self.raw,'html.parser')
            table=next(t for t in soup.select('table') if t.get_text(' ',strip=True).startswith('Fiscal Year'))
            eps=next(tr for tr in table.select('tr') if tr.find(['td','th']).get_text(' ',strip=True)=='EPS')
            eps.find_all(['td','th'],recursive=False)[1].string=value
            f=parse_forecast(str(soup).encode(),self.profile,self.today)
            self.assertEqual(f['points'][0]['eps'],float(value))
            self.assertEqual(f['points'][0]['kind'],'observed-adjusted')
    def test_observed_eps_survives_insufficient_multiples(self):
        from bs4 import BeautifulSoup
        soup=BeautifulSoup(self.raw,'html.parser')
        table=next(t for t in soup.select('table') if t.get_text(' ',strip=True).startswith('Fiscal Year'))
        pe=next(tr for tr in table.select('tr') if tr.find(['td','th']).get_text(' ',strip=True)=='Forward PE')
        for td in pe.find_all(['td','th'],recursive=False)[1:]:td.string='n/a'
        f=parse_forecast(str(soup).encode(),self.profile,self.today)
        self.assertEqual(f['historicalMultiples'],[])
        self.assertTrue(any(p['kind']=='observed-adjusted' for p in f['points']))
    def test_rejects_incompatible_and_stale_sources(self):
        for raw,profile,date in [(self.raw,{'symbol':'MSFT','currency':'USD'},self.today),(self.raw,{'symbol':'AAPL','currency':'EUR'},self.today),(self.raw,self.profile,dt.date(2026,12,14)),(self.raw.replace(b'non-GAAP adjusted',b'unknown'),self.profile,self.today),(self.raw.replace(b'9.59',b'Upgrade'),self.profile,self.today),(self.raw.replace(b'Last updated:',b'Last checked:'),self.profile,self.today)]:
            with self.subTest(date=date,profile=profile),self.assertRaises(ValueError):parse_forecast(raw,profile,date)
if __name__=='__main__':unittest.main()
