import React, { useState, useMemo, useEffect, useRef } from "react";

/* ======================================================
   BASE DE DONNÉES — modifie ici chaque semaine.
   rank : 1 = meilleur, plus haut = moins bon (sert au surlignage).
   ====================================================== */
const BROKERS = [
  {
    id: "tr", nom: "Trade Republic", code: "TR", color: "#5FA8D3", emoji: "🔵",
    frais: { rank: 1, resume: "1€ / ordre", detail: "Frais fixe, quel que soit le montant" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 1, resume: "0€ (PEA & CTO)", detail: "+7 500 titres · hebdo / bimensuel / mensuel" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: false, jeune: true },
    ifu: { rank: 1, resume: "Oui" },
    liquidites: { rank: 1, resume: "Oui" },
    pointFaible: "Pas de PEA-PME, transfert PEA entrant impossible",
    post: {
      frais: ["1€/ordre, quel que soit le montant"],
      dca: ["✅ 0€ sur PEA & CTO — +7 500 titres disponibles, hebdo/bimensuel/mensuel"],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ❌ / PEA Jeune ✅",
      ifu: ["✅ Oui"],
      liquidites: ["✅ Oui"],
      faibles: ["Pas de PEA-PME, transfert PEA entrant impossible"],
      verdict: "Tu veux investir petit et souvent sans réfléchir aux frais",
    },
  },
  {
    id: "bourso", nom: "BoursoBank", code: "BB", color: "#E4735E", emoji: "🟡",
    frais: { rank: 2, resume: "1,99€ puis 0,60%", detail: "Plafonné à 0,5% du montant" },
    boursomarkets: { rank: 1, resume: "0€ à l’achat", detail: "ETF iShares, OPCVM partenaires, Turbos/Warrants SG & GS" },
    dca: { rank: 2, resume: "0€ transaction, frais selon DIC", detail: "8 fonds maison, mensuel uniquement" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: true, jeune: true },
    ifu: { rank: 1, resume: "Oui" },
    liquidites: { rank: 1, resume: "Oui", detail: "Livret Bourso+" },
    pointFaible: "DCA limité 8 fonds maison, frais de gestion selon DIC, ordre min ETF 200€",
    post: {
      frais: ["1,99€ ≤500€, puis 0,60% (plafonné à 0,5% sur PEA)", "⚡ Exception Boursomarkets → 0€ sur ETF iShares, OPCVM partenaires, Turbos/Warrants SG & Goldman Sachs"],
      dca: ["⚠️ 0€ de transaction — frais de gestion selon DIC — 8 fonds maison, mensuel uniquement"],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ✅",
      ifu: ["✅ Oui"],
      liquidites: ["✅ Oui (Livret Bourso+)"],
      faibles: ["DCA limité 8 fonds maison, frais de gestion selon DIC, ordre min ETF 200€"],
      verdict: "Tu veux un écosystème bancaire complet avec PEA-PME",
    },
  },
  {
    id: "ibkr", nom: "Interactive Brokers", code: "IBKR", color: "#7C93C9", emoji: "🟢",
    frais: { rank: 1, resume: "0,05% (min 1,25€, max 29€)", detail: "Tarif dégressif · défaut fixe min 3€" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 2, resume: "CTO uniquement", detail: "Pas de DCA sur PEA" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: false, jeune: null },
    ifu: { rank: 2, resume: "PEA uniquement" },
    liquidites: { rank: 1, resume: "Oui", detail: "CTO" },
    pointFaible: "Interface complexe, tarif fixe par défaut 3€, pas d’IFU sur CTO",
    post: {
      frais: ["0,05% min 1,25€ max 29€ (tarif dégressif)", "⚠️ Tarif fixe par défaut : min 3€"],
      dca: ["❌ Sur PEA", "✅ CTO uniquement"],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ❌ / PEA Jeune ❌",
      ifu: ["⚠️ PEA uniquement"],
      liquidites: ["✅ Oui"],
      faibles: ["Interface complexe, tarif fixe par défaut 3€, pas d’IFU sur CTO"],
      verdict: "Tu veux les frais les plus bas sur gros ordres européens",
    },
  },
  {
    id: "fortuneo", nom: "Fortuneo", code: "FO", color: "#8C7AE6", emoji: "🟣",
    frais: { rank: 2, resume: "0€ le 1er ordre/mois", detail: "Si ≤ 500€, puis 0,35% au-delà" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 3, resume: "Non disponible" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: true, jeune: false },
    ifu: { rank: 1, resume: "Oui" },
    liquidites: { rank: 1, resume: "Oui", detail: "Livret+" },
    pointFaible: "Clôture PEA 85€, pas de DCA, frais élevés hors Euronext (min 20€ + 30€)",
    post: {
      frais: ["0€ le 1er ordre du mois si ≤500€, puis 0,35% au-delà"],
      dca: ["❌ Pas de DCA automatique"],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ❌",
      ifu: ["✅ Oui"],
      liquidites: ["✅ Oui (Livret+)"],
      faibles: ["Clôture PEA 85€, pas de DCA, frais élevés hors Euronext (min 20€ + 30€)"],
      verdict: "Tu veux un PEA + PEA-PME chez un courtier 100% en ligne établi",
    },
  },
  {
    id: "xtb", nom: "XTB", code: "XTB", color: "#5C9EAD", emoji: "⚫",
    frais: { rank: 1, resume: "0% jusqu’à 100K€/mois", detail: "Puis 0,20% au-delà" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 3, resume: "Non disponible" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: false, jeune: false },
    ifu: { rank: 1, resume: "Oui" },
    liquidites: { rank: 1, resume: "Oui" },
    pointFaible: "Pas de DCA, transfert PEA entrant impossible",
    post: {
      frais: ["0% de commission jusqu’à 100K€/mois de volume, puis 0,20% au-delà"],
      dca: ["❌ Pas de DCA automatique"],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ❌ / PEA Jeune ❌",
      ifu: ["✅ Oui"],
      liquidites: ["✅ Oui"],
      faibles: ["Pas de DCA, transfert PEA entrant impossible"],
      verdict: "Tu passes moins de 100K€/mois et veux 0% de commission",
    },
  },
  {
    id: "caidf", nom: "CA Île-de-France", code: "CA", color: "#B08968", emoji: "🟠",
    frais: { rank: 3, resume: "Intégral 0,12-0,48%", detail: "Abonnement 96€/an si <12 ordres" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 3, resume: "Non disponible" },
    garde: { rank: 2, resume: "0,20%/sem. + 2,50€/ligne", detail: "Exonérés avec InvestStore Intégral" },
    pea: { pea: true, pme: true, jeune: true },
    ifu: { rank: 1, resume: "Oui" },
    liquidites: { rank: 1, resume: "Oui", detail: "Livret A, LDDS, LEP" },
    pointFaible: "Abonnement 96€/an si <12 ordres, transfert PEA sortant 15€/ligne (max 150€)",
    post: {
      frais: ["Intégral → 0,48% ≤500€ / 0,18% de 500€ à 1000€ / 0,12% au-delà", "⚡ Abonnement 96€/an si <12 ordres/an"],
      dca: ["❌ Pas de DCA automatique"],
      garde: ["⚠️ 0,20%/semestre + 2,50€/ligne/semestre", "Exonérés avec InvestStore Intégral"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ✅",
      ifu: ["✅ Oui"],
      liquidites: ["✅ Oui (Livret A, LDDS, LEP)"],
      faibles: ["Abonnement 96€/an si <12 ordres, droits de garde si inactif, transfert PEA sortant 15€/ligne (max 150€)"],
      verdict: "Tu veux un conseiller en agence et un compte bancaire classique",
    },
  },
  {
    id: "bd", nom: "Bourse Direct", code: "BD", color: "#C98B72", emoji: "🟤",
    frais: { rank: 2, resume: "Palier dès 0,99€", detail: "Jusqu’à 0,09% au-delà de 4 400€" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 3, resume: "Non disponible" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: true, jeune: true },
    ifu: { rank: 1, resume: "Oui" },
    liquidites: { rank: 2, resume: "Non rémunérées" },
    pointFaible: "Pas de DCA, liquidités non rémunérées, tarification par paliers",
    post: {
      frais: ["0,99€ ≤500€ / 1,90€ 500-1000€ / 2,90€ 1000-2000€", "⚡ 3,80€ 2000-4400€ / 0,09% au-delà de 4 400€"],
      dca: ["❌ Pas de DCA automatique"],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ✅",
      ifu: ["✅ Oui"],
      liquidites: ["❌ Non rémunérées"],
      faibles: ["Pas de DCA, liquidités non rémunérées, tarification par paliers"],
      verdict: "Tu fais des ordres ponctuels et veux un tarif par palier transparent",
    },
  },
  {
    id: "saxo", nom: "Saxo Bank", code: "SX", color: "#AAB4CC", emoji: "⚪",
    frais: { rank: 1, resume: "Dès 2€", detail: "0€ sur 70 actions UE jusqu’au 31/12/2026" },
    boursomarkets: { rank: 2, resume: "Non disponible" },
    dca: { rank: 2, resume: "CTO uniquement (PEPS)", detail: "0€ ETF & fonds, mensuel — pas sur PEA" },
    garde: { rank: 1, resume: "0€" },
    pea: { pea: true, pme: true, jeune: true },
    ifu: { rank: 1, resume: "Oui" },
    liquidites: { rank: 1, resume: "Oui" },
    pointFaible: "DCA pas sur PEA, tarif minimum 2€/ordre",
    post: {
      frais: ["À partir de 2€, plafonné à 0,5% sur PEA", "⚡ Promo → 0€ sur 70 actions UE (jusqu’au 31/12/2026)"],
      dca: ["❌ Sur PEA", "✅ CTO — PEPS 0€, ETF & fonds, mensuel"],
      garde: ["0€"],
      pea: "PEA ✅ / PEA-PME ✅ / PEA Jeune ✅",
      ifu: ["✅ Oui"],
      liquidites: ["✅ Oui"],
      faibles: ["DCA pas sur PEA, tarif minimum 2€/ordre"],
      verdict: "Tu veux des frais dégressifs dès 2€ avec un DCA CTO en option",
    },
  },
];

const ROWS = [
  { key: "frais", icon: "💰", label: "Frais (PEA)" },
  { key: "boursomarkets", icon: "🛒", label: "Boursomarkets" },
  { key: "dca", icon: "📈", label: "DCA / invest. programmé" },
  { key: "garde", icon: "🛡️", label: "Frais de garde" },
  { key: "ifu", icon: "📄", label: "IFU" },
  { key: "liquidites", icon: "💵", label: "Liquidités rémunérées" },
];

/* Liste des duels de la série — passe "done" à true au fil des publications */
const DUELS = [
  { a: "tr", b: "bourso", done: true },
  { a: "tr", b: "xtb", done: true },
  { a: "tr", b: "fortuneo", done: true },
  { a: "tr", b: "ibkr", done: true },
  { a: "bourso", b: "ibkr", done: true },
  { a: "bourso", b: "fortuneo", done: false },
  { a: "bourso", b: "xtb", done: false },
  { a: "ibkr", b: "fortuneo", done: false },
  { a: "ibkr", b: "xtb", done: false },
  { a: "fortuneo", b: "xtb", done: false },
  { a: "tr", b: "caidf", done: false },
  { a: "tr", b: "bd", done: false },
  { a: "tr", b: "saxo", done: false },
  { a: "bourso", b: "caidf", done: false },
  { a: "bourso", b: "bd", done: false },
  { a: "bourso", b: "saxo", done: false },
  { a: "ibkr", b: "caidf", done: false },
  { a: "ibkr", b: "bd", done: false },
  { a: "ibkr", b: "saxo", done: false },
  { a: "fortuneo", b: "caidf", done: false },
  { a: "fortuneo", b: "bd", done: false },
  { a: "fortuneo", b: "saxo", done: false },
  { a: "xtb", b: "caidf", done: false },
  { a: "xtb", b: "bd", done: false },
  { a: "xtb", b: "saxo", done: false },
  { a: "caidf", b: "bd", done: false },
  { a: "caidf", b: "saxo", done: false },
  { a: "bd", b: "saxo", done: false },
];

const byId = (id) => BROKERS.find((b) => b.id === id);
const MAX_SELECT = 3;

function buildTweet(selected) {
  if (selected.length !== 2) {
    return selected.length < 2
      ? ""
      : "Ce format de post est pensé pour un duel (2 courtiers).\nDésélectionne-en un pour générer le texte.";
  }
  const [b1, b2] = selected.map(byId);

  const section = (icon, title, b1Lines, b2Lines) => {
    const rows = [icon + " " + title, ""];
    rows.push(b1.emoji + " " + b1.nom + " → " + b1Lines[0]);
    b1Lines.slice(1).forEach((l) => rows.push(l));
    rows.push(b2.emoji + " " + b2.nom + " → " + b2Lines[0]);
    b2Lines.slice(1).forEach((l) => rows.push(l));
    return rows.join("\n");
  };

  const blocks = [
    b1.emoji + " " + b1.nom + " 🆚 " + b2.emoji + " " + b2.nom,
    "Lequel choisir pour ton PEA en 2026 ?\nOn décortique les deux 👇",
    section("💰", "FRAIS DE COURTAGE PEA", b1.post.frais, b2.post.frais),
    section("📈", "DCA AUTOMATIQUE", b1.post.dca, b2.post.dca),
    section("🛡️", "FRAIS DE GARDE", b1.post.garde, b2.post.garde),
    "🌱 PEA / PEA-PME\n\n" + b1.emoji + " " + b1.nom + " → " + b1.post.pea + "\n" + b2.emoji + " " + b2.nom + " → " + b2.post.pea,
    section("📄", "IFU", b1.post.ifu, b2.post.ifu),
    section("💵", "LIQUIDITÉS RÉMUNÉRÉES", b1.post.liquidites, b2.post.liquidites),
    section("⚠️", "POINTS FAIBLES", b1.post.faibles, b2.post.faibles),
    "🎯 VERDICT FINAL\n\n" + b1.post.verdict + " → " + b1.nom + " " + b1.emoji + "\n" + b2.post.verdict + " → " + b2.nom + " " + b2.emoji,
    "Et toi, t’es chez lequel ?\n" + b1.emoji + " " + b1.nom + "\n" + b2.emoji + " " + b2.nom + "\n🔴 Ni l’un ni l’autre\n\nDis-moi en commentaire 👇",
    "⚠️ Pas un conseil en investissement.",
  ];

  return blocks.join("\n\n");
}

function rankRow(row, brokers) {
  const ranks = brokers.map((b) => b[row.key].rank).filter((r) => r !== undefined);
  return ranks.length ? Math.min(...ranks) : null;
}

const fmtDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date());

