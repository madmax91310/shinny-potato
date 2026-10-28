import {createHash} from 'node:crypto'
// Bind all observed values, including gaps, without extending or repairing them.
// Domain/window guards remain the responsibility of the existing consumers.
export function monthlyFingerprint(value){
 if(!Array.isArray(value?.points)||value.points.length<2)return null
 const points=value.points.map(p=>Array.isArray(p)?p:[p.date,p.price])
 if(points.some(p=>typeof p[0]!=='string'||!Number.isFinite(p[1])))return null
 return createHash('sha256').update(JSON.stringify({currency:value.currency,method:value.method??null,points})).digest('hex')
}
