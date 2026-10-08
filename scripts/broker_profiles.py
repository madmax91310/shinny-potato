"""Revalidate every non-tariff broker column against public official statements.

Silence is an unknown answer, never a negative. A failed download/changed clause
retains the previous observation and is reported by the regulatory workflow.
"""
import concurrent.futures
import hashlib
import json
import pathlib
import re
from bs4 import BeautifulSoup

SOURCES = json.loads(pathlib.Path(__file__).with_name('broker_profile_sources.json').read_text())
FIELDS = ('dca', 'pea', 'pme', 'jeune', 'ifu', 'cash', 'boursomarkets')
DOCUMENTS = {
 'tr': {'dca':['trContract','trFees'], 'pea':['trContract'], 'pme':['trContract'], 'jeune':['trContract'], 'ifu':['trContract'], 'cash':['trContract'], 'change':['trDividendsFx'], 'garde':['trContract','trFees']},
 'bourso': {'dca':['boursoTariff'], 'pea':['boursoTariff'], 'pme':['boursoTariff'], 'jeune':['boursoTariff'], 'ifu':['boursoIfu'], 'cash':['boursoContract'], 'boursomarkets':['boursoMarkets'], 'garde':['boursoTariff']},
 'fortuneo': {'dca':['fortuneoSmartOrders','fortuneoContract'], 'pea':['fortuneoTariff'], 'pme':['fortuneoTariff'], 'jeune':['fortuneoContract'], 'ifu':['fortuneoIfu'], 'cash':['fortuneoContract']},
 'ibkr': {'dca':['ibkrPea','ibkrDca'], 'pea':['ibkrPea'], 'pme':['ibkrPea'], 'jeune':['ibkrPea'], 'ifu':['ibkrPea'], 'cash':['ibkrInterest'], 'entrant':['ibkrPea']},
 'xtb': {'dca':['xtbComparison'], 'pea':['xtbPea'], 'pme':['xtbComparison'], 'jeune':['xtbPea'], 'ifu':['xtbIfu'], 'cash':['xtbInterest','xtbPea']},
 'caidf': {'dca':['caPeb','caTariff'], 'pea':['caTariff'], 'pme':['caTariff'], 'jeune':['caIdfPea'], 'ifu':['caTariff','caInvest'], 'cash':['caIdfPeaPme','caIdfContract'], 'change':['caTariff']},
 'bd': {'dca':['bdPlans'], 'pea':['bdTariff'], 'pme':['bdTariff'], 'jeune':['bdTariff'], 'ifu':['bdContract'], 'cash':['bdPea','bdCto'], 'entrant':['bdTariffPage']},
 'saxo': {'dca':['saxoAutoinvest'], 'pea':['saxoTariff'], 'pme':['saxoTariff'], 'jeune':['saxoPeaHelp'], 'ifu':['saxoTariff'], 'cash':['saxoInterest']},
}

def clean(raw):
    if '<html' in raw.lower() or '<body' in raw.lower():
        soup = BeautifulSoup(raw, 'html.parser')
        for element in soup(['script','style','nav','header','footer']): element.decompose()
        raw = soup.get_text(' ', strip=True)
    return re.sub(r'\s+', ' ', raw.replace('\u200b',' ').replace('\xa0',' ').replace('\x07','')).strip()

def find(pattern, text):
    match = re.search(pattern, text, re.I)
    if not match: raise ValueError('Clause officielle absente ou modifiée : '+pattern)
    return match

def amount(value): return float(value.replace(' ','').replace(',','.'))
def fmt(value): return f'{value:g}'.replace('.',',')

