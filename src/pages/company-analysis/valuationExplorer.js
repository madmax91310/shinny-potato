import { priceTarget } from './priceTargets.js'

const finite = Number.isFinite
function validate(a, price) {
  priceTarget(a, price)
}
// Constant annual rate solving terminal resale value, excluding distributions.
export function requiredTargetGrowth(a, price, annualReturn=0) {
  validate(a,price)
  if(!finite(annualReturn)||annualReturn<=-1||annualReturn>1)throw new RangeError('Rendement annuel invalide.')
  return (price*(1+annualReturn)**a.years/(a.base*a.multiple))**(1/a.years)-1
}
// Equity cash-flow proxy: annual FCF paid out, plus terminal resale value.
// No second dividend, buyback, cash addition or debt subtraction.
export function discountedCash(a, rate) {
  validate(a,1)
  if(!finite(rate)||rate<=0||rate>1)throw new RangeError('Rendement exigé entre 0 et 100 %.')
  const flows=a.path??Array.from({length:a.years},(_,i)=>a.base*(1+a.growth)**(i+1))
  if(flows.length!==a.years||flows.some(v=>!finite(v)||v<=0))throw new RangeError('Flux invalides.')
  const cash=flows.reduce((sum,value,i)=>sum+value/(1+rate)**(i+1),0)
  const terminal=flows.at(-1)*a.multiple/(1+rate)**a.years
  return {value:cash+terminal,terminalShare:terminal/(cash+terminal)}
}
export function reverseCashGrowth(a, price, rate) {
  validate(a,price)
  let lo=-.5,hi=.5
  const value=g=>discountedCash({...a,path:null,growth:g},rate).value
  if(value(lo)>price||value(hi)<price)return null
  for(let i=0;i<80;i++){
    const mid=(lo+hi)/2
    if(value(mid)<price)lo=mid;else hi=mid
  }
  return (lo+hi)/2
}
export function sensitivityGrid(a,price) {
  validate(a,price)
  // The middle cell reproduces the original terminal value, including a
  // variable annual path. Only the endpoints matter for terminal multiples.
  const growth=a.path?(a.path.at(-1)/a.base)**(1/a.years)-1:a.growth
  const rates=[Math.max(-.5,growth-.02),growth,Math.min(.5,growth+.02)]
  if(rates.some(r=>r<-.5||r>.5))return null
  const multiples=[Math.max(.01,a.multiple*.8),a.multiple,Math.min(500,a.multiple*1.2)]
  return {rates,multiples,rows:rates.map(g=>multiples.map(m=>priceTarget({...a,path:null,growth:g,multiple:m},price)))}
}
