import {FACT_LABELS} from './fact-labels.js'

export default function RelatedStages({stages}){return <ul>{stages.map(stage=><li key={stage.id}>{FACT_LABELS[stage.type]} · {stage.publishedAt} · {stage.products.join(', ')} · <a href={`?subject=${stage.id}`}>Sujet de cotation</a> · <a href={stage.sourceUrl} target="_blank" rel="noreferrer">Source de cette étape</a><p>{stage.proof}</p></li>)}</ul>}
