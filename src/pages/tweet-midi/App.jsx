import { useState } from "react";
import { FORMATS, FORMAT_LABELS, SUBJECT_ALEATOIRE, pickForSelection, pickNext, getSubjectsForFormat, buildTweetText } from "./lib.js";
import { getLengthStatus } from "../etf-tweets/lib/tweetFormat.js";
import PageHeader from "../../design-system/PageHeader";
import Button from "../../design-system/Button";
import Card from "../../design-system/Card";

const FORMAT_BADGE_STYLES = {
  [FORMATS.VRAI_FAUX]: "border-teal-500/30 bg-teal-500/10 text-teal-300",
  [FORMATS.DILEMME]: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  [FORMATS.FICHE_LEXIQUE]: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  [FORMATS.COMPARATIF_ETF]: "border-sky-500/30 bg-sky-500/10 text-sky-300",
};

const LENGTH_STATUS_STYLES = {
  ok: "border-teal-500/30 bg-teal-500/10 text-teal-300",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  danger: "border-red-500/30 bg-red-500/10 text-red-300",
};

const SELECTOR_OPTIONS = [FORMATS.VRAI_FAUX, FORMATS.DILEMME, FORMATS.FICHE_LEXIQUE, FORMATS.COMPARATIF_ETF, FORMATS.ALEATOIRE];

export default function App() {
  const [format, setFormat] = useState(FORMATS.ALEATOIRE);
  const [subject, setSubject] = useState(SUBJECT_ALEATOIRE);
  const [current, setCurrent] = useState(() => pickNext(FORMATS.ALEATOIRE, []));
  const [history, setHistory] = useState(() => [current.id]);
  const [copied, setCopied] = useState(false);

  function handleSelectFormat(nextFormat) {
    setFormat(nextFormat);
    // Le sujet précédent peut ne pas exister dans le nouveau format : on revient à "Aléatoire"
    // plutôt que de garder une sélection invalide sans que l'utilisateur s'en rende compte.
    setSubject(SUBJECT_ALEATOIRE);
  }

  function handleGenerate() {
    const { item, addToHistory } = pickForSelection(format, subject, history);
    if (addToHistory) setHistory((h) => [...h, item.id]);
    setCurrent(item);
    setCopied(false);
  }

  const text = buildTweetText(current);
  const status = getLengthStatus(text.length);
  const isLongFormat = current.format === FORMATS.FICHE_LEXIQUE || current.format === FORMATS.COMPARATIF_ETF;
  // Les fiches lexique et comparatifs ETF dépassent 280 caractères par nature : le palier
  // "warn" de getLengthStatus dit déjà "nécessite une note longue ou un thread" plutôt que
  // l'alerte rouge "danger" — on ne déclenche jamais le rouge pour un dépassement normal de ces
  // deux formats, seulement s'ils dépassaient vraiment le seuil "danger" (25000 caractères).
  const displayStatus =
    isLongFormat && status.level === "danger"
      ? status
      : isLongFormat && status.level !== "ok"
        ? { level: "warn", label: `${text.length} caractères — format long par nature (fiche/comparatif), pas un tweet simple` }
        : status;

  const subjectGroups = getSubjectsForFormat(format);
  const showSubjectSelector = format !== FORMATS.ALEATOIRE;

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
        subtitle="Vrai ou Faux, Dilemmes, Fiches lexique et Comparatifs ETF, prêts à publier pour le créneau midi — sans dépendre de l'actualité du jour."
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 lg:max-w-md">
          <Card className="flex flex-col gap-4 p-5">
            <div>
              <label className="mb-2 block text-xs font-semibold tracking-widest text-slate-500 uppercase">
                Étape 1 — Format
              </label>
              <div className="flex flex-wrap gap-2">
                {SELECTOR_OPTIONS.map((opt) => (
                  <Button
                    key={opt}
                    type="button"
                    variant={format === opt ? "primary" : "secondary"}
                    onClick={() => handleSelectFormat(opt)}
                    aria-pressed={format === opt}
                  >
                    {FORMAT_LABELS[opt]}
                  </Button>
                ))}
              </div>
            </div>

            {showSubjectSelector && (
              <div className="border-l-2 border-teal-500/30 pl-3">
                <label className="mb-2 block text-xs font-semibold tracking-widest text-slate-500 uppercase" htmlFor="subject-select">
                  Étape 2 — Sujet
                </label>
                <select
                  id="subject-select"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  <option value={SUBJECT_ALEATOIRE}>🔀 Aléatoire</option>
                  {subjectGroups.map((group) =>
                    group.categorie ? (
                      <optgroup key={group.categorie} label={group.categorie}>
                        {group.items.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.label}
                          </option>
                        ))}
                      </optgroup>
                    ) : (
                      group.items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.label}
                        </option>
                      ))
                    ),
                  )}
                </select>
              </div>
            )}

            <Button type="button" variant="primary" onClick={handleGenerate} className="w-full">
              🔄 Générer
            </Button>

            <p className="text-xs text-slate-500">
              {history.length} tirage{history.length > 1 ? "s" : ""} aléatoire{history.length > 1 ? "s" : ""} cette session — pas de
              répétition tant que la bibliothèque n'a pas quasiment tourné une fois. Un sujet choisi précisément peut, lui, être
              revu autant de fois que tu veux.
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
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${LENGTH_STATUS_STYLES[displayStatus.level]}`}
              >
                {displayStatus.label}
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
