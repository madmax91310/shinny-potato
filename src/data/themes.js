let uid = 0
function nextId(prefix) {
  uid += 1
  return `${prefix}-${uid}-${Date.now().toString(36)}`
}

export function createEtf(overrides = {}) {
  return {
    id: nextId('etf'),
    nom: '',
    isin: '',
    frais: '',
    encours: '',
    differenciateur: '',
    ...overrides,
  }
}

export function createTheme(overrides = {}) {
  return {
    id: '',
    nom: '',
    emoji: '📊',
    hookAction: '',
    hookDilemme: '',
    transition: '',
    etfs: [],
    cloture: '',
    ctaEngagement: 'Le tien, c’est lequel ? Dis-le en commentaire 👇',
    ctaPartage: 'Repartage ce tweet à quelqu’un qui débute en bourse 🔁',
    eligibilite: '',
    mentionReglementaire: 'Pas un conseil en investissement.',
    ...overrides,
  }
}

export const DEFAULT_THEMES = [
  createTheme({
    id: 'monde',
    nom: 'Monde',
    emoji: '🌍',
    hookAction: 'investir sur les plus grandes entreprises mondiales',
    hookDilemme: 'quel ETF World choisir',
    transition:
      'Il existe plusieurs ETF pour capter la croissance mondiale. Voici 3 références à connaître :',
    etfs: [
      createEtf({ nom: 'MSCI World' }),
      createEtf({ nom: 'FTSE All-World' }),
      createEtf({ nom: 'MSCI ACWI' }),
    ],
    cloture:
      'Le choix ne se joue pas sur la performance passée, mais sur les frais, la composition et l’exposition qui collent à TA stratégie.',
  }),
  createTheme({ id: 'usa', nom: 'USA', emoji: '🇺🇸' }),
  createTheme({ id: 'europe', nom: 'Europe', emoji: '🇪🇺' }),
  createTheme({ id: 'tech-europe', nom: 'Tech Europe', emoji: '💻' }),
  createTheme({ id: 'emergents', nom: 'Émergents', emoji: '🌏' }),
  createTheme({ id: 'luxe', nom: 'Luxe', emoji: '💎' }),
  createTheme({ id: 'ia-robotique', nom: 'IA / Robotique', emoji: '🤖' }),
  createTheme({ id: 'sante', nom: 'Santé', emoji: '🩺' }),
  createTheme({ id: 'renouvelables', nom: 'Renouvelables', emoji: '♻️' }),
  createTheme({ id: 'dividendes', nom: 'Dividendes', emoji: '💵' }),
  createTheme({ id: 'japon', nom: 'Japon', emoji: '🇯🇵' }),
  createTheme({ id: 'defense', nom: 'Défense', emoji: '🛡️' }),
  createTheme({ id: 'quantique', nom: 'Quantique', emoji: '⚛️' }),
  createTheme({ id: 'spatial', nom: 'Spatial', emoji: '🚀' }),
  createTheme({ id: 'ressources-naturelles', nom: 'Ressources naturelles', emoji: '⛏️' }),
  createTheme({ id: 'etc-metaux', nom: 'ETC (Or, Argent, Cuivre)', emoji: '🪙' }),
]
