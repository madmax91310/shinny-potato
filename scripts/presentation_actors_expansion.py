"""Scoped public platform terms: no invented ticket, yield or repayment date."""
import hashlib
import re
from bs4 import BeautifulSoup


def parse_platform(id_, documents, urls, today):
    def text(raw):
        soup = BeautifulSoup(raw, 'html.parser')
        for item in soup(['script', 'style', 'nav', 'footer']): item.decompose()
        return re.sub(r'\s+', ' ', soup.get_text(' ', strip=True))
    texts = [text(raw) for raw in documents]
    def require(pattern, index=0):
        match = re.search(pattern, texts[index], re.I)
        if not match: raise ValueError('Public platform clause missing or changed: ' + pattern)
        return match
    def number(pattern, index=0):
        value = float(require(pattern, index)[1].replace(',', '.'))
        if not 0 <= value <= 100: raise ValueError('Invalid platform fee')
        return f'{value:g}'.replace('.', ',')
    if id_ == 'lendosphere':
        require('Lendosphere')
        fee = number(r'Dans ce cas, ([\d,.]+)% de la somme débitée vous sera facturée')
        require(r'unique cas où vous créditez votre compte de paiement puis le débitez sans prêter')
        require(r'Les projets présentés.*?transition énergétique', 0)
        require(r'chaque projet correspond une page.*?conditions d.investissement \(taux, durée, remboursements, montants', 1)
        require(r'crédit amortissable.*?crédit in fine')
        require(r'risque d.illiquidité')
        require(r'définitifs une fois passé le délai de réflexion de 4 jours', 1)
        values = {
            'access': 'Inscription en ligne puis souscription à une collecte. Le montant et les conditions sont définis sur la page de chaque projet.',
            'fees': f'Pas de frais investisseur sur le financement décrit par la FAQ. Retrait de fonds crédités sans les investir : {fee} % de la somme débitée.',
            'duration': 'Durée et échéancier propres au projet, publiés dans ses documents ; aucune durée commune à toutes les collectes.',
            'income': 'Intérêts selon le contrat ; remboursement amortissable ou capital à la dernière échéance pour un financement in fine. Une défaillance peut empêcher ces paiements.',
            'exit': 'Après le délai de réflexion de quatre jours, l’investissement est définitif. Le remboursement suit l’échéancier du projet ; une sortie anticipée n’est pas garantie.',
        }
        highlights = [['Exposition', 'Énergie'], ['Durée', 'Selon le projet'], ['Financement', 'Dette']]
        indices = {'access': 1, 'fees': 0, 'duration': 1, 'income': 0, 'exit': 1}
        scope = 'Financements en dette décrits dans la FAQ ; les offres en actions restent distinctes.'
        name = 'Lendosphere — financement en dette'
    elif id_ == 'tudigo':
        require('Tudigo')
        require(r'frais d’investissement du financement en actions')
        bands = require(r'< 5 000 € ([\d,.]+) % < 10 000 € ([\d,.]+) % < 25 000 € ([\d,.]+)% < 50 000 € ([\d,.]+)% ≧ 50 000 € ([\d,.]+) %').groups()
        bands = [float(v.replace(',', '.')) for v in bands]
        if not all(0 <= v <= 100 for v in bands) or bands != sorted(bands, reverse=True): raise ValueError('Invalid fee bands')
        fmt = lambda v: f'{v:g}'.replace('.', ',')
        management = number(r'([\d,.]+) % par an Prélevés en une fois pour 5 ans')
        provision = number(r'Frais de fonctionnement.*?([\d,.]+) % de l.investissement')
        carry = number(r'([\d,.]+) % de la plus-value générée')
        hurdle = float(require(r'multiple d.investissement supérieur à x(\d+(?:[,.]\d+)?)')[1].replace(',', '.'))
        if not 1 <= hurdle <= 10: raise ValueError('Invalid performance hurdle')
        require(r'deviennent actionnaires de l.Entité ad hoc', 1)
        require(r'risque d.illiquidité rendant impossible de recouvrer', 1)
        values = {
            'access': 'Souscription à une offre en actions, directement ou via une société intermédiaire selon l’opération ; conditions précisées dans sa fiche d’informations clés.',
            'fees': f'Souscription : {fmt(bands[0])} % sous 5000 €, {fmt(bands[1])} % sous 10000 €, {fmt(bands[2])} % sous 25000 €, {fmt(bands[3])} % sous 50000 €, {fmt(bands[4])} % à partir de 50000 €. Gestion : {management} %/an, prélevée pour cinq ans. Provision de fonctionnement : {provision} %. Performance : {carry} % de la plus-value si le multiple dépasse {fmt(hurdle)}, selon les conditions publiées.',
            'duration': 'La page des frais prévoit cinq ans pour le prélèvement initial de gestion ; cela ne garantit pas une sortie à cinq ans. La durée dépend de l’opération.',
            'income': 'Gains éventuels lors de la revente des participations ; ils dépendent de la valeur de l’entreprise et des frais. Aucune performance réalisée commune aux projets.',
            'exit': 'La sortie dépend de la revente des participations et des conditions de l’opération. Les titres présentent un risque d’illiquidité ; le remboursement du capital n’est pas garanti.',
        }
        highlights = [['Exposition', 'Non coté'], ['Instrument', 'Actions'], ['Sortie', 'Non garantie']]
        indices = {'access': 1, 'fees': 0, 'duration': 0, 'income': 0, 'exit': 1}
        scope = 'Financement en actions ; le barème obligataire est une offre distincte.'
        name = 'Tudigo — investissement en actions'
    else: raise ValueError('Unknown platform')
    labels = {'access':'Accès','fees':'Frais publiés','duration':'Durée','income':'Revenus','exit':'Sortie'}
    fields = {k: {'label': labels[k], 'value': v, 'sourceUrl': urls[indices[k]], 'checkedAt':today.isoformat()} for k,v in values.items()}
    return {'id':id_, 'checkedAt':today.isoformat(), 'verification':'public-terms',
        'sources':[{'url':url,'sha256':hashlib.sha256(raw.encode()).hexdigest()} for url,raw in zip(urls,documents)],
        'offers':[{'id':'public-terms','name':name,'scope':scope,'fields':fields,'missing':[], 'highlights':highlights,'warnings':[]}]}
