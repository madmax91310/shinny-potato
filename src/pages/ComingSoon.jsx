import PageHeader from '../design-system/PageHeader'
import Card from '../design-system/Card'

// Écran d'attente affiché tant qu'un outil n'est pas encore migré vers l'app unifiée.
export default function ComingSoon({ title, description }) {
  return (
    <div>
      <PageHeader title={title} subtitle={description} />
      <Card className="flex flex-col items-center gap-2 p-10 text-center">
        <span className="text-3xl" aria-hidden="true">
          🚧
        </span>
        <p className="text-sm text-slate-400">Cet outil est en cours de migration, il arrive bientôt ici.</p>
      </Card>
    </div>
  )
}
