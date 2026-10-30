"""Actual issuer response regressions: maturity, business phases and data capability."""
import copy
import datetime as dt
import gzip
import json
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET
from data_automation import UTC
from update_inflation import parse_rates, merge_rates
from collect_exposure_sleeves import equity_rows, joined
from collect_presentation_actors import platform_activity, refresh, parse

ROOT=Path(__file__).resolve().parents[1]
FIXTURES=ROOT/'scripts/fixtures/partial-official-publications-20261030'
NOW=dt.datetime(2026,10,30,15,tzinfo=UTC)
def fixture(name):return gzip.decompress((FIXTURES/name).read_bytes()).decode()


class InflationMaturity(unittest.TestCase):
    def test_real_october_flash_is_preserved_without_entering_active_history(self):
        report=parse_rates(fixture('insee-current-provisional.xml.gz'),NOW)
        self.assertEqual(max(report['rates']),'2026-09')
        self.assertEqual(report['rates']['2026-09'],-.3)
        self.assertEqual(report['pendingObservations'],[{'month':'2026-10','value':.4,'quality':'P','observationStatus':'P','reason':'official-provisional-incomplete-calendar-month','includedInActiveHistory':False}])
        merged=merge_rates({'2025-12':.1,'2026-09':-.3},report)
        self.assertNotIn('2026-10',merged)
        self.assertEqual(merged['2025-12'],.1)

    def test_month_closure_promotes_the_actual_published_rate_with_its_quality(self):
        xml=fixture('insee-current-provisional.xml.gz')
        before=parse_rates(xml,dt.datetime(2026,10,31,tzinfo=UTC))
        after=parse_rates(xml,dt.datetime(2026,11,1,tzinfo=UTC))
        self.assertNotIn('2026-10',before['rates'])
        self.assertEqual(after['rates']['2026-10'],.4)
        self.assertEqual(after['quality']['2026-10'],'P')
        self.assertEqual(after['pendingObservations'],[])

    def test_duplicate_future_invalid_and_missing_previous_month_still_fail(self):
        xml=fixture('insee-current-provisional.xml.gz')
        for text in [xml.replace('2026-10','2026-11'),
                     xml.replace('OBS_VALUE="0.4"','OBS_VALUE="NaN"'),
                     xml.replace('TIME_PERIOD="2026-09"','TIME_PERIOD="2026-10"')]:
            with self.subTest(body=text[:40]),self.assertRaises(ValueError):parse_rates(text,NOW)
        root=ET.fromstring(xml);series=next(x for x in root.iter()if x.tag.rsplit('}',1)[-1]=='Series')
        series.append(copy.deepcopy(series[0]))
        with self.assertRaises(ValueError):parse_rates(ET.tostring(root,encoding='unicode'),NOW)

    def test_year_transition_keeps_closed_december_separate_from_current_january(self):
        root=ET.fromstring(fixture('insee-current-provisional.xml.gz'));series=next(x for x in root.iter()if x.tag.rsplit('}',1)[-1]=='Series')
        series.set('LAST_UPDATE','2026-12-31')
        for month,value,quality in [('2026-11','0.1','DEF'),('2026-12','-0.2','P')]:
            ET.SubElement(series,'Obs',TIME_PERIOD=month,OBS_VALUE=value,OBS_STATUS='A',OBS_QUAL=quality,OBS_TYPE='A')
        xml=ET.tostring(root,encoding='unicode')
        self.assertNotIn('2026-12',parse_rates(xml,dt.datetime(2026,12,31,tzinfo=UTC))['rates'])
        after=parse_rates(xml,dt.datetime(2027,1,1,tzinfo=UTC))
        self.assertEqual(after['rates']['2026-12'],-.2)
        self.assertNotIn('2027-01',after['rates'])


