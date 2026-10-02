// Chaque côté : une base ETF, un complément facultatif, une thématique facultative.
const row = (id, pct) => ({ id, pct })
export const DUELS = [
  {
    id: 'world-em-ou-acwi', title: 'World + émergents ou ACWI ?',
    hook: 'Pour investir dans le monde, tu prends un seul ETF ou tu fais ta répartition toi-même ?',
    left: [row('msci_world_ishares', 80), row('msci_em', 20)], right: [row('msci_acwi_ishares', 100)],
    labels: ['World + émergents', 'ACWI seul'],
    question: 'Tu préfères fixer le poids des émergents ou suivre leur place dans l’indice ?',
  },
  {
    id: 'world-ou-acwi', title: 'World ou ACWI ?',
    hook: 'Un ETF mondial, oui. Mais tu veux les marchés émergents dedans ou pas ?',
    left: [row('msci_world_ishares', 100)], right: [row('msci_acwi_ishares', 100)],
    labels: ['World seul', 'ACWI seul'], question: 'Ton ETF mondial inclut les émergents ?',
  },
  {
    id: 'acwi-ou-allworld', title: 'ACWI ou FTSE All-World ?',
    hook: 'ACWI ou FTSE All-World : pour ton ETF mondial, tu aurais pris lequel ?',
    left: [row('msci_acwi_ishares', 100)], right: [row('ftse_allworld_vanguard', 100)],
    labels: ['ACWI seul', 'FTSE All-World seul'], question: 'Tu as choisi quel indice pour ta base mondiale ?',
  },
  {
    id: 'sp500-europe-ou-acwi', title: 'S&P 500 + Europe ou ACWI ?',
    hook: 'Tu répartis toi-même entre les États-Unis et l’Europe, ou tu prends un ETF mondial ?',
    left: [row('sp500_ishares', 80), row('msci_europe', 20)], right: [row('msci_acwi_ishares', 100)],
    labels: ['S&P 500 + Europe', 'ACWI seul'], question: 'Tu choisis le poids de chaque zone ou tu suis l’indice mondial ?',
  },
  {
    id: 'world-stoxx-ou-acwi', title: 'World + STOXX 600 ou ACWI ?',
    hook: 'Ton ETF World contient déjà de l’Europe. Tu en ajouterais quand même ?',
    left: [row('msci_world_ishares', 80), row('stoxx600_bnp', 20)], right: [row('msci_acwi_ishares', 100)],
    labels: ['World + Europe', 'ACWI seul'], question: 'Tu renforces l’Europe dans ton portefeuille ?',
  },
  {
    id: 'usa-europe-sante-ou-acwi-tech', title: 'USA, Europe et santé ou ACWI et tech ?',
    hook: 'Une base américaine avec Europe et santé, ou une base mondiale avec davantage de tech ?',
    left: [row('sp500_ishares', 70), row('msci_europe', 20), row('sect_sante', 10)],
    right: [row('msci_acwi_ishares', 80), row('sect_tech_world_ishares', 20)],
    labels: ['USA + Europe + santé', 'ACWI + tech'], question: 'Tu aurais construit lequel de ces deux portefeuilles ?',
  },
  {
    id: 'allworld-cyber-ou-world-em', title: 'All-World + cyber ou World + émergents ?',
    hook: 'Tu ajouterais une thématique à ton ETF mondial, ou tu renforcerais les émergents ?',
    left: [row('ftse_allworld_vanguard', 90), row('sect_cyber_lg', 10)],
    right: [row('msci_world_ishares', 80), row('msci_em', 20)],
    labels: ['All-World + cyber', 'World + émergents'], question: 'Tu as une poche thématique dans ton portefeuille ?',
  },
  {
    id: 'world-smallcap-ou-acwi', title: 'World + petites capitalisations ou ACWI ?',
    hook: 'Pour élargir ton World, tu choisirais les petites capitalisations ou les marchés émergents ?',
    left: [row('msci_world_ishares', 80), row('smallcap_monde', 20)], right: [row('msci_acwi_ishares', 100)],
    labels: ['World + petites caps', 'ACWI seul'], question: 'Petites capitalisations ou émergents : quelle place leur donnes-tu ?',
  },
  {
    id: 'world-em-energie-ou-allworld-tech', title: 'World, émergents et énergie ou All-World et tech ?',
    hook: 'Un portefeuille mondial avec de l’énergie, ou un portefeuille mondial avec davantage de tech ?',
    left: [row('msci_world_ishares', 80), row('msci_em', 10), row('sect_energy_spdr', 10)],
    right: [row('ftse_allworld_vanguard', 90), row('sect_tech_world_ishares', 10)],
    labels: ['World + émergents + énergie', 'All-World + tech'], question: 'Tu renforces un secteur en particulier ?',
  },
  {
    id: 'world-value-ou-world-quality', title: 'World + Value ou World + Quality ?',
    hook: 'Tu gardes ton World. À côté, tu privilégies les entreprises peu chères ou leurs critères de qualité ?',
    left: [row('msci_world_ishares', 80), row('actions_value', 20)],
    right: [row('msci_world_ishares', 80), row('world_quality_ishares', 20)],
    labels: ['World + Value', 'World + Quality'], question: 'Tu ajouterais un filtre Value ou Quality à ton portefeuille ?',
  },
  {
    id: 'sp500-japon-ou-acwi-inde', title: 'S&P 500 + Japon ou ACWI + Inde ?',
    hook: 'Une base américaine complétée par le Japon, ou une base mondiale avec plus d’Inde ?',
    left: [row('sp500_ishares', 80), row('actions_japon', 20)],
    right: [row('msci_acwi_ishares', 80), row('actions_india_ishares', 20)],
    labels: ['S&P 500 + Japon', 'ACWI + Inde'], question: 'Tu donnerais davantage de place au Japon ou à l’Inde ?',
  },
  {
    id: 'world-energie-propre-ou-allworld-infrastructure', title: 'World + énergies propres ou All-World + infrastructures ?',
    hook: 'Pour ta poche thématique, tu choisirais les énergies propres ou les infrastructures ?',
    left: [row('msci_world_ishares', 90), row('sect_energie_propre', 10)],
    right: [row('ftse_allworld_vanguard', 90), row('infrastructure_ishares', 10)],
    labels: ['World + énergies propres', 'All-World + infrastructures'], question: 'Lequel de ces deux portefeuilles te correspondrait le mieux ?',
  },
]
