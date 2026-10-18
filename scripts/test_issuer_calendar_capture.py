import copy
import datetime as dt
import unittest
from issuer_calendar_capture import capture_year_end
from apply_etf_collection import merge_collection, RECENT_LAUNCHES

NOW = dt.datetime(2027, 1, 15, tzinfo=dt.timezone.utc)

def performance(stamp='2026-12-31'):
    return dict(currency='USD', basis='fund', method='qualified NAV total return', years={}, asOf=stamp,
                sourceUrl='https://issuer.example/exact-share', sha256='a'*64,
                observations=[dict(label=label, value=12.34, asOf=stamp) for label in ['Depuis janvier','1 an']])

class CalendarCapture(unittest.TestCase):
    def test_every_recent_share_first_complete_year(self):
        # Every share in the dated launch registry, however many are added.
        self.assertGreaterEqual(len(RECENT_LAUNCHES), 12)
        for isin, evidence in RECENT_LAUNCHES.items():
            launch = dt.date.fromisoformat(evidence['launchDate'])
            year = launch.year + ((launch.month, launch.day) != (1, 1))
            share = dict(isin=isin, productId=isin, currency='USD', exposureOnly=True,
                         sourceUrl='https://issuer.example/exact-share', performance=performance(f'{year}-12-31'))
            share['performance']['years'] = {str(year): 12.34}
            report = {'checkedAt': f'{year+1}-01-15', 'shares': [share]}
            with self.subTest(isin=isin):
                result = merge_collection(report, {}, {})
                self.assertEqual(result[isin]['performance']['years'], {str(year): 12.34})
                partial = copy.deepcopy(report)
                partial['shares'][0]['performance']['years'][str(year-1)] = 5
                with self.assertRaisesRegex(ValueError, 'partial launch year'):
                    merge_collection(partial, result, {})
                # A failed attempt must not mutate the last valid calendar.
                self.assertEqual(result[isin]['performance']['years'], {str(year): 12.34})
                premature = copy.deepcopy(report)
                premature['checkedAt'] = f'{year}-12-31'
                with self.assertRaises(ValueError): merge_collection(premature, {}, {})
    def test_only_closed_complete_years(self):
        for stamp,launch,now in [('2026-09-30','2022-05-04',NOW),
                                ('2026-12-31','2026-05-04',NOW),
                                ('2026-12-31','2022-05-04',dt.datetime(2026,12,31))]:
            p=performance(stamp);capture_year_end(p,launch,now)
            self.assertEqual(p['years'],{})
        p=performance();capture_year_end(p,'2026-01-01',NOW)
        self.assertEqual(p['years'],{'2026':12.34})
        self.assertEqual(p['yearEvidence']['2026']['sha256'],'a'*64)

    def test_future_ambiguous_missing_and_inconsistent_returns_rejected(self):
        for mode in ['future','duplicate','missing','disagreement','nan']:
            p=performance('2027-12-31' if mode=='future' else '2026-12-31')
            if mode=='duplicate':p['observations'].append(p['observations'][0])
            if mode=='missing':p['observations'].pop(0)
            if mode=='disagreement':p['observations'][1]['value']=15
            if mode=='nan':p['observations'][0]['value']=float('nan')
            with self.subTest(mode=mode),self.assertRaises(ValueError):capture_year_end(p,'2022-05-04',NOW)

    def test_later_month_preserves_year_and_original_proof(self):
        p=performance();capture_year_end(p,'2022-05-04',NOW)
        share=dict(isin='IE000UL6CLP7',productId='SILV',currency='USD',exposureOnly=True,
                   sourceUrl=p['sourceUrl'],performance=p)
        report={'checkedAt':'2027-01-15','shares':[share]}
        old=merge_collection(report,{}, {})
        newp=performance('2027-01-31');newp['sha256']='b'*64
        new=merge_collection({'checkedAt':'2027-02-15','shares':[{**share,'performance':newp}]},old,{})
        self.assertEqual(new[share['isin']]['performance']['years'],{'2026':12.34})
        self.assertEqual(new[share['isin']]['performance']['yearEvidence'],p['yearEvidence'])
        self.assertEqual(new[share['isin']]['performance']['sha256'],'b'*64)
        bad=copy.deepcopy(share);bad['performance']['yearEvidence']['2026']['asOf']='2026-09-30'
        with self.assertRaises(ValueError):merge_collection({**report,'shares':[bad]},old,{})
