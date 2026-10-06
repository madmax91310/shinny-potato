import records from './automated-indices.json' with { type: 'json' };
import { INDEX_RETURNS, getCurrentIndexReturnSeries } from './index-returns.js';
import { getCurrentIndexComposition } from './index-facts.js';

export const AUTOMATED_INDICES = records;
export function refreshIndexSheet(previous) {
  const record = records[previous.id];
  if (!record) return previous;
  const composition = getCurrentIndexComposition(previous.id, previous.indexFacts.asOf ?? 'methodology');
  const facts = composition.indexFacts;
  const changed = facts !== previous.indexFacts;
  const archivedReturn = Object.entries(INDEX_RETURNS[previous.id] ?? {}).find(([, series]) => series.values === previous.returns);
  const returns = previous.performance.kind === 'indice' && record.returns && archivedReturn
    ? getCurrentIndexReturnSeries(previous.id, archivedReturn[0]) : null;
  return { ...previous, ...(changed ? { ...composition, markets: facts.markets ?? previous.markets } : {}),
    ...(changed ? { snapshot: facts.snapshot,
      insight: `Cette photographie contient ${facts.constituents.toLocaleString('fr-FR')} titres. Le poids des pays et secteurs évolue : vérifie la date de composition.`,
      takeaway: `Les principales lignes publiées représentent ${facts.holdings.reduce((n, p) => n + p[1], 0).toFixed(2).replace('.', ',')} % de l’indice. Une diversification en nombre ne garantit pas des poids égaux.` } : {}),
    ...(returns ? { returns: returns.values, performance: { ...returns.performance, date: previous.performance.date } } : {}),
    source: [facts.source, ...(returns ? [returns.source] : previous.source.filter(s => s.url !== previous.indexFacts.source.url)), ...(facts.methodologySources ?? [])],
  };
}
