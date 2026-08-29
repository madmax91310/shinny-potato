import { useState } from "react";
import {
  FORMATS, FORMAT_LABELS, MODES, SUBJECT_ALEATOIRE, pickForSelection, pickNext, getSubjectsForFormat,
  getSecondaryOptionsForFormat, buildTweetText,
} from "./lib.js";
import { getLengthStatus } from "../etf-tweets/lib/tweetFormat.js";
import PageHeader from "../../design-system/PageHeader";
import Button from "../../design-system/Button";
import Card from "../../design-system/Card";

const FORMAT_BADGE_STYLES = {
  [FORMATS.VRAI_FAUX]: "border-teal-500/30 bg-teal-500/10 text-teal-300",
  [FORMATS.DILEMME]: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  [FORMATS.FICHE_LEXIQUE]: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  [FORMATS.COMPARATIF_ETF]: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  [FORMATS.ANNIVERSAIRE]: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  [FORMATS.PERFORMANCE_DEPUIS]: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

const LENGTH_STATUS_STYLES = {
  ok: "border-teal-500/30 bg-teal-500/10 text-teal-300",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  danger: "border-red-500/30 bg-red-500/10 text-red-300",
};

const SELECTOR_OPTIONS = [
  FORMATS.VRAI_FAUX, FORMATS.DILEMME, FORMATS.FICHE_LEXIQUE, FORMATS.COMPARATIF_ETF,
  FORMATS.ANNIVERSAIRE, FORMATS.PERFORMANCE_DEPUIS, FORMATS.ALEATOIRE,
];

// Libellé de l'étape "années en arrière" / "année de départ" — propre aux deux formats à données
// de marché (Anniversaire, Performance depuis), quel que soit le mode (Simple ou Comparatif).
const SECONDARY_LABELS = {
  [FORMATS.ANNIVERSAIRE]: "Nombre d'années en arrière",
  [FORMATS.PERFORMANCE_DEPUIS]: "Année de départ",
};
function secondaryOptionLabel(format, value) {
  return format === FORMATS.ANNIVERSAIRE ? `${value} an${value > 1 ? "s" : ""}` : String(value);
}
function isValidLevel(raw) {
  const n = Number(raw);
  return raw !== "" && raw !== null && raw !== undefined && Number.isFinite(n) && n > 0;
}

export default function App() {
  const [format, setFormat] = useState(FORMATS.ALEATOIRE);
  const [mode, setMode] = useState(MODES.SIMPLE);
  const [subject, setSubject] = useState(SUBJECT_ALEATOIRE);
  const [subjectB, setSubjectB] = useState(SUBJECT_ALEATOIRE);
  const [secondary, setSecondary] = useState(SUBJECT_ALEATOIRE);
  const [includeBenchmark, setIncludeBenchmark] = useState(false);
  const [current, setCurrent] = useState(() => pickNext(FORMATS.ALEATOIRE, []));
  const [history, setHistory] = useState(() => [current.id]);
  const [copied, setCopied] = useState(false);
  // Niveau(x) actuel(s) — Format "Il y a X ans" uniquement, un champ en mode Simple, deux en mode
  // Comparatif : jamais mémorisés ni ajoutés à l'historique/l'anti-répétition (cf. lib.js), remis
  // à zéro à chaque nouvelle génération, y compris quand ce format est atteint via "Aléatoire
  // (tous formats)" sans que l'utilisateur l'ait choisi explicitement.
  const [niveauActuel, setNiveauActuel] = useState("");
  const [niveauActuelB, setNiveauActuelB] = useState("");

  const isMarketFormat = format === FORMATS.ANNIVERSAIRE || format === FORMATS.PERFORMANCE_DEPUIS;

  function handleSelectFormat(nextFormat) {
    setFormat(nextFormat);
    setMode(MODES.SIMPLE);
    // Le sujet précédent peut ne pas exister dans le nouveau format : on revient à "Aléatoire"
    // plutôt que de garder une sélection invalide sans que l'utilisateur s'en rende compte.
    setSubject(SUBJECT_ALEATOIRE);
    setSubjectB(SUBJECT_ALEATOIRE);
    setSecondary(SUBJECT_ALEATOIRE);
  }

  function handleSelectMode(nextMode) {
    setMode(nextMode);
    // Les années en arrière / l'année de départ valides dépendent du mode (paire vs actif seul) :
    // retour à "Aléatoire" par sécurité plutôt que de garder une combinaison qui n'a plus de sens.
    setSubject(SUBJECT_ALEATOIRE);
    setSubjectB(SUBJECT_ALEATOIRE);
    setSecondary(SUBJECT_ALEATOIRE);
  }

  function handleSelectSubject(setter, value) {
    setter(value);
    setSecondary(SUBJECT_ALEATOIRE);
  }

  // Une fois un sujet précis choisi (étape 2), "Générer" reste volontairement piocher sur CE
  // sujet (cf. commentaire pickForSelection dans lib.js — un sujet choisi précisément est censé
  // pouvoir être revu autant de fois qu'on veut). Signalé par un utilisateur le 29/08/2026 comme
  // paraissant "bloqué" faute d'un moyen visible de revenir à Aléatoire sans rouvrir les menus un
  // par un : ce bouton fait exactement ça, en un clic.
  const hasPreciseSelection =
    subject !== SUBJECT_ALEATOIRE || subjectB !== SUBJECT_ALEATOIRE || secondary !== SUBJECT_ALEATOIRE;
  function handleResetSelection() {
    setSubject(SUBJECT_ALEATOIRE);
    setSubjectB(SUBJECT_ALEATOIRE);
    setSecondary(SUBJECT_ALEATOIRE);
  }

  function handleGenerate() {
    const { item, addToHistory } = pickForSelection({
      format, mode, subjectId: subject, subjectIdB: subjectB, secondaryId: secondary, history,
    });
    if (addToHistory) setHistory((h) => [...h, item.id]);
    setCurrent(item);
    setCopied(false);
    setNiveauActuel("");
    setNiveauActuelB("");
  }

  const isAnniversaire = current.format === FORMATS.ANNIVERSAIRE;
  const isComparatifCurrent = current.mode === MODES.COMPARATIF;
  const niveauActuelValide = isValidLevel(niveauActuel);
  const niveauActuelBValide = isValidLevel(niveauActuelB);
  const copyDisabled =
    (isAnniversaire && !isComparatifCurrent && !niveauActuelValide) ||
    (isAnniversaire && isComparatifCurrent && !(niveauActuelValide && niveauActuelBValide));

  const text = buildTweetText(current, { niveauActuel, niveauActuelB, includeBenchmark });
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
  const showSecondarySelector = isMarketFormat;
  const secondaryOptions = showSecondarySelector
    ? getSecondaryOptionsForFormat(format, mode, subject, mode === MODES.COMPARATIF ? subjectB : undefined)
    : [];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // presse-papier indisponible (permissions navigateur) : on ignore silencieusement
    }
  }

  // `excludeId`, mode Comparatif uniquement (cf. renderSubjectSelect ci-dessous) : l'actif déjà
  // choisi dans l'AUTRE menu déroulant n'apparaît plus du tout comme option ici — impossible de
  // sélectionner deux fois le même actif. Avant ce correctif, choisir le même actif des deux
  // côtés ne provoquait ni erreur ni avertissement : le filtre de pickForSelection ne trouvait
  // aucune paire correspondante et retombait silencieusement sur une paire aléatoire différente,
  // sans que l'utilisateur s'en rende compte (cf. audit du 29/08/2026).
  function renderSubjectSelect(id, value, onChange, excludeId) {
    return (
      <select
        id={id}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value={SUBJECT_ALEATOIRE}>🔀 Aléatoire</option>
        {subjectGroups.map((group) => {
          const items = excludeId ? group.items.filter((it) => it.id !== excludeId) : group.items;
          return group.categorie ? (
            <optgroup key={group.categorie} label={group.categorie}>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.label}
                </option>
              ))}
            </optgroup>
          ) : (
            items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.label}
              </option>
            ))
          );
        })}
      </select>
    );
  }

  return (
    <div>
      <PageHeader
        title="🕐 Tweet Midi"
        subtitle="Vrai ou Faux, Dilemmes, Fiches lexique, Comparatifs ETF, Anniversaires de prix et Performances historiques, prêts à publier pour le créneau midi — sans dépendre de l'actualité du jour."
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 lg:max-w-md">
          <Card className="flex flex-col gap-4 p-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs font-semibold tracking-widest text-slate-500 uppercase">
                  Étape 1 — Format
                </label>
                {showSubjectSelector && hasPreciseSelection && (
                  <button
                    type="button"
                    onClick={handleResetSelection}
                    className="text-xs text-teal-400 underline decoration-dotted underline-offset-2 hover:text-teal-300"
                  >
                    ↺ Réinitialiser (retour à Aléatoire)
                  </button>
                )}
              </div>
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

            {isMarketFormat && (
              <div>
                <label className="mb-2 block text-xs font-semibold tracking-widest text-slate-500 uppercase">Mode</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={mode === MODES.SIMPLE ? "primary" : "secondary"}
                    onClick={() => handleSelectMode(MODES.SIMPLE)}
                    aria-pressed={mode === MODES.SIMPLE}
                  >
                    Simple
                  </Button>
                  <Button
                    type="button"
                    variant={mode === MODES.COMPARATIF ? "primary" : "secondary"}
                    onClick={() => handleSelectMode(MODES.COMPARATIF)}
                    aria-pressed={mode === MODES.COMPARATIF}
                  >
                    Comparatif (2 actifs)
                  </Button>
                </div>
              </div>
            )}

            {showSubjectSelector && mode === MODES.SIMPLE && (
              <div className="border-l-2 border-teal-500/30 pl-3">
                <label className="mb-2 block text-xs font-semibold tracking-widest text-slate-500 uppercase" htmlFor="subject-select">
                  Étape 2 — Sujet
                </label>
                {renderSubjectSelect("subject-select", subject, (v) => handleSelectSubject(setSubject, v))}
              </div>
            )}

            {showSubjectSelector && mode === MODES.COMPARATIF && (
              <div className="flex flex-col gap-3 border-l-2 border-teal-500/30 pl-3">
                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-widest text-slate-500 uppercase" htmlFor="subject-select-a">
                    Étape 2 — Actif 1
                  </label>
                  {renderSubjectSelect(
                    "subject-select-a", subject, (v) => handleSelectSubject(setSubject, v),
                    subjectB !== SUBJECT_ALEATOIRE ? subjectB : undefined,
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-widest text-slate-500 uppercase" htmlFor="subject-select-b">
                    Actif 2
                  </label>
                  {renderSubjectSelect(
                    "subject-select-b", subjectB, (v) => handleSelectSubject(setSubjectB, v),
                    subject !== SUBJECT_ALEATOIRE ? subject : undefined,
                  )}
                </div>
              </div>
            )}

            {showSecondarySelector && (
              <div className="border-l-2 border-teal-500/30 pl-3">
                <label className="mb-2 block text-xs font-semibold tracking-widest text-slate-500 uppercase" htmlFor="secondary-select">
                  Étape 3 — {SECONDARY_LABELS[format]}
                </label>
                <select
                  id="secondary-select"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400"
                  value={secondary}
                  onChange={(e) => setSecondary(e.target.value)}
                >
                  <option value={SUBJECT_ALEATOIRE}>🔀 Aléatoire</option>
                  {secondaryOptions.map((value) => (
                    <option key={value} value={value}>
                      {secondaryOptionLabel(format, value)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {format === FORMATS.PERFORMANCE_DEPUIS && (
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 accent-emerald-500"
                  checked={includeBenchmark}
                  onChange={(e) => setIncludeBenchmark(e.target.checked)}
                />
                Ajouter la comparaison Livret A / inflation sur la même période
              </label>
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
                  {isComparatifCurrent ? " · Comparatif" : ""}
                </span>
              </div>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${LENGTH_STATUS_STYLES[displayStatus.level]}`}
              >
                {displayStatus.label}
              </span>
            </div>

            {isAnniversaire && !isComparatifCurrent && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
                <label className="mb-1.5 block text-xs font-semibold tracking-widest text-rose-300 uppercase" htmlFor="niveau-actuel">
                  Niveau actuel de l'actif (obligatoire)
                </label>
                <input
                  id="niveau-actuel"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="Ex. 64267"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400"
                  value={niveauActuel}
                  onChange={(e) => setNiveauActuel(e.target.value)}
                  title="Vérifie ce chiffre sur une source fiable (Yahoo Finance, CoinMarketCap...) avant de le saisir — jamais deviné automatiquement."
                />
                <p className="mt-1.5 text-[11px] text-rose-300/80">
                  ⓘ Vérifie ce chiffre sur une source fiable (Yahoo Finance, CoinMarketCap...) avant de le saisir — jamais deviné
                  automatiquement, et jamais mémorisé d'une génération à l'autre.
                </p>
              </div>
            )}

            {isAnniversaire && isComparatifCurrent && (
              <div className="flex flex-col gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
                <p className="text-[11px] text-rose-300/80">
                  ⓘ Vérifie ces deux chiffres sur une source fiable (Yahoo Finance, CoinMarketCap...) avant de les saisir — jamais
                  devinés automatiquement, et jamais mémorisés d'une génération à l'autre.
                </p>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-widest text-rose-300 uppercase" htmlFor="niveau-actuel-a">
                    Niveau actuel — actif 1 (obligatoire)
                  </label>
                  <input
                    id="niveau-actuel-a"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400"
                    value={niveauActuel}
                    onChange={(e) => setNiveauActuel(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-widest text-rose-300 uppercase" htmlFor="niveau-actuel-b">
                    Niveau actuel — actif 2 (obligatoire)
                  </label>
                  <input
                    id="niveau-actuel-b"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400"
                    value={niveauActuelB}
                    onChange={(e) => setNiveauActuelB(e.target.value)}
                  />
                </div>
              </div>
            )}

            <pre className="min-h-[14rem] overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-slate-200">
              {text}
            </pre>

            <Button type="button" onClick={handleCopy} disabled={copyDisabled} className="self-start">
              {copied ? "Copié ✓" : copyDisabled ? "Renseigne le(s) niveau(x) actuel(s) pour copier" : "Copier le texte"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
