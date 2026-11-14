import { analyzeProfile, profilePositionLimit } from './engine.js'
import { donutData, renderDcaImage, loadDcaFont } from './image.js'
import { exposureRecords } from './records.js'
import { holdingImageRows, renderIndividualDonut } from './image-individual.js'

export const imageFields = field => field==='all'?['complete','allocation','countries','sectors']:field==='both'?['both','countries','sectors']:[field]
const titles={complete:'Vue complète',allocation:'Répartition des actifs',countries:'Exposition géographique',sectors:'Exposition sectorielle',both:'Géographie + secteurs',overlap:'Recouvrement et concentration'}
export async function renderImageSeries(profile,field,maxPositions=profilePositionLimit(profile)){
 await loadDcaFont()
 await Promise.all(profile.lines.map(line=>exposureRecords.load(line.asset)))
 const analysis=analyzeProfile(profile,maxPositions)
 if(analysis.errors.length)throw Error(analysis.errors.join(' '))
 const pages=[]
 for(const id of imageFields(field)){
  if(['complete','both','overlap'].includes(id)){
   pages.push({id,label:titles[id],canvas:await renderDcaImage(profile,id==='complete'?'all':id,maxPositions)})
  }else{
   const allocation=id==='allocation',data=allocation?null:donutData(analysis,id,profile.exposureLimit)
   const rows=allocation?holdingImageRows(profile.lines):data.rows
   pages.push({id,label:titles[id],canvas:renderIndividualDonut(titles[id],rows,{allocation,scope:data?.scope||''})})
  }
 }
 if(profile.showCompanies&&field!=='overlap'){
  const source=await renderDcaImage(profile,'both',maxPositions)
  const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=300
  canvas.getContext('2d').drawImage(source,0,source.height-300,1600,300,0,0,1600,300)
  pages.push({id:'companies',label:'Principales entreprises',canvas})
 }
 return pages
}
