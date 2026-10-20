import datetime as dt
import unittest
from collect_instrument_metadata import collect
from metadata_incidents import qualification_failures, report_incidents


class MetadataIncidentTests(unittest.TestCase):
    def test_repeated_holds_keep_one_incident_and_every_proof(self):
        sources = [{'sourceUrl': 'https://one.test', 'value': True},
                   {'sourceUrl': 'https://two.test', 'value': False}]
        failures = [{'field': 'pea', 'qualificationRequired': True,
                     'error': 'Current contradiction', 'sources': sources},
                    {'field': 'pea', 'qualificationRequired': True,
                     'error': 'Previous contradiction unresolved', 'sources': sources[:1]}]
        rows = qualification_failures(failures)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['sources'], sources)
        self.assertEqual(len(rows[0]['reasons']), 2)

    def test_real_conflict_and_repeated_holds_never_select_a_value(self):
        isin = 'IE00B4L5Y983'
        sources = [{'sourceUrl': 'https://one.test', 'value': True},
                   {'sourceUrl': 'https://two.test', 'value': False}]
        config = {'isin': isin, 'urls': [r['sourceUrl'] for r in sources],
                  'qualificationHolds': [{'field': 'pea', 'sources': sources}] * 2}
        def fetch(url):
            return (isin + '\nEligible PEA: ' + ('Yes' if 'one' in url else 'No')).encode()
        values, failures = collect(config, dt.datetime.now(dt.timezone.utc), fetch=fetch)
        self.assertNotIn('pea', values)
        incidents = [r for r in failures if r.get('qualificationRequired')]
        self.assertEqual(len(incidents), 1)
        self.assertEqual({r['value'] for r in incidents[0]['sources']}, {True, False})

    def test_distinct_fields_remain_distinct(self):
        rows = report_incidents([{'id': 'one:pea', 'error': 'A'},
                                 {'id': 'one:pea', 'error': 'B'},
                                 {'id': 'one:aum', 'error': 'C'}])
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]['reasons'], ['A', 'B'])


if __name__ == '__main__':
    unittest.main()
