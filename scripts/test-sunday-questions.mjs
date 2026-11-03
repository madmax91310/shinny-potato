import assert from 'node:assert/strict'
import { TWEETS } from '../src/pages/tweet-bank/data.js'
import { SUNDAY_QUESTIONS, SUNDAY_THEMES } from '../src/pages/tweet-bank/sunday-questions.js'
import { filterAndSortTweets, randomUnpublishedQuestion } from '../src/pages/tweet-bank/lib.js'
import { contentValidity, renderBankCopy } from '../src/pages/tweet-bank/validity.js'
import { normalizeText, groupTweetVariants } from '../src/lib/tweet-discovery.js'
import { readBankRecord, saveBankRecord, DRAFTS_KEY } from '../src/pages/tweet-bank/storage.js'
assert.equal(SUNDAY_QUESTIONS.length,36)
assert.equal(new Set(TWEETS.map(t=>String(t.id))).size,TWEETS.length)
assert.equal(new Set(SUNDAY_QUESTIONS.map(t=>normalizeText(t.text))).size,36)
for (const question of SUNDAY_QUESTIONS) {
  assert(SUNDAY_THEMES.includes(question.theme))
  assert.equal(TWEETS.filter(t=>normalizeText(t.text)===normalizeText(question.text)).length,1)
  assert(contentValidity(question).ready)
  const draft={text:question.text+'\n\nMa précision.'}
  assert(contentValidity(question,draft).ready)
  assert.equal(renderBankCopy(question,draft),draft.text)
  assert(!contentValidity(question,{text:'  '}).ready)
}
assert.equal(groupTweetVariants(SUNDAY_QUESTIONS).length,36)
const dates=Object.fromEntries(SUNDAY_QUESTIONS.slice(1).map(t=>[t.id,'2020-01-01']))
assert.equal(randomUnpublishedQuestion(TWEETS,dates,()=>0).id,SUNDAY_QUESTIONS[0].id)
assert.equal(randomUnpublishedQuestion(TWEETS,{...dates,[SUNDAY_QUESTIONS[0].id]:'2020-01-01'}),null)
assert.deepEqual(filterAndSortTweets(SUNDAY_QUESTIONS,dates,{unpublished:true}).map(t=>t.id),[SUNDAY_QUESTIONS[0].id])
for (const theme of SUNDAY_THEMES) assert(filterAndSortTweets(SUNDAY_QUESTIONS,{}, {theme}).every(t=>t.theme===theme))
let raw=null
const storage={getItem:()=>raw,setItem:(_,value)=>{raw=value}}
const id='sunday:personal:test'
const question={id,personal:true,text:'Ma question ?\n\nUne précision.',category:'Question dimanche',theme:SUNDAY_THEMES[0]}
assert(!saveBankRecord(DRAFTS_KEY,{[id]:{text:question.text,question}},null,storage).error)
assert.deepEqual(readBankRecord(DRAFTS_KEY,storage).value[id].question,question)
assert(saveBankRecord(DRAFTS_KEY,{[id]:{text:'?',question:{...question,id:'collision'}}},raw,storage).error)
console.log('36 Sunday questions: stable unique IDs/texts, themes, exact edited copy, empty text, grouping, never-published draw and personal record validation OK.')
