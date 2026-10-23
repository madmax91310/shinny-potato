// Developer-only fixture preparation. Never writes outside an isolated Git branch.
import fs from 'node:fs'
import path from 'node:path'
import {execFileSync} from 'node:child_process'
import {defaultConfig} from '../src/pages/ai-portfolios/data.js'
import {isRehearsalBranch} from './ai-owner-issue.mjs'
const args=process.argv.slice(2),root=path.resolve(args[args.indexOf('--root')+1]??'.')
const branch=execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim()
if(!isRehearsalBranch(branch))throw Error('Préparation interdite hors branche ai-rehearsal/…')
const folder=path.join(root,'data/ai-portfolios'),book=JSON.parse(fs.readFileSync(path.join(folder,'book.json')))
if(book.competitions.length||book.audit.length)throw Error('Utiliser une branche isolée neuve sans compétition ni décision.')
const market=JSON.parse(fs.readFileSync(path.join(folder,'market.json'))),config=defaultConfig(new Date(Date.now()+86400000).toISOString().slice(0,10),market)
config.name='RECETTE ISOLÉE · ne pas utiliser pour la compétition réelle'
config.minLines=1;config.maxWeight=100;config.feeBps=10
config.participants=config.participants.map(p=>({...p,name:p.name+' · RECETTE',model:'Test technique isolé — aucun modèle réel'}))
fs.writeFileSync(path.join(root,'.ai-portfolio-rehearsal.json'),JSON.stringify({version:1,scope:'isolated',createdAt:new Date().toISOString()})+'\n')
const file=path.join(root,'public/data/ai-portfolios/overview.json'),overview=JSON.parse(fs.readFileSync(file));overview.defaults=config
fs.writeFileSync(file,JSON.stringify(overview)+'\n')
console.log(JSON.stringify({branch,scope:'isolated',asOf:market.asOf,benchmark:config.benchmark,positions:0}))
