import { useState } from "react";
import {
  FORMATS, FORMAT_LABELS, MODES, SUBJECT_ALEATOIRE, pickForSelection, pickNext, getSubjectsForFormat,
  getSecondaryOptionsForFormat, buildTweetText, getMarketAsset,
} from "./lib.js";
import { getLengthStatus } from "../etf-tweets/lib/tweetFormat.js";
import { AMOUNT_PRESETS as PA_AMOUNT_PRESETS, YEAR_PRESETS as PA_YEAR_PRESETS, YEAR_MIN as PA_YEAR_MIN, YEAR_MAX as PA_YEAR_MAX, POSTES as PA_POSTES, POSTE_ORDER as PA_POSTE_ORDER } from "../purchasing-power/data.js";
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
  [FORMATS.POUVOIR_ACHAT]: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
};

// Années de départ sélectionnables pour "Pouvoir d'achat" — même plage que le simulateur d'origine
// (PA_YEAR_MIN/PA_YEAR_MAX), pas de redéfinition d'une nouvelle plage ici.
const PA_YEARS = Array.from({ length: PA_YEAR_MAX - PA_YEAR_MIN + 1 }, (_, i) => PA_YEAR_MIN + i);

const LENGTH_STATUS_STYLES = {
  ok: "border-teal-500/30 bg-teal-500/10 text-teal-300",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  danger: "border-red-500/30 bg-red-500/10 text-red-300",
};

