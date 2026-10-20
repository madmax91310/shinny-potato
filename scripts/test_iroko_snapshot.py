import copy
import datetime as dt
import json
from pathlib import Path
import unittest
from collect_iroko_snapshot import parse_snapshot
from collect_scpi import refresh,iroko_public_config
ROOT=Path(__file__).parent/'fixtures/scpi'
TODAY=dt.date(2026,10,20)
class IrokoSnapshotTests(unittest.TestCase):
    def test_public_embed_configuration_quote_change_and_conflict(self):
        for quote in ["'",'"']:
            script=f'const SUPABASE_URL = {quote}https://example123.supabase.co{quote}; const SUPABASE_ANON_KEY = {quote}sb_publishable_fixture{quote};'
            self.assertEqual(iroko_public_config(script),['https://example123.supabase.co','sb_publishable_fixture'])
            with self.assertRaises(ValueError):iroko_public_config(script+' const SUPABASE_URL = "https://other.supabase.co";')
            with self.assertRaises(ValueError):iroko_public_config(script.replace('example123.supabase.co','unexpected.test'))
    def source(self):return (ROOT/'iroko-quarterly.txt').read_text(),json.loads((ROOT/'iroko-quarterly-bbox.json').read_text())
    def test_date_basis_and_combined_sector(self):
        r=parse_snapshot(*self.source(),TODAY)
        self.assertEqual(r['asOf'],'2026-06-30')
        self.assertEqual(next(v['value'] for v in r['countries'] if v['label']=='France'),27.3)
        self.assertEqual(next(v['value'] for v in r['sectors'] if v['label']=='Santé, hôtellerie, autre'),10.6)
        self.assertAlmostEqual(sum(v['value'] for v in r['countries']),100)
    def test_changed_layout_date_or_omitted_row_rejected(self):
        text,pages=self.source()
        for bad in [text.replace('Données Iroko au','Publication au'),text.replace('30 juin 2026','30 juin 2027'),text.replace('30 juin 2026','29 juin 2026'),text.replace('Le 2e trimestre d’Iroko Zen','Le 3e trimestre d’Iroko Zen')]:
            with self.assertRaises(ValueError):parse_snapshot(bad,pages,TODAY)
        bad=copy.deepcopy(pages)
        next(w for w in bad[0]['words'] if w['text']=='France')['text']='Nouveau pays'
        with self.assertRaises(ValueError):parse_snapshot(text,bad,TODAY)
    def test_failed_snapshot_keeps_its_date_while_price_updates(self):
        # A source failure for one field must not freeze other independently dated fields.
        import test_scpi
        old=test_scpi.ScpiTests().remake();old['id']='iroko-zen';old['name']='Iroko Zen';old['checkedAt']='2026-10-08'
        old['snapshot']=parse_snapshot(*self.source(),dt.date(2026,10,8))
        previous={'records':[old]}
        new=copy.deepcopy(old);new['snapshot']=None;new['snapshotError']='PDF unavailable';new['checkedAt']=TODAY.isoformat();new['price']['value']=210;new['price']['asOf']='2026-10-20'
        result,observations=refresh(previous,{'iroko-zen':lambda day:new},TODAY)
        self.assertEqual(result['records'][0]['snapshot'],old['snapshot'])
        self.assertEqual(result['records'][0]['price']['value'],210)
        self.assertEqual([o['status'] for o in observations],['success','failure'])
        recovered=copy.deepcopy(result['records'][0]);recovered['snapshot']=parse_snapshot(*self.source(),TODAY)
        result,observations=refresh(result,{'iroko-zen':lambda day:recovered},TODAY)
        self.assertEqual(observations[-1]['status'],'success')
        self.assertEqual(result['records'][0]['snapshot']['checkedAt'],TODAY.isoformat())
if __name__=='__main__':unittest.main()