class ClassificationReference(unittest.TestCase):
    def setUp(self):self.body=json.loads(fixture('iwm-signed-reference.json.gz'))

    def test_real_signed_reference_does_not_become_a_weighted_exposure(self):
        with self.assertRaisesRegex(ValueError,'Short or missing'):equity_rows(self.body,None,'official-us-api',NOW)
        meta,rows,stamp=equity_rows(self.body,None,'official-us-api',NOW,classification_only=True)
        self.assertEqual(stamp,'2026-10-29')
        self.assertFalse(meta['portfolioWeightsUsed'])
        self.assertNotIn('countries',meta);self.assertNotIn('sectors',meta)
        self.assertEqual(meta['identifiedReferenceRows'],1974)
        self.assertEqual(meta['unidentifiedReferenceRows'],3)
        self.assertEqual(meta['negativeReferenceRows'],1)
        negative=next(r for r in rows if r['holdingPercent']<0)
        self.assertEqual(negative['isin'],'US63938C1080')
        self.assertEqual(negative['holdingPercent'],-.00007)
        self.assertTrue(all(r['isin']for r in rows))

    def test_classification_mode_cannot_bypass_fund_or_source_identity(self):
        with self.assertRaises(ValueError):equity_rows(self.body,'IE00B441G979','official',NOW,classification_only=True)
        body=copy.deepcopy(self.body);body['productId']=999999
        with self.assertRaises(ValueError):equity_rows(body,None,'official',NOW,classification_only=True)

    def test_unknown_or_non_finite_reference_fields_remain_errors(self):
        for key,value in [('holdingPercent',float('nan')),('sectorName','-')]:
            body=copy.deepcopy(self.body);points=body['componentsByNameMap']['holdings']['containersByNameMap']['all']['dataPointsByNameMap'];points[key]['value'][0]=value
            with self.subTest(key=key),self.assertRaises(ValueError):equity_rows(body,None,'official',NOW,classification_only=True)

    def test_reference_weights_never_change_the_target_fund_allocation(self):
        target=[{'isin':'US0378331005','weightPct':60},{'isin':'US5949181045','weightPct':40}]
        ref={r['isin']:{'countryOfRisk':'United States','sectorName':'Technology','asOf':'2026-10-29','sourceUrl':'official-reference','holdingPercent':-7}for r in target}
        original=joined(target,'2026-10-29','target-fund',ref,NOW,'countries')
        ref['US0378331005']['holdingPercent']=999
        ref['US5949181045']['holdingPercent']=-999
        self.assertEqual(joined(target,'2026-10-29','target-fund',ref,NOW,'countries'),original)


