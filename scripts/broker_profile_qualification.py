"""Conservative promotion rules for the twelve unresolved official scopes.

These rules only inspect documents already assigned to the broker/field. They
require a complete, explicit present-tense sentence, never a generic product
mention, a planned launch, or a conclusion inferred from another account type.
"""
import re

TARGETS = {
    ('tr', 'pme'), ('tr', 'garde'), ('tr', 'change'),
    ('ibkr', 'pme'), ('ibkr', 'jeune'), ('ibkr', 'dca'),
    ('fortuneo', 'dca'), ('fortuneo', 'cash'), ('bourso', 'cash'),
    ('caidf', 'cash'), ('caidf', 'change'), ('bd', 'cash'),
}
NAMES = {'tr': 'Trade Republic', 'ibkr': '(?:IBKR|Interactive Brokers)',
         'fortuneo': 'Fortuneo'}
NUMBER = r'\d+(?:[,.]\d+)?'


def rules(broker, field):
    """Return bounded (pattern, availability) pairs, without guessing a rate."""
    if field in ('pme', 'jeune'):
        label = r'PEA[- ]PME' if field == 'pme' else r'PEA Jeune'
        name = NAMES[broker]
        return [
            (rf'{name} propose (?:un|le) {label}', True),
            (rf'{name} ne propose pas (?:de|le) {label}', False),
            (rf'Nous proposons (?:un|le) {label}', True),
            (rf'Nous ne proposons pas (?:de|le) {label}', False),
            (rf'{name} offers {label} accounts', True),
            (rf'{name} does not offer {label} accounts', False),
        ]
    if field == 'dca':
        service = r'(?:achats automatiques|investissements programmés) sur PEA'
        suffix = rf'(?: chez {NAMES[broker]})?'
        return [(rf'Les {service} sont disponibles{suffix}', True),
                (rf'Les {service} ne sont pas disponibles{suffix}', False)]
    if field == 'cash':
        scope = r'Les (?:espèces|liquidités) du compte[- ]titres ordinaire(?: \(CTO\))?'
        return [(rf'{scope} sont rémunérées(?: à (?:un taux variable|{NUMBER} %))?', True),
                (rf'{scope} ne sont pas rémunérées', False)]
    if field == 'garde':
        return [(rf'Les frais de garde du PEA sont (?:nuls|gratuits|de {NUMBER} (?:€|%)(?: par an)?)', True),
                (r'Custody fees for the PEA are zero', True)]
    if field == 'change':
        scope = 'du PEA' if broker == 'tr' else 'sur les opérations boursières'
        return [(rf'La commission de change {scope} est de {NUMBER} %(?: du montant converti)?', True)]
    return []


def qualify(broker, field, texts):
    if (broker, field) not in TARGETS:
        return None
    evidence = []
    for document, text in texts.items():
        # Require a whole sentence. Decimal points in rates remain intact.
        for sentence in re.split(r'(?<=[.!?;])\s+', text):
            clause = sentence.strip().rstrip('.!?;').strip()
            for pattern, available in rules(broker, field):
                if re.fullmatch(pattern, clause, re.I):
                    for value in re.findall(r'(\d+(?:[,.]\d+)?)\s*%', clause):
                        if float(value.replace(',', '.')) > 100:
                            raise ValueError('Pourcentage officiel hors limites : qualification suspendue')
                    evidence.append((available, document, clause))
    if not evidence:
        return None
    # Different tariffs also need review, even when both assert availability.
    if len({(available, clause.casefold()) for available, _, clause in evidence}) > 1:
        raise ValueError('Clauses officielles concurrentes : qualification automatique suspendue')
    available, document, clause = evidence[0]
    return available, 'confirmé', clause + '.', document, clause
