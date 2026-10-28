export function radarNumber(value,unit='') {return new Intl.NumberFormat('fr-FR',{maximumFractionDigits:unit.includes('%')?2:3}).format(value)}
export function radarValue(value,unit=''){return typeof value==='number'?`${radarNumber(value,unit)}${unit?' '+unit:''}`:typeof value==='boolean'?(value?'Oui':'Non'):String(value)}
