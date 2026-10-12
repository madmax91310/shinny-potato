// Scénarios éditoriaux fictifs : les revenus ne sont pas des statistiques salariales.
// Les montants sont des objectifs mensuels, indépendants des cours des titres.
const ASSETS = {
  world: ['🌍', 'ETF MSCI World'], sp500: ['🇺🇸', 'ETF S&P 500'],
  europe: ['🇪🇺', 'ETF STOXX Europe 600'], emerging: ['🌏', 'ETF MSCI Emerging Markets'],
  allworld: ['🌐', 'ETF FTSE All-World'], small: ['🔎', 'ETF MSCI World Small Cap'],
  quality: ['💎', 'ETF MSCI World Quality'], nasdaq: ['💻', 'ETF Nasdaq-100'],
  vinci: ['🏗️', 'Vinci'], total: ['🛢️', 'TotalEnergies'], saintgobain: ['🧱', 'Saint-Gobain'],
  legrand: ['🔌', 'Legrand'], airliquide: ['🧪', 'Air Liquide'], schneider: ['⚡', 'Schneider Electric'],
  lvmh: ['👜', 'LVMH'], loreal: ['💄', 'L’Oréal'], sanofi: ['💊', 'Sanofi'],
  danone: ['🥛', 'Danone'], axa: ['🛡️', 'AXA'], michelin: ['🛞', 'Michelin'],
  veolia: ['💧', 'Veolia'], sap: ['🖥️', 'SAP'], asml: ['🔬', 'ASML'],
  microsoft: ['🖥️', 'Microsoft'], apple: ['📱', 'Apple'], alphabet: ['🔍', 'Alphabet'],
  amazon: ['📦', 'Amazon'], nvidia: ['🧠', 'Nvidia'], btc: ['₿', 'Bitcoin'], gold: ['🪙', 'ETC sur l’or physique'],
}
function profile(id, emoji, name, age, family, job, location, income, allocations, variable = false) {
  const lines = allocations.map(([asset, amount]) => ({ asset, amount, emoji: ASSETS[asset][0], label: ASSETS[asset][1] }))
  return { id, emoji, name, age, family, job, location, income, variable, lines,
    monthly: lines.reduce((total, line) => total + line.amount, 0) }
}
export const PROFILES = [
  profile('julien', '👨‍🔧', 'Julien', 41, 'marié, 2 enfants', 'plombier à son compte', 'près de Bordeaux', 3200, [['world',200],['vinci',100],['total',100],['saintgobain',50],['legrand',50]], true),
  profile('lea', '👩‍⚕️', 'Léa', 28, 'en couple, sans enfant', 'infirmière', 'à Nantes', 2300, [['world',200],['europe',50],['emerging',50]]),
  profile('thomas', '👨‍💻', 'Thomas', 30, 'célibataire, sans enfant', 'développeur salarié', 'à Lyon', 3100, [['world',300],['nasdaq',100],['btc',50]]),
  profile('sophie', '👩‍🏫', 'Sophie', 39, 'pacsée, 2 enfants', 'professeure des écoles', 'près de Rennes', 2500, [['allworld',250]]),
  profile('karim', '👨‍🔧', 'Karim', 35, 'marié, 1 enfant', 'technicien de maintenance', 'à Lille', 2400, [['world',200],['schneider',50],['airliquide',50]]),
  profile('emma', '👩‍💼', 'Emma', 26, 'célibataire, sans enfant', 'assistante administrative', 'à Tours', 1750, [['world',100],['europe',25]]),
  profile('nicolas', '👨‍🍳', 'Nicolas', 44, 'marié, 2 enfants', 'restaurateur à son compte', 'près de Toulouse', 3500, [['world',300],['europe',100],['gold',50]], true),
  profile('camille', '👩‍💻', 'Camille', 33, 'en couple, sans enfant', 'graphiste indépendante', 'à Montpellier', 2600, [['allworld',200],['btc',25]], true),
  profile('hugo', '👨‍🚒', 'Hugo', 29, 'pacsé, sans enfant', 'sapeur-pompier professionnel', 'à Angers', 2200, [['world',150],['total',50],['vinci',50]]),
  profile('aurelie', '👩‍💼', 'Aurélie', 46, 'divorcée, 1 enfant', 'comptable salariée', 'à Dijon', 2700, [['world',250],['europe',50],['gold',50]]),
  profile('maxime', '👨‍💼', 'Maxime', 37, 'marié, 2 enfants', 'ingénieur salarié', 'à Grenoble', 3800, [['world',400],['emerging',100],['small',100]]),
  profile('sarah', '👩‍🦱', 'Sarah', 31, 'célibataire, sans enfant', 'éducatrice spécialisée', 'à Strasbourg', 2150, [['world',150],['airliquide',50]]),
  profile('david', '🚚', 'David', 48, 'marié, 2 enfants', 'chauffeur routier salarié', 'près de Reims', 2600, [['world',200],['michelin',50],['total',50]]),
  profile('ines', '👩‍💼', 'Inès', 25, 'en couple, sans enfant', 'chargée de clientèle', 'à Orléans', 1900, [['allworld',150]]),
  profile('antoine', '👨‍⚕️', 'Antoine', 43, 'marié, 3 enfants', 'kinésithérapeute libéral', 'près de Poitiers', 4200, [['world',400],['europe',100],['sanofi',50],['gold',50]], true),
  profile('melanie', '👩‍🔧', 'Mélanie', 36, 'pacsée, 1 enfant', 'électricienne à son compte', 'près de Rouen', 3000, [['world',250],['legrand',50],['schneider',50]], true),
  profile('paul', '👨‍💼', 'Paul', 54, 'marié, 2 enfants adultes', 'responsable logistique', 'à Metz', 3300, [['world',300],['quality',100],['gold',100]]),
  profile('chloe', '👩‍🍳', 'Chloé', 27, 'célibataire, sans enfant', 'pâtissière salariée', 'à Clermont-Ferrand', 1800, [['world',100]]),
  profile('romain', '👨‍💻', 'Romain', 34, 'pacsé, sans enfant', 'consultant informatique indépendant', 'à Paris', 5000, [['world',600],['small',150],['emerging',150],['btc',100]], true),
  profile('nadia', '👩‍⚕️', 'Nadia', 40, 'mariée, 2 enfants', 'manipulatrice radio', 'à Besançon', 2450, [['world',200],['sanofi',50],['airliquide',50]]),
  profile('baptiste', '👨‍🌾', 'Baptiste', 38, 'en couple, 1 enfant', 'paysagiste à son compte', 'près d’Avignon', 2800, [['world',200],['veolia',50],['vinci',50]], true),
  profile('elise', '👩‍💼', 'Élise', 32, 'célibataire, sans enfant', 'responsable marketing', 'à Nice', 3000, [['world',250],['lvmh',50],['loreal',50],['europe',50]]),
  profile('sebastien', '👨‍🔧', 'Sébastien', 45, 'divorcé, 2 enfants', 'mécanicien salarié', 'près du Mans', 2200, [['world',150],['michelin',25],['total',25]]),
  profile('manon', '👩‍💼', 'Manon', 29, 'en couple, sans enfant', 'juriste salariée', 'à Bordeaux', 2700, [['allworld',300],['gold',50]]),
  profile('olivier', '👨‍💼', 'Olivier', 51, 'marié, 2 enfants', 'commercial salarié', 'à Caen', 3500, [['world',300],['axa',100],['total',50],['danone',50]], true),
  profile('anais', '👩‍⚕️', 'Anaïs', 35, 'pacsée, 1 enfant', 'sage-femme salariée', 'à Nancy', 2600, [['world',250],['emerging',50]]),
  profile('quentin', '👨‍💻', 'Quentin', 24, 'célibataire, sans enfant', 'technicien informatique', 'à Brest', 1950, [['sp500',100],['nasdaq',50],['btc',25]]),
  profile('claire', '👩‍💼', 'Claire', 47, 'mariée, 1 enfant', 'cadre dans les ressources humaines', 'à Aix-en-Provence', 3900, [['world',400],['europe',100],['airliquide',100],['gold',50]]),
  profile('mehdi', '👨‍💻', 'Mehdi', 36, 'marié, 1 enfant', 'chef de projet informatique', 'à Lyon', 3400, [['world',250],['microsoft',50],['alphabet',50],['amazon',50],['nvidia',50]]),
  profile('lucie', '👩‍💼', 'Lucie', 42, 'en couple, 2 enfants', 'ingénieure salariée', 'à Toulouse', 3600, [['world',350],['europe',100],['asml',50],['sap',50]]),
]
