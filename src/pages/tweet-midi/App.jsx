import { useState } from "react";
import { FORMATS, FORMAT_LABELS, pickNext, buildTweetText } from "./lib.js";
import { getLengthStatus } from "../etf-tweets/lib/tweetFormat.js";
import PageHeader from "../../design-system/PageHeader";
import Button from "../../design-system/Button";
import Card from "../../design-system/Card";

const FORMAT_BADGE_STYLES = {
  [FORMATS.VRAI_FAUX]: "border-teal-500/30 bg-teal-500/10 text-teal-300",
  [FORMATS.DILEMME]: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

const LENGTH_STATUS_STYLES = {
  ok: "border-teal-500/30 bg-teal-500/10 text-teal-300",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  danger: "border-red-500/30 bg-red-500/10 text-red-300",
};

const SELECTOR_OPTIONS = [FORMATS.VRAI_FAUX, FORMATS.DILEMME, FORMATS.ALEATOIRE];

export default function App() {
  const [format, setFormat] = useState(FORMATS.ALEATOIRE);
  const [current, setCurrent] = useState(() => pickNext(FORMATS.ALEATOIRE, []));
  const [history, setHistory] = useState(() => [current.id]);
  const [copied, setCopied] = useState(false);

  function handleGenerate() {
    const next = pickNext(format, history);
    setHistory((h) => [...h, next.id]);
    setCurrent(next);
    setCopied(false);
  }

  const text = buildTweetText(current);
  const status = getLengthStatus(text.length);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // presse-papier indisponible (permissions navigateur) : on ignore silencieusement
    }
  }

  return (
    <div>
      <PageHeader
        title="🕐 Tweet Midi"
        subtitle="Vrai ou Faux et Dilemmes financiers, prêts à publier pour le créneau midi — sans dépendre de l'actualité du jour."
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 lg:max-w-md">
          <Card className="flex flex-col gap-4 p-5">
            <div>
              <label className="mb-2 block text-xs font-semibold tracking-widest text-slate-500 uppercase">Format</label>
              <div className="flex flex-wrap gap-2">
                {SELECTOR_OPTIONS.map((opt) => (
                  <Button
                    key={opt}
                    type="button"
                    variant={format === opt ? "primary" : "secondary"}
                    onClick={() => setFormat(opt)}
                    aria-pressed={format === opt}
                  >
                    {FORMAT_LABELS[opt]}
                  </Button>
                ))}
              </div>
            </div>

            <Button type="button" variant="primary" onClick={handleGenerate} className="w-full">
              🔄 Générer
            </Button>

            <p className="text-xs text-slate-500">
              {history.length} tweet{history.length > 1 ? "s" : ""} généré{history.length > 1 ? "s" : ""} cette session — pas de
              répétition tant que la bibliothèque n'a pas quasiment tourné une fois.
            </p>
          </Card>
        </div>

        <div className="flex-1">
          <div className="flex flex-col gap-3 lg:sticky lg:top-4 lg:h-fit">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Aperçu du tweet</h2>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${FORMAT_BADGE_STYLES[current.format]}`}
                >
                  {FORMAT_LABELS[current.format]}
                </span>
              </div>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${LENGTH_STATUS_STYLES[status.level]}`}
              >
                {status.label}
              </span>
            </div>

            <pre className="min-h-[14rem] overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-slate-200">
              {text}
            </pre>

            <Button type="button" onClick={handleCopy} className="self-start">
              {copied ? "Copié ✓" : "Copier le texte"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
