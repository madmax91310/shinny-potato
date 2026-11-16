import Images from "./Images.jsx";
import { buildPreviewText } from "./preview-text.js";
export default function PreparationPreview({
  profile: p,
  snapshot: previewSnapshot,
}) {
  return (
    <section aria-label="Aperçu avant vérification">
      <h4>Le contenu de cet épisode</h4>
      <p className="pp-missing-performance">
        {previewSnapshot.acquisition?.performanceSource
          ? "Les rendements eToro sont préremplis, mais restent à confirmer. La devise et les conventions de dividendes/frais doivent être documentées avant l’export."
          : "Cet épisode n’a pas encore ses performances vérifiées. La collecte des positions ne fournit pas ces résultats : ils doivent être sourcés avant l’export."}
      </p>
      <div className="pp-publication-preview">
        <details className="pp-tweet-preview" open>
          <summary>Texte en préparation · non exportable</summary>
          <pre aria-label="Aperçu du texte à compléter">
            {buildPreviewText(p, previewSnapshot, p.draft?.episode || 1)}
          </pre>
        </details>
        <Images
          profile={p}
          snapshot={previewSnapshot}
          episode={p.draft?.episode || 1}
          preview
        />
      </div>
    </section>
  );
}
