import copy
import datetime as dt
import json
from pathlib import Path
import unittest
from collect_instrument_metadata import invesco_characteristics, collect

ISIN = 'IE000716YHJ7'
URL = f'https://dng-api.invesco.com/cache/v1/accounts/fr_FR/shareclasses/{ISIN}?idType=isin'
TODAY = dt.date(2026, 10, 21)
FIXTURE = Path(__file__).with_name('fixtures')/'invesco-characteristics'/f'{ISIN}.json'


class InvescoCharacteristics(unittest.TestCase):
    def test_explicit_tax_and_share_characteristics_are_consumed(self):
        body = FIXTURE.read_bytes()
        self.assertEqual(invesco_characteristics(body, ISIN, URL, TODAY), {
            'pea':False, 'currencyHedge':False, 'distribution':'Accumulating',
            'replicationMethod':'Physical', 'domicile':'Ireland'})
        values, errors = collect({'isin':ISIN, 'urls':[URL]},
            dt.datetime(2026, 10, 21, tzinfo=dt.timezone.utc), lambda _:body)
        self.assertEqual(errors, [])
        self.assertIs(values['pea']['value'], False)
        self.assertEqual(values['pea']['sourceUrl'], URL)
        self.assertEqual(len(values['pea']['sha256']), 64)
        self.assertNotIn('listings', values)

    def test_silence_unknown_and_other_tax_envelopes_never_mean_false(self):
        data = json.loads(FIXTURE.read_bytes())
        for key in ['peaEligible', 'hedgedIndicator', 'distributionFrequency', 'replicationMethod']:
            data.pop(key)
        self.assertEqual(invesco_characteristics(json.dumps(data), ISIN, URL, TODAY), {'domicile':'Ireland'})
        for value in ['', None, 'Unknown', 'N/A', 0, False]:
            data['peaEligible'] = value
            self.assertNotIn('pea', invesco_characteristics(json.dumps(data), ISIN, URL, TODAY))

    def test_wrong_share_scope_dates_and_duplicate_statements_rejected(self):
        original = json.loads(FIXTURE.read_bytes())
        for mutate in [lambda d:d['aliases'].update(isin='IE0000QLH0G6'),
                       lambda d:d.update(effectiveDate='2026-10-22'),
                       lambda d:d.update(effectiveDate='2025-01-01')]:
            data = copy.deepcopy(original); mutate(data)
            with self.assertRaises(ValueError): invesco_characteristics(json.dumps(data), ISIN, URL, TODAY)
        for url in [URL.replace('fr_FR','en_GB'), URL+'&other=1', URL.replace('dng-api.invesco.com','example.org')]:
            with self.assertRaises(ValueError): invesco_characteristics(json.dumps(original), ISIN, url, TODAY)
        with self.assertRaises(ValueError):
            invesco_characteristics(FIXTURE.read_text().replace('"peaEligible": "No"', '"peaEligible": "No", "peaEligible": "Yes"'), ISIN, URL, TODAY)


if __name__ == '__main__': unittest.main()
