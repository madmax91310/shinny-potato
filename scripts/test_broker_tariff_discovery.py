"""Discovery provenance, scoped tables, wording changes and safe recovery."""
import copy
import pathlib
import html
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from issuer_documents import download
from data_automation import ResponseFormatError
import unittest
from unittest.mock import patch
from broker_profile_discovery import allowed, links, discover, MAX_CANDIDATES
from broker_profile_qualification import qualify
from broker_profiles import SOURCES, DOCUMENTS, parse, collect_profiles

TODAY = '2026-10-08'
FIXTURES = pathlib.Path(__file__).parent / 'fixtures/broker-profiles'


class DiscoveryTests(unittest.TestCase):
    def test_redirect_scope_is_checked_before_following_and_final_url_retained(self):
        visits=[]
        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                visits.append(self.path)
                if self.path=='/start.pdf':
                    self.send_response(302);self.send_header('Location','/current.pdf');self.end_headers()
                elif self.path=='/wrong.pdf':
                    self.send_response(302);self.send_header('Location','/outside.pdf');self.end_headers()
                else:
                    self.send_response(200);self.end_headers();self.wfile.write(b'%PDF-proof')
            def log_message(self,*args):pass
        server=HTTPServer(('127.0.0.1',0),Handler)
        worker=threading.Thread(target=server.serve_forever,daemon=True);worker.start()
        base=f'http://127.0.0.1:{server.server_port}'
        validator=lambda url:url in {base+'/start.pdf',base+'/current.pdf',base+'/wrong.pdf'}
        try:
            body,actual=download(base+'/start.pdf',url_validator=validator,return_source=True)
            self.assertEqual(body,b'%PDF-proof');self.assertEqual(actual,base+'/current.pdf')
            with self.assertRaises(ResponseFormatError):download(base+'/wrong.pdf',url_validator=validator)
            self.assertNotIn('/outside.pdf',visits)
        finally:server.shutdown();worker.join();server.server_close()
    def test_official_regions_ports_and_login_boundaries(self):
        good = 'https://www.credit-agricole.fr/content/dam/assetsca/cr882/conditions-titres.pdf'
        self.assertTrue(allowed('caidf', good))
        for url in [good.replace('cr882','cr848'),good.replace('https:','http:'),
                    good.replace('www.credit-agricole.fr','example.com'),
                    good.replace('www.credit-agricole.fr','user@www.credit-agricole.fr'),
                    good.replace('www.credit-agricole.fr','www.credit-agricole.fr:9999'),
                    good+'?login=1', good.replace('www.credit-agricole.fr','www.credit-agricole.fr:bad'),
                    good.replace('cr882/','cr882/%2e%2e/cr848/'),'https://[invalid/']:
            with self.subTest(url=url):self.assertFalse(allowed('caidf',url))

    def test_relative_links_fragments_and_unrelated_products(self):
        html = '''<html><body><nav><a href="/faq/cto-nav">Espèces CTO</a></nav>
        <a href="/faq/especes-cto#interest">Rémunération des espèces CTO</a>
        <a href="https://www.fortuneo.fr/faq/especes-cto">Espèces CTO</a>
        <a href="/blog/cto">Intérêts CTO</a><a href="/faq/livret">Intérêts du Livret</a>
        <a href="https://example.com/faq/cash">Espèces CTO</a></body></html>'''
        self.assertEqual(links('fortuneo','cash',html,'https://www.fortuneo.fr/faq/bourse'),
                         ['https://www.fortuneo.fr/faq/especes-cto'])

    def test_dynamic_source_identity_rotation_and_no_registry_mutation(self):
        previous = copy.deepcopy(SOURCES)
        hub = SOURCES['ibkrPea']['url']
        target = 'https://www.interactivebrokers.ie/fr/accounts/pea-pme-new.php'
        seen=[]
        def fetch(url):
            seen.append(url)
            return '<html><body><p>IBKR commercialise un PEA-PME.</p></body></html>' if url == target else '<html><body></body></html>'
        cache={hub:f'<html><body><a href="{target}">PEA-PME</a></body></html>'}
        with patch('broker_profile_discovery.TARGETS',{('ibkr','pme')}):
            extra,catalog,report,failures=discover(fetch,SOURCES,DOCUMENTS,cache)
        self.assertFalse(failures)
        self.assertNotIn(hub,seen)
        raw={key:'PEA' for key in DOCUMENTS['ibkr']['pme']}
        raw.update(extra[('ibkr','pme')])
        o=parse('ibkr','pme',raw,TODAY,catalog)
        self.assertTrue(o['available']);self.assertEqual(o['sourceUrl'],target)
        self.assertEqual(o['refs'][0]['discoveryUrl'],hub)
        self.assertTrue(o['refs'][0]['sha256']);self.assertEqual(SOURCES,previous)
        rotated=target.replace('new','next')
        cache[hub]=cache[hub].replace(target,rotated)
        with patch('broker_profile_discovery.TARGETS',{('ibkr','pme')}):
            extra2,catalog2,_,_=discover(fetch,SOURCES,DOCUMENTS,cache)
        keys={k for k in extra[('ibkr','pme')] if k.startswith('discovered')}
        keys2={k for k in extra2[('ibkr','pme')] if k.startswith('discovered')}
        self.assertNotEqual(keys,keys2)

    def test_candidate_limit_is_visible_instead_of_silent_partial_inventory(self):
        hub=SOURCES['ibkrPea']['url']
        html='<html><body>'+''.join(f'<a href="/fr/accounts/pea-{n}.php">PEA-PME</a>' for n in range(MAX_CANDIDATES+1))+'</body></html>'
        with patch('broker_profile_discovery.TARGETS',{('ibkr','pme')}):
            _,_,report,failures=discover(lambda url:'PEA',SOURCES,DOCUMENTS,{hub:html})
        self.assertIn('ibkr:profile:pme:discovery',failures)
        self.assertIn('Inventaire trop large',str(report))

    def test_discovered_source_failure_and_disappearance_retain_previous_date(self):
        hub=SOURCES['ibkrPea']['url'];target='https://www.interactivebrokers.ie/fr/accounts/pea-pme-live.php'
        mode=['healthy']
        def fetch(url):
            if url==hub:
                base=(FIXTURES/'ibkrPea.txt').read_text()
                return '<html><body><p>'+html.escape(base)+'</p>'+ (f'<a href="{target}">PEA-PME</a>' if mode[0]!='removed' else '')+'</body></html>'
            if url==target:
                if mode[0]=='offline':raise ValueError('503 new official source')
                return '<html><body><p>IBKR commercialise un PEA-PME.</p></body></html>'
            key=next((key for key,info in SOURCES.items() if info['url']==url),None)
            p=FIXTURES/((key or '')+'.txt')
            return p.read_text() if p.exists() else '<html><body>PEA</body></html>'
        baseline={'brokers':{broker:{'profile':{}} for broker in DOCUMENTS}}
        with patch('broker_profile_discovery.TARGETS',{('ibkr','pme')}):
            failures,_=collect_profiles(baseline,'2026-10-01',fetch)
            self.assertNotIn('ibkr:profile:pme',failures)
            previous=copy.deepcopy(baseline['brokers']['ibkr']['profile']['pme'])
            self.assertTrue(previous['available'])
            for state in ['offline','removed']:
                mode[0]=state
                failures,_=collect_profiles(baseline,TODAY,fetch)
                self.assertIn('ibkr:profile:pme',failures)
                self.assertEqual(baseline['brokers']['ibkr']['profile']['pme'],previous)
            mode[0]='healthy';failures,_=collect_profiles(baseline,TODAY,fetch)
            self.assertNotIn('ibkr:profile:pme',failures)
            self.assertEqual(baseline['brokers']['ibkr']['profile']['pme']['checkedAt'],TODAY)

    def test_wording_and_typography_changes_keep_exact_evidence(self):
        for broker,field,clause,value in [
            ('ibkr','pme','Nous ne commercialisons pas de PEA-PME.',False),
            ('ibkr','jeune','Le PEA Jeune est proposé chez Interactive Brokers.',True),
            ('fortuneo','dca','Le service d’investissement programmé est disponible sur le PEA.',True),
            ('bourso','cash','Les sommes déposées sur le compte espèces associé au CTO ne donnent pas lieu à rémunération.',False),
            ('tr','garde','Les droits de garde sur le PEA ne sont pas facturés.',True),
            ('caidf','change','Commission de change pour les opérations boursières : 0,15%.',True)]:
            with self.subTest(clause=clause):
                o=qualify(broker,field,{'official':'<html><body><p>'+clause+'</p></body></html>'},TODAY)
                self.assertEqual(o[0],value);self.assertEqual(o[4],clause.rstrip('.'))

    def test_question_future_headings_and_conditional_clauses_are_not_proofs(self):
        for raw in ['IBKR propose un PEA-PME?',
                    'Si IBKR propose un PEA-PME, contactez-nous.',
                    'IBKR ne proposera pas de PEA-PME.',
                    '<html><body><h2>Offre 2027.</h2><h3>PEA-PME</h3><p>IBKR propose un PEA-PME.</p></body></html>',
                    'Tarifs au 01/12/2026. IBKR propose un PEA-PME.',
                    'Tarifs au 1er décembre 2026.\fIBKR propose un PEA-PME.']:
            self.assertIsNone(qualify('ibkr','pme',{'official':raw},TODAY))

    def test_table_column_order_and_scope_are_preserved(self):
        for headers,values in [(['CTO','PEA'],['1 €','0 €']),(['PEA','CTO'],['0 €','1 €'])]:
            html='<html><body><table><tr><th>Service</th>'+''.join('<th>'+h+'</th>' for h in headers)+'</tr><tr><td>Droits de garde</td>'+''.join('<td>'+v+'</td>' for v in values)+'</tr></table></body></html>'
            o=qualify('tr','garde',{'official':html},TODAY)
            self.assertTrue(o[0]);self.assertEqual(o[2],'Droits de garde (PEA) : 0 €.')
            self.assertIn('1 €',o[4])  # Entire source table is retained, including headers.
        wrong='<html><body><table><tr><th>Service</th><th>CTO</th><th>Autre compte</th></tr><tr><td>Droits de garde</td><td>0 €</td><td>0 €</td></tr></table></body></html>'
        self.assertIsNone(qualify('tr','garde',{'official':wrong},TODAY))

    def test_tariff_table_pdf_page_provenance_and_ambiguity(self):
        html='<html><body><table><tr><th>Produit</th><th>Disponibilité</th></tr><tr><td>PEA-PME</td><td>Non</td></tr></table></body></html>'
        self.assertFalse(qualify('tr','pme',{'official':html},TODAY)[0])
        for altered in [html.replace('Disponibilité','Éligibilité fiscale'),html.replace('<td>Non</td>','<td>Non*</td>'),html.replace('<th>Produit</th>','<th colspan="2">Produit</th>')]:
            self.assertIsNone(qualify('tr','pme',{'official':altered},TODAY))
        raw={'trContract':'PEA\fLes droits de garde sur le PEA ne sont pas facturés.\fFin', 'trFees':'CTO'}
        o=parse('tr','garde',raw,TODAY)
        self.assertEqual(o['refs'][0]['page'],2)
        with self.assertRaises(ValueError):
            qualify('tr','pme',{'one':html,'two':'Trade Republic propose un PEA-PME.'},TODAY)


if __name__=='__main__':unittest.main()
