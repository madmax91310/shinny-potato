import {classify} from './classify-deploy-scope.mjs'
// All collectors needing the same code share one validation queue. New code
// gets its own queue; actual publications still share the global Pages lock.
export function publicationCodeEpoch(published,source,git,allowed){
 const commits=git('rev-list','--first-parent',`${published}..${source}`).split('\n').filter(Boolean)
 for(const commit of commits){
  const paths=git('diff','--name-only',`${commit}^`,commit).split('\n').filter(Boolean)
  if(!classify(paths,allowed).dataOnly)return commit
 }
 return published
}
