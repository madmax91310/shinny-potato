import { dateLabel, format, annualPublicationNote } from '../scpi-presentation/lib.js'
import { fundAllocation, fundGuarantee, fundOperations } from '../insurance-presentation/lib.js'

const INK = '#162b25', MUTED = '#61675f', SERIF = 'Georgia, serif', SANS = 'Arial, sans-serif'
const pct = value => `${format(value)} %`
const euro = value => `${format(value)} €`
const row = (label, value) => ({ label, value: String(value) })
const sourceHosts = urls => [...new Set(urls.filter(Boolean).map(url => new URL(url).hostname.replace(/^www\./, '')))].join(' · ')
const split = (rows, limit = 3) => {
  const sorted = [...rows].sort((a,b) => b.value-a.value)
  const result = sorted.slice(0,limit).map(r => row(r.label,pct(r.value)))
  if (sorted.length>limit) result.push(row('Autres',pct(sorted.slice(limit).reduce((sum,r)=>sum+r.value,0))))
  return result
}
export function presentationImageModel(record, kind) {
  const sections = []
  let footer
  if (kind === 'scpi') {
    const { snapshot, annual, conditions:c, price } = record
    sections.push({title:'Patrimoine',columns:[{title:'Pays',rows:split(snapshot.countries)},{title:'Secteurs',rows:split(snapshot.sectors)}],notes:[snapshot.asOf ? `Répartition au ${dateLabel(snapshot.asOf)}.` : 'Date des graphiques non publiée.',snapshot.dateNote].filter(Boolean)})
    const metrics = Object.entries(record.portfolio ?? {}).map(([key,r]) => row(r.label,`${format(r.value)}${key==='occupancy'?' %':''} · ${dateLabel(r.asOf)}`))
    if (metrics.length) sections.push({title:'Actifs et occupation',rows:metrics,notes:['Le taux financier ne mesure pas l’occupation physique.',record.portfolio?.occupancy?.basis].filter(Boolean)})
    sections.push({title:'Distributions',annual:annual.years.map(r=>({year:r.year,value:pct(r.distribution)})),notes:['Taux de distribution, bruts de fiscalité étrangère ; distincts de la performance totale.',annualPublicationNote(annual.publication)].filter(Boolean)})
    const management=c.managementZones ? `${pct(c.managementZones.euro)} TTC en zone euro ; ${pct(c.managementZones.outside)} TTC hors zone euro` : `${c.managementFeeMax || record.id==='iroko-zen'?'Maximum ':''}${pct(c.managementFee)} ${c.managementTax ?? 'TTC'}`
    sections.push({title:'Accès et frais',columns:[{title:'Souscription',rows:[row('Prix de la part',`${euro(price.value)} · ${dateLabel(price.asOf)}`),row('Minimum initial',euro(c.minimum)),row('Revenus potentiels',c.frequency)]},{title:'Commissions',rows:[row('Souscription',`${c.subscriptionFeeMax?'Maximum ':''}${pct(c.subscriptionFee)} ${c.subscriptionTax ?? ''}`.trim()),row('Gestion',management),row('Assiette de gestion',c.managementBasis)]}],notes:[c.enjoyment,...(record.priceHistory?.corporateActions ?? []).map(a=>a.description)]})
    footer='Capital et revenus non garantis. Revente non immédiate. Distributions passées non garanties à l’avenir.'
  } else {
    const {fees,access,supports,euroFunds}=record
    sections.push({title:'Supports et accès',columns:[{title:'Versements minimums',rows:[row('Ouverture',euro(access.initial)),row('Versement libre',euro(access.free)),row('Programmé',`${euro(access.monthly)}/mois`)]},{title:'Supports annoncés',rows:[row('Nombre',`Plus de ${format(supports.minimumCount)}`),row('Catégories',supports.categories.join(', '))]}],notes:[`Assureur : ${record.insurer}. Gestion libre.`]})
    sections.push({title:'Frais du contrat',columns:[{title:'Opérations',rows:[row('Versement',pct(fees.subscription)),row('Arbitrage en ligne',pct(fees.arbitrage))]},{title:'Gestion et transactions',rows:[row('Unités de compte',`${pct(fees.units)}/an`),row('Transactions ETF',`${pct(fees.etfTrade)} par opération`)]}],notes:[fees.notes,'Les frais propres aux supports et aux options s’ajoutent.'].filter(Boolean)})
    for (const fund of euroFunds) {
      sections.push({title:fund.name,annual:fund.years.map(r=>({year:r.year,value:r.return!=null?pct(r.return):`${format(r.returnMin)} à ${pct(r.returnMax)}`})),notes:[...fund.years.filter(r=>r.condition).map(r=>`${r.year} : ${r.condition}.`),`Gestion du fonds : ${pct(fund.managementFeeMax)} maximum/an.`,annualPublicationNote(fund.publication),fundGuarantee(fund),fundAllocation(fund),fundOperations(fund),fund.notes].filter(Boolean)})
      const latest=fund.years.at(-1)
      if(latest.tiers) sections.push({title:`Barème ${latest.year} · ${fund.name}`,table:latest.tiers,notes:['Ce barème dépend de l’encours et de la part d’unités de compte.']})
    }
    footer='Rendements nets de gestion, avant prélèvements sociaux et fiscaux, hors bonus commerciaux. UC non garanties. Rendements passés non garantis à l’avenir.'
  }
  const urls=kind==='scpi' ? [record.sourceUrl,...record.snapshot.sourceUrls,record.annual.sourceUrl,...(record.conditions.sourceUrls ?? [record.conditions.sourceUrl])] : [record.sourceUrl,...(record.fees.sourceUrls ?? [record.fees.sourceUrl]),...record.euroFunds.flatMap(f=>f.sourceUrls ?? [f.sourceUrl])]
  return {title:record.name,subtitle:kind==='scpi'?'Immobilier d’entreprise':'Assurance-vie',kind,sections,footer,sources:`Sources officielles : ${sourceHosts(urls)}. Relevé le ${dateLabel(record.checkedAt)}${kind==='insurance'?' ; dates d’effet des frais non toujours publiées':''}.`}
}
function font(ctx,size,weight=400,family=SANS){ctx.font=`${weight} ${size}px ${family}`}
function wrap(ctx,text,width) {
  const result=[]
  for(const paragraph of String(text).split('\n')) {
    let line=''
    for(const word of paragraph.split(/\s+/).filter(Boolean)) {
      if(ctx.measureText(word).width>width) {
        if(line){result.push(line);line=''}
        for(const letter of word){if(ctx.measureText(line+letter).width>width){result.push(line);line=''}line+=letter}
      } else if(line && ctx.measureText(`${line} ${word}`).width>width){result.push(line);line=word}
      else line=line?`${line} ${word}`:word
    }
    if(line)result.push(line)
  }
  return result
}
function text(ctx,value,x,y,width,size=29,color=INK,weight=400,family=SANS){font(ctx,size,weight,family);ctx.fillStyle=color;const lines=wrap(ctx,value,width);lines.forEach((line,i)=>ctx.fillText(line,x,y+i*size*1.35));return y+lines.length*size*1.35}
function rows(ctx,items,x,y,width){for(const r of items){y=text(ctx,r.label,x,y,width,24,MUTED);y=text(ctx,r.value,x,y+7,width,31,INK,600)+24}return y}
function section(ctx,s,y) {
  y=text(ctx,s.title,116,y,1368,37,INK,600,SERIF)+30
  if(s.columns){const bottom=s.columns.map((c,i)=>{let cy=text(ctx,c.title,116+i*704,y,664,27,MUTED,600)+22;return rows(ctx,c.rows,116+i*704,cy,664)});y=Math.max(...bottom)}
  if(s.rows)y=rows(ctx,s.rows,116,y,1368)
  if(s.annual){const width=1368/s.annual.length;const bottom=s.annual.map((a,i)=>{const x=116+i*width;let cy=text(ctx,String(a.year),x,y,width-35,26,MUTED);return text(ctx,a.value,x,cy+12,width-35,42,INK,600,SERIF)+25});y=Math.max(...bottom)}
  if(s.table){
    const widths=[480,590,220],xs=[116,626,1246]
    const headers=['Encours du contrat','Part d’unités de compte','Rendement']
    y=Math.max(...headers.map((h,i)=>text(ctx,h,xs[i],y,widths[i],25,MUTED,600)))+24
    for(const t of s.table){y=Math.max(...[t.encours,t.condition,pct(t.return)].map((v,i)=>text(ctx,v,xs[i],y,widths[i],27,INK)))+24}
  }
  for(const note of s.notes ?? []) y=text(ctx,note,116,y+12,1368,25,MUTED)+8
  return y+58
}
const assets=new Map()
function loadArt(kind) {
  if(!assets.has(kind))assets.set(kind,new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{assets.delete(kind);reject(new Error('Illustration indisponible. Réessaie l’export.'))};img.src=`${import.meta.env.BASE_URL}asset-art/mineral-${kind}.webp`}))
  return assets.get(kind)
}
export async function renderPresentationImage(record,kind) {
  await document.fonts.ready
  const model=presentationImageModel(record,kind),art=await loadArt(kind)
  const measure=document.createElement('canvas').getContext('2d');measure.textBaseline='top'
  let titleSize=78
  while(titleSize>46){font(measure,titleSize,600,SERIF);if(measure.measureText(model.title).width<=1368)break;titleSize-=2}
  font(measure,titleSize,600,SERIF)
  const titleHeight=wrap(measure,model.title,1368).length*titleSize*1.35
  const start=130+titleHeight+440
  let end=start
  for(const s of model.sections)end=section(measure,s,end)
  end=text(measure,model.footer,116,end,1368,25,MUTED)+20
  end=text(measure,model.sources,116,end,1368,23,MUTED)+115
  const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=Math.ceil(end+80)
  const ctx=canvas.getContext('2d');ctx.textBaseline='top'
  const bg=ctx.createLinearGradient(0,0,1600,canvas.height);bg.addColorStop(0,'#fffaf1');bg.addColorStop(1,'#ece4d7');ctx.fillStyle=bg;ctx.fillRect(0,0,1600,canvas.height)
  let seed=37
  for(let i=0;i<canvas.width*canvas.height/95;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%1600;seed=(Math.imul(seed,1664525)+1013904223)>>>0;ctx.fillStyle=i%2?'#705f4410':'#ffffff66';ctx.fillRect(x,seed%canvas.height,1,1)}
  ctx.fillStyle='#fffaf166';ctx.strokeStyle='#d8cdbb';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(55,45,1490,canvas.height-90,32);ctx.fill();ctx.stroke()
  ctx.textAlign='center'
  let y=text(ctx,model.title,800,104,1368,titleSize,INK,600,SERIF)
  text(ctx,model.subtitle,800,y+12,1368,32,MUTED,400,SERIF)
  ctx.textAlign='left'
  const scale=Math.min(1200/art.width,340/art.height);const w=art.width*scale,h=art.height*scale
  ctx.drawImage(art,(1600-w)/2,y+78+(340-h)/2,w,h)
  y=start
  for(const s of model.sections){
    const bottom=section(measure,s,y)
    ctx.fillStyle='#fffcf580';ctx.strokeStyle='#d8cdbb';ctx.lineWidth=1.5
    ctx.beginPath();ctx.roundRect(84,y-25,1432,bottom-y-15,20);ctx.fill();ctx.stroke()
    y=section(ctx,s,y)
  }
  y=text(ctx,model.footer,116,y,1368,25,MUTED)+20
  y=text(ctx,model.sources,116,y,1368,23,MUTED)+50
  font(ctx,31,400,SERIF);ctx.fillStyle=INK;ctx.textAlign='center';ctx.fillText('Épargnant Libre',800,y);ctx.textAlign='left'
  return canvas
}
