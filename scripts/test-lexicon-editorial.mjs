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
  assert.match(text, /🧮 Un exemple concret\n\n/);
  assert.match(text, /⚠️ À retenir\n\n/);
  assert.doesNotMatch(text, /Ce que ça veut dire|À quoi ça sert|undefined|NaN|https?:\/\//);
  if (!FICHE_LEXIQUE_EDITORIAL[terme.id].sections) {
    const facts = terme.variante === 'A' ? [terme.mecanismeContenu, terme.fraisContenu] : [terme.calculContenu];
    for (const fact of facts.filter(Boolean)) assert(text.includes(normalize(fact)), `${terme.id}: règles sourcées conservées`);
  }
}

// Le contenu doit expliquer l'assiette, les délais et les résultats nets.
const pea = getFicheLexiqueText('pea');
for (const rule of [/150 000 €/, /premier versement/, /31,4 %/, /12,8 %/, /18,6 %/, /930 €/, /14 070 €/, /retrait partiel/, /retrait total/i, /ne constitue pas un retrait/, /taux historiques/]) assert.match(pea, rule);
assert.equal(5000 * .186, 930);
assert.equal(15000 - 5000 * .186, 14070);
const cto = getFicheLexiqueText('cto');
assert.match(cto, /94,20 €/);
assert.match(cto, /1 205,80 €/);
assert.equal(300 * .314, 94.2);
const av = getFicheLexiqueText('assurance-vie');
for (const rule of [/4 600 €/, /9 200 €/, /17,2 %/, /7,5 %/, /12,8 %/, /500 € de gains/, /2 500 € de capital/, /déjà prélevés/]) assert.match(av, rule);
assert.equal(3000 * (2000 / 12000), 500);
assert.match(getFicheLexiqueText('per'), /tranche à 30 %.*300 €/);
assert.match(getFicheLexiqueText('ldds'), /12 000 €.*204 €/);
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
console.log(`OK : ${TERMES.length} fiches détaillées, règles fiscales, calculs, exemples et limites adaptés.`);
