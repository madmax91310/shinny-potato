"""Official service clauses, account scopes and partial collection recovery."""
import copy
import json
import pathlib
import re
import unittest
from broker_profiles import DOCUMENTS, SOURCES, parse, collect_profiles
from broker_profile_qualification import TARGETS, qualify

FIXTURES=pathlib.Path(__file__).parent/'fixtures/broker-profiles'
TODAY='2026-10-08'
def raws(broker,field):return {key:(FIXTURES/(key+'.txt')).read_text() for key in DOCUMENTS[broker][field]}

class BrokerProfilesTests(unittest.TestCase):
    def test_current_caidf_cto_clause_keeps_page_and_conditional_fees(self):
        from broker_document_sources import SourceDocument
        raw=raws('caidf','change')
        url='https://www.credit-agricole.fr/content/dam/assetsca/cr882/npc/documents/fip-et-cgl/66289.1789655190953.CGL_CTO_PDF.pdf'
        text=(FIXTURES/'caCtoContract-current.txt').read_text()
        raw['caCtoContract']=SourceDocument(text,url)
        o=parse('caidf','change',raw,'2026-10-18')
        self.assertEqual(o['sourceUrl'],url)
        self.assertEqual(o['refs'][0]['page'],28)
        self.assertTrue(o['conversion']['feesConditional'])
        self.assertEqual(o['conversion']['account'],'CTO')
        self.assertIsNone(o['conversion']['rate'])
        self.assertEqual(o['status'],'partiel')
        for old,new in [('votre CTO','votre compte bancaire'),('Des frais peuvent s’appliquer.','Aucun frais ne s’applique.'),('taux de change que nous pratiquons','taux de change à demander')]:
            changed={**raw,'caCtoContract':text.replace(old,new)}
            with self.subTest(old=old),self.assertRaises(ValueError):parse('caidf','change',changed,'2026-10-18')
    def test_tr_currency_margins_are_extracted_without_percentage_conversion(self):
        raw = raws('tr','change')
        observed = parse('tr','change',raw,TODAY)
        self.assertEqual(observed['conversion']['publishedMargins']['USD'],0.0014)
        self.assertEqual(observed['conversion']['publishedMargins']['SEK'],0.0114)
        self.assertEqual(observed['conversion']['publishedMargins']['IDR'],24)
        updated = dict(raw)
        updated['trFxRules'] = raw['trFxRules'].replace('USD - 0,0014','USD - 0,0028')
        self.assertEqual(parse('tr','change',updated,TODAY)['conversion']['publishedMargins']['USD'],0.0028)
        updated['trFxRules'] = raw['trFxRules'].replace('USD - 0,0014','USD - 0,0014 %')
        with self.assertRaises(ValueError): parse('tr','change',updated,TODAY)
        self.assertEqual(observed['status'],'partiel')

    def test_peps_purchase_fee_and_paid_sale_are_revalidated(self):
        raw = raws('saxo','dca')
        observed = parse('saxo','dca',raw,TODAY)
        self.assertFalse(observed['available'])
        self.assertEqual(observed['programmed'],{'frequency':'monthly','purchaseFee':0,'salePaid':True})
        self.assertEqual({ref['document'] for ref in observed['refs']},{'saxoAutoinvest','saxoPepsHelp'})
        updated = dict(raw)
        updated['saxoPepsHelp'] = updated['saxoPepsHelp'].replace('0€ de frais', '1€ de frais')
        self.assertEqual(parse('saxo','dca',updated,TODAY)['programmed']['purchaseFee'],1)
        updated['saxoPepsHelp'] = updated['saxoPepsHelp'].replace('frais de transaction uniquement lors de la vente de vos positions','frais de vente modifiés')
        with self.assertRaises(ValueError): parse('saxo','dca',updated,TODAY)

    def test_future_explicit_proofs_promote_all_twelve_scopes_with_provenance(self):
        clauses = {
            ('tr','pme'): 'Trade Republic offers PEA-PME accounts.',
            ('tr','garde'): 'Custody fees for the PEA are zero.',
            ('tr','change'): 'La commission de change du PEA est de 0,20 %.',
            ('ibkr','pme'): 'Interactive Brokers ne propose pas de PEA-PME.',
            ('ibkr','jeune'): 'IBKR propose un PEA Jeune.',
            ('ibkr','dca'): 'Les achats automatiques sur PEA sont disponibles chez IBKR.',
            ('fortuneo','dca'): 'Les investissements programmés sur PEA ne sont pas disponibles chez Fortuneo.',
            ('fortuneo','cash'): 'Les espèces du compte-titres ordinaire sont rémunérées à un taux variable.',
            ('bourso','cash'): 'Les espèces du compte-titres ordinaire ne sont pas rémunérées.',
            ('caidf','cash'): 'Les liquidités du compte-titres ordinaire (CTO) sont rémunérées à 1.25 %.',
            ('caidf','change'): 'La commission de change sur les opérations boursières est de 0,05 %.',
            ('bd','cash'): 'Les espèces du compte-titres ordinaire sont rémunérées.',
        }
        self.assertEqual(set(clauses), TARGETS)
        # Synthetic future clauses test the parser; they are not current facts.
        for (broker,field),clause in clauses.items():
            with self.subTest(broker=broker,field=field):
                raw={key:'Document synthétique : PEA.' for key in DOCUMENTS[broker][field]}
                document=DOCUMENTS[broker][field][-1]
                raw[document]+='\n\f\n. '+clause
                o=parse(broker,field,raw,TODAY)
                self.assertEqual(o['status'],'confirmé')
                self.assertEqual(o['available'],' ne ' not in clause)
                self.assertEqual(o['decisiveDocument'],document)
                self.assertIn(clause.rstrip('.'),o['statement'])
                self.assertEqual(len(o['refs']),1)
                self.assertEqual(o['refs'][0]['document'],document)
                self.assertEqual(o['copy']['full'],clause)

    def test_wrong_scope_future_conditional_and_generic_mentions_stay_unknown(self):
        cases = [
            ('tr','pme','Trade Republic prévoit de proposer un PEA-PME.'),
            ('tr','pme','Si Trade Republic propose un PEA-PME, contactez-nous.'),
            ('ibkr','jeune','Le PEA est accessible aux personnes majeures.'),
            ('ibkr','dca','Les achats automatiques sur CTO sont disponibles chez IBKR.'),
            ('fortuneo','dca','Les versements programmés sur PEA sont disponibles chez Fortuneo.'),
            ('fortuneo','dca','Les achats automatiques sur PEA sont disponibles chez un autre courtier.'),
            ('fortuneo','dca','Les achats automatiques sur PEA sont disponibles chez Fortuneo à partir de 2027.'),
            ('bourso','cash','Les espèces du PEA ne sont pas rémunérées.'),
            ('tr','garde','Les frais de garde du CTO sont gratuits.'),
            ('tr','change','La commission de change de la carte Visa est de 0 %.'),
            ('caidf','change','La commission de change des virements bancaires est de 0,05 %.'),
        ]
        for broker,field,clause in cases:
            with self.subTest(clause=clause):
                self.assertIsNone(qualify(broker,field,{'official':clause}))

    def test_competing_availability_or_rates_are_reported(self):
        for broker,field,a,b in [
            ('tr','pme','Trade Republic propose un PEA-PME.','Trade Republic ne propose pas de PEA-PME.'),
            ('tr','change','La commission de change du PEA est de 0,10 %.','La commission de change du PEA est de 0,20 %.')]:
            with self.subTest(field=field),self.assertRaises(ValueError):
                qualify(broker,field,{'first':a,'second':b})
        with self.assertRaises(ValueError):
            qualify('tr','change',{'official':'La commission de change du PEA est de 120 %.'})

    def test_disappearing_new_proof_retains_date_and_recovery_resumes(self):
        baseline={'brokers':{broker:{'profile':{}} for broker in DOCUMENTS}}
        changed=raws('tr','pme')
        changed['trContract']+=' . Trade Republic propose un PEA-PME.'
        previous=parse('tr','pme',changed,'2026-10-01')
        baseline['brokers']['tr']['profile']['pme']=copy.deepcopy(previous)
        def fetch(url):
            key=next(key for key,info in SOURCES.items() if info['url']==url)
            return (FIXTURES/(key+'.txt')).read_text()
        failures,count=collect_profiles(baseline,TODAY,fetch)
        self.assertIn('tr:profile:pme',failures)
        self.assertEqual(baseline['brokers']['tr']['profile']['pme'],previous)
        def recovered(url):
            return changed['trContract'] if url==SOURCES['trContract']['url'] else fetch(url)
        failures,count=collect_profiles(baseline,TODAY,recovered)
        self.assertNotIn('tr:profile:pme',failures)
        self.assertEqual(baseline['brokers']['tr']['profile']['pme']['checkedAt'],TODAY)

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
        for broker,field in [('tr','pme'),('tr','garde'),('fortuneo','dca'),('bourso','cash'),('fortuneo','cash'),('caidf','cash')]:
            with self.subTest(broker=broker,field=field):
                o=parse(broker,field,raws(broker,field),TODAY)
                self.assertIsNone(o['available'])
                self.assertNotEqual(o['status'],'confirmé')

    def test_regional_cto_fx_keeps_fees_and_does_not_invent_a_rate_or_pea_scope(self):
        raw = raws('caidf','change')
        observed = parse('caidf','change',raw,TODAY)
        self.assertEqual(observed['status'],'partiel')
        self.assertEqual(observed['conversion'],{'account':'CTO','toEuro':True,'bankRate':True,'associatedFees':True,'rate':None})
        self.assertEqual(observed['decisiveDocument'],'caCtoContract')
        self.assertTrue(observed['refs'][0]['page'])
        self.assertIn('frais et commissions',observed['statement'])
        changed = dict(raw)
        changed['caCtoContract'] = re.sub(r'ainsi\s+que\s+les\s+frais\s+et\s+commissions\s+y\s+afférents','sans frais supplémentaires',raw['caCtoContract'])
        with self.assertRaises(ValueError): parse('caidf','change',changed,TODAY)

    def test_ibkr_published_faq_resolves_scopes_with_joint_evidence(self):
        for field in ['pme','jeune']:
            observed=parse('ibkr',field,raws('ibkr',field),TODAY)
            self.assertFalse(observed['available'])
            self.assertEqual(observed['status'],'confirmé')
        dca=parse('ibkr','dca',raws('ibkr','dca'),TODAY)
        self.assertEqual({ref['document'] for ref in dca['refs']},
                         {'ibkrFractionalFaq','ibkrRecurringEligibilityFaq','ibkrDcaRequirement'})
        self.assertFalse(dca['available'])
        self.assertEqual(dca['status'],'confirmé')
        self.assertIn('Rapprochement',dca['method'])
        altered=raws('ibkr','dca')
        altered['ibkrDcaRequirement']=altered['ibkrDcaRequirement'].replace('Account must have fractional share trading enabled','Account may have fractional share trading enabled')
        with self.assertRaises(ValueError):parse('ibkr','dca',altered,TODAY)
        altered=raws('ibkr','dca')
        altered['ibkrRecurringEligibilityFaq']='Recurring Investment is available on PEA.'
        with self.assertRaises(ValueError):parse('ibkr','dca',altered,TODAY)
        cash=parse('ibkr','cash',raws('ibkr','cash'),TODAY)
        self.assertIn('Espèces du PEA non rémunérées.',cash['copy']['full'])
        self.assertIn('Hors PEA',cash['copy']['full'])
        self.assertIn('peaCashRules',{ref['document'] for ref in cash['refs']})
        fx=parse('ibkr','change',raws('ibkr','change'),TODAY)
        self.assertTrue(fx['available'])
        self.assertIn('conversion automatique',fx['copy']['full'])

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

class ClauseEvidenceTests(unittest.TestCase):
    def test_missing_clause_reports_closest_current_passage(self):
        from broker_profiles import find
        text='Préambule. Pour les opérations en devises, le compte du Client sera débité de la contre-valeur en euros. Fin.'
        with self.assertRaisesRegex(ValueError,'Passage actuel le plus proche : « Pour les opérations en devises, le compte du Client sera débité'):
            find(r'Pour les opérations en devises, le compte du Client enregistrera la contre-valeur en euros',text)
        with self.assertRaisesRegex(ValueError,'Aucun passage proche'):
            find(r'Frais\s+de garde gratuits sur le PEA jeunes',text)
        self.assertTrue(find(r'contre-valeur\s+en euros',text))


if __name__=='__main__':unittest.main()
