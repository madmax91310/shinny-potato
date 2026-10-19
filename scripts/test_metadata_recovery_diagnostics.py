import datetime as dt
import unittest
from collect_instrument_metadata import field_diagnostics


class FieldRecoveryDiagnostics(unittest.TestCase):
    def test_attempt_never_recertifies_old_value_or_invents_negative_pea(self):
        now=dt.datetime(2026,10,19,tzinfo=dt.timezone.utc)
        source={'urls':['https://issuer.example/exact-share']}
        errors=[{'sourceUrl':source['urls'][0],'error':'HTTP Error 503'}]
        old={'pea':{'value':True,'checkedAt':'2026-09-30'}}
        result=field_diagnostics(source,{},errors,old,now)
        self.assertEqual(result['pea']['status'],'retained')
        self.assertEqual(result['pea']['lastSuccessAt'],'2026-09-30')
        self.assertEqual(result['pea']['lastAttemptAt'],now.isoformat())
        self.assertEqual(result['listings']['status'],'unobserved')
        self.assertIsNone(result['listings']['lastSuccessAt'])
        self.assertEqual(result['pea']['sourceErrors'],errors)
        self.assertEqual(old['pea']['checkedAt'],'2026-09-30')
        self.assertNotIn('value',result['listings'])

    def test_only_reobserved_field_recovers(self):
        now=dt.datetime(2026,10,19,tzinfo=dt.timezone.utc)
        result=field_diagnostics({'urls':['https://issuer.example/exact-share']},
            {'pea':{'value':False,'checkedAt':'2026-10-19'}},[],{},now)
        self.assertEqual(result['pea']['status'],'observed')
        self.assertIsNone(result['pea']['cause'])
        self.assertEqual(result['pea']['lastSuccessAt'],'2026-10-19')
        self.assertEqual(result['listings']['status'],'unobserved')


if __name__=='__main__':
    unittest.main()
