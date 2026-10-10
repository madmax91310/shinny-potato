import { REGULATORY as R, regulatoryNumber as n, regulatoryMoney as money } from '../src/data/regulatory-data.js';
import assert from 'node:assert/strict';
import { TERMES } from '../src/data/financial-lexicon.js';
import { FICHE_LEXIQUE_EDITORIAL } from '../src/pages/tweet-midi/data/ficheLexiqueEditorial.js';
import { FICHE_LEXIQUE_SUBJECTS, getFicheLexiqueText, getFicheLexiqueSections } from '../src/pages/tweet-midi/data/ficheLexique.js';

assert.deepEqual(Object.keys(FICHE_LEXIQUE_EDITORIAL).sort(), TERMES.map(t => t.id).sort());
assert.deepEqual(FICHE_LEXIQUE_SUBJECTS.flatMap(g => g.items.map(t => t.id)).sort(), TERMES.map(t => t.id).sort());
const normalize = text => text.replace(/(\d)([%€])/gu, '$1 $2');
for (const terme of TERMES) {
  const text = getFicheLexiqueText(terme.id);
  const sections = getFicheLexiqueSections(terme.id);
  assert(text.length > 700 && text.length < 4000, `${terme.id}: une fiche détaillée et lisible`);
  assert(sections.every(s => s.titre && s.contenu), `${terme.id}: rubrique complète`);
  // Chaque récit a son ordre ; les règles fiscales sont vérifiées plus bas.
  assert.doesNotMatch(text, /Ce que ça veut dire|À quoi ça sert|undefined|NaN|https?:\/\//);
  if (!FICHE_LEXIQUE_EDITORIAL[terme.id].sections) {
    const facts = terme.variante === 'A' ? [terme.mecanismeContenu, terme.fraisContenu] : [terme.calculContenu];
    for (const fact of facts.filter(Boolean)) assert(text.includes(normalize(fact)), `${terme.id}: règles sourcées conservées`);
  }
}

// Le contenu doit expliquer l'assiette, les délais et les résultats nets.
const pea = getFicheLexiqueText('pea');
for (const rule of [/premier versement/, /retrait partiel/, /retrait total/i, /ne constitue pas un retrait/, /taux historiques/]) assert.match(pea, rule);
for (const value of [n('peaCeiling') + ' €', n('peaTotal') + ' %', n('peaIncome') + ' %', n('peaSocial') + ' %', money(5000 * R.peaSocial / 100) + ' €', money(15000 - 5000 * R.peaSocial / 100) + ' €']) assert(pea.includes(value));
const cto = getFicheLexiqueText('cto');
assert(cto.includes(money(300 * R.ctoTotal / 100) + ' €'));
assert(cto.includes(money(1300 - 300 * R.ctoTotal / 100) + ' €'));
const av = getFicheLexiqueText('assurance-vie');
for (const rule of [/500 € de gains/, /2 500 € de capital/, /déjà prélevés/]) assert.match(av, rule);
for (const key of ['avSingleAllowance', 'avCoupleAllowance', 'avSocial', 'avLowerIncome', 'avHigherIncome']) assert(av.includes(n(key)));
assert.equal(3000 * (2000 / 12000), 500);
assert.match(getFicheLexiqueText('per'), /tranche à 30 %.*300 €/);
assert(getFicheLexiqueText('ldds').includes(money(R.lddsCeiling * R.lddsRate / 100) + ' €'));
assert.match(getFicheLexiqueText('ratio-sharpe'), /0,5.*0,25/s);
assert.match(getFicheLexiqueText('lmnp'), /5 000 € de base imposable/);
assert.match(getFicheLexiqueText('lmnp'), /ne peut pas créer de déficit/);
assert.match(getFicheLexiqueText('lmnp'), /15 février 2025/);
assert.match(getFicheLexiqueText('plus-value-imposable'), /110 €.*100 € de plus-value/s);
assert.match(getFicheLexiqueText('plus-value-immobiliere'), /22 ans.*30 ans/s);
assert.match(getFicheLexiqueText('plus-value-immobiliere'), /7 240 €/);
assert.match(getFicheLexiqueText('abattement-pea'), /exonération.*pas d'un abattement/);
assert.match(FICHE_LEXIQUE_SUBJECTS.flatMap(g => g.items).find(t => t.id === 'abattement-pea').label, /exonération/);
assert.equal(getFicheLexiqueText('inconnu'), '');
assert.deepEqual(getFicheLexiqueSections('inconnu'), []);
const dca = getFicheLexiqueText('dca');
assert.match(dca, /200 €.*30 parts.*6,67 €/s);
assert.match(dca, /ne garantit pas un meilleur rendement/);
assert.match(dca, /frais.*courtier/i);
assert.match(getFicheLexiqueText('diversification'), /World.*S&P 500.*Nasdaq-100/s);
assert.match(getFicheLexiqueText('diversification'), /même bien diversifié.*peut baisser/s);
const recovery = getFicheLexiqueText('drawdown');
assert.match(recovery, /1 000 €.*500 €.*250 €.*750 €.*100 %/s);
assert.match(recovery, /rien ne garantit le retour/);
for (const id of ['cto', 'ter', 'inflation', 'capitalisation-boursiere']) {
  const text = getFicheLexiqueText(id);
  assert(text.indexOf(FICHE_LEXIQUE_EDITORIAL[id].exemple) < text.indexOf(FICHE_LEXIQUE_EDITORIAL[id].definition));
}
console.log(`OK : ${TERMES.length} fiches détaillées, règles fiscales, calculs, exemples et limites adaptés.`);
