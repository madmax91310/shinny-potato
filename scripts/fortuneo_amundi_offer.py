"""The public Gatsby model binds the Amundi card to its actual legal footnote."""
import datetime as dt
import json
import re
from urllib.parse import urlsplit
from broker_tariff_extensions import MONTHS, metadata, item, num

SOURCE = 'https://www.fortuneo.fr/page-data/bourse/page-data.json'
PAGE = 'https://www.fortuneo.fr/bourse'
ELIGIBLE = 'https://www.fortuneo.fr/bourse/freetrade-amundi/etf'


def rich(value):
    model=json.loads(value['rich'])
    references=[];links=[]
    def visit(node):
        kind=node.get('nodeType')
        if kind=='text':
            if not isinstance(node.get('value'),str):raise ValueError('Invalid Fortuneo text node')
            return node['value']
        if kind=='embedded-entry-inline':
            target=node['data']['target']['sys']
            if target.get('linkType')!='Entry' or not isinstance(target.get('id'),str):raise ValueError('Unqualified offer reference')
            references.append(target['id']);return ''
        if kind=='hyperlink':links.append(node['data']['uri'])
        elif kind not in ('document','paragraph','unordered-list','ordered-list','list-item'):
            raise ValueError('Fortuneo legal text structure changed')
        if not isinstance(node.get('content'),list):raise ValueError('Missing Fortuneo legal content')
        return ''.join(visit(c) for c in node['content'])+('\n' if kind in ('paragraph','list-item') else '')
    return re.sub(r'\s+',' ',visit(model)).strip(),references,links


def parse(raw,today):
    body=json.loads(raw,parse_constant=lambda x:(_ for _ in ()).throw(ValueError('Invalid official JSON number')))
    content=body['result']['data']['content']
    if body.get('path')!='/bourse' or content.get('slug')!='/bourse' or 'PEA et CTO' not in content['seoRef']['title']:
        raise ValueError('Wrong Fortuneo official page or account scope')
    candidates=[]
    def visit(node):
        if isinstance(node,dict):
            if 'bentoCardTitle' in node and 'bentoCardDescription' in node:
                title,_,_=rich(node['bentoCardTitle'])
                if 'ETF Amundi' in title:candidates.append((node,title))
            for v in node.values():visit(v)
        elif isinstance(node,list):
            for v in node:visit(v)
    visit(content['sections'])
    if len(candidates)!=1:raise ValueError('Dated Amundi card absent or ambiguous in the public page model')
    card,title=candidates[0];description,ids,_=rich(card['bentoCardDescription'])
    fee=re.fullmatch(r'([\d,.]+)\s*€ de frais de courtage sur une sélection d[’\']ETF Amundi',title)
    if not fee or num(fee[1])!=0:raise ValueError('Amundi zero-fee offer changed')
    if len(ids)!=1:raise ValueError('Amundi legal footnote missing or ambiguous')
    refs=card['bentoCardDescription']['references']
    if len(refs)!=1 or refs[0].get('__typename')!='ContentfulFootnote' or refs[0].get('contentful_id')!=ids[0]:
        raise ValueError('Amundi card and legal footnote do not match')
    original,embedded,links=rich(refs[0]['content'])
    links=[*links,*[u.rstrip('.,;') for u in re.findall(r'https://[^\s<>()]+',original)]]
    if embedded or ELIGIBLE not in links or any(urlsplit(u).scheme!='https' or urlsplit(u).hostname!='www.fortuneo.fr' or urlsplit(u).username or urlsplit(u).password or urlsplit(u).port for u in links):
        raise ValueError('Eligible Amundi selection not identified by the legal footnote')
    statement=original.replace('’',"'")
    if not re.search(r"chaque mois de la gratuité des frais de courtage sur tous les ordres d'achats exécutés",statement):
        raise ValueError('All monthly purchase orders are not explicitly free')
    bounds=re.search(r"d'un montant compris entre ([\d ]+) € et ([\d ]+) € inclus",statement)
    visible=re.search(r'ordres compris entre ([\d ]+) € et ([\d ]+) €',description)
    if not bounds or not visible or 'Chaque mois' not in description or tuple(map(num,bounds.groups()))!=tuple(map(num,visible.groups())):
        raise ValueError('Amundi card and legal order bounds conflict')
    lower,upper=map(num,bounds.groups())
    if not 0<lower<upper:raise ValueError('Invalid Amundi order bounds')
    period=re.search(r"Entre le (\d{1,2})(?:er)? (\w+) (20\d{2}) et le (\d{1,2})(?:er)? (\w+) (20\d{2}) inclus",statement)
    if not period:raise ValueError('Explicit Amundi legal campaign dates missing')
    start=dt.date(int(period[3]),MONTHS[period[2].lower()],int(period[1])).isoformat()
    end=dt.date(int(period[6]),MONTHS[period[5].lower()],int(period[4])).isoformat()
    if start>end:raise ValueError('Inverted Amundi campaign dates')
    if 'Offre réservée aux clients de Fortuneo' not in statement or "L'offre peut être arrêtée à tout moment" not in statement:
        raise ValueError('Amundi client/rescission conditions changed')
    meta=metadata(raw,SOURCE,today)
    meta.update(statement=original,referenceUrl=PAGE,eligibleSelectionUrl=ELIGIBLE,offerFootnoteId=ids[0],
        controlledFields=['path','slug','accountScope','cardTitle.purchaseFee','cardDescription.orderBounds',
                          'embeddedFootnote.identity','footnote.purchaseOrders','footnote.orderBounds',
                          'footnote.start','footnote.until','footnote.eligibleSelection','footnote.rescission'],
        method='Official public page model; exact Amundi card linked to its complete dated legal footnote. Observation date is not a publication date.')
    money=lambda n:f'{n:,.0f}'.replace(',',' ')
    result=item({'purchaseFee':0,'minimumOrder':lower,'maximumOrder':upper},
        f'ETF Amundi de la sélection : 0 € de courtage sur chaque achat de {money(lower)} à {money(upper)} €, sur PEA et CTO, sous conditions.',meta,
        'fortuneo ; offerAmundi ; conditions explicites de la page officielle')
    result.update(start=start,until=end)
    return 'fortuneo','offerAmundi',result
