import assert from 'node:assert/strict'
import { buildTweetText, derive } from '../src/pages/investment-calculator/lib.js'

const state = { assetId: 'bitcoin', amountRaw: '1000', mode: 'lump', startYear: 2020, startMonth: 1, overridePriceRaw: '' }
const conclusion = (s, d) => buildTweetText(s, d).split('\n').find(line => line.startsWith('📌'))
const bitcoin = derive(state)
assert.match(conclusion(state, bitcoin), /à condition d’avoir conservé le placement de janvier 2020 à/)
assert.ok(!buildTweetText(state, bitcoin).includes('Livret A'))
assert.match(buildTweetText(state, bitcoin), /Tu as du Bitcoin en portefeuille \? Depuis quand/)
const monthly = { ...bitcoin, effectiveMode: 'dca', result: { ...bitcoin.result, totalInvested: 2000, finalValue: 2500 } }
assert.match(conclusion(state, monthly), /Avec 2\s000\s\$ versés au total.*500\s\$ de gain/)
assert.ok(!conclusion(state, monthly).includes('sans versement supplémentaire'))
const overridden = { ...state, overridePriceRaw: '100' }
assert.ok(!conclusion(overridden, bitcoin).includes('à condition d’avoir conservé'))
const sp = { ...state, assetId: 'sp500' }
assert.match(conclusion(sp, { ...bitcoin, result: { ...bitcoin.result, totalInvested: 1000, finalValue: 2449 } }), /Tu aurais gagné 1\s449\s\$.*sans versement supplémentaire/)
assert.match(conclusion(sp, { ...bitcoin, result: { ...bitcoin.result, totalInvested: 1000, finalValue: 750 } }), /Tu aurais perdu 250\s\$/)
assert.match(conclusion(sp, { ...bitcoin, result: { ...bitcoin.result, totalInvested: 1000, finalValue: 1000.1 } }), /sans gain ni perte au dollar près/)
const euro = { ...state, assetId: 'custom', customLabel: 'Mon placement' }
const example = { ...bitcoin, isCustom: true, result: { ...bitcoin.result, totalInvested: 1000, finalValue: 1090 }, livretA: { finalValue: 1120 } }
assert.match(conclusion(euro, example), /Mon placement termine en hausse.*1\s090\s€.*1\s120\s€.*simulation du Livret A/)
assert.match(buildTweetText(euro, example), /Tu compares parfois les résultats/)
assert.match(conclusion(euro, { ...example, result: { ...example.result, finalValue: 750 } }), /termine en baisse/)
assert.match(conclusion(euro, { ...example, result: { ...example.result, finalValue: 1120.1 } }), /même montant à l’euro près/)
assert.match(conclusion(euro, { ...example, effectiveMode: 'dca' }), /tes 1\s000\s€ de versements/)
console.log('Conclusions : gains, pertes, équilibre, versements mensuels, devises, prix saisi et Livret A vérifiés.')
