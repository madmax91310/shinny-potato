import { dateLabel, format, annualPublicationNote } from '../scpi-presentation/lib.js'
import { fundAllocation, fundGuarantee, fundOperations } from '../insurance-presentation/lib.js'

const INK = '#162b25', SERIF = 'Georgia, serif', SANS = 'Arial, sans-serif'
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
const brandAssets = {
  'iroko-zen':['iroko-zen.svg'], 'remake-live':['remake-live.png'],
  'corum-origin':['corum.svg'], 'corum-xl':['corum.svg'], 'corum-eurion':['corum.svg'],
  'transitions-europe':['arkea.png'], 'activimmo':['activimmo.png'], 'epargne-pierre':['epargne-pierre.svg'],
  'linxea-spirit-2':['linxea-spirit-2.svg'], 'linxea-avenir-2':['linxea-avenir-2.svg'],
  'linxea-vie':['linxea-vie.svg'], 'linxea-zen':['linxea-zen.svg'],
  'lucya-cardif':['lucya.png','cardif.png'], 'placement-direct-vie':['placement-direct-vie.svg'],
}
const managerMarks = new Set(['corum-origin','corum-xl','corum-eurion','transitions-europe','activimmo','placement-direct-vie'])
const assets=new Map()
function loadLogo(file) {
  if(!assets.has(file))assets.set(file,new Promise((resolve,reject)=>{
    const img=new Image()
    img.onload=()=>resolve(img)
    img.onerror=()=>{assets.delete(file);reject(new Error('Logo indisponible. Réessaie l’export.'))}
    img.src=`${import.meta.env.BASE_URL}asset-art/presentation-logos/${file}`
  }))
  return assets.get(file)
}
// The approved reference is a square editorial card, with three summary panels.
// Full product conditions remain in the adjacent text publication.
export function presentationCardModel(record, kind) {
  const model=presentationImageModel(record,kind)
  if(kind==='scpi') {
    const c=record.conditions
    const top=[...record.snapshot.sectors].sort((a,b)=>b.value-a.value)[0]
    const management=c.managementZones
      ? `${pct(c.managementZones.euro)} / ${pct(c.managementZones.outside)} TTC`
      : `${c.managementFeeMax || record.id==='iroko-zen'?'≤ ':''}${pct(c.managementFee)} ${c.managementTax ?? 'TTC'}`
    model.cards=[
      {title:'Patrimoine',icon:'buildings',rows:[row('Prix de la part',euro(record.price.value)),row('Minimum initial',euro(c.minimum)),...(top?[row(top.label,pct(top.value))]:[])],note:`Prix au ${dateLabel(record.price.asOf)}`},
      {title:'Distributions',icon:'coins',rows:record.annual.years.slice(-3).map(r=>row(String(r.year),pct(r.distribution))),note:'Taux de distribution bruts de fiscalité étrangère.'},
      {title:'Frais',icon:'document',rows:[row('Souscription',`${c.subscriptionFeeMax?'≤ ':''}${pct(c.subscriptionFee)} ${c.subscriptionTax ?? ''}`.trim()),row('Gestion',management)],note:c.managementZones?'Zone euro / hors zone euro. '+c.managementBasis:c.managementBasis},
    ]
    model.compactFooter='Capital et revenus non garantis · Revente non immédiate'
  } else {
    model.cards=[
      {title:'Supports',icon:'leaf',rows:[row('Supports annoncés',`> ${format(record.supports.minimumCount)}`),row('Ouverture',euro(record.access.initial)),row('Versement programmé',`${euro(record.access.monthly)}/mois`)],note:'Gestion libre · '+record.insurer},
      {title:'Fonds euros',icon:'coins',rows:record.euroFunds.map(f=>{const r=f.years.at(-1);return row(`${f.name} · ${r.year}`,r.return!=null?pct(r.return):`${format(r.returnMin)} à ${pct(r.returnMax)}`)}),note:record.euroFunds.map(f=>f.years.at(-1).condition).filter(Boolean).join('; ') || 'Nets de gestion, avant prélèvements sociaux et fiscaux. Hors bonus.'},
      {title:'Frais',icon:'document',rows:[row('Versement',pct(record.fees.subscription)),row('Gestion des UC',`${pct(record.fees.units)}/an`),row('Transactions ETF',pct(record.fees.etfTrade))],note:'Hors frais des supports et options. Transactions : par opération.'},
    ]
    model.compactFooter='UC non garanties · Rendements passés non garantis à l’avenir'
  }
  return model
}
// One identity per product, including separate identities for contracts from one distributor.
export const presentationBrands = {
  'iroko-zen': { color:'#1688db', light:'#a6e5ff', dark:'#073361' },
  'remake-live': { color:'#e4518c', light:'#ffd0df', dark:'#681d42' },
  'corum-origin': { color:'#c59b54', light:'#ffe9b8', dark:'#6d4622' },
  'corum-xl': { color:'#cb695b', light:'#ffd8bf', dark:'#6c2928' },
  'corum-eurion': { color:'#56aa92', light:'#c0f4df', dark:'#245e50' },
  'transitions-europe': { color:'#ce536b', light:'#ffced7', dark:'#6a2439' },
  'activimmo': { color:'#5599bd', light:'#c4edff', dark:'#1b455f' },
  'epargne-pierre': { color:'#dc934a', light:'#ffe3b9', dark:'#704323' },
  'linxea-spirit-2': { color:'#aa73d5', light:'#ebd4ff', dark:'#4d2c71' },
  'linxea-avenir-2': { color:'#4da3e1', light:'#c9eeff', dark:'#1a4976' },
  'linxea-zen': { color:'#68b4a6', light:'#d2fff0', dark:'#285b52' },
  'linxea-vie': { color:'#d86b93', light:'#ffd5e5', dark:'#6d304e' },
  'lucya-cardif': { color:'#59b9a4', light:'#d0fff0', dark:'#18594f' },
  'placement-direct-vie': { color:'#e49642', light:'#ffe5b4', dark:'#71431c' },
}
export function presentationReliefModel(record,kind) {
  const model=presentationCardModel(record,kind)
  if(kind==='scpi') {
    const latest=record.annual.years.at(-1)
    model.highlights=[
      row(`Distribution ${latest.year}`,pct(latest.distribution)),
      row('Prix de la part',euro(record.price.value)),
      row('Minimum initial',euro(record.conditions.minimum)),
    ]
    model.qualifier='Taux de distribution brut de fiscalité étrangère · Prix au '+dateLabel(record.price.asOf)
  } else {
    model.highlights=record.euroFunds.slice(0,2).map(f=>{
      const r=f.years.at(-1)
      return row(`${f.name} · ${r.year}`,r.return!=null?pct(r.return):`${format(r.returnMin)} à ${pct(r.returnMax)}`)
    })
    if(model.highlights.length===1)model.highlights.push(row('Ouverture',euro(record.access.initial)))
    model.highlights.push(row('Gestion des UC',`${pct(record.fees.units)}/an`))
    const conditions=record.euroFunds.slice(0,2).map(f=>f.years.at(-1).condition).filter(Boolean)
    model.qualifier=['Fonds euros : nets de gestion, avant prélèvements sociaux et fiscaux. Hors bonus.',...conditions.map(c=>c+'.'),
      'Gestion des UC : hors frais des supports et options.'].join(' ')
  }
  model.brand=presentationBrands[record.id]
  if(!model.brand)throw new Error('Identité visuelle de ce placement non référencée.')
  return model
}
function loadBackdrop(kind) {
  const file=`relief-${kind}.webp`
  if(!assets.has(file))assets.set(file,new Promise((resolve,reject)=>{
    const img=new Image()
    img.onload=()=>resolve(img)
    img.onerror=()=>{assets.delete(file);reject(new Error('Décor indisponible. Réessaie l’export.'))}
    img.src=`${import.meta.env.BASE_URL}asset-art/presentation-relief/${file}`
  }))
  return assets.get(file)
}
function logoMask(img,width,height) {
  const layer=document.createElement('canvas');layer.width=Math.ceil(width);layer.height=Math.ceil(height)
  const ctx=layer.getContext('2d');ctx.drawImage(img,0,0,width,height)
  const pixels=ctx.getImageData(0,0,layer.width,layer.height)
  // Only flatten white paper on opaque PNGs; preserve official white SVG marks.
  if(img.src.endsWith('.png'))for(let i=0;i<pixels.data.length;i+=4){
    const light=Math.min(pixels.data[i],pixels.data[i+1],pixels.data[i+2])
    pixels.data[i+3]*=1-Math.max(0,(light-215)/40)
  }
  if(/linxea-/.test(img.src))for(let i=0;i<pixels.data.length;i+=4){
    const light=Math.max(pixels.data[i],pixels.data[i+1],pixels.data[i+2])
    pixels.data[i+3]*=Math.max(0,(light-160)/95)
  }
  ctx.putImageData(pixels,0,0)
  return layer
}
function tintMask(mask,colors) {
  const layer=document.createElement('canvas');layer.width=mask.width;layer.height=mask.height
  const ctx=layer.getContext('2d');ctx.drawImage(mask,0,0);ctx.globalCompositeOperation='source-in'
  const gradient=ctx.createLinearGradient(0,0,layer.width,layer.height)
  colors.forEach((color,i)=>gradient.addColorStop(i/(colors.length-1),color))
  ctx.fillStyle=gradient;ctx.fillRect(0,0,layer.width,layer.height)
  return layer
}
function sculpture(ctx,img,x,y,width,height,brand) {
  const mask=logoMask(img,width,height)
  const edge=tintMask(mask,[brand.dark,brand.color,brand.dark])
  const face=tintMask(mask,[brand.light,brand.color,brand.dark,brand.color,brand.light])
  ctx.save();ctx.shadowColor=brand.color;ctx.shadowBlur=35
  ctx.globalAlpha=.45;ctx.drawImage(face,x,y);ctx.globalAlpha=1;ctx.shadowBlur=0
  // Actual extrusion of the official contour rather than a generic initial.
  for(let depth=20;depth>0;depth--)ctx.drawImage(edge,x+depth*.8,y+depth)
  ctx.drawImage(tintMask(mask,[brand.light,brand.light]),x-1.5,y-2)
  ctx.drawImage(face,x,y)
  ctx.save();ctx.translate(x,y+height*2+32);ctx.scale(1,-1);ctx.globalAlpha=.12;ctx.drawImage(face,0,0);ctx.restore()
  ctx.restore()
}
function fittedText(ctx,value,x,y,width,size,min,color,weight=400,family=SANS,maxLines=1) {
  while(size>min){font(ctx,size,weight,family);if(wrap(ctx,value,width).length<=maxLines)break;size-=2}
  font(ctx,size,weight,family)
  if(wrap(ctx,value,width).length>maxLines)throw new Error('Texte trop long pour le visuel de ce placement.')
  return text(ctx,value,x,y,width,size,color,weight,family)
}
export async function renderPresentationImage(record,kind) {
  await document.fonts.ready
  const model=presentationReliefModel(record,kind),files=brandAssets[record.id]
  if(!files)throw new Error('Logo de ce placement non référencé.')
  const [logos,backdrop]=await Promise.all([Promise.all(files.map(loadLogo)),loadBackdrop(kind)])
  const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1000
  const ctx=canvas.getContext('2d');ctx.textBaseline='top'
  ctx.drawImage(backdrop,0,0,1600,1000)
  ctx.save();ctx.globalCompositeOperation='color';ctx.globalAlpha=.45
  ctx.fillStyle=model.brand.color;ctx.fillRect(0,0,1600,1000);ctx.restore()
  const glow=ctx.createRadialGradient(850,430,10,850,430,640)
  glow.addColorStop(0,model.brand.color+'40');glow.addColorStop(1,model.brand.color+'00')
  ctx.fillStyle=glow;ctx.fillRect(0,0,1600,700)
  const shade=ctx.createLinearGradient(0,590,0,1000)
  shade.addColorStop(0,'#04102000');shade.addColorStop(.3,'#041020e8');shade.addColorStop(1,'#040b15')
  fittedText(ctx,model.title,80,70,1420,82,48,'#ffffff',500,SERIF)
  text(ctx,kind==='scpi'?'SCPI':'Assurance-vie',84,171,1300,30,model.brand.light)
  // Every official logo gets its own slot, including the Lucya / Cardif pair.
  for(let i=0;i<logos.length;i++) {
    const img=logos[i],slot=1260/logos.length
    const scale=Math.min((slot-60)/img.width,240/img.height)
    const w=img.width*scale,h=img.height*scale
    sculpture(ctx,img,170+i*slot+(slot-w)/2,420-h/2,w,h,model.brand)
  }
  if(managerMarks.has(record.id)) {
    ctx.textAlign='center'
    fittedText(ctx,record.name,800,570,1280,36,28,model.brand.light,500,SERIF)
  }
  ctx.fillStyle=shade;ctx.fillRect(0,590,1600,410)
  const metricWidth=450
  for(let i=0;i<model.highlights.length;i++) {
    const r=model.highlights[i],x=80+i*500
    ctx.textAlign='left'
    fittedText(ctx,r.value,x,688,metricWidth,90,56,'#ffffff',600,SERIF)
    fittedText(ctx,r.label,x,797,metricWidth,30,26,'#dbe9ef',400,SANS,2)
    if(i<2){ctx.fillStyle=model.brand.light+'60';ctx.fillRect(x+470,706,1,105)}
  }
  ctx.textAlign='left'
  fittedText(ctx,model.qualifier,80,870,1440,24,22,'#bed0dc',400,SANS,2)
  text(ctx,model.compactFooter,80,928,1180,23,'#bed0dc')
  ctx.textAlign='right';font(ctx,24,400,SERIF);ctx.fillStyle='#e1edf3';ctx.fillText('Épargnant Libre',1520,928)
  return canvas
}
