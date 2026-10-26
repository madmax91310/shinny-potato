import {useState} from 'react'
import Button from '../../design-system/Button'
import {notifyPublication,copyPublicationText} from '../../design-system/publicationActions.js'
import {briefDraft} from './brief-draft.js'
export default function DraftEditor({event}) {
 const [draft,setDraft]=useState(()=>briefDraft(event)),[message,setMessage]=useState('')
 async function copy(){try{await copyPublicationText(draft);setMessage('Brouillon copié.')}catch{setMessage('Copie indisponible : sélectionne le texte du brouillon.')}}
 return <><label>Brouillon de publication<textarea aria-label={`Brouillon ${event.id}`} value={draft} onChange={e=>setDraft(e.target.value)} rows={8}/></label><div className="radar-actions"><Button onClick={copy}>Copier le brouillon</Button><Button onClick={()=>{setDraft(briefDraft(event));notifyPublication('Texte d’origine rétabli.')}}>Rétablir le texte</Button></div><p>{message}</p></>
}
