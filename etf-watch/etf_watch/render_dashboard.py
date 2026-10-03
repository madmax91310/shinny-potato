"""Render the ETF Watch HTML dashboard from a run's JSON export.

Usage:
    python -m etf_watch.main --format json > run.json
    python -m etf_watch.render_dashboard run.json > dashboard.html
    # or, reading from stdin:
    python -m etf_watch.main --format json | python -m etf_watch.render_dashboard - > dashboard.html

The output is a self-contained HTML file meant to be published as a
Claude Artifact (or opened directly in a browser). It reuses the same
visual design as the original dashboard; only the data-driven regions
(meta row, sample/live notice, launch cards, issuer chips) are rebuilt
from the JSON payload -- see DASHBOARD_TEMPLATE below.
"""

from __future__ import annotations

import html
import json
import sys
from datetime import datetime, timezone

from . import config
from .models import ETFProduct
from .summarize import ASSET_CLASS_LABELS, build_tweet

ASSET_CLASS_LABELS_FR = ASSET_CLASS_LABELS


def _esc(value: object) -> str:
    return html.escape(str(value)) if value is not None else ""


def _field(label: str, value: str | None, mono: bool = False) -> str:
    cls = "value mono" if mono else "value"
    shown = _esc(value) if value else "—"
    return f'<div class="field"><span class="label">{_esc(label)}</span><span class="{cls}">{shown}</span></div>'


def _card_html(row: dict) -> str:
    product = ETFProduct(
        isin=row.get("isin", ""),
        name=row.get("name", "Unnamed ETF"),
        issuer=row.get("issuer", "Unknown"),
        source_name=row.get("source_name", ""),
        source_url=row.get("source_url", ""),
        ticker=row.get("ticker"),
        index=row.get("index_tracked"),
        ter=row.get("ter"),
        asset_class=row.get("asset_class"),
        region=row.get("region"),
        launch_date=row.get("launch_date"),
        currency=row.get("currency"),
    )
    tweet_text = build_tweet(product)
    asset_class_label = ASSET_CLASS_LABELS_FR.get(product.asset_class or "", product.asset_class)

    fields = "".join([
        _field("Ticker", product.ticker, mono=True),
        _field("ISIN", product.isin, mono=True),
        _field("Indice", product.index),
        _field("TER", product.ter, mono=True),
        _field("Classe", asset_class_label),
        _field("Lancement", product.launch_date, mono=True),
    ])

    return f"""
    <article class="launch-card">
      <div class="card-top">
        <div>
          <p class="issuer-tag">{_esc(product.issuer)}</p>
          <h3 class="product-name">{_esc(product.name)}</h3>
        </div>
        <span class="new-badge">Nouveau</span>
      </div>
      <div class="field-grid">{fields}</div>
      <div class="tweet-box">
        <p class="tweet-label">Résumé prêt à publier</p>
        <p class="tweet-text">{_esc(tweet_text)}</p>
        <button class="copy-btn" type="button" data-copy="{_esc(tweet_text)}">Copier le texte</button>
      </div>
    </article>"""


def _empty_state_html() -> str:
    return """
    <div class="catalogue-note">Aucun nouveau lancement détecté lors de ce run. Le résumé
    réapparaîtra ici dès qu'un ISIN inédit sera trouvé par l'une des sources actives.</div>"""


def _issuer_chips_html(sources_ok: list[str], sources_failed: list[str]) -> str:
    chips = []
    for name, cfg in config.SOURCES.items():
        enabled = cfg.get("enabled", True)
        experimental = cfg.get("experimental", False)
        if not enabled:
            state, cls = "désactivé · expérimental" if experimental else "désactivé", "is-off"
        elif name in sources_ok:
            state, cls = "OK", ""
        elif name in sources_failed:
            state, cls = "injoignable", "is-off"
        else:
            state, cls = "non exécuté", "is-off"
        chips.append(
            f'<span class="chip {cls}"><span class="dot"></span>{_esc(cfg["issuer"])}'
            f'<span class="state">{_esc(state)}</span></span>'
        )
    return "\n      ".join(chips)


