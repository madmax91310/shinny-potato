import {readFileSync,writeFileSync} from 'node:fs'
import {EDITORIAL_WEEK,publicationLabel} from '../src/data/editorial-calendar.js'
// Derived metadata for tool badges. The complete calendar remains canonical
// and is loaded by Home; no independent schedule is maintained here.
const paths=[...new Set(EDITORIAL_WEEK.flatMap(day=>[...day.morning,...day.midday,...day.evening].map(slot=>slot.path)))].sort()
const labels=Object.fromEntries(paths.map(path=>[path,publicationLabel(path)]))
const file=new URL('../src/data/editorial-publication-labels.json',import.meta.url)
const content=JSON.stringify(labels,null,2)+'\n'
let prior;try{prior=readFileSync(file,'utf8')}catch{}
if(prior!==content)writeFileSync(file,content)
