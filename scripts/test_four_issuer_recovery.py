"""Regression coverage for the four failures in run 38250622360."""
import copy
import datetime as dt
import json
import pathlib
import unittest
import urllib.error
from unittest.mock import patch

from data_automation import UTC
from collect_etf_pilot import parse_share, allocation
from collect_remaining_documents import collect_one, coinshares_widget_facts
from refresh_additional_etf import refresh

ROOT = pathlib.Path(__file__).resolve().parents[1]
FIX = ROOT / 'scripts/fixtures/official-documents/issuer-four-recovery'
NOW = dt.datetime(2026, 10, 12, tzinfo=UTC)
PILOT = json.loads((ROOT/'scripts/etf-pilot.json').read_text())['instruments']
EXTRA = json.loads((ROOT/'scripts/additional-etf-sources.json').read_text())['instruments']


class FourIssuerRecovery(unittest.TestCase):
    def test_dws_live_portfolio_fund_share_is_not_inferred_equity_or_cash(self):
        from collect_dws_etf import parse_holdings
        body=json.loads((FIX/'dws-industrials.json').read_text())
        s=next(s for s in EXTRA if s['isin']=='IE00BM67HV82')
        r=parse_holdings(body,s,NOW,s['sourceUrl'])
        self.assertEqual(next(p['weightPct'] for p in r['sectors']['rows'] if p['name']=='Unassigned'),.428991)
        self.assertAlmostEqual(sum(p['weightPct'] for p in r['countries']['rows']),100,delta=.001)
        self.assertEqual(len(r['holdings']['rows']),10)
        for defect in ['negative-fund','wrong-isin','unknown-class','negative-equity','incomplete']:
            bad=copy.deepcopy(body);rows=bad['tables'][0]['values']
            fund=next(p for p in rows if p['column_5']['value']=='Mutual Fund')
            if defect=='negative-fund':fund['column_1']['sortValue']=-.4
            if defect=='wrong-isin':fund['header']['value']='UNKNOWN'
            if defect=='unknown-class':fund['column_5']['value']='Unknown'
            if defect=='negative-equity':rows[0]['column_1']['sortValue']=-1
            if defect=='incomplete':rows.pop(0)
            with self.subTest(defect=defect),self.assertRaises(ValueError):parse_holdings(bad,s,NOW,s['sourceUrl'])

    def test_real_signed_cash_allocations_keep_all_published_weights(self):
        for isin, field, expected in [('IE000RDRMSD1','countries',-.1),
                                      ('IE000RDRMSD1','sectors',-.1),
                                      ('IE00B3F81R35','sectors',-.01)]:
            body = json.loads((FIX/(isin+'.json')).read_text())
            share = next(s for s in PILOT if s['isin']==isin)
            result = parse_share(body, share, NOW)
            rows = result[field]['rows']
            self.assertEqual(next(r['weightPct'] for r in rows if r['name']=='Cash and/or Derivatives'), expected)
            self.assertAlmostEqual(sum(r['weightPct'] for r in rows),100,delta=.02)
            self.assertGreater(result['aum']['amount'],0)
            self.assertTrue(result['performance']['years'])
            evidence = next(e for e in json.loads((FIX/'signed-holdings-evidence.json').read_text()) if e['isin']==isin)
            self.assertEqual(result[field]['asOf'], dt.datetime.strptime(str(evidence['asOf']), '%Y%m%d').date().isoformat())
            self.assertEqual(round(sum(r['weightPct'] for r in evidence['cashAndDerivatives']), 2), expected)
            self.assertAlmostEqual(evidence['portfolioTotalPct'], 100, delta=.001)

    def test_negative_security_unknown_label_nonfinite_bounds_sum_dates_rejected(self):
        body = json.loads((FIX/'IE000RDRMSD1.json').read_text())
        original = body['componentsByNameMap']['exposureBreakdowns']['containersByNameMap']['sector']
        for defect in ['negative-security','unknown-label','nan','inf','bool','low','high','sum','stale','future','duplicate','truncated']:
            c=copy.deepcopy(original);p=c['dataPointsByNameMap']
            if defect=='negative-security': p['fund']['value'][0]=-1
            if defect=='unknown-label': p['type']['value'][-1]='Other'
            if defect in ['nan','inf','bool','low','high']:
                p['fund']['value'][-1]={'nan':float('nan'),'inf':float('inf'),'bool':True,'low':-100.01,'high':100.01}[defect]
            if defect=='sum': p['fund']['value'][0]=1
            if defect in ['stale','future']:p['asOf']['value']=20260101 if defect=='stale' else 20261013
            if defect=='duplicate':p['type']['value'][-1]=p['type']['value'][0]
            if defect=='truncated':p['fund']['value'].pop()
            with self.subTest(defect=defect),self.assertRaises(ValueError):allocation(c,NOW)

    def test_official_widget_fee_fallback_for_both_etps(self):
        source=json.loads((FIX/'coinshares-fees.json').read_text())
        for isin,fee in [('GB00BLD4ZL17',.15),('GB00BLD4ZM24',0)]:
            s=next(s for s in EXTRA if s['isin']==isin)
            payload=json.loads(json.dumps(source).replace('GB00BLD4ZL17',isin))
            payload[0]['sections'][0]['meta'][-1]['value']=f'{fee:.2f}%'
            with patch('collect_coinshares_aum.widget_url',return_value='https://www-api.coinshares.com/api/v2/Widgets'),patch('collect_remaining_documents.download',return_value=json.dumps(payload).encode()):
                r=coinshares_widget_facts(s,NOW)
            self.assertEqual(r['characteristics']['terPct'],fee)
            self.assertEqual(r['characteristics']['asOf'],'2026-10-09')
            for defect in ['isin','date','fee','duplicate','currency']:
                bad=copy.deepcopy(payload);config=copy.deepcopy(s)
                if defect=='isin':bad[0]['sections'][1]['meta'][0]['value']='WRONG'
                if defect=='date':bad[0]['sections'][0]['meta'][0]['value']='2026-01-01'
                if defect=='fee':bad[0]['sections'][0]['meta'][-1]['value']='NaN%'
                if defect=='duplicate':bad[0]['sections'][0]['meta'].append(bad[0]['sections'][0]['meta'][0])
                if defect=='currency':config['currency']='EUR'
                with patch('collect_coinshares_aum.widget_url',return_value='https://www-api.coinshares.com/api/v2/Widgets'),patch('collect_remaining_documents.download',return_value=json.dumps(bad).encode()):
                    with self.subTest(isin=isin,defect=defect),self.assertRaises(ValueError):coinshares_widget_facts(config,NOW)

    def test_pdf_outage_recovers_but_invalid_pdf_never_selects_fallback(self):
        s=next(s for s in EXTRA if s['isin']=='GB00BLD4ZL17')
        error=urllib.error.HTTPError(s['sourceUrl'],500,'outage',{},None)
        facts={**s,'productId':s['isin'],'characteristics':{'terPct':.15},'unavailable':[]}
        with patch('collect_remaining_documents.download',side_effect=error),patch('collect_remaining_documents.coinshares_widget_facts',return_value=facts),patch('collect_coinshares_aum.collect',return_value={'amount':1}),patch('collect_product_calendars.collect_coinshares_calendar',return_value={'years':{'2025':-7.99}}):
            r=collect_one(s,NOW)
        self.assertEqual(r['sourceAttempts'][0]['reason'],str(error))
        self.assertIn('performance',r)
        with patch('collect_remaining_documents.download',return_value=b'%PDF-bad'),patch('collect_remaining_documents.pdf_text',return_value='wrong ISIN'),patch('collect_remaining_documents.coinshares_widget_facts') as fallback:
            with self.assertRaises(ValueError):collect_one(s,NOW)
            fallback.assert_not_called()

    def test_failed_fields_preserve_values_and_dates_and_remain_visible(self):
        s=next(s for s in EXTRA if s['isin']=='GB00BLD4ZL17')
        previous={s['isin']:{'productId':s['isin'],'currency':'USD','sourceUrl':s['sourceUrl'],
            'aum':{'amount':123,'asOf':'2026-10-07','checkedAt':'2026-10-07'},
            'performance':{'years':{'2025':-7.99},'checkedAt':'2026-10-07'}}}
        with patch('collect_remaining_documents.download',return_value=b'%PDF-ok'),patch('collect_remaining_documents.pdf_text',return_value='unused'),patch('collect_remaining_documents.coinshares',return_value={**s,'productId':s['isin'],'characteristics':{'terPct':.15},'unavailable':[]}),patch('collect_coinshares_aum.collect',side_effect=TimeoutError('aum outage')),patch('collect_product_calendars.collect_coinshares_calendar',side_effect=TimeoutError('calendar outage')):
            merged,report=refresh({'instruments':[s]},previous,{},NOW,collect_one)
        for field in ['aum','performance']:self.assertEqual(merged[s['isin']][field],previous[s['isin']][field])
        self.assertEqual([e['field'] for e in report['shares'][0]['collectionErrors']],['aum','performance'])
        merged,report=refresh({'instruments':[s]},previous,{},NOW,lambda *a: (_ for _ in ()).throw(TimeoutError()))
        self.assertEqual(merged,previous)
        self.assertEqual(report['shares'][0]['status'],'failed')


