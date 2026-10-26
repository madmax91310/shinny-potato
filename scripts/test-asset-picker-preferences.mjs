import assert from 'node:assert/strict'
import { assetPreferenceKey, filterAssetOptions, updateAssetKeys, ASSET_FAVORITES_KEY, ASSET_RECENTS_KEY } from '../src/lib/asset-picker-preferences.js'
const world={id:'world',isin:'FR001400U5Q4',label:'Amundi Monde',search:'DCAM MSCI World',badges:['PEA'],group:'Monde'}
const other={id:'other',label:'Émergents',group:'Émergents'}
assert.equal(assetPreferenceKey(world),assetPreferenceKey({...world,id:'different-route-id'}))
assert.notEqual(assetPreferenceKey(world),assetPreferenceKey({...world,isin:'IE0002XZSHO1'}))
assert.deepEqual(filterAssetOptions([world,other],{query:'World Amundi',peaOnly:true}),[world])
assert.deepEqual(filterAssetOptions([world,other],{query:'emergents'}),[other])
assert.deepEqual(filterAssetOptions([world,other],{peaOnly:true,group:'Émergents'}),[])
const values=new Map()
globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}
updateAssetKeys(ASSET_FAVORITES_KEY,()=>[assetPreferenceKey(world)])
assert.equal(updateAssetKeys(ASSET_FAVORITES_KEY,all=>[...all,assetPreferenceKey(world)]).length,1)
for(let i=0;i<12;i++)updateAssetKeys(ASSET_RECENTS_KEY,all=>[`asset:${i}`,...all],8)
assert.equal(updateAssetKeys(ASSET_RECENTS_KEY,all=>all,8).length,8)
for(const raw of ['{broken','{"wrong":"shape"}']) {
  values.set('epargnant-publication:v1:'+ASSET_FAVORITES_KEY,raw)
  assert.equal(updateAssetKeys(ASSET_FAVORITES_KEY,()=>[assetPreferenceKey(world)]),null)
  assert.equal(values.get('epargnant-publication:v1:'+ASSET_FAVORITES_KEY),raw)
}
globalThis.localStorage={getItem:()=>{throw Error('blocked')},setItem:()=>{throw Error('blocked')}}
assert.doesNotThrow(()=>updateAssetKeys(ASSET_FAVORITES_KEY,()=>[assetPreferenceKey(world)]))
console.log('Asset identities, multi-term search, accents, documented PEA, deduplication, recents bounds and blocked storage passed.')
