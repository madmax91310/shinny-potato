import { BITCOIN_OPTIONS } from './theses.js';
import { AUTOMATIC_FACTOR_ADMISSIONS } from '../../data/portfolio-admissions.js';
// 16/10/2026: already-collected exact shares, newly used in automatic recipes.
// No return series or issuer observations are copied here.
const slot = (ids, pct, spread = 10) => ({ ...(Array.isArray(ids) ? {idOptions:ids} : {id:ids}), pct, minPct:Math.max(5,pct-spread), maxPct:Math.min(100,pct+spread) });
const make = (id,label,rows) => ({id:`routing-${id}`,label,description:label,assets:rows.filter(([,pct])=>pct>0).map(([id,pct,spread])=>slot(id,pct,spread))});
const levels = {prudent:0,defensif:1,equilibre:2,dynamique:3,offensif:4};
export function routingRecipes(profile,risk) {
  const i=levels[risk];
  if(i===undefined)return [];
  const stable=[80,65,35,10,0][i], satellite=[5,10,15,20,25][i];
  if(profile==='generaliste') return [
    make('world-em-pea','World et émergents avec filtres ESG', [['msci_world_amundi_pea',100-stable-satellite],['em_pea_amundi',satellite],['fonds_euros',stable]]),
    make('sp500-europe','S&P 500 et Europe développée', [['sp500_equal_weight',100-stable-satellite],['europe_pea_amundi',satellite],['fonds_euros',stable]]),
    ...(i>=2 ? [make('allworld-local-debt','All-World et dette émergente locale', [['ftse_allworld_vanguard',100-stable-satellite],['oblig_em_local_ishares_acc',satellite],['fonds_euros',stable]]),
      make('acwi-credit','ACWI et crédit à haut rendement', [['msci_acwi_ishares',100-stable-satellite],['oblig_hy_ishares_acc',satellite],['fonds_euros',stable]])] : []),
  ];
  if(profile==='pro_europe') {
    const core=[10,30,50,70,75][i], sat=[5,10,15,20,25][i];
    const factors = AUTOMATIC_FACTOR_ADMISSIONS.filter(a => a.profile === profile && a.risks.includes(risk));
    return [
      ...(factors.length ? [make('europe-factor','Europe et filtre factoriel', [['europe_pea_amundi',[0,0,55,70,75][i],5],[factors.map(a => a.id),15,5],['oblig_etat_eur_short',[0,0,30,15,10][i],5]])] : []),
      make('europe-govt','Europe et dette à maturité intermédiaire', [['europe_pea_amundi',core],['euro-govt-5-7',sat],['oblig_etat_eur_short',80-core-sat>0?80-core-sat:0],['fonds_euros',core+sat<80?20:100-core-sat]]),
      ...(i>=2 ? [make('europe-resources','Europe et producteurs de ressources', [['europe_pea_amundi',core],['basic_resources_pea',sat],['oblig_etat_eur_short',100-core-sat]]),
        make('europe-property','Europe et immobilier coté', [['europe_pea_amundi',core],['europe-property',sat],['oblig_etat_eur_short',100-core-sat]])] : []),
    ];
  }
  if(profile==='rentier') return [
    make('income-govt','Dividendes et dette souveraine euro', [['quality_dividend_dist',100-stable-satellite],['euro-govt-5-7',satellite],['fonds_euros',stable]]),
    ...(i>=2 ? [make('income-europe-property','Dividendes et immobilier européen', [['quality_dividend_dist',100-stable-satellite],['europe-property',satellite],['fonds_euros',stable]])] : []),
  ];
  if(profile==='bouclier') return [
    make('shield-govt','Minimum Volatility et dette souveraine euro', [['world_minvol_ishares',[10,20,35][i]],['euro-govt-5-7',[5,10,15][i]],['fonds_euros',[85,70,50][i]]]),
    make('shield-europe','Europe, fonds euros et monétaire', [['europe_pea_amundi',[10,20,35][i]],['monetaire_xeon',20],['fonds_euros',[70,60,45][i]]]),
  ];
  if(profile==='anti_inflation'&&i>=2) return [make('inflation-resources','Obligations indexées et producteurs de ressources', [['oblig_inflation',50],['basic_resources_pea',satellite],['fonds_euros',50-satellite]])];
  if(profile==='crypto_curieux'&&i>=1) {
    const btc=[0,5,12,20,35][i],core=[0,15,35,60,55][i];
    return [make('crypto-imi','ACWI IMI et Bitcoin', [[BITCOIN_OPTIONS,btc,0],['acwi_imi_spdr',core],['fonds_euros',100-btc-core]]),
      make('crypto-europe','Europe et Bitcoin', [[BITCOIN_OPTIONS,btc,0],['europe_pea_amundi',core],['fonds_euros',100-btc-core]])];
  }
  return [];
}
