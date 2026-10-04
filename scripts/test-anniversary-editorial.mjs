import assert from 'node:assert/strict'
import { anniversaryResult, anniversaryClosing, anniversaryQuestion } from '../src/pages/tweet-midi/anniversaryEditorial.js'
const btc = { id: 'bitcoin', label: 'Bitcoin', tweetPhrase: 'le Bitcoin' }
const index = { id: 'sp500', label: 'S&P 500', tweetPhrase: 'le S&P 500', priceUnit: 'points' }
assert.equal(anniversaryResult(btc, 100, '+100 %'), 'son prix a doublé')
assert.equal(anniversaryResult(btc, 100.001, '+100 %'), 'son prix a plus que doublé')
assert.equal(anniversaryResult(btc, 99.999, '+100 %'), 'son prix a presque doublé')
assert.equal(anniversaryResult(index, 100, '+100 %'), 'son niveau a doublé')
assert.equal(anniversaryResult(btc, -20, '-20 %'), 'son prix a reculé de 20 %')
assert.equal(anniversaryResult(btc, 0, '0 %'), 'son prix est au même niveau')
assert.equal(anniversaryResult(btc, null, ''), 'où en est-il aujourd’hui ?')
assert.match(anniversaryClosing(btc, 0, '2021'), /ne signifie pas.*resté stable/)
assert.match(anniversaryQuestion(btc, '2021'), /détenais déjà le Bitcoin/)
assert.match(anniversaryQuestion(index, '2021'), /via un ETF qui suit le S&P 500/)
assert.doesNotMatch(anniversaryQuestion(index, '2021'), /acheter le S&P/)
assert.match(anniversaryQuestion({id:'or',tweetPhrase:"l'or"}, '2021'), /investir dans l'or/)
assert.doesNotMatch(anniversaryClosing(btc, null, '2021'), /💬/)
console.log('Anniversaires : seuil de doublement avant arrondi, baisse, stabilité, niveau manquant et questions par type vérifiés.')