const SELECTOR_OPTIONS = [
  FORMATS.VRAI_FAUX, FORMATS.DILEMME, FORMATS.FICHE_LEXIQUE, FORMATS.COMPARATIF_ETF,
  FORMATS.ANNIVERSAIRE, FORMATS.PERFORMANCE_DEPUIS, FORMATS.POUVOIR_ACHAT, FORMATS.ALEATOIRE,
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
  // Pouvoir d'achat : les 4 paramètres de sélection manuelle, propres à ce format (pas de sujet/
  // secondaire ici, cf. lib.js) — persistent d'une génération à l'autre comme le reste des contrôles
  // de l'app, y compris à travers un changement de format puis un retour à celui-ci.
  const [paAmount, setPaAmount] = useState(1000);
  const [paAmountRaw, setPaAmountRaw] = useState("1000");
  const [paYear, setPaYear] = useState(2015);
  const [paMode, setPaMode] = useState("brut");
  const [paPoste, setPaPoste] = useState("loyer");

  const isMarketFormat = format === FORMATS.ANNIVERSAIRE || format === FORMATS.PERFORMANCE_DEPUIS;
  const isPouvoirAchat = format === FORMATS.POUVOIR_ACHAT;

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
    // Pouvoir d'achat : les 4 champs sont toujours déjà fixés (jamais de sujet/secondaire "Aléatoire"
    // en attente comme les autres formats) — génération directe à partir d'eux, jamais ajoutée à
    // l'historique (cf. lib.js pickForSelection). Le tirage aléatoire de CE format passe par son
    // propre bouton (handlePouvoirAchatRandom), jamais par "Générer".
    if (isPouvoirAchat) {
      const { item } = pickForSelection({
        format, history, pouvoirAchat: { amount: paAmount, startYear: paYear, paMode, posteId: paPoste },
      });
      setCurrent(item);
      setCopied(false);
      return;
    }
    const { item, addToHistory } = pickForSelection({
      format, mode, subjectId: subject, subjectIdB: subjectB, secondaryId: secondary, history,
    });
    if (addToHistory) setHistory((h) => [...h, item.id]);
    setCurrent(item);
    setCopied(false);
    setNiveauActuel("");
    setNiveauActuelB("");
  }

  // Tirage aléatoire propre à Pouvoir d'achat (bouton dédié dans ses contrôles, cf. JSX) : pioche
  // dans POOL_POUVOIR_ACHAT via pickNext, donc dans le même `history` global que tous les autres
  // formats — pas une anti-répétition séparée. Remplit les 4 champs avec la combinaison tirée, pour
  // que l'utilisateur voie exactement ce qui a été choisi (comme dans le simulateur d'origine) et
  // puisse la réutiliser/l'ajuster ensuite via "Générer" sans repiocher.
  function handlePouvoirAchatRandom() {
    const item = pickNext(FORMATS.POUVOIR_ACHAT, history);
    setHistory((h) => [...h, item.id]);
    setPaAmount(item.amount);
    setPaAmountRaw(String(item.amount));
    setPaYear(item.startYear);
    setPaMode(item.mode);
    if (item.mode === "par-poste" && item.posteId) setPaPoste(item.posteId);
    setCurrent(item);
    setCopied(false);
  }

  function handlePaAmountInput(raw) {
    setPaAmountRaw(raw);
    const n = parseFloat(raw.replace(",", "."));
    if (Number.isFinite(n) && n > 0) setPaAmount(n);
  }

  const isAnniversaire = current.format === FORMATS.ANNIVERSAIRE;
  const isComparatifCurrent = current.mode === MODES.COMPARATIF;
  // Les champs de saisie du niveau actuel (Comparatif) doivent nommer le VRAI actif auquel ils
  // correspondent (current.assetIdA/assetIdB), jamais une étiquette générique "actif 1"/"actif 2"
  // qui ne garantit pas de correspondre à l'ordre choisi par l'utilisateur dans les menus
  // déroulants (cf. bug du 29/08/2026 : niveau saisi pour le bon actif affiché sous le mauvais).
  const currentAssetA = isComparatifCurrent ? getMarketAsset(current.assetIdA) : null;
  const currentAssetB = isComparatifCurrent ? getMarketAsset(current.assetIdB) : null;
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
  // Pouvoir d'achat a ses propres contrôles dédiés (montant/année/mode/poste, cf. JSX), jamais le
  // sélecteur générique sujet/secondaire — pas de "sujet" au sens des autres formats.
  const showSubjectSelector = format !== FORMATS.ALEATOIRE && !isPouvoirAchat;
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
        subtitle="Vrai ou Faux, Dilemmes, Fiches lexique, Comparatifs ETF, Anniversaires de prix, Performances historiques et Pouvoir d'achat, prêts à publier pour le créneau midi — sans dépendre de l'actualité du jour."
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

            {isPouvoirAchat && (
              <div className="flex flex-col gap-3 border-l-2 border-indigo-500/30 pl-3">
                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-widest text-slate-500 uppercase">
                    Étape 2 — Montant
                  </label>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {PA_AMOUNT_PRESETS.map((v) => (
                      <Button
                        key={v}
                        type="button"
                        variant={paAmount === v ? "primary" : "secondary"}
                        onClick={() => {
                          setPaAmount(v);
                          setPaAmountRaw(String(v));
                        }}
                      >
                        {v} €
                      </Button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    inputMode="decimal"
                    placeholder="Montant libre"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
                    value={paAmountRaw}
                    onChange={(e) => handlePaAmountInput(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-widest text-slate-500 uppercase">
                    Étape 3 — Année de départ
                  </label>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {PA_YEAR_PRESETS.map((y) => (
                      <Button
                        key={y}
                        type="button"
                        variant={paYear === y ? "primary" : "secondary"}
                        onClick={() => setPaYear(y)}
                      >
                        {y}
                      </Button>
                    ))}
                  </div>
                  <select
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
                    value={paYear}
                    onChange={(e) => setPaYear(parseInt(e.target.value, 10))}
                  >
                    {PA_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] text-slate-500">Comparé à aujourd'hui (2026, dernière donnée disponible).</p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-widest text-slate-500 uppercase">Mode</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={paMode === "brut" ? "primary" : "secondary"}
                      onClick={() => setPaMode("brut")}
                      aria-pressed={paMode === "brut"}
                    >
                      Pouvoir d'achat brut
                    </Button>
                    <Button
                      type="button"
                      variant={paMode === "par-poste" ? "primary" : "secondary"}
                      onClick={() => setPaMode("par-poste")}
                      aria-pressed={paMode === "par-poste"}
                    >
                      Par poste
                    </Button>
                  </div>
                </div>

                {paMode === "par-poste" && (
                  <div>
                    <label className="mb-2 block text-xs font-semibold tracking-widest text-slate-500 uppercase">Poste</label>
                    <div className="flex flex-wrap gap-2">
                      {PA_POSTE_ORDER.map((id) => {
                        const p = PA_POSTES[id];
                        return (
                          <Button
                            key={id}
                            type="button"
                            variant={paPoste === id ? "primary" : "secondary"}
                            onClick={() => setPaPoste(id)}
                          >
                            {p.icon} {p.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Button type="button" variant="secondary" onClick={handlePouvoirAchatRandom} className="w-full">
                  🔀 Aléatoire (cette combinaison)
                </Button>
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
                    Niveau actuel — {currentAssetA?.icon} {currentAssetA?.label} (obligatoire)
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
                    Niveau actuel — {currentAssetB?.icon} {currentAssetB?.label} (obligatoire)
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
