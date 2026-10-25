const norm=s=>String(s??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase()
export const housingTopic=text=>/immobili|logements?|loyers?|habitat|foncier|transactions|metre carre|prix.*m²/.test(norm(text))
// Conservative conventions, from explicit language, not the provider's brand alone.
export function housingConventions(text,sourceId=''){
 const t=norm(text)
 const loanDuration=/(?:sur|duree de|prets? de|credits? de) (\d{1,2}) ans\b/.test(t)
 const monthly=/(?:publication|donnees|statistiques|bulletin|serie|resultats|observations|indice|enquete)[^.]{0,35}mensuel|monthly (?:data|statistics|publication)/.test(t)
 const quarterly=/(?:publication|donnees|statistiques|bulletin|serie|resultats|observations|indice|enquete)[^.]{0,35}trimestr|quarterly (?:data|statistics|publication)/.test(t)
 const durations=[...new Set([...t.matchAll(/\b(\d{1,2}) ans\b/g)].map(m=>m[1]+' ans'))]
 return { duration:loanDuration&&durations.length===1?durations[0]:null, frequency:monthly&&quarterly?null:monthly?'monthly':quarterly?'quarterly':null, population:/menages residents/.test(t)?'ménages résidents':/emprunteurs/.test(t)?'emprunteurs décrits dans la source':null, method:/notaires.insee/.test(t)?'Notaires-INSEE':null, priceBasis:/prix d.annonce|asking price/.test(t)&&/prix de transaction|notaires.insee/.test(t)?null:/prix d.annonce|asking price/.test(t)?'annonce':/notaires.insee|prix des logements anciens|prix de transaction|ventes de logements|actes de vente/.test(t)?'transaction':null,
 measure:/indice.*prix|notaires.insee/.test(t)?'indice à qualité constante':/prix median|prix medians/.test(t)?'prix médian (composition des ventes variable)':/m²|m2|metre carre/.test(t)?'prix ou loyer par m², définition dans la source':null,
 propertyType:/appartements/.test(t)&&/maisons/.test(t)?'maisons et appartements, catégories distinctes':/appartements/.test(t)?'appartements':/maisons/.test(t)?'maisons':null,
 market:/logements anciens|immobilier ancien/.test(t)&&/logements neufs|immobilier neuf/.test(t)?null:/logements anciens|immobilier ancien/.test(t)?'ancien':/logements neufs|immobilier neuf/.test(t)?'neuf':null,
 geography:sourceId==='notaires-paris'?'Île-de-France':/france hors|france metropolitaine/.test(t)?'France, périmètre exact dans l’extrait':/en france|france entiere/.test(t)?'France':null,
 rateType:/taeg/.test(t)&&/taux nominal|hors assurance/.test(t)?null:/taeg|taux annuel effectif global/.test(t)?'TAEG':/taux nominal|taux.*hors frais|hors frais et assurance|hors assurance/.test(t)?'taux nominal':null,
 rateScope:/nouveaux credits|nouveaux prets|production de credits/.test(t)?'nouveaux crédits':/encours de credit/.test(t)?'encours':null,
 insurance:/hors assurance|hors frais et assurance/.test(t)?'assurance exclue':/assurance incluse/.test(t)?'assurance incluse':null,
 provisional:/provisoire/.test(t)?true:null, revision:/revise|revision|corrige/.test(t), sourceId }
}
export function compatibleHousing(a,b){
 const keys=a?.rateType||b?.rateType?['rateType','rateScope','insurance','duration','population','method','frequency']:['priceBasis','measure','propertyType','market','geography','method','frequency']
 return keys.every(key=>a?.[key]!=null&&b?.[key]!=null&&a[key]===b[key])
}
export const DVF_MIN_SALES=30 // quarterly descriptive median only; no monthly local inference
export function qualifyDvfSales(rows,{period,geography}={}){
 const ids=new Map()
 for(const row of rows??[]){
  if(row.nature!=='Vente'||!['Maison','Appartement'].includes(row.type)||row.units!==1||row.mixedUse===true||row.period!==period||row.geography!==geography||!Number.isFinite(row.value)||row.value<=0||!Number.isFinite(row.surface)||row.surface<9||row.surface>500||row.value/row.surface<100||row.value/row.surface>30000)continue
  if(!ids.has(row.id))ids.set(row.id,row)
 }
 const sales=[...ids.values()]
 return {usable:sales.length>=DVF_MIN_SALES,sampleSize:sales.length,minimum:DVF_MIN_SALES,reason:sales.length>=DVF_MIN_SALES?'Médiane descriptive, sensible à la composition des ventes ; aucune évolution à qualité constante.':'Échantillon local insuffisant : au moins 30 ventes comparables par trimestre ; aucune estimation mensuelle.',period,geography}
}
export function mortgageScenario({monthly,ratePct,years,insurancePct=0,deposit=0,fees=0}){
 if(![monthly,ratePct,years,insurancePct,deposit,fees].every(Number.isFinite)||monthly<=0||ratePct<0||years<=0||years>40||insurancePct<0||deposit<0||fees<0)throw Error('Hypothèses de financement invalides')
 const r=ratePct/1200,n=years*12,annuity=r?r/(1-(1+r)**-n):1/n,principal=monthly/(annuity+insurancePct/1200)
 return {principal,purchaseBudget:principal+deposit-fees,assumptions:{monthly,ratePct,years,insurancePct,deposit,fees,insuranceBasis:'capital initial',feesIncludedInBudget:true},note:'Scénario théorique à taux nominal fixe, assurance sur capital initial. Ce n’est pas une offre ni une capacité accordée par une banque.'}
}
