import { hasText, pct, weightPct, canonicalUrl } from "./lib.js";
export default function SnapshotEvidence({ s }) {
  return (
    <details>
      <summary>Vérifier le relevé sélectionné</summary>
      <p>
        Consulté le {s.consulted} · Données effectives :{" "}
        {s.effective || "date non précisée"} · {s.currency}
      </p>
      <p>
        Méthode : {s.method} · Dividendes : {s.dividends} · Frais : {s.fees}
      </p>
      {s.methodNote && <p>Précisions de méthode : {s.methodNote}</p>}
      {s.acquisition && (
        <p>
          Collecté le{" "}
          {new Date(s.acquisition.collectedAt).toLocaleString("fr-FR")} · À
          confirmer. {s.acquisition.note}
        </p>
      )}
      {s.total !== "" && s.total != null && (
        <p>
          Montant public : {s.total} {s.currency}
        </p>
      )}
      {["month", "ytd", "year"].map((k) => (
        <div key={k}>
          <h4>
            {k === "month"
              ? "Mois civil"
              : k === "ytd"
                ? "Depuis janvier"
                : "Un an (facultatif)"}
          </h4>
          <p>
            {s[k].start || "Début inconnu"} → {s[k].end || "Fin inconnue"} :{" "}
            {hasText(s[k].na) ? `Non applicable : ${s[k].na}` : pct(s[k].value)}
          </p>
          <p>
            Libellé source : {s[k].original || "non renseigné"} · {s[k].kind} ·{" "}
            {s[k].verified ? "Contrôlé manuellement" : "À vérifier"}
          </p>
        </div>
      ))}
      <h4>Allocation déclarée</h4>
      {s.positions.map((r, i) => (
        <p key={i}>
          {r.name} {r.identifier ? `(${r.identifier})` : ""} :{" "}
          {weightPct(r.weight)}
        </p>
      ))}
      {canonicalUrl(s.source) && (
        <a href={s.source} target="_blank" rel="noreferrer">
          Source justificative du relevé
        </a>
      )}
    </details>
  );
}
