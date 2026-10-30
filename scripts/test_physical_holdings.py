"""Portfolio guards: controlled fixtures plus the issuer's full Global X CSV."""
import copy
import csv
import datetime as dt
import io
import pathlib
import json
import tempfile
import unittest
from unittest.mock import patch
from holdings_reconciliation import HoldingsSourceError
from collect_physical_holdings import (
    amundi_composition, checked_rows, collect_globalx, globalx_csv, invesco_composition, vanguard_pages, vaneck_composition, vaneck_url)

NOW = dt.datetime(2026, 10, 20, tzinfo=dt.timezone.utc)
SHARE = dict(isin='IE00BK5BQT80', currency='USD', productCode=9679)


def securities():
    return [dict(isin=f'US{i:010d}', name=f'Test security {i}', weightPct=8.0) for i in range(12)]


def amundi():
    rows = [dict(compositionCharacteristics=dict(date='2026-10-16', type='EQUITY_ORDINARY',
                isin=r['isin'], name=r['name'], weight=.08), weight=.08) for r in securities()]
    rows.append(dict(compositionCharacteristics=dict(date='2026-10-16', type='CASH', weight=.04), weight=.04))
    return dict(products=[dict(productId=SHARE['isin'],
        characteristics=dict(ISIN=SHARE['isin'], CURRENCY='USD',
                             FUND_REPLICATION_METHODOLOGY='Direct(Physical)', POSITION_AS_OF_DATE='2026-10-16'),
        composition=dict(totalNumberOfInstruments=13, compositionData=rows))])


def vanguard():
    items = [dict(isin=r['isin'], securityLongDescription=r['name'], marketValuePercentage=100/12,
                  effectiveDate='2026-09-30', securityType='EQ.STOCK') for r in securities()]
    return dict(data=dict(funds=[dict(profile=dict(portId='9679', fundCurrency='USD',
            identifiers=[dict(altId='ISIN', altIdValue=SHARE['isin'])],
            etfReplicationMethodology='Physical', assetClassificationLevel1='Equity'))],
        borHoldings=[dict(holdings=dict(items=items, totalHoldings=12, lastItemKey=None))]))


