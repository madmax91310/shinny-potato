// Decorative objects represent the subject, never a count or an allocation.
export const HOUSEHOLD_WALLET_ART = Object.freeze({
 'wealth-share':'wealth','wealth-top10':'wealth','wealth-median':'wealth','young-wealth':'wealth','thirties-wealth':'wealth',
 pea:'securities',cto:'securities','securities-workers':'securities',
 'livret-assurance':'savings',lep:'savings',ldds:'savings',pel:'savings','retirement-savings':'savings','employee-savings':'salary',
 homeowners:'property','young-homeowners':'property','other-homes':'property',
 debt:'credit','debt-types':'credit',inheritance:'transmission',donation:'transmission',
 'salary-top10':'salary','salary-median':'salary',
 'unexpected-expense':'budget',heating:'property','bills-on-time':'budget','personal-spending':'budget',holidays:'holidays','protein-meals':'food',
})
const images = new Map()
export function getHouseholdArt(record) {
 const scene=HOUSEHOLD_WALLET_ART[record.id]
 if(!scene)throw new Error(`Illustration non vérifiée : ${record.id}`)
 return scene
}
export function loadHouseholdArt(record) {
 const scene=getHouseholdArt(record)
 if(!images.has(scene))images.set(scene,(async()=>{
  const response=await fetch(`${import.meta.env.BASE_URL}asset-art/household-wallet/${scene}.webp.b64`)
  if(!response.ok)throw new Error('L’illustration ne peut pas être chargée.')
  const image=new Image();image.src=`data:image/webp;base64,${(await response.text()).trim()}`;await image.decode();return image
 })().catch(error=>{images.delete(scene);throw error}))
 return images.get(scene)
}
