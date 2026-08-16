import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { generatePortfolio, renderTweetText, fmtPct, TIER_ORDER, TIER_LABELS } from "./engine.js";
import { CATEGORIES, YEARS } from "./data.js";

const TIER_CHIPS = [
  { key: "auto", label: "🎲 Auto" },
  ...TIER_ORDER.map((key) => ({ key, label: TIER_LABELS[key] })),
];

const POSITIVE = "#1f9d70";
const NEGATIVE = "#e2685f";

function TierSelector({ selected, onSelect }) {
  return (
    <div className="panel">
      <div className="panel-title">Niveau de risque</div>
      <div className="tier-chips" role="group" aria-label="Choisir un niveau de risque cible">
        {TIER_CHIPS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tier-chip${selected === t.key ? " active" : ""}`}
            aria-pressed={selected === t.key}
            onClick={() => onSelect(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="tier-hint">
        {selected === "auto"
          ? "Le risque est déterminé par le tirage aléatoire des actifs."
          : "Chaque génération est recalculée pour rester dans ce niveau de risque."}
      </p>
    </div>
  );
}

function WorstYearGauge({ tierKey, tierLabel, worst, bound }) {
  const idx = TIER_ORDER.indexOf(tierKey);
  const pct = (idx / (TIER_ORDER.length - 1)) * 100;
  return (
    <div className="riskgauge">
      <div className="riskgauge-row">
        <span className="riskgauge-label">Palier de risque</span>
        <span className="riskgauge-value">{tierLabel}</span>
      </div>
      <div className="riskgauge-track">
        <div className="riskgauge-marker" style={{ left: `${pct}%` }} />
      </div>
      <p className="riskgauge-detail">
        Pire année simulée : <b className={worst.value >= 0 ? "pos" : "neg"}>{fmtPct(worst.value)}</b> en {worst.year}
        <span className="riskgauge-bound"> · objectif {bound.text}</span>
      </p>
    </div>
  );
}

function AllocationList({ selection }) {
  return (
    <ul className="alloc-list">
      {selection
        .slice()
        .sort((a, b) => b.pct - a.pct)
        .map((s) => (
          <li key={s.id} className="alloc-row">
            <span className="alloc-swatch" style={{ background: CATEGORIES[s.cat].color }} />
            <span className="alloc-name">{s.emoji} {s.name}</span>
            <span className="alloc-cat">{CATEGORIES[s.cat].label}</span>
            <span className="alloc-pct">{s.pct}%</span>
            <div className="alloc-bar-track">
              <div
                className="alloc-bar-fill"
                style={{ width: `${s.pct}%`, background: CATEGORIES[s.cat].color }}
              />
            </div>
          </li>
        ))}
    </ul>
  );
}

function PerfChart({ perf }) {
  const values = YEARS.map((y) => perf[y]);
  const maxAbs = Math.max(1, ...values.map((v) => Math.abs(v)));
  const half = 62;
  return (
    <div className="chart-wrap">
      <div className="chart-title-row">
        <span className="chart-title">Performance annuelle simulée du portefeuille</span>
        <span className="chart-legend">
          <i className="dot" style={{ background: POSITIVE }} /> Positive
          <i className="dot" style={{ background: NEGATIVE }} /> Négative
        </span>
      </div>
      <div className="chart-area">
        <div className="chart-baseline" style={{ top: half }} />
        {YEARS.map((y, i) => {
          const v = values[i];
          const h = Math.max(2, (Math.abs(v) / maxAbs) * half);
          const positive = v >= 0;
          return (
            <div
              className="bar-col"
              key={y}
              title={`${y} : ${fmtPct(v)}`}
              tabIndex={0}
            >
              <div
                className={`bar-fill ${positive ? "pos" : "neg"}`}
                style={
                  positive
                    ? { bottom: half, height: h }
                    : { top: half, height: h }
                }
              />
              <span
                className={`bar-value ${positive ? "pos" : "neg"}`}
                style={
                  positive
                    ? { bottom: half + h + 4 }
                    : { top: half + h + 4 }
                }
              >
                {fmtPct(v)}
              </span>
              <span className="bar-year">{y}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TweetCard({ portfolio, likeSeed }) {
  const text = useMemo(() => renderTweetText(portfolio), [portfolio]);
  const paragraphs = text.split("\n\n");

  return (
    <article className="tweet-card" aria-label="Aperçu du post X">
      <div className="tweet-head">
        <div className="tweet-avatar">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              fill="currentColor"
              d="M4 19h2v-7H4v7Zm5.5 0h2V9h-2v10Zm5.5 0h2V5h-2v14Zm5.5 0h2v-4h-2v4Z"
            />
          </svg>
        </div>
        <div className="tweet-identity">
          <span className="tweet-name">
            Patrimoine &amp; Compagnie <span className="tweet-badge">✓</span>
          </span>
          <span className="tweet-handle">@patrimoine_edu · {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
        </div>
      </div>
      <div className="tweet-body">
        {paragraphs.map((p, i) => (
          <p key={i} className={i === 0 ? "tweet-title" : undefined}>
            {p}
          </p>
        ))}
      </div>
      <div className="tweet-footer">
        <span className="tweet-icon">
          💬 <b>{likeSeed.replies}</b>
        </span>
        <span className="tweet-icon">
          🔁 <b>{likeSeed.reposts}</b>
        </span>
        <span className="tweet-icon">
          ♥ <b>{likeSeed.likes}</b>
        </span>
        <span className="tweet-icon">📊 {likeSeed.views}</span>
      </div>
    </article>
  );
}

function randomEngagement() {
  return {
    replies: Math.floor(8 + Math.random() * 60),
    reposts: Math.floor(20 + Math.random() * 300),
    likes: Math.floor(120 + Math.random() * 2200),
    views: `${(6 + Math.random() * 90).toFixed(1)} k`,
  };
}

export default function App() {
  const [selectedTier, setSelectedTier] = useState("auto");
  const [history, setHistory] = useState(() => [generatePortfolio([], "auto")]);
  const [copyState, setCopyState] = useState("idle");
  const [engagement, setEngagement] = useState(randomEngagement);
  const textareaRef = useRef(null);

  const current = history[history.length - 1];

  const handleGenerate = useCallback(
    (tierOverride) => {
      const tier = tierOverride ?? selectedTier;
      setHistory((h) => [...h, generatePortfolio(h, tier)]);
      setEngagement(randomEngagement());
      setCopyState("idle");
    },
    [selectedTier]
  );

  const handleSelectTier = useCallback(
    (tierKey) => {
      setSelectedTier(tierKey);
      handleGenerate(tierKey);
    },
    [handleGenerate]
  );

  const handleCopy = useCallback(async () => {
    const text = renderTweetText(current);
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("done");
    } catch (e) {
      const ta = textareaRef.current;
      if (ta) {
        ta.value = text;
        ta.style.display = "block";
        ta.select();
        try {
          document.execCommand("copy");
          setCopyState("done");
        } catch (err) {
          setCopyState("error");
        }
        ta.style.display = "none";
      } else {
        setCopyState("error");
      }
    }
    window.setTimeout(() => setCopyState("idle"), 2200);
  }, [current]);

  useEffect(() => {
    document.title = "Générateur de portefeuilles · Patrimoine & Compagnie";
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M4 19h2v-7H4v7Zm5.5 0h2V9h-2v10Zm5.5 0h2V5h-2v14Zm5.5 0h2v-4h-2v4Z" />
            </svg>
          </span>
          <div>
            <div className="brand-name">Patrimoine &amp; Compagnie</div>
            <div className="brand-tag">Générateur de portefeuilles hebdomadaire</div>
          </div>
        </div>
        <div className="header-count">
          {history.length} portefeuille{history.length > 1 ? "s" : ""} généré{history.length > 1 ? "s" : ""} cette session
        </div>
      </header>

      <main className="app-main">
        <section className="tweet-col">
          <TweetCard portfolio={current} likeSeed={engagement} />
          <div className="tweet-actions">
            <button className="btn btn-secondary" onClick={handleCopy}>
              {copyState === "done" ? "✅ Copié !" : copyState === "error" ? "⚠️ Copie manuelle requise" : "📋 Copier le texte"}
            </button>
          </div>
          <textarea ref={textareaRef} className="clipboard-fallback" readOnly />
        </section>

        <section className="control-col">
          <button className="btn btn-primary btn-generate" onClick={() => handleGenerate()}>
            🔄 Générer un nouveau portefeuille
          </button>

          <TierSelector selected={selectedTier} onSelect={handleSelectTier} />

          <div className="panel">
            <WorstYearGauge
              tierKey={current.tierKey}
              tierLabel={current.profileName}
              worst={current.worst}
              bound={current.bound}
            />
          </div>

          <div className="panel">
            <div className="panel-title">Répartition — {current.selection.length} lignes</div>
            <AllocationList selection={current.selection} />
          </div>

          <div className="panel">
            <PerfChart perf={current.perf} />
          </div>

          <div className="panel panel-muted">
            <p className="fine-print">
              Rendements 2020-2025 : données historiques approximatives par actif, à titre pédagogique et
              éditables manuellement. Chaque combinaison est validée pour respecter la borne de pire année
              de son palier de risque avant d'être affichée.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