def statement(broker, field, texts):
    """Return (availability, status, copy, decisive document, matched clause).

    None denotes an explicit unresolved scope; it never becomes False in UI.
    Every positive/negative assertion must carry a bounded matching statement.
    """
    source = DOCUMENTS[broker][field][0]
    text = texts[source]
    def proved(pattern, available, copy, status='confirmé', document=source):
        m = find(pattern, texts[document])
        return available,status,copy,document,m.group(0)
    def unknown(copy, pattern=None, document=source):
        m = find(pattern or r'PEA|compte.titres|bourse|Bourse|Cash Account|Saxo|Fortuneo',texts[document])
        return None,'non établi',copy,document,m.group(0)
    if field in ('pea','pme','jeune'):
        if broker in ('bourso','fortuneo','caidf','bd','saxo') and not (field=='jeune' and broker in ('fortuneo','caidf','saxo')):
            label={'pea':r'PEA','pme':r'PEA[ -]PME','jeune':r'PEA (?:18.25 ans|JEUNES)'}[field]
            return proved(label,True,{'pea':'PEA proposé ✅','pme':'PEA-PME proposé ✅','jeune':'PEA Jeune proposé ✅'}[field])
        if broker=='tr':
            if field=='pea': return proved(r'PEA\s+Account\s+Opening;\s*Transfer',True,'PEA proposé ✅')
            if field=='jeune':
                return proved(r'parents\s+according\s+to\s+Article\s+D221-109.{0,150}?20,000',True,'PEA accessible aux majeurs rattachés, plafond de versements de 20 000 €.',document=source)
            return unknown('PEA-PME : disponibilité non confirmée par le contrat public.')
        if broker=='ibkr':
            if field=='pea': return proved(r'ouvrir un PEA.{0,80}?résident fiscal français',True,'PEA proposé aux résidents fiscaux français ✅')
            return unknown(('PEA-PME' if field=='pme' else 'PEA Jeune')+' : disponibilité non confirmée par la page officielle PEA.')
        if broker=='xtb':
            if field=='pea': return proved(r'PEA.{0,130}?XTB|XTB.{0,130}?PEA',True,'PEA proposé ✅')
            if field=='pme': return proved(r"XTB prévoit d'élargir son offre avec des plans d'investissement programmés et un volet PEA-PME à venir",False,'PEA-PME annoncé à venir ; pas de disponibilité actuelle confirmée.')
            return proved(r"Actuellement, XTB ne permet pas aux personnes fiscalement rattachées d'ouvrir un PEA",False,'PEA non accessible aux majeurs fiscalement rattachés selon la FAQ XTB.')
        if broker=='fortuneo': return proved(r'Le PEA jeune n.est pas commercialisé par Fortuneo',False,'PEA Jeune non commercialisé ❌')
        if broker=='saxo': return proved(r'Saxo Banque ne propose pas.{0,100}?PEA Jeune',False,'PEA Jeune non proposé ❌')
        if broker=='caidf': return proved(r'PEA Jeune.{0,800}?20\s*000',True,'PEA Jeune proposé par la caisse Île-de-France ; plafond de versements de 20 000 €.')
    if field=='ifu':
        patterns={'tr':r'tax\s*reporting\s*obligations\s*like\s*the\s*Imprimé\s*Fiscal\s*Unique\s*\(IFU\)',
          'bourso':r'(?:télécharger|disponible|documents).{0,250}?(?:IFU|Imprimé Fiscal Unique)',
          'fortuneo':r'Vous pourrez alors télécharger votre IFU', 'ibkr':r'Un IFU disponible pour votre PEA',
          'xtb':r"XTB a l.obligation de vous fournir un imprimé fiscal unique \(IFU\)",
          'caidf':r'(?:Réédition|réédition).{0,120}?(?:IFU|Fiscal Unique)',
          'bd':r'(?:imprimé fiscal unique|IFU).{0,450}?(?:fiscale|administration)',
          'saxo':r'fiscaux en ligne \(IFU\)'}
        return proved(patterns[broker],True,{'tr':'IFU pour l’offre française après migration ; anciens comptes étrangers distincts.', 'ibkr':'IFU disponible pour le PEA ✅'}.get(broker,'IFU fourni selon les opérations à déclarer ; modalités dans la source officielle.'))
    if field=='dca':
        if broker=='bourso':
            m=find(r'Plan d.Épargne \(Hors CTO Business\)(.{0,1300}?)\(1\)',text); block=m[1]
            find(r'négociation\s+GRATUIT',block);v=amount(find(r'Minimum\s*:\s*([\d ,]+)€',block)[1]);find(r'Voir DIC',block)
            return True,'confirmé',f'Plan d’Épargne dès {fmt(v)} €/fonds/mois, négociation gratuite ; frais des fonds selon DIC.',source,m[0]
        if broker=='caidf':
            v=amount(find(r'à partir de ([\d ,]+)\s*€\s*par mois',text)[1]);find(r'1 à 3 fonds',text)
            find(r"Mise en place d.un Plan d.Epargne Boursier \(PEB\) Nous consulter",texts['caTariff'])
            return proved(r'1 à 3 fonds',True,f'Plan d’Épargne Boursière sur 1 à 3 fonds, dès {fmt(v)} €/mois ; mise en place : consulter la caisse Île-de-France. Frais des fonds en supplément.')
        if broker=='tr':
            return unknown('Plans programmés : gratuité annoncée sur le compte-titres ; conditions propres au PEA à confirmer dans les documents publics.')
        if broker=='saxo': return proved(r"Pour l'instant, notre solution n'est pas utilisable dans le cadre de votre PEA",False,'Plan Épargne Programmé actuellement hors PEA ❌')
        if broker=='xtb': return proved(r"XTB prévoit d'élargir son offre avec des plans d'investissement programmés et un volet PEA-PME à venir",False,'Plans programmés PEA annoncés à venir ; pas encore disponibles ❌')
        if broker=='bd':
            find(r'PEA',text);find(r'mensuelle ou trimestrielle',text)
            return proved(r'les frais de courtage sont gratuits pour les ETF.{0,130}?tarif habituel du client',True,'Plans programmés sur PEA et CTO ; ETF de la sélection sans courtage, actions au tarif habituel.')
        # Generic recurring/conditional orders never qualify a PEA-specific service.
        return unknown('Achats automatiques sur PEA : disponibilité non confirmée par les sources officielles du service.',r'PEA|Fortuneo')
    if field=='cash':
        if broker=='saxo':
            find(r'Les comptes PEA sont exclus de l.offre',text)
            return proved(r'Les clients VIP.{0,150}?intérêts',True,'Espèces éligibles EUR/USD des clients VIP, taux variable selon le solde ; PEA exclu.')
        if broker=='ibkr':
            m=find(r'Interest will not be payable on the first EUR ([\d, ]+) or USD',text)
            threshold=int(m[1].replace(',','').replace(' ',''))
            find(r'intérêts',text)
            money=f'{threshold:,}'.replace(',',' ')
            return True,'confirmé',f'Rémunération des espèces éligibles selon la devise et la valeur du compte ; premiers {money} € EUR non rémunérés. Portée PEA non confirmée.',source,m[0]
        if broker=='xtb':
            m=find(r'Au-delà de ([\d ]+) EUR.{0,150}?([\d]+) jours',text)
            threshold=amount(m[1]);days=int(m[2]);find(r'taux d.intérêt sont variables',text)
            find(r'(?:espèces|fonds|argent).{0,120}?(?:ne.{0,25}?intérêts|pas.{0,25}?intérêts|non rémun)',texts['xtbPea'])
            return True,'confirmé',f'Fonds libres éligibles hors PEA : taux variable ; préférentiel pendant {days} jours jusqu’à {fmt(threshold)} €, puis taux standard.',source,m[0]
        if broker=='tr':
            # Scope to the special PEA section, not a statute reproduced later.
            m=find(r'PEA\s+Deposits\s+and\s+Investments(.{0,10000}?)C\s*\.',text)
            clause=find(r'(?:not.{0,70}?interest|interest.{0,70}?not)',m[1])
            find(r'(?:(?:pay|credit).{0,120}?interest|interest.{0,120}?activation)',text)
            return True,'confirmé','Intérêts possibles sur le compte général sous conditions et après activation ; espèces du PEA exclues.',source,clause[0]
        # A PEA exclusion says nothing about cash held in a separate CTO.
        exclusion={'bourso':r'(?:sommes|espèces).{0,160}?ne donnent pas.{0,160}?lieu à rémunération|(?:sommes|espèces).{0,160}?donnent pas lieu à rémunération', 'fortuneo':r'compte espèces ne donnent pas lieu à rémunération', 'caidf':r'argent détenu sur ce compte espèces n.est pas rémunéré', 'bd':r'(?:espèces|liquidités).{0,100}?(?:non rémunéré|pas.{0,30}?intérêt|ne.{0,30}?intérêt)'}[broker]
        m=find(exclusion,text)
        return None,'partiel','Espèces du PEA non rémunérées ; rémunération du cash CTO non confirmée par les documents publics.',source,m[0]
    if field=='boursomarkets':
        find(r'0 € à l.achat',text)
        return proved(r'ETF Amundi Investment Solutions Oui Vide',True,'BoursoMarkets : sélection d’ETF Amundi sans courtage à l’achat. Vérifier la pastille de l’ISIN ; la vente suit le tarif applicable.')
    if field=='garde':
        if broker=='bourso': return proved(r'Droits de garde\s+GRATUITS?',True,'Aucun droit de garde annoncé dans le barème Bourse.')
        # Public TR custody help describes CTO, not PEA-specific fees.
        find(r'Il n.y a pas de frais de garde',texts['trFees'])
        available,status,copy,document,clause=unknown('Frais de garde PEA à confirmer dans le barème ; gratuité du CTO distincte.')
        return available,'partiel',copy,document,clause
    if field=='change':
        if broker=='caidf': return unknown('Change boursier : tarif non confirmé dans le barème régional ; commission bancaire générale exclue.')
        return proved(r'Si des dividendes.{0,220}?nous convertissons directement pour vous cette devise en euro',None,'Conversion des dividendes selon les conditions Trade Republic ; taux ou commission PEA non chiffrés dans cette page.','partiel')
    if field=='entrant':
        if broker == 'ibkr': return unknown('Transfert entrant PEA : conditions et remboursement éventuel à confirmer dans les sources publiques.')
        m=find(r'(?:rembours.{0,150}?([\d ]+)\s*€.{0,120}?PEA|PEA.{0,150}?rembours.{0,120}?([\d ]+)\s*€)',text)
        v=amount(m[1] or m[2])
        return True,'confirmé',f'Transfert entrant PEA possible ; remboursement jusqu’à {fmt(v)} €, sous conditions et sur justificatif.',source,m[0]
    raise ValueError('Champ non pris en charge')