if __name__=='__main__':unittest.main()

class DWSSignedSettlement(unittest.TestCase):
    def test_negative_cash_is_preserved_without_renormalising_equities(self):
        from collect_dws_etf import parse_holdings
        import copy
        body=json.loads((FIX/'dws-industrials.json').read_text())
        rows=body['tables'][0]['values']
        cash=next(r for r in rows if r['column_5']['value'] in ('Cash','Future','FX Forward'))
        equity=next(r for r in rows if r['column_5']['value']=='Equities')
        other=sum(r['column_1']['sortValue']for r in rows if r is not cash and r['column_5']['value']in('Cash','Future','FX Forward'))
        old=cash['column_1']['sortValue'];cash['column_1']['sortValue']=-.1-other
        equity['column_1']['sortValue']+=old+.1+other
        r=parse_holdings(body,{'isin':'IE00BM67HV82'},dt.datetime(2026,10,12,tzinfo=dt.timezone.utc),'https://etf.dws.com/source')
        for field in ('countries','sectors'):
            self.assertAlmostEqual(next(x['weightPct'] for x in r[field]['rows'] if x['name']=='Cash and/or Derivatives'),-.1)
            self.assertAlmostEqual(sum(x['weightPct'] for x in r[field]['rows']),100,places=2)
        equity['column_1']['sortValue']=-1
        with self.assertRaises(ValueError):parse_holdings(body,{'isin':'IE00BM67HV82'},dt.datetime(2026,10,12,tzinfo=dt.timezone.utc),'https://etf.dws.com/source')
