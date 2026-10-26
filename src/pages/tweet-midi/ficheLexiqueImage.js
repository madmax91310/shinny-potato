import { TERMES } from '../../data/financial-lexicon.js'
import { loadArtImage } from './anniversaryArt.js'
import { downloadPublicationBlob } from '../../design-system/downloadBlob.js'

// Chaque notion a un titre et une métaphore visuelle ; aucune donnée d'exemple.
export const LEXIQUE_VISUALS = Object.freeze({
  pea: ['LE PEA', 'Investir dans une enveloppe fiscale', 'envelope'],
  cto: ['LE CTO', 'Accéder aux marchés financiers', 'envelope'],
  'assurance-vie': ['L’ASSURANCE-VIE', 'Épargner et transmettre', 'shield'],
  per: ['LE PER', 'Préparer sa retraite', 'calendar'],
  'livret-a': ['LE LIVRET A', 'Garder une épargne disponible', 'reserve'],
  ldds: ['LE LDDS', 'Une épargne disponible', 'reserve'],
  'pee-perco': ['L’ÉPARGNE SALARIALE', 'Épargner avec son entreprise', 'company'],
  etf: ['LES ETF', 'Un fonds coté en Bourse', 'basket'],
  action: ['UNE ACTION', 'Une part d’entreprise', 'company'],
  obligation: ['UNE OBLIGATION', 'Prêter à un émetteur', 'document'],
  fcp: ['LES FCP', 'Investir dans un fonds commun', 'basket'],
  scpi: ['LES SCPI', 'Investir dans l’immobilier collectif', 'property'],
  opci: ['LES OPCI', 'Un fonds à dominante immobilière', 'property'],
  trackers: ['LES TRACKERS', 'Des ETF qui suivent un indice', 'basket'],
  dca: ['LE DCA', 'Investir régulièrement', 'calendar'],
  'effet-levier': ['L’EFFET DE LEVIER', 'Amplifier son exposition', 'lever'],
  diversification: ['LA DIVERSIFICATION', 'Répartir ses investissements', 'baskets'],
  reequilibrage: ['LE RÉÉQUILIBRAGE', 'Retrouver sa répartition cible', 'balance'],
  'dca-vs-lumpsum': ['DCA OU LUMP SUM', 'Investir progressivement ou en une fois', 'calendar'],
  'vente-a-decouvert': ['LA VENTE À DÉCOUVERT', 'Vendre un titre emprunté', 'down'],
  dividende: ['LE DIVIDENDE', 'Une distribution aux actionnaires', 'coins'],
  'reinvestissement-dividendes': ['RÉINVESTIR LES DIVIDENDES', 'Remettre ses distributions au travail', 'cycle'],
  blockchain: ['LA BLOCKCHAIN', 'Un registre partagé', 'chain'],
  stablecoin: ['LES STABLECOINS', 'Viser une valeur de référence', 'coin'],
  'cold-hot-wallet': ['COLD OU HOT WALLET', 'Conserver ses clés privées', 'key'],
  'rendement-locatif': ['LE RENDEMENT LOCATIF', 'Rapporter les loyers au coût du bien', 'property'],
  'effet-levier-immo': ['LE LEVIER IMMOBILIER', 'Investir avec un crédit', 'property'],
  lmnp: ['LE LMNP', 'Louer un logement meublé', 'property'],
  drawdown: ['LE DRAWDOWN', 'La baisse depuis un sommet', 'down'],
  volatilite: ['LA VOLATILITÉ', 'L’ampleur des variations', 'waves'],
  'ratio-sharpe': ['LE RATIO DE SHARPE', 'Rapporter le rendement à la volatilité', 'balance'],
  ter: ['LE TER', 'Les frais annuels du fonds', 'document'],
  'capitalisation-boursiere': ['LA CAPITALISATION BOURSIÈRE', 'La valeur des actions en circulation', 'company'],
  'indice-boursier': ['UN INDICE BOURSIER', 'Suivre un ensemble de titres', 'basket'],
  'rendement-vs-performance': ['RENDEMENT ET PERFORMANCE', 'Les revenus et l’évolution du capital', 'balance'],
  inflation: ['L’INFLATION', 'La hausse générale des prix', 'coins'],
  'taux-interet': ['LE TAUX D’INTÉRÊT', 'Le prix de l’argent prêté', 'coin'],
  'taux-sans-risque': ['LE TAUX SANS RISQUE', 'Une référence pour comparer', 'shield'],
  'flat-tax': ['LA FLAT TAX', 'Le prélèvement forfaitaire unique', 'document'],
  'abattement-pea': ['LE PEA APRÈS CINQ ANS', 'L’exonération d’impôt sur les gains', 'envelope'],
  'prelevements-sociaux': ['LES PRÉLÈVEMENTS SOCIAUX', 'Comprendre les prélèvements sur les gains', 'document'],
  'plus-value-imposable': ['LA PLUS-VALUE IMPOSABLE', 'Le gain soumis à l’impôt', 'document'],
  'plus-value-immobiliere': ['LA PLUS-VALUE IMMOBILIÈRE', 'Le gain lors d’une vente immobilière', 'property'],
  halving: ['LE HALVING', 'La récompense de bloc divisée par deux', 'halving'],
})
const W = 1536, H = 1024, NAVY = '#0b2033', CREAM = '#fff0d0', GOLD = '#dfb250'
const ids = new Set(TERMES.map(t => t.id))
export function getLexiqueVisual(item) {
  const id = typeof item === 'string' ? item : item?.termeId
  if (!ids.has(id) || !LEXIQUE_VISUALS[id]) throw new Error('Notion sans illustration')
  const [title, subtitle, scene] = LEXIQUE_VISUALS[id]
  return { id, title, subtitle, scene }
}
function shape(c, x, y, w, h, color = CREAM, radius = 12) {
  c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, radius); c.fill()
}
function line(c, points, color = GOLD, width = 12) {
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'
  c.beginPath(); points.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.stroke()
}
function circle(c,x,y,r,color=GOLD) { c.fillStyle=color; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill() }
function coins(c,x,y,count=3,scale=1) {
  c.save(); c.translate(x,y); c.scale(scale,scale)
  for(let i=0;i<count;i++) {
    const yy=-i*25
    shape(c,-72,yy-16,144,24,'#b58731',2)
    c.fillStyle=GOLD; c.beginPath(); c.ellipse(0,yy-16,72,19,0,0,Math.PI*2);c.fill()
    c.strokeStyle='#ffe29a';c.lineWidth=2;c.stroke()
  }
  c.restore()
}
function basket(c,x,y,variant=0) {
  c.save(); c.translate(x,y)
  line(c,[[-88,-45],[-58,-112],[58,-112],[88,-45]],GOLD,13)
  c.fillStyle=CREAM;c.beginPath();c.moveTo(-140,-36);c.lineTo(140,-36);c.lineTo(110,132);c.lineTo(-110,132);c.closePath();c.fill()
  for(let i=-1;i<=1;i++)line(c,[[i*62,-8],[i*52,100]],NAVY,8)
  if(variant===1) { circle(c,0,-57,34); } else if(variant===2) {shape(c,-37,-88,74,60,GOLD)} else {coins(c,0,-38,2,.6)}
  c.restore()
}
function house(c,x,y,scale=1) {
  c.save();c.translate(x,y);c.scale(scale,scale)
  shape(c,-115,-35,230,205)
  c.fillStyle=GOLD;c.beginPath();c.moveTo(-150,-35);c.lineTo(0,-165);c.lineTo(150,-35);c.closePath();c.fill()
  shape(c,-30,65,60,105,NAVY,2);shape(c,-85,8,40,40,NAVY,2);shape(c,45,8,40,40,NAVY,2);c.restore()
}
function calendar(c,x,y) {
  shape(c,x-125,y-100,250,240);shape(c,x-125,y-100,250,52,'#263b4c')
  line(c,[[x-70,y-125],[x-70,y-75]],GOLD,16);line(c,[[x+70,y-125],[x+70,y-75]],GOLD,16)
  circle(c,x,y+18,28);coins(c,x+115,y+145,3,.85)
}
function illustration(c,scene) {
  // La pile haute du levier doit rester sous le sous-titre.
  c.save();c.translate(W/2,scene === 'lever' ? 685 : 620)
  c.shadowColor='rgba(0,0,0,.22)';c.shadowBlur=24;c.shadowOffsetY=20
  switch(scene) {
    case 'calendar': [-450,0,450].forEach(x=>calendar(c,x,0));break
    case 'baskets': [-450,0,450].forEach((x,i)=>basket(c,x,0,i));break
    case 'basket': basket(c,0,0);[-340,340].forEach(x=>coins(c,x,110,3));break
    case 'property': house(c,-360,0,.9);house(c,0,0,1.2);house(c,360,0,.9);break
    case 'company':
      [-300,0,300].forEach((x,i)=>{const h=[210,310,250][i];shape(c,x-100,150-h,200,h);for(let row=0;row<3;row++)for(let col=0;col<2;col++)shape(c,x-60+col*75,185-h+row*65,38,38,NAVY,2)});break
    case 'envelope':
      shape(c,-310,-155,620,310);line(c,[[-300,-140],[0,30],[300,-140]],GOLD,12);coins(c,280,175,4);break
    case 'document':
      shape(c,-170,-190,340,400);for(let i=0;i<4;i++)line(c,[[-100,-100+i*65],[90,-100+i*65]],i===0?GOLD:NAVY,12);coins(c,245,170,3);break
    case 'reserve':
      shape(c,-220,-130,440,300);circle(c,0,20,74,GOLD);circle(c,0,20,50,NAVY);line(c,[[0,-10],[0,50]],GOLD,10);coins(c,280,165,3);break
    case 'shield':
      c.fillStyle=CREAM;c.beginPath();c.moveTo(-190,-150);c.lineTo(0,-210);c.lineTo(190,-150);c.lineTo(160,70);c.quadraticCurveTo(120,170,0,220);c.quadraticCurveTo(-120,170,-160,70);c.closePath();c.fill();line(c,[[-85,0],[-15,70],[105,-75]],GOLD,24);break
    case 'key':
      circle(c,-155,-25,100,CREAM);circle(c,-155,-25,46,NAVY);line(c,[[-60,-25],[280,-25],[280,55]],GOLD,35);line(c,[[195,-25],[195,55]],GOLD,35);break
    case 'chain':
      [-330,0,330].forEach(x=>{shape(c,x-100,-100,200,200);shape(c,x-62,-62,124,124,NAVY)});line(c,[[-220,0],[-110,0]],GOLD,20);line(c,[[110,0],[220,0]],GOLD,20);break
    case 'balance':
      line(c,[[0,-180],[0,170]],CREAM,18);line(c,[[-260,-110],[260,-110]],GOLD,18);
      [-260,260].forEach(x=>{line(c,[[x,-110],[x-100,90]],CREAM,7);line(c,[[x,-110],[x+100,90]],CREAM,7);shape(c,x-125,90,250,40,GOLD)});shape(c,-120,170,240,25,GOLD);break
    case 'lever':
      c.fillStyle=CREAM;c.beginPath();c.moveTo(-75,160);c.lineTo(0,20);c.lineTo(75,160);c.closePath();c.fill();line(c,[[-330,80],[330,-100]],GOLD,22);coins(c,-285,42,2);coins(c,285,-135,5);break
    case 'down':line(c,[[-450,-95],[-300,-145],[-120,-65],[80,115],[280,130],[440,190]],GOLD,24);circle(c,-300,-145,18,CREAM);circle(c,440,190,18,CREAM);break
    case 'waves':line(c,[[-450,50],[-340,-100],[-230,110],[-120,-170],[0,155],[125,-70],[240,95],[350,-120],[450,5]],GOLD,22);break
    case 'cycle':
      coins(c,0,95,4,1.2);c.strokeStyle=CREAM;c.lineWidth=18;c.beginPath();c.arc(0,0,215,-.3,4.4);c.stroke();line(c,[[175,-115],[205,-58],[252,-95]],CREAM,18);break
    case 'halving':circle(c,-190,0,155);circle(c,210,0,105,CREAM);line(c,[[15,-30],[55,0],[15,30]],GOLD,14);break
    case 'coins':[-360,0,360].forEach(x=>coins(c,x,100,3,1.2));break
    case 'coin':circle(c,0,0,160);circle(c,0,0,123,NAVY);circle(c,0,0,88,CREAM);break
    default:throw new Error('Illustration inconnue')
  }
  c.restore()
}
function fitted(c,text,y,size,width,color=CREAM,family='Arial, sans-serif',weight=700) {
  c.textAlign='center';c.textBaseline='middle';c.fillStyle=color
  while(size>24){c.font=`${weight} ${size}px ${family}`;if(c.measureText(text).width<=width)break;size-=2}
  c.fillText(text,W/2,y)
}
export async function renderFicheLexiqueImage(item) {
  const visual=getLexiqueVisual(item),canvas=document.createElement('canvas');canvas.width=W;canvas.height=H
  const c=canvas.getContext('2d')
  if(visual.id==='dca') {
    const image=await loadArtImage('lexique/dca-approved.webp');c.drawImage(image,0,0,W,H);return canvas
  }
  c.fillStyle=NAVY;c.fillRect(0,0,W,H)
  // Grain discret et déterministe, sans données ni chargement supplémentaire.
  let seed=19
  for(let i=0;i<18000;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%W;seed=(Math.imul(seed,1664525)+1013904223)>>>0;c.fillStyle=i%2?'rgba(255,240,208,.025)':'rgba(0,0,0,.05)';c.fillRect(x,seed%H,1,1)}
  fitted(c,visual.title,210,132,1380)
  fitted(c,visual.subtitle,355,49,1380,CREAM,'Arial, sans-serif',400)
  illustration(c,visual.scene)
  fitted(c,'Pas un conseil financier',965,25,1000,CREAM,'Arial, sans-serif',400)
  c.textAlign='right';c.font='27px Georgia, serif';c.fillText('Épargnant Libre',1490,967)
  return canvas
}
export async function downloadFicheLexiqueImage(item) {
  const visual=getLexiqueVisual(item), canvas=await renderFicheLexiqueImage(item)
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'))
  if(!blob)throw new Error('Export PNG impossible')
  downloadPublicationBlob(blob, `lexique-${visual.id}.png`)
}
