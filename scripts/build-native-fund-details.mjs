import {readFileSync,writeFileSync} from 'node:fs'
import {projectNativeFundDetails} from './lib/native-fund-details.mjs'

const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url)))
const books=read('../src/data/dca-complete-holdings.json')
const identities=read('../src/data/index-company-identities.json')
const classes=read('./wisdomtree-holdings-classes.json')
const result=projectNativeFundDetails(books,classes,identities)
writeFileSync(new URL('../src/data/native-fund-details.json',import.meta.url),JSON.stringify(result)+'\n')
console.log(`Native fund details: ${Object.keys(result).length} exact fund top tens; no index or full-book admission.`)
