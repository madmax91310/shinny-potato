"""Official service clauses, account scopes and partial collection recovery."""
import copy
import json
import pathlib
import unittest
from broker_profiles import DOCUMENTS, SOURCES, parse, collect_profiles

FIXTURES=pathlib.Path(__file__).parent/'fixtures/broker-profiles'
TODAY='2026-10-08'
def raws(broker,field):return {key:(FIXTURES/(key+'.txt')).read_text() for key in DOCUMENTS[broker][field]}

class BrokerProfilesTests(unittest.TestCase):
    def test_all_official_captures_and_provenance(self):
        count=0
        for broker,fields in DOCUMENTS.items():
            for field,keys in fields.items():
                if not all((FIXTURES/(key+'.txt')).exists() for key in keys):continue
                with self.subTest(broker=broker,field=field):
                    observation=parse(broker,field,raws(broker,field),TODAY)
                    self.assertIn(observation['available'],[True,False,None])
                    self.assertTrue(observation['statement'])
                    self.assertTrue(observation['refs'])
                    self.assertEqual(observation['checkedAt'],TODAY)
                    for ref in observation['refs']:
                        self.assertEqual(ref['sourceUrl'],SOURCES[ref['document']]['url'])
                        if ref['kind']=='pdf':self.assertGreater(ref['page'],0)
                    count+=1
        self.assertGreaterEqual(count,48)

    def test_unconfirmed_pea_services_never_become_negative(self):
        for broker,field in [('tr','pme'),('tr','garde'),('ibkr','pme'),('ibkr','jeune'),('ibkr','dca'),('fortuneo','dca'),('bourso','cash'),('fortuneo','cash'),('caidf','cash'),('caidf','change')]:
            with self.subTest(broker=broker,field=field):
                o=parse(broker,field,raws(broker,field),TODAY)
                self.assertIsNone(o['available'])
                self.assertNotEqual(o['status'],'confirmé')

    def test_changed_clause_is_not_silently_recertified(self):
        for broker,field,old,new in [('saxo','jeune','ne propose pas','propose désormais'),('xtb','jeune','ne permet pas','permet'),('fortuneo','jeune','n’est pas commercialisé','est commercialisé'),('saxo','dca',"n'est pas utilisable",'est utilisable')]:
            raw=raws(broker,field)
            # PDF captures can use straight/curly quotes; mutate the actual spelling.
            changed={key:text.replace(old,new).replace(old.replace('’',"'"),new) for key,text in raw.items()}
            self.assertNotEqual(raw,changed)
            with self.subTest(broker=broker,field=field),self.assertRaises(ValueError):parse(broker,field,changed,TODAY)

    def test_numeric_change_reaches_copy(self):
        raw=raws('bourso','dca');raw={key:text.replace('Minimum : 10€','Minimum : 15€') for key,text in raw.items()}
        self.assertIn('15 €/fonds/mois',parse('bourso','dca',raw,TODAY)['copy']['full'])
        raw=raws('xtb','cash');raw={key:text.replace('90 jours','60 jours').replace('100 000 EUR','120 000 EUR') for key,text in raw.items()}
        result=parse('xtb','cash',raw,TODAY)['copy']['full']
        self.assertIn('60 jours',result);self.assertIn('120000 €',result)

    def test_new_explicit_pea_sources_and_changed_clauses(self):
        for broker,field,key,old,new in [
            ('tr','dca','trPeaHelp','sans frais de France grâce aux plans','avec frais de France grâce aux plans'),
            ('ibkr','entrant','ibkrTransfer','You can transfer PEA accounts','You cannot transfer PEA accounts')]:
            raw=raws(broker,field)
            o=parse(broker,field,raw,TODAY)
            self.assertTrue(o['available']);self.assertEqual(o['status'],'confirmé')
            raw[key]=raw[key].replace(old,new)
            with self.assertRaises(ValueError):parse(broker,field,raw,TODAY)
        o=parse('ibkr','entrant',raws('ibkr','entrant'),TODAY)
        self.assertEqual(len(o['refs']),2)
        self.assertIn('courtier de départ',o['copy']['full'])

    def test_caidf_setup_fee_not_inferred_from_national_page(self):
        o=parse('caidf','dca',raws('caidf','dca'),TODAY)
        self.assertIn('consulter la caisse',o['copy']['full']);self.assertNotIn('gratuite',o['copy']['full'])

    def test_source_failure_retains_each_field_and_recovery_clears_failure(self):
        baseline={'brokers':{broker:{'profile':{}} for broker in DOCUMENTS}}
        previous=parse('saxo','jeune',raws('saxo','jeune'),'2026-10-01')
        baseline['brokers']['saxo']['profile']['jeune']=previous
        def unavailable(url):raise ValueError('503')
        failures,count=collect_profiles(baseline,TODAY,unavailable)
        self.assertEqual(count,0);self.assertEqual(baseline['brokers']['saxo']['profile']['jeune'],previous)
        self.assertIn('saxo:profile:jeune',failures)
        def partial(url):
            if url==SOURCES['saxoPeaHelp']['url']:return raws('saxo','jeune')['saxoPeaHelp']
            raise ValueError('503')
        failures,count=collect_profiles(baseline,TODAY,partial)
        self.assertEqual(count,1);self.assertNotIn('saxo:profile:jeune',failures)
        self.assertEqual(baseline['brokers']['saxo']['profile']['jeune']['checkedAt'],TODAY)

if __name__=='__main__':unittest.main()
