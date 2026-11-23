import {useState} from 'react'
import Button from '../../design-system/Button.jsx'
import Card from '../../design-system/Card.jsx'
import {copyPublicationText} from '../../design-system/publicationActions.js'
import {dateRange, renderPost} from './weekly.js'
import registry from '../../data/etf-flows-weekly.json'

const workflow = 'https://github.com/madmax91310/shinny-potato/actions/workflows/update-etf-flows.yml'
const validatedDate = new Intl.DateTimeFormat('fr-FR', {dateStyle: 'long', timeZone: 'Europe/Paris'})
const number = new Intl.NumberFormat('fr-FR')

function Post({edition}) {
  const [status, setStatus] = useState('')
  const text = renderPost(edition)

  async function copy() {
    try {
      await copyPublicationText(text)
      setStatus('Post copié.')
    } catch {
      setStatus('Copie indisponible. Sélectionne le texte du post pour le copier.')
    }
  }

  return <>
    <Button type="button" onClick={copy}>Copier le post</Button>
    <span className="flows-copy-status" role="status">{status}</span>
    <pre className="flows-weekly-text">{text}</pre>
  </>
}

export default function WeeklyPost() {
  const [latest, ...archive] = registry.editions
  return <section className="etf-flows" aria-labelledby="flows-weekly-heading">
    <Card className="flows-weekly">
      <h2 id="flows-weekly-heading">Récap automatique</h2>
      <div className="flows-weekly-actions">
        <div>
          {latest
            ? <p><strong>Dernière édition validée {dateRange(latest.sessions[0], latest.sessions.at(-1))}</strong><br />
              Contrôlée le {validatedDate.format(new Date(latest.validatedAt))}</p>
            : <p>La première édition est en attente de données vérifiées.</p>}
        </div>
        <Button as="a" variant="secondary" href={workflow} target="_blank" rel="noopener noreferrer">Générer sur GitHub</Button>
      </div>
      {latest && <>
        <p>Périmètre ETFIQ · {number.format(latest.coverage.verifiedFunds)} fonds cotés aux États-Unis
          avec toutes les séances vérifiées sur {number.format(latest.coverage.universe)} suivis.
          Les expositions géographiques et sectorielles portent sur les fonds actions classés par ETFIQ.</p>
        <Post edition={latest} />
      </>}
      {archive.length > 0 && <details>
        <summary>Archives des éditions automatiques</summary>
        {archive.map(edition => <details key={edition.monday}>
          <summary>{dateRange(edition.sessions[0], edition.sessions.at(-1))}</summary>
          <Post edition={edition} />
        </details>)}
      </details>}
    </Card>
  </section>
}
