import assert from 'node:assert/strict'
import {ASSETS} from '../src/data/market-history.js'
import {HISTORY_VISUAL_ALIASES} from '../src/data/history-visual-identities.js'
import {ANNIVERSARY_ART} from '../src/pages/tweet-midi/anniversaryArt.js'
import {NEON_ASSET_ART} from '../src/pages/tweet-midi/stylizedArt.js'
import {PERFORMANCE_ART} from '../src/pages/tweet-midi/performanceArt.js'
import {INVESTMENT_ART} from '../src/pages/investment-calculator/emeraldArt.js'
for(const [id,parent] of Object.entries(HISTORY_VISUAL_ALIASES)) {
 assert.equal(ASSETS[id].isin,ASSETS[parent].isin)
 for(const map of [ANNIVERSARY_ART,NEON_ASSET_ART,PERFORMANCE_ART,INVESTMENT_ART])assert.deepEqual(map[id],map[parent])
}
console.log('Shared listing illustrations: same exact ISIN, approved assets reused; prices and currencies remain independent.')
