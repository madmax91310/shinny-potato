"""Real issuer Q3 documents: no renormalisation or inferred corporate action."""
import copy
import datetime as dt
import gzip
import json
import re
from pathlib import Path
import unittest
from collect_atland_scpi import parse_epargne
from collect_extended_scpi import parse_transitions, bulletin_calendar
from collect_scpi import validate, refresh

FIX = Path(__file__).parent/'fixtures/scpi-q3-20261030'
TODAY = dt.date(2026,10,30)
TRANSITIONS = 'https://www.arkea-reim.com/upload/docs/application/pdf/2026-10/te_t3-2026.pdf'
EPARGNE = 'https://atland-voisin.com/wp-content/uploads/2026/10/BPI3T2026-EP-vdef-web.pdf'
ANNUAL = 'https://atland-voisin.com/wp-content/uploads/2026/05/ATLAND_RA_Epargne_Pierre_2025_OPTI_compresse.pdf'

def bbox(name):return json.loads(gzip.decompress((FIX/(name+'-bbox.json.gz')).read_bytes()))

class ActualQuarterlyBulletins(unittest.TestCase):
    def transitions(self,pages=None):
        r=parse_transitions((FIX/'transitions.txt').read_text(),bbox('transitions')if pages is None else pages,
                            (FIX/'transitions-note.txt').read_text(),TRANSITIONS,TODAY)
        r['id']='transitions-europe';r['checkedAt']=TODAY.isoformat()
        r['snapshotPublication']=bulletin_calendar(TRANSITIONS,r'te_(?:t(?P<quarter>\d)|s(?P<semester>\d))[-_](?P<year>\d{4})',r['snapshot']['asOf'])
        return r

    def epargne(self,text=None,today=TODAY):
        r=parse_epargne((FIX/'epargne.txt').read_text()if text is None else text,bbox('epargne'),
            (FIX/'epargne-annual.txt').read_text(),EPARGNE,ANNUAL,today,
            gzip.decompress((FIX/'epargne-product.html.gz').read_bytes()).decode())
        r['id']='epargne-pierre';r['checkedAt']=today.isoformat();return r

    def test_eight_countries_include_published_switzerland_without_normalising(self):
        r=self.transitions();validate(r,TODAY)
        self.assertEqual({x['label']:x['value']for x in r['snapshot']['countries']},
            {'Espagne':29,'Allemagne':22,'Italie':14,'Pays-Bas':11,'Irlande':10,'Pologne':6,'Suisse':5,'Belgique':3})
        self.assertEqual(sum(x['value']for x in r['snapshot']['countries']),100)
        self.assertEqual(r['snapshot']['asOf'],'2026-09-30')
        self.assertEqual(r['snapshotPublication']['periodMonths'],3)
        self.assertIsNone(r['snapshotPublication']['issuerPublicationDeadline'])

    def test_omitted_country_fails_same_existing_total_guard(self):
        pages=bbox('transitions')
        for p in pages:p['words']=[w for w in p['words']if w['text']!='Suisse']
        with self.assertRaisesRegex(ValueError,'sum to 100'):validate(self.transitions(pages),TODAY)

    def test_current_split_price_frequency_and_occupancy_remain_distinct(self):
        r=self.epargne();validate(r,TODAY)
        self.assertEqual(r['price']['value'],20.8)
        self.assertEqual(r['price']['asOf'],'2026-07-01')
        self.assertEqual(r['snapshot']['asOf'],'2026-09-30')
        self.assertEqual(r['portfolio']['occupancy']['value'],94.05)
        self.assertEqual(r['conditions']['frequency'],'trimestriels')
        a=r['priceHistory']['corporateActions'];self.assertEqual(len(a),1)
        self.assertEqual((a[0]['ratio'],a[0]['oldPrice'],a[0]['newPrice']),(10,208,20.8))
        self.assertEqual(r['annual']['years'][-1],{'year':2025,'distribution':5.28})
        self.assertEqual(self.epargne(today=dt.date(2027,1,1))['conditions']['frequency'],'mensuels')

    def test_split_amount_and_date_contradictions_fail(self):
        text=re.sub(r'\s+',' ',(FIX/'epargne.txt').read_text())
        for changed in [text.replace('208 € à 20,80 €','209 € à 20,80 €'),
                        text.replace('divisé par dix le 1er juillet 2026','divisé par dix le 1er juillet 2025')]:
            self.assertTrue(changed!=text)
            with self.assertRaises(ValueError):self.epargne(changed)

    def test_missing_distribution_transition_is_not_inferred(self):
        text=(FIX/'epargne.txt').read_text().replace('À compter de janvier 2027','À compter de la prochaine période')
        with self.assertRaisesRegex(ValueError,'frequency'):self.epargne(text)

    def test_repeat_and_failed_collection_keep_one_split_and_original_values(self):
        r=self.epargne();validate(r,TODAY)
        for _ in range(2):
            out,obs=refresh({'records':[r]},{r['id']:lambda day:copy.deepcopy(r)},TODAY)
            r=out['records'][0];self.assertEqual(len(r['priceHistory']['corporateActions']),1)
        before=copy.deepcopy(r)
        def offline(day):raise TimeoutError('isolated source failure')
        out,obs=refresh({'records':[r]},{r['id']:offline},TODAY+dt.timedelta(days=1))
        self.assertEqual(obs[0]['status'],'failure')
        for field in ['price','snapshot','annual','priceHistory','checkedAt']:self.assertEqual(out['records'][0][field],before[field])

if __name__=='__main__':unittest.main()
