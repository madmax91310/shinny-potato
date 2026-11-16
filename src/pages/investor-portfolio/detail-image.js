import { dateFR } from './data.js'
import { portfolioOwner, labelLines } from './publication.js'
import { loadPortfolioFont, posterFont } from './type.js'
import { detailBlocks, paginateDetailBlocks } from './detail-pagination.js'
export async function renderDetailedPages(portfolio) {
  await loadPortfolioFont()
  const note=labelLines(portfolio.lastError || portfolio.problem || portfolio.snapshot.reconciliationWarning || 'Positions hors options ; options séparées en fin de détail.',60).slice(0,3)
  const contentTop=220+note.length*30
  const perPage=Math.floor((1210-contentTop)/38)+1
  const contentPages=paginateDetailBlocks(detailBlocks(portfolio),perPage)
  const pages=[]
  for(const lines of contentPages) {
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350
    const ctx=canvas.getContext('2d');ctx.fillStyle='#f7f8f2';ctx.fillRect(0,0,1080,1350)
    const text=(v,x,y,size=28)=>{ctx.font=posterFont(size,600);ctx.fillStyle='#17191d';ctx.fillText(v,x,y)}
    text(`Détail · ${dateFR(portfolio.snapshot.periodEnd)}`,40,65)
    text([...portfolioOwner(portfolio)].length>56?[...portfolioOwner(portfolio)].slice(0,55).join('')+'…':portfolioOwner(portfolio),40,110)
    text(portfolio.problem?'DONNÉES INCOMPLÈTES':'DÉCLARATION SEC VÉRIFIÉE',40,155)
    note.forEach((line,i)=>text(line,40,190+i*30,25))
    lines.forEach((line,i)=>{
      if(line.text && line.color){ctx.fillStyle=line.color;ctx.fillRect(24,contentTop+i*38-24,6,27)}
      text(line.text,40,contentTop+i*38)
    })
    text(`Épargnant libre · page ${pages.length+1}`,40,1290)
    pages.push(canvas.toDataURL('image/png'))
    // Release the backing surface before the next page and let mobile paint
    // its busy state. Thousands of holdings must not retain hundreds of canvases.
    canvas.width=1;canvas.height=1
    await new Promise(resolve=>requestAnimationFrame(resolve))
  }
  return pages
}