def render(payload: dict) -> str:
    new_launches = payload.get("new_launches", [])
    sources_ok = payload.get("sources_ok", [])
    sources_failed = payload.get("sources_failed", [])
    generated_at = payload.get("generated_at", datetime.now(timezone.utc).isoformat(timespec="seconds"))
    catalogue_size = payload.get("catalogue_size", 0)
    is_first_run = payload.get("is_first_run", False)

    cards_html = "".join(_card_html(r) for r in new_launches) or _empty_state_html()

    if is_first_run:
        notice = """
  <div class="notice">
    <span class="stamp">Ligne de base</span>
    <div>
      <p>Premier run réel effectué le """ + _esc(generated_at) + f""" : {catalogue_size} ETF enregistré(s)
      comme catalogue de référence. Aucune alerte n'est générée pour ce premier passage --
      les prochains runs ne signaleront que les ISIN réellement inédits.</p>
    </div>
  </div>"""
    else:
        notice = """
  <div class="notice notice-live">
    <span class="stamp">Données réelles</span>
    <div>
      <p>Généré à partir d'un run réel le """ + _esc(generated_at) + f""" ({len(sources_ok)} source(s) OK,
      {len(sources_failed)} indisponible(s) ce run-là).</p>
    </div>
  </div>"""

    meta_row = (
        f'<span>Dernier run&nbsp;: <strong>{_esc(generated_at)}</strong></span>'
        f'<span><strong class="mono">{len(sources_ok)}</strong>/{len(sources_ok) + len(sources_failed)} sources OK ce run</span>'
        f'<span><strong class="mono">{len(new_launches)}</strong> nouveaux lancements</span>'
        f'<span>Catalogue&nbsp;: <strong class="mono">{catalogue_size}</strong> ETF suivis</span>'
    )

    issuer_chips = _issuer_chips_html(sources_ok, sources_failed)

    html_out = DASHBOARD_TEMPLATE
    html_out = html_out.replace("__META_ROW__", meta_row)
    html_out = html_out.replace("__NOTICE__", notice)
    html_out = html_out.replace("__LAUNCH_CARDS__", cards_html)
    html_out = html_out.replace("__LAUNCH_COUNT__", str(len(new_launches)))
    html_out = html_out.replace("__ISSUER_CHIPS__", issuer_chips)
    return html_out


