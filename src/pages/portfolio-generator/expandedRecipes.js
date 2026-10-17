// Allocations supplémentaires : les séries restent celles de la banque commune.
// Les limites de poids expriment le rôle économique des poches, indépendamment
// de leur pire année passée. Aucune série courte n'est prolongée artificiellement.
import { ASSETS } from '../../data/portfolio-assets.js';
const GLOBAL = ['msci_acwi','msci_acwi_ishares','ftse_allworld_vanguard'];
const DIV = ['strat_dividendes_dist','high_dividend_dist','quality_dividend_dist'];
const BTC = ['bitcoin','bitcoin_wisdomtree','bitcoin_etcgroup','bitcoin_21shares'];
const GOLD = ['or','or_ishares','or_amundi','or_wisdomtree'];
const SHORT = ['monetaire_xeon','oblig_0_1_ishares','euro-ultrashort-ishares'];
const slot = (ids, pct, spread = 10) => ({
  ...(Array.isArray(ids) ? {idOptions:ids} : {id:ids}), pct,
  minPct:Math.max(5,pct-spread), maxPct:Math.min(100,pct+spread),
});
const make = (id,label,pairs) => ({id:`expanded-${id}`,label,
  description:label, assets:pairs.filter(([,pct])=>pct>0).map(([ids,pct,spread])=>slot(ids,pct,spread)),
});
const levels = {prudent:0,defensif:1,equilibre:2,dynamique:3,offensif:4};

