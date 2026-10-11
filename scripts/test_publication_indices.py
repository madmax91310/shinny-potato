import base64
import copy
import datetime as dt
import io
import json
import unittest
from openpyxl import Workbook
from refresh_anniversary_indices import ROOT, configurations, russell_rows, allworld_rows, collect_ftse, merge_record, refresh
from refresh_anniversary_levels import collect_one as collect_level
from data_automation import UTC

NOW=dt.datetime(2026,10,11,12,tzinfo=UTC)

def workbook(title='FTSE All-World (USD)',header='Total Return',value=100):
    book=Workbook();sheet=book.active;sheet.title='AWORLDS'
    sheet['B5']=title;sheet['C8']='Index Value';sheet['E8']='Index Return %'
    for col,label in enumerate(['Date','Capital Return',header,'Capital Return','Total Return'],2):sheet.cell(9,col,label)
    sheet['B10']=dt.datetime(2026,8,31);sheet['D10']=value
    sheet['B11']=dt.datetime(2026,9,30);sheet['D11']=value+1
    # Price levels/return percentages must never be used as the TR level.
    sheet['C10']=50;sheet['C11']=51;sheet['F10']=.01;sheet['F11']=.02
    output=io.BytesIO();book.save(output);book.close();return output.getvalue()

class IndexTests(unittest.TestCase):
    def test_official_snapshot_replay(self):
        proof=json.loads((ROOT/'scripts/source-snapshots/anniversary-indices.json').read_text())
        active=json.loads((ROOT/'src/data/anniversary-index-history.json').read_text())
        self.assertEqual(set(proof),{c['id'] for c in configurations()})
        for config in configurations():
            record=proof[config['id']]
            self.assertEqual(record['points'],active[config['id']]['points'])
            self.assertEqual(len(record['proofRows']),len(record['points']))
            if config['parser'] in ('russell','ftse'):
                raw={url:base64.b64decode(value) for url,value in record['rawResponse'].items()}
                at=dt.datetime.strptime(record['periodEnd'],'%Y-%m').replace(tzinfo=UTC)
                from data_automation import month_shift
                replay=collect_ftse(config,month_shift(at,1),lambda url:raw[url])
                expected=[p for p in record['points'] if p[0]>=replay['points'][0][0]]
                self.assertEqual(replay['points'],expected)
            else:
                from refresh_monthly_history import collect_msci
                def fetch(url):
                    from urllib.parse import parse_qs,urlparse
                    return record['rawResponse'][parse_qs(urlparse(url).query)['data_frequency'][0]]
                from data_automation import month_shift
                at=dt.datetime.strptime(record['periodEnd'],'%Y-%m').replace(tzinfo=UTC)
                self.assertEqual(collect_msci(config,month_shift(at,1),fetch)['points'],record['points'])

    def test_ftse_identity_columns_invalid_values_and_month_holes(self):
        self.assertEqual(allworld_rows(workbook())[-1],(dt.date(2026,9,30),101))
        for raw in [workbook(title='FTSE All-World (EUR)'),workbook(header='Net Return'),workbook(value=0)]:
            with self.assertRaises(ValueError):allworld_rows(raw)
        config=next(c for c in configurations() if c['id']=='ftseAllWorld')
        self.assertEqual(collect_ftse(config,NOW,lambda _:workbook())['points'],[['2026-08',100],['2026-09',101]])
        with self.assertRaises(ValueError):collect_ftse(config,dt.datetime(2026,11,1,tzinfo=UTC),lambda _:workbook())
        level=collect_level(config,NOW,byte_fetch=lambda _:workbook())
        self.assertEqual((level['value'],level['asOf'],level['maxAgeDays']),(101,'2026-09-30',45))

    def test_russell_with_dividends_and_duplicates(self):
        header='Index_Name,Date,Value_Without_Dividends__USD_,Value_With_Dividends__USD_\n'
        row='Russell 2000®,10/09/2026,50,100\n'
        self.assertEqual(russell_rows((header+row).encode()),[(dt.date(2026,10,9),100)])
        for raw in [header+row+row,(header+row).replace('Russell 2000®','Russell 1000®'),(header+row).replace('With_Dividends__USD_','With_Dividends__EUR_'),(header+row).replace(',100',',nan')]:
            with self.assertRaises(ValueError):russell_rows(raw.encode())

    def test_rolling_workbook_accumulates_and_rejects_convention_changes(self):
        config=next(c for c in configurations() if c['id']=='ftseAllWorld')
        old={**config,'points':[['2026-07',99],['2026-08',100]],'periodEnd':'2026-08'}
        record=collect_ftse(config,NOW,lambda _:workbook())
        self.assertEqual(merge_record(config,record,old)['points'],[['2026-07',99],['2026-08',100],['2026-09',101]])
        for change in [{'currency':'EUR'},{'variant':'NETR'},{'indexCode':'WRONG'}]:
            with self.assertRaises(ValueError):merge_record({**config,**change},record,old)
        bad=copy.deepcopy(record);bad['points'][0][1]=150
        with self.assertRaises(ValueError):merge_record(config,bad,old)
        def fail(*args):raise ValueError('unavailable')
        updated,_,report=refresh({config['id']:old},{},NOW,fail)
        self.assertEqual(updated[config['id']],old)
        self.assertEqual(len(report['errors']),9)

if __name__=='__main__':unittest.main()
