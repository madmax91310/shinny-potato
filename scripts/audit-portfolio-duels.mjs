#!/usr/bin/env node
import { DUELS } from '../src/pages/portfolio-duels/data.js'
import { buildDuel, buildTweet } from '../src/pages/portfolio-duels/lib.js'
import { YEARS } from '../src/pages/portfolio-generator/data.js'

if (DUELS.length !== 4 || new Set(DUELS.map((duel) => duel.id)).size !== DUELS.length) {
  throw new Error('Les quatre duels pilotes doivent être distincts')
}
for (const definition of DUELS) {
  const duel = buildDuel(definition)
  const tweet = buildTweet(duel)
  if (!duel.sources.every((source) => source.url?.startsWith('https://'))) {
    throw new Error(`Source officielle absente : ${duel.id}`)
  }
  if ([duel.a, duel.b].some((portfolio) =>
    portfolio.assets.reduce((total, asset) => total + asset.pct, 0) !== 100 ||
    YEARS.some((year) => !Number.isFinite(portfolio.annual[year])) ||
    !Number.isFinite(portfolio.final) || !Number.isFinite(portfolio.worst))) {
    throw new Error(`Résultat incomplet : ${duel.id}`)
  }
  if (/NaN|undefined|Méthode\s*:|rebalanc|proxy/i.test(tweet)) {
    throw new Error(`Texte non publiable : ${duel.id}`)
  }
  console.log(`${duel.id}: A ${duel.a.final.toFixed(0)} ${duel.currency}, B ${duel.b.final.toFixed(0)} ${duel.currency}`)
}
// L'ajout d'une part avec une série incomplète ou une devise différente doit échouer.
for (const [change, reason] of [
  [{ right: 'sect_financieres' }, 'historique partiel'],
  [{ right: 'oblig_hy_ishares_acc' }, 'devises distinctes'],
]) {
  try {
    buildDuel({ ...DUELS[0], ...change })
    throw new Error(`Garde-fou absent : ${reason}`)
  } catch (error) {
    if (error.message.startsWith('Garde-fou absent')) throw error
  }
}
console.log('4 duels et garde-fous vérifiés.')