export function expandedRecipes(profile,risk) {
  const level=levels[risk];
  if(level===undefined) return [];
  if(profile==='generaliste') {
    const stable=[80,65,35,0,0][level];
    const satellite=[5,10,15,20,25][level];
    return [
      ...ASSETS.filter(a=>a.distinctCandidate && !a.manualOnly && a.cat==='actions_larges' && level>=2).map(a=>make(`distinct-${a.id}`,`Monde et ${(a.label ?? a.name).toLowerCase()}`,[[GLOBAL,100-stable-satellite],[a.id,satellite],['fonds_euros',stable]])),
      ...(level>=2 ? [
        make('global-cloud-robotics','Monde, cloud et robotique',[[GLOBAL,100-stable-2*satellite],['cloud-wisdomtree',satellite],['sect_robotique',satellite],['fonds_euros',stable]]),
        make('global-timber-agriculture','Monde, bois et agro-industrie',[[GLOBAL,100-stable-2*satellite],['timber-ishares',satellite],['agribusiness-ishares',satellite],['fonds_euros',stable]]),
      ] : []),
      ...[['small-value-usa','Monde et petites entreprises américaines value'],['em-value-ishares','Monde et émergents value'],['world-midcap-equal','Monde et moyennes entreprises équipondérées'],['world-eur-hedged','Monde et actions couvertes en euros'],['agribusiness-ishares','Monde et agro-industrie'],['timber-ishares','Monde et filière bois'],['world-staples','Monde et consommation de base'],['world-discretionary','Monde et consommation discrétionnaire'],['world-energy','Monde et énergie'],['water-ishares','Monde et entreprises de l’eau'],['world-multifactor','Monde et sélection multifactorielle']].map(([id,label])=>make(`global-${id}`,label,[[GLOBAL,100-stable-satellite],[id,satellite],['fonds_euros',stable]])),
      make('europe-minvol','Europe et volatilité mondiale réduite', [['msci_europe',100-stable-satellite],['world_minvol_ishares',satellite],['fonds_euros',stable]]),
      make('usa-equal-value','S&P 500 équipondéré et value mondiale', [['sp500_equal_weight',100-stable-satellite],['actions_value',satellite],['fonds_euros',stable]]),
      make('global-sante-dws','Marché mondial et santé mondiale',[[GLOBAL,100-stable-satellite],['health_world_dws',satellite],['fonds_euros',stable]]),
      ...(level>=2 ? [make('global-nouvelles-energies','Marché mondial et nouvelles énergies',[[GLOBAL,100-stable-satellite],['new_energy_amundi',satellite],['fonds_euros',stable]])] : []),
      make('global-industrie','Marché mondial et industrie',[[GLOBAL,100-stable-satellite],['industry_world_dws',satellite],['fonds_euros',stable]]),
      make('global-sante','Marché mondial et santé européenne',[[GLOBAL,100-stable-satellite],['health_europe_pea',satellite],[SHORT,stable]]),
      make('usa-qualite','S&P 500 et qualité mondiale',[[['sp500','sp500_ishares'],100-stable-satellite],['world_quality_ishares',satellite],['fonds_euros',stable]]),
      ...(level>=2 ? [make('monde-innovation','Monde, innovation et dette courte',[[GLOBAL,level===2?45:70],[['cloud-wisdomtree','ia-big-data-xtrackers','sect_cybersecurite','sect_robotique'],level===2?10:15],[SHORT,level===2?45:15]])] : []),
    ];
  }
  if(profile==='pro_europe') {
    const core=[5,20,45,65,75][level], sector=[5,10,15,20,25][level];
    return [
      make('europe-small-value','Europe et petites entreprises value', [['msci_europe',core],['small-value-europe',sector],['oblig_etat_eur_short',100-core-sector-(level===0?20:0)],['fonds_euros',level===0?20:0]]),
      ...['europe-utilities','europe-telecom','europe-food','europe-media','europe-retail'].map(id=>make(`europe-${id}`,{'europe-utilities':'Europe et services publics','europe-telecom':'Europe et télécommunications','europe-food':'Europe et alimentation','europe-media':'Europe et médias','europe-retail':'Europe et distribution'}[id],[['msci_europe',core],[id,sector],['oblig_etat_eur_short',100-core-sector-(level===0?20:0)],['fonds_euros',level===0?20:0]])),
      make('europe-sante','Europe large et santé', [['msci_europe',core],['health_europe_pea',sector],['oblig_etat_eur_short',100-core-sector-(level===0?20:0)],['fonds_euros',level===0?20:0]]),
      make('europe-assurance','Europe large et assurances', [['msci_europe',core],['europe-insurance',sector],['oblig_etat_eur_short',100-core-sector-(level===0?20:0)],['fonds_euros',level===0?20:0]]),
      make('europe-dividendes','Europe et dividendes réguliers', [['msci_europe',core],['euro-dividend-aristocrats',sector],['oblig_etat_eur_short',100-core-sector-(level===0?20:0)],['fonds_euros',level===0?20:0]]),
      ...(level>=2 ? [make('europe-banques','Europe et banques', [['msci_europe',core],['europe-banks',sector],['oblig_etat_eur_short',100-core-sector-(level===0?20:0)],['fonds_euros',level===0?20:0]])] : []),
    ];
  }
  if(profile==='rentier') {
    const stable=[80,60,30,10,0][level], sector=[5,10,15,20,25][level];
    return [
      ...['europe-utilities','europe-telecom','timber-ishares'].map(id=>make(`revenus-${id}`,{'europe-utilities':'Dividendes et services publics','europe-telecom':'Dividendes et télécommunications','timber-ishares':'Dividendes et filière bois'}[id],[[DIV,100-stable-sector],[id,sector],['fonds_euros',stable]])),
      make('revenus-europe','Dividendes mondiaux et zone euro',[[DIV,100-stable-sector],['euro-dividend-aristocrats',sector],['fonds_euros',stable]]),
      make('revenus-assurances','Dividendes et assurances européennes',[[DIV,100-stable-sector],['europe-insurance',sector],['fonds_euros',stable]]),
      make('revenus-smallcaps','Dividendes et petites entreprises émergentes',[[DIV,100-stable-sector],['em_small_ishares',sector],['fonds_euros',stable]]),
    ];
  }
  if(profile==='bouclier') {
    const equity=[10,20,35][level];
    if(equity===undefined)return [];
    return [
      make('qualite-court','Qualité, fonds euros et dette courte',[['world_quality_ishares',equity],['fonds_euros',70-equity],[SHORT,30]]),
      make('minimum-court','Volatilité réduite et dette courte',[['world_minvol_ishares',equity],['fonds_euros',70-equity],[SHORT,30]]),
      make('global-obligations','Marché mondial et obligations couvertes en euros',[[GLOBAL,equity],['fonds_euros',80-equity],['oblig_global_agg_eur_hedged',20]]),
    ];
  }
  if(profile==='anti_inflation') {
    const sector=[5,10,15,20,25][level], stable=[65,50,30,20,25][level];
    return [
      make('inflation-industrie','Obligations indexées et industrie',[['oblig_inflation',100-stable-sector],['industry_world_dws',sector],[level>=3?GLOBAL:'fonds_euros',stable]]),
      make('inflation-mines','Or, minières et supports courts',[[GOLD,25],['gold-miners-vaneck',sector],[SHORT,75-sector]]),
      make('inflation-reseaux','Obligations indexées et infrastructures',[['oblig_inflation',100-stable-sector],['infrastructure_ishares',sector],[level>=3?GLOBAL:'fonds_euros',stable]]),
    ];
  }
  if(profile==='crypto_curieux') {
    if(level===0)return [];
    const btc=[0,5,12,20,35][level], core=[0,15,35,60,55][level];
    return [
      make('crypto-global','Marché mondial complet et Bitcoin',[[BTC,btc,0],[GLOBAL,core],['fonds_euros',100-btc-core]]),
      make('crypto-qualite','Qualité mondiale et Bitcoin',[[BTC,btc,0],['world_quality_ishares',core],[SHORT,100-btc-core]]),
      make('crypto-equipondere','Actions américaines équipondérées et Bitcoin',[[BTC,btc,0],['sp500_equal_weight',core],['fonds_euros',100-btc-core]]),
    ];
  }
  if(profile==='thematique') {
    if(level===0)return [];
    const theme=[0,35,35,55,70][level];
    // Les nouvelles convictions restent distinctes. Une santé européenne ne
    // devient pas implicitement un ETF mondial lors d'un changement d'émetteur.
    const themes=level===1 ? ['health_europe_pea','utilities_world_dws','sect_conso_defensive','world-staples']
      : ['cloud-wisdomtree','ia-big-data-xtrackers','industry_world_dws','health_europe_pea','world-staples','world-discretionary','world-energy','water-ishares'];
    const labels = {'world-staples':'Consommation de base mondiale','world-discretionary':'Consommation discrétionnaire mondiale','world-energy':'Énergie mondiale','water-ishares':'Eau',health_europe_pea:'Santé européenne',utilities_world_dws:'Services publics mondiaux',sect_conso_defensive:'Consommation de base',
      'cloud-wisdomtree':'Cloud','ia-big-data-xtrackers':'Intelligence artificielle et big data',industry_world_dws:'Industrie mondiale'};
    return themes.map(id=>make(`theme-${id}`,`${labels[id]} et socle mondial`,[
      [id,theme,0],[GLOBAL,level===1?15:level===2?15:level===3?15:20],
      [SHORT,level===1?50:level===2?50:level===3?30:0],
      ['msci_em',level===4?10:0],
    ]));
  }
  return [];
}
