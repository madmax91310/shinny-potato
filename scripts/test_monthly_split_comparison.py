import copy
import datetime as dt
import gzip
import json
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch
from qualified_split_comparison import qualify, comparison_value, NOTICE
from refresh_monthly_history import collect_yahoo, refresh

ROOT=Path(__file__).resolve().parents[1]
FIX=ROOT/'scripts/fixtures/imie-split-2026'
NOW=dt.datetime(2026,10,29,tzinfo=dt.timezone.utc)

class OfficialSplitComparison(unittest.TestCase):
    def setUp(self):
        self.config=next(s for s in json.loads((ROOT/'scripts/monthly-automation.json').read_text())['series']if s['id']=='etfImie')
        self.notice=gzip.decompress((FIX/'official-notice.pdf.gz').read_bytes())
        receipts=json.loads((FIX/'imie-current-chart-receipts.json').read_text())
        self.responses={r['url']:json.loads(gzip.decompress((FIX/r['file']).read_bytes()))for r in receipts if r.get('file')}

    def test_actual_responses_reconcile_37_comparisons_without_rescaling_daily_prices(self):
        with patch('qualified_split_comparison.download',return_value=self.notice):
            result=collect_yahoo(self.config,NOW,lambda u:self.responses[u])
        self.assertEqual(len(result['points']),179)
        self.assertEqual(sum('splitComparison'in r for r in result['proofRows']),37)
        self.assertEqual(result['points'][0],['2011-11',1.9844])
        december=dict(result['points'])['2014-12'];january=dict(result['points'])['2015-01']
        self.assertAlmostEqual((january/december-1)*100,5.553552109628564,places=8)
        self.assertTrue(all(r['value']==r['close']for r in result['proofRows']),'No invented dividend or second split adjustment')
        self.assertEqual(result['splitComparisonEvidence']['noticeDate'],'2026-01-20')
        self.assertEqual(result['splitComparisonEvidence']['checkedAt'],'2026-10-29')

    def test_unchanged_prices_and_idempotence(self):
        with patch('qualified_split_comparison.download',return_value=self.notice):p=qualify(self.config,NOW)
        d=dt.date(2014,12,31)
        first,changed=comparison_value(83.19,3.3276,d,p)
        self.assertTrue(changed);self.assertEqual(first,3.3276)
        self.assertEqual(comparison_value(first,3.3276,d,p),(3.3276,False))
        self.assertEqual(comparison_value(83.19,3.3276,dt.date(2026,2,23),p),(83.19,False))
        self.assertEqual(comparison_value(83.19,3.3276,d,None),(83.19,False))
        self.assertEqual(comparison_value(83.19,2.0,d,p),(83.19,False))

    def test_wrong_identity_and_future_event_rejected(self):
        for key,value in [('isin','IE000OTHER00'),('currency','USD'),('field','close'),('mic','XLON'),('splitComparisonNotice','https://other.example/notice')]:
            with self.subTest(key=key),self.assertRaises(ValueError):qualify({**self.config,key:value},NOW,lambda _:self.notice)
        with self.assertRaises(ValueError):qualify(self.config,dt.datetime(2026,2,20),lambda _:self.notice)

    def test_wrong_ratio_date_or_part_in_official_document_rejected(self):
        from issuer_documents import pdf_text
        text=pdf_text(self.notice)
        for a,b in [('25-to-1','24-to-1'),('23 February 2026','24 February 2026'),('IE00B3YLTY66','IE000OTHER00'),('USD Unhedged (Acc)','USD Hedged (Acc)')]:
            with self.subTest(a=a),patch('qualified_split_comparison.pdf_text',return_value=text.replace(a,b)),self.assertRaises(ValueError):qualify(self.config,NOW,lambda _:self.notice)

    def test_unexplained_comparison_still_refused(self):
        responses=copy.deepcopy(self.responses)
        m=next(v['chart']['result'][0]for u,v in responses.items()if 'interval=1mo' in u)
        m['indicators']['quote'][0]['close'][0]*=1.01
        with patch('qualified_split_comparison.download',return_value=self.notice),self.assertRaisesRegex(ValueError,'Monthly close differs'):
            collect_yahoo(self.config,NOW,lambda u:responses[u])

    def test_missing_notice_retains_values_and_control_dates(self):
        old=json.loads((ROOT/'src/data/automated-etf-monthly.json').read_text())['etfImie'];before=copy.deepcopy(old)
        with patch('qualified_split_comparison.download',side_effect=OSError('isolated source failure')):
            updated,report=refresh({'series':[self.config]},{'etfImie':old},{},NOW)
        self.assertEqual(report['series'][0]['status'],'failed');self.assertEqual(updated['etfImie'],before)

    def test_publication_guard_rejects_forged_or_double_adjustments(self):
        subprocess.run(['node',str(ROOT/'scripts/test-split-comparison-proof.mjs')],cwd=ROOT,check=True,capture_output=True)

if __name__=='__main__':unittest.main()
