// Historical quoted prices remain untouched. A per-share price comparison
// cannot cross a proven share split until the format models that unit change.
export function anniversaryPriceComparisonIssue(asset, pastMonth, currentDate) {
 let end=currentDate instanceof Date?currentDate.toISOString().slice(0,10):currentDate
 if(/^\d{4}-\d{2}$/.test(end??'')){const [y,m]=end.split('-').map(Number);end=new Date(Date.UTC(y,m,0)).toISOString().slice(0,10)}
 const split=asset?.anniversaryCorporateActions?.find(action=>pastMonth<action.firstPostSplitMonth&&end>=action.exDate)
 if(!split)return null
 return `${asset.label} : division des parts par ${split.ratio} le ${split.exDate.split('-').reverse().join('/')} ; une ancienne part représente ${split.ratio} parts. Les prix cotés de part et d’autre ne sont pas directement comparables. Cette comparaison anniversaire est refusée ; les prix historiques et les rendements qualifiés restent disponibles.`
}
export function requireAnniversaryPriceComparison(asset,pastMonth,currentDate){
 const reason=anniversaryPriceComparisonIssue(asset,pastMonth,currentDate)
 if(reason)throw Error(reason)
}
