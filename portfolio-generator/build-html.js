const fs = require("fs");
const path = require("path");

const dir = __dirname;
const bundle = fs.readFileSync(path.join(dir, "dist/bundle.js"), "utf8");
const frauncesB64 = fs.readFileSync(path.join(dir, "fonts/fraunces.woff2")).toString("base64");
const plexB64 = fs.readFileSync(path.join(dir, "fonts/plexmono.woff2")).toString("base64");

const css = `
:root {
  --bg: #0a0d16;
  --bg-glow: #0e1326;
  --surface: #111830;
  --surface-raised: #161f3d;
  --surface-hover: #1c2748;
  --border: #263258;
  --border-soft: #1c2748;
  --ink: #f2f4fa;
  --ink-dim: #9aa4c4;
  --ink-faint: #66709a;
  --gold: #d9b26b;
  --gold-bright: #f0cd8e;
  --gold-dim: rgba(217, 178, 107, 0.14);
  --positive: #1f9d70;
  --negative: #e2685f;
  --font-display: "Fraunces", "Iowan Old Style", Georgia, serif;
  --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", "Public Sans", Roboto, Helvetica, Arial, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  color-scheme: dark;
}

@font-face {
  font-family: "Fraunces";
  font-style: normal;
  font-weight: 500 700;
  font-display: swap;
  src: url(data:font/woff2;base64,${frauncesB64}) format("woff2");
}
@font-face {
  font-family: "IBM Plex Mono";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url(data:font/woff2;base64,${plexB64}) format("woff2");
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--bg);
  background-image:
    radial-gradient(1100px 520px at 12% -10%, rgba(217, 178, 107, 0.10), transparent 60%),
    radial-gradient(900px 480px at 110% 10%, rgba(59, 88, 160, 0.18), transparent 55%);
  background-attachment: fixed;
  color: var(--ink);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
h1, h2, h3 { font-family: var(--font-display); font-weight: 600; text-wrap: balance; margin: 0; }
button { font-family: inherit; }
:focus-visible { outline: 2px solid var(--gold-bright); outline-offset: 2px; }

.app-shell {
  max-width: 1080px;
  margin: 0 auto;
  padding: 28px 20px 64px;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 22px;
  margin-bottom: 26px;
  border-bottom: 1px solid var(--border-soft);
}
.brand { display: flex; align-items: center; gap: 12px; }
.brand-mark {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--gold-dim);
  color: var(--gold);
  border: 1px solid rgba(217, 178, 107, 0.35);
  flex: none;
}
.brand-name { font-family: var(--font-display); font-size: 1.05rem; font-weight: 600; letter-spacing: 0.01em; }
.brand-tag { font-size: 0.8rem; color: var(--ink-dim); margin-top: 2px; }
.header-count {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  padding: 6px 12px;
  border-radius: 999px;
}

.app-main {
  display: grid;
  grid-template-columns: minmax(0, 460px) minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}
@media (max-width: 900px) {
  .app-main { grid-template-columns: 1fr; }
}

.tweet-col { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 20px; }
@media (max-width: 900px) { .tweet-col { position: static; } }

.tweet-card {
  background: linear-gradient(180deg, var(--surface-raised), var(--surface));
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 22px 22px 16px;
  box-shadow: 0 24px 60px -30px rgba(0, 0, 0, 0.7), 0 1px 0 rgba(255,255,255,0.02) inset;
}
.tweet-head { display: flex; align-items: center; gap: 11px; margin-bottom: 14px; }
.tweet-avatar {
  width: 42px; height: 42px; border-radius: 50%;
  display: grid; place-items: center;
  background: radial-gradient(circle at 30% 25%, #2a3868, #10162a);
  border: 1.5px solid var(--gold);
  color: var(--gold-bright);
  flex: none;
}
.tweet-identity { display: flex; flex-direction: column; line-height: 1.3; min-width: 0; }
.tweet-name { font-weight: 700; font-size: 0.95rem; color: var(--ink); }
.tweet-badge { color: var(--gold); font-size: 0.8rem; }
.tweet-handle { font-size: 0.82rem; color: var(--ink-faint); }

.tweet-body { display: flex; flex-direction: column; gap: 12px; }
.tweet-body p {
  margin: 0;
  font-size: 0.94rem;
  line-height: 1.55;
  white-space: pre-wrap;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.tweet-body .tweet-title {
  font-family: var(--font-display);
  font-size: 1.12rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--gold-bright);
}

.tweet-footer {
  display: flex;
  gap: 22px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--border-soft);
  color: var(--ink-faint);
  font-size: 0.82rem;
}
.tweet-icon { display: inline-flex; align-items: center; gap: 5px; }
.tweet-icon b { color: var(--ink-dim); font-weight: 600; font-variant-numeric: tabular-nums; font-family: var(--font-mono); }

.tweet-actions { display: flex; }
.clipboard-fallback { position: absolute; left: -9999px; display: none; }

.btn {
  border: none;
  cursor: pointer;
  border-radius: 12px;
  padding: 12px 18px;
  font-size: 0.92rem;
  font-weight: 600;
  transition: transform 0.12s ease, filter 0.12s ease, background 0.12s ease;
}
.btn:active { transform: translateY(1px); }
@media (prefers-reduced-motion: reduce) { .btn { transition: none; } .btn:active { transform: none; } }

.btn-secondary {
  background: var(--surface-hover);
  color: var(--ink);
  border: 1px solid var(--border);
  width: 100%;
}
.btn-secondary:hover { filter: brightness(1.12); }

.btn-primary {
  background: linear-gradient(180deg, var(--gold-bright), var(--gold));
  color: #241a06;
  width: 100%;
  box-shadow: 0 10px 26px -12px rgba(217, 178, 107, 0.55);
  font-size: 0.98rem;
}
.btn-primary:hover { filter: brightness(1.06); }

.control-col { display: flex; flex-direction: column; gap: 16px; }

.panel {
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: 16px;
  padding: 18px 20px;
}
.panel-muted { background: transparent; border-style: dashed; }
.panel-title {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 14px;
}

.riskgauge-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; gap: 10px; }
.riskgauge-label { font-size: 0.85rem; color: var(--ink-dim); }
.riskgauge-value { font-family: var(--font-mono); font-size: 0.85rem; color: var(--gold-bright); font-variant-numeric: tabular-nums; }
.riskgauge-track {
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(90deg, #2a8f66, #c9a23a, #d9603f);
  opacity: 0.9;
}
.riskgauge-fill { display: none; }
.riskgauge-marker {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--ink);
  border: 3px solid var(--bg);
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 1px var(--gold);
}

.alloc-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.alloc-row {
  display: grid;
  grid-template-columns: 10px 1fr auto auto;
  align-items: center;
  column-gap: 10px;
  row-gap: 6px;
}
.alloc-swatch { width: 10px; height: 10px; border-radius: 50%; }
.alloc-name { font-size: 0.87rem; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.alloc-cat { font-size: 0.72rem; color: var(--ink-faint); grid-column: 2; margin-top: -4px; }
.alloc-pct {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--gold-bright);
  font-variant-numeric: tabular-nums;
  justify-self: end;
}
.alloc-bar-track {
  grid-column: 1 / -1;
  height: 5px;
  border-radius: 999px;
  background: var(--border-soft);
  overflow: hidden;
}
.alloc-bar-fill { height: 100%; border-radius: 999px; }

.chart-title-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.chart-title { font-family: var(--font-display); font-size: 0.95rem; font-weight: 600; color: var(--ink); }
.chart-legend { font-size: 0.74rem; color: var(--ink-faint); display: inline-flex; align-items: center; gap: 6px; }
.chart-legend .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-left: 8px; }
.chart-legend .dot:first-child { margin-left: 0; }

.chart-area { position: relative; height: 168px; display: flex; align-items: stretch; padding: 0 4px; }
.chart-baseline { position: absolute; left: 0; right: 0; height: 1px; background: var(--border); }
.bar-col {
  position: relative;
  flex: 1;
  min-width: 0;
  cursor: default;
  border-radius: 6px;
}
.bar-col:hover, .bar-col:focus-visible { background: var(--gold-dim); }
.bar-fill {
  position: absolute;
  left: 22%;
  right: 22%;
  border-radius: 3px;
  min-height: 2px;
}
.bar-fill.pos { background: var(--positive); }
.bar-fill.neg { background: var(--negative); }
.bar-value {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.66rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.bar-value.pos { color: var(--positive); }
.bar-value.neg { color: var(--negative); }
.bar-year {
  position: absolute;
  bottom: -22px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--ink-faint);
}

.fine-print { font-size: 0.78rem; line-height: 1.55; color: var(--ink-faint); margin: 0; }

@media (max-width: 460px) {
  .app-shell { padding: 18px 14px 48px; }
  .tweet-card { padding: 18px 16px 14px; }
}
`;

const html = `<title>Générateur de portefeuilles · Patrimoine &amp; Compagnie</title>
<style>${css}</style>
<div id="root"></div>
<script>${bundle}</script>
`;

fs.mkdirSync(path.join(dir, "dist"), { recursive: true });
fs.writeFileSync(path.join(dir, "dist/index.html"), html);
console.log("Wrote dist/index.html:", (html.length / 1024).toFixed(1), "KB");
