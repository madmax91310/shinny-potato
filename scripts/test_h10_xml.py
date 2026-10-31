"""Actual official release; no change to same-day/month-end FX conventions."""
import copy, datetime as dt, gzip, io, pathlib, unittest, zipfile
import xml.etree.ElementTree as ET
from h10_fx import parse, XML_SOURCE
from collect_ranking_sources import parse_cross_fx, parse_fred_series, cross_fx_document

ROOT = pathlib.Path(__file__).resolve().parents[1]
NOW = dt.datetime(2026, 10, 31, tzinfo=dt.timezone.utc)
FIXTURE = ROOT/'scripts/fixtures/h10-xml/release-2026-10-26.zip'
NS = '{http://www.federalreserve.gov/structure/compact/H10_H10}'
OBS = '{http://www.federalreserve.gov/structure/compact/common}Obs'


class H10XmlTests(unittest.TestCase):
    def test_actual_full_release_equals_every_common_fred_and_ddp_observation(self):
        body = FIXTURE.read_bytes(); current = parse(body, NOW)
        proof = ROOT/'reports/data-review-2026-10-23/preuves'
        old = parse(gzip.decompress((proof/'h10-daily-rates.csv.gz').read_bytes()), NOW)
        fred = parse_fred_series(gzip.decompress((proof/'fred-dextaus.csv.gz').read_bytes()), 'DEXTAUS')
        self.assertEqual(len(current), 10508)
        self.assertEqual(max(current), dt.date(2026,10,23))
        for previous in [old, fred]:
            common = set(previous)&set(current)
            self.assertEqual(len(common), 6966)
            self.assertTrue(all(previous[d] == current[d] for d in common))
        ecb = gzip.decompress((ROOT/'reports/data-review-2026-10-23/preuves/ecb-fx-history.xml.gz').read_bytes())
        x = parse_cross_fx(body, ecb, NOW, source_url=XML_SOURCE)
        y = parse_cross_fx(gzip.decompress((proof/'h10-daily-rates.csv.gz').read_bytes()), ecb, NOW,
                           source_url='https://www.federalreserve.gov/datadownload/Output.aspx')
        self.assertEqual(x['observations'], y['observations'])
        self.assertEqual(len(x['observations']), 333)
        self.assertNotIn('2026-10', x['observations'])
        self.assertIn('XML ZIP', x['sourceFormat'])

    def compact_release(self):
        with zipfile.ZipFile(FIXTURE) as z: root = ET.fromstring(z.read('H10_data.xml'))
        target = next(e for e in root.iter(NS+'Series') if e.get('SERIES_NAME') == 'RXI_N.B.TA')
        # Keep the real header and exact target, reducing only unrelated series.
        for parent in root.iter():
            for child in list(parent):
                if child.tag == NS+'Series' and child is not target: parent.remove(child)
        return root, target

    def archive(self, root):
        out = io.BytesIO()
        with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:
            z.writestr('H10_data.xml',ET.tostring(root))
        return out.getvalue()

    def test_wrong_identity_frequency_unit_status_duplicate_future_and_empty_are_rejected(self):
        original, _ = self.compact_release()
        mutations = [
            lambda root,s:s.set('CURRENCY','JPY'),
            lambda root,s:s.set('FREQ','129'),
            lambda root,s:s.set('UNIT_MULT','100'),
            lambda root,s:s.set('FX','USD'),
            lambda root,s:s.set('SERIES_NAME','RXI_N.B.JA'),
            lambda root,s:s.append(copy.deepcopy(s.find(OBS))),
            lambda root,s:s.find(OBS).set('TIME_PERIOD','2099-01-01'),
            lambda root,s:s.find(OBS).set('OBS_VALUE','NaN'),
            lambda root,s:s.find(OBS).set('OBS_STATUS','ND'),
            lambda root,s:[s.remove(e) for e in list(s) if e.tag == OBS],
            lambda root,s:next(p for p in root.iter() if s in list(p)).append(copy.deepcopy(s)),
            lambda root,s:root.find('.//{http://www.SDMX.org/resources/SDMXML/schemas/v1_0/message}Prepared').__setattr__('text','2099-01-01T00:00:00'),
        ]
        for mutate in mutations:
            root = copy.deepcopy(original); target = next(root.iter(NS+'Series'))
            mutate(root,target)
            with self.subTest(mutation=mutate), self.assertRaises((ValueError,KeyError)):
                parse(self.archive(root),NOW)

    def test_xml_access_fallback_records_failed_routes_without_changing_series(self):
        calls=[]
        def fetch(url, **policy):
            calls.append(url)
            if url != XML_SOURCE: raise TimeoutError('isolated unavailable FRED')
            return FIXTURE.read_bytes()
        body,url,attempts = cross_fx_document('TWD',NOW,fetch)
        self.assertEqual(url,XML_SOURCE)
        self.assertEqual(len(calls),3)
        self.assertEqual(len(attempts),3)
        self.assertEqual(len(parse(body,NOW)),10508)

    def test_empty_response_can_try_next_transport_but_is_never_a_success(self):
        calls=[]
        def fetch(url, **policy):
            calls.append(url)
            return b' ' if len(calls)==1 else gzip.decompress((ROOT/'reports/data-review-2026-10-23/preuves/fred-dextaus.csv.gz').read_bytes())
        body,url,attempts = cross_fx_document('TWD',NOW,fetch)
        self.assertEqual(attempts[0]['status'],'empty-response')
        self.assertEqual(attempts[1]['status'],'downloaded')
        self.assertEqual(len(calls),2)
        self.assertGreater(len(parse_fred_series(body,'DEXTAUS')),6000)

    def test_invalid_xml_financial_identity_does_not_fall_through_to_another_source(self):
        root,target=self.compact_release();target.set('CURRENCY','JPY');bad=self.archive(root);calls=[]
        def fetch(url, **policy):
            calls.append(url)
            if url!=XML_SOURCE:raise TimeoutError('isolated unavailable FRED')
            return bad
        body,url,attempts=cross_fx_document('TWD',NOW,fetch)
        with self.assertRaisesRegex(ValueError,'currency'):
            parse(body,NOW)
        self.assertEqual(calls[-1],XML_SOURCE)
        self.assertEqual(len(calls),3)


if __name__=='__main__': unittest.main()