DASHBOARD_TEMPLATE = r"""<title>ETF Watch Europe</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Libre+Franklin:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">

<style>
  :root {
    --bg: #eef1ec;
    --surface: #fbfcfa;
    --surface-2: #e2e7de;
    --text: #12171d;
    --text-muted: #5c6660;
    --line: #c9cec3;
    --accent: #1a7a56;
    --accent-ink: #f6fbf8;
    --accent-soft: #dcece3;
    --amber: #9c6f26;
    --amber-soft: #f1e3c6;
    --amber-ink: #2a1d05;
    --shadow: rgba(18, 23, 29, 0.08);
    --focus: #1a7a56;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #10151a;
      --surface: #171e24;
      --surface-2: #1f2830;
      --text: #eaefe9;
      --text-muted: #93a098;
      --line: #2b343b;
      --accent: #3fb98a;
      --accent-ink: #08130e;
      --accent-soft: #17342a;
      --amber: #d9a24a;
      --amber-soft: #382c14;
      --amber-ink: #f7e6bf;
      --shadow: rgba(0, 0, 0, 0.35);
      --focus: #3fb98a;
    }
  }

  :root[data-theme="dark"] {
    --bg: #10151a;
    --surface: #171e24;
    --surface-2: #1f2830;
    --text: #eaefe9;
    --text-muted: #93a098;
    --line: #2b343b;
    --accent: #3fb98a;
    --accent-ink: #08130e;
    --accent-soft: #17342a;
    --amber: #d9a24a;
    --amber-soft: #382c14;
    --amber-ink: #f7e6bf;
    --shadow: rgba(0, 0, 0, 0.35);
    --focus: #3fb98a;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: "Libre Franklin", system-ui, -apple-system, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
    line-height: 1.5;
  }

  ::selection { background: var(--accent-soft); color: var(--text); }

  a { color: var(--accent); }
  a:focus-visible, button:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }

  .mono {
    font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    font-variant-numeric: tabular-nums;
  }

  .wrap {
    max-width: 780px;
    margin: 0 auto;
    padding: 2.75rem 1.5rem 5rem;
  }

  header.masthead {
    border-bottom: 1px solid var(--line);
    padding-bottom: 1.5rem;
    margin-bottom: 1.75rem;
  }

  .eyebrow {
    font-family: "Libre Franklin", sans-serif;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
    margin: 0 0 0.6rem;
  }

  h1.title {
    font-family: "Fraunces", Georgia, serif;
    font-optical-sizing: auto;
    font-weight: 500;
    font-size: clamp(2.2rem, 5.5vw, 3rem);
    letter-spacing: -0.01em;
    margin: 0 0 0.55rem;
    text-wrap: balance;
  }

  .dek {
    font-size: 1rem;
    color: var(--text-muted);
    max-width: 60ch;
    margin: 0 0 1.1rem;
  }

  .meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.4rem;
    font-size: 0.82rem;
    color: var(--text-muted);
  }

  .meta-row strong { color: var(--text); font-weight: 600; }

  .notice {
    display: flex;
    gap: 0.85rem;
    align-items: flex-start;
    background: var(--amber-soft);
    border: 1px solid color-mix(in srgb, var(--amber) 35%, transparent);
    border-radius: 3px;
    padding: 0.9rem 1.05rem;
    margin-bottom: 2.1rem;
  }

  .notice.notice-live {
    background: var(--accent-soft);
    border-color: color-mix(in srgb, var(--accent) 35%, transparent);
  }

  .notice .stamp {
    flex: none;
    font-family: "Libre Franklin", sans-serif;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--amber-ink);
    background: transparent;
    border: 1.5px solid var(--amber);
    border-radius: 3px;
    padding: 0.28rem 0.5rem;
    transform: rotate(-3deg);
    white-space: nowrap;
  }

  .notice-live .stamp {
    color: var(--text);
    border-color: var(--accent);
  }

  .notice p {
    margin: 0;
    font-size: 0.87rem;
    color: var(--amber-ink);
  }

  .notice-live p { color: var(--text); }

  .notice p + p { margin-top: 0.35rem; }

  section { margin-bottom: 2.75rem; }

  h2.section-title {
    font-family: "Libre Franklin", sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin: 0 0 1rem;
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
  }

  h2.section-title .count {
    font-family: "IBM Plex Mono", monospace;
    color: var(--accent);
    font-weight: 600;
    text-transform: none;
    letter-spacing: 0;
  }

  .issuer-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.42rem;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0.4rem 0.75rem 0.4rem 0.6rem;
    font-size: 0.8rem;
  }

  .chip .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
    flex: none;
  }

  .chip.is-off .dot { background: var(--text-muted); opacity: 0.5; }
  .chip.is-experimental .dot { background: var(--amber); }

  .chip .state {
    color: var(--text-muted);
    font-size: 0.72rem;
  }

  .launch-card {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 1.35rem 1.4rem 1.3rem;
    box-shadow: 0 1px 2px var(--shadow);
    transition: border-color 0.15s ease, transform 0.15s ease;
  }

  .launch-card + .launch-card { margin-top: 1rem; }

  .launch-card:hover {
    border-color: color-mix(in srgb, var(--accent) 40%, var(--line));
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 0.65rem;
  }

  .issuer-tag {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--accent);
    margin: 0 0 0.3rem;
  }

  .product-name {
    font-family: "Fraunces", Georgia, serif;
    font-size: 1.22rem;
    font-weight: 500;
    margin: 0;
    text-wrap: balance;
  }

  .new-badge {
    flex: none;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    background: var(--accent);
    color: var(--accent-ink);
    padding: 0.28rem 0.55rem;
    border-radius: 3px;
    margin-top: 0.15rem;
  }

  .field-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.6rem;
    padding: 0.75rem 0 0.85rem;
    margin-bottom: 0.9rem;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .field .label {
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .field .value { font-size: 0.88rem; }
  .field .value.mono { font-size: 0.86rem; }

  .tweet-box {
    background: var(--surface-2);
    border-radius: 3px;
    padding: 0.85rem 1rem;
    position: relative;
  }

  .tweet-box .tweet-label {
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin: 0 0 0.5rem;
  }

  .tweet-text {
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.82rem;
    line-height: 1.55;
    white-space: pre-wrap;
    margin: 0 0 0.75rem;
    word-break: break-word;
  }

  .copy-btn {
    font-family: "Libre Franklin", sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--line);
    border-radius: 3px;
    padding: 0.4rem 0.7rem;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;
  }

  .copy-btn:hover { border-color: var(--accent); }
  .copy-btn[data-copied="true"] {
    background: var(--accent);
    color: var(--accent-ink);
    border-color: var(--accent);
  }

  .catalogue-note {
    border: 1px dashed var(--line);
    border-radius: 4px;
    padding: 1.1rem 1.25rem;
    color: var(--text-muted);
    font-size: 0.88rem;
  }

  .catalogue-note strong { color: var(--text); }

  footer {
    border-top: 1px solid var(--line);
    padding-top: 1.4rem;
    font-size: 0.8rem;
    color: var(--text-muted);
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.5rem 1.5rem;
  }

  footer .mono { color: var(--text-muted); }

  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; }
  }
</style>

<div class="wrap">

  <header class="masthead">
    <p class="eyebrow">Veille · ETF Europe</p>
    <h1 class="title">ETF Watch</h1>
    <p class="dek">Suivi des lancements d'ETF de Vanguard, iShares, Amundi, BNP Paribas Easy, SPDR et Invesco — résumés prêts à publier, générés à chaque exécution du script.</p>
    <div class="meta-row">__META_ROW__</div>
  </header>

  __NOTICE__

  <section aria-labelledby="launches-title">
    <h2 class="section-title" id="launches-title">Nouveaux lancements <span class="count">__LAUNCH_COUNT__</span></h2>
    __LAUNCH_CARDS__
  </section>

  <section aria-labelledby="issuers-title">
    <h2 class="section-title" id="issuers-title">Sources suivies</h2>
    <div class="issuer-strip">
      __ISSUER_CHIPS__
    </div>
  </section>

  <footer>
    <span>Généré par <span class="mono">etf_watch/render_dashboard.py</span> — dossier <span class="mono">etf-watch/</span></span>
    <span>Renvoyez un nouveau <span class="mono">--format json</span> pour mettre à jour cette page</span>
  </footer>

</div>

<script>
  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      function flash() {
        var original = "Copier le texte";
        btn.textContent = "Copié !";
        btn.setAttribute("data-copied", "true");
        setTimeout(function () {
          btn.textContent = original;
          btn.removeAttribute("data-copied");
        }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(flash).catch(function () {
          btn.textContent = "Sélectionnez le texte ci-dessus";
        });
      } else {
        btn.textContent = "Sélectionnez le texte ci-dessus";
      }
    });
  });
</script>
"""


def main(argv=None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    if not argv:
        print("Usage: python -m etf_watch.render_dashboard <run.json|->", file=sys.stderr)
        return 2

    source = argv[0]
    if source == "-":
        raw = sys.stdin.read()
    else:
        with open(source, encoding="utf-8") as f:
            raw = f.read()

    payload = json.loads(raw)
    print(render(payload))
    return 0


if __name__ == "__main__":
    sys.exit(main())