class PlatformPhases(unittest.TestCase):
    def setUp(self):self.doc=fixture('tudigo-runoff-open.html.gz');self.day=NOW.date()

    def test_real_open_runoff_does_not_reopen_investment_platform(self):
        a=platform_activity('tudigo',[self.doc,self.doc],self.day)
        self.assertEqual(a['status'],'ceased');self.assertEqual(a['judgmentAt'],'2026-10-12')
        self.assertEqual(a['runoffAccess'],'open');self.assertEqual(a['runoffDataMigration'],'in-progress')
        self.assertNotIn('ne sont pas encore ouverts',a['notice'])
        self.assertIn('migration des données reste en cours',a['notice'])

    def old_terms(self):
        from test_presentation_actors import ActorTermsTests,TODAY
        return parse('tudigo',ActorTermsTests().fixtures()['tudigo'],TODAY)

    def test_activity_success_never_renews_archived_fee_dates(self):
        old=self.old_terms();activity=platform_activity('tudigo',[self.doc,self.doc],self.day)
        data,report=refresh({'tudigo':old},{'tudigo':lambda day:{'id':'tudigo','activity':activity}},self.day)
        self.assertEqual(report['observations'][0]['status'],'success')
        self.assertEqual(data['tudigo']['offers'],old['offers'])
        self.assertEqual(data['tudigo']['checkedAt'],old['checkedAt'])
        self.assertEqual(data['tudigo']['activity']['checkedAt'],'2026-10-30')

    def test_older_access_phase_and_network_failure_keep_the_previous_proof(self):
        old=self.old_terms();old['activity']=platform_activity('tudigo',[self.doc,self.doc],self.day)
        prior=copy.deepcopy(old)
        older=(ROOT/'scripts/fixtures/presentation-actors/tudigo-cessation-20261023.html').read_text()
        next_day=dt.date(2026,10,31);activity=platform_activity('tudigo',[older,older],next_day)
        data,report=refresh({'tudigo':old},{'tudigo':lambda day:{'id':'tudigo','activity':activity}},next_day)
        self.assertEqual(data['tudigo'],prior);self.assertEqual(report['observations'][0]['status'],'failure')
        def offline(day):raise TimeoutError('isolated network failure')
        data,report=refresh({'tudigo':old},{'tudigo':offline},next_day)
        self.assertEqual(data['tudigo'],prior);self.assertEqual(report['observations'][0]['status'],'failure')

    def test_missing_access_statement_keeps_old_value_dated_without_claiming_it_current(self):
        old=self.old_terms();old['activity']=platform_activity('tudigo',[self.doc,self.doc],self.day)
        partial=self.doc.replace('Vos accès à Run Off sont désormais ouverts.','')
        day=dt.date(2026,10,31);a=platform_activity('tudigo',[partial,partial],day)
        data,report=refresh({'tudigo':old},{'tudigo':lambda d:{'id':'tudigo','activity':a}},day)
        activity=data['tudigo']['activity']
        self.assertEqual(activity['runoffAccess'],'not-published');self.assertIsNone(activity['runoffAccessCheckedAt'])
        self.assertEqual(activity['lastKnownRunoffAccess']['state'],'open')
        self.assertEqual(activity['lastKnownRunoffAccess']['checkedAt'],'2026-10-30')
        self.assertNotIn('accès à Run Off sont désormais ouverts',activity['notice'])
        # Repeated incomplete notices must not lose or rejuvenate the last proof.
        next_day=dt.date(2026,11,1)
        again=platform_activity('tudigo',[partial,partial],next_day)
        repeated,report=refresh(data,{'tudigo':lambda d:{'id':'tudigo','activity':again}},next_day)
        self.assertEqual(repeated['tudigo']['activity']['lastKnownRunoffAccess'],activity['lastKnownRunoffAccess'])



class PurchasingMaturity(unittest.TestCase):
    def test_actual_three_price_series_remain_aligned_on_the_closed_month(self):
        from refresh_purchasing_power import parse_series
        for key in ['general','alimentation','energie']:
            result=parse_series(fixture(key+'.xml.gz'),key,NOW)
            self.assertEqual(max(result['values']),'2026-09')
            self.assertNotIn('2026-10',result['values'])
            pending=result['pendingObservations']
            self.assertEqual(len(pending),1)
            if pending:self.assertFalse(pending[0]['includedInActiveHistory'])

    def test_closed_flash_is_promoted_with_the_published_quality(self):
        from refresh_purchasing_power import parse_series
        for key in ['alimentation','energie']:
            after=parse_series(fixture(key+'.xml.gz'),key,dt.datetime(2026,11,1,tzinfo=UTC))
            self.assertEqual(max(after['values']),'2026-10')
            self.assertEqual(after['quality']['2026-10'],'P')
        general=parse_series(fixture('general.xml.gz'),'general',dt.datetime(2026,11,1,tzinfo=UTC))
        self.assertEqual(max(general['values']),'2026-10')

    def test_pending_month_cannot_hide_missing_prior_month_or_duplicate(self):
        from refresh_purchasing_power import parse_series
        for key in ['alimentation','energie']:
            root=ET.fromstring(fixture(key+'.xml.gz'));series=next(x for x in root.iter()if x.tag.rsplit('}',1)[-1]=='Series')
            for obs in list(series):
                if obs.get('TIME_PERIOD')=='2026-09':series.remove(obs)
            with self.assertRaises(ValueError):parse_series(ET.tostring(root,encoding='unicode'),key,NOW)
            root=ET.fromstring(fixture(key+'.xml.gz'));series=next(x for x in root.iter()if x.tag.rsplit('}',1)[-1]=='Series');series.append(copy.deepcopy(series[0]))
            with self.assertRaises(ValueError):parse_series(ET.tostring(root,encoding='unicode'),key,NOW)
