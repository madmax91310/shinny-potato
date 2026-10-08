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
const assets=new Map()
function loadArt(kind) {
  if(!assets.has(kind))assets.set(kind,new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{assets.delete(kind);reject(new Error('Illustration indisponible. Réessaie l’export.'))};img.src=`${import.meta.env.BASE_URL}asset-art/mineral-${kind}.webp`}))
  return assets.get(kind)
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
      {title:'Supports',icon:'leaf',rows:[row('Supports annoncés',`Plus de ${format(record.supports.minimumCount)}`),row('Ouverture',euro(record.access.initial)),row('Versement programmé',`${euro(record.access.monthly)}/mois`)],note:'Gestion libre · '+record.insurer},
      {title:'Fonds euros',icon:'coins',rows:record.euroFunds.map(f=>{const r=f.years.at(-1);return row(`${f.name} · ${r.year}`,r.return!=null?pct(r.return):`${format(r.returnMin)} à ${pct(r.returnMax)}`)}),note:record.euroFunds.map(f=>f.years.at(-1).condition).filter(Boolean).join('; ') || 'Nets de gestion, avant prélèvements sociaux et fiscaux. Hors bonus.'},
      {title:'Frais',icon:'document',rows:[row('Versement',pct(record.fees.subscription)),row('Gestion des UC',`${pct(record.fees.units)}/an`),row('Transactions ETF',pct(record.fees.etfTrade))],note:'Hors frais des supports et options. Transactions : par opération.'},
    ]
    model.compactFooter='UC non garanties · Rendements passés non garantis à l’avenir'
  }
  return model
}
function panelIcon(ctx,kind,x,y) {
  ctx.save();ctx.translate(x,y);ctx.strokeStyle='#69765c';ctx.fillStyle='#d9d1bc';ctx.lineWidth=4;ctx.lineJoin='round'
  if(kind==='buildings') {for(const [px,h] of [[-40,42],[-12,70],[16,55]]){ctx.fillRect(px,30-h,25,h);ctx.strokeRect(px,30-h,25,h)}ctx.beginPath();ctx.moveTo(-48,34);ctx.lineTo(48,34);ctx.stroke()}
  else if(kind==='coins') {for(const [px,py] of [[-21,12],[20,-9]])for(let i=2;i>=0;i--){ctx.beginPath();ctx.ellipse(px,py+i*12,25,10,0,0,Math.PI*2);ctx.fill();ctx.stroke()}}
  else if(kind==='document') {ctx.beginPath();ctx.moveTo(-26,-35);ctx.lineTo(13,-35);ctx.lineTo(30,-18);ctx.lineTo(30,37);ctx.lineTo(-26,37);ctx.closePath();ctx.stroke();for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-13,-7+i*14);ctx.lineTo(17,-7+i*14);ctx.stroke()}}
  else {ctx.beginPath();ctx.ellipse(0,0,18,42,Math.PI/4,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-30,40);ctx.lineTo(23,-28);ctx.stroke()}
  ctx.restore()
}
export async function renderPresentationImage(record,kind) {
  await document.fonts.ready
  const model=presentationCardModel(record,kind),art=await loadArt(kind)
  const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1600
  const ctx=canvas.getContext('2d');ctx.textBaseline='top'
  const bg=ctx.createLinearGradient(0,0,1600,1600);bg.addColorStop(0,'#fffaf1');bg.addColorStop(1,'#ece4d7');ctx.fillStyle=bg;ctx.fillRect(0,0,1600,1600)
  let seed=37
  for(let i=0;i<27000;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%1600;seed=(Math.imul(seed,1664525)+1013904223)>>>0;ctx.fillStyle=i%2?'#705f4410':'#ffffff66';ctx.fillRect(x,seed%1600,1,1)}
  ctx.strokeStyle='#d8cdbb';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(45,35,1510,1530,32);ctx.stroke()
  let size=116
  while(size>48){font(ctx,size,600,SERIF);if(ctx.measureText(model.title).width<=1400)break;size-=2}
  ctx.textAlign='center';text(ctx,model.title,800,100,1400,size,INK,600,SERIF)
  text(ctx,model.subtitle,800,245,1400,42,MUTED,400,SERIF)
  ctx.strokeStyle='#858475';ctx.lineWidth=2
  for(const [a,b] of [[220,375],[1225,1380]]){ctx.beginPath();ctx.moveTo(a,274);ctx.lineTo(b,274);ctx.stroke()}
  // The artwork occupies the same dominant position as the approved mock-up.
  const scale=Math.min(1480/art.width,660/art.height),w=art.width*scale,h=art.height*scale
  ctx.drawImage(art,(1600-w)/2,325+(660-h)/2,w,h)
  for(let i=0;i<3;i++) {
    const card=model.cards[i],x=82+i*486,width=464
    ctx.fillStyle='#fffcf57a';ctx.strokeStyle='#d8cdbb';ctx.lineWidth=2
    ctx.beginPath();ctx.roundRect(x,1000,width,408,28);ctx.fill();ctx.stroke()
    panelIcon(ctx,card.icon,x+width/2,1065)
    ctx.textAlign='center';text(ctx,card.title,x+width/2,1120,width-48,43,INK,400,SERIF)
    ctx.textAlign='left'
    // Fit whole phrases in the three panels without removing conditions.
    let bodySize=29
    const draw=(paint)=>{
      const target=paint?ctx:document.createElement('canvas').getContext('2d');target.textBaseline='top'
      let y=1181
      for(const r of card.rows){y=text(target,r.label,x+28,y,width-56,bodySize-5,MUTED);y=text(target,r.value,x+28,y+3,width-56,bodySize+7,INK,600,SERIF)+12}
      return text(target,card.note,x+28,y+2,width-56,bodySize-6,MUTED)
    }
    while(bodySize>18 && draw(false)>1386)bodySize--
    draw(true)
  }
  ctx.textAlign='center'
  text(ctx,model.compactFooter,800,1430,1400,25,MUTED)
  text(ctx,`Relevé le ${dateLabel(record.checkedAt)} · Conditions détaillées dans le texte`,800,1470,1400,23,MUTED)
  text(ctx,'Épargnant Libre',800,1515,1400,32,INK,400,SERIF)
  ctx.textAlign='left'
  return canvas
}