function PeaPill({ val, label }) {
  const cls = val === null ? "nc" : val ? "yes" : "no";
  const mark = val === null ? "?" : val ? "✓" : "✕";
  return <span className={"pea-pill " + cls}>{mark} {label}</span>;
}

function ComparisonCard({ selected }) {
  if (selected.length < 2) {
    return (
      <div className="card">
        <div className="empty-state">Sélectionne au moins 2 courtiers pour générer le comparatif.</div>
      </div>
    );
  }
  const brokers = selected.map(byId);
  const n = brokers.length;
  const cheapest = [...brokers].sort((x, y) => x.frais.rank - y.frais.rank)[0];
  const gridStyle = { gridTemplateColumns: `repeat(${n}, 1fr)` };

  return (
    <div className="card">
      <div className="eyebrow">
        <span>Comparatif courtiers · 2026</span>
        <span className="handle">{fmtDate}</span>
      </div>
      <h1 className="title">
        {brokers.map((b, i) => (
          <React.Fragment key={b.id}>
            {i > 0 && " vs "}
            <em>{b.nom}</em>
          </React.Fragment>
        ))}
      </h1>
      <p className="subtitle">PEA, frais &amp; investissement programmé — vue synthétique</p>

      <div className="head-row" style={gridStyle}>
        {brokers.map((b) => (
          <div className="head-cell" key={b.id}>
            <div className="badge" style={{ background: b.color }}>{b.code}</div>
            <div className="head-name">{b.emoji} {b.nom}</div>
          </div>
        ))}
      </div>

      {ROWS.map((row) => {
        const best = rankRow(row, brokers);
        return (
          <div className="row" key={row.key}>
            <div className="row-label">{row.icon} {row.label}</div>
            <div className="cells" style={gridStyle}>
              {brokers.map((b) => {
                const c = b[row.key];
                const isBest = best !== null && c.rank === best;
                return (
                  <div className={"cell" + (isBest ? " best" : "")} key={b.id}>
                    <div className="resume">{c.resume}</div>
                    {c.detail && <div className="detail">{c.detail}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="row">
        <div className="row-label">🌱 PEA / PEA-PME / PEA Jeune</div>
        <div className="cells" style={gridStyle}>
          {brokers.map((b) => (
            <div className="pea-pills" key={b.id}>
              <PeaPill val={b.pea.pea} label="PEA" />
              <PeaPill val={b.pea.pme} label="PME" />
              <PeaPill val={b.pea.jeune} label="Jeune" />
            </div>
          ))}
        </div>
      </div>

      <div className="row">
        <div className="row-label">⚠️ Point faible</div>
        <div className="cells" style={gridStyle}>
          {brokers.map((b) => (
            <div className="weak-cell" key={b.id}>{b.pointFaible}</div>
          ))}
        </div>
      </div>

      <div className="synth">
        <div className="label">En bref</div>
        <div className="line">
          💰 Frais les plus bas : <strong>{cheapest.nom}</strong> — {cheapest.frais.resume}
        </div>
      </div>

      <div className="footer">
        <span className="disclaimer">
          Données indicatives arrêtées au {fmtDate}. Vérifie les tarifs avant publication — ceci ne constitue pas un conseil en investissement.
        </span>
        <span className="datestamp">📊 Éducation financière</span>
      </div>
    </div>
  );
}

export default function BrokerComparator() {
  const [selected, setSelected] = useState(["tr", "bourso"]);
  const [tweet, setTweet] = useState(() => buildTweet(["tr", "bourso"]));
  const [copied, setCopied] = useState(false);
  const editedRef = useRef(false);

  useEffect(() => {
    if (!editedRef.current) setTweet(buildTweet(selected));
  }, [selected]);

  function selectDuel(d) {
    editedRef.current = false;
    setSelected([d.a, d.b]);
  }

  function toggleBroker(id) {
    editedRef.current = false;
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, id];
    });
  }

  async function copyTweet() {
    try {
      await navigator.clipboard.writeText(tweet);
    } catch (e) {
      /* clipboard API unavailable — user can select & copy manually */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const doneCount = DUELS.filter((d) => d.done).length;

  return (
    <div className="wrap">
      <style>{CSS}</style>

      <div className="app-title">
        <h1>Générateur de comparatif courtiers</h1>
        <p>Choisis un duel de la série, ou coche 2–3 courtiers à la main. La carte se génère automatiquement, prête à capturer.</p>
      </div>

      <div className="panel">
        <h2>Prochain duel de la série</h2>
        <p className="hint">Les duels déjà publiés restent cliquables si tu veux régénérer un visuel.</p>
        <div className="duels-grid">
          {DUELS.map((d, i) => {
            const active = selected.length === 2 && selected.includes(d.a) && selected.includes(d.b);
            return (
              <button
                key={i}
                type="button"
                className={"duel-chip" + (d.done ? " pending" : "") + (active ? " active" : "")}
                title={d.done ? "Déjà publié — cliquer pour régénérer" : "À publier"}
                onClick={() => selectDuel(d)}
              >
                <span className="dot" />
                {byId(d.a).code} vs {byId(d.b).code}
              </button>
            );
          })}
        </div>
        <div className="progress-line">
          <span>{doneCount} / {DUELS.length} duels publiés</span>
          <span className="progress-track">
            <span className="progress-fill" style={{ width: (doneCount / DUELS.length) * 100 + "%" }} />
          </span>
        </div>
      </div>

      <div className="panel">
        <h2>Sélection manuelle</h2>
        <p className="hint">2 ou 3 courtiers maximum — utile pour un comparatif hors-série.</p>
        <div className="broker-select">
          {BROKERS.map((b) => {
            const checked = selected.includes(b.id);
            const disabled = !checked && selected.length >= MAX_SELECT;
            return (
              <div className="broker-pill" key={b.id}>
                <input
                  type="checkbox"
                  id={"chk-" + b.id}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleBroker(b.id)}
                />
                <label htmlFor={"chk-" + b.id}>
                  <span className="swatch" style={{ background: b.color }} />
                  {b.nom}
                </label>
              </div>
            );
          })}
        </div>
        {selected.length < 2 && (
          <div className="select-warning show">Sélectionne au moins 2 courtiers pour générer la carte.</div>
        )}
      </div>

      <div className="stage">
        <ComparisonCard selected={selected} />
      </div>

      <div className="panel">
        <h2>Post X (format duel)</h2>
        <p className="hint">Reproduit le squelette de la série — fonctionne pour un duel de 2 courtiers. Modifiable avant publication.</p>
        <textarea
          id="tweet"
          spellCheck={false}
          value={tweet}
          onChange={(e) => {
            editedRef.current = true;
            setTweet(e.target.value);
          }}
        />
        <div className="tweet-actions">
          <button className="copy" type="button" onClick={copyTweet}>Copier le tweet</button>
          <span className={"copy-msg" + (copied ? " show" : "")}>Copié ✓</span>
          <span className="char-count">{tweet.length} caractères</span>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   Identité : bleu nuit + or, thème unique et assumé pour ce
   compte X — pas de variante claire, c'est un choix de marque.
   ====================================================== */
const CSS = `
:root{
  --navy-950:#060a1c; --navy-900:#0b1230; --navy-850:#0e1638; --navy-800:#131c42;
  --navy-700:#1c2650; --navy-650:#263061;
  --ink-050:#f4f6ff; --ink-200:#c3cae8; --ink-400:#8b96c4; --ink-500:#6b76a3;
  --gold-300:#eecb85; --gold-400:#d9b45c; --gold-600:#a9822f;
  --good:#59d99a; --good-bg:rgba(89,217,154,.14); --good-line:rgba(89,217,154,.38);
  --warn:#e0b559; --warn-bg:rgba(224,181,89,.12);
  --rust:#d68f6c; --rust-bg:rgba(214,143,108,.10);
  --shadow:0 30px 60px -20px rgba(0,0,0,.65);
  --serif: ui-serif, "Iowan Old Style", Georgia, "Times New Roman", serif;
  --sans: ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
*{box-sizing:border-box;}
.wrap{width:100%;max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:28px;
  padding:28px 16px 64px;background:radial-gradient(ellipse 900px 500px at 50% -10%,#16204d 0%,transparent 60%),var(--navy-950);
  color:var(--ink-050);font-family:var(--sans);}
.panel{background:var(--navy-900);border:1px solid var(--navy-700);border-radius:16px;padding:20px 22px;}
.panel h2{margin:0 0 4px;font-family:var(--serif);font-size:1.15rem;font-weight:600;color:var(--gold-300);}
.panel p.hint{margin:0 0 16px;font-size:.86rem;color:var(--ink-400);line-height:1.5;}
.app-title{text-align:center;}
.app-title h1{font-family:var(--serif);font-size:1.5rem;margin:0 0 6px;color:var(--ink-050);}
.app-title p{margin:0;color:var(--ink-400);font-size:.92rem;}
.duels-grid{display:flex;flex-wrap:wrap;gap:8px;}
.duel-chip{appearance:none;border:1px solid var(--navy-650);background:var(--navy-850);color:var(--ink-200);
  font-family:var(--sans);font-size:.82rem;padding:7px 12px;border-radius:999px;cursor:pointer;
  display:flex;align-items:center;gap:6px;transition:border-color .15s,background .15s;}
.duel-chip:hover{border-color:var(--gold-600);}
.duel-chip.active{background:var(--gold-400);border-color:var(--gold-400);color:var(--navy-950);font-weight:600;}
.duel-chip .dot{width:6px;height:6px;border-radius:50%;background:var(--good);flex:none;}
.duel-chip.pending .dot{background:var(--ink-500);}
.duel-chip.active .dot{background:var(--navy-950);}
.progress-line{margin-top:12px;font-size:.78rem;color:var(--ink-500);display:flex;align-items:center;gap:8px;}
.progress-track{flex:1;height:4px;border-radius:2px;background:var(--navy-700);overflow:hidden;}
.progress-fill{height:100%;background:var(--gold-400);}
.broker-select{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;}
.broker-pill{position:relative;}
.broker-pill input{position:absolute;opacity:0;inset:0;cursor:pointer;}
.broker-pill label{display:flex;align-items:center;gap:7px;border:1px solid var(--navy-650);background:var(--navy-850);
  color:var(--ink-200);border-radius:10px;padding:8px 12px;font-size:.86rem;cursor:pointer;transition:.15s;}
.broker-pill input:checked + label{border-color:var(--gold-400);background:rgba(217,180,92,.12);color:var(--gold-300);}
.broker-pill input:disabled + label{opacity:.35;cursor:not-allowed;}
.swatch{width:9px;height:9px;border-radius:50%;flex:none;}
.select-warning{margin-top:10px;font-size:.82rem;color:var(--warn);}
.stage{display:flex;justify-content:center;}
.card{container-type:inline-size;width:min(100%,580px);
  background:radial-gradient(ellipse 500px 260px at 15% 0%,rgba(217,180,92,.10),transparent 60%),
  linear-gradient(180deg,var(--navy-850) 0%,var(--navy-900) 100%);
  border:1px solid var(--gold-600);border-radius:22px;box-shadow:var(--shadow);
  padding:6.2cqw 6cqw 5.4cqw;position:relative;overflow:hidden;}
.eyebrow{display:flex;align-items:center;justify-content:space-between;font-size:2.6cqw;letter-spacing:.14em;
  text-transform:uppercase;color:var(--gold-400);margin-bottom:3.4cqw;}
.eyebrow .handle{color:var(--ink-400);letter-spacing:.08em;}
.title{font-family:var(--serif);font-weight:600;font-size:6.6cqw;line-height:1.14;text-wrap:balance;color:var(--ink-050);margin:0 0 1cqw;}
.title em{color:var(--gold-300);font-style:normal;}
.subtitle{font-size:2.9cqw;color:var(--ink-400);margin:0 0 5cqw;}
.head-row{display:grid;gap:2.4cqw;margin-bottom:3.6cqw;padding-bottom:3.6cqw;border-bottom:1px solid var(--navy-700);}
.head-cell{display:flex;flex-direction:column;align-items:center;gap:1.6cqw;text-align:center;}
.badge{width:11cqw;height:11cqw;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-family:var(--serif);font-weight:700;font-size:3.6cqw;color:var(--navy-950);box-shadow:0 4px 14px -4px rgba(0,0,0,.5);}
.head-name{font-family:var(--serif);font-weight:600;font-size:3.5cqw;color:var(--ink-050);line-height:1.2;}
.row{display:grid;gap:2.4cqw;padding:2.8cqw 0;border-bottom:1px solid var(--navy-700);}
.row:last-of-type{border-bottom:none;}
.row-label{display:flex;align-items:center;gap:1.4cqw;font-size:2.5cqw;letter-spacing:.08em;text-transform:uppercase;
  color:var(--gold-400);font-weight:600;margin-bottom:.6cqw;}
.cells{display:grid;gap:2.4cqw;}
.cell{border-radius:10px;padding:2cqw 2.2cqw;background:var(--navy-800);border:1px solid transparent;font-variant-numeric:tabular-nums;}
.cell.best{background:var(--good-bg);border-color:var(--good-line);}
.cell .resume{font-size:3.05cqw;font-weight:700;color:var(--ink-050);line-height:1.25;display:flex;align-items:center;gap:1.2cqw;flex-wrap:wrap;}
.cell.best .resume{color:var(--good);}
.cell .detail{font-size:2.35cqw;color:var(--ink-400);margin-top:.8cqw;line-height:1.35;}
.cell.best .detail{color:#a9e8c6;}
.pea-pills{display:flex;gap:1.6cqw;flex-wrap:wrap;}
.pea-pill{font-size:2.25cqw;padding:1.1cqw 2cqw;border-radius:999px;background:var(--navy-800);color:var(--ink-400);
  border:1px solid var(--navy-650);display:flex;align-items:center;gap:.8cqw;font-weight:600;}
.pea-pill.yes{color:var(--good);border-color:var(--good-line);background:var(--good-bg);}
.pea-pill.no{color:var(--ink-500);}
.pea-pill.nc{color:var(--warn);border-color:rgba(224,181,89,.3);background:var(--warn-bg);}
.weak-cell{border-radius:10px;padding:2.1cqw 2.3cqw;background:var(--rust-bg);border-left:3px solid var(--rust);
  font-size:2.4cqw;color:#e8c4ae;line-height:1.4;}
.synth{margin-top:4.4cqw;padding-top:4cqw;border-top:1px solid var(--gold-600);display:flex;flex-direction:column;gap:1.2cqw;}
.synth .label{font-size:2.4cqw;letter-spacing:.1em;text-transform:uppercase;color:var(--gold-400);font-weight:600;}
.synth .line{font-size:3.05cqw;color:var(--ink-050);line-height:1.4;}
.synth .line strong{color:var(--gold-300);}
.footer{margin-top:4.4cqw;display:flex;justify-content:space-between;align-items:flex-end;font-size:2.15cqw;color:var(--ink-500);gap:2cqw;}
.footer .disclaimer{max-width:70%;line-height:1.4;}
.footer .datestamp{white-space:nowrap;color:var(--ink-400);}
.empty-state{padding:12cqw 4cqw;text-align:center;color:var(--ink-400);font-size:3cqw;}
textarea#tweet{width:100%;min-height:170px;resize:vertical;background:var(--navy-850);border:1px solid var(--navy-650);
  border-radius:12px;color:var(--ink-050);font-family:var(--sans);font-size:.92rem;line-height:1.55;padding:14px 16px;}
.tweet-actions{display:flex;align-items:center;gap:10px;margin-top:12px;}
button.copy{appearance:none;border:none;border-radius:10px;background:var(--gold-400);color:var(--navy-950);font-weight:700;
  font-size:.86rem;padding:9px 16px;cursor:pointer;font-family:var(--sans);}
button.copy:hover{background:var(--gold-300);}
.copy-msg{font-size:.82rem;color:var(--good);opacity:0;transition:opacity .2s;}
.copy-msg.show{opacity:1;}
.char-count{margin-left:auto;font-size:.78rem;color:var(--ink-500);font-variant-numeric:tabular-nums;}
:focus-visible{outline:2px solid var(--gold-300);outline-offset:2px;}
@media (max-width:480px){ .footer .disclaimer{max-width:100%;} .footer{flex-direction:column;align-items:flex-start;gap:4px;} }
`;