class PhysicalHoldingsTest(unittest.TestCase):
    def uranium_current(self):
        return (pathlib.Path(__file__).parent/'fixtures/physical-holdings/globalx-urnu-20261028.csv').read_bytes()

    def uranium_weight(self, name, value):
        reader = csv.DictReader(io.StringIO(self.uranium_current().decode()))
        fields, rows = reader.fieldnames, list(reader)
        next(row for row in rows if row['NAME'] == name)['NET_ASSETS'] = value
        out = io.StringIO()
        writer = csv.DictWriter(out, fieldnames=fields)
        writer.writeheader(); writer.writerows(rows)
        return out.getvalue().encode()

    def test_globalx_current_uranium_original_nav_and_unknown_identities(self):
        now = NOW.replace(day=29)
        rows, stamp = globalx_csv(self.uranium_current(), now)
        self.assertEqual((len(rows), stamp), (59, '2026-10-28'))
        self.assertAlmostEqual(sum(r['weightPct'] for r in rows), 99.815)
        unknown = [r for r in rows if r['isin'] is None]
        self.assertEqual(len(unknown), 2)
        self.assertAlmostEqual(sum(r['weightPct'] for r in unknown), .004)

    def test_globalx_missing_weight_is_never_zero_or_skipped_even_for_cash(self):
        for name in ('CAMECO CORP', 'CASH', 'VERDERA ENERGY CORP', 'OTHER PAYABLE & RECEIVABLES'):
            for value in ('', '  ', None):
                with self.subTest(name=name, value=value), self.assertRaisesRegex(
                        ValueError, 'Missing Global X NET_ASSETS at CSV record .*name=' + repr(name)):
                    globalx_csv(self.uranium_weight(name, value), NOW.replace(day=29))

    def test_globalx_invalid_numeric_format_is_not_silently_accepted(self):
        for value in ('NaN', 'inf', '-inf', '15,87', '15.87%', '-1', '101'):
            with self.subTest(value=value), self.assertRaisesRegex(ValueError, 'Global X|physical'):
                globalx_csv(self.uranium_weight('CAMECO CORP', value), NOW.replace(day=29))

    def test_globalx_missing_published_field_has_bound_rejected_source_evidence(self):
        import hashlib
        raw=self.uranium_weight('CASH','')
        share={'isin':'IE000NDWFGA5','sourceUrl':'https://globalxetfs.eu/funds/urnu/'}
        url='https://globalxetfs.eu/api/funds/urnu/topholdingscsv'
        with patch('collect_physical_holdings.public_page',return_value='identity'), \
                patch('collect_physical_holdings.globalx_page',return_value=url), \
                patch('collect_physical_holdings.download',return_value=raw), \
                self.assertRaises(HoldingsSourceError) as caught:
            collect_globalx(share,NOW.replace(day=29))
        d=caught.exception.diagnostic
        self.assertEqual(d['subjectIsin'],share['isin'])
        self.assertEqual(d['sourceUrl'],url)
        self.assertEqual(d['sha256'],hashlib.sha256(raw).hexdigest())
        self.assertEqual(d['asOf'],'2026-10-28')
        self.assertEqual(d['checkedAt'],NOW.replace(day=29).isoformat())
        self.assertEqual(d['name'],'CASH')
        self.assertEqual(d['missingFields'],['NET_ASSETS'])
        self.assertGreater(d['recordNumber'],2)
        self.assertFalse(d['financialDataQualified'])
        self.assertFalse(d['normalizationApplied'])

    def test_globalx_current_schema_dates_totals_and_duplicates_remain_required(self):
        raw = self.uranium_current()
        for bad in (raw.replace(b'NET_ASSETS', b'WEIGHT'),
                    raw.replace(b'2026-10-28', b'2026-10-27', 1),
                    self.uranium_weight('CAMECO CORP', '0'),
                    raw.replace(b'CA65340P1062', b'CA13321L1085')):
            with self.subTest(mutation=bad[:80]), self.assertRaises(ValueError):
                globalx_csv(bad, NOW.replace(day=29))

    def test_globalx_rejected_raw_response_is_preserved_before_parsing(self):
        raw = self.uranium_weight('CAMECO CORP', '')
        with tempfile.TemporaryDirectory() as root, patch.dict('os.environ', PHYSICAL_SOURCE_PROOF_DIR=root), \
                patch('collect_physical_holdings.public_page', return_value='identity page'), \
                patch('collect_physical_holdings.globalx_page', return_value='https://globalxetfs.eu/api/funds/urnu/topholdingscsv'), \
                patch('collect_physical_holdings.download', return_value=raw):
            with self.assertRaisesRegex(ValueError, 'Missing Global X NET_ASSETS'):
                collect_globalx({'isin':'IE000NDWFGA5','sourceUrl':'https://globalxetfs.eu/funds/urnu/'}, NOW.replace(day=29))
            self.assertEqual((pathlib.Path(root)/'IE000NDWFGA5-globalx.raw').read_bytes(), raw)

    def test_globalx_failed_collection_retains_previous_then_recovers(self):
        import collect_dca_complete_holdings as collector
        from collect_physical_holdings import observation
        isin = 'IE000NDWFGA5'
        retained = {'asOf':'2026-10-26', 'checkedAt':'2026-10-27T14:45:21+00:00',
                    'rows':[{'isin':'CA13321L1085','name':'CAMECO CORP','weightPct':15.0}]}
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            files = {
                'scripts/dca-complete-holdings-sources.json': {isin:{'isin':isin,'parser':'globalx-complete'}},
                'scripts/generated-holdings-sources.json': {},
                'scripts/dca-equity-identities.json': {}, 'scripts/dca-equity-extra-identities.json': {},
                'src/data/dca-complete-holdings.json': {isin:retained,'unrelated':retained},
                'src/data/dca-holdings-status.json': {}, 'src/data/dca-security-classifications.json': {}}
            for name, content in files.items():
                path = root/name; path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(json.dumps(content))
            output = root/'report.json'
            argv = ['collect', '--only', isin, '--apply', '--output', str(output)]
            def run(raw):
                def source(share, now):
                    rows, stamp = globalx_csv(raw, now)
                    return observation(rows, stamp, 'https://globalxetfs.eu/api/funds/urnu/topholdingscsv', raw, allow_unidentified=True)
                with patch.object(collector, 'ROOT', root), patch('sys.argv', argv), \
                        patch.dict('collect_physical_holdings.COLLECTORS', {'globalx-complete':source}):
                    collector.main()
            with self.assertRaises(SystemExit):
                run(self.uranium_weight('CAMECO CORP', ''))
            self.assertEqual(json.loads((root/'src/data/dca-complete-holdings.json').read_text()), files['src/data/dca-complete-holdings.json'])
            status = json.loads((root/'src/data/dca-holdings-status.json').read_text())[isin]
            self.assertEqual((status['status'], status['asOf'], status['lastSuccessAt']), ('failed', retained['asOf'], retained['checkedAt']))
            run(self.uranium_current())
            saved = json.loads((root/'src/data/dca-complete-holdings.json').read_text())
            self.assertEqual(saved['unrelated'], retained)
            self.assertEqual(saved[isin]['asOf'], '2026-10-28')
            self.assertAlmostEqual(sum(r['weightPct'] for r in saved[isin]['rows']), 99.815)
            self.assertEqual(json.loads((root/'src/data/dca-holdings-status.json').read_text())[isin]['status'], 'validated')

    def test_uranium_unidentified_separate_lines_are_not_cash_or_listed_shares(self):
        raw=(pathlib.Path(__file__).parent/'fixtures/physical-holdings/globalx-urnu.csv').read_bytes()
        rows,stamp=globalx_csv(raw,NOW)
        self.assertEqual(stamp,'2026-10-20')
        unknown=[r for r in rows if r['isin'] is None]
        self.assertEqual(len(unknown),2)
        self.assertAlmostEqual(sum(r['weightPct']for r in unknown),.004)
        self.assertEqual(len([r for r in rows if r['name']=='VERDERA ENERGY CORP']),3)
        self.assertEqual(len({r['isin']for r in rows if r['isin']}),len(rows)-2)
    def test_globalx_actual_full_file(self):
        raw = (pathlib.Path(__file__).parent/'fixtures/physical-holdings/globalx-botz.csv').read_bytes()
        rows, stamp = globalx_csv(raw, NOW)
        self.assertEqual((len(rows), stamp), (58, '2026-10-19'))
        self.assertAlmostEqual(sum(r['weightPct'] for r in rows), 99.801)
        with self.assertRaises(ValueError):
            globalx_csv(raw.replace(b'OTHER PAYABLE & RECEIVABLES', b'UNKNOWN ASSET'), NOW)

    def test_amundi_original_weights_and_cash(self):
        rows, stamp, excluded = amundi_composition(amundi(), SHARE, NOW)
        self.assertEqual(sum(r['weightPct'] for r in rows), 96)
        self.assertEqual(excluded, {'CASH': 4})
        self.assertEqual(stamp, '2026-10-16')

    def test_amundi_cash_payables_keep_net_nav_without_short_equities(self):
        body=amundi();composition=body['products'][0]['composition']
        positive=composition['compositionData'][-1]
        positive['weight']=positive['compositionCharacteristics']['weight']=.054
        negative=copy.deepcopy(positive)
        negative['weight']=negative['compositionCharacteristics']['weight']=-.014
        composition['compositionData'].append(negative);composition['totalNumberOfInstruments']+=1
        rows,_,excluded=amundi_composition(body,SHARE,NOW)
        self.assertAlmostEqual(sum(r['weightPct']for r in rows),96)
        self.assertAlmostEqual(excluded['CASH'],4)
        negative['compositionCharacteristics']['type']='EQUITY_ORDINARY'
        with self.assertRaises(ValueError):amundi_composition(body,SHARE,NOW)

    def test_amundi_wrong_identity_replication_count_date_weight(self):
        for field, value in [('ISIN', 'IE0000000000'), ('CURRENCY', 'EUR'),
                             ('FUND_REPLICATION_METHODOLOGY', 'Indirect(Swap)')]:
            data = amundi()
            data['products'][0]['characteristics'][field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                amundi_composition(data, SHARE, NOW)
        for mutation in ('count', 'date', 'weight', 'type', 'duplicate'):
            data = amundi(); c = data['products'][0]['composition']
            first = c['compositionData'][0]['compositionCharacteristics']
            if mutation == 'count': c['totalNumberOfInstruments'] += 1
            if mutation == 'date': first['date'] = '2026-10-15'
            if mutation == 'weight': first['weight'] = float('nan')
            if mutation == 'type': first['type'] = 'UNQUALIFIED'
            if mutation == 'duplicate': first['isin'] = c['compositionData'][1]['compositionCharacteristics']['isin']
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                amundi_composition(data, SHARE, NOW)

    def test_vanguard_all_pages_required(self):
        first, last = vanguard(), vanguard()
        first['data']['borHoldings'][0]['holdings'].update(items=first['data']['borHoldings'][0]['holdings']['items'][:6], lastItemKey='page2')
        last['data']['borHoldings'][0]['holdings']['items'] = last['data']['borHoldings'][0]['holdings']['items'][6:]
        rows, stamp, _ = vanguard_pages([first, last], SHARE, NOW)
        self.assertEqual((len(rows), stamp), (12, '2026-09-30'))
        for pages in ([first], [last], [first, first], [first, last, last]):
            with self.assertRaises(ValueError): vanguard_pages(pages, SHARE, NOW)
        bad = copy.deepcopy(last)
        bad['data']['funds'][0]['profile']['identifiers'][0]['altIdValue'] = 'IE0000000000'
        with self.assertRaises(ValueError): vanguard_pages([first, bad], SHARE, NOW)

    def test_vanguard_dates_and_duplicate_securities(self):
        for mutation in ('date', 'duplicate', 'type'):
            page = vanguard(); rows = page['data']['borHoldings'][0]['holdings']['items']
            if mutation == 'date': rows[0]['effectiveDate'] = '2026-08-31'
            if mutation == 'duplicate': rows[0]['isin'] = rows[1]['isin']
            if mutation == 'type': rows[0]['securityType'] = 'UNQUALIFIED'
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                vanguard_pages([page], SHARE, NOW)

    def test_invesco_count_cash_and_rounding(self):
        body = dict(effectiveDate='2026-10-19', numberOfHoldings=12,
                    holdings=[dict(isin=r['isin'], name=r['name'], weight=8.33) for r in securities()])
        rows, _ = invesco_composition(body, NOW)
        self.assertAlmostEqual(sum(r['weightPct'] for r in rows), 99.96)
        body['holdings'].append(dict(name='Cash and/or Derivatives', weight=.04))
        self.assertEqual(len(invesco_composition(body, NOW)[0]), 12)
        body['holdings'].pop(0)
        with self.assertRaises(ValueError): invesco_composition(body, NOW)

    def test_invalid_and_duplicate_security_never_published(self):
        for value in (float('nan'), float('inf'), -1, True):
            rows = securities(); rows[0]['weightPct'] = value
            with self.assertRaises(ValueError): checked_rows(rows)
        rows = securities(); rows[0]['isin'] = rows[1]['isin']
        with self.assertRaises(ValueError): checked_rows(rows)

    def test_vaneck_ucits_and_us_tickers_never_interchangeable(self):
        body = json.loads((pathlib.Path(__file__).parent/'fixtures/physical-holdings/vaneck-ucits.json').read_text())
        rows, stamp, excluded = vaneck_composition(body, {'apiTicker': 'UCTSMH'}, NOW)
        self.assertEqual((len(rows), stamp, excluded), (25, '2026-10-19', {'Cash': .02}))
        self.assertAlmostEqual(sum(r['weightPct'] for r in rows), 99.98)
        with self.assertRaises(ValueError): vaneck_composition(body, {'apiTicker': 'SMH'}, NOW)
        body['data']['Holdings'][0]['ISIN'] = ''
        self.assertIsNone(vaneck_composition(body, {'apiTicker': 'UCTSMH'}, NOW)[0][0]['isin'])
        body['data']['Holdings'][0]['ISIN'] = 'WRONG'
        with self.assertRaises(ValueError): vaneck_composition(body, {'apiTicker': 'UCTSMH'}, NOW)
        body['data']['Holdings'].pop(0)
        with self.assertRaises(ValueError): vaneck_composition(body, {'apiTicker': 'UCTSMH'}, NOW)
        page = '<span data-value="IE00BMC38736"></span><ve-fundticker>UCTSMH</ve-fundticker><ve-country>uk</ve-country><ve-language>en</ve-language><section id="holdings"><ve-holdingsblock data-blockid="194732" data-pageid="233164"></ve-holdingsblock></section>'
        share = dict(isin='IE00BMC38736', apiTicker='UCTSMH')
        self.assertIn('ticker=UCTSMH', vaneck_url(page, share))
        with self.assertRaises(ValueError): vaneck_url(page.replace('UCTSMH', 'SMH'), share)

    def test_vanguard_distinct_listings_aggregate_exact_isin(self):
        page = vanguard()
        items = page['data']['borHoldings'][0]['holdings']['items']
        for index, item in enumerate(items): item['sedol1'] = str(index).zfill(7)
        items[1]['isin'] = items[0]['isin']
        rows, _, _ = vanguard_pages([page], SHARE, NOW)
        self.assertEqual(len(rows), 11)
        self.assertAlmostEqual(rows[0]['weightPct'], 200/12)
        items[1]['sedol1'] = items[0]['sedol1']
        with self.assertRaises(ValueError): vanguard_pages([page], SHARE, NOW)


if __name__ == '__main__':
    unittest.main()