def parse(broker,field,raws,today):
    texts={key:clean(raw) for key,raw in raws.items()}
    available,status,summary,decisive,quote=statement(broker,field,texts)
    supporting = {}
    if broker == 'caidf' and field == 'dca':
        supporting['caTariff'] = find(r"Mise en place d.un Plan d.Epargne Boursier \(PEB\) Nous consulter", texts['caTariff'])[0]
    if broker == 'xtb' and field == 'cash':
        supporting['xtbPea'] = find(r'(?:espèces|fonds|argent).{0,120}?(?:ne.{0,25}?intérêts|pas.{0,25}?intérêts|non rémun)', texts['xtbPea'])[0]
    if broker == 'tr' and field == 'garde':
        supporting['trFees'] = find(r'Il n.y a pas de frais de garde', texts['trFees'])[0]
    refs=[]
    for key,raw in raws.items():
        if key!=decisive and key not in supporting: continue
        reference_quote = quote if key == decisive else supporting[key]
        info=SOURCES[key]
        page=next((i for i,p in enumerate(raw.split('\f'),1) if clean(reference_quote) in clean(p)),None) if '<html' not in raw.lower() else None
        kind='pdf' if '\f' in raw or re.search(r'\.pdf(?:$|\?)',info['url']) else 'page'
        if kind=='pdf' and not page: raise ValueError('Page de la clause officielle non localisée')
        refs.append({'document':key,'sourceUrl':info['url'],'page':page,'sha256':hashlib.sha256(raw.encode()).hexdigest(),'kind':kind,'statement':reference_quote})
    return {'available':available,'status':status,'copy':{'resume':summary,'full':summary},'checkedAt':today,
      'sourceUrl':SOURCES[decisive]['url'],'refs':refs,'scope':f'{broker} ; {field} ; portée exacte des sources publiques',
      'method':'Extraction déterministe d’une clause officielle ; absence de preuve = réponse inconnue',
      'sha256':hashlib.sha256('\n'.join(raws.values()).encode()).hexdigest(),'values':{},'decisiveDocument':decisive,'statement':quote,
      'checkedSources':[{'sourceUrl':SOURCES[key]['url'],'sha256':hashlib.sha256(raw.encode()).hexdigest()} for key,raw in raws.items()]}

def collect_profiles(baseline,today,fetcher):
    urls={SOURCES[key]['url'] for fields in DOCUMENTS.values() for keys in fields.values() for key in keys}
    cache={}
    def fetch(url):
        try: return url,fetcher(url)
        except Exception as error: return url,error
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        cache.update(pool.map(fetch,sorted(urls)))
    failures={};count=0
    for broker,fields in DOCUMENTS.items():
        for field,keys in fields.items():
            try:
                raws={key:cache[SOURCES[key]['url']] for key in keys}
                for raw in raws.values():
                    if isinstance(raw,Exception):raise raw
                observation=parse(broker,field,raws,today)
                if broker not in baseline['brokers']:raise ValueError('Barème principal non qualifié')
                baseline['brokers'][broker].setdefault('profile',{})[field]=observation;count+=1
            except Exception as error:
                failures[f'{broker}:profile:{field}']=str(error)
    return failures,count
