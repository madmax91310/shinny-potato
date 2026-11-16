import {percentage} from './data.js'
import {reportedAmount} from './publication.js'
export default function PositionRows({rows,options=false}) {
  return rows.map((row,i)=><p key={i}>{row.issuerName} · {options?row.putCall:row.ticker} · {row.shareClass || 'classe non transmise'} · {row.cusip || (options?'identifiant non transmis':row.securityId || 'identifiant non transmis')} · {Number.isFinite(row.value)?reportedAmount(row):'montant indisponible'} · {percentage(row.weight)}</p>)
}
