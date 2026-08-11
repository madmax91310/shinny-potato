import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { generatePortfolio, renderTweetText, fmtPct } from "./engine.js";
import { CATEGORIES, YEARS } from "./data.js";

const CAT_COLOR = {
  obligataire: "#3987e5",
  matieres_premieres: "#d95926",
  actions_larges: "#199e70",
  sectoriel: "#c98500",
  immobilier: "#d55181",
  actions_individuelles: "#008300",
  strategique: "#9085e9",
  crypto: "#e66767",
};

const POSITIVE = "#1f9d70";
const NEGATIVE = "#e2685f";

function RiskGauge({ score, tierLabel }) {
  const pct = Math.min(100, Math.max(0, ((score - 1) / 4) * 100));
  return (
    <div className="riskgauge">
      <div className="riskgauge-row">
        <span className="riskgauge-label">Risque estimé</span>
        <span className="riskgauge-value">{score.toFixed(1)} / 5 · {tierLabel}</span>
      </div>
      <div className="riskgauge-track">
        <div className="riskgauge-fill" style={{ width: `${pct}%` }} />
        <div className="riskgauge-marker" style={{ left: `${pct}%` }} />
      </div>
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
            <span className="alloc-swatch" style={{ background: CAT_COLOR[s.cat] }} />
            <span className="alloc-name">{s.name}</span>
            <span className="alloc-cat">{CATEGORIES[s.cat].label}</span>
            <span className="alloc-pct">{s.pct}%</span>
            <div className="alloc-bar-track">
              <div
                className="alloc-bar-fill"
                style={{ width: `${s.pct}%`, background: CAT_COLOR[s.cat] }}
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
  const [history, setHistory] = useState(() => [generatePortfolio([])]);
  const [copyState, setCopyState] = useState("idle");
  const [engagement, setEngagement] = useState(randomEngagement);
  const textareaRef = useRef(null);

  const current = history[history.length - 1];

  const handleGenerate = useCallback(() => {
    setHistory((h) => [...h, generatePortfolio(h)]);
    setEngagement(randomEngagement());
    setCopyState("idle");
  }, []);

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
          <button className="btn btn-primary btn-generate" onClick={handleGenerate}>
            🔄 Générer un nouveau portefeuille
          </button>

          <div className="panel">
            <RiskGauge score={current.riskScore} tierLabel={current.tierLabel} />
          </div>

          <div className="panel">
            <div className="panel-title">Répartition — {current.selection.length} classes d'actifs</div>
            <AllocationList selection={current.selection} />
          </div>

          <div className="panel">
            <PerfChart perf={current.perf} />
          </div>

          <div className="panel panel-muted">
            <p className="fine-print">
              Rendements 2020-2025 : données historiques approximatives par classe d'actif, à titre pédagogique
              et éditables manuellement. Anti-répétition active : les {history.length} combinaison{history.length > 1 ? "s" : ""} généré{history.length > 1 ? "es" : "e"} cette session sont mémorisées pour ne jamais revenir sur les mêmes actifs.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
