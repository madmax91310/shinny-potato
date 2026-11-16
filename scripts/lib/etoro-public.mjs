// Only data observed on an unauthenticated, explicitly public profile page.
export function parseEtoroPublic({ username, identity, stats, portfolio, names, consulted }) {
  const fail = () => { throw Error('Page eToro publique incomplète ou incompatible ; dernier relevé conservé.'); };
  const numeric = value => typeof value === 'number' && Number.isFinite(value);
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(username) || identity?.username?.toLowerCase() !== username.toLowerCase() || !Number.isSafeInteger(identity.realCID) || identity.realCID <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(consulted) || new Date(consulted+'T00:00:00Z').toISOString().slice(0,10)!==consulted) fail();
  const performance = stats?.dataComponentsResponse?.filter(row => row.type === 'Performance');
  if (performance?.length !== 1 || !performance[0].componentData?.monthly || !Array.isArray(portfolio?.AggregatedMirrors) || portfolio.AggregatedMirrors.length || !Array.isArray(portfolio?.AggregatedPositions) || !portfolio.AggregatedPositions.length || portfolio.AggregatedPositions.length > 499) fail();
  const end = new Date(consulted + 'T00:00:00Z'); end.setUTCDate(0);
  const endDate = end.toISOString().slice(0,10), year = end.getUTCFullYear(), lastMonth = end.getUTCMonth() + 1;
  const firstActivity = performance[0].componentData.firstActivity;
  if (typeof firstActivity !== 'string' || !Number.isFinite(Date.parse(firstActivity)) || firstActivity.slice(0,10) > endDate) fail();
  const monthly = performance[0].componentData.monthly[String(year)] || {};
  const valid = row => numeric(row?.gain) && row.gain >= -100 && row.isSimulation === false;
  const current = monthly[lastMonth];
  if (!valid(current) || firstActivity.slice(0,10)>`${year}-${String(lastMonth).padStart(2,'0')}-01`) fail();
  const series = Array.from({length:lastMonth}, (_, i) => ({month:i+1, ...monthly[i+1]}));
  const completeYear = firstActivity.slice(0,10) <= `${year}-01-01` && series.every(valid);
  const source = `https://www.etoro.com/people/${username}/stats`;
  const positions = portfolio.AggregatedPositions.map(row => {
    const name = names.find(name => name.id === row.InstrumentID);
    if (row.Direction !== 'Buy' || !name?.name?.trim() || name.name.length > 200 || !numeric(row.Value) || row.Value < 0 || row.Value > 100) fail();
    return {name:name.name.trim(),identifier:`eToro:${row.InstrumentID}`,weight:row.Value};
  });
  const cash = portfolio.CreditByUnrealizedEquity;
  if (!numeric(cash) || cash < 0 || cash > 100) fail();
  positions.push({name:'Liquidités',identifier:'',weight:cash});
  const sum = positions.reduce((s,r) => s+r.weight, 0);
  if (sum <= 0 || sum > 100.5) fail();
  const common = {kind:'Cumulée',verified:false,na:''};
  return {source,currency:'',effective:'',positions,
    note:'Lecture des pages publiques eToro Stats et Portfolio, sans compte. Poids : Value et CreditByUnrealizedEquity, sans renormalisation. Allocation actuelle, distincte de la période des performances. Rendement mensuel publié ; cumul YTD approché par chaînage des mois publiés arrondis. Devise, dividendes et frais à confirmer. Aucun contrôle humain coché.',
    performances:{
      month:{...common,value:current.gain,start:`${year}-${String(lastMonth).padStart(2,'0')}-01`,end:endDate,original:`eToro Performance · ${year}-${String(lastMonth).padStart(2,'0')}`},
      ytd:completeYear ? {...common,value:Number(((series.reduce((product,row) => product*(1+row.gain/100),1)-1)*100).toFixed(2)),start:`${year}-01-01`,end:endDate,original:'Cumul géométrique des mois eToro publiés, arrondis par la source',approximate:true} : {...common,value:'',start:'',end:'',original:''},
      method:'Autre',methodNote:'Méthode de la carte Performance eToro : variation mensuelle de valeur avec traitement des ajouts/retraits selon la formule de l’éditeur. YTD approché : produit des facteurs mensuels arrondis publiés, moins un. Conventions dividendes/frais à documenter. https://help.etoro.com/s/article/What-statistics-does-eToro-track-and-where-can-I-find-them?language=en_GB',
      series:series.filter(valid).map(row => ({month:`${year}-${String(row.month).padStart(2,'0')}`,value:row.gain})),source,
    }};
}
