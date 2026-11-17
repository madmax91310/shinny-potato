import {transparentLogo} from './image.js'
import {pngCredits} from './png-credits.js'
import {editorialSeries,portfolioOwner,cash,weightLabel,shortPosition} from './publication.js'
import {loadPortfolioFont,posterFont} from './type.js'
import {positionLogo} from './media.js'
export async function renderSeriesPage(portfolio,index=0) {
  const series=editorialSeries(portfolio),page=series.pages[index]
  if(!page)throw Error('Page de publication indisponible.')
  if(!index)return (await import('./image.js')).renderPortfolioImage(portfolio)
  await loadPortfolioFont()
  const logos=await Promise.all(page.rows.map(positionLogo))
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350
  const c=canvas.getContext('2d');if(!c)throw Error('Impossible de créer le visuel.')
  c.fillStyle='#d7d7d7';c.fillRect(0,0,1080,1350)
  function text(value,x,y,size=36,color='#080808',align='left',weight=800){c.font=posterFont(size,weight);c.fillStyle=color;c.textAlign=align;c.fillText(value,x,y)}
  const owner=portfolioOwner(portfolio);let size=66;c.font=posterFont(size,900);while(c.measureText(owner).width>980&&size>34){size-=2;c.font=posterFont(size,900)}
  text(owner,50,94,size,'#008c30','left',900)
  const date=new Date(portfolio.snapshot.periodEnd+'T12:00:00Z')
  text(`Suite des positions · ${index+1}/${series.pages.length}`,50,154,40)
  text(`T${Math.ceil((date.getUTCMonth()+1)/3)} ${date.getUTCFullYear()} · Positions ${page.start+1} à ${page.start+page.rows.length}`,50,201,32)
  const max=Math.max(...page.rows.map(r=>r.value)),scale=Math.max(.001,Math.ceil(max/series.main.total*1000)/1000),step=79
  text(`${series.topCount} premières : ${weightLabel(series.coverage)} · Barres : 0–${weightLabel(scale)}`,50,246,28,'#006d26')
  page.rows.forEach((r,i)=>{
    const y=296+i*step,prepared=transparentLogo(logos[i].image),logo=prepared?.image
    if(logo){const k=Math.min(104/logo.width,62/logo.height);if(logo.height*k>=26){
      const paint=document.createElement('canvas');paint.width=logo.width;paint.height=logo.height;const p=paint.getContext('2d');p.drawImage(logo,0,0)
      if(prepared.mono){p.globalCompositeOperation='source-in';p.fillStyle='#111';p.fillRect(0,0,paint.width,paint.height)}
      c.drawImage(paint,40+(104-logo.width*k)/2,y-28,logo.width*k,logo.height*k);paint.width=paint.height=1
    }}
    const name=shortPosition(r),labelSize=34;c.font=posterFont(labelSize,850)
    // Wrap at whole words; a short security label never loses its class.
    const words=name.split(/\s+/),lines=[];let line=''
    for(const word of words){if(line&&c.measureText(line+' '+word).width>650){lines.push(line);line=''}line=line?line+' '+word:word}if(line)lines.push(line)
    if(lines.length>2||lines.some(line=>c.measureText(line).width>650))throw Error('Libellé trop long pour la série ; consulter le détail intégral.')
    lines.forEach((line,j)=>text(line,170,y+j*32,labelSize,'#006d26'))
    text(weightLabel(r.value/series.main.total),1020,y,34,'#080808','right',900)
    text(cash(r.value,series.main.currency),1020,y+32,27,'#080808','right',650)
    c.fillStyle='#bfc2bf';c.beginPath();c.roundRect(170,y+44,850,7,3);c.fill()
    c.fillStyle=r.color;c.beginPath();c.roundRect(170,y+44,Math.max(2,850*r.value/series.main.total/scale),7,3);c.fill()
  })
  text(`Valeur déclarée : ${cash(series.main.total,series.main.currency)}`,540,1284,35,'#080808','center')
  text(`Épargnant libre · ${index+1}/${series.pages.length}`,540,1340,27,'#080808','center')
  return pngCredits(canvas.toDataURL('image/png'),{owner,periodEnd:portfolio.snapshot.periodEnd,page:index+1,pages:series.pages.length,total:series.main.total,currency:series.main.currency,scope:'Positions déclarées hors options ; poids sur le portefeuille admissible complet.',coverage:{count:series.topCount,weight:series.coverage},barScale:{min:0,max:scale,denominator:series.main.total},positions:page.rows.map(r=>({name:shortPosition(r),cusip:r.cusip,shareClass:r.shareClass,value:r.value,weight:r.value/series.main.total}))})
}
