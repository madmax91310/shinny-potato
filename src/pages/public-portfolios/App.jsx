import ChoicePicker from "../../design-system/ChoicePicker.jsx";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import PageHeader from "../../design-system/PageHeader";
import { copyPublicationText } from "../../design-system/publicationActions.js";
import { PLATFORMS, STATUSES, NATURES } from "./data.js";
import {
  blankProfile,
  blankSnapshot,
  canonicalUrl,
  nameOf,
  hasText,
  weightPct,
  validEpisode,
  latestPublicationDate,
  latestVerificationDate,
  issues,
  performanceIssues,
  pct,
  benchmarkIssue,
  buildText,
  publication,
  today,
} from "./lib.js";
import { load, save } from "./storage.js";
import { buildPreviewText, performanceCompletion } from "./preview.js";
import {
  catalogue,
  seedCatalogue,
  mergeFeed,
  fetchLatestFeed,
  COLLECTOR_URL,
} from "./refresh.js";
import "./style.css";
function loadLibrary() {
  const db = load();
  const next = seedCatalogue(db);
  if (next !== db && !save(next))
    return {
      ...db,
      error:
        "Impossible d’enregistrer les profils recherchés. Les fiches existantes sont préservées.",
    };
  return next;
}
function Field({ label, value, onChange, type = "text", options }) {
  return (
    <label>
      {label}
      {options ? (
        <ChoicePicker
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((v) => (
            <option key={v} value={v}>
              {v === "checked"
                ? "Dernière vérification"
                : v === "publication"
                  ? "Dernière publication"
                  : v || "Tous"}
            </option>
          ))}
        </ChoicePicker>
      ) : (
        <input
          step={type === "number" ? "any" : undefined}
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
function Check({ label, value, onChange }) {
  return (
    <label className="pp-check">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
function PerformanceFields({ snapshot, onChange, metric: k }) {
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
const DeferredImages = lazy(() => import("./Images.jsx"));
function Images(props) {
  return (
    <Suspense fallback={<p>Chargement des images…</p>}>
      <DeferredImages {...props} />
    </Suspense>
  );
}
function SnapshotEvidence({ s }) {
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
function AcquisitionInfo({ profile }) {
  const a = profile.acquisition;
  return (
    <div className="pp-acquisition">
      <p>
        {a
          ? "Allocation : récupération partielle à confirmer"
          : "Acquisition : saisie manuelle"}
      </p>
      {a && (
        <>
          <p>
            Dernier succès de lecture :{" "}
            {a.lastSuccessAt
              ? new Date(a.lastSuccessAt).toLocaleString("fr-FR")
              : "aucun"}
            . Cette date ne vérifie pas les performances.
          </p>
          {a.error && (
            <p role="alert">
              Échec le {new Date(a.attemptedAt).toLocaleString("fr-FR")} :{" "}
              {a.error}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function App() {
  const editorRef = useRef(null);
  const preparationRef = useRef(null);
  const performanceRef = useRef(null);
  const requestRef = useRef(null);
  useEffect(
    () => () => {
      const pending = requestRef.current;
      requestRef.current = null;
      pending?.abort();
    },
    [],
  );
  const [db, setDb] = useState(loadLibrary),
    [refreshing, setRefreshing] = useState(false),
    [p, setP] = useState(null),
    [s, setS] = useState(null),
    [selected, setSelected] = useState(""),
    [message, setMessage] = useState(""),
    [query, setQuery] = useState(""),
    [platform, setPlatform] = useState(""),
    [strategy, setStrategy] = useState(""),
    [status, setStatus] = useState(""),
    [sort, setSort] = useState("checked"),
    [history, setHistory] = useState(null),
    [pubDate, setPubDate] = useState(today),
    [postUrl, setPostUrl] = useState("");
  useEffect(() => {
    if (!db.error) void refreshAll();
  }, []);
  async function refreshAll() {
    if (
      s ||
      (p &&
        JSON.stringify(p) !==
          JSON.stringify(db.profiles.find((row) => row.id === p.id)))
    ) {
      setMessage(
        "Sauvegarde la fiche et le relevé en cours avant d’actualiser la réserve.",
      );
      return;
    }
    const controller = new AbortController();
    requestRef.current = controller;
    const timer = setTimeout(() => controller.abort(), 20000);
    setRefreshing(true);
    setMessage("Chargement des derniers relevés collectés…");
    try {
      const feed = await fetchLatestFeed(controller.signal);
      if (controller.signal.aborted) return;
      const result = mergeFeed(db, feed);
      if (commit(result.db)) {
        if (p)
          setP(
            structuredClone(result.db.profiles.find((row) => row.id === p.id)),
          );
        setMessage(
          `${result.added} nouveau(x) relevé(s) à vérifier ; ${result.failed} source(s) en échec. Les publications et relevés précédents sont conservés.`,
        );
      }
    } catch (error) {
      if (requestRef.current === controller)
        setMessage(
          controller.signal.aborted
            ? "Chargement interrompu. Derniers relevés conservés."
            : error.message,
        );
    } finally {
      clearTimeout(timer);
      if (requestRef.current === controller) {
        requestRef.current = null;
        setRefreshing(false);
      }
    }
  }
  function commit(next) {
    if (db.error || !save(next)) {
      setMessage(
        "Sauvegarde impossible : stockage indisponible ou modifié dans un autre onglet. Conserve tes modifications puis recharge.",
      );
      return false;
    }
    setDb(next);
    setMessage("Sauvegardé sur ce navigateur et cet appareil.");
    return true;
  }
  function store(next = p) {
    const url = canonicalUrl(next.url);
    if (
      url &&
      db.profiles.some((x) => x.id !== next.id && canonicalUrl(x.url) === url)
    ) {
      setMessage("Ce lien est déjà enregistré.");
      return false;
    }
    return commit({
      ...db,
      profiles: [...db.profiles.filter((x) => x.id !== next.id), next],
    });
  }
  function edit(key, value) {
    setMessage("");
    setP({
      ...p,
      [key]: value,
      draft: null,
      ...(key === "url"
        ? { catalogueId: undefined, acquisition: undefined }
        : {}),
    });
    setHistory(null);
  }
  function open(next, forPreparation = false) {
    setMessage("");
    const opened = structuredClone(next);
    const source =
      opened.snapshots.find((row) => row.id === opened.draft?.snapshotId) ||
      opened.snapshots.at(-1);
    if (
      forPreparation &&
      source &&
      !opened.draft &&
      !issues(opened, source).length
    ) {
      opened.status = "Brouillon";
      opened.draft = {
        episode: 1,
        text: buildText(opened, source, 1),
        snapshotId: source.id,
      };
      if (!store(opened)) return;
    }
    setP(opened);
    setS(null);
    setSelected(opened.draft?.snapshotId || source?.id || "");
    setHistory(null);
    requestAnimationFrame(() =>
      (forPreparation ? preparationRef : editorRef).current?.scrollIntoView({
        block: "start",
      }),
    );
  }
  const snap = p?.snapshots.find((x) => x.id === selected),
    errors = p ? issues(p, snap) : [],
    previewSnapshot = s || snap,
    draft =
      p?.draft?.snapshotId === snap?.id && !errors.length && !s
        ? p?.draft
        : null;
  function prepare() {
    try {
      const episode = draft?.episode || 1;
      const next = {
        ...p,
        status: "Brouillon",
        draft: {
          episode,
          text: buildText(p, snap, episode),
          snapshotId: snap.id,
        },
      };
      if (store(next)) setP(next);
    } catch (e) {
      setMessage(e.message);
    }
  }
  function completePerformances() {
    setS(performanceCompletion(snap));
    requestAnimationFrame(() => {
      performanceRef.current?.scrollIntoView({ block: "start" });
      performanceRef.current
        ?.querySelector("input")
        ?.focus({ preventScroll: true });
    });
  }
  function saveSnapshot(andPrepare = false) {
    let next = {
      ...p,
      checked: latestVerificationDate(p, s),
      snapshots: [...p.snapshots, structuredClone(s)],
      draft: null,
    };
    if (andPrepare === true) {
      try {
        const episode = p.draft?.episode || 1;
        next = {
          ...next,
          status: "Brouillon",
          draft: {
            episode,
            text: buildText(next, s, episode),
            snapshotId: s.id,
          },
        };
      } catch (error) {
        setMessage(error.message);
        return;
      }
    }
    if (store(next)) {
      setP(next);
      setSelected(s.id);
      setS(null);
      requestAnimationFrame(() =>
        preparationRef.current?.scrollIntoView({ block: "start" }),
      );
    }
  }
  return (
    <div className="pp">
      <PageHeader
        title="Portefeuilles publics"
        subtitle="Préparer Le portefeuille de la semaine à partir de sources publiques et de contrôles manuels."
      />
      <p>
        Sauvegarde locale sur ce navigateur et cet appareil. Aucune
        synchronisation entre appareils.
      </p>
      <p role="status">{db.error || message}</p>
      <section
        className="pp-refresh"
        aria-label="Actualisation des portefeuilles publics"
      >
        <h3>
          Base publique commune · {catalogue.length} portefeuilles sourcés
        </h3>
        <p>
          La base publique est préchargée et ses derniers relevés se chargent
          automatiquement à l’ouverture. La collecte du samedi à 07:10 UTC lit
          les pages partagées Getquin sans connexion. Elle récupère les
          positions et leurs poids, à confirmer. Les performances du mois et
          depuis janvier restent à vérifier manuellement.
        </p>
        <p>
          Dernier flux chargé :{" "}
          {db.feedLoadedAt
            ? new Date(db.feedLoadedAt).toLocaleString("fr-FR")
            : "aucun"}
          .
        </p>
        <button onClick={refreshAll} disabled={refreshing || !!db.error}>
          {refreshing ? "Chargement…" : "Actualiser tous les portefeuilles"}
        </button>
        <p>
          Ce bouton charge les derniers relevés collectés ; il ne relance pas
          immédiatement les sites sources.{" "}
          <a href={COLLECTOR_URL} target="_blank" rel="noreferrer">
            Consulter ou relancer la collecte sur GitHub
          </a>
          .
        </p>
      </section>
      <fieldset className="pp-controls" disabled={refreshing}>
        <details>
          <summary>Acquisition : capacités et précautions</summary>
          <p>
            Getquin : récupération partielle des allocations des liens partagés
            de la réserve recherchée, à confirmer. eToro, Mon Petit Portfolio et
            autres : saisie manuelle. Les fiches ajoutées librement restent
            manuelles tant qu’elles ne sont pas raccordées au catalogue de
            collecte. Aucune connexion ni restriction d’accès n’est contournée.
          </p>
          <p>
            La sauvegarde du lien ne récupère aucune donnée. Un échec de
            consultation ne modifie aucun relevé ; les dernières données valides
            restent conservées. Les rendements doivent être recopiés avec leur
            période et leur libellé d’origine : ni variation du capital, ni
            versements, ni estimation depuis les positions actuelles. Aucune
            conversion de devise ni renormalisation automatique.
          </p>
        </details>
        <button onClick={() => open(blankProfile())}>
          Ajouter un portefeuille
        </button>
        <div className="pp-grid">
          <Field
            label="Recherche pseudo ou nom"
            value={query}
            onChange={setQuery}
          />
          <Field
            label="Plateforme"
            value={platform}
            onChange={setPlatform}
            options={["", ...PLATFORMS]}
          />
          <Field
            label="Stratégie (contient)"
            value={strategy}
            onChange={setStrategy}
          />
          <Field
            label="Statut"
            value={status}
            onChange={setStatus}
            options={["", ...STATUSES]}
          />
          <Field
            label="Trier par"
            value={sort}
            onChange={setSort}
            options={["checked", "publication"]}
          />
        </div>
        <div className="pp-list">
          {db.profiles
            .filter(
              (x) =>
                `${x.pseudo} ${x.name}`
                  .toLowerCase()
                  .includes(query.toLowerCase()) &&
                (!platform || x.platform === platform) &&
                (!status || x.status === status) &&
                x.strategy.toLowerCase().includes(strategy.toLowerCase()),
            )
            .sort((a, b) =>
              (sort === "checked"
                ? b.checked
                : latestPublicationDate(b)
              ).localeCompare(
                sort === "checked" ? a.checked : latestPublicationDate(a),
              ),
            )
            .map((x) => {
              const last = x.snapshots.at(-1);
              return (
                <article key={x.id}>
                  <h3>{nameOf(x)}</h3>
                  <p>
                    {x.platform} · {x.strategy || "Stratégie non renseignée"} ·{" "}
                    {x.status}
                  </p>
                  <p>
                    {last?.month.start || "Période non renseignée"} →{" "}
                    {last?.month.end || "—"} · Mois :{" "}
                    {last && !performanceIssues(last, "month").length
                      ? hasText(last.month.na)
                        ? "Non applicable"
                        : pct(last.month.value)
                      : "À vérifier"}{" "}
                    · Depuis janvier :{" "}
                    {last && !performanceIssues(last, "ytd").length
                      ? hasText(last.ytd.na)
                        ? "Non applicable"
                        : pct(last.ytd.value)
                      : "À vérifier"}
                  </p>
                  <p>
                    Vérifié le : {x.checked || "Jamais"} · Dernière publication
                    : {latestPublicationDate(x) || "Jamais"}
                  </p>
                  <AcquisitionInfo profile={x} />
                  <button onClick={() => open(x, true)}>
                    Préparer texte et images
                  </button>
                  <button onClick={() => open(x)}>Ouvrir / modifier</button>
                </article>
              );
            })}
        </div>
        {p && (
          <section
            ref={editorRef}
            style={{ scrollMarginTop: 120 }}
            onChange={() => setMessage("")}
          >
            <h2>{nameOf(p)}</h2>
            <AcquisitionInfo profile={p} />
            <button onClick={() => store()}>Sauvegarder</button>
            {(message || db.error) && <p>{db.error || message}</p>}
            <button
              onClick={() => {
                if (
                  confirm("Supprimer cette fiche et son historique local ?") &&
                  commit({
                    ...db,
                    profiles: db.profiles.filter((x) => x.id !== p.id),
                  })
                )
                  setP(null);
              }}
            >
              Supprimer la fiche
            </button>
            {canonicalUrl(p.url) && (
              <a href={p.url} target="_blank" rel="noreferrer">
                Ouvrir la source
              </a>
            )}
            <section
              ref={preparationRef}
              style={{ scrollMarginTop: 120 }}
              aria-label="Préparer la publication"
            >
              <h3>Préparation</h3>
              {snap && <SnapshotEvidence s={snap} />}
              {errors.length > 0 && (
                <>
                  <p>
                    Le format résultats exige les performances du mois et depuis
                    janvier vérifiées, ou un motif de non-applicabilité
                    contrôlé. Les allocations collectées seules ne suffisent
                    pas.
                  </p>
                  {snap && !s && (
                    <button onClick={completePerformances}>
                      Compléter les performances
                    </button>
                  )}
                  <details>
                    <summary>Contrôles manquants ({errors.length})</summary>
                    {errors.map((e) => (
                      <p className="pp-warning" key={e}>
                        {e}
                      </p>
                    ))}
                  </details>
                </>
              )}
              {previewSnapshot && (errors.length > 0 || s) && (
                <section aria-label="Aperçu avant vérification">
                  <h4>Aperçu du post — export bloqué</h4>
                  <p>
                    Les performances non vérifiées sont masquées. Complète et
                    enregistre le relevé pour obtenir le texte final et les
                    téléchargements.
                  </p>
                  <label>
                    Aperçu du texte à compléter
                    <textarea
                      readOnly
                      value={buildPreviewText(
                        p,
                        previewSnapshot,
                        p.draft?.episode || 1,
                      )}
                    />
                  </label>
                  <Images
                    profile={p}
                    snapshot={previewSnapshot}
                    episode={p.draft?.episode || 1}
                    preview
                  />
                </section>
              )}
              {snap && (
                <p>
                  {benchmarkIssue(snap) || "Benchmark comparable sur le mois."}
                </p>
              )}
              <button disabled={!!errors.length || !!s} onClick={prepare}>
                Préparer / régénérer le tweet
              </button>
              {draft && snap && (
                <>
                  <Field
                    label="Numéro d’épisode"
                    type="number"
                    value={draft.episode}
                    onChange={(v) =>
                      setP({
                        ...p,
                        draft: {
                          ...draft,
                          episode: v,
                          text: draft.text.replace(
                            /SEMAINE #[^\n]*/,
                            `SEMAINE #${v}`,
                          ),
                        },
                      })
                    }
                  />
                  <label>
                    Texte final éditable
                    <textarea
                      value={draft.text}
                      onChange={(e) =>
                        setP({
                          ...p,
                          draft: { ...draft, text: e.target.value },
                        })
                      }
                    />
                  </label>
                  <p>
                    {draft.text.length} caractères — adapter au format X
                    utilisé.
                  </p>
                  <button
                    disabled={
                      !validEpisode(draft.episode) ||
                      !draft.text.trim() ||
                      draft.text.startsWith("BROUILLON — À COMPLÉTER") ||
                      /undefined|\{[^}]+\}/.test(draft.text)
                    }
                    onClick={() =>
                      copyPublicationText(draft.text).catch((e) =>
                        setMessage(e.message),
                      )
                    }
                  >
                    Copier le texte
                  </button>
                  <button onClick={() => store()}>
                    Sauvegarder le brouillon
                  </button>
                  <Images profile={p} snapshot={snap} episode={draft.episode} />
                  <Field
                    label="Date de publication"
                    type="date"
                    value={pubDate}
                    onChange={setPubDate}
                  />
                  <Field
                    label="URL du post (facultative)"
                    value={postUrl}
                    onChange={setPostUrl}
                  />
                  <button
                    onClick={() => {
                      try {
                        if (!pubDate) throw Error("Date requise");
                        const entry = publication(
                            p,
                            snap,
                            draft,
                            pubDate,
                            postUrl,
                          ),
                          next = {
                            ...p,
                            status: "Publié",
                            publications: [...p.publications, entry],
                          };
                        if (store(next)) setP(next);
                      } catch (e) {
                        setMessage(e.message);
                      }
                    }}
                  >
                    Marquer comme publié
                  </button>
                </>
              )}
              <h3>Historique éditorial</h3>
              {p.publications.map((h) => (
                <button key={h.id} onClick={() => setHistory(h)}>
                  Épisode #{h.episode} · {h.date}
                </button>
              ))}
              {history && (
                <section>
                  <h4>Publication conservée #{history.episode}</h4>
                  <pre>{history.text}</pre>
                  {history.url && (
                    <a
                      href={canonicalUrl(history.url) || "#"}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Post
                    </a>
                  )}
                  <Images
                    profile={history.profile}
                    snapshot={history.snapshot}
                    episode={history.image.episode}
                  />
                </section>
              )}
            </section>
            <div className="pp-grid">
              {[
                ["url", "URL du portefeuille"],
                ["pseudo", "Pseudo"],
                ["name", "Nom public"],
                ["strategy", "Description de la stratégie"],
                ["objective", "Objectif communiqué par l’auteur uniquement"],
                ["currency", "Devise"],
                ["started", "Début d’investissement (si public)"],
                ["amount", "Montant public (facultatif)"],
                ["notes", "Notes de vérification"],
                ["evidence", "Liens justificatifs"],
              ].map(([key, label]) => (
                <Field
                  key={key}
                  label={label}
                  value={p[key]}
                  onChange={(v) => edit(key, v)}
                />
              ))}
              <Field
                label="Plateforme de la fiche"
                value={p.platform}
                options={PLATFORMS}
                onChange={(v) => edit("platform", v)}
              />
              <Field
                label="Nature"
                value={p.nature}
                options={NATURES}
                onChange={(v) => edit("nature", v)}
              />
              <Field
                label="Statut éditorial"
                value={p.status}
                options={STATUSES.filter(
                  (value) => value !== "Publié" || p.status === "Publié",
                )}
                onChange={(v) => edit("status", v)}
              />
            </div>
            <h3>Relevés indépendants</h3>
            <button
              onClick={() => {
                const next = { ...p, lastFailure: today() };
                if (store(next)) setP(next);
              }}
            >
              Signaler un échec de consultation
            </button>
            {p.lastFailure && (
              <p>
                Échec de consultation signalé le {p.lastFailure}. Dernier relevé
                conservé : {p.checked || "aucun"}.
              </p>
            )}
            <p>
              Chaque enregistrement ajoute un relevé. Pour corriger, crée une
              nouvelle version ; les publications conservent leur photographie
              d’origine.
            </p>
            <ChoicePicker
              aria-label="Relevé à préparer"
              value={selected}
              onChange={(e) => {
                setMessage("");
                setSelected(e.target.value);
                setP({ ...p, draft: null });
                setHistory(null);
              }}
            >
              <option value="">Choisir un relevé</option>
              {p.snapshots.map((r, index) => (
                <option key={r.id} value={r.id}>
                  Relevé {index + 1} · {r.consulted} — données du{" "}
                  {r.effective || "jour non précisé"} —{" "}
                  {r.month.end || "période inconnue"}
                </option>
              ))}
            </ChoicePicker>
            <button
              onClick={() =>
                setS({ ...blankSnapshot(), currency: p.currency || "" })
              }
            >
              Ajouter un relevé
            </button>
            {snap && (
              <button
                onClick={() =>
                  setS({
                    ...structuredClone(snap),
                    id: crypto.randomUUID(),
                    consulted: today(),
                  })
                }
              >
                Corriger dans un nouveau relevé
              </button>
            )}
            {s && (
              <section>
                <h3>Nouveau relevé</h3>
                <div className="pp-grid">
                  {[
                    ["consulted", "Date de consultation", "date"],
                    ["effective", "Date effective connue", "date"],
                    ["currency", "Devise des rendements"],
                    ["total", "Montant total public"],
                    ["source", "URL justificative"],
                  ].map(([k, l, t]) => (
                    <Field
                      key={k}
                      label={l}
                      type={t}
                      value={s[k]}
                      onChange={(v) =>
                        setS({
                          ...s,
                          [k]: v,
                          month: { ...s.month, verified: false },
                          ytd: { ...s.ytd, verified: false },
                          year: { ...s.year, verified: false },
                          benchmark: { ...s.benchmark, verified: false },
                        })
                      }
                    />
                  ))}
                  <Field
                    label="Méthode"
                    value={s.method}
                    options={["Non précisée", "TWR", "TRI/IRR", "Autre"]}
                    onChange={(v) => setS({ ...s, method: v })}
                  />
                  <Field
                    label="Dividendes"
                    value={s.dividends}
                    options={["Non précisé", "Réinvestis", "Exclus", "Autre"]}
                    onChange={(v) => setS({ ...s, dividends: v })}
                  />
                  <Field
                    label="Frais"
                    value={s.fees}
                    options={["Non précisé", "Inclus", "Exclus", "Autre"]}
                    onChange={(v) => setS({ ...s, fees: v })}
                  />
                </div>
                <div ref={performanceRef} style={{ scrollMarginTop: 120 }}>
                  <p>
                    Renseigne les rendements et recopie leurs libellés exacts.
                    Les dates proposées sont à confirmer sur la source ; un
                    rendement annualisé ou glissant ne convient pas.
                  </p>
                  {canonicalUrl(s.source) && (
                    <a href={s.source} target="_blank" rel="noreferrer">
                      Vérifier les performances sur la source
                    </a>
                  )}
                  {["month", "ytd"].map((k) => (
                    <PerformanceFields
                      key={k}
                      snapshot={s}
                      onChange={setS}
                      metric={k}
                    />
                  ))}
                  <button
                    onClick={() => saveSnapshot(true)}
                    disabled={!!issues(p, s).length}
                  >
                    Enregistrer et préparer le post
                  </button>
                  <button onClick={() => saveSnapshot()}>
                    Enregistrer ce relevé
                  </button>
                  <button onClick={() => setS(null)}>Annuler le relevé</button>
                  {issues(p, s).length > 0 && (
                    <details>
                      <summary>
                        Contrôles à terminer avant export ({issues(p, s).length}
                        )
                      </summary>
                      {issues(p, s).map((issue) => (
                        <p className="pp-warning" key={issue}>
                          {issue}
                        </p>
                      ))}
                    </details>
                  )}
                </div>
                <details>
                  <summary>Performance sur un an (facultative)</summary>
                  <PerformanceFields
                    snapshot={s}
                    onChange={setS}
                    metric="year"
                  />
                </details>
                <details open={!s.positions.length}>
                  <summary>
                    Allocation reprise · {s.positions.length} position(s),
                    liquidités comprises
                  </summary>
                  {s.positions.map((r, i) => (
                    <div className="pp-grid" key={i}>
                      {[
                        ["name", "Placement"],
                        ["identifier", "Identifiant facultatif"],
                        ["weight", "Poids (%)"],
                      ].map(([k, l]) => (
                        <Field
                          key={k}
                          label={l}
                          type={k === "weight" ? "number" : "text"}
                          value={r[k]}
                          onChange={(v) =>
                            setS({
                              ...s,
                              positions: s.positions.map((x, j) =>
                                j === i ? { ...x, [k]: v } : x,
                              ),
                            })
                          }
                        />
                      ))}
                      <button
                        onClick={() =>
                          setS({
                            ...s,
                            positions: s.positions.filter((_, j) => j !== i),
                          })
                        }
                      >
                        Retirer la ligne
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setS({
                        ...s,
                        positions: [
                          ...s.positions,
                          { name: "", identifier: "", weight: "" },
                        ],
                      })
                    }
                  >
                    Ajouter une position
                  </button>
                </details>
                <details>
                  <summary>
                    Benchmark facultatif (indice ou ETF représentatif nommé
                    exactement)
                  </summary>
                  <div className="pp-grid">
                    {[
                      ["name", "Nom exact"],
                      ["currency", "Devise"],
                      ["source", "Source"],
                      ["method", "Méthode"],
                      ["start", "Début", "date"],
                      ["end", "Fin", "date"],
                      ["value", "Performance (%)", "number"],
                    ].map(([k, l, t]) => (
                      <Field
                        key={k}
                        label={l}
                        type={t}
                        value={s.benchmark[k]}
                        onChange={(v) =>
                          setS({
                            ...s,
                            benchmark: {
                              ...s.benchmark,
                              [k]: v,
                              verified: false,
                            },
                          })
                        }
                      />
                    ))}
                  </div>
                  <Check
                    label="Dividendes réinvestis"
                    value={s.benchmark.reinvested}
                    onChange={(v) =>
                      setS({
                        ...s,
                        benchmark: { ...s.benchmark, reinvested: v },
                      })
                    }
                  />
                  <Check
                    label="Comparabilité contrôlée"
                    value={s.benchmark.verified}
                    onChange={(v) =>
                      setS({ ...s, benchmark: { ...s.benchmark, verified: v } })
                    }
                  />
                </details>
              </section>
            )}
          </section>
        )}
      </fieldset>
    </div>
  );
}
