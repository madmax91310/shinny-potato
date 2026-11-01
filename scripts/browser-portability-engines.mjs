import {readFileSync,appendFileSync} from 'node:fs'
import {planShards} from './browser-shards.mjs'
export function needsExtraEngines(shard,total,commands,durations){
 if(!Number.isInteger(shard)||shard<0||shard>=total)throw new Error('Invalid browser shard')
 return planShards(commands,total,durations)[shard].commands.includes('node scripts/playwright-browser-portability.mjs')
}
if(process.argv[1]===new URL(import.meta.url).pathname){
 const commands=JSON.parse(readFileSync(new URL('./ci-browser-checks.json',import.meta.url)))
 const durations=JSON.parse(readFileSync(new URL('./ci-browser-durations.json',import.meta.url))).seconds
 const extra=needsExtraEngines(Number(process.argv[2]),Number(process.argv[3]),commands,durations)
 if(!process.env.GITHUB_OUTPUT)throw new Error('Missing GITHUB_OUTPUT')
 appendFileSync(process.env.GITHUB_OUTPUT,`extra=${extra}\n`)
}
