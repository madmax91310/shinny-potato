// Local Inter variable font (SIL OFL, source and licence beside the font).
// One awaited face for the preview and every exported page; retry after failure.
let pending
export function loadPortfolioFont() {
  if(!pending)pending=new FontFace('PortfolioInter',`url("${import.meta.env.BASE_URL}asset-art/investor-type/inter-latin.woff2")`,{weight:'100 900'}).load()
    .then(font=>{document.fonts.add(font)}).catch(error=>{pending=undefined;throw error})
  return pending
}
export const posterFont=(size,weight=700)=>`${weight} ${size}px PortfolioInter, Arial, sans-serif`
