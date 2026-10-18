// Historical command name retained by CI; validates the approved paper exports.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
const port = 4337, base = `http://127.0.0.1:${port}/shinny-potato/`
const server = spawn('node', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })
let browser
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break } catch {} await new Promise(r => setTimeout(r, 200)) }
  browser = await chromium.launch({ headless: true, args:['--disable-gpu','--disable-software-rasterizer'], ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) })
  const page = await browser.newPage(); await page.goto(base)
  await mkdir('test-artifacts/comparison-paper', { recursive: true })
  await page.exposeFunction('savePaper', async ({ id, png }) => writeFile(`test-artifacts/comparison-paper/${id}.png`, Buffer.from(png.split(',')[1], 'base64')))
  const result = await page.evaluate(async () => {
    const { FAMILIES } = await import('/shinny-potato/src/data/index-comparisons.js')
    const { getIndexComparisonPairs } = await import('/shinny-potato/src/data/index-comparison-pairs.js')
    const { renderIndexImage, getIndexPaperCards } = await import('/shinny-potato/src/pages/index-comparator/imageExport.js')
    const { buildTweetText } = await import('/shinny-potato/src/pages/index-comparator/lib.js')
    const { DEFAULT_THEMES } = await import('/shinny-potato/src/data/etf-themes.js')
    const { renderComparatifEtfImage, getComparisonPaperCards } = await import('/shinny-potato/src/pages/tweet-midi/comparatifEtfImage.js')
    const { getInstrumentPeaStatus } = await import('/shinny-potato/src/data/instruments.js')
    const original = CanvasRenderingContext2D.prototype.fillText
    let boxes = [], labels = [], current
    const normalize = value => value.replace(/\s+/g,'')
    CanvasRenderingContext2D.prototype.fillText = function(value, x, y, ...rest) {
      const m = this.measureText(value), b = { value: String(value), l: x - m.actualBoundingBoxLeft, r: x + m.actualBoundingBoxRight, t: y - m.actualBoundingBoxAscent, b: y + m.actualBoundingBoxDescent }
      if (b.l < 0 || b.r > this.canvas.width || b.t < 0 || b.b > this.canvas.height) throw Error(`Clipped ${current}: ${value}`)
      for (const p of boxes) if (Math.min(p.r,b.r)-Math.max(p.l,b.l)>1 && Math.min(p.b,b.b)-Math.max(p.t,b.t)>1) throw Error(`Overlap ${current}: ${p.value} / ${value}`)
      boxes.push(b); labels.push(String(value)); return original.call(this, value, x, y, ...rest)
    }
    const verify = async (id,cards,render,save=false) => {
      boxes=[];labels=[];current=id
      const canvas=await render(),all=normalize(labels.join(' '))
      for(const card of cards){
        for(const text of [card.name,card.subtitle,card.summary,card.metric?.value,card.badge].filter(Boolean)){
          if(!all.includes(normalize(text)))throw Error(`Lost ${id}: ${text}`)
        }
        for(const section of card.sections.filter(s=>s.rows.length)){
          if(!all.includes(normalize(section.title)))throw Error(`Lost section ${id}: ${section.title}`)
          if(section.evidence&&!all.includes(normalize(section.evidence)))throw Error(`Lost evidence ${id}`)
          for(const row of section.rows)for(const text of [row.label,row.value].filter(Boolean))if(!all.includes(normalize(text)))throw Error(`Lost row ${id}: ${text}`)
        }
      }
      if(labels.filter(v=>v==='Épargnant Libre').length!==1)throw Error(`Signature ${id}`)
      if(/Historique annuel non disponible|\bNon disponible\b|\bundefined\b|\bNaN\b|PERFORMANCES ANNUELLES|Sources :|trois façons/i.test(all))throw Error(`Unapproved copy ${id}: ${all}`)
      if(save)await window.savePaper({id,png:canvas.toDataURL()})
      return {id,width:canvas.width,height:canvas.height}
    }
    const sizes=[]
    try {
      const pairs=FAMILIES.flatMap(getIndexComparisonPairs)
      for(const family of pairs){
        const before=JSON.stringify(family),tweet=buildTweetText(family,{})
        sizes.push(await verify(`index-${family.pairId}`,getIndexPaperCards(family),()=>renderIndexImage(family),['monde','europe','crypto'].includes(family.id)&&family.pairPositions[1]===1))
        if(before!==JSON.stringify(family)||tweet!==buildTweetText(family,{}))throw Error('Data or tweet changed')
      }
      for(const theme of DEFAULT_THEMES){
        const cards=getComparisonPaperCards(theme)
        cards.forEach((card,i)=>{const pea=getInstrumentPeaStatus(theme.etfs[i].isin);if(card.badge!==(pea===null?null:pea?'PEA':'CTO'))throw Error(`Incorrect PEA status ${theme.id}`)})
        sizes.push(await verify(`etf-${theme.id}`,cards,()=>renderComparatifEtfImage(theme),['monde','emergents-pea','lifestrategy-20-40-60-80','etc-metaux','spatial'].includes(theme.id)))
      }
      const theme=DEFAULT_THEMES.find(t=>t.id==='monde')
      for(const count of [1,2,4,5,6]){
        const sample={...theme,etfs:Array.from({length:count},(_,i)=>theme.etfs[i%3])}
        const size=await verify(`layout-${count}`,getComparisonPaperCards(sample),()=>renderComparatifEtfImage(sample),true)
        if(size.height/size.width>1.5)throw Error(`Too tall for X: ${count} / ${size.height}`)
        sizes.push(size)
      }
      const absent={...FAMILIES.find(f=>f.id==='monde'),indices:FAMILIES.find(f=>f.id==='monde').indices.map(i=>({...i,indexFacts:{...i.indexFacts,metadata:{sourceStatus:'archive-unverifiable'}}}))}
      const cards=getIndexPaperCards(absent)
      if(cards.some(c=>c.metric||c.sections.some(s=>s.rows.length)))throw Error('Undocumented facts exposed')
      await verify('undocumented',cards,()=>renderIndexImage(absent))
    } finally { CanvasRenderingContext2D.prototype.fillText = original }
    return {count:sizes.length,maxHeight:Math.max(...sizes.map(s=>s.height)),sizes:sizes.filter(s=>s.id.startsWith('layout-'))}
  })
  console.log(JSON.stringify(result))
  // Exercise the real download path as well as the renderer.
  const download = page.waitForEvent('download')
  await page.evaluate(async()=>{
    const {DEFAULT_THEMES}=await import('/shinny-potato/src/data/etf-themes.js')
    const {downloadComparatifEtfImage}=await import('/shinny-potato/src/pages/tweet-midi/comparatifEtfImage.js')
    await downloadComparatifEtfImage(DEFAULT_THEMES.find(t=>t.id==='monde'))
  })
  const png=await download
  if(png.suggestedFilename()!=='comparatif-etf-monde.png'||await png.failure())throw Error('PNG download failed')
  await png.saveAs('test-artifacts/comparison-paper/download.png')
  console.log('Paper exports: all indices and ETF themes, 1–6 columns, provenance, exact values, no clipping/overlap; PNG downloaded.')
} finally { await browser?.close(); server.kill('SIGTERM') }
