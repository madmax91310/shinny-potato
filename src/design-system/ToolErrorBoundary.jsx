import { Component } from 'react'

// Keep navigation usable after a render failure or a rejected lazy import.
// Reload only on an explicit click: React.lazy caches rejected imports.
export default class ToolErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() { return { failed: true } }

  render() {
    if (!this.state.failed) return this.props.children
    return <section className="workspace-error" role="alert">
      <h1>L’outil n’a pas pu s’afficher</h1>
      <p>Réessaie de charger la page, ou retourne à l’accueil pour ouvrir un autre outil.</p>
      <p>Avant de recharger, conserve tout texte non enregistré encore visible.</p>
      <div>
        <button type="button" onClick={() => window.location.reload()}>Réessayer</button>
        <a href={import.meta.env.BASE_URL}>Retour à l’accueil</a>
      </div>
    </section>
  }
}
