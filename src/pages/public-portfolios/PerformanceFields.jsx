import { Field, Check } from "./fields.jsx";
export default function PerformanceFields({ snapshot, onChange, metric: k }) {
  return (
    <fieldset key={k}>
      <legend>
        {k === "month"
          ? "Dernier mois civil terminé"
          : k === "ytd"
            ? "Depuis janvier"
            : "Un an (facultatif)"}
      </legend>
      <div className="pp-grid">
        {[
          ["value", "Rendement (%)", "number"],
          ["start", "Du", "date"],
          ["end", "Au", "date"],
          ["original", "Libellé original"],
          ["na", "Motif explicite de non-applicabilité"],
        ].map(([f, l, t]) => (
          <Field
            key={f}
            label={l}
            type={t}
            value={snapshot[k][f]}
            onChange={(v) =>
              onChange({
                ...snapshot,
                [k]: { ...snapshot[k], [f]: v, verified: false },
              })
            }
          />
        ))}
        <Field
          label="Type de performance"
          value={snapshot[k].kind}
          options={["Cumulée", "Annualisée", "Période glissante", "Ambiguë"]}
          onChange={(v) =>
            onChange({
              ...snapshot,
              [k]: { ...snapshot[k], kind: v, verified: false },
            })
          }
        />
      </div>
      <Check
        label="Période, rendement ou motif vérifiés sur la source"
        value={snapshot[k].verified}
        onChange={(v) =>
          onChange({ ...snapshot, [k]: { ...snapshot[k], verified: v } })
        }
      />
    </fieldset>
  );
}
